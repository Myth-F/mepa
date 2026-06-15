// Provides non-secret placeholder environment values so modules that validate
// env at import time can be unit-tested without a real .env. Integration tests
// that need a live database override DATABASE_URL via the test runner.
// NODE_ENV is set to "test" by the test runner. Only fill in the rest.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.S3_ENDPOINT ??= "http://localhost:9000";
process.env.S3_BUCKET ??= "test-media";
process.env.S3_ACCESS_KEY_ID ??= "test";
process.env.S3_SECRET_ACCESS_KEY ??= "test-secret";
process.env.TUTOR_ENABLED ??= "false";
