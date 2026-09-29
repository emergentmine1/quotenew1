# Instant Quote Service (quote-extui-service)

Backend for the Instant Quote application. Stage 1 provides a liveness endpoint
and a code lookup endpoint. Rate lookup, quote generation and quote request
persistence are not built yet.

## Requirements

- JDK 17 or newer. The build targets Java 17 bytecode.
- Docker, for the Testcontainers based tests.
- No global Maven install is needed. Use the bundled `./mvnw`.

## Configuration

The service reads all its settings from the environment. Nothing is
committed. Copy `.env.example` for the list of names.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DB_HOST` | yes | none | Database host name |
| `DB_PORT` | no | `5432` | Database port |
| `DB_NAME` | yes | none | Database name, for example `quoteamdev` |
| `DB_SCHEMA` | no | `quoteownr` | Schema holding the tables |
| `DB_USER` | yes | none | Database user |
| `DB_PASSWORD` | yes | none | Database password |
| `SERVER_PORT` | no | `8080` | HTTP port |
| `LOG_LEVEL` | no | `INFO` | Log level for the application code |
| `SPRING_MAIL_HOST` | no | none | SMTP host, `email-smtp.us-east-1.amazonaws.com` for Amazon SES. Without it no email is sent |
| `SPRING_MAIL_PORT` | no | `25` | SMTP port, `587` for Amazon SES |
| `SPRING_MAIL_USERNAME` | no | none | SMTP user name (SES SMTP credentials) |
| `SPRING_MAIL_PASSWORD` | no | none | SMTP password (SES SMTP credentials) |
| `MAIL_STARTTLS_REQUIRED` | no | `true` | Set to `false` only for a local test mail server |
| `MAIL_FROM` | no | none | Sender address, verified in Amazon SES. Without it no email is sent |
| `MAIL_INTERNAL_TO` | no | none | Internal recipients of the quote request summary, comma separated |
| `LOCATION_API_KEY` | no | none | Amazon Location API key. Without it city and zip code suggestions answer 503 |
| `AWS_REGION` | no | `us-east-1` | Region of Amazon Location Service |

The service fails to start when a required variable is missing. That is
intended. Failing at startup is better than failing on the first request.

The mail and Amazon Location settings are optional, so the service also runs on a
developer machine without them. Emails are then skipped and the city and zip code
field accepts free text.

Note that the database name and the schema name are different. `quoteamdev` is
the database. `quoteownr` is the schema inside it.

## Running

```bash
export JAVA_HOME=/path/to/jdk
export DB_HOST=... DB_NAME=... DB_USER=... DB_PASSWORD=...
./mvnw spring-boot:run
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/ping` | Liveness. Does not touch the database |
| GET | `/api/v1/profiledata/defaults` | Values the quote form starts with |
| GET | `/api/v1/masterdata/codes` | Code categories and their values |
| GET | `/api/v1/masterdata/airports` | Airport search for origin and destination |
| GET | `/api/v1/masterdata/countries` | Active country list |
| POST | `/api/v1/quote-requests` | Store a submitted quote request |

Code fields hold an `md_codedetail.cdcode` as stored, for example `TPMA` and
not `AIR`.

## OpenAPI

The running service serves its own description:

| URL | What it is |
|-----|------------|
| `/swagger-ui.html` | Browse and call the API |
| `/v3/api-docs` | OpenAPI 3.1 as JSON |
| `/v3/api-docs.yaml` | The same document as YAML |

`openapi/openapi.json` and `openapi/openapi.yaml` are committed copies, so the
frontend can generate a client without running the service first. They are
generated files: regenerate and commit them whenever an endpoint, a DTO or a
validation annotation changes, or they will drift.

```bash
./mvnw -DskipTests package
java -jar target/quote-extui-service.jar &
curl -s http://localhost:8080/v3/api-docs | python -m json.tool --indent 2 > openapi/openapi.json
curl -s http://localhost:8080/v3/api-docs.yaml > openapi/openapi.yaml
```

Nothing enforces that the committed copies are current. Adding
`springdoc-openapi-maven-plugin` would generate them during the build instead,
at the cost of starting the application on every package.

## Tests

The test sources under `src/test` are intentionally not version controlled;
this was an explicit decision by the repository owner. A fresh clone of this
repository therefore contains no tests at all. Running `./mvnw test` on a
fresh clone will report success because there is nothing to run, not because
anything was verified. Do not take a passing `./mvnw test` on a fresh clone as
evidence the service works.

If you have the test sources (for example because you are working in a
checkout that already has them, or you were given them separately), running
them requires Docker, because the repository tests start a real PostgreSQL 18
container through Testcontainers. No test mocks SQL.
