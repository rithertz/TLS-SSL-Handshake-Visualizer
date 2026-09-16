# TLS/SSL Handshake Visualizer & Website Security Analyzer

## Computer Networks --- BCSE308L

### Team Project Context & AI-Assisted Development Guide

------------------------------------------------------------------------

## 1. Purpose of This Document

This document is the **shared technical context** for all five team
members and for any AI coding assistant used during development.

Everyone should read this before implementing their assigned module.

The goal is to make sure that:

-   everyone understands the **same project**;
-   everyone understands the **Computer Networks concepts** involved;
-   everyone understands how their module fits into the complete system;
-   AI-generated code is written against the **same architecture and
    contracts**;
-   we build a working **MVP for Review-1 first**, rather than trying to
    build the complete project immediately;
-   the team can explain the networking concepts during a review/viva
    instead of merely demonstrating code.

The original Review-1 proposal defines the project as an interactive
application that visualizes the TLS/SSL handshake and analyzes HTTPS
website security using certificate validity, issuer, TLS version, cipher
suite, expiry, and related information. It also explicitly connects the
project to DNS, TCP, TLS/SSL, PKI, and HTTPS.

------------------------------------------------------------------------

# 2. Project in One Sentence

> **We are building a web application where a user enters an HTTPS
> website, our backend establishes a TLS connection and extracts
> security information, and the frontend turns that information into an
> educational TLS handshake visualization plus an explainable website
> security assessment.**

------------------------------------------------------------------------

# 3. What Problem Are We Solving?

HTTPS is used everywhere, but the underlying process is difficult to
understand.

When a user visits:

``` text
https://example.com
```

many networking operations happen before the user sees the webpage:

``` text
Domain Name
    ↓
DNS Resolution
    ↓
IP Address
    ↓
TCP Connection
    ↓
TLS Handshake
    ↓
Certificate Validation
    ↓
Secure Session
    ↓
Encrypted HTTPS Communication
```

A normal browser hides most of this process.

Our application makes the important parts visible.

The user should be able to see:

1.  what TLS is doing;
2.  which TLS version was negotiated;
3.  which cipher suite was negotiated;
4.  who issued the server certificate;
5.  when the certificate becomes valid and expires;
6.  whether the certificate appears trusted/CA-signed or self-signed;
7.  what security issues were detected;
8.  how those findings contribute to a security score;
9.  a visual, step-by-step representation of the TLS handshake.

------------------------------------------------------------------------

# 4. What This Project Is NOT

For the MVP, we should **not** try to become a replacement for:

-   Wireshark;
-   SSL Labs;
-   a full vulnerability scanner;
-   a browser;
-   a complete packet-sniffing system;
-   a penetration-testing tool.

That would make the project unnecessarily large.

Our focus is:

> **Educational TLS visualization + practical HTTPS/TLS configuration
> analysis + explainable security scoring.**

This is much more achievable and easier to defend academically.

------------------------------------------------------------------------

# 5. Core Computer Networks Concepts

The project intentionally combines several topics from Computer Networks
and Network Security.

## 5.1 DNS

A user enters a hostname such as:

``` text
www.example.com
```

The machine needs an IP address before it can communicate with the
server.

Conceptually:

``` text
www.example.com
        ↓
      DNS
        ↓
  IP address
```

For example:

``` text
www.example.com → 93.x.x.x
```

The exact IP can change because modern websites may use CDNs and
multiple addresses.

### Why DNS matters to our project

Our backend begins with a hostname supplied by the user.

The hostname is resolved before the TLS connection can be established.

The application may expose the resolved host/IP as optional diagnostic
information.

------------------------------------------------------------------------

# 6. TCP Connection

TLS normally operates over a reliable transport connection.

For traditional HTTPS:

``` text
Application: HTTPS
       ↓
Security: TLS
       ↓
Transport: TCP
       ↓
Network: IP
```

Before TLS starts, TCP establishes a connection.

Conceptually:

``` text
Client                    Server

   SYN  -------------------->
        <---------------- SYN-ACK
   ACK  -------------------->
```

This is the TCP three-way handshake.

Our application does not need to manually implement TCP.

The operating system's networking stack handles it.

However, it is important for the team to understand that:

> **TCP connection establishment and TLS handshake are different
> processes.**

The TLS handshake occurs after the transport connection is available.

------------------------------------------------------------------------

# 7. TLS --- The Main Concept

TLS stands for:

> **Transport Layer Security**

It provides security for network communication.

The main security goals are:

### Confidentiality

Attackers should not be able to read the encrypted application data.

### Integrity

Attackers should not be able to silently modify the communication.

### Authentication

The client should have a mechanism to determine whether it is
communicating with the intended server.

Certificates and Certificate Authorities are important for
authentication.

------------------------------------------------------------------------

# 8. TLS 1.2 vs TLS 1.3

The application should understand the difference between TLS 1.2 and TLS
1.3.

A simplified TLS 1.2 handshake can be represented as:

``` text
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

`*` indicates that the exact message sequence depends on the negotiated
key-exchange/authentication configuration.

TLS 1.3 simplifies and reduces the handshake:

``` text
CLIENT                                  SERVER

ClientHello  ------------------------>

              <---------------------- ServerHello
              <---------------------- EncryptedExtensions
              <---------------------- Certificate*
              <---------------------- CertificateVerify*
              <---------------------- Finished

Finished     ------------------------->
```

Again, the exact messages can vary depending on the handshake and
authentication configuration.

### Important implementation limitation

For the MVP, our application should **not pretend that a normal
high-level TLS socket API gives us every raw handshake packet/message**.

The backend can reliably obtain information such as:

-   negotiated TLS version;
-   negotiated cipher suite;
-   peer certificate;
-   certificate metadata.

The visualizer can therefore combine:

1.  the **known protocol sequence** for the negotiated TLS version; and
2.  the **real negotiated connection information** obtained by the
    backend.

This gives us an educational visualization without requiring packet
capture.

If we later add packet-level capture, that can become an advanced
extension.

------------------------------------------------------------------------

# 9. TLS Certificate

The server presents a digital certificate during the TLS process.

A certificate contains information such as:

``` text
Subject
Issuer
Validity Period
Serial Number
Public Key Information
Subject Alternative Names (SAN)
Signature / Signature Algorithm
```

Example conceptual certificate:

``` text
Subject:
    example.com

Issuer:
    Example CA

Valid From:
    2026-01-01

Valid Until:
    2026-12-31

SAN:
    example.com
    www.example.com
```

The certificate allows the client to associate the server identity with
a public key under the PKI trust model.

------------------------------------------------------------------------

# 10. PKI --- Public Key Infrastructure

PKI is the broader system used to manage digital certificates and trust.

A simplified trust chain looks like:

``` text
Root CA
   ↓
Intermediate CA
   ↓
Server Certificate
   ↓
example.com
```

Browsers and operating systems maintain trusted Certificate Authority
information.

This is why a certificate signed by a trusted CA is treated differently
from a self-signed certificate.

------------------------------------------------------------------------

# 11. Certificate Validation

The application should inspect certificate properties.

Important MVP checks include:

### 11.1 Expiration

Is:

``` text
Current Date < notAfter
```

If not, the certificate is expired.

### 11.2 Not Yet Valid

Is:

``` text
Current Date >= notBefore
```

If not, the certificate is not currently valid.

### 11.3 Hostname / SAN

The requested hostname should match the certificate's applicable Subject
Alternative Name entries.

For example:

``` text
Requested host:
    www.example.com

Certificate SAN:
    example.com
    www.example.com
```

This is a match.

### 11.4 Issuer

Display the certificate issuer.

### 11.5 Self-Signed Detection

A certificate can be suspicious for a public website if it is
self-signed.

However:

> Self-signed does not automatically mean "cryptographically broken."

It primarily means that the certificate does not derive trust from the
normal public CA chain.

The scoring engine should therefore explain the finding instead of
simply declaring it "unsafe."

------------------------------------------------------------------------

# 12. TLS Version

The backend should determine the negotiated TLS version.

Possible examples:

``` text
TLSv1.3
TLSv1.2
TLSv1.1
TLSv1.0
```

Modern deployments should generally prefer TLS 1.3 or TLS 1.2.

Older protocol versions can receive security-score penalties.

For the MVP, the score should be based on an explicitly documented
rubric.

Example:

``` text
TLS 1.3 → strongest score
TLS 1.2 → acceptable
TLS 1.1 → significant penalty
TLS 1.0 → significant penalty
Unknown → cannot confidently score
```

The exact numerical weights will be finalized before implementation.

------------------------------------------------------------------------

# 13. Cipher Suite

A cipher suite describes important cryptographic choices used by TLS.

For example, a TLS 1.3 cipher suite might look conceptually like:

``` text
TLS_AES_256_GCM_SHA384
```

A cipher suite relates to things such as:

-   symmetric encryption;
-   authentication/key exchange context;
-   integrity/hash algorithms, depending on the TLS version.

The backend should report the negotiated cipher suite.

The scoring engine can classify it according to a documented policy.

------------------------------------------------------------------------

# 14. Why We Need a Backend

The browser frontend should not be responsible for arbitrary server-side
TLS inspection.

Instead:

``` text
Browser
   ↓
Frontend
   ↓ HTTP request
Backend API
   ↓
TLS connection to target
   ↓
Certificate/TLS analysis
   ↓
JSON response
   ↓
Frontend
```

This separation gives us a clean architecture.

------------------------------------------------------------------------

# 15. Proposed Technology Stack

The recommended MVP stack is:

## Frontend

**React + Vite**

Why:

-   component-based;
-   fast development;
-   easy state management;
-   easy dashboard construction;
-   suitable for animated UI;
-   good separation between visualizer and dashboard.

Suggested technologies:

``` text
React
Vite
JavaScript or TypeScript
CSS
```

TypeScript is preferable if the team is comfortable with it, but
JavaScript is acceptable if speed is more important for Review-1.

## Backend

**Python + FastAPI**

Why:

-   easy HTTP API development;
-   excellent fit for networking experiments;
-   Python's standard library provides TLS/socket functionality;
-   easy certificate parsing using `cryptography`;
-   automatic API documentation;
-   simple JSON handling.

Suggested stack:

``` text
Python
FastAPI
Uvicorn
ssl
socket
cryptography
```

## Frontend ↔ Backend

REST API over JSON.

Example:

``` http
POST /analyze
```

Request:

``` json
{
  "url": "https://example.com"
}
```

Response:

``` json
{
  "target": {
    "url": "https://example.com",
    "hostname": "example.com"
  },
  "tls": {
    "version": "TLSv1.3",
    "cipher": "TLS_AES_256_GCM_SHA384"
  },
  "certificate": {
    "subject": "...",
    "issuer": "...",
    "valid_from": "...",
    "valid_until": "...",
    "san": []
  },
  "security": {
    "score": 92,
    "grade": "A",
    "findings": [],
    "recommendations": []
  },
  "visualization": {
    "protocol": "TLS 1.3",
    "steps": []
  }
}
```

The exact schema will be frozen before the modules become heavily
integrated.

------------------------------------------------------------------------

# 16. High-Level Architecture

The proposed system is:

``` text
                         ┌──────────────────────────┐
                         │       User / Browser      │
                         └────────────┬─────────────┘
                                      │
                                      │ HTTPS / HTTP API
                                      ▼
                         ┌──────────────────────────┐
                         │      React Frontend       │
                         │                          │
                         │  URL Input               │
                         │  Dashboard               │
                         │  Certificate Cards       │
                         │  Security Score          │
                         │  Handshake Visualizer    │
                         └────────────┬─────────────┘
                                      │
                                      │ POST /analyze
                                      ▼
                         ┌──────────────────────────┐
                         │      FastAPI Backend      │
                         └────────────┬─────────────┘
                                      │
                       ┌──────────────┼──────────────┐
                       │              │              │
                       ▼              ▼              ▼
                 ┌──────────┐  ┌────────────┐  ┌──────────────┐
                 │ DNS /    │  │ TLS Socket │  │ Certificate  │
                 │ Host     │  │ Connection │  │ Parser       │
                 │ Resolve  │  │            │  │ cryptography │
                 └──────────┘  └─────┬──────┘  └──────┬───────┘
                                      │                │
                                      └───────┬────────┘
                                              ▼
                                  ┌────────────────────┐
                                  │ Security Scoring   │
                                  │ Engine             │
                                  └─────────┬──────────┘
                                            │
                                            ▼
                                  ┌────────────────────┐
                                  │ Unified JSON Result│
                                  └─────────┬──────────┘
                                            │
                                            ▼
                                  ┌────────────────────┐
                                  │ React Dashboard    │
                                  │ + TLS Visualizer   │
                                  └────────────────────┘
```

------------------------------------------------------------------------

# 17. The User Flow

The final MVP should feel like this:

## Step 1 --- User enters a website

``` text
https://example.com
```

## Step 2 --- Frontend validates input

Checks:

-   URL format;
-   HTTPS scheme;
-   non-empty hostname.

## Step 3 --- Frontend calls backend

``` http
POST /analyze
```

## Step 4 --- Backend validates the target

Reject:

-   malformed URL;
-   unsupported scheme;
-   missing hostname.

## Step 5 --- Backend establishes TLS connection

Conceptually:

``` text
hostname
   ↓
DNS resolution
   ↓
TCP socket to port 443
   ↓
TLS handshake
   ↓
negotiated parameters
```

## Step 6 --- Backend extracts information

For example:

``` text
TLS Version
Cipher Suite
Certificate Subject
Certificate Issuer
Validity
SAN
Serial Number
```

## Step 7 --- Security engine evaluates findings

For example:

``` text
TLS Version       +25
Certificate       +25
Validity          +20
Cipher Strength   +20
Other checks      +10
----------------------
Total              100
```

The actual scoring table will be finalized as a team.

## Step 8 --- Backend returns one structured response

The frontend receives everything needed for the dashboard.

## Step 9 --- Dashboard presents the result

Example layout:

``` text
┌───────────────────────────────────────────────┐
│              WEBSITE SECURITY                 │
│                                               │
│ https://example.com             Grade: A      │
│                                  92 / 100      │
├───────────────────────────────────────────────┤
│ TLS INFORMATION                               │
│                                               │
│ TLS Version: TLS 1.3                          │
│ Cipher: TLS_AES_256_GCM_SHA384                │
├───────────────────────────────────────────────┤
│ CERTIFICATE                                   │
│                                               │
│ Issuer: ...                                   │
│ Valid From: ...                               │
│ Expires: ...                                  │
│ SAN: ...                                      │
├───────────────────────────────────────────────┤
│ WHY THIS SCORE?                               │
│                                               │
│ ✓ Modern TLS version                          │
│ ✓ Valid certificate                           │
│ ✓ Strong cipher                              │
│                                               │
├───────────────────────────────────────────────┤
│ TLS HANDSHAKE                                 │
│                                               │
│ Client              Server                    │
│   │                   │                       │
│   │── ClientHello ──>│                       │
│   │<── ServerHello ──│                       │
│   │<── Certificate ──│                       │
│   │                   │                       │
└───────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 18. The Novelty Feature

A basic certificate viewer is not enough to make this project
interesting.

Our primary novelty should be:

# Explainable TLS Security Scoring + Educational Handshake Visualization

Instead of showing:

``` text
Security Score: 82
```

we show:

``` text
Security Score: 82 / 100
Grade: B

Why?

+25  TLS 1.3 negotiated
+25  Certificate currently valid
+20  Certificate hostname matches
+15  Strong cipher configuration
-03  Certificate expires relatively soon

Recommendation:
Renew the certificate before its expiry window becomes critical.
```

The important concept is:

> **The application explains how the score was produced.**

This is much better for a Computer Networks project than an unexplained
number.

------------------------------------------------------------------------

# 19. Optional Second Novelty --- Learning Mode

The handshake visualizer should not merely animate arrows.

Each handshake step should explain:

``` text
ClientHello

What happens?
The client begins the TLS handshake by proposing
supported protocol versions and cryptographic options.

Why does it matter?
The server uses this information to select compatible
parameters for the secure connection.
```

The user can interact with:

``` text
[ Previous ] [ Play ] [ Pause ] [ Next ]
```

and click a message to see details.

This turns the application into a **learning tool**, not merely an
analyzer.

------------------------------------------------------------------------

# 20. What the Visualizer Actually Represents

We need to be precise here.

The visualizer is primarily a:

> **protocol-state/handshake-sequence visualization**

rather than a raw packet capture.

For example, if the backend reports:

``` json
{
  "version": "TLSv1.3",
  "cipher": "TLS_AES_256_GCM_SHA384"
}
```

the visualizer knows to show the TLS 1.3 handshake sequence and can
attach those real negotiated parameters to the relevant explanation
panels.

We should not claim:

> "We captured every TLS handshake packet."

unless we actually implement packet-level capture.

------------------------------------------------------------------------

# 21. Security Scoring Engine

The scoring engine should be:

> **rule-based, deterministic, explainable, and documented.**

Input:

``` text
TLS/certificate analysis
```

Output:

``` text
Score
Grade
Findings
Recommendations
```

Conceptually:

``` text
Raw Data
   ↓
Rule Evaluation
   ↓
Individual Findings
   ↓
Weighted Score
   ↓
Grade
   ↓
Recommendations
```

Example:

``` text
TLS 1.3
    → positive

Certificate valid
    → positive

Hostname matches SAN
    → positive

Certificate expires soon
    → warning

Weak/obsolete TLS version
    → major penalty
```

------------------------------------------------------------------------

# 22. Why Explainability Matters

Suppose two websites receive:

``` text
Site A → 95
Site B → 68
```

A user should be able to ask:

> Why?

Our application should answer.

For example:

``` text
Site B

68 / 100 — C

Issues:
✗ Older TLS version detected       -15
✗ Certificate expires soon          -7
✓ Certificate hostname matches
✓ Certificate currently valid
✓ Acceptable cipher configuration
```

This makes the scoring engine easy to demonstrate and defend during
viva.

------------------------------------------------------------------------

# 23. Backend Responsibilities

The backend is responsible for:

1.  receiving the target URL;
2.  validating it;
3.  resolving the hostname;
4.  opening the TLS connection;
5.  obtaining negotiated TLS information;
6.  obtaining certificate information;
7.  parsing certificate fields;
8.  handling connection errors/timeouts;
9.  invoking the scoring engine;
10. constructing the unified JSON response.

The backend should **not** contain frontend presentation logic.

------------------------------------------------------------------------

# 24. Frontend Responsibilities

The frontend is responsible for:

1.  URL input;
2.  client-side validation;
3.  loading state;
4.  error display;
5.  results dashboard;
6.  certificate visualization;
7.  TLS information visualization;
8.  security score visualization;
9.  score breakdown;
10. recommendations;
11. handshake animation;
12. responsive layout.

The frontend should **not** implement the actual TLS connection to
arbitrary external websites.

------------------------------------------------------------------------

# 25. Handshake Visualizer Responsibilities

The visualizer is responsible for:

1.  showing Client and Server;
2.  showing handshake messages;
3.  showing the correct sequence for TLS 1.2/TLS 1.3;
4.  animation;
5.  play/pause;
6.  step forward/backward;
7.  message explanation;
8.  displaying relevant real negotiated values;
9.  clearly distinguishing protocol explanation from raw packet capture.

------------------------------------------------------------------------

# 26. Security Engine Responsibilities

The security engine is responsible for:

1.  defining scoring criteria;
2.  applying rules;
3.  producing deterministic scores;
4.  generating findings;
5.  generating recommendations;
6.  returning a structured result;
7.  documenting the scoring methodology.

It should not directly communicate with websites.

------------------------------------------------------------------------

# 27. Testing Responsibilities

Testing is not something we leave until the final day.

Each module should have tests.

Examples:

## URL tests

``` text
https://example.com
http://example.com
example.com
empty input
malformed URL
```

## TLS tests

``` text
valid HTTPS site
unreachable hostname
connection timeout
TLS negotiation failure
```

## Certificate tests

``` text
valid certificate
expired certificate
not-yet-valid certificate
self-signed certificate
hostname mismatch
multiple SAN entries
```

## Scoring tests

``` text
ideal configuration
acceptable configuration
warning configuration
poor configuration
invalid/missing fields
```

## Frontend tests

``` text
loading
success
error
missing field
long hostname
small screen
```

------------------------------------------------------------------------

# 28. MVP Scope for Review-1

Because the first review is only one week away, the target is:

> **A working vertical slice, not a finished product.**

The MVP should allow:

``` text
Enter HTTPS URL
       ↓
Backend analyzes it
       ↓
Real TLS/certificate information returned
       ↓
Security score generated
       ↓
Dashboard displays results
       ↓
Handshake visualization shown
```

If this complete flow works for at least one or more real HTTPS
websites, we have a meaningful Review-1 demonstration.

------------------------------------------------------------------------

# 29. What We Should Have by the First Review

Minimum acceptable MVP:

### Backend

-   working FastAPI server;
-   `/analyze` endpoint;
-   URL validation;
-   TLS connection;
-   TLS version;
-   cipher suite;
-   certificate extraction;
-   certificate parsing;
-   structured JSON response.

### Security engine

-   documented scoring criteria;
-   deterministic score;
-   grade;
-   findings;
-   recommendations.

### Frontend

-   URL input;
-   loading state;
-   result dashboard;
-   certificate details;
-   TLS details;
-   security score;
-   recommendations.

### Visualizer

-   Client/Server diagram;
-   TLS 1.2/TLS 1.3 sequence;
-   animation;
-   basic step controls;
-   explanations.

### Repository

-   GitHub repository;
-   organized source tree;
-   meaningful commits;
-   separate development branches;
-   pull requests;
-   README;
-   basic documentation.

------------------------------------------------------------------------

# 30. What Can Wait Until After Review-1

Do not let these block the MVP:

-   advanced packet capture;
-   extremely detailed certificate-chain visualization;
-   database storage;
-   user accounts;
-   deployment;
-   advanced analytics;
-   historical website comparisons;
-   complex animations;
-   dark-mode perfection;
-   extensive browser compatibility;
-   sophisticated scoring models.

These can become later enhancements.

------------------------------------------------------------------------

# 31. Important Engineering Principle

We are building the project as a set of modules, but the final product
must behave like **one application**.

The architecture should therefore follow:

``` text
Module → Contract → Integration → Test
```

not:

``` text
Everyone codes independently
        ↓
Try to combine everything at the end
```

Every module should have a clearly defined interface.

------------------------------------------------------------------------

# 32. Shared Data Contract

The team should agree on a JSON schema before heavy integration.

Conceptual structure:

``` json
{
  "target": {},
  "network": {},
  "tls": {},
  "certificate": {},
  "security": {},
  "visualization": {},
  "error": null
}
```

Possible detailed structure:

``` json
{
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
      "name": "TLS_AES_256_GCM_SHA384",
      "protocol": "TLSv1.3",
      "bits": 256
    }
  },

  "certificate": {
    "subject": {},
    "issuer": {},
    "serial_number": "",
    "valid_from": "",
    "valid_until": "",
    "san": [],
    "is_self_signed": false,
    "hostname_match": true
  },

  "security": {
    "score": 92,
    "grade": "A",
    "findings": [],
    "recommendations": []
  },

  "visualization": {
    "protocol": "TLSv1.3",
    "steps": []
  },

  "error": null
}
```

This is a **starting point**, not the final schema.

The final schema must be agreed upon by the team before modules depend
heavily on it.

------------------------------------------------------------------------

# 33. AI-Assisted Development Rules

All team members may use AI heavily.

That is encouraged because the objective is to learn and build the
project efficiently.

However, AI should be treated as:

> **a coding assistant, not the project architect.**

Before asking AI to implement something, provide it with:

1.  this project context;
2.  the member's module responsibility;
3.  the repository structure;
4.  the current API/data contract;
5.  existing relevant code;
6.  exact expected behavior.

Bad prompt:

``` text
Build a TLS analyzer.
```

Better prompt:

``` text
You are implementing the certificate parsing module
inside our FastAPI TLS analyzer.

Read the project architecture below...

The backend must return certificate.valid_from,
certificate.valid_until, certificate.issuer, certificate.san,
and certificate.is_self_signed.

Do not change the API contract.
Implement this module and add tests.
```

------------------------------------------------------------------------

# 34. AI Code Review Rules

Before accepting AI-generated code, the responsible member must
understand:

-   what the code does;
-   why it works;
-   what library/API it uses;
-   what errors can occur;
-   what assumptions it makes.

The team should be able to explain its own code during a viva.

Do not blindly paste AI output.

------------------------------------------------------------------------

# 35. GitHub Development Model

The repository will be owned/administered by:

**Rithwik Subramanian**

Repository responsibilities include:

-   creating the repository;
-   adding all team members as collaborators;
-   maintaining branch protection/workflow where appropriate;
-   maintaining issues/milestones;
-   ensuring code is merged through pull requests;
-   keeping the main branch stable;
-   maintaining the README;
-   coordinating releases/checkpoints.

However:

> Repository ownership is only one part of Rithwik's contribution.
> Rithwik must also have a substantial technical module.

The exact technical module allocation will be finalized in the next
planning step.

------------------------------------------------------------------------

# 36. Proposed Git Workflow

Conceptually:

``` text
main
  │
  ├── feature/backend-tls
  ├── feature/security-engine
  ├── feature/frontend-dashboard
  ├── feature/handshake-visualizer
  └── feature/testing-integration
```

Development happens on feature branches.

Then:

``` text
Feature Branch
      ↓
Commit
      ↓
Push
      ↓
Pull Request
      ↓
Review
      ↓
Merge
      ↓
main
```

We should avoid everyone directly pushing experimental work to `main`.

------------------------------------------------------------------------

# 37. Repository Philosophy

The repository should tell the story of the project.

A reviewer should be able to see:

``` text
README
   ↓
Architecture
   ↓
Modules
   ↓
Issues
   ↓
Commits
   ↓
Pull Requests
   ↓
Tests
   ↓
Working Application
```

This is useful both academically and as a software-engineering
portfolio.

------------------------------------------------------------------------

# 38. Suggested Repository Structure

The final structure may evolve, but a reasonable starting point is:

``` text
tls-security-analyzer/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── visualizer/
│   │   ├── services/
│   │   └── ...
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── tls/
│   │   ├── certificate/
│   │   ├── security/
│   │   └── models/
│   ├── tests/
│   └── requirements.txt
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── scoring/
│   └── review/
│
├── tests/
│   └── integration/
│
├── README.md
├── .gitignore
└── ...
```

The exact structure should be finalized after the team agrees on the
module boundaries.

------------------------------------------------------------------------

# 39. Final Mental Model for the Team

Everyone should understand the project as this pipeline:

``` text
USER
 │
 │ HTTPS URL
 ▼
FRONTEND
 │
 │ POST /analyze
 ▼
BACKEND
 │
 ├── Validate URL
 │
 ├── Resolve hostname
 │
 ├── Establish TCP connection
 │
 ├── Perform TLS handshake
 │
 ├── Obtain negotiated TLS parameters
 │
 ├── Obtain certificate
 │
 └── Parse certificate
 │
 ▼
SECURITY ENGINE
 │
 ├── Evaluate TLS version
 ├── Evaluate certificate
 ├── Evaluate validity
 ├── Evaluate hostname
 ├── Evaluate cipher
 └── Generate score/findings
 │
 ▼
UNIFIED JSON
 │
 ├───────────────┐
 ▼               ▼
DASHBOARD     VISUALIZER
 │               │
 ▼               ▼
Security       TLS Handshake
Score          Sequence
Certificate    Explanation
TLS Data       Interaction
Recommendations
```

------------------------------------------------------------------------

# 40. What Makes This a Computer Networks Project?

The project is not simply a web application.

The networking concepts are fundamental to the implementation:

``` text
DNS
 ↓
IP addressing
 ↓
TCP
 ↓
TLS
 ↓
PKI
 ↓
Certificates
 ↓
HTTPS
 ↓
Encrypted communication
```

The web UI is simply the mechanism through which we make these concepts
understandable.

The backend performs the actual network/security analysis.

The visualizer makes the protocol behavior visible.

The scoring engine interprets the network/security information.

------------------------------------------------------------------------

# 41. What Makes the Project Interesting?

The strongest project story is:

> "We built an educational system that takes a real HTTPS website,
> establishes a real TLS connection, extracts real TLS and certificate
> parameters, evaluates the configuration using an explainable scoring
> model, and then visually explains how the TLS handshake establishes
> secure communication."

That is much stronger than:

> "We made a website that displays certificate information."

------------------------------------------------------------------------

# 42. Immediate Development Strategy

The team should work toward a **vertical slice** first.

### Milestone 1

``` text
Frontend URL form
        ↓
Backend /analyze
        ↓
Real TLS connection
        ↓
TLS version + cipher
        ↓
Certificate information
```

### Milestone 2

``` text
Real analysis
        ↓
Security scoring
        ↓
Score + grade + explanation
```

### Milestone 3

``` text
Analysis
   ↓
Dashboard
   +
Handshake Visualizer
```

### Milestone 4

``` text
Full application
   ↓
Testing
   ↓
Demo
```

This approach ensures that the team has something demonstrable even if
advanced features are unfinished.

------------------------------------------------------------------------

# 43. Definition of "Done"

A feature is not considered complete merely because:

``` text
"The code runs on my laptop."
```

A feature is done when:

-   it works;
-   it follows the agreed interface;
-   it has basic error handling;
-   another team member can use it;
-   it is committed to the repository;
-   it can be integrated;
-   the responsible member understands it;
-   relevant tests exist.

------------------------------------------------------------------------

# 44. Review-1 Success Criteria

For the first review, our ideal demonstration is:

``` text
1. Open application

2. Enter:
   https://example.com

3. Click Analyze

4. Show:
   - TLS version
   - cipher suite
   - certificate issuer
   - validity
   - SAN
   - security score

5. Explain:
   "The score is not arbitrary.
    These rules produced these points."

6. Open handshake visualizer

7. Step through:
   ClientHello
   ServerHello
   Certificate
   ...

8. Explain the networking concepts

9. Show GitHub repository

10. Explain team architecture and contributions
```



------------------------------------------------------------------------

# 45. Long-Term Extensions

After the MVP, possible enhancements include:

### Advanced certificate-chain visualization

``` text
Root CA
   ↓
Intermediate CA
   ↓
Server Certificate
```

### Historical analysis

Allow users to compare scans:

``` text
example.com
Scan 1 → 78
Scan 2 → 91
```

### Security report export

Generate:

``` text
PDF security report
```

### More security headers

Analyze:

-   HSTS;
-   CSP;
-   X-Content-Type-Options;
-   other HTTP security headers.

### More detailed TLS configuration analysis

Potentially inspect:

-   protocol support;
-   cipher classifications;
-   certificate chain properties;
-   additional TLS extensions.

### Packet-level visualization

A future advanced version could use packet capture or specialized
tooling to show actual handshake traffic.

This should be treated as an extension, not an MVP requirement.

------------------------------------------------------------------------

# 46. Final Principle

The team should always ask:

> **"What networking concept are we demonstrating, and how does our
> implementation demonstrate it?"**

If a feature does not help the networking objective, the feature should
not be allowed to consume MVP development time unless it is clearly
useful to the final product.

The project is ultimately about:

**TLS + HTTPS + Certificates + PKI + Secure Communication + Explainable
Security Analysis + Visualization.**

------------------------------------------------------------------------

# 47. Next Planning Step

After everyone has read this document, the team should finalize:

1.  exact architecture;
2.  exact technology stack;
3.  exact repository structure;
4.  exact JSON contract;
5.  five-way workload distribution;
6.  Review-1 timeline;
7.  GitHub workflow;
8.  module acceptance criteria.

Only after those are fixed should the individual member task documents
be generated.
