BEGIN;

CREATE TABLE app.profile_picture_cleanup (
    picture_url TEXT PRIMARY KEY,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON app.profile_picture_cleanup TO app_backend;

CREATE OR REPLACE FUNCTION app.queue_deleted_user_picture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = app, pg_temp
AS $$
BEGIN
    IF OLD.picture_url IS NOT NULL AND OLD.picture_url <> '' THEN
        INSERT INTO app.profile_picture_cleanup (picture_url)
        VALUES (OLD.picture_url)
        ON CONFLICT (picture_url) DO NOTHING;
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_users_queue_picture_cleanup
    BEFORE DELETE ON app.users
    FOR EACH ROW
    EXECUTE FUNCTION app.queue_deleted_user_picture();



GRANT SELECT, DELETE ON app.profile_picture_cleanup TO app_backend;
REVOKE ALL ON app.profile_picture_cleanup FROM PUBLIC;
ALTER TABLE app.profile_picture_cleanup ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_picture_cleanup_backend_read
ON app.profile_picture_cleanup
FOR SELECT
TO app_backend
USING (true);

CREATE POLICY profile_picture_cleanup_backend_delete
ON app.profile_picture_cleanup
FOR DELETE
TO app_backend
USING (true);

COMMIT;
