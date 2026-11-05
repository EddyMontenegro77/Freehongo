package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"

	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/db"
)

const pgUniqueViolationCode = "23505"

type UserRepository struct{ txm *db.TxManager }

func NewUserRepository(txm *db.TxManager) *UserRepository {
	return &UserRepository{txm: txm}
}

func (r *UserRepository) InTx(ctx context.Context, userID string, fn func(q *UserQueries) error) error {
	return r.txm.InTx(ctx, userID, func(tx *sql.Tx) error {
		return fn(NewUserQueries(tx))
	})
}

func IsUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == pgUniqueViolationCode
}

type UserQueries struct{ tx *sql.Tx }

func NewUserQueries(tx *sql.Tx) *UserQueries { return &UserQueries{tx: tx} }

func (q *UserQueries) SetCurrentUserID(ctx context.Context, userID string) error {
	_, err := q.tx.ExecContext(ctx,
		`SELECT set_config('app.current_user_id', $1, true)`, userID)
	return err
}

func translateDatabaseError(err error) error {
	if err == nil {
		return nil
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "42501" {
		return fmt.Errorf("%w: %w", models.ErrRLSPolicyViolation, err)
	}
	return err
}

func NewUUIDv7() (string, error) {
	value, err := uuid.NewV7()
	if err != nil {
		return "", err
	}
	return value.String(), nil
}

func (q *UserQueries) FetchUserProfile(
	ctx context.Context,
	userID string,
) (models.UserProfile, error) {
	var profile models.UserProfile
	var emailVerifiedAt sql.NullTime
	var pictureURL sql.NullString

	err := q.tx.QueryRowContext(ctx, `
        SELECT username, email, email_verified_at, picture_url
        FROM app.users
        WHERE user_id = $1
          AND deleted_at IS NULL
    `, userID).Scan(
		&profile.Name,
		&profile.Email,
		&emailVerifiedAt,
		&pictureURL,
	)
	if err != nil {
		return models.UserProfile{}, err
	}

	profile.Verified = emailVerifiedAt.Valid
	if pictureURL.Valid {
		profile.PictureUrl = pictureURL.String
	}

	return profile, nil
}

func (q *UserQueries) UpdateUsername(ctx context.Context, userID, username string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.users
		SET username = $1
		WHERE user_id = $2 AND deleted_at IS NULL`, username, userID)
	return err
}

func (q *UserQueries) UpdatePictureURL(ctx context.Context, userID, pictureURL string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.users
		SET picture_url = $1
		WHERE user_id = $2 AND deleted_at IS NULL`, pictureURL, userID)
	return err
}

func (q *UserQueries) SoftDeleteUser(ctx context.Context, userID string) error {
	_, err := q.tx.ExecContext(ctx, `SELECT app.soft_delete_user($1)`, userID)
	return err
}

func (q *UserQueries) FindUserIDByGoogleSub(ctx context.Context, sub string) (id string, found bool, err error) {
	var value sql.NullString
	err = q.tx.QueryRowContext(ctx, `
		SELECT app.find_user_by_identity('google', $1)`, sub).Scan(&value)
	if err != nil {
		return "", false, err
	}
	if !value.Valid {
		return "", false, nil
	}
	return value.String, true, nil
}

func (q *UserQueries) FindUserByEmailForPasswordLogin(ctx context.Context, email string) (u models.PasswordUser, found bool, err error) {
	var hash sql.NullString
	var verifiedAt sql.NullTime
	err = q.tx.QueryRowContext(ctx, `
		SELECT user_id, password_hash, email_verified_at
		FROM app.find_user_by_email_for_login($1)`, email).Scan(&u.ID, &hash, &verifiedAt)
	u.PasswordHash = hash.String
	u.EmailVerified = verifiedAt.Valid
	return u, err == nil, ignoreNoRows(err)
}

func (q *UserQueries) FindActiveUserByEmailForUpdate(ctx context.Context, email string) (user models.ExistingUser, found bool, err error) {
	var verifiedAt sql.NullTime
	err = q.tx.QueryRowContext(ctx, `
		SELECT user_id, email_verified_at
		FROM app.find_user_by_email_for_login($1)`, email).Scan(&user.ID, &verifiedAt)
	user.EmailVerified = verifiedAt.Valid
	return user, err == nil, ignoreNoRows(err)
}

func (q *UserQueries) InsertVerifiedUser(ctx context.Context, id, username, email, pictureURL string) (string, error) {
	err := q.tx.QueryRowContext(ctx, `
		INSERT INTO app.users (user_id, username, email, email_verified_at, picture_url, last_login_at)
		VALUES ($1, $2, $3, now(), $4, now())
			RETURNING user_id`, id, username, email, pictureURL).Scan(&id)
	return id, err
}

func (q *UserQueries) InsertGoogleIdentity(ctx context.Context, userID, sub string) error {
	_, err := q.tx.ExecContext(ctx, `
		INSERT INTO app.user_identities (user_id, identity_provider, provider_user_id)
		VALUES ($1, 'google', $2)`, userID, sub)
	return err
}

func (q *UserQueries) TouchLastLogin(ctx context.Context, userID string) error {
	_, err := q.tx.ExecContext(ctx,
		`UPDATE app.users SET last_login_at = now() WHERE user_id = $1`, userID)
	return err
}

func (q *UserQueries) MarkEmailVerifiedAndDropPassword(ctx context.Context, userID string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.users
		SET email_verified_at = now(), password_hash = NULL
		WHERE user_id = $1`, userID)
	return err
}

func (q *UserQueries) RevokeAllTokens(ctx context.Context, userID string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.user_tokens SET revoked_at = now()
		WHERE user_id = $1 AND revoked_at IS NULL`, userID)
	return err
}

func (q *UserQueries) InsertUserWithPassword(ctx context.Context, id, username, email, passwordHash string) (string, error) {
	err := q.tx.QueryRowContext(ctx, `
		INSERT INTO app.users (user_id, username, email, password_hash)
		VALUES ($1, $2, $3, $4)
			RETURNING user_id`, id, username, email, passwordHash).Scan(&id)
	return id, err
}

func (q *UserQueries) FindActiveUserForPasswordLogin(ctx context.Context, email string) (u models.PasswordUser, found bool, err error) {
	return q.FindUserByEmailForPasswordLogin(ctx, email)
}

func (q *UserQueries) InsertSessionToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	_, err := q.tx.ExecContext(ctx, `
			INSERT INTO app.user_tokens (user_id, token_hash, token_type, expires_at)
			VALUES ($1, $2, 'session', $3)`, userID, tokenHash, expiresAt)
	return err
}

func (q *UserQueries) InsertActionToken(ctx context.Context, userID, tokenHash, tokenType string, expiresAt time.Time) error {
	_, err := q.tx.ExecContext(ctx, `
		INSERT INTO app.user_tokens (user_id, token_hash, token_type, expires_at)
		VALUES ($1, $2, $3, $4)`, userID, tokenHash, tokenType, expiresAt)
	return err
}

func (q *UserQueries) FindActiveActionTokenUser(ctx context.Context, tokenHash, tokenType string) (string, bool, error) {
	var value sql.NullString
	err := q.tx.QueryRowContext(ctx, `
		SELECT app.validate_action_token($1, $2)`, tokenHash, tokenType).Scan(&value)
	if err != nil {
		return "", false, err
	}
	return value.String, value.Valid, nil
}

func (q *UserQueries) RevokeActionToken(ctx context.Context, tokenHash, tokenType string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.user_tokens
		SET revoked_at = now()
		WHERE token_hash = $1 AND token_type = $2 AND revoked_at IS NULL`, tokenHash, tokenType)
	return err
}

func (q *UserQueries) MarkEmailVerified(ctx context.Context, userID string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.users SET email_verified_at = COALESCE(email_verified_at, now())
		WHERE user_id = $1 AND deleted_at IS NULL`, userID)
	return err
}

func (q *UserQueries) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.users SET password_hash = $1
		WHERE user_id = $2 AND deleted_at IS NULL`, passwordHash, userID)
	return err
}

func (q *UserQueries) FindActiveSessionUser(ctx context.Context, tokenHash string) (userID string, found bool, err error) {
	var value sql.NullString
	err = q.tx.QueryRowContext(ctx, `
		SELECT app.validate_token($1)`, tokenHash).Scan(&value)
	if err != nil {
		return "", false, err
	}
	if !value.Valid {
		return "", false, nil
	}
	return value.String, true, nil
}

func (q *UserQueries) TouchSession(ctx context.Context, tokenHash string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.user_tokens
		SET last_used_at = now()
		WHERE token_hash = $1
		  AND token_type = 'session'
		  AND revoked_at IS NULL
		  AND expires_at > now()`, tokenHash)
	return err
}

func (q *UserQueries) RevokeSessionToken(ctx context.Context, tokenHash string) error {
	_, err := q.tx.ExecContext(ctx, `
		UPDATE app.user_tokens
		SET revoked_at = now()
		WHERE token_hash = $1
		  AND token_type = 'session'
		  AND revoked_at IS NULL`, tokenHash)
	return err
}

func (q *UserQueries) ListQueuedProfilePictures(ctx context.Context) ([]string, error) {
	rows, err := q.tx.QueryContext(ctx, `
		SELECT picture_url
		FROM app.profile_picture_cleanup
		ORDER BY queued_at
		LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pictures []string
	for rows.Next() {
		var pictureURL string
		if err := rows.Scan(&pictureURL); err != nil {
			return nil, err
		}
		pictures = append(pictures, pictureURL)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return pictures, nil
}

func (q *UserQueries) RemoveQueuedProfilePicture(ctx context.Context, pictureURL string) error {
	_, err := q.tx.ExecContext(ctx, `
		DELETE FROM app.profile_picture_cleanup
		WHERE picture_url = $1`, pictureURL)
	return err
}

func ignoreNoRows(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	return err
}
