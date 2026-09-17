# Technology Stack And Development Standard

## Purpose

This document defines the technology choices, development standards, ownership boundaries, and engineering conventions for the project.

Project narrative belongs in `README.md` and `docs/PROJECT_CONTEXT.md`. Detailed system structure belongs in `docs/architecture/SYSTEM_ARCHITECTURE.md`.

## Selected Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | CSS |
| Backend | Python + FastAPI |
| API models | Pydantic |
| ASGI server | Uvicorn |
| Networking | Python `socket` + `ssl` |
| Certificate parsing | `cryptography` |
| API format | REST + JSON |
| Backend testing | pytest |
| Frontend testing | Vitest + Testing Library |
| Version control | Git + GitHub |
| CI | GitHub Actions |
| Security scoring | Rule-based Python implementation |
| Database | None for MVP |

## Why These Technologies

React + TypeScript supports a typed dashboard with reusable components and API-aligned data models.

Vite keeps local development and builds lightweight.

FastAPI provides a small REST layer, Pydantic validation, and useful local OpenAPI docs.

Python `socket` and `ssl` allow the project to demonstrate real DNS/TCP/TLS operations without delegating the core learning objective to an external scanner.

`cryptography` provides X.509 parsing for certificate metadata.

pytest and Vitest cover backend and frontend behavior with fast local feedback.

## Current Repository Responsibilities

```text
backend/
  app/
    api/              HTTP routes
    models/           Pydantic schemas
    security/         rules, scoring, recommendations
    services/         orchestration and URL validation
    tls/              DNS/TCP/TLS analysis
    visualization/    representative handshake data
  tests/              backend tests

frontend/
  src/
    components/       dashboard UI components
    services/         API client
    styles/           CSS
    tests/            frontend tests
    types/            API TypeScript types
    visualizer/       handshake visualizer

docs/
  api/                API contract
  architecture/       architecture and standards
  demo/               demonstration guide
  scoring/            scoring specification
```

## Backend Standards

### API Layer

Location:

```text
backend/app/api/
```

Responsibilities:

- define HTTP routes;
- receive request models;
- call service-layer functions;
- map URL validation errors to HTTP 400;
- avoid leaking stack traces or raw internal exceptions.

API routes should remain thin.

### Models

Location:

```text
backend/app/models/schemas.py
```

Responsibilities:

- represent the public API contract;
- define nullability;
- preserve snake_case field names;
- constrain status/severity/grade values where practical.

### Services

Location:

```text
backend/app/services/
```

Responsibilities:

- orchestrate URL validation, TLS analysis, scoring, and visualization;
- build success/failure response envelopes;
- keep presentation concerns out of backend logic.

### TLS Layer

Location:

```text
backend/app/tls/
```

Responsibilities:

- DNS resolution;
- TCP connection;
- TLS negotiation;
- negotiated protocol/cipher extraction;
- peer certificate retrieval.

TLS code must not calculate the final score.

### Security Layer

Location:

```text
backend/app/security/
```

Responsibilities:

- stable rule IDs;
- deterministic findings;
- score and grade calculation;
- recommendations.

Scoring methodology is documented in:

```text
docs/scoring/SECURITY_SCORING.md
```

### Visualization Data

Location:

```text
backend/app/visualization/
```

Responsibilities:

- provide representative TLS 1.2/TLS 1.3 handshake steps;
- include observed/derived values where available;
- avoid fabricated packet data.

## Frontend Standards

Frontend code should use React components with TypeScript.

Location responsibilities:

- `components/`: focused UI components;
- `visualizer/`: handshake visualization;
- `services/`: API communication;
- `types/`: shared API-aligned types;
- `styles/`: CSS;
- `tests/`: frontend test suites.

Frontend components should not:

- perform TLS/network analysis;
- duplicate backend scoring rules;
- invent successful analysis data when the backend fails;
- silently transform API field names into a different contract.

## Naming Conventions

API JSON fields use snake_case:

```text
analysis_status
resolved_ips
valid_from
valid_until
serial_number
hostname_match
self_signed
protocol_version
actual_data
rule_id
```

TypeScript may use the same snake_case names for API objects to avoid transformation mismatches.

Rule IDs use uppercase snake_case:

```text
TLS_VERSION
CERT_EXPIRY
HOSTNAME_MATCH
EXPIRY_PROXIMITY
SELF_SIGNED
CERT_IDENTITY
```

## Configuration Standard

Frontend API base URL:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Local development and tests default to `http://127.0.0.1:8000` when the variable is absent.

Production frontend builds/runtime must define `VITE_API_BASE_URL` explicitly.

Document local-only settings in:

```text
frontend/.env.example
```

Do not commit `.env`.

## API Contract Discipline

The API contract is defined in:

```text
docs/api/API_CONTRACT.md
```

When a field or response behavior changes:

1. update the API contract;
2. update backend Pydantic models;
3. update backend producers;
4. update frontend TypeScript types;
5. update frontend consumers;
6. update tests;
7. run backend and frontend validation.

Do not silently rename fields, change nullability, or alter response envelopes on only one side.

## No-Fake-Data Rule

Do not fabricate:

- TLS version;
- cipher suite;
- certificate issuer;
- certificate validity dates;
- resolved IPs;
- security evidence;
- packet contents;
- successful handshake data after failure.

Use `null`, `[]`, or a structured failure response.

## Security Honesty Rules

- The visualizer is representative protocol visualization, not packet capture.
- `self_signed: false` does not prove a trusted CA chain.
- The score is educational, not a complete security rating.
- The backend currently lacks public-deployment SSRF hardening.
- Do not claim revocation, CT log, browser trust, or complete certificate-chain validation unless implemented.

## Testing Standard

Backend tests should cover:

- URL validation;
- service success and failure behavior;
- API response structure;
- scoring rules;
- grade boundaries;
- failure envelope shape.

Frontend tests should cover:

- URL input behavior;
- loading state;
- error state;
- successful result rendering;
- security score rendering;
- certificate rendering;
- visualizer entry behavior;
- API failure handling.

Recommended local quality gate:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

```powershell
cd frontend
npm run test
npm run lint
npm run build
```

CI should run the same major checks.

## Git Workflow

Use feature/fix/docs branches for work intended for review.

Examples:

```text
feature/tls-analyzer
feature/security-scoring
feature/handshake-visualizer
feature/frontend-dashboard
fix/frontend-env
docs/scoring-spec
```

Commit style:

```text
feat: add certificate parser
fix: handle TLS connection timeout
test: add URL validation tests
docs: update API contract
refactor: separate scoring rules
chore: configure CI
```

Pull requests should:

- explain the change;
- identify affected modules;
- mention validation commands;
- avoid unrelated edits;
- call out API contract changes explicitly.

## Branch And PR Expectations

`main` should remain buildable.

Do not push experimental work directly to `main` when working as a team.

Before opening or merging a PR:

```powershell
git status
git diff
```

Run relevant tests/builds. Avoid committing:

- `.env`;
- virtual environments;
- `node_modules`;
- frontend `dist`;
- caches;
- credentials;
- private keys;
- machine-specific files.

## Code Ownership

Primary ownership areas:

- network/TLS backend;
- certificate parsing;
- security scoring;
- frontend dashboard;
- handshake visualizer;
- integration/testing/documentation.

Shared files require extra care:

```text
docs/api/API_CONTRACT.md
backend/app/models/schemas.py
frontend/src/types/analysis.ts
frontend/src/services/api.ts
```

Coordinate before changing shared contracts.

## Dependency Discipline

Backend dependencies belong in:

```text
backend/requirements.txt
```

Frontend dependencies belong in:

```text
frontend/package.json
frontend/package-lock.json
```

Avoid broad dependency upgrades during feature work. Add dependencies only when they materially simplify or strengthen the implementation.

## CORS And Local Development

The backend should allow known local frontend origins for development.

Do not open CORS broadly for a public deployment without a clear security decision.

## Security Boundary For Public Deployment

The backend performs outbound network requests based on user-provided URLs.

Before exposing it publicly, add:

- SSRF protections;
- destination IP validation after DNS resolution;
- connection limits;
- request timeouts;
- response-size controls where relevant;
- rate limiting;
- safe logging;
- deployment-specific CORS;
- careful exception handling.

The application should never expose arbitrary internal network access through `/analyze`.

## Technologies Intentionally Excluded From MVP

The MVP does not require:

- database;
- Docker;
- Kubernetes;
- cloud deployment;
- authentication;
- browser extension;
- raw packet-capture stack;
- complex distributed architecture.

These can be considered later only when a concrete requirement justifies them.

## Documentation Standard

Documentation ownership:

| Document | Purpose |
|---|---|
| `README.md` | project entry point and quick orientation |
| `docs/PROJECT_CONTEXT.md` | current scope, status, and repository orientation |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` | authoritative system architecture |
| `docs/architecture/TECH_STACK_AND_DEVELOPMENT_STANDARD.md` | engineering/development standards |
| `docs/api/API_CONTRACT.md` | authoritative API contract |
| `docs/scoring/SECURITY_SCORING.md` | authoritative scoring specification |
| `docs/demo/DEMO_GUIDE.md` | demonstration instructions |

When implementation changes a user-visible behavior, API field, architecture boundary, scoring rule, setup command, or validation command, review the corresponding document.

## AI-Assisted Development Standard

AI-generated changes remain the team's responsibility.

For AI-assisted work:

1. understand the generated code before keeping it;
2. verify imports and dependencies;
3. run relevant tests/build commands;
4. review the diff;
5. confirm module ownership boundaries;
6. update documentation when behavior changes.

Useful task prompt structure:

```text
Context:
What the project already contains.

Task:
Exactly what should be implemented.

Constraints:
Language, framework, API contract, ownership boundaries.

Expected files:
Which files may be changed.

Validation:
Which commands/tests must pass.
```

## Engineering Principle

Prefer:

```text
simple architecture
+ clear ownership
+ real networking concepts
+ reproducible testing
+ honest technical claims
+ documented interfaces
```

over unnecessary complexity.
