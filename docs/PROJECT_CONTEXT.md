# Project Context

## Project

**TLS/SSL Handshake Visualizer & Website Security Analyzer** is a Computer Networks course project that demonstrates how HTTPS communication works by combining:

- DNS hostname resolution;
- TCP connection establishment;
- TLS negotiation;
- X.509 certificate inspection;
- rule-based website security analysis;
- interactive TLS handshake visualization.

The repository contains a client-server web application: a React frontend and a FastAPI backend.

## Current MVP

The MVP accepts an HTTPS website URL and analyzes the target TLS connection.

The backend currently:

1. validates submitted URLs;
2. requires HTTPS;
3. rejects credentials in URLs;
4. supports explicit port `443` only;
5. resolves the hostname;
6. opens a TCP connection;
7. performs TLS negotiation through Python `ssl`;
8. obtains the negotiated TLS version;
9. obtains cipher suite information;
10. retrieves and parses the peer certificate;
11. extracts certificate subject, issuer, validity dates, SAN, and serial number;
12. derives hostname-match and apparent self-signed fields;
13. runs deterministic security scoring;
14. returns structured `/analyze` JSON;
15. returns structured failure responses when analysis cannot complete.

The frontend currently:

1. provides a URL analysis workflow;
2. calls the backend through `frontend/src/services/api.ts`;
3. uses TypeScript types mirroring the API contract;
4. renders loading, error, empty, and success states;
5. displays target, network, TLS, certificate, score, findings, and recommendations;
6. renders a TLS handshake visualizer entry and visualizer support modules.

## Technical Honesty

The current MVP does not capture raw TLS packets.

The backend observes negotiated TLS and certificate information through high-level networking APIs. The visualizer represents the TLS protocol sequence conceptually and enriches it with backend-observed values where available.

The project should be described as:

```text
A real TLS connection analyzer with a representative TLS protocol-sequence visualizer.
```

It should not be described as:

```text
A packet sniffer, packet capture tool, or browser network trace replacement.
```

## Certificate Trust Boundary

The `self_signed` value is derived from certificate subject and issuer metadata.

Meaning:

- `true`: subject and issuer match, so the certificate appears self-signed;
- `false`: subject and issuer differ, so it does not appear self-signed;
- `null`: this could not be determined.

This does not establish full certificate-chain trust, revocation status, Certificate Transparency status, or browser trust.

## Architecture Orientation

```text
User
  |
  v
React + TypeScript frontend
  |
  | POST /analyze
  v
FastAPI backend
  |
  +-- URL validation
  +-- DNS resolution
  +-- TCP connection
  +-- TLS negotiation
  +-- certificate parsing
  +-- security scoring
  +-- visualization data assembly
  |
  v
Structured JSON response
  |
  +-- dashboard
  +-- findings/recommendations
  +-- handshake visualizer
```

Detailed architecture belongs in [architecture/SYSTEM_ARCHITECTURE.md](architecture/SYSTEM_ARCHITECTURE.md).

## Technology Stack

Frontend:

- React;
- TypeScript;
- Vite;
- CSS;
- Vitest and Testing Library.

Backend:

- Python;
- FastAPI;
- Uvicorn;
- Pydantic;
- Python `socket`;
- Python `ssl`;
- `cryptography`;
- pytest.

CI:

- GitHub Actions backend validation;
- GitHub Actions frontend validation.

Development standards belong in [architecture/TECH_STACK_AND_DEVELOPMENT_STANDARD.md](architecture/TECH_STACK_AND_DEVELOPMENT_STANDARD.md).

## Repository Structure

```text
backend/    FastAPI app, TLS analysis, certificate parsing, scoring, tests
frontend/   React dashboard, API client, visualizer, tests
docs/       API, architecture, scoring, project context, demo guidance
.github/    CI workflow and code-owner metadata
```

## API Contract

The shared API contract is maintained in:

```text
docs/api/API_CONTRACT.md
```

Main endpoints:

```text
GET  /health
POST /analyze
```

The API uses JSON, snake_case field names, explicit nullability, and an `analysis_status` field to distinguish success, partial data, and failure.

## Component Ownership

Backend network/TLS analysis owns:

- URL validation;
- DNS/TCP/TLS operations;
- TLS version and cipher extraction;
- certificate retrieval;
- analysis orchestration.

Certificate parsing owns:

- X.509 metadata extraction;
- hostname match;
- apparent self-signed derivation.

Security analysis owns:

- rule IDs;
- scoring weights;
- grade calculation;
- findings;
- recommendations.

Frontend dashboard owns:

- user input;
- API state;
- result presentation;
- loading/error states;
- visualizer entry points.

Visualizer owns:

- TLS 1.2/TLS 1.3 representative protocol sequence rendering;
- client/server message presentation;
- animation/interaction.

Integration and quality owns:

- frontend/backend compatibility;
- API contract verification;
- failure-path behavior;
- CI and local validation.

## Development Boundaries

Shared interfaces should be modified carefully:

```text
docs/api/API_CONTRACT.md
backend/app/models/schemas.py
frontend/src/types/analysis.ts
frontend/src/services/api.ts
```

When a response field changes, update the contract, backend model, producer, frontend type, consumer, and tests together.

Do not move TLS analysis into the frontend. Do not duplicate backend score calculations in React.

## MVP Scope

Included:

- HTTPS URL analysis;
- DNS resolution;
- TCP/TLS connection;
- TLS version detection;
- cipher suite information;
- certificate metadata;
- hostname matching;
- certificate validity checks;
- apparent self-signed detection;
- deterministic scoring;
- findings and recommendations;
- React dashboard;
- representative TLS handshake visualization;
- automated backend/frontend validation.

Not included:

- raw packet capture;
- complete certificate-chain validation;
- revocation checks;
- CT log checks;
- HSTS or HTTP-header scoring;
- historical scan storage;
- public deployment hardening.

## Future Scope

Potential future extensions include:

- certificate-chain visualization;
- HTTP security-header analysis;
- HSTS analysis;
- certificate revocation checks;
- CT log checks;
- report export;
- historical comparisons;
- raw packet-level visualization as a separate capability;
- public deployment mode with SSRF protections.

## Current Status

The repository currently contains a working local MVP with:

- backend API;
- frontend dashboard;
- shared API contract and types;
- scoring engine;
- visualization data and UI;
- backend tests;
- frontend tests;
- lint/build validation;
- CI workflow.

Current known gaps are documented in the README and detailed owner documents.

## Documentation Ownership

| Document | Ownership |
|---|---|
| `README.md` | Project entry point and quick orientation |
| `docs/PROJECT_CONTEXT.md` | Current scope, status, and repository orientation |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` | Authoritative system architecture |
| `docs/architecture/TECH_STACK_AND_DEVELOPMENT_STANDARD.md` | Development and engineering standards |
| `docs/api/API_CONTRACT.md` | Authoritative API contract |
| `docs/scoring/SECURITY_SCORING.md` | Authoritative scoring specification |
| `docs/demo/DEMO_GUIDE.md` | Demonstration instructions |

## Project Principle

Prioritize:

1. correct networking concepts;
2. clear separation of responsibilities;
3. honest representation of observed versus derived data;
4. deterministic security analysis;
5. maintainable code;
6. reproducible setup;
7. tested integration;
8. clear educational demonstration of HTTPS/TLS.
