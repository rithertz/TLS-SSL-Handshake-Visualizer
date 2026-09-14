# TLS/SSL Handshake Visualizer & Website Security Analyzer
## System Architecture Specification — Review-1 MVP

**Course:** Computer Networks (BCSE308L)  
**Purpose:** Shared architecture specification for all five members and AI coding agents.

---

## 1. Architecture Decision

The project is a **client-server web application** with four logical layers. The current repository contains the initial backend and frontend implementation needed to support the Review-1 MVP.

```text
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                 React + TypeScript + Vite                   │
│                                                              │
│ URL Input → Dashboard → Security Results → TLS Visualizer   │
└──────────────────────────────┬───────────────────────────────┘
                               │ REST / JSON
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│                    Python + FastAPI                          │
│                                                              │
│ Request Validation → Analysis Orchestration → Response      │
└───────────────┬───────────────────────┬──────────────────────┘
                │                       │
                ▼                       ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│     TLS / NETWORK        │   │    SECURITY SCORING          │
│       ANALYZER           │   │         ENGINE               │
│                          │   │                              │
│ DNS / TCP / TLS socket   │   │ Rules → Findings → Score    │
│ TLS version / cipher     │   │ Grade → Recommendations      │
│ Certificate extraction   │   │                              │
└──────────────────────────┘   └──────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│                  CERTIFICATE PARSER                          │
│                Python cryptography library                   │
└──────────────────────────────────────────────────────────────┘
```

The frontend owns presentation and interaction. The backend owns network analysis. The scoring engine interprets collected information. The visualizer presents the TLS protocol sequence.

---

## 2. Architecture Goals

The architecture must:

1. Produce a working MVP within the Review-1 timeframe.
2. Demonstrate real Computer Networks concepts.
3. Keep each member's code independently understandable.
4. Make integration predictable.
5. Allow AI agents to work without changing unrelated modules.
6. Keep backend independent of frontend UI.
7. Keep scoring independent of network communication.
8. Keep the visualizer independent of backend implementation.
9. Make unit, module, and end-to-end testing possible.
10. Leave a clean path for post-review extensions.

---

## 3. Complete Runtime Flow

For:

```text
https://example.com
```

the application should follow:

```text
User enters URL
      ↓
React collects URL
      ↓
      ↓
POST /analyze
      ↓
FastAPI validates request
      ↓
Extract hostname
      ↓
Resolve hostname
      ↓
Open TCP connection to port 443
      ↓
Establish TLS session
      ↓
Read negotiated TLS version/cipher
      ↓
Obtain peer certificate
      ↓
Parse certificate metadata
      ↓
Run security scoring rules
      ↓
Build unified JSON response
      ↓
React renders dashboard
      ↓
React renders TLS handshake visualization
```

This is the central project story.

---

## 4. Networking Stack Being Demonstrated

```text
Application
    │
    │ HTTPS
    ▼
Security
    │
    │ TLS
    ▼
Transport
    │
    │ TCP
    ▼
Internet
    │
    │ IP
    ▼
Network Interface
```

DNS is used before the connection to resolve the hostname.

Important distinction:

```text
DNS resolution
    ≠
TCP three-way handshake
    ≠
TLS handshake
```

The operating system performs TCP mechanics; our application uses networking APIs to establish the connection and inspect the resulting TLS session.

---

## 5. DNS

Given:

```text
example.com
```

the backend needs an address:

```text
Hostname
   ↓
DNS resolution
   ↓
IP address(es)
```

Use operating-system/Python facilities. Do not build a custom DNS server.

Resolved IP information may be exposed as diagnostic data if reliably available.

---

## 6. TCP

Traditional HTTPS uses TCP as the transport.

Conceptually:

```text
Client                         Server

SYN ---------------------------->
    <---------------------- SYN-ACK
ACK ---------------------------->
```

The MVP does **not** manually construct TCP packets. The purpose is to demonstrate where TLS sits in the stack.

---

## 7. TLS Connection

After TCP is available:

```text
TCP socket
    ↓
TLS wrapper
    ↓
TLS negotiation
    ↓
Secure TLS session
```

The current backend obtains:

- negotiated TLS version;
- negotiated cipher suite;
- peer certificate;
- certificate-related information;
- controlled connection errors.

Do not implement cryptographic primitives manually.

---

## 8. TLS 1.2 and TLS 1.3 Visualization

A simplified TLS 1.2 sequence:

```text
CLIENT                                  SERVER

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

A simplified TLS 1.3 sequence:

```text
CLIENT                                  SERVER

ClientHello  ------------------------>

              <---------------------- ServerHello
              <---------------------- EncryptedExtensions
              <---------------------- Certificate*
              <---------------------- CertificateVerify*
              <---------------------- Finished

Finished     ------------------------->
```

`*` means the exact sequence depends on the negotiated configuration.

---

## 9. Critical Visualization Limitation

The MVP uses high-level TLS APIs.

Therefore we can reliably obtain:

- negotiated TLS version;
- negotiated cipher;
- peer certificate;
- certificate metadata;
- connection success/failure.

We should **not claim** that the MVP captures every raw TLS packet or every byte of every handshake message.

The correct description is:

> **An interactive visualization of the TLS handshake protocol sequence, enriched with real parameters obtained from the target server.**

If packet capture is added later, it becomes an advanced extension.

---

## 10. Backend Logical Architecture

Current structure:

```text
backend/
└── app/
    ├── main.py
    ├── api/
    │   └── routes/
    │       └── analyze.py
    ├── models/
    │   └── schemas.py
    ├── tls/
    │   ├── connection.py
    │   └── analyzer.py
    ├── certificate/
    │   └── parser.py
    ├── security/
    │   ├── scorer.py
    │   └── rules.py
    └── services/
        ├── analysis_service.py
        └── url_validator.py
```

Additional modules such as `security/recommendations.py` may be introduced as implementation expands. Names may change, but responsibilities should remain separated.

---

## 11. Backend Request Flow

```text
HTTP Request
    ↓
API route
    ↓
Request validation
    ↓
Analysis service
    ↓
TLS analyzer
    ↓
Certificate parser
    ↓
Security scorer
    ↓
Response model
    ↓
JSON
```

The current API route is intentionally thin. TLS and scoring logic are delegated to the analysis service and lower-level modules.

---

## 12. Analysis Service

The orchestration layer should conceptually expose:

```text
analyze_target(url)
```

and coordinate:

```text
URL
 ↓
TLS/network analyzer
 ↓
certificate parser
 ↓
security scorer
 ↓
unified result
```

It must not contain frontend presentation logic.

---

## 13. TLS Analyzer

Responsibilities:

1. Receive hostname/port.
2. Resolve/connect.
3. Establish TLS.
4. Obtain negotiated TLS version.
5. Obtain negotiated cipher.
6. Obtain peer certificate.
7. Return structured analysis data.
8. Raise controlled errors.

It must not calculate the final security score.

---

## 14. Certificate Parser

Responsibilities:

```text
DER/PEM certificate
       ↓
X.509 object
       ↓
Structured metadata
```

Target fields:

- Subject;
- Issuer;
- Serial number;
- Valid-from;
- Valid-until;
- Subject Alternative Names;
- useful public-key metadata where available;
- self-signed indication where reliably determinable;
- hostname-match result where implemented.

The parser must be independently testable.

---

## 15. Security Engine

Conceptual pipeline:

```text
TLS + Certificate Data
          ↓
      Rule Engine
          ↓
    ┌─────┴─────┐
    ↓           ↓
Findings      Score
    │           │
    └─────┬─────┘
          ↓
        Grade
          ↓
Recommendations
```

It must be deterministic:

> identical input → identical output.

It must not open network connections.

---

## 16. Frontend Architecture

Current foundation:

```text
frontend/
└── src/
    ├── components/
    │   └── AnalyzeForm.tsx
    ├── visualizer/
    ├── services/
    │   └── api.ts
    ├── types/
    │   └── analysis.ts
    ├── App.tsx
    └── main.tsx
```

The dashboard and visualizer components will be added by their respective owners.

---

## 17. Frontend State

At minimum:

```text
IDLE → LOADING → SUCCESS
                 ↘ ERROR
```

Example:

```text
IDLE:
Enter HTTPS URL

LOADING:
Analyzing TLS configuration...

SUCCESS:
Show results

ERROR:
Unable to analyze target
```

---

## 18. Dashboard

The dashboard should display:

### Target
- URL
- hostname

### TLS
- TLS version
- cipher suite

### Certificate
- issuer
- subject
- validity
- expiry
- SAN

### Security
- score
- grade
- findings
- recommendations

### Visualization
- Client ↔ Server TLS handshake

---

## 19. Visualizer Architecture

The visualizer must be reusable and receive data rather than directly calling the API.

Correct:

```text
API service
   ↓
analysis state
   ↓
HandshakeVisualizer props
   ↓
animation
```

Avoid:

```text
HandshakeVisualizer
   ↓
fetch("/analyze")
```

The visualizer should render the correct TLS 1.2 or TLS 1.3 sequence based on the analysis result.

---

## 20. Security Score Ownership

The frontend must **not recalculate** the security score.

Correct:

```text
Backend/security engine
        ↓
score + grade + findings
        ↓
frontend
        ↓
render
```

This gives one source of truth for scoring.

---

## 21. Error Architecture

Possible categories:

```text
INVALID_URL
NON_HTTPS_URL
DNS_FAILURE
CONNECTION_TIMEOUT
CONNECTION_REFUSED
TLS_HANDSHAKE_FAILURE
CERTIFICATE_ERROR
ANALYSIS_ERROR
INTERNAL_ERROR
```

Return controlled API errors, not Python stack traces.

Example:

```json
{
  "error": {
    "code": "CONNECTION_TIMEOUT",
    "message": "The target server did not respond within the allowed time."
  }
}
```

The exact final schema will be frozen in the API-contract stage.

---

## 22. Integration Boundaries

Major boundaries:

```text
Frontend ←→ Backend API
Backend  ←→ TLS analyzer
Backend  ←→ Certificate parser
Backend  ←→ Security engine
Backend result → Visualizer
```

Each boundary must have a documented contract.

---

## 23. Single Source of Truth

The backend analysis response is canonical for:

```text
TLS version
Cipher
Certificate data
Security score
Findings
Recommendations
```

Do not duplicate these rules in React.

---

## 24. Vertical-Slice Strategy

Build the first working path quickly:

```text
URL input
   ↓
POST /analyze
   ↓
real TLS connection
   ↓
certificate
   ↓
basic score
   ↓
JSON
   ↓
dashboard
```

Then improve the visualizer and advanced checks.

This is safer than completing isolated modules and integrating only at the end.

---

## 25. Review-1 MVP

### P0 — Must Work

```text
HTTPS URL input
Backend API
TLS connection
TLS version
Cipher
Certificate
Basic score
Dashboard
Handshake visualization
```

### P1 — Strongly Recommended

```text
SAN
Expiry warning
Findings
Recommendations
Loading/error states
Unit tests
Responsive UI
GitHub documentation
```

### P2 — Optional

```text
Certificate-chain visualization
HSTS
HTTP security headers
PDF export
Historical scans
Advanced animations
Packet-level visualization
```

---

## 26. Security/SSRF Boundary

Because the backend connects to a user-supplied target, input validation matters.

For the MVP:

- accept HTTPS;
- use hostname;
- default to port 443;
- impose timeouts;
- avoid exposing arbitrary host:port scanning.

If publicly deployed later, internal/reserved destinations should be blocked to reduce SSRF risk.

---

## 27. Architectural Rules for AI Agents

AI agents must:

- follow this architecture;
- avoid changing unrelated modules;
- not invent API fields;
- not silently rename existing fields;
- not move scoring into the frontend;
- not move TLS networking into React;
- not make the visualizer call the API directly;
- add tests for non-trivial logic;
- report assumptions and limitations.

If an interface must change:

```text
Identify required change
        ↓
Update shared contract
        ↓
Update producer
        ↓
Update consumers
        ↓
Update tests
```

---

## 28. Definition of Done

A feature is not done because:

> "It runs on my laptop."

A feature is done when:

- it works;
- it follows the architecture;
- it has appropriate error handling;
- another member can consume it;
- it is committed to GitHub;
- relevant tests exist;
- the responsible member understands it.

---

## 29. Architecture Summary

```text
             USER
              │
              ▼
       ┌──────────────┐
       │ React Client │
       └──────┬───────┘
              │ JSON
              ▼
       ┌──────────────┐
       │   FastAPI    │
       └──────┬───────┘
              │
      ┌───────┼────────┐
      │       │        │
      ▼       ▼        ▼
    TLS    Certificate Score
 Analyzer    Parser    Engine
      │       │        │
      └───────┼────────┘
              ▼
        Unified Result
              │
              ▼
       React Dashboard
          + Visualizer
```

This architecture is the baseline for all subsequent task assignments and coding.
