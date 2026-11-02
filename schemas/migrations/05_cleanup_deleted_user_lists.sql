BEGIN;
SET LOCAL ROLE avnadmin;
-- Extend the existing periodic routine without creating another cron job.
-- The existing job already executes app.purge_stale_data().
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

    -- Remove private lists that are no longer referenced by any quiz.
    -- Public lists are retained as shared content.
    DELETE FROM app.user_lists AS l
     WHERE l.user_id = deleted_user_id
       AND l.is_public = FALSE
       AND NOT EXISTS (
           SELECT 1
             FROM app.quiz_sessions AS q
            WHERE q.list_id = l.list_id
       );
END;
$$;

REVOKE ALL ON FUNCTION app.purge_stale_data() FROM PUBLIC;

-- Apply the new orphan-list policy immediately to data already migrated.
DELETE FROM app.user_lists AS l
 WHERE l.user_id = (
           SELECT user_id
             FROM app.users
            WHERE email = 'deleted-user@freehongo.invalid'
              AND deleted_at IS NULL
       )
   AND l.is_public = FALSE
   AND NOT EXISTS (
       SELECT 1
         FROM app.quiz_sessions AS q
        WHERE q.list_id = l.list_id
   );

COMMIT;
