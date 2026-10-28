BEGIN;
-- BACKEND ROLE

CREATE ROLE app_backend LOGIN PASSWORD '...';

GRANT USAGE ON SCHEMA app TO app_backend;
GRANT USAGE ON SCHEMA japanese TO app_backend;

GRANT SELECT ON ALL TABLES IN SCHEMA japanese TO app_backend;
ALTER DEFAULT PRIVILEGES IN SCHEMA japanese GRANT SELECT ON tables TO app_backend;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app_backend;

REVOKE ALL ON FUNCTION app.soft_delete_user(uuid) FROM public;
GRANT EXECUTE ON FUNCTION app.soft_delete_user(uuid) TO app_backend, avnadmin;

-- RLS
CREATE FUNCTION app.current_user_id() RETURNS UUID
  LANGUAGE SQL STABLE AS $$
     SELECT nullif(current_setting('app.current_user_id', true), '')::UUID
$$;

-- USING avnadmin permissions
SET ROLE avnadmin;

CREATE OR REPLACE FUNCTION app.validate_token(p_token_hash TEXT)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = app, pg_temp
AS $$
   SELECT t.user_id
   FROM app.user_tokens t
   JOIN app.users u ON u.user_id = t.user_id
   WHERE t.token_hash = p_token_hash
     AND t.revoked_at IS NULL
     AND t.expires_at > now()
     AND u.deleted_at IS NULL
$$;

CREATE OR REPLACE FUNCTION app.find_user_by_identity(p_provider text, p_provider_user_id text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = app, pg_temp
AS $$
   SELECT i.user_id
   FROM app.user_identities i
   JOIN app.users u ON u.user_id = i.user_id
   WHERE i.identity_provider::text = p_provider
     AND i.provider_user_id = p_provider_user_id
     AND u.deleted_at IS NULL
$$;

CREATE OR REPLACE FUNCTION app.find_user_by_email_for_login(p_email text)
RETURNS TABLE(user_id uuid, password_hash text, email_verified_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = app, pg_temp
AS $$
   SELECT u.user_id, u.password_hash, u.email_verified_at
   FROM app.users u
   WHERE lower(u.email) = lower(p_email)
     AND u.deleted_at IS NULL
$$;

REVOKE ALL ON FUNCTION app.validate_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.validate_token(TEXT) TO app_backend;

REVOKE ALL ON FUNCTION app.find_user_by_identity(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.find_user_by_identity(TEXT, TEXT) TO app_backend;

REVOKE ALL ON FUNCTION app.find_user_by_email_for_login(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.find_user_by_email_for_login(TEXT) TO app_backend;

ALTER TABLE app.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.character_stats ENABLE ROW LEVEL SECURITY;

ALTER TABLE app.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.writing_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.list_characters ENABLE ROW LEVEL SECURITY;

-- Has to gen uuidv7 in backend for creating a new user
CREATE POLICY users_insert ON app.users FOR INSERT
   WITH CHECK (user_id = app.current_user_id());
CREATE POLICY users_select ON app.users FOR SELECT
   USING (user_id = app.current_user_id() AND deleted_at is null);
CREATE POLICY users_update ON app.users FOR UPDATE
   USING (user_id = app.current_user_id())
   WITH CHECK(user_id = app.current_user_id());

CREATE POLICY user_identities_all ON app.user_identities FOR ALL
   USING (user_id = app.current_user_id())
   WITH CHECK (user_id = app.current_user_id());

CREATE POLICY user_tokens_all ON app.user_tokens FOR ALL
   USING (user_id = app.current_user_id())
   WITH CHECK (user_id = app.current_user_id());

CREATE POLICY quiz_sessions_all ON app.quiz_sessions FOR ALL
   USING (user_id = app.current_user_id())
   WITH CHECK (user_id = app.current_user_id());

CREATE POLICY user_lists_all ON app.user_lists FOR ALL
   USING (user_id = app.current_user_id())
   WITH CHECK (user_id = app.current_user_id());

CREATE POLICY character_stats_all ON app.character_stats FOR ALL
   USING (user_id = app.current_user_id())
   WITH CHECK (user_id = app.current_user_id());


CREATE POLICY list_characters_own ON app.list_characters FOR ALL
   USING (
      EXISTS (
         SELECT 1 FROM app.user_lists l
         WHERE l.list_id = list_characters.list_id
         AND   l.user_id = app.current_user_id()
      )
   )
   WITH CHECK(
      EXISTS (
         SELECT 1 FROM app.user_lists l
         WHERE l.list_id = list_characters.list_id
         AND   l.user_id = app.current_user_id()
      )
   );

CREATE POLICY quiz_answers_own ON app.quiz_answers FOR ALL
   USING (
      EXISTS (
         SELECT 1 FROM app.quiz_sessions q
         WHERE q.quiz_session_id = quiz_answers.quiz_session_id
         AND   q.user_id = app.current_user_id()
      )
   )
   WITH CHECK (
      EXISTS (
         SELECT 1 FROM app.quiz_sessions q
         WHERE q.quiz_session_id = quiz_answers.quiz_session_id
         AND   q.user_id = app.current_user_id()
      )
   );

CREATE POLICY writing_attempts_own ON app.writing_attempts FOR ALL
   USING (
      EXISTS (
         SELECT 1 FROM app.quiz_sessions qs
         WHERE
            (  SELECT qa.quiz_session_id FROM app.quiz_answers qa
               WHERE qa.quiz_answer_id = writing_attempts.quiz_answer_id
            ) = qs.quiz_session_id
         AND qs.user_id = app.current_user_id()
      )
   )
   WITH CHECK (
      EXISTS (
         SELECT 1 FROM app.quiz_sessions qs
         WHERE
            (  SELECT qa.quiz_session_id FROM app.quiz_answers qa
               WHERE qa.quiz_answer_id = writing_attempts.quiz_answer_id
            ) = qs.quiz_session_id
         AND qs.user_id = app.current_user_id()
      )
   );

COMMIT;
