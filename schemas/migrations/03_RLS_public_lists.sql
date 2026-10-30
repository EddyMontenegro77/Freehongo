BEGIN;

CREATE POLICY user_lists_public_select
ON app.user_lists
FOR SELECT
USING (
    is_public = true
    AND deleted_at IS NULL
);

CREATE POLICY list_characters_public_select
ON app.list_characters
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM app.user_lists l
        WHERE l.list_id = list_characters.list_id
          AND l.is_public = true
          AND l.deleted_at IS NULL
    )
);

COMMIT;
