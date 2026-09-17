# System Architecture

## Purpose

This document is the authoritative architecture reference for the TLS/SSL Handshake Visualizer & Website Security Analyzer.

It explains how the current system is structured, which layer owns each responsibility, where integration boundaries exist, and which technical claims are supported by the implementation.

## Architecture Decision

The project is a client-server web application with four logical areas:

```text
Frontend
  React + TypeScript + Vite
  URL input, dashboard, error/loading states, visualizer UI

Backend API
  FastAPI + Pydantic
  request validation, response modeling, HTTP status behavior

Network/TLS Analysis
  Python socket + ssl + cryptography
  DNS, TCP, TLS negotiation, certificate parsing

Security + Visualization Data
  deterministic scoring rules and representative handshake steps
```

The frontend owns presentation and interaction. The backend owns network analysis and derived security data. The API contract is the boundary between them.

## Architecture Goals

The architecture should:

1. demonstrate real Computer Networks concepts;
2. keep backend network logic independent of frontend UI;
3. keep scoring independent of network transport code;
4. keep visualization rendering independent of raw TLS implementation details;
5. make integration predictable through a stable API contract;
6. preserve a clean path for testing;
7. allow future extensions without rewriting the MVP;
8. avoid unsupported technical claims.

## Complete Runtime Flow

For a target such as:

```text
https://example.com
```

the runtime flow is:

```text
User enters URL
      |
      v
React captures URL
      |
      v
frontend/src/services/api.ts sends POST /analyze
      |
      v
FastAPI route receives AnalyzeRequest
      |
      v
URL validator normalizes and validates target
      |
      v
TLS analyzer resolves DNS and opens TCP connection to port 443
      |
      v
Python ssl performs TLS negotiation
      |
      v
Backend reads negotiated TLS version, cipher, and peer certificate
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
AnalyzeResponse is returned as JSON
      |
      v
React renders dashboard and visualizer
```

This is the central project story.

## Networking Stack

The project demonstrates how HTTPS is layered:

```text
Application
    |
    | HTTPS
    v
Security
    |
    | TLS
    v
Transport
    |
    | TCP
    v
Internet
    |
    | IP
    v
Network Interface
```

DNS happens before the TCP/TLS connection so the backend can resolve the hostname to IP addresses.

Important distinction:

```text
DNS resolution != TCP three-way handshake != TLS handshake
```

The operating system and Python libraries perform the low-level TCP mechanics. The application establishes a TCP connection and inspects the resulting TLS session through supported APIs.

## DNS

Given a hostname:

```text
example.com
```

the backend resolves it to one or more IP addresses:

```text
hostname -> DNS resolution -> IP address list
```

The resolved IPs are exposed in the `network.resolved_ips` response field when analysis succeeds.

The project does not implement a custom DNS resolver. It uses operating-system/Python facilities through the TLS analysis layer.

## TCP

HTTPS normally uses TCP port 443.

Conceptual TCP setup:

```text
Client                         Server

SYN ---------------------------->
    <---------------------- SYN-ACK
ACK ---------------------------->
```

The MVP does not manually construct TCP packets. It uses Python networking APIs to connect to the target and applies timeouts so slow or unreachable targets do not hang the app indefinitely.

## TLS Connection

After TCP connectivity exists:

```text
TCP socket
    |
    v
TLS wrapper
    |
    v
TLS negotiation
    |
    v
secure TLS session
```

The backend currently obtains:

- negotiated TLS version;
- negotiated cipher suite;
- cipher bit information where available;
- peer certificate;
- certificate metadata;
- controlled failure state when the connection cannot complete.

The project does not implement cryptographic primitives manually.

## TLS 1.2 And TLS 1.3 Visualization

The visualizer supports representative TLS 1.2 and TLS 1.3 sequences.

Simplified TLS 1.2 sequence:

```text
Client                                  Server

ClientHello  ------------------------>

              <---------------------- ServerHello
              <---------------------- Certificate
              <---------------------- ServerKeyExchange*
              <---------------------- ServerHelloDone

ClientKeyExchange -------------------->
ChangeCipherSpec --------------------->
Finished ----------------------------->

              <---------------------- ChangeCipherSpec
              <---------------------- Finished
```

Simplified TLS 1.3 sequence:

```text
Client                                  Server

ClientHello  ------------------------>

              <---------------------- ServerHello
              <---------------------- EncryptedExtensions
              <---------------------- Certificate*
              <---------------------- CertificateVerify*
              <---------------------- Finished

Finished     ------------------------->
```

`*` means exact messages depend on negotiated configuration.

## Visualization Limitation

The MVP uses high-level TLS APIs.

It can reliably obtain:

- negotiated TLS version;
- negotiated cipher;
- peer certificate;
- certificate metadata;
- connection success/failure.

It does not capture every raw TLS packet or every byte of every handshake message.

Correct description:

```text
An interactive visualization of the TLS protocol sequence, enriched with real values obtained from the target server.
```

Incorrect description:

```text
A packet-level TLS capture or packet sniffer.
```

If raw packet capture is added later, it should be treated as a separate architecture and security boundary.

## Backend Logical Architecture

Current backend structure:

```text
backend/app/
├── main.py
├── api/
│   └── routes/
│       ├── analyze.py
│       └── health.py
├── models/
│   └── schemas.py
├── security/
│   ├── recommendations.py
│   ├── rules.py
│   └── scorer.py
├── services/
│   ├── analysis_service.py
│   └── url_validator.py
├── tls/
│   ├── analyzer.py
│   └── connection.py
└── visualization/
    ├── builder.py
    └── protocol_steps.py
```

## Backend Request Flow

```text
HTTP request
    |
    v
API route
    |
    v
Pydantic request model
    |
    v
analysis service
    |
    +-- URL validator
    +-- TLS analyzer
    +-- security scorer
    +-- visualization builder
    |
    v
Pydantic response model
    |
    v
JSON response
```

Routes should stay thin. They should not contain TLS, certificate, scoring, or visualizer logic.

## API Layer

Main files:

- `backend/app/api/routes/analyze.py`
- `backend/app/api/routes/health.py`
- `backend/app/models/schemas.py`

Responsibilities:

- expose `GET /health`;
- expose `POST /analyze`;
- map validation errors to HTTP 400;
- return `AnalyzeResponse` objects;
- prevent internal exceptions from leaking as stack traces.

## Analysis Service

Main file:

```text
backend/app/services/analysis_service.py
```

Responsibilities:

- coordinate validation, TLS analysis, scoring, and visualization;
- build the success response envelope;
- convert expected analysis failures into structured `FAILED` responses;
- ensure failure responses do not contain fabricated TLS, certificate, security, or success-like data.

The analysis service is an orchestration layer. It should not contain frontend presentation logic.

## TLS Analyzer

Main files:

- `backend/app/tls/analyzer.py`
- `backend/app/tls/connection.py`

Responsibilities:

1. receive a hostname;
2. resolve/connect;
3. establish TLS;
4. obtain negotiated TLS version;
5. obtain negotiated cipher information;
6. obtain peer certificate;
7. return structured analysis data;
8. raise controlled errors for service-level handling.

It must not calculate the final security score.

## Certificate Parser

Current certificate parsing support is part of the TLS/certificate analysis path.

Responsibilities:

- parse X.509 certificate data;
- extract subject;
- extract issuer;
- extract validity period;
- extract Subject Alternative Names;
- extract serial number;
- derive hostname-match status;
- derive apparent self-signed status from subject/issuer metadata.

Self-signed detection is not full certificate-chain validation.

## Security Engine

Main files:

- `backend/app/security/rules.py`
- `backend/app/security/scorer.py`
- `backend/app/security/recommendations.py`

Conceptual pipeline:

```text
TLS + certificate data
          |
          v
      rule engine
          |
          +-- findings
          +-- recommendations
          +-- score
          +-- grade
```

The security engine must be deterministic:

```text
same input -> same findings, score, grade, and recommendations
```

It must not open network connections.

The backend is the single source of truth for scoring. The frontend renders the score; it does not recalculate it.

## Visualization Data Builder

Main files:

- `backend/app/visualization/builder.py`
- `backend/app/visualization/protocol_steps.py`

Responsibilities:

- choose a representative TLS sequence based on negotiated protocol version;
- attach observed or defensibly derived values into `actual_data`;
- return `VisualizationInfo` compatible with the API contract.

Visualization data should never fabricate raw packet content.

## Frontend Architecture

Current frontend structure:

```text
frontend/src/
├── App.tsx
├── components/
│   ├── AnalysisSummary.tsx
│   ├── CertificateDetails.tsx
│   ├── EmptyState.tsx
│   ├── ErrorMessage.tsx
│   ├── FindingsList.tsx
│   ├── HandshakeVisualizerEntry.tsx
│   ├── LoadingState.tsx
│   ├── Recommendations.tsx
│   ├── SecurityScore.tsx
│   ├── TlsDetails.tsx
│   └── UrlAnalyzer.tsx
├── services/
│   └── api.ts
├── styles/
│   └── dashboard.css
├── tests/
├── types/
│   └── analysis.ts
└── visualizer/
```

## Frontend State

The application follows a simple UI state machine:

```text
idle -> loading -> success
              \-> error
```

State is managed in `frontend/src/App.tsx`.

Core frontend state:

- current analysis status;
- current target URL;
- latest `AnalyzeResponse`;
- current error message/code.

## Dashboard Architecture

The dashboard renders backend response sections through focused components:

| Component | Data |
|---|---|
| `UrlAnalyzer` | user target input |
| `AnalysisSummary` | target and network data |
| `TlsDetails` | TLS version and cipher data |
| `CertificateDetails` | certificate metadata |
| `SecurityScore` | score and grade |
| `FindingsList` | security findings |
| `Recommendations` | recommendations |
| `HandshakeVisualizerEntry` | visualization summary/entry |
| `ErrorMessage` | failure state |
| `LoadingState` | in-progress state |
| `EmptyState` | initial state |

The dashboard should not perform direct TLS operations or calculate security findings.

## Visualizer Architecture

The visualizer receives data rather than calling the API directly.

Correct:

```text
API service
   |
   v
App state
   |
   v
HandshakeVisualizerEntry / visualizer props
```

Avoid:

```text
Visualizer component -> fetch("/analyze")
```

The visualizer renders the representative protocol sequence selected by backend-provided visualization data.

## API Client Boundary

Main file:

```text
frontend/src/services/api.ts
```

Responsibilities:

- read `VITE_API_BASE_URL` when provided;
- use local dev/test default `http://127.0.0.1:8000`;
- require explicit base URL in production builds/runtime;
- call `POST /analyze`;
- return `AnalyzeResponse`;
- convert transport/backend HTTP failures into frontend failure responses without fake success data.

## Shared Type Boundary

Main file:

```text
frontend/src/types/analysis.ts
```

The TypeScript types mirror:

```text
backend/app/models/schemas.py
docs/api/API_CONTRACT.md
```

Any intentional API change should update all three layers.

## Security Score Ownership

The backend owns:

- rule evaluation;
- penalties;
- score;
- grade;
- finding statuses;
- severities;
- recommendations.

The frontend owns:

- rendering those values;
- formatting;
- error/loading display.

There must be one scoring source of truth.

## Error Architecture

The current implementation distinguishes:

- invalid user input;
- expected target-analysis failure;
- unexpected backend failure;
- frontend/backend transport failure.

HTTP behavior:

- invalid URL/input: HTTP 400;
- expected target analysis failure: HTTP 200 with `analysis_status: "FAILED"`;
- unexpected route-level failure: HTTP 500;
- frontend fetch failure: local `FAILED` response with `CONNECTION_FAILED`.

Current backend analysis failure codes include:

```text
CONNECTION_TIMEOUT
NETWORK_ERROR
ANALYSIS_ERROR
```

The frontend may also handle local or legacy display codes for user-friendly hints.

Controlled errors should not expose Python stack traces, internal file paths, secrets, or raw exception details.

## Integration Boundaries

Major boundaries:

```text
Frontend <-> Backend API
Backend route <-> analysis service
analysis service <-> TLS analyzer
analysis service <-> security scorer
analysis service <-> visualization builder
backend schemas <-> frontend types
```

Each boundary should have a documented contract or type.

## Single Source Of Truth

Authoritative sources:

| Concern | Source |
|---|---|
| API shape | `docs/api/API_CONTRACT.md` |
| Backend response model | `backend/app/models/schemas.py` |
| Frontend API types | `frontend/src/types/analysis.ts` |
| Scoring behavior | `backend/app/security/scorer.py` and `docs/scoring/SECURITY_SCORING.md` |
| Visualization semantics | `backend/app/visualization/` and this architecture document |

Do not duplicate backend rules in frontend UI code.

## Security And SSRF Boundary

The backend connects to user-supplied destinations. This is an important security boundary.

Current MVP controls:

- HTTPS scheme required;
- credentials rejected;
- explicit port must be `443`;
- hostname required;
- network timeouts;
- structured failure behavior.

Before public deployment, add:

- private/loopback/link-local/multicast destination blocking after DNS resolution;
- redirect policy decisions;
- request rate limiting;
- response-size and timeout controls;
- safe logging;
- deployment-specific CORS restrictions.

The application should never become a public arbitrary internal-network probe.

## Vertical Slice Strategy

The system should prioritize the working path:

```text
URL input
   |
   v
POST /analyze
   |
   v
real TLS connection
   |
   v
certificate metadata
   |
   v
score/findings
   |
   v
JSON response
   |
   v
dashboard + visualizer
```

Future modules should extend this path without destabilizing it.

## Definition Of Done

A feature is done when:

- it follows the documented ownership boundaries;
- it preserves or intentionally updates the API contract;
- it has appropriate failure behavior;
- it does not fabricate unavailable data;
- relevant backend/frontend tests pass;
- documentation is updated when behavior changes;
- another team member can consume it without reading private notes.

## Architecture Summary

```text
             User
              |
              v
       React frontend
              |
              | JSON
              v
          FastAPI
              |
      +-------+-------+
      |       |       |
      v       v       v
    TLS   Certificate Security
 analyzer   parser     scorer
      |       |       |
      +-------+-------+
              |
              v
       Unified response
              |
              v
 Dashboard + visualizer
```

This architecture is the baseline for current development and documentation.
