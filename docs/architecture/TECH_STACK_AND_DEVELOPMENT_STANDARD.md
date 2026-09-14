# TLS/SSL Handshake Visualizer & Website Security Analyzer
## Technology Stack & Development Standard — Review-1 MVP

**Purpose:** Freeze the recommended technologies and development conventions for the team and AI coding agents.

---

# 1. Stack Decision

| Area | Decision |
|---|---|
| Frontend | React |
| Frontend language | TypeScript |
| Build tool | Vite |
| Styling | CSS |
| Backend | Python |
| API framework | FastAPI |
| ASGI server | Uvicorn |
| Networking | Python `socket` |
| TLS | Python `ssl` |
| Certificate parsing | `cryptography` |
| Backend testing | pytest |
| Frontend testing | Vitest |
| Communication | REST + JSON |
| Version control | Git + GitHub |
| Security scoring | Rule-based Python engine |
| Database | None for MVP |
| Deployment | Not required for Review-1 |

Do not pin arbitrary library versions in this document. During repository setup, the team will select mutually compatible current stable versions and record them in dependency files.

---

# 2. Why This Stack?

The stack is chosen for:

1. Fast MVP development.
2. Strong Computer Networks learning value.
3. Clean separation of responsibilities.
4. Good testing support.
5. Good resume value.
6. Low unnecessary infrastructure.

---

# 3. Frontend — React

React fits the application because the UI naturally breaks into components:

```text
URL Input
Certificate Card
TLS Card
Security Score
Findings
Recommendations
Handshake Visualizer
```

Components can be developed independently and composed into one dashboard.

---

# 4. TypeScript

TypeScript is recommended because the project has a multi-person JSON contract.

Without types, one developer may expect:

```text
tlsVersion
```

while another uses:

```text
tls.version
```

TypeScript helps detect mismatches during development.

Frontend types should mirror the final backend API contract.

Example:

```ts
interface TLSInfo {
  version: string;
  cipher: string;
}
```

The actual interface must be based on the frozen contract.

---

# 5. Vite

Vite provides the frontend development/build environment.

It handles:

- development server;
- frontend build;
- React/TypeScript development.

It does not perform TLS analysis.

---

# 6. CSS

Use maintainable CSS for the MVP.

Required UI concerns:

- responsive layout;
- cards;
- badges;
- score display;
- visualizer arrows;
- animations;
- error/loading states.

Do not add a large component library unless the team has a concrete reason.

---

# 7. Backend — Python

Python is selected because the project directly involves networking and security.

Useful standard-library capabilities include:

```text
socket
ssl
urllib
ipaddress
```

Python also integrates easily with certificate libraries and FastAPI.

---

# 8. FastAPI

FastAPI provides the REST API.

Conceptually:

```http
POST /analyze
```

Request:

```json
{
  "url": "https://example.com"
}
```

Response:

```json
{
  "target": {},
  "network": {},
  "tls": {},
  "certificate": {},
  "security": {},
  "visualization": {}
}
```

The exact contract will be finalized separately.

---

# 9. Uvicorn

Uvicorn runs FastAPI locally.

Conceptually:

```text
FastAPI application
       ↓
     Uvicorn
       ↓
localhost backend
```

---

# 10. Python socket

The `socket` module represents the network connection layer.

Conceptually:

```text
hostname
   ↓
DNS resolution
   ↓
TCP socket
   ↓
port 443
```

The operating system performs TCP mechanics.

We are not implementing a TCP stack.

---

# 11. Python ssl

The `ssl` module provides TLS functionality.

Use the mature TLS implementation instead of implementing cryptography manually.

The backend can inspect:

```text
Negotiated TLS version
Negotiated cipher
Peer certificate
```

---

# 12. cryptography

Use the `cryptography` package for X.509 certificate parsing.

Conceptually:

```text
Certificate bytes
      ↓
X.509 object
      ↓
Certificate metadata
```

Potential fields:

```text
Subject
Issuer
Serial number
Validity
SAN
Public-key metadata
Signature metadata
```

Do not write an X.509 parser manually.

---

# 13. Security Engine

Use ordinary Python modules:

```text
security/
├── rules.py
├── scorer.py
└── recommendations.py
```

### rules.py

Scoring criteria and thresholds.

### scorer.py

Applies rules and produces score/grade/findings.

### recommendations.py

Produces human-readable remediation advice.

No ML is required for the MVP.

---

# 14. Why Rule-Based Scoring?

A rule-based engine is:

- deterministic;
- explainable;
- easy to test;
- easy to modify;
- easy to defend during viva.

Example:

```text
TLS 1.3
    → positive finding

Expired certificate
    → severe negative finding

Hostname mismatch
    → severe negative finding
```

The exact weights will be documented in the scoring specification.

---

# 15. Testing

## Backend

Use:

```text
pytest
```

Test:

- URL validation;
- certificate parsing;
- scoring;
- error handling;
- selected TLS-analysis behavior.

## Frontend

Use:

```text
Vitest
```

Test:

- input validation;
- loading state;
- successful rendering;
- error state;
- score display;
- visualizer controls.

## Integration

Test:

```text
URL
 ↓
API
 ↓
TLS analysis
 ↓
certificate
 ↓
score
 ↓
JSON
 ↓
UI
```

---

# 16. Git/GitHub Standard

The project must use Git from the beginning.

Members should know:

```bash
git status
git add .
git commit
git pull
git push
git switch
git branch
```

The repository owner additionally manages:

- repository creation;
- collaborators;
- issues;
- milestones;
- PR workflow;
- main branch;
- documentation;
- merges.

Repository management must not replace the owner's technical contribution.

---

# 17. Branching Standard

Use feature branches.

Conceptually:

```text
main
 ├── feature/backend-tls
 ├── feature/certificate-parser
 ├── feature/security-engine
 ├── feature/frontend-dashboard
 └── feature/handshake-visualizer
```

The final names will be assigned after workload allocation.

Rule:

> One logical feature/task should normally have one feature branch.

---

# 18. Commit Standard

Good examples:

```text
feat: add TLS connection analyzer
feat: parse certificate SAN entries
feat: implement security scoring rules
feat: add handshake step controls
fix: handle TLS timeout errors
test: add certificate expiry tests
docs: add API usage guide
```

Avoid meaningless messages:

```text
update
changes
final
done
asdf
```

---

# 19. Pull Request Standard

Every meaningful module should be merged through a PR.

PR template:

```text
## Summary
What changed?

## Implementation
How was it implemented?

## Testing
What was tested?

## Known Limitations
Anything unfinished or intentionally deferred?
```

---

# 20. Dependency Management

Backend dependencies:

```text
backend/requirements.txt
```

or an equivalent reproducible Python dependency file.

Frontend dependencies:

```text
package.json
```

Do not commit:

```text
node_modules/
.venv/
__pycache__/
.env
```

---

# 21. Environment Configuration

Use environment variables for configurable values.

Examples:

```text
BACKEND_HOST
BACKEND_PORT
REQUEST_TIMEOUT
```

Do not commit secrets.

The MVP should normally require no secret API keys.

---

# 22. Local Development

Expected setup:

```text
Terminal 1:
cd backend
start FastAPI

Terminal 2:
cd frontend
start Vite
```

Conceptually:

```text
Browser
   │
   ▼
React frontend
   │
   │ REST
   ▼
FastAPI backend
   │
   ▼
Internet target
```

The exact ports are finalized during repository setup.

---

# 23. CORS

During local development, frontend and backend may run on different localhost ports.

Therefore FastAPI may require CORS configuration.

Allow only the development frontend origin rather than unrestricted origins.

---

# 24. Timeout Policy

Network operations must have explicit timeouts.

Never allow an analysis request to wait indefinitely.

Timeouts protect against:

```text
dead hosts
slow servers
blocked ports
network failures
```

The exact value will be selected during implementation/testing.

---

# 25. URL Validation

The MVP analyzes HTTPS targets.

Accept:

```text
https://example.com
```

Reject:

```text
http://example.com
example.com
garbage
```

The frontend can provide early validation, but the backend must validate independently.

---

# 26. Security Boundary

The backend receives user-controlled URLs.

Therefore:

- validate scheme;
- extract hostname safely;
- restrict the target port to the intended HTTPS behavior;
- impose timeouts;
- avoid arbitrary host:port scanning.

If publicly deployed, add SSRF protections for loopback, private, link-local, and other internal/reserved destinations.

---

# 27. Error Handling

Do not expose raw Python exceptions as the API contract.

Bad:

```json
{
  "error": "Traceback..."
}
```

Better:

```json
{
  "error": {
    "code": "CONNECTION_TIMEOUT",
    "message": "The target server did not respond within the allowed time."
  }
}
```

Frontend converts technical error codes into understandable messages.

---

# 28. Logging

Logs should help debugging:

```text
INFO  Received analysis request
INFO  Resolving target
INFO  Establishing TLS connection
INFO  TLS negotiation complete
INFO  Certificate parsed
INFO  Security score generated
```

Do not log secrets or unnecessary sensitive data.

---

# 29. Type/Contract Discipline

The JSON response is an interface between people and modules.

If a field changes:

```text
1. Identify the contract change.
2. Update backend model.
3. Update frontend type.
4. Update producer/consumer code.
5. Update tests.
6. Document the change.
```

Never silently rename fields.

---

# 30. AI-Assisted Development Standard

AI may be used heavily for:

- boilerplate;
- API implementation;
- tests;
- debugging;
- refactoring;
- documentation;
- explanations.

But AI is not the project architect.

Agents must receive:

```text
Shared context
+
Architecture
+
Assigned task
+
Existing relevant code
+
API contract
+
Acceptance criteria
```

before implementation.

---

# 31. AI Agent Prompt Template

Use:

```text
You are working on our Computer Networks project:

TLS/SSL Handshake Visualizer & Website Security Analyzer.

Read:
1. Shared project context
2. System architecture
3. My assigned task
4. Relevant repository files
5. Current API contract

My responsibility:
[PASTE TASK]

Constraints:
- Follow the existing architecture.
- Do not modify unrelated modules.
- Do not invent API fields.
- Do not silently change interfaces.
- Keep the implementation suitable for the Review-1 MVP.
- Add tests where appropriate.
- Prefer simple, maintainable code.
- Explain important networking/security assumptions.

Before coding:
1. Inspect the existing code.
2. Identify relevant files.
3. Give a short implementation plan.
4. Implement the task.
5. Run relevant tests.
6. Report changed files and test results.
7. Report any limitations or assumptions.
```

---

# 32. AI Code Ownership

The member responsible for a module owns:

```text
Correctness
Understanding
Testing
Integration
```

AI-generated code must be reviewed by that member.

Every member should be able to explain their module in the viva.

---

# 33. Technologies Intentionally Excluded from MVP

Avoid unnecessary infrastructure:

```text
MongoDB
PostgreSQL
Redis
Docker
Kubernetes
GraphQL
Microservices
Machine Learning
Authentication
Message queues
```

These can be considered later if a genuine requirement appears.

A clean monolithic FastAPI backend is appropriate for the MVP.

---

# 34. MVP Priority

## P0

```text
HTTPS URL input
Backend API
TLS connection
TLS version
Cipher
Certificate
Security score
Dashboard
Handshake visualization
```

## P1

```text
SAN
Expiry warning
Findings
Recommendations
Loading/error states
Tests
Responsive UI
Documentation
```

## P2

```text
Certificate-chain visualization
HSTS
HTTP security headers
PDF reports
Historical comparisons
Packet capture
```

---


# 35. Final Technology Rule

Do not add a framework or dependency just because an AI agent suggests it.

Ask:

1. What problem does it solve?
2. Is that problem important to the MVP?
3. Can the current stack solve it simply?
4. Does it increase maintenance?
5. Can the team explain it during review?

If not, do not add it.
