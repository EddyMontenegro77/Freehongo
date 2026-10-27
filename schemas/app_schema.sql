-- USERS

CREATE SCHEMA app;


CREATE TABLE app.users (
    user_id UUID PRIMARY KEY DEFAULT uuidv7(),
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    picture_url TEXT,
    CHECK(length(trim(username)) > 0)
);

CREATE UNIQUE INDEX uq_users_email_active
    ON app.users (lower(email))
    WHERE app.users.deleted_at IS NULL;

CREATE TABLE app.user_identities (
    identity_id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES app.users(user_id) NOT NULL,
    identity_provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    UNIQUE(user_id, identity_provider),
    UNIQUE(identity_provider, provider_user_id),
    CHECK (identity_provider IN ('google'))
);

CREATE TABLE app.user_tokens (
    user_token_id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES app.users(user_id) NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    token_type TEXT NOT NULL DEFAULT 'session',
    last_used_at TIMESTAMPTZ,
    CHECK (token_type IN ('session', 'password_reset', 'email_verification'))
);

-- LISTS

CREATE TABLE app.user_lists (
    list_id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES app.users(user_id) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT FALSE NOT NULL,
    CHECK(length(trim(name)) > 0)
);

ALTER TABLE app.user_lists
    ADD COLUMN list_type TEXT NOT NULL DEFAULT 'mixed'
    CHECK (list_type IN ('hiragana','katakana','kanji','mixed'));

CREATE TABLE app.list_characters (
    list_character_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    list_id UUID    NOT NULL REFERENCES app.user_lists (list_id) ON DELETE CASCADE,
    unicode VARCHAR NOT NULL REFERENCES japanese.characters (unicode),
    UNIQUE (list_id, unicode)
);

-- QUIZES
CREATE TABLE app.quiz_sessions (
    quiz_session_id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES app.users(user_id) NOT NULL,
    list_id UUID REFERENCES app.user_lists(list_id) NOT NULL,
    answer_type TEXT NOT NULL,
    character_quiz_type TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL,
    total_questions INT NOT NULL,
    random_order BOOLEAN NOT NULL,
    CHECK(answer_type IN ('multiple','open','strokeWriting')),
    CHECK(total_questions >= 2),
    CHECK(character_quiz_type IN ('characterToReading', 'readingToCharacter', 'characterToMeaning', 'meaningToCharacter')),
    CHECK (answer_type <> 'strokeWriting'
         OR character_quiz_type IN ('readingToCharacter', 'meaningToCharacter')),
    CHECK( finished_at >= started_at)
);

CREATE TABLE app.quiz_answers (
    quiz_answer_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quiz_session_id UUID REFERENCES app.quiz_sessions(quiz_session_id) NOT NULL,
    unicode VARCHAR REFERENCES japanese.characters(unicode) NOT NULL,
    response_time_ms INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    given_answer TEXT,
    expected_answer TEXT,
    confused_with TEXT,
    answered_at TIMESTAMPTZ,
    UNIQUE (quiz_session_id, unicode),
    CHECK(response_time_ms >=0)
);

CREATE TABLE app.writing_attempts (
    quiz_answer_id       BIGINT PRIMARY KEY REFERENCES app.quiz_answers (quiz_answer_id) ON DELETE CASCADE,
    stroke_count_correct BOOLEAN NOT NULL,
    order_correct        BOOLEAN NOT NULL,
    stroke_results       JSONB   NOT NULL
);

CREATE TABLE app.character_stats (
    character_stat_id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID REFERENCES app.users(user_id) NOT NULL,
    unicode VARCHAR REFERENCES japanese.characters(unicode) NOT NULL,
    answer_type TEXT NOT NULL,
    attempts INT NOT NULL,
    total_response_ms BIGINT NOT NULL,
    correct_streak INT NOT NULL,
    correct_count INT NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL,
    first_seen_at TIMESTAMPTZ NOT NULL,
    UNIQUE(user_id, unicode, answer_type),
    CHECK(answer_type IN ('multiple','open','strokeWriting')),
    CHECK(total_response_ms >= 0),
    CHECK(correct_count >= 0 AND correct_streak >= 0 AND attempts >= 1),
    CHECK(correct_count <= attempts),
    CHECK(last_seen_at >= first_seen_at)
);

-- INDEXES
CREATE INDEX ix_user_tokens_user ON app.user_tokens (user_id);
CREATE INDEX ix_user_lists_user ON app.user_lists (user_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_quiz_sessions_user ON app.quiz_sessions (user_id, started_at DESC);
CREATE INDEX ix_quiz_sessions_list ON app.quiz_sessions (list_id);

-- UPDATE TRIGGERS
CREATE FUNCTION app.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END $$;

CREATE TRIGGER trg_user_lists_updated
    BEFORE UPDATE ON app.user_lists
    FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();
