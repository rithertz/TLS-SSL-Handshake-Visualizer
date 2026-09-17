# MVP Demo Guide

## TLS/SSL Handshake Visualizer & Website Security Analyzer

This guide is for demonstrating the current Review-1 MVP to faculty/evaluators.

The MVP performs a real HTTPS analysis of a target website and displays the resulting TLS, certificate, security, and handshake information.

---

## 1. Prerequisites

Install:

- Python 3.11+ recommended
- Node.js and npm
- Git

The project is developed and tested on Windows using PowerShell.

---

## 2. Start the Backend

From the repository root:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

The backend should start on:

```text
http://127.0.0.1:8000
```

Verify it with:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Expected response:

```text
status
------
ok
```

Keep this terminal running.

---

## 3. Start the Frontend

Open a second PowerShell terminal.

From the repository root:

```powershell
cd frontend
npm run dev
```

Vite will display the local frontend URL in the terminal.

Open that URL in a browser.

---

## 4. Run the MVP Analysis

The current frontend provides an HTTPS URL input.

For the initial demonstration, use:

```text
https://example.com
```

Click the analysis button.

The frontend sends:

```http
POST /analyze
```

to the FastAPI backend.

The backend then performs:

```text
URL validation
      ↓
DNS resolution
      ↓
TCP connection to port 443
      ↓
TLS negotiation
      ↓
TLS information extraction
      ↓
Certificate parsing
      ↓
Security scoring
      ↓
JSON response
      ↓
Frontend display
```

---

## 5. What the Backend Actually Obtains

The current analyzer obtains real information from the target connection.

### Network

- resolved IP addresses

### TLS

- negotiated TLS version
- negotiated cipher suite
- cipher security bits when available

### Certificate

- subject
- issuer
- validity period
- Subject Alternative Names
- serial number
- hostname match
- self-signed status

### Security

- rule findings
- security score
- security grade
- recommendations

---

## 6. Handshake Visualization

The project visualizes the TLS handshake as a protocol sequence.

The visualization is based on the TLS protocol flow and is enriched with information observed from the real TLS connection.

The MVP does **not** capture raw TLS packets.

Therefore, during the demonstration, describe it as:

> “A TLS handshake visualization backed by real negotiated TLS and certificate data.”

Do **not** describe it as:

> “A packet capture of the actual TLS handshake.”

---

## 7. Suggested Demonstration Flow

A concise faculty demonstration can follow this sequence.

### Step 1 — Introduce the Problem

Explain:

> HTTPS protects communication using TLS, but users normally cannot easily see which TLS version, cipher suite, and certificate a website is actually using.

Then introduce the project as a tool that makes these properties visible.

### Step 2 — Show the Architecture

Briefly explain:

```text
React Frontend
      ↓
FastAPI REST API
      ↓
DNS + TCP + TLS
      ↓
Certificate Parser
      ↓
Security Scoring
      ↓
Visualization + Dashboard
```

### Step 3 — Enter a Website

Use:

```text
https://example.com
```

### Step 4 — Explain Network Resolution

Explain that the backend resolves the hostname before establishing the TLS connection.

### Step 5 — Explain TLS Negotiation

Point out:

- negotiated TLS version
- cipher suite
- cipher strength/bits where available

For example, a successful modern server may negotiate:

```text
TLSv1.3
```

### Step 6 — Explain the Certificate

Show:

- certificate subject
- issuer
- validity dates
- SAN entries
- hostname match
- apparent self-signed status

Explain that the analyzer reports certificate metadata, hostname matching, validity dates, and whether the certificate appears self-signed from subject/issuer metadata. It does not prove the full browser trust chain or revocation status.

### Step 7 — Explain Security Scoring

Explain that the score is produced by deterministic rules based on observed properties.

For the current baseline, rules include:

- TLS version
- certificate validity
- hostname matching
- expiry proximity
- self-signed status
- certificate identity metadata

### Step 8 — Show the Handshake

Walk through the conceptual TLS sequence.

Explain what the client and server exchange at each stage and why those messages are required.

### Step 9 — Show Failure Handling

If time permits, demonstrate an invalid input such as:

```text
http://example.com
```

The backend should reject it because the analyzer requires HTTPS.

This demonstrates that input validation is performed before network analysis.

---

## 8. Important Viva Explanation

### Why FastAPI?

> “FastAPI provides a simple REST interface between the React frontend and the Python networking analysis layer. It also gives us Pydantic request and response validation.”

### Why Python `socket` and `ssl`?

> “We wanted the project to demonstrate actual networking concepts rather than simply consuming a third-party website security API. Python's socket and SSL libraries let us perform DNS/TCP/TLS operations directly.”

### Why `cryptography`?

> “The TLS connection gives us the peer certificate, and the cryptography library lets us parse the X.509 certificate and inspect its fields.”

### How is the score calculated?

> “The security engine uses deterministic rule-based checks. Each finding has a status and severity, and the scoring engine combines those findings into a score and grade.”

### Is this packet capture?

> “No. The MVP uses the TLS API to observe the negotiated connection and certificate. The handshake visualization represents the protocol sequence; it does not claim to capture raw TLS packets.”

### Why no database?

> “The MVP performs independent live analysis and does not require persistent application state. A database would add complexity without being necessary for the core networking demonstration.”

---

## 9. Troubleshooting

### Backend does not start

Make sure the virtual environment exists:

```powershell
Test-Path .\.venv\Scripts\python.exe
```

If it returns `False`, create the environment:

```powershell
python -m venv .venv
```

Then:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Start again:

```powershell
uvicorn app.main:app --reload
```

---

### Frontend dependencies are missing

From `frontend`:

```powershell
npm install
npm run dev
```

---

### Frontend cannot reach backend

Check that the backend is running:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Then check that the frontend is using:

```text
http://127.0.0.1:8000
```

as its API base URL.

Local development defaults to this value when `frontend/.env` is absent. A production frontend must define `VITE_API_BASE_URL` explicitly.

---

### Target website analysis fails

Possible causes include:

- DNS failure
- server unavailable
- network restrictions
- TLS negotiation failure
- connection timeout
- certificate-related failure

Try another HTTPS website.

---

## 10. Demo Safety

Only analyze websites that the team is authorized to test.

The MVP is intended for passive HTTPS/TLS inspection.

It does not attempt:

- password guessing
- exploitation
- vulnerability exploitation
- intrusive scanning
- modification of the target website

The analyzer should be presented as a defensive educational tool.

---

## 11. What to Claim in Review-1

Safe claims:

- “The application performs real DNS resolution.”
- “The backend establishes a real TLS connection.”
- “The negotiated TLS version and cipher are obtained from the connection.”
- “The peer X.509 certificate is parsed.”
- “Certificate properties are analyzed.”
- “Security findings and a score are generated using rules.”
- “The frontend visualizes the analysis and TLS handshake sequence.”

Avoid unsupported claims:

- “We capture TLS packets.”
- “We perform complete vulnerability scanning.”
- “We replace professional SSL/TLS auditing tools.”
- “The score proves a website is secure.”
- “Every handshake field shown is captured directly from packets.”

---

## 12. Recommended 3–5 Minute Demo

### 0:00–0:45 — Problem and architecture

Explain the motivation and show the system architecture.

### 0:45–1:30 — Website analysis

Enter:

```text
https://example.com
```

Run the analysis.

### 1:30–2:30 — TLS and certificate data

Explain:

- TLS version
- cipher
- certificate issuer
- validity
- SAN
- hostname matching

### 2:30–3:30 — Security score

Explain the findings and how the rule-based score is produced.

### 3:30–4:30 — Handshake visualization

Walk through the TLS protocol sequence.

### 4:30–5:00 — Technical boundary

Mention that the MVP uses real TLS connection data but does not perform packet capture.

---

## 13. Final Demo Checklist

Before the review:

```text
[ ] Backend starts successfully
[ ] /health returns ok
[ ] Frontend starts successfully
[ ] https://example.com can be analyzed
[ ] TLS version is displayed
[ ] Cipher is displayed
[ ] Certificate information is displayed
[ ] Security score is displayed
[ ] Findings are displayed
[ ] Handshake visualization loads
[ ] Invalid HTTP input is rejected
[ ] Both backend and frontend terminals are ready
[ ] Git working tree is clean or intentional changes are committed
```

---

## 14. Review-1 Goal

The objective of the MVP demonstration is to prove the complete technical path:

```text
User input
    ↓
Frontend
    ↓
REST API
    ↓
Real network connection
    ↓
TLS inspection
    ↓
Certificate analysis
    ↓
Security rules
    ↓
Structured result
    ↓
Visualization
```

A smaller number of working features is preferable to claiming features that have not actually been implemented.
