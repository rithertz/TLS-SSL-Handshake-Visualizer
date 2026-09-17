# TLS/SSL Handshake Visualizer & Website Security Analyzer

An educational Computer Networks project that connects DNS, TCP, TLS/SSL, X.509 certificates, HTTPS, and rule-based security analysis into one working web application.

The user enters an HTTPS website, the backend establishes a real TLS connection to that server, extracts negotiated TLS and certificate information, evaluates selected security properties, and returns a structured response for the React dashboard and TLS handshake visualizer.

## Problem Statement

TLS/SSL is central to modern Internet communication, but students often learn its parts separately:

- DNS resolution;
- TCP connection setup;
- TLS negotiation;
- cipher suites;
- X.509 certificates;
- PKI concepts;
- HTTPS application behavior.

This project demonstrates how those concepts fit together during a real HTTPS connection.

## Objectives

1. Perform live HTTPS/TLS analysis through a backend service.
2. Present network, TLS, certificate, and security results in a clear frontend dashboard.
3. Explain security findings using deterministic, testable rules.
4. Visualize the TLS 1.2 or TLS 1.3 protocol sequence using backend-provided context.
5. Preserve technical honesty by distinguishing observed data, derived data, and representative visualization data.

## Current Capabilities

- HTTPS-only URL validation.
- Rejection of credentials in URLs.
- Port 443-only analysis.
- DNS hostname resolution.
- TCP connection through Python networking APIs.
- TLS negotiation through Python `ssl`.
- Negotiated TLS version extraction.
- Cipher suite name, protocol, and bit information where available.
- Peer certificate retrieval.
- Certificate subject, issuer, validity, SAN, serial number, hostname match, and apparent self-signed status.
- Deterministic security score, grade, findings, and recommendations.
- Structured success and failure responses.
- React dashboard for target, network, TLS, certificate, scoring, findings, recommendations, and visualization entry point.
- Conceptual TLS 1.2/TLS 1.3 handshake visualization enriched with observed values.
- Backend tests, frontend tests, lint, build, and CI validation.

## Important Technical Limitations

This is a real connection analyzer, not a packet capture tool.

The backend uses Python `socket`, `ssl`, and `cryptography` APIs. It does not capture raw TLS packets or reconstruct every TLS record. The visualizer is a representative protocol sequence enriched with backend-observed values, not a packet transcript.

`self_signed` is based on certificate subject/issuer comparison. A value of `false` means the subject and issuer differ, so the certificate does not appear self-signed. It does not prove complete CA-chain trust, revocation status, Certificate Transparency status, or browser trust.

The security score is educational and explainable. It is not a formal penetration test, vulnerability scan, browser-grade certificate audit, or guarantee that a website is secure.

The current backend is appropriate for a local academic MVP. Public deployment would require SSRF protections, destination-IP restrictions, rate limiting, safe logging, and operational hardening.

## How The System Works

```text
User enters HTTPS URL
      |
      v
React frontend validates local UI state
      |
      v
POST /analyze
      |
      v
FastAPI route validates request envelope
      |
      v
URL validator checks HTTPS/host/port/credentials
      |
      v
TLS analyzer resolves DNS, opens TCP, negotiates TLS
      |
      v
Certificate parser extracts X.509 metadata
      |
      v
Security scorer evaluates deterministic rules
      |
      v
Visualization builder creates representative handshake steps
      |
      v
AnalyzeResponse JSON
      |
      v
React dashboard renders results or failure state
```

## Architecture Overview

The project uses a client-server architecture.

```text
Browser / React / TypeScript / Vite
        |
        | REST JSON
        v
FastAPI backend / Pydantic schemas
        |
        +-- URL validation
        +-- DNS + TCP + TLS analysis
        +-- certificate parsing
        +-- security scoring
        +-- visualization data assembly
        |
        v
External HTTPS server on port 443
```

Backend responsibilities:

- network operations;
- TLS/certificate observation;
- derived security properties;
- score and grade calculation;
- structured API responses.

Frontend responsibilities:

- URL input and interaction;
- loading/error/success states;
- API client behavior;
- dashboard rendering;
- visualizer presentation.

The shared boundary is documented in [docs/api/API_CONTRACT.md](docs/api/API_CONTRACT.md).

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | Component-based UI |
| Frontend language | TypeScript | API and UI type safety |
| Frontend tooling | Vite | Development server and build |
| Styling | CSS | Dashboard and visualizer styling |
| Backend | Python | Networking and application logic |
| Backend framework | FastAPI | REST API |
| API schemas | Pydantic | Request/response validation |
| Server | Uvicorn | ASGI runtime |
| Networking | Python `socket` | DNS/TCP operations |
| TLS | Python `ssl` | TLS connection and negotiated data |
| Certificates | `cryptography` | X.509 parsing |
| Backend tests | pytest | Backend validation |
| Frontend tests | Vitest + Testing Library | UI and behavior tests |
| CI | GitHub Actions | Automated validation |

## Repository Layout

```text
TLS-SSL-Handshake-Visualizer/
├── backend/
│   ├── app/
│   │   ├── api/routes/          HTTP routes
│   │   ├── models/              Pydantic API schemas
│   │   ├── security/            scoring rules and recommendations
│   │   ├── services/            analysis orchestration and validation
│   │   ├── tls/                 DNS/TCP/TLS analysis
│   │   └── visualization/       handshake step construction
│   ├── tests/                   backend tests
│   └── requirements.txt
├── frontend/
│   ├── public/                  static public assets
│   ├── src/
│   │   ├── components/          dashboard UI components
│   │   ├── services/            API client
│   │   ├── styles/              dashboard styles
│   │   ├── tests/               frontend tests
│   │   ├── types/               API TypeScript types
│   │   └── visualizer/          handshake visualizer
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── api/                     API contract
│   ├── architecture/            architecture and development standards
│   ├── demo/                    viva/demo guide
│   └── scoring/                 scoring specification
├── .github/workflows/           CI
└── README.md
```

## Quick Start

Prerequisites:

- Git
- Python 3.11+ recommended
- Node.js and npm
- modern browser

Run the backend and frontend in separate terminals.

## Backend Setup

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

Verify:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

## Frontend Setup

From a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Vite prints the local frontend URL, normally:

```text
http://localhost:5173/
```

The frontend reads `VITE_API_BASE_URL` when provided. Local development and tests default to:

```text
http://127.0.0.1:8000
```

To make the setting explicit:

```powershell
Copy-Item .env.example .env
```

Do not commit `.env`. Production frontend deployments must define `VITE_API_BASE_URL`.

## Testing And Validation

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest
```

Or, with an activated environment:

```powershell
python -m pytest
```

Frontend:

```powershell
cd frontend
npm run test
npm run lint
npm run build
```

CI currently runs backend pytest plus frontend install, tests, lint, and production build.

## Development Workflow

Recommended local workflow:

1. Check repository status with `git status`.
2. Keep work scoped to the relevant module.
3. Preserve the API contract unless a coordinated contract change is required.
4. Run the relevant backend/frontend validation commands.
5. Review the diff before sharing or committing changes.

For team branches, use focused branch names such as:

```text
feature/tls-analyzer
feature/security-scoring
feature/dashboard
feature/handshake-visualizer
fix/frontend-env
docs/api-contract
```

Use focused commits and avoid mixing unrelated code, generated files, dependency changes, and documentation rewrites.

## Engineering Rules

- Do not fabricate network, TLS, certificate, security, or visualization observations.
- Use `null` for unavailable scalar values and `[]` for empty lists.
- Keep TLS/network analysis in the backend.
- Keep security scoring in the backend.
- Keep visualizer rendering in the frontend.
- Keep the API response in snake_case.
- Do not make frontend components reimplement backend scoring rules.
- Do not describe representative visualization data as packet capture.
- Treat certificate subject/issuer comparison as an apparent self-signed check only.
- Keep `.env`, virtual environments, `node_modules`, and build outputs out of Git.

## Current MVP Scope

In scope:

- single-target HTTPS analysis;
- port 443 only;
- live TLS connection;
- current certificate metadata;
- deterministic score and grade;
- dashboard presentation;
- conceptual TLS 1.2/TLS 1.3 sequence visualization;
- local academic demonstration.

Out of scope for the current MVP:

- raw packet capture;
- browser network tracing;
- complete certificate-chain validation;
- revocation checks;
- CT log checks;
- HTTP security headers;
- HSTS analysis;
- historical scans;
- database persistence;
- user accounts;
- public deployment hardening.

## Future Scope

Potential future packages:

- certificate-chain and trust-path visualization;
- revocation and CT log checks;
- HSTS and HTTP security-header analysis;
- richer TLS configuration checks;
- browser end-to-end tests;
- historical result storage;
- exportable reports;
- packet-capture-based visualization as a separate architecture;
- SSRF-safe public deployment mode.

Future features should be added only when the backend can observe or derive the required data honestly.

## Documentation Index

| Question | Document |
|---|---|
| What does the project do? | [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) |
| How is the system structured? | [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md) |
| How do developers work on it? | [docs/architecture/TECH_STACK_AND_DEVELOPMENT_STANDARD.md](docs/architecture/TECH_STACK_AND_DEVELOPMENT_STANDARD.md) |
| What does `/analyze` return? | [docs/api/API_CONTRACT.md](docs/api/API_CONTRACT.md) |
| How is the score calculated? | [docs/scoring/SECURITY_SCORING.md](docs/scoring/SECURITY_SCORING.md) |
| How should the project be demonstrated? | [docs/demo/DEMO_GUIDE.md](docs/demo/DEMO_GUIDE.md) |

## Current Project Status

The current baseline contains a working backend, React frontend, shared API types, deterministic scoring, dashboard UI, visualizer integration, tests, and CI checks.

Known active gaps:

- public-deployment SSRF protection;
- browser-level E2E tests;
- deeper certificate-chain validation;
- broader security rules;
- successful live target analysis depends on the local network environment.

The guiding project principle remains:

> Observe real network behavior, explain it clearly, and never claim more than the system actually measures.
