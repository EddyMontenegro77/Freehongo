BEGIN;

-- Existing sessions created before email verification became mandatory must
-- not bypass the verification requirement.
CREATE OR REPLACE FUNCTION app.validate_token(p_token_hash TEXT)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = app, pg_temp
AS $$
   SELECT t.user_id
   FROM app.user_tokens t
   JOIN app.users u ON u.user_id = t.user_id
   WHERE t.token_hash = p_token_hash
     AND t.token_type = 'session'
     AND t.revoked_at IS NULL
     AND t.expires_at > now()
     AND u.deleted_at IS NULL
     AND u.email_verified_at IS NOT NULL
$$;

COMMIT;
