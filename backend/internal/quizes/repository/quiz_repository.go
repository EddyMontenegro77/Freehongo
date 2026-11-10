package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"freehongo-api/internal/quizes/models"
	"time"
)

type QuizQueries struct {
	tx *sql.Tx
}

func NewQuizQueries(tx *sql.Tx) *QuizQueries { return &QuizQueries{tx: tx} }

type rowScanner interface {
	Scan(dest ...any) error
}

func (q *QuizQueries) ListAccessible(ctx context.Context, listID string, startedAt time.Time) (bool, error) {
	var ok bool
	err := q.tx.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM app.user_lists
			WHERE list_id = $1
			AND (deleted_at IS NULL OR deleted_at >= $2::timestamptz)
		)`, listID, startedAt.UTC()).Scan(&ok)
	return ok, err
}

func (q *QuizQueries) MissingListChars(ctx context.Context, listID string, chars []string) ([]string, error) {
	rows, err := q.tx.QueryContext(ctx, `
		SELECT t.u
		FROM unnest($2::text[]) AS t(u)
		WHERE NOT EXISTS (
			SELECT 1 FROM app.list_characters lc
			WHERE lc.list_id = $1::uuid AND lc.unicode = t.u
		)
	`, listID, chars)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	missing := make([]string, 0)
	for rows.Next() {
		var u string
		if err := rows.Scan(&u); err != nil {
			return nil, err
		}
		missing = append(missing, u)
	}
	return missing, rows.Err()
}

func (q *QuizQueries) OwnsQuizSession(ctx context.Context, quizSessionID, userID string) (bool, error) {
	var ok bool
	err := q.tx.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM app.quiz_sessions
			WHERE quiz_session_id = $1 AND user_id = $2
		)`, quizSessionID, userID).Scan(&ok)
	return ok, err
}

func (q *QuizQueries) SubmitQuizSession(ctx context.Context, userId string, req models.SubmitQuizRequest) (created bool, err error) {
	randomOrder := req.RandomOrder != nil && *req.RandomOrder

	res, err := q.tx.ExecContext(ctx, `
		INSERT INTO app.quiz_sessions (
			quiz_session_id, user_id, list_id, answer_type, character_quiz_type,
			started_at, finished_at, total_questions, random_order
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (quiz_session_id) DO NOTHING
	`, req.QuizSessionId, userId, req.ListId, req.AnswerType, req.CharacterQuizType,
		req.StartedAt.UTC(), req.FinishedAt.UTC(), len(req.Answers), randomOrder)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	if n == 0 {
		return false, nil
	}

	answerIDs, err := q.insertAnswers(ctx, req)
	if err != nil {
		return false, err
	}

	if req.AnswerType == string(models.AnswerStrokeWriting) {
		if err := q.insertWritingAttempts(ctx, req, answerIDs); err != nil {
			return false, err
		}
	}

	if err := q.upsertCharacterStats(ctx, userId, req); err != nil {
		return false, err
	}
	return true, nil
}

func (q *QuizQueries) insertAnswers(ctx context.Context, req models.SubmitQuizRequest) (map[string]int64, error) {
	n := len(req.Answers)
	unicodes := make([]string, n)
	times := make([]int32, n)
	correct := make([]bool, n)
	given := make([]*string, n)
	expected := make([]*string, n)
	confused := make([]*string, n)
	answeredAt := make([]*time.Time, n)

	for i, a := range req.Answers {
		unicodes[i] = a.Unicode
		times[i] = int32(a.ResponseTimeMs)
		correct[i] = a.IsCorrect != nil && *a.IsCorrect
		given[i] = a.GivenAnswer
		expected[i] = a.ExpectedAnswer
		confused[i] = a.ConfusedWith
		if a.AnsweredAt != nil {
			t := a.AnsweredAt.UTC()
			answeredAt[i] = &t
		}
	}

	rows, err := q.tx.QueryContext(ctx, `
		INSERT INTO app.quiz_answers (
			quiz_session_id, unicode, response_time_ms, is_correct,
			given_answer, expected_answer, confused_with, answered_at
		)
		SELECT $1::uuid, a.unicode, a.response_time_ms, a.is_correct,
		       a.given_answer, a.expected_answer, a.confused_with, a.answered_at
		FROM unnest(
			$2::text[], $3::int[], $4::boolean[],
			$5::text[], $6::text[], $7::text[], $8::timestamptz[]
		) AS a(unicode, response_time_ms, is_correct,
		       given_answer, expected_answer, confused_with, answered_at)
		RETURNING quiz_answer_id, unicode
	`, req.QuizSessionId, unicodes, times, correct, given, expected, confused, answeredAt)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make(map[string]int64, n)
	for rows.Next() {
		var id int64
		var u string
		if err := rows.Scan(&id, &u); err != nil {
			return nil, err
		}
		ids[u] = id
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(ids) != n {
		return nil, models.ErrInvalidQuizAnswers
	}
	return ids, nil
}

func (q *QuizQueries) insertWritingAttempts(ctx context.Context, req models.SubmitQuizRequest, ids map[string]int64) error {
	n := len(req.Answers)
	answerIDs := make([]int64, n)
	strokeCount := make([]bool, n)
	order := make([]bool, n)
	results := make([]string, n)

	for i, a := range req.Answers {
		w := a.Writing
		if w == nil || w.StrokeCountCorrect == nil || w.OrderCorrect == nil {
			return models.ErrInvalidWritingData
		}
		id, ok := ids[a.Unicode]
		if !ok {
			return models.ErrInvalidQuizAnswers
		}
		answerIDs[i] = id
		strokeCount[i] = *w.StrokeCountCorrect
		order[i] = *w.OrderCorrect
		results[i] = string(w.StrokeResults)
	}

	_, err := q.tx.ExecContext(ctx, `
		INSERT INTO app.writing_attempts (
			quiz_answer_id, stroke_count_correct, order_correct, stroke_results
		)
		SELECT w.id, w.stroke_count_correct, w.order_correct, w.stroke_results::jsonb
		FROM unnest($1::bigint[], $2::boolean[], $3::boolean[], $4::text[])
		     AS w(id, stroke_count_correct, order_correct, stroke_results)
	`, answerIDs, strokeCount, order, results)
	return err
}

func (q *QuizQueries) upsertCharacterStats(ctx context.Context, userId string, req models.SubmitQuizRequest) error {
	n := len(req.Answers)
	unicodes := make([]string, n)
	times := make([]int32, n)
	correct := make([]bool, n)
	seenAt := make([]time.Time, n)

	for i, a := range req.Answers {
		unicodes[i] = a.Unicode
		times[i] = int32(a.ResponseTimeMs)
		correct[i] = a.IsCorrect != nil && *a.IsCorrect
		if a.AnsweredAt != nil {
			seenAt[i] = a.AnsweredAt.UTC()
		} else {
			seenAt[i] = req.FinishedAt.UTC()
		}
	}

	_, err := q.tx.ExecContext(ctx, `
		INSERT INTO app.character_stats (
			user_id, unicode, answer_type, attempts, total_response_ms,
			correct_streak, correct_count, last_seen_at, first_seen_at
		)
		SELECT $1::uuid, a.unicode, $2::text, 1, a.response_time_ms::bigint,
		       a.is_correct::int, a.is_correct::int, a.seen_at, a.seen_at
		FROM unnest($3::text[], $4::int[], $5::boolean[], $6::timestamptz[])
		     AS a(unicode, response_time_ms, is_correct, seen_at)
		ON CONFLICT (user_id, unicode, answer_type) DO UPDATE SET
			attempts          = app.character_stats.attempts + 1,
			total_response_ms = app.character_stats.total_response_ms + EXCLUDED.total_response_ms,
			correct_count     = app.character_stats.correct_count + EXCLUDED.correct_count,
			correct_streak    = CASE WHEN EXCLUDED.correct_count = 1
			                         THEN app.character_stats.correct_streak + 1
			                         ELSE 0 END,
			last_seen_at      = GREATEST(app.character_stats.last_seen_at, EXCLUDED.last_seen_at),
			first_seen_at     = LEAST(app.character_stats.first_seen_at, EXCLUDED.first_seen_at)
	`, userId, req.AnswerType, unicodes, times, correct, seenAt)
	return err
}

const sessionSummarySelect = `
	SELECT s.quiz_session_id, s.list_id, l.name, s.answer_type,
	       COALESCE(s.character_quiz_type, ''), s.started_at, s.finished_at,
	       s.total_questions, s.random_order,
	       COALESCE(a.correct_count, 0), COALESCE(a.avg_ms, 0)
	FROM app.quiz_sessions s
	LEFT JOIN app.user_lists l
	       ON l.list_id = s.list_id AND l.deleted_at IS NULL
	LEFT JOIN LATERAL (
		SELECT COUNT(*) FILTER (WHERE qa.is_correct) AS correct_count,
		       AVG(qa.response_time_ms)::float8      AS avg_ms
		FROM app.quiz_answers qa
		WHERE qa.quiz_session_id = s.quiz_session_id
	) a ON true
`

func scanSessionSummary(r rowScanner, s *models.QuizSessionSummary) error {
	return r.Scan(
		&s.QuizSessionId, &s.ListId, &s.ListName, &s.AnswerType,
		&s.CharacterQuizType, &s.StartedAt, &s.FinishedAt,
		&s.TotalQuestions, &s.RandomOrder,
		&s.CorrectCount, &s.AvgResponseMs,
	)
}

func (q *QuizQueries) FetchUserQuizSessions(ctx context.Context, userId string, req models.FetchUserQuizSessionsRequest, pageLimit int) (models.QuizSessionsGroup, error) {
	rows, err := q.tx.QueryContext(ctx, sessionSummarySelect+`
		WHERE s.user_id = $1
		  AND ($2::uuid        IS NULL OR s.list_id = $2::uuid)
		  AND ($3::text        IS NULL OR s.answer_type = $3::text)
		  AND ($4::timestamptz IS NULL OR s.started_at >= $4::timestamptz)
		  AND ($5::timestamptz IS NULL OR s.started_at <= $5::timestamptz)
		ORDER BY s.started_at DESC, s.quiz_session_id
		LIMIT $6 OFFSET $7
	`, userId, req.ListId, req.AnswerType, req.From, req.To, pageLimit, req.Offset)
	if err != nil {
		return models.QuizSessionsGroup{}, err
	}
	defer rows.Close()

	sessions := make([]models.QuizSessionSummary, 0)
	for rows.Next() {
		var s models.QuizSessionSummary
		if err := scanSessionSummary(rows, &s); err != nil {
			return models.QuizSessionsGroup{}, err
		}
		sessions = append(sessions, s)
	}
	if err := rows.Err(); err != nil {
		return models.QuizSessionsGroup{}, err
	}
	return models.QuizSessionsGroup{Sessions: sessions}, nil
}

func (q *QuizQueries) FetchQuizSessionDetail(ctx context.Context, userId string, req models.FetchQuizSessionDetailRequest) (models.QuizSessionDetail, error) {
	var d models.QuizSessionDetail

	row := q.tx.QueryRowContext(ctx, sessionSummarySelect+`
		WHERE s.quiz_session_id = $1 AND s.user_id = $2
	`, req.QuizSessionId, userId)
	if err := scanSessionSummary(row, &d.QuizSessionSummary); err != nil {
		return models.QuizSessionDetail{}, err
	}

	rows, err := q.tx.QueryContext(ctx, `
		SELECT qa.unicode, qa.response_time_ms, qa.is_correct,
		       qa.given_answer, qa.expected_answer, qa.confused_with, qa.answered_at,
		       w.quiz_answer_id IS NOT NULL,
		       w.stroke_count_correct, w.order_correct, w.stroke_results
		FROM app.quiz_answers qa
		LEFT JOIN app.writing_attempts w ON w.quiz_answer_id = qa.quiz_answer_id
		WHERE qa.quiz_session_id = $1
		ORDER BY qa.quiz_answer_id
	`, req.QuizSessionId)
	if err != nil {
		return models.QuizSessionDetail{}, err
	}
	defer rows.Close()

	d.Answers = make([]models.QuizAnswerDetail, 0, d.TotalQuestions)
	for rows.Next() {
		var a models.QuizAnswerDetail
		var hasWriting bool
		var strokeCount, orderOK sql.NullBool
		var strokeResults []byte

		if err := rows.Scan(
			&a.Unicode, &a.ResponseTimeMs, &a.IsCorrect,
			&a.GivenAnswer, &a.ExpectedAnswer, &a.ConfusedWith, &a.AnsweredAt,
			&hasWriting, &strokeCount, &orderOK, &strokeResults,
		); err != nil {
			return models.QuizSessionDetail{}, err
		}
		if hasWriting {
			a.Writing = &models.WritingAttemptDetail{
				StrokeCountCorrect: strokeCount.Bool,
				OrderCorrect:       orderOK.Bool,
				StrokeResults:      json.RawMessage(strokeResults),
			}
		}
		d.Answers = append(d.Answers, a)
	}
	if err := rows.Err(); err != nil {
		return models.QuizSessionDetail{}, err
	}
	return d, nil
}


const characterStatCols = `
	cs.unicode, cs.answer_type, cs.attempts, cs.correct_count, cs.correct_streak,
	cs.correct_count::float8 / cs.attempts,
	cs.total_response_ms::float8 / cs.attempts,
	cs.first_seen_at, cs.last_seen_at
`

func scanCharacterStat(r rowScanner, s *models.CharacterStat) error {
	return r.Scan(
		&s.Unicode, &s.AnswerType, &s.Attempts, &s.CorrectCount, &s.CorrectStreak,
		&s.Accuracy, &s.AvgResponseMs, &s.FirstSeenAt, &s.LastSeenAt,
	)
}

func collectCharacterStats(rows *sql.Rows) (models.CharacterStatsGroup, error) {
	stats := make([]models.CharacterStat, 0)
	for rows.Next() {
		var s models.CharacterStat
		if err := scanCharacterStat(rows, &s); err != nil {
			return models.CharacterStatsGroup{}, err
		}
		stats = append(stats, s)
	}
	if err := rows.Err(); err != nil {
		return models.CharacterStatsGroup{}, err
	}
	return models.CharacterStatsGroup{Stats: stats}, nil
}

func (q *QuizQueries) FetchCharacterStats(ctx context.Context, userId string, req models.FetchCharacterStatsRequest, pageLimit int) (models.CharacterStatsGroup, error) {
	rows, err := q.tx.QueryContext(ctx, `
		SELECT `+characterStatCols+`
		FROM app.character_stats cs
		WHERE cs.user_id = $1
		  AND ($2::text IS NULL OR cs.answer_type = $2::text)
		  AND ($3::text IS NULL OR cs.unicode = $3::text)
		ORDER BY cs.last_seen_at DESC, cs.unicode, cs.answer_type
		LIMIT $4 OFFSET $5
	`, userId, req.AnswerType, req.Unicode, pageLimit, req.Offset)
	if err != nil {
		return models.CharacterStatsGroup{}, err
	}
	defer rows.Close()
	return collectCharacterStats(rows)
}

func (q *QuizQueries) FetchListStats(ctx context.Context, userId string, req models.FetchListStatsRequest) (models.ListStats, error) {
	var listID string
	err := q.tx.QueryRowContext(ctx, `
		SELECT list_id FROM app.user_lists
		WHERE list_id = $1 AND deleted_at IS NULL
	`, req.ListId).Scan(&listID)
	if err != nil {
		return models.ListStats{}, err
	}

	rows, err := q.tx.QueryContext(ctx, `
		SELECT lc.unicode,
		       COALESCE(SUM(cs.attempts), 0)::int,
		       COALESCE(SUM(cs.correct_count), 0)::int,
		       COALESCE(MAX(cs.correct_streak), 0)::int,
		       SUM(cs.correct_count)::float8 / NULLIF(SUM(cs.attempts), 0),
		       SUM(cs.total_response_ms)::float8 / NULLIF(SUM(cs.attempts), 0),
		       MAX(cs.last_seen_at)
		FROM app.list_characters lc
		LEFT JOIN app.character_stats cs
		       ON cs.unicode = lc.unicode
		      AND cs.user_id = $1
		      AND ($3::text IS NULL OR cs.answer_type = $3::text)
		WHERE lc.list_id = $2::uuid
		GROUP BY lc.list_character_id, lc.unicode
		ORDER BY lc.list_character_id
	`, userId, listID, req.AnswerType)
	if err != nil {
		return models.ListStats{}, err
	}
	defer rows.Close()

	out := models.ListStats{ListId: listID, Characters: make([]models.ListCharacterStat, 0)}
	for rows.Next() {
		var c models.ListCharacterStat
		if err := rows.Scan(
			&c.Unicode, &c.Attempts, &c.CorrectCount, &c.CorrectStreak,
			&c.Accuracy, &c.AvgResponseMs, &c.LastSeenAt,
		); err != nil {
			return models.ListStats{}, err
		}
		if c.Attempts > 0 {
			out.PracticedCharacters++
		}
		out.Characters = append(out.Characters, c)
	}
	if err := rows.Err(); err != nil {
		return models.ListStats{}, err
	}
	out.TotalCharacters = len(out.Characters)
	return out, nil
}

func (q *QuizQueries) FetchWeakCharacters(ctx context.Context, userId string, req models.FetchWeakCharactersRequest, sortBy models.WeakSortBy, minAttempts, limit int) (models.CharacterStatsGroup, error) {
	var orderBy string
	switch sortBy {
	case models.WeakByStreak:
		orderBy = `cs.correct_streak ASC, cs.attempts DESC, cs.unicode, cs.answer_type`
	case models.WeakBySlowest:
		orderBy = `cs.total_response_ms::float8 / cs.attempts DESC, cs.unicode, cs.answer_type`
	default:
		orderBy = `cs.correct_count::float8 / cs.attempts ASC, cs.attempts DESC, cs.unicode, cs.answer_type`
	}

	rows, err := q.tx.QueryContext(ctx, `
		SELECT `+characterStatCols+`
		FROM app.character_stats cs
		WHERE cs.user_id = $1
		  AND cs.attempts >= $3
		  AND ($4::text IS NULL OR cs.answer_type = $4::text)
		  AND ($2::uuid IS NULL OR EXISTS (
		        SELECT 1 FROM app.list_characters lc
		        WHERE lc.list_id = $2::uuid AND lc.unicode = cs.unicode
		  ))
		ORDER BY `+orderBy+`
		LIMIT $5
	`, userId, req.ListId, minAttempts, req.AnswerType, limit)
	if err != nil {
		return models.CharacterStatsGroup{}, err
	}
	defer rows.Close()
	return collectCharacterStats(rows)
}