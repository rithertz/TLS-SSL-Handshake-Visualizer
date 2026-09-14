# Project Context

## Project

**TLS/SSL Handshake Visualizer & Website Security Analyzer**

This project is a Computer Networks course project that demonstrates how HTTPS communication works by combining:

- DNS hostname resolution
- TCP connection establishment
- TLS negotiation
- X.509 certificate inspection
- Rule-based website security analysis
- Interactive TLS handshake visualization

The project is implemented as a client-server web application.

---

## Current MVP

The MVP accepts an HTTPS website URL and analyzes its TLS connection.

The current backend can:

1. Validate the submitted URL.
2. Resolve the target hostname.
3. Establish a TCP connection to port 443.
4. Perform a TLS handshake using Python's `ssl` APIs.
5. Obtain the negotiated TLS version.
6. Obtain the negotiated cipher suite and key size.
7. Retrieve the peer certificate.
8. Parse certificate metadata using `cryptography`.
9. Check certificate hostname matching.
10. Check certificate validity dates.
11. Detect whether the certificate appears self-signed.
12. Produce a deterministic security score, grade, findings, and recommendations.
13. Return the results through the `/analyze` REST API.

The frontend currently contains the initial application shell, API client, shared TypeScript API types, and URL analysis form.

---

## Technical Honesty

The current MVP does **not** capture or inspect raw TLS packets.

The handshake visualizer represents the logical TLS protocol message sequence and can display actual negotiated TLS parameters obtained from the server.

Therefore, the project should not claim to be a packet sniffer or packet-level TLS analyzer unless packet capture is implemented in a future version.

---

## Architecture

```text
User
 │
 ▼
React + TypeScript Frontend
 │
 │ POST /analyze
 ▼
FastAPI Backend
 │
 ├── URL Validation
 ├── DNS Resolution
 ├── TCP Connection
 ├── TLS Negotiation
 ├── Certificate Parsing
 └── Security Scoring
 │
 ▼
Structured JSON Response
 │
 ├── TLS Information
 ├── Certificate Information
 ├── Security Findings
 ├── Recommendations
 └── Handshake Visualization Data
```

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- Python `socket`
- Python `ssl`
- `cryptography`

### Testing

- pytest
- HTTPX
- Vitest for frontend testing

### Development

- Git
- GitHub
- GitHub Actions for continuous integration

---

## Repository Structure

```text
TLS-SSL-Handshake-Visualizer/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── certificate/
│   │   ├── models/
│   │   ├── security/
│   │   ├── services/
│   │   └── tls/
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── services/
│       ├── types/
│       └── visualizer/
│
├── docs/
│   ├── api/
│   ├── architecture/
│   ├── demo/
│   └── scoring/
│
└── scripts/
```

---

## API Contract

The shared API contract is maintained in:

```text
docs/api/API_CONTRACT.md
```

The frontend and backend should follow this contract when exchanging data.

The main endpoints are:

```text
GET  /health
POST /analyze
```

The API uses JSON and follows `snake_case` field naming.

---

## Component Ownership

The project is divided into clear ownership areas.

### Network/TLS Backend

Responsible for:

- URL validation
- DNS resolution
- TCP connection
- TLS negotiation
- negotiated TLS parameters
- certificate retrieval
- certificate parsing
- backend API orchestration

### TLS Handshake Visualizer

Responsible for:

- TLS protocol sequence
- TLS 1.2 and TLS 1.3 handshake models
- interactive handshake visualization
- visualization-specific tests

### Security Analysis

Responsible for:

- security rules
- scoring methodology
- grades
- findings
- recommendations
- scoring tests

### Frontend Dashboard

Responsible for:

- website analysis interface
- result dashboard
- TLS information presentation
- certificate information presentation
- security score presentation
- frontend API integration
- responsive UI

### Integration and Quality

Responsible for:

- frontend/backend integration
- API contract verification
- integration tests
- end-to-end testing
- failure-path testing
- release/demo verification
- setup and integration documentation

---

## Development Boundary

Each contributor should primarily modify files belonging to their assigned component.

Shared interfaces such as:

```text
docs/api/API_CONTRACT.md
frontend/src/types/analysis.ts
```

should be changed only when necessary and should be discussed with the relevant owners.

Avoid making unrelated changes to another contributor's component.

---

## MVP Scope

### Included

- HTTPS URL analysis
- DNS resolution
- TCP/TLS connection
- TLS version detection
- Cipher suite information
- Certificate metadata
- Hostname matching
- Certificate validity
- Basic security scoring
- Security findings
- Security recommendations
- React dashboard
- TLS handshake visualization
- Automated tests

### Future Scope

Potential future enhancements include:

- Certificate-chain visualization
- HTTP security-header analysis
- HSTS analysis
- PDF report generation
- Historical scan storage
- Raw packet-level visualization
- Additional security rules
- More detailed TLS extension analysis

---

## Important Limitations

The current TLS inspection uses Python's standard TLS verification behavior.

Consequently, servers with certificates that fail normal TLS verification may fail the TLS connection before all certificate details can be inspected.

This behavior may be improved in a later version by separating certificate inspection from certificate trust verification.

The current backend is designed primarily for the local/academic MVP. If deployed publicly, outbound URL analysis must include protections against SSRF and connections to private, loopback, link-local, and other reserved destinations.

---

## Project Principle

The implementation should prioritize:

1. Correct networking concepts
2. Clear separation of responsibilities
3. Honest representation of observed versus derived data
4. Deterministic and explainable security analysis
5. Maintainable code
6. Reproducible setup
7. Tested integration
8. A clear educational demonstration of HTTPS/TLS
