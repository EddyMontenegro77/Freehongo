-- Migration: improvements to the users, identities and tokens schema
-- Requires PostgreSQL 18 (uuidv7()). Run against the existing schema.

BEGIN;

-- ============================================================
-- app.users
-- ============================================================
ALTER TABLE app.users
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Keeps updated_at current on every UPDATE

CREATE TRIGGER trg_users_set_updated_at
    BEFORE UPDATE ON app.users
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at();

-- ============================================================
-- app.user_identities
-- ============================================================
ALTER TABLE app.user_identities
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============================================================
-- app.user_tokens
-- ============================================================
ALTER TABLE app.user_tokens
    ADD COLUMN token_type TEXT NOT NULL DEFAULT 'session',
    ADD COLUMN last_used_at TIMESTAMPTZ;

ALTER TABLE app.user_tokens
    ADD CONSTRAINT ck_user_tokens_type
    CHECK (token_type IN ('session', 'password_reset', 'email_verification'));

-- Active (non-revoked) tokens
CREATE INDEX ix_user_tokens_active
    ON app.user_tokens (user_id, token_type)
    WHERE revoked_at IS NULL;

-- ============================================================
-- Consistent soft delete (Google and own signup)
-- ============================================================
-- A deleted account stops existing for login purposes:
--   * deleted_at is set (frees the email via the partial unique index)
--   * the password is cleared
--   * external identities are deleted (frees the provider UNIQUE constraint)
--   * all active tokens are revoked
CREATE OR REPLACE FUNCTION app.soft_delete_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE app.users
       SET deleted_at = now(),
           password_hash = NULL
     WHERE user_id = p_user_id
       AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User % does not exist or it is already deleted', p_user_id;
    END IF;

    DELETE FROM app.user_identities
     WHERE user_id = p_user_id;

    UPDATE app.user_tokens
       SET revoked_at = now()
     WHERE user_id = p_user_id
       AND revoked_at IS NULL;
END;
$$;

COMMIT;

-- Usage:
--   SELECT app.soft_delete_user('00000000-0000-0000-0000-000000000000');