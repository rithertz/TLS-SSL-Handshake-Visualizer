# Technology Stack & Development Standard

## 1. Purpose

This document defines the technology stack, development standards, runtime boundaries, and engineering conventions for the **TLS/SSL Handshake Visualizer & Website Security Analyzer**.

The stack is intentionally kept simple enough for a university networking project while still providing meaningful implementation and resume value.

---

## 2. Selected Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | CSS |
| Backend | Python + FastAPI |
| ASGI Server | Uvicorn |
| Networking | Python `socket` + `ssl` |
| Certificate Parsing | Python `cryptography` |
| API Format | REST + JSON |
| Backend Testing | pytest |
| Frontend Testing | Vitest |
| Version Control | Git + GitHub |
| Security Scoring | Rule-based Python implementation |
| Database | None for MVP |
| Deployment | Not required for MVP |

The project uses a client-server architecture. The React frontend sends an HTTPS target URL to the FastAPI backend. The backend performs DNS resolution, establishes the TCP/TLS connection, extracts TLS and certificate information, runs security checks, and returns one structured JSON response.

---

## 3. Why These Technologies Were Selected

### React + TypeScript + Vite

React provides a component-based frontend suitable for:

- URL analysis input
- security score dashboard
- certificate information cards
- TLS information display
- handshake visualization
- findings and recommendations

TypeScript provides static type checking for the API response and UI state.

Vite provides a lightweight development server and build system.

### Python + FastAPI

Python is well suited to networking and certificate inspection. FastAPI provides:

- REST endpoint support
- request/response validation through Pydantic
- automatic OpenAPI documentation
- straightforward integration with Python networking libraries

### `socket` + `ssl`

The project intentionally uses Python's standard networking APIs rather than a high-level external TLS scanner.

`socket` is used for hostname resolution and TCP connectivity.

`ssl` is used to create a TLS client connection and obtain negotiated TLS information and the peer certificate.

### `cryptography`

The `cryptography` package is used to parse the X.509 certificate and extract fields such as:

- subject
- issuer
- validity period
- Subject Alternative Names
- serial number
- self-signed status

### pytest

pytest is used for backend unit and integration testing.

### Vitest

Vitest is the planned frontend test framework for React/TypeScript components and utility functions.

---

## 4. Current Repository Structure

```text
TLS-SSL-Handshake-Visualizer/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── analyze.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   ├── tls/
│   │   │   ├── connection.py
│   │   │   └── analyzer.py
│   │   ├── certificate/
│   │   │   └── parser.py
│   │   ├── security/
│   │   │   ├── scorer.py
│   │   │   └── rules.py
│   │   └── services/
│   │       ├── analysis_service.py
│   │       └── url_validator.py
│   ├── tests/
│   │   ├── integration/
│   │   └── unit/
│   ├── requirements.txt
│   └── .venv/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── AnalyzeForm.tsx
│   │   ├── visualizer/
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── analysis.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── demo/
│   └── scoring/
├── scripts/
├── README.md
└── .gitignore
```

The exact structure may grow as the feature modules are implemented. New files should follow the ownership and module boundaries described in the project documentation.

---

## 5. Backend Development Standard

Backend code should be organized by responsibility.

### API Layer

`backend/app/api/`

Responsible for:

- HTTP routes
- request handling
- HTTP-level validation/errors
- mapping service results to API responses

API routes should not contain the actual TLS-analysis logic.

### Models

`backend/app/models/`

Contains Pydantic request and response models.

The API contract in `docs/api/API_CONTRACT.md` is the source of truth for externally visible request and response structures.

### TLS Layer

`backend/app/tls/`

Responsible for:

- hostname resolution
- TCP/TLS connection establishment
- negotiated TLS information
- TLS connection-related operations

### Certificate Layer

`backend/app/certificate/`

Responsible for X.509 parsing and certificate-specific extraction.

### Security Layer

`backend/app/security/`

Responsible for:

- security rules
- finding generation
- security score calculation
- grade calculation
- recommendations

The current scorer is a baseline implementation. The final scoring methodology should be documented separately in `docs/scoring/SCORING_METHODOLOGY.md`.

### Services

`backend/app/services/`

Coordinates multiple backend components into application-level workflows.

`analysis_service.py` currently coordinates URL validation, TLS analysis, and security scoring.

---

## 6. Frontend Development Standard

Frontend code should use React components with TypeScript.

Responsibilities should remain separated:

- `components/` — reusable UI components
- `visualizer/` — handshake visualization
- `services/` — API communication
- `types/` — shared frontend TypeScript types

The frontend should consume the backend API rather than reimplementing TLS or certificate logic.

The frontend should not contain security-scoring rules that duplicate backend logic.

---

## 7. Networking and TLS Boundary

The backend performs the actual network analysis.

The intended flow is:

```text
React UI
   |
   | POST /analyze
   v
FastAPI
   |
   v
URL validation
   |
   v
DNS resolution
   |
   v
TCP connection :443
   |
   v
TLS negotiation
   |
   +--> TLS version
   +--> Cipher suite
   +--> Peer certificate
            |
            v
       X.509 parsing
            |
            v
       Security scoring
            |
            v
      Unified JSON response
```

### Important Technical Limitation

The MVP does **not** capture raw TLS packets.

The handshake visualizer represents the protocol sequence and enriches the steps with information obtained from the real TLS connection.

Therefore, the project should not claim to be a packet sniffer or packet-level TLS analyzer unless packet capture is implemented in a future version.

---

## 8. URL Validation

The backend accepts HTTPS website targets.

Current validation rules include:

- HTTPS scheme required
- credentials in the URL are rejected
- only port `443` is accepted
- hostname must be present
- URL paths are allowed

Network operations should use explicit timeouts.

For a future public deployment, the backend must additionally protect against SSRF by rejecting loopback, private, link-local, multicast, and other inappropriate destinations after DNS resolution.

---

## 9. Certificate and TLS Inspection

The analyzer currently extracts information including:

### Network

- resolved IP addresses

### TLS

- negotiated TLS version
- negotiated cipher suite
- cipher security bits where available

### Certificate

- subject
- issuer
- validity start
- validity end
- Subject Alternative Names
- serial number
- hostname match
- self-signed status

Certificate parsing and hostname matching should remain isolated from the API layer.

---

## 10. Security Scoring Standard

The security engine is rule based.

Each rule should have:

- stable rule ID
- status
- severity
- title
- explanation
- evidence

The scoring engine converts the findings into:

- numerical score from 0–100
- security grade
- recommendations

The baseline implementation currently evaluates TLS version, certificate validity, hostname matching, and self-signed status.

The final rule weights and methodology belong in:

```text
docs/scoring/SCORING_METHODOLOGY.md
```

The scoring engine should remain deterministic for the same analysis result.

---

## 11. API Contract Discipline

The API contract is defined separately in:

```text
docs/api/API_CONTRACT.md
```

Frontend and backend developers should implement against that contract.

If a field or response structure needs to change:

1. Discuss the change with the team.
2. Update the API contract.
3. Update backend models.
4. Update frontend TypeScript types.
5. Update tests.
6. Verify the complete frontend-backend flow.

Do not silently change response structures on one side only.

---

## 12. Error Handling

Expected analysis failures should be represented by the structured API response where possible.

Examples include:

- DNS resolution failure
- TCP connection failure
- TLS negotiation failure
- timeout
- certificate-related analysis failure

The response should provide a meaningful error code and message rather than exposing an internal Python traceback.

Unexpected programming errors should still be handled safely by the API layer.

---

## 13. Timeouts and Reliability

External network operations must not be allowed to hang indefinitely.

The implementation should use explicit connection/operation timeouts.

The analyzer should fail gracefully when a target:

- does not resolve
- refuses the connection
- times out
- does not complete TLS negotiation
- returns unusable certificate information

---

## 14. Testing Standard

### Backend

Use pytest for:

- URL validation
- certificate parsing
- hostname matching
- scoring rules
- service behavior
- API integration

### Frontend

Use Vitest for:

- component behavior
- API/service utilities
- visualization data handling
- important UI states

### Minimum Quality Gate

Before a feature is merged:

```text
Backend tests pass
Frontend build passes
No obvious TypeScript errors
No uncommitted accidental files
API contract remains consistent
```

The project should eventually run these checks automatically in GitHub Actions for pushes and pull requests.

---

## 15. Git and GitHub Standard

The repository uses GitHub as the shared source of truth.

### Branching

Use feature branches rather than committing feature work directly to `main`.

Example:

```text
main
├── feature/tls-analyzer
├── feature/security-scoring
├── feature/handshake-visualizer
├── feature/frontend-dashboard
└── feature/testing-docs
```

Branch names should clearly describe the work.

### Commits

Use concise, meaningful commit messages.

Preferred style:

```text
feat: add certificate parser
fix: handle TLS connection timeout
test: add URL validation tests
docs: update API contract
refactor: separate scoring rules
chore: configure CI
```

### Pull Requests

Feature branches should be merged through pull requests.

A PR should:

- explain what changed
- identify important implementation details
- mention tests/build checks
- avoid unrelated changes

As CI is added, required checks should be used to protect `main`.

---

## 16. Dependency and Environment Management

Backend dependencies are recorded in:

```text
backend/requirements.txt
```

The local Python virtual environment is:

```text
backend/.venv/
```

The virtual environment must not be committed to Git.

Frontend dependencies are managed by npm through:

```text
frontend/package.json
frontend/package-lock.json
```

`node_modules/` must not be committed.

Environment-specific secrets or configuration should use environment variables and `.env` files. `.env` files containing secrets must not be committed.

A `.env.example` file may document required configuration without containing secrets.

---

## 17. Local Development

### Backend

From the repository root:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

The backend runs on:

```text
http://127.0.0.1:8000
```

Health check:

```text
GET /health
```

### Frontend

In another PowerShell terminal:

```powershell
cd frontend
npm run dev
```

The Vite development server provides the frontend URL shown in the terminal.

---

## 18. CORS

During local development, the frontend and backend may run on different local origins.

If browser requests are blocked by CORS, configure FastAPI CORS middleware for the known local frontend origin.

CORS should not be opened broadly without a reason, especially in a public deployment.

---

## 19. Security Boundary

The backend performs outbound network requests based on user-provided URLs.

This is an important security boundary.

For the current local university-project MVP, the implementation focuses on HTTPS analysis and controlled inputs.

Before public deployment, the application should additionally implement:

- SSRF protection
- destination IP validation
- connection limits
- request timeouts
- response-size limits where relevant
- rate limiting
- safe logging
- careful exception handling

The application should never expose arbitrary internal network access through the analysis endpoint.

---

## 20. Logging

Logs should help diagnose:

- analysis failures
- network errors
- application errors

Logs should not expose sensitive information unnecessarily.

In particular, credentials must never be logged. The current URL validator rejects URLs containing user credentials.

---

## 21. AI-Assisted Development Standard

AI coding tools may be used by team members, but generated code remains the team's responsibility.

For AI-assisted changes:

1. Understand the generated code before committing it.
2. Verify imports and dependencies.
3. Run relevant tests/build commands.
4. Review the diff.
5. Confirm the change respects module ownership.
6. Update documentation when behavior changes.

A useful prompt structure is:

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

AI should accelerate implementation, not replace code review or understanding.

---

## 22. Module Ownership

Team members should own their major feature areas while contributing to the shared integration.

The major ownership areas are:

- TLS handshake analysis
- certificate/TLS data analysis
- security scoring
- frontend dashboard/visualization
- integration/testing/documentation

Shared foundation files should be changed carefully because multiple branches may depend on them.

Feature owners should avoid implementing another member's core feature unless the team explicitly coordinates the work.

---

## 23. Technologies Intentionally Excluded From the MVP

The project does not require:

- a database
- Docker
- Kubernetes
- a cloud deployment
- a dedicated packet-capture stack
- a browser extension
- authentication
- a complex distributed architecture

These technologies would increase project complexity without directly improving the Review-1 MVP.

They can be considered only if a later project requirement justifies them.

---

## 24. MVP Priority

### P0 — Required

- HTTPS URL input
- FastAPI `/analyze`
- DNS resolution
- TCP/TLS connection
- TLS version
- cipher suite
- certificate extraction
- baseline security score
- basic dashboard
- handshake visualization

### P1 — Important

- SAN display
- certificate expiry warnings
- detailed findings
- recommendations
- loading/error states
- backend tests
- frontend tests
- responsive UI
- GitHub documentation
- CI

### P2 — Future Enhancement

- certificate-chain visualization
- HSTS analysis
- HTTP security headers
- PDF export
- historical scans
- packet-level TLS visualization

---

## 25. Documentation Standard

The project documentation should stay synchronized with the implementation.

Important documentation locations:

```text
README.md
docs/PROJECT_CONTEXT.md
docs/api/API_CONTRACT.md
docs/architecture/SYSTEM_ARCHITECTURE.md
docs/architecture/TECH_STACK_AND_DEVELOPMENT_STANDARD.md
docs/scoring/SCORING_METHODOLOGY.md
docs/demo/DEMO_GUIDE.md
```

When implementation changes a user-visible behavior, API field, architecture boundary, scoring rule, or setup procedure, the corresponding documentation should be reviewed and updated.

Before the final project submission, perform a documentation audit across all major documents.

---

## 26. Current Status

The shared project foundation is implemented.

Currently available:

- Git/GitHub repository
- backend FastAPI application
- `/health` endpoint
- `/analyze` endpoint
- URL validation
- DNS resolution
- TLS connection
- TLS version/cipher extraction
- X.509 certificate parsing
- baseline security scoring
- frontend React/Vite application
- frontend API integration
- typed frontend API models
- initial analysis form
- basic end-to-end analysis response

The remaining major work is feature development by the respective owners, followed by integration, testing, UI refinement, documentation, and CI.

---

## 27. Engineering Principle

The project should prefer:

```text
simple architecture
+ clear ownership
+ real networking concepts
+ reproducible testing
+ honest technical claims
+ documented interfaces
```

over unnecessary complexity.

The goal is a working, understandable networking project that demonstrates TLS, PKI, DNS, TCP, HTTPS, client-server communication, and security analysis clearly.
