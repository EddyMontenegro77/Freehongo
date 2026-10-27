package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"

	"freehongo-api/internal/auth/models"
)

const pgUniqueViolationCode = "23505"

type UserRepository struct{ db *sql.DB }

func NewUserRepository(db *sql.DB) *UserRepository { return &UserRepository{db: db} }

func (r *UserRepository) InTx(ctx context.Context, fn func(q *UserQueries) error) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := fn(&UserQueries{tx: tx}); err != nil {
		return err
	}
	return tx.Commit()
}

func IsUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == pgUniqueViolationCode
}

type UserQueries struct{ tx *sql.Tx }

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

func (q *UserQueries) FindUserIDByGoogleSub(ctx context.Context, sub string) (id string, found bool, err error) {
	err = q.tx.QueryRowContext(ctx, `
		SELECT u.user_id
		FROM app.user_identities i
		JOIN app.users u ON u.user_id = i.user_id
		WHERE i.identity_provider = 'google'
		  AND i.provider_user_id = $1
		  AND u.deleted_at IS NULL`, sub).Scan(&id)
	return id, err == nil, ignoreNoRows(err)
}

func (q *UserQueries) FindActiveUserByEmailForUpdate(ctx context.Context, email string) (user models.ExistingUser, found bool, err error) {
	var verifiedAt sql.NullTime
	err = q.tx.QueryRowContext(ctx, `
		SELECT user_id, email_verified_at
		FROM app.users
		WHERE lower(email) = lower($1) AND deleted_at IS NULL
		FOR UPDATE`, email).Scan(&user.ID, &verifiedAt)
	user.EmailVerified = verifiedAt.Valid
	return user, err == nil, ignoreNoRows(err)
}

func (q *UserQueries) InsertVerifiedUser(ctx context.Context, username, email, pictureURL string) (id string, err error) {
	err = q.tx.QueryRowContext(ctx, `
		INSERT INTO app.users (username, email, email_verified_at, picture_url, last_login_at)
		VALUES ($1, $2, now(), $3, now())
			RETURNING user_id`, username, email, pictureURL).Scan(&id)
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

func (q *UserQueries) InsertUserWithPassword(ctx context.Context, username, email, passwordHash string) (id string, err error) {
	err = q.tx.QueryRowContext(ctx, `
		INSERT INTO app.users (username, email, password_hash)
		VALUES ($1, $2, $3)
			RETURNING user_id`, username, email, passwordHash).Scan(&id)
	return id, err
}

func (q *UserQueries) FindActiveUserForPasswordLogin(ctx context.Context, email string) (u models.PasswordUser, found bool, err error) {
	var hash sql.NullString
	err = q.tx.QueryRowContext(ctx, `
		SELECT user_id, password_hash
		FROM app.users
		WHERE lower(email) = lower($1) AND deleted_at IS NULL`, email).Scan(&u.ID, &hash)
	u.PasswordHash = hash.String
	return u, err == nil, ignoreNoRows(err)
}

func (q *UserQueries) InsertSessionToken(ctx context.Context, userID, tokenHash string, expiresAt time.Time) error {
	_, err := q.tx.ExecContext(ctx, `
			INSERT INTO app.user_tokens (user_id, token_hash, token_type, expires_at)
			VALUES ($1, $2, 'session', $3)`, userID, tokenHash, expiresAt)
	return err
}

func (q *UserQueries) FindActiveSessionUser(ctx context.Context, tokenHash string) (userID string, found bool, err error) {
	err = q.tx.QueryRowContext(ctx, `
		SELECT t.user_id
		FROM app.user_tokens t
		JOIN app.users u ON u.user_id = t.user_id
		WHERE t.token_hash = $1
		  AND t.token_type = 'session'
		  AND t.revoked_at IS NULL
		  AND t.expires_at > now()
		  AND u.deleted_at IS NULL`, tokenHash).Scan(&userID)
	return userID, err == nil, ignoreNoRows(err)
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

func ignoreNoRows(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	return err
}
