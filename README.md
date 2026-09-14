# TLS/SSL Handshake Visualizer & Website Security Analyzer

> **BCSE308L - Computer Networks Project**

An educational web application that connects the theory of **DNS, TCP, TLS/SSL, X.509 certificates, PKI, and HTTPS** to a real-world website analysis workflow.

The application allows a user to enter an HTTPS website, establishes a real TLS connection to that server, extracts the negotiated TLS/certificate information, evaluates the observed security properties using explainable rules, and presents the results through an interactive dashboard and TLS handshake visualizer.

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Problem Statement](#2-problem-statement)
- [3. Objectives](#3-objectives)
- [4. How the System Works](#4-how-the-system-works)
- [5. Important Scope and Technical Honesty](#5-important-scope-and-technical-honesty)
- [6. Features](#6-features)
- [7. Architecture](#7-architecture)
- [8. Technology Stack](#8-technology-stack)
- [9. Repository Structure](#9-repository-structure)
- [10. Backend Architecture](#10-backend-architecture)
- [11. Frontend Architecture](#11-frontend-architecture)
- [12. API Contract](#12-api-contract)
- [13. Security Analysis Model](#13-security-analysis-model)
- [14. TLS Handshake Visualization](#14-tls-handshake-visualization)
- [15. MVP Scope](#15-mvp-scope)
- [16. Future Scope](#16-future-scope)
- [17. Getting Started](#17-getting-started)
- [18. Development Workflow](#18-development-workflow)
- [19. Git and Branching Guidelines](#19-git-and-branching-guidelines)
- [20. Testing Strategy](#20-testing-strategy)
- [21. Engineering Rules](#21-engineering-rules)
- [22. Team Responsibilities](#22-team-responsibilities)
- [23. Documentation](#23-documentation)
- [24. Limitations](#24-limitations)
- [25. Academic Concepts Demonstrated](#25-academic-concepts-demonstrated)
- [26. Project Status](#26-project-status)
- [27. Contributors](#27-contributors)
- [28. License](#28-license)

---

# 1. Project Overview

The **TLS/SSL Handshake Visualizer & Website Security Analyzer** is a client-server educational application designed to make the HTTPS connection process easier to understand.

A user enters an HTTPS URL such as:

```text
https://example.com
```

The backend then performs a real network/TLS analysis:

```text
URL
 │
 ▼
URL Validation
 │
 ▼
Hostname Resolution (DNS)
 │
 ▼
TCP Connection to Port 443
 │
 ▼
TLS Negotiation
 │
 ├── Negotiated TLS Version
 ├── Negotiated Cipher Suite
 └── Peer Certificate
       │
       ▼
Certificate Parsing
       │
       ├── Subject
       ├── Issuer
       ├── Validity
       ├── SAN
       └── Hostname Match
       │
       ▼
Security Scoring
       │
       ▼
Unified JSON Response
       │
       ├── Security Dashboard
       └── TLS Handshake Visualizer
```

The goal is not simply to display certificate information. The project combines several computer-networking concepts into one coherent workflow and presents the results in a form that is useful for both **learning and demonstration**.

---

# 2. Problem Statement

TLS/SSL is fundamental to modern Internet communication, but the actual process behind an HTTPS connection is often difficult to visualize.

Students commonly learn the following concepts separately:

- DNS
- TCP
- TLS/SSL
- Public Key Infrastructure (PKI)
- X.509 certificates
- Cipher suites
- HTTPS

The project addresses this gap by creating an interactive system that demonstrates how these concepts connect when a real HTTPS connection is established.

The application should answer questions such as:

- What IP address does the hostname resolve to?
- Is a TCP connection established on port 443?
- Which TLS version was negotiated?
- Which cipher suite was negotiated?
- What certificate did the server provide?
- Who issued the certificate?
- Is the certificate currently valid?
- Does the certificate match the requested hostname?
- What security findings can be derived from the observed data?
- What does the TLS handshake conceptually look like?

---

# 3. Objectives

## Primary Objectives

1. **Interactive TLS Handshake Visualization**
   - Represent the major stages of a TLS handshake.
   - Distinguish client and server actions.
   - Explain the purpose of important handshake messages.
   - Adapt the conceptual sequence for TLS 1.2 and TLS 1.3.

2. **HTTPS Website Security Analysis**
   - Accept an HTTPS URL.
   - Resolve the hostname.
   - Establish a TCP connection to port 443.
   - Perform a TLS handshake.
   - Extract negotiated TLS information.
   - Parse the server's X.509 certificate.
   - Evaluate selected security properties.

3. **Explainable Security Scoring**
   - Convert observed security properties into deterministic findings.
   - Produce a score and grade.
   - Explain why a finding passed, generated a warning, or failed.
   - Provide recommendations where appropriate.

4. **Educational Presentation**
   - Present networking information in a clear dashboard.
   - Connect real observed values with the conceptual TLS protocol flow.
   - Make the system suitable for a Computer Networks project demonstration.

---

# 4. How the System Works

The analysis pipeline is divided into several stages.

## Stage 1 - URL Input

The frontend accepts an HTTPS URL from the user.

Example:

```text
https://example.com
```

The backend validates the URL before attempting a connection.

---

## Stage 2 - DNS Resolution

The hostname is resolved to one or more IP addresses.

Example:

```text
example.com
    ↓
93.184.216.34
```

The resulting IP addresses are returned as part of the network analysis.

---

## Stage 3 - TCP Connection

The backend establishes a TCP connection to:

```text
<hostname>:443
```

Port 443 is the standard port used for HTTPS.

A timeout is applied so that unreachable or slow servers do not cause the application to hang indefinitely.

---

## Stage 4 - TLS Negotiation

The TCP connection is wrapped using Python's TLS/SSL facilities.

The TLS layer negotiates parameters with the remote server, including:

- TLS protocol version
- Cipher suite

The application records the values actually negotiated by the TLS library.

---

## Stage 5 - Certificate Extraction

The peer certificate presented by the server is obtained and parsed using the `cryptography` library.

Relevant fields include:

- Subject
- Issuer
- Validity start
- Validity end
- Subject Alternative Names (SAN)
- Serial number
- Hostname match
- Self-signed status

---

## Stage 6 - Security Evaluation

The observed TLS and certificate information is passed to the security scoring engine.

The scoring engine applies deterministic rules and produces:

- Score
- Grade
- Findings
- Recommendations

The scoring system is intentionally explainable rather than being a black-box security rating.

---

## Stage 7 - Frontend Presentation

The backend returns a unified JSON response.

The frontend displays:

- Target information
- Network information
- TLS information
- Certificate information
- Security score
- Security findings
- Recommendations
- Handshake visualization

---

# 5. Important Scope and Technical Honesty

## The MVP Does Not Capture Raw TLS Packets

The project uses Python's high-level networking and TLS APIs:

```text
socket
ssl
cryptography
```

Therefore, the MVP **does not claim to capture or inspect raw TLS packets**.

Instead, it:

1. establishes a real TCP connection,
2. performs a real TLS negotiation,
3. reads the negotiated TLS parameters and peer certificate,
4. parses the certificate,
5. combines the observed information with a conceptual protocol visualization.

The handshake visualizer therefore represents the **protocol sequence conceptually**, enriched with actual data obtained from the server.

This distinction is important for technical accuracy.

### Do not describe the MVP as:

> "A packet-level TLS sniffer."

### Prefer:

> "A real TLS connection analyzer with an interactive protocol-sequence visualizer."

Packet-level capture can be considered a future extension.

---

# 6. Features

## Current / MVP Features

- HTTPS URL input
- URL validation
- DNS hostname resolution
- TCP connection to port 443
- Real TLS handshake
- TLS version detection
- Cipher suite detection
- Certificate extraction
- X.509 certificate parsing
- Certificate validity analysis
- Subject and issuer display
- SAN extraction
- Hostname matching
- Basic security score
- Security grade
- Explainable findings
- Security recommendations
- TLS handshake visualization
- Backend REST API
- Frontend/backend integration
- Automated tests

## Planned / Future Features

The following are intentionally outside the initial MVP and can be added incrementally:

- Full certificate-chain visualization
- HTTP security-header analysis
- HSTS detection
- More advanced certificate-chain validation
- Historical scan comparison
- Exportable reports/PDFs
- Packet-level TLS visualization
- More detailed TLS extension analysis
- Additional security rules
- More comprehensive accessibility and UI improvements

---

# 7. Architecture

The project follows a client-server architecture.

```text
┌───────────────────────────────────────────────┐
│                   Browser                     │
│                                               │
│  React + TypeScript + Vite                    │
│                                               │
│  ┌─────────────┐   ┌───────────────────────┐  │
│  │ Dashboard   │   │ TLS Handshake         │  │
│  │             │   │ Visualizer            │  │
│  └─────────────┘   └───────────────────────┘  │
│             │                                  │
└─────────────┼──────────────────────────────────┘
              │ HTTP/JSON
              ▼
┌───────────────────────────────────────────────┐
│              FastAPI Backend                   │
│                                               │
│  API Route                                    │
│      │                                        │
│      ▼                                        │
│  Analysis Service                             │
│      │                                        │
│      ├── URL Validation                       │
│      ├── DNS Resolution                      │
│      ├── TCP Connection                       │
│      ├── TLS Analysis                         │
│      ├── Certificate Parsing                  │
│      └── Security Scoring                     │
│                                               │
└──────────────────┬────────────────────────────┘
                   │
                   │ socket + TLS
                   ▼
          ┌──────────────────┐
          │ HTTPS Web Server  │
          │      :443         │
          └──────────────────┘
```

---

# 8. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface |
| Frontend Language | TypeScript | Type-safe frontend development |
| Frontend Tooling | Vite | Development/build tooling |
| Styling | CSS | UI styling |
| Backend | Python | Networking and application logic |
| Backend Framework | FastAPI | REST API |
| Server | Uvicorn | ASGI application server |
| Networking | `socket` | TCP networking |
| TLS | Python `ssl` | TLS connection and negotiated parameters |
| Certificate Parsing | `cryptography` | X.509 certificate inspection |
| Backend Testing | pytest | Automated backend tests |
| Frontend Testing | Vitest | Automated frontend tests |
| API Format | JSON | Frontend/backend communication |
| Version Control | Git | Source control |
| Hosting/Collaboration | GitHub | Repository and team collaboration |

---

# 9. Repository Structure

The repository is organized to separate application code, documentation, and supporting scripts.

```text
TLS-SSL-Handshake-Visualizer/
│
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
│   │   │   ├── rules.py
│   │   │   └── recommendations.py
│   │   └── services/
│   │       └── analysis_service.py
│   │
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── visualizer/
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── analysis.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── tests/
│
├── docs/
│   ├── api/
│   │   └── API_CONTRACT.md
│   ├── architecture/
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   └── TECH_STACK_AND_DEVELOPMENT_STANDARD.md
│   ├── demo/
│   ├── scoring/
│   └── PROJECT_CONTEXT.md
│
├── scripts/
│
├── .gitignore
├── .gitattributes
└── README.md
```

> The exact source-file structure may evolve as implementation progresses. The API contract and architectural boundaries should remain the primary reference when making structural changes.

---

# 10. Backend Architecture

The backend is responsible for all network-facing operations and for producing the unified analysis response.

## Major Components

### `main.py`

Creates and configures the FastAPI application.

Responsibilities include:

- Application initialization
- Router registration
- Health endpoint registration
- Middleware/configuration as required

---

### `api/routes/analyze.py`

Defines the HTTP API endpoint for analysis.

Primary endpoint:

```text
POST /analyze
```

The route should remain thin and delegate actual work to the analysis service.

---

### `models/schemas.py`

Contains request and response models.

Pydantic models should represent the API contract so that:

- request validation is explicit,
- response structure is predictable,
- frontend/backend integration is easier,
- contract violations are caught early.

---

### `tls/connection.py`

Responsible for low-level network/TLS connection operations.

Responsibilities include:

- hostname resolution support
- TCP connection
- TLS context configuration
- TLS negotiation
- timeout handling
- retrieval of negotiated connection information

---

### `tls/analyzer.py`

Interprets the established TLS connection and extracts relevant TLS information.

Examples:

- TLS protocol version
- Cipher suite
- Cipher protocol
- Cipher strength/bits where available

---

### `certificate/parser.py`

Parses the peer X.509 certificate.

Responsibilities include extracting:

- Subject
- Issuer
- Validity period
- SAN
- Serial number
- Hostname match
- Self-signed status

---

### `security/`

Contains the explainable security-analysis engine.

Responsibilities:

- Define security rules
- Evaluate observations
- Generate findings
- Calculate score
- Assign grade
- Generate recommendations

The security layer should not independently perform the network connection. It should evaluate the data supplied to it.

---

### `services/analysis_service.py`

Acts as the orchestration layer.

Conceptually:

```text
validate URL
     ↓
resolve hostname
     ↓
connect TCP
     ↓
perform TLS handshake
     ↓
extract TLS data
     ↓
parse certificate
     ↓
run security rules
     ↓
construct visualization data
     ↓
return unified response
```

Keeping this orchestration separate from individual components makes the system easier to test and maintain.

---

# 11. Frontend Architecture

The frontend consumes the backend API and presents the analysis.

## Major Responsibilities

### Dashboard

Displays:

- target URL
- hostname
- resolved IPs
- TLS version
- cipher suite
- certificate information
- security score
- security grade
- findings
- recommendations

---

### Handshake Visualizer

Displays the conceptual TLS protocol sequence.

The visualizer should:

- distinguish client/server participants,
- show steps in sequence,
- explain each message,
- highlight important TLS concepts,
- display actual observed information where available.

---

### API Client

`services/api.ts` should isolate HTTP communication from UI components.

The UI should not contain scattered `fetch()` calls.

---

### Shared Types

`types/analysis.ts` should mirror the backend API contract.

Frontend types should be updated whenever the agreed API contract changes.

---

# 12. API Contract

The backend exposes a small REST API.

## Health Check

```http
GET /health
```

Used to determine whether the backend is running.

---

## Website Analysis

```http
POST /analyze
Content-Type: application/json
```

Request:

```json
{
  "url": "https://example.com"
}
```

The response contains the following major sections:

```text
target
network
tls
certificate
security
visualization
error
analysis_status
```

---

## Conceptual Response

```json
{
  "analysis_status": "SUCCESS",
  "target": {
    "url": "https://example.com",
    "hostname": "example.com",
    "port": 443
  },
  "network": {
    "resolved_ips": []
  },
  "tls": {
    "version": "TLSv1.3",
    "cipher": {
      "name": "...",
      "protocol": "TLSv1.3",
      "bits": 256
    }
  },
  "certificate": {
    "subject": {},
    "issuer": {},
    "valid_from": "...",
    "valid_until": "...",
    "san": [],
    "serial_number": "...",
    "hostname_match": true,
    "self_signed": false
  },
  "security": {
    "score": 0,
    "grade": "A",
    "findings": [],
    "recommendations": []
  },
  "visualization": {
    "protocol_version": "TLSv1.3",
    "steps": []
  },
  "error": null
}
```

The exact schema is defined in:

```text
docs/api/API_CONTRACT.md
```

That document is the **source of truth for frontend/backend integration**.

### API Contract Rules

- Use `snake_case`.
- Do not fabricate unavailable values.
- Use `null` for unavailable scalar values.
- Use an empty array when no list values are available.
- Clearly distinguish observed data from derived data.
- Use `analysis_status` to distinguish a genuine low score from an analysis failure.
- Coordinate contract changes with the team before implementation.

---

# 13. Security Analysis Model

The security score is intended as an **educational, explainable assessment**, not a replacement for professional security auditing.

The scoring engine should operate on observable/derived properties such as:

- TLS protocol version
- certificate validity
- certificate hostname matching
- self-signed status
- certificate expiry conditions
- other explicitly implemented rules

Each rule should have a stable identifier.

Example conceptual finding:

```text
Rule ID: CERT_HOSTNAME_MATCH

Status: PASS

Severity: INFO

Title:
Certificate matches requested hostname

Explanation:
The certificate presented by the server covers the requested hostname.

Evidence:
hostname_match = true
```

A rule should produce deterministic output for the same input.

---

## Finding Statuses

The project uses:

```text
PASS
WARN
FAIL
```

---

## Severity Levels

The API supports:

```text
INFO
LOW
MEDIUM
HIGH
CRITICAL
```

---

## Grade

The score is represented as a value from:

```text
0–100
```

and converted into a letter grade:

```text
A
B
C
D
E
F
```

The exact scoring rules should be maintained in the scoring documentation/code rather than duplicated across frontend components.

---

# 14. TLS Handshake Visualization

The visualizer is a conceptual representation of the TLS handshake.

It should support the major differences between TLS versions.

## TLS 1.2

The visualization should communicate the larger sequence of messages involved in a typical TLS 1.2 handshake.

Conceptual flow:

```text
Client                          Server
  │                               │
  │──── ClientHello ─────────────►│
  │◄─── ServerHello ──────────────│
  │◄─── Certificate ──────────────│
  │◄─── ServerKeyExchange* ──────│
  │◄─── ServerHelloDone ──────────│
  │──── ClientKeyExchange ───────►│
  │──── ChangeCipherSpec ────────►│
  │──── Finished ────────────────►│
  │◄─── ChangeCipherSpec ─────────│
  │◄─── Finished ─────────────────│
```

`*` The exact TLS 1.2 handshake messages depend on the negotiated authentication/key-exchange configuration.

---

## TLS 1.3

TLS 1.3 simplifies the handshake and changes the cryptographic negotiation structure.

Conceptual flow:

```text
Client                          Server
  │                               │
  │──── ClientHello ─────────────►│
  │◄─── ServerHello ──────────────│
  │◄─── EncryptedExtensions ──────│
  │◄─── Certificate ──────────────│
  │◄─── CertificateVerify ────────│
  │◄─── Finished ─────────────────│
  │──── Finished ────────────────►│
```

The visualizer should explain that the actual handshake sequence depends on the protocol version and negotiated configuration.

---

# 15. MVP Scope

The first working version should prioritize functionality over feature count.

## P0 - Required

### Backend

- HTTPS URL validation
- DNS resolution
- TCP connection to port 443
- TLS negotiation
- TLS version
- Cipher information
- Peer certificate
- Certificate parsing
- Basic security score
- FastAPI `/analyze`
- FastAPI `/health`

### Frontend

- URL input
- Analyze button
- Loading state
- Error state
- Result dashboard
- TLS information
- Certificate information
- Security score
- Security findings
- Handshake visualizer

---

## P1 - Important

- SAN display
- Certificate expiry warnings
- Better findings/recommendations
- Responsive UI
- Automated tests
- Integration testing
- Documentation
- Clean setup instructions
- Improved error handling

---

## P2 - Future

- Certificate-chain visualization
- HSTS
- HTTP security headers
- PDF report export
- Historical scans
- Packet-level visualization
- Advanced TLS extension information

---

# 16. Future Scope

The architecture is intentionally designed so that the MVP can later be expanded.

Possible future modules include:

```text
Certificate Chain Analyzer
        │
        ▼
HTTP Header Analyzer
        │
        ▼
HSTS Analyzer
        │
        ▼
Advanced TLS Extension Analyzer
        │
        ▼
Historical Scan Storage
        │
        ▼
Report Generator
```

A packet-level visualizer could also be introduced later using an appropriate packet-capture architecture.

That would be a separate capability from the current high-level TLS API approach.

---

# 17. Getting Started

> Detailed setup instructions should be kept up to date as the implementation evolves. The commands below describe the intended development setup.

## Prerequisites

Install:

- Git
- Python 3.x
- Node.js and npm
- A modern web browser

Verify installations:

```powershell
git --version
python --version
node --version
npm --version
```

---

## Clone the Repository

```powershell
git clone https://github.com/rithertz/TLS-SSL-Handshake-Visualizer.git
cd TLS-SSL-Handshake-Visualizer
```

---

## Backend Setup

Create a virtual environment:

```powershell
cd backend
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies once the project requirements file is available:

```powershell
pip install -r requirements.txt
```

Start the FastAPI development server:

```powershell
uvicorn app.main:app --reload
```

The backend should expose:

```text
GET /health
POST /analyze
```

---

## Frontend Setup

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite will display the local development URL in the terminal.

---

# 18. Development Workflow

All team members should follow a common workflow.

## Before Starting Work

Update the local `main` branch:

```powershell
git checkout main
git pull origin main
```

Create a feature branch:

```powershell
git checkout -b feature/<short-description>
```

Example:

```powershell
git checkout -b feature/tls-analysis
```

---

## During Development

Make small, meaningful commits.

Example:

```text
feat: add TLS connection analyzer
test: add certificate parser tests
fix: handle TLS connection timeout
docs: update API usage
```

Avoid large commits containing unrelated changes.

---

## Before Sharing Work

Check:

```powershell
git status
```

Run relevant tests.

Review the diff:

```powershell
git diff
```

Then commit:

```powershell
git add .
git commit -m "feat: add TLS connection analyzer"
```

Push the branch:

```powershell
git push -u origin feature/<short-description>
```

Open a Pull Request on GitHub.

---

# 19. Git and Branching Guidelines

## `main`

`main` represents the stable shared project state.

Do not directly push experimental work to `main` once active team development begins.

---

## Feature Branches

Use descriptive names:

```text
feature/tls-analyzer
feature/certificate-parser
feature/security-score
feature/handshake-visualizer
feature/dashboard
test/api-integration
docs/setup-guide
fix/certificate-timeout
```

---

## Commit Convention

Use concise conventional-style prefixes:

| Prefix | Purpose |
|---|---|
| `feat:` | New functionality |
| `fix:` | Bug fix |
| `test:` | Tests |
| `docs:` | Documentation |
| `refactor:` | Code restructuring |
| `chore:` | Repository/tooling/maintenance |

Examples:

```text
feat: implement TLS connection analysis
feat: add certificate metadata parser
test: add certificate hostname tests
fix: handle invalid HTTPS URLs
docs: update backend setup instructions
chore: configure development gitignore
```

---

# 20. Testing Strategy

Testing should exist at multiple levels.

## Backend Unit Tests

Test individual components independently.

Examples:

- URL validation
- certificate parsing
- hostname matching
- security rules
- score calculation
- grade calculation

---

## Backend Integration Tests

Test API behavior.

Example:

```text
POST /analyze
       ↓
analysis service
       ↓
structured response
```

Verify:

- response schema
- successful analysis
- invalid URL behavior
- connection failures
- TLS failures
- timeout handling

---

## Frontend Tests

Test important UI behavior:

- URL input
- loading state
- error state
- result rendering
- security score rendering
- certificate rendering
- handshake step rendering

---

## End-to-End Testing

The integrated application should be tested as:

```text
Browser
   ↓
Frontend
   ↓
FastAPI
   ↓
TLS analysis
   ↓
JSON response
   ↓
Frontend rendering
```

The goal is to catch integration problems that unit tests cannot detect.

---

# 21. Engineering Rules

These rules should be followed throughout development.

## 1. Do Not Fabricate Network Data

If a value was not actually observed or reliably derived, do not invent it.

Use:

```text
null
```

or:

```text
[]
```

as appropriate.

---

## 2. Keep Responsibilities Separate

Networking code should not contain UI logic.

Frontend components should not perform direct TLS connections.

Security scoring should not establish network connections.

Visualization should not become the source of truth for observed TLS values.

---

## 3. Keep the API Contract Stable

The API contract is the shared interface between team members.

Changes should be discussed before implementation when they affect:

- field names
- field types
- response structure
- semantics
- required/optional fields

---

## 4. Explain Security Findings

A score without an explanation is not sufficient for the educational purpose of this project.

Every meaningful finding should communicate:

```text
What happened?
Why does it matter?
What evidence supports it?
What should the user do?
```

---

## 5. Handle Failures Explicitly

Network applications fail for many legitimate reasons:

- invalid URL
- DNS failure
- connection timeout
- connection refused
- TLS handshake failure
- certificate parsing failure
- remote server configuration problems

These should become structured, user-understandable errors rather than unhandled crashes.

---

## 6. Keep Secrets Out of Git

Never commit:

```text
.env
API keys
passwords
private keys
certificates containing private material
local credentials
machine-specific secrets
```

The `.gitignore` file should prevent common local/generated files from being committed.

---

## 7. Avoid Overengineering the MVP

The project should first deliver a reliable end-to-end path:

```text
URL
 → DNS
 → TCP
 → TLS
 → Certificate
 → Score
 → API
 → Dashboard
 → Visualizer
```

Additional features should not destabilize this core workflow.

---

# 22. Team Responsibilities

The project is divided into clear ownership areas.

## rithertz - Network/TLS Analysis + Backend Architecture

Primary responsibility:

- URL validation
- DNS resolution
- TCP connection
- TLS connection/negotiation
- TLS data extraction
- Certificate-analysis integration
- FastAPI API
- Analysis orchestration
- Backend error handling
- GitHub/development workflow support

---

## Jayanth-S-18 - TLS Protocol Model + Handshake Visualizer

Primary responsibility:

- TLS 1.2 conceptual handshake model
- TLS 1.3 conceptual handshake model
- Interactive visualization
- Client/server message presentation
- Visualization data model
- Visualizer tests

---

## Shantanu32145 - Security Analysis + Scoring Engine

Primary responsibility:

- Security rules
- Security score
- Security grade
- Findings
- Severity classification
- Recommendations
- Scoring tests
- Scoring methodology documentation

---

## Dhee5021raj - Integration + E2E Quality

Primary responsibility:

- Frontend/backend integration
- API contract verification
- Integration tests
- End-to-end testing
- Error-path verification
- Setup/integration documentation
- Release/demo readiness
- Clean-environment verification

---

## Sujay B - Frontend Dashboard + Result Presentation

Primary responsibility:

- React dashboard
- API client
- Shared frontend types
- TLS result presentation
- Certificate result presentation
- Security result presentation
- Loading/error states
- Visualizer entry point
- Frontend tests
- UI quality

---

# 23. Documentation

Important project documentation is maintained under:

```text
docs/
```

## API Contract

```text
docs/api/API_CONTRACT.md
```

Defines the frontend/backend interface.

---

## System Architecture

```text
docs/architecture/SYSTEM_ARCHITECTURE.md
```

Describes the overall system architecture and component boundaries.

---

## Technology and Development Standard

```text
docs/architecture/TECH_STACK_AND_DEVELOPMENT_STANDARD.md
```

Contains shared development conventions and technical standards.

---

## Project Context

```text
docs/PROJECT_CONTEXT.md
```

Contains shared project context and decisions useful for team members.

---

## Future Documentation

The following directories are reserved for additional documentation:

```text
docs/demo/
docs/scoring/
```

Possible future documents include:

```text
Demo Guide
Scoring Methodology
Test Plan
Deployment Guide
Troubleshooting Guide
```

---

# 24. Limitations

The project has several intentional limitations.

## 1. High-Level TLS Inspection

The MVP uses Python's TLS APIs rather than raw packet capture.

Therefore, the application observes negotiated connection information but does not reconstruct every raw TLS record.

---

## 2. Security Score Is Educational

The score is a deterministic project-defined assessment.

It should not be interpreted as:

- a formal penetration test,
- a complete vulnerability assessment,
- a commercial website security rating,
- a guarantee that a website is secure.

---

## 3. Network Conditions Affect Results

Real-world analysis can be affected by:

- DNS configuration
- IPv4/IPv6 availability
- firewalls
- proxies
- server configuration
- network connectivity
- temporary server failures

A failure to analyze a website does not necessarily mean the website is insecure.

---

## 4. Server Configuration Can Change

TLS and certificate properties are observed at analysis time.

A future scan may produce different results because the remote server may change its configuration.

---

# 25. Academic Concepts Demonstrated

This project directly connects to several Computer Networks topics.

| Concept | Demonstrated By |
|---|---|
| DNS | Hostname resolution |
| IP addressing | Resolved server IPs |
| TCP | Connection to port 443 |
| Client-server architecture | Browser ↔ FastAPI ↔ web server |
| TLS/SSL | TLS negotiation |
| HTTPS | Secure HTTP endpoint concept |
| PKI | Certificate issuer/trust concepts |
| X.509 | Certificate parsing |
| Cryptographic negotiation | TLS/cipher information |
| Protocol messages | Handshake visualizer |
| Network errors | Timeout/connection/TLS handling |
| REST | Backend API |
| JSON | Data exchange |
| Security analysis | Rule-based scoring |

---

# 26. Project Status

The repository is currently in the **initial project setup phase**.

The repository foundation includes:

- Git repository
- GitHub remote
- Team collaborator access
- Project documentation
- API contract
- System architecture
- Development standards
- Initial source-tree placeholders

The next development stage is implementation of the MVP.

Target pipeline:

```text
[URL Input]
      ↓
[FastAPI]
      ↓
[DNS Resolution]
      ↓
[TCP :443]
      ↓
[TLS Negotiation]
      ↓
[Certificate Parsing]
      ↓
[Security Scoring]
      ↓
[Unified API Response]
      ↓
┌──────────────────────┐
│ React Dashboard      │
│ + Handshake          │
│   Visualizer         │
└──────────────────────┘
```

---

# 27. Contributors

**BCSE308L - Computer Networks Project**

| Member | Primary Area |
|---|---|
| Jayanth-S-18 | TLS Handshake Visualizer |
| rithertz | Network/TLS Backend |
| Shantanu32145 | Security Scoring |
| Sujay-B37 | Frontend Dashboard |
| Dhee5021raj | Integration & Testing |

---

# 28. License

This project is developed as an academic project for **BCSE308L - Computer Networks**.

A formal open-source license can be added if the team decides to publish the project for broader reuse.

---

## Project Principle

> **Observe real network behavior, explain it clearly, and never claim more than the system actually measures.**

The central goal of this project is to bridge the gap between **Computer Networks theory** and a **real HTTPS connection** by allowing users to see what happens when a secure connection is established and why the observed TLS/certificate properties matter.
