BEGIN;
SET LOCAL ROLE avnadmin;
-- Delete cascades for data owned exclusively by a user.
-- Lists are reassigned to [deleted-user] by app.purge_stale_data() before
-- the owner is deleted, so quizzes from other users keep their list_id.
ALTER TABLE app.user_identities
  DROP CONSTRAINT user_identities_user_id_fkey,
  ADD CONSTRAINT user_identities_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app.users(user_id) ON DELETE CASCADE;

ALTER TABLE app.user_tokens
  DROP CONSTRAINT user_tokens_user_id_fkey,
  ADD CONSTRAINT user_tokens_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app.users(user_id) ON DELETE CASCADE;

ALTER TABLE app.character_stats
  DROP CONSTRAINT character_stats_user_id_fkey,
  ADD CONSTRAINT character_stats_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app.users(user_id) ON DELETE CASCADE;

ALTER TABLE app.user_lists
  DROP CONSTRAINT user_lists_user_id_fkey,
  ADD CONSTRAINT user_lists_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app.users(user_id) ON DELETE CASCADE;

ALTER TABLE app.quiz_sessions
  DROP CONSTRAINT quiz_sessions_user_id_fkey,
  ADD CONSTRAINT quiz_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES app.users(user_id) ON DELETE CASCADE;

ALTER TABLE app.quiz_answers
  DROP CONSTRAINT quiz_answers_quiz_session_id_fkey,
  ADD CONSTRAINT quiz_answers_quiz_session_id_fkey
    FOREIGN KEY (quiz_session_id)
    REFERENCES app.quiz_sessions(quiz_session_id) ON DELETE CASCADE;

COMMIT;

BEGIN;
SET LOCAL ROLE avnadmin;
CREATE EXTENSION IF NOT EXISTS pg_cron;

INSERT INTO app.users (
    username,
    email,
    password_hash,
    email_verified_at
)
VALUES (
    '[deleted-user]',
    'deleted-user@freehongo.invalid',
    NULL,
    now()
)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION app.purge_stale_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, pg_temp
AS $$
DECLARE
    deleted_user_id UUID;
BEGIN
    SELECT user_id
      INTO deleted_user_id
      FROM app.users
     WHERE email = 'deleted-user@freehongo.invalid'
       AND deleted_at IS NULL;

    IF deleted_user_id IS NULL THEN
        RAISE EXCEPTION 'Technical deleted user is missing';
    END IF;

    DELETE FROM app.user_tokens
     WHERE expires_at < now() - interval '7 days'
        OR revoked_at < now() - interval '7 days';

    -- Preserve lists because other users may have quiz sessions referring to
    -- them. Their list_id remains valid after the original owner is removed.
    UPDATE app.user_lists
       SET user_id = deleted_user_id
     WHERE user_id IN (
         SELECT user_id
           FROM app.users
          WHERE user_id <> deleted_user_id
            AND email_verified_at IS NULL
            AND deleted_at IS NULL
            AND created_at < now() - interval '7 days'
     )
       AND user_id <> deleted_user_id;

    UPDATE app.user_lists
       SET user_id = deleted_user_id
     WHERE user_id IN (
         SELECT user_id
           FROM app.users
          WHERE user_id <> deleted_user_id
            AND deleted_at < now() - interval '30 days'
     )
       AND user_id <> deleted_user_id;

    DELETE FROM app.users
     WHERE user_id <> deleted_user_id
       AND email_verified_at IS NULL
       AND deleted_at IS NULL
       AND created_at < now() - interval '7 days';

    DELETE FROM app.users
     WHERE user_id <> deleted_user_id
       AND deleted_at < now() - interval '30 days';
END;
$$;

REVOKE ALL ON FUNCTION app.purge_stale_data() FROM PUBLIC;

-- Make the migration safe to re-run without creating duplicate jobs.
SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname = 'purge-stale-data';

SELECT cron.schedule(
    'purge-stale-data',
    '0 9 * * *', -- Every day at 09:00 UTC (03:00 in Guatemala)
    $$SELECT app.purge_stale_data()$$
);

COMMIT;
