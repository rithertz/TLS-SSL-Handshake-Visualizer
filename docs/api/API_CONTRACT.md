# API Contract

## TLS/SSL Handshake Visualizer & Website Security Analyzer

**Course:** Computer Networks — BCSE308L
**Document type:** Shared frontend/backend API contract
**Status:** MVP contract — aligned with current implementation
**Version:** 1.1

---

# 1. Purpose

This document defines the shared contract between the React frontend and FastAPI backend.

It specifies:

- request structure;
- response structure;
- field names and types;
- nullability;
- error behavior;
- security-analysis output;
- visualization context.

The implementation may use different internal classes/functions, but the externally visible API must follow this contract.

---

# 2. Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Verify that the backend is running |
| POST | `/analyze` | Analyze an HTTPS target |

---

# 3. `GET /health`

## Request

```http
GET /health
```

No request body.

## Success

HTTP `200 OK`

```json
{
  "status": "ok"
}
```

---

# 4. `POST /analyze`

## Request

```http
POST /analyze
Content-Type: application/json
```

Example:

```json
{
  "url": "https://example.com"
}
```

The backend is authoritative for URL validation.

---

# 5. Request Schema

## `AnalyzeRequest`

| Field | Type | Required | Description |
|---|---|---:|---|
| `url` | string | yes | HTTPS URL to analyze |

Current validation rules:

- URL must be non-empty.
- HTTPS scheme is required.
- Credentials in the URL are rejected.
- Port must be `443` when explicitly supplied.
- A hostname must be present.
- URL paths are allowed.

---

# 6. Response Overview

`POST /analyze` returns an `AnalyzeResponse`.

Top-level fields:

```text
analysis_status
target
network
tls
certificate
security
visualization
error
```

`analysis_status` is always present.

The remaining sections may be `null` when the analysis cannot obtain that information.

---

# 7. `AnalyzeResponse`

```json
{
  "analysis_status": "SUCCESS",
  "target": {},
  "network": {},
  "tls": {},
  "certificate": {},
  "security": {},
  "visualization": {},
  "error": null
}
```

## `analysis_status`

Allowed values:

```text
SUCCESS
PARTIAL
FAILED
```

Meaning:

- `SUCCESS` — analysis completed successfully.
- `PARTIAL` — useful analysis data was obtained, but some expected information is unavailable.
- `FAILED` — the requested analysis could not be completed.

The UI must use `analysis_status` to distinguish an actual low security score from an analysis failure.

---

# 8. Nullability

For scalar values:

```json
null
```

means the value could not be determined or is unavailable.

For lists:

```json
[]
```

means there are zero available values.

Do not fabricate unavailable networking, TLS, certificate, or security data.

---

# 9. `TargetInfo`

```json
{
  "url": "https://example.com",
  "hostname": "example.com",
  "port": 443
}
```

| Field | Type | Required |
|---|---|---:|
| `url` | string | yes |
| `hostname` | string | yes |
| `port` | integer | yes |

---

# 10. `NetworkInfo`

```json
{
  "resolved_ips": [
    "93.184.216.34"
  ]
}
```

| Field | Type | Required |
|---|---|---:|
| `resolved_ips` | array of strings | yes |

If DNS resolution does not produce addresses:

```json
{
  "resolved_ips": []
}
```

---

# 11. `TLSInfo`

```json
{
  "version": "TLSv1.3",
  "cipher": {
    "name": "TLS_AES_256_GCM_SHA384",
    "protocol": "TLSv1.3",
    "bits": 256
  }
}
```

| Field | Type | Required |
|---|---|---:|
| `version` | string or null | yes |
| `cipher` | `CipherInfo` | yes |

---

# 12. `CipherInfo`

| Field | Type | Required |
|---|---|---:|
| `name` | string or null | yes |
| `protocol` | string or null | yes |
| `bits` | integer or null | yes |

`bits` must be `null` when the underlying TLS API does not provide a value.

Do not invent cipher strength.

---

# 13. TLS Version

The backend reports the runtime's negotiated protocol representation, for example:

```text
TLSv1.2
TLSv1.3
```

The backend reports the observed negotiated value rather than converting it into another value.

The security engine decides how the version affects the score.

The frontend displays it.

The visualizer uses it to select the appropriate protocol model.

---

# 14. `CertificateInfo`

The current implementation exposes certificate subject and issuer as strings.

Example:

```json
{
  "subject": "CN=example.com",
  "issuer": "CN=Cloudflare TLS Issuing ECC CA 3,O=SSL Corporation,C=US",
  "valid_from": "2026-07-29T22:10:08+00:00",
  "valid_until": "2026-10-27T22:17:21+00:00",
  "san": [
    "example.com",
    "*.example.com"
  ],
  "serial_number": "123456789",
  "hostname_match": true,
  "self_signed": false
}
```

| Field | Type | Required |
|---|---|---:|
| `subject` | string or null | yes |
| `issuer` | string or null | yes |
| `valid_from` | string or null | yes |
| `valid_until` | string or null | yes |
| `san` | array of strings | yes |
| `serial_number` | string or null | yes |
| `hostname_match` | boolean or null | yes |
| `self_signed` | boolean or null | yes |

The string representation is the certificate library's RFC4514-style distinguished-name representation.

---

# 15. Certificate Date Format

Certificate timestamps are timezone-aware ISO-8601-compatible strings.

Example:

```text
2026-10-27T22:17:21+00:00
```

The frontend may format these values for display but should preserve the machine-readable value internally.

---

# 16. SAN

`san` is always an array.

Example:

```json
{
  "san": [
    "example.com",
    "www.example.com"
  ]
}
```

If no SAN values are available:

```json
{
  "san": []
}
```

---

# 17. Hostname Match

`hostname_match` is a derived property.

Allowed values:

```text
true
false
null
```

Meaning:

```text
true  = checked and matched
false = checked and did not match
null  = unable to determine
```

The security engine must distinguish `false` from `null`.

---

# 18. Self-Signed

`self_signed` is a derived certificate property.

Allowed values:

```text
true
false
null
```

Meaning:

```text
true  = subject and issuer metadata match, so it appears self-signed
false = subject and issuer metadata differ, so it does not appear self-signed
null  = unable to determine
```

This is not full certificate-chain, revocation, or browser-trust validation. The frontend should display this value but should not duplicate the security-scoring logic.

---

# 19. `SecurityResult`

```json
{
  "score": 100,
  "grade": "A",
  "findings": [],
  "recommendations": []
}
```

| Field | Type | Required |
|---|---|---:|
| `score` | integer 0–100 | yes |
| `grade` | A/B/C/D/E/F | yes |
| `findings` | array of `SecurityFinding` | yes |
| `recommendations` | array of `Recommendation` | yes |

The score is an explainable educational assessment, not a replacement for professional security auditing.

---

# 20. `SecurityFinding`

```json
{
  "rule_id": "TLS_VERSION",
  "status": "PASS",
  "severity": "INFO",
  "title": "TLS version is supported",
  "explanation": "The server negotiated TLS 1.3.",
  "evidence": "TLSv1.3"
}
```

| Field | Type | Required |
|---|---|---:|
| `rule_id` | string | yes |
| `status` | PASS/WARN/FAIL | yes |
| `severity` | INFO/LOW/MEDIUM/HIGH/CRITICAL | yes |
| `title` | string | yes |
| `explanation` | string | yes |
| `evidence` | string, array of strings, or null | no |

`evidence` supports either one value or multiple evidence values because the current security engine may provide more than one observation.

---

# 21. `Recommendation`

```json
{
  "rule_id": "CERT_EXPIRY",
  "text": "Renew the certificate before expiration."
}
```

| Field | Type | Required |
|---|---|---:|
| `rule_id` | string | yes |
| `text` | string | yes |

---

# 22. Security Grade

The score range is:

```text
0–100
```

Allowed grades:

```text
A
B
C
D
E
F
```

The exact scoring weights belong to `docs/scoring/SECURITY_SCORING.md`.

The frontend must not reimplement the grade calculation.

---

# 23. `VisualizationInfo`

```json
{
  "protocol_version": "TLSv1.3",
  "steps": []
}
```

| Field | Type | Required |
|---|---|---:|
| `protocol_version` | string or null | yes |
| `steps` | array of `HandshakeStep` | yes |

---

# 24. `HandshakeStep`

```json
{
  "id": "client_hello",
  "sequence": 1,
  "sender": "client",
  "receiver": "server",
  "message": "ClientHello",
  "title": "ClientHello",
  "description": "The client begins the TLS handshake.",
  "purpose": "Initiate negotiation.",
  "actual_data": {
    "tls_version": "TLSv1.3"
  }
}
```

| Field | Type | Required |
|---|---|---:|
| `id` | string | yes |
| `sequence` | integer | yes |
| `sender` | `client` or `server` | yes |
| `receiver` | `client` or `server` | yes |
| `message` | string | yes |
| `title` | string | yes |
| `description` | string | yes |
| `purpose` | string | yes |
| `actual_data` | object or null | yes |

---

# 25. Visualization Data Rule

The visualizer is a conceptual protocol representation.

The backend must only place genuinely observed or defensibly derived information in `actual_data`.

It must not fabricate raw packet contents.

The MVP does not capture raw TLS packets.

---

# 26. `ErrorInfo`

```json
{
  "code": "CONNECTION_TIMEOUT",
  "message": "The target server did not respond within the allowed time."
}
```

| Field | Type | Required |
|---|---|---:|
| `code` | string | yes |
| `message` | string | yes |

Do not expose:

- Python stack traces;
- internal filesystem paths;
- secrets;
- debug-only exception details.

---

# 27. Error Codes

Backend-emitted analysis failure codes in the current implementation:

```text
CONNECTION_TIMEOUT
ANALYSIS_ERROR
NETWORK_ERROR
```

Route-level invalid input is returned as HTTP 400 with a `detail` string rather than an `ErrorInfo` envelope.

The frontend may also surface local transport or compatibility codes such as `CONNECTION_FAILED`, `SERVER_ERROR`, `INVALID_URL`, or legacy fixture codes in tests. New backend-emitted error codes should be documented before use.

---

# 28. HTTP Status Policy

The current implementation follows this policy:

### Invalid URL/input

```text
HTTP 400
```

### Expected target-analysis failure

```text
HTTP 200
```

with:

```json
{
  "analysis_status": "FAILED",
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

### Unexpected server-level failure

```text
HTTP 500
```

This allows the frontend to distinguish:

```text
invalid user input
vs.
target website failure
vs.
backend failure
```

---

# 29. Partial Results

`analysis_status = PARTIAL` is reserved for cases where useful analysis data is available but the complete expected analysis could not be produced.

Unavailable scalar fields should be `null`.

Unavailable list fields should be `[]`.

The frontend must not assume every successful-looking response contains every optional value.

---

# 30. Observed vs Derived Data

### Observed

Examples:

```text
resolved IP
negotiated TLS version
negotiated cipher
certificate subject
certificate issuer
certificate validity
SAN
serial number
```

### Derived

Examples:

```text
hostname_match
self_signed
security score
grade
findings
recommendations
```

For the viva:

> Observed properties come from the actual connection or certificate. Derived properties are calculated from those observations using deterministic rules.

---

# 31. JSON Naming Convention

Use `snake_case` throughout the API.

Examples:

```text
resolved_ips
valid_from
valid_until
serial_number
hostname_match
self_signed
protocol_version
actual_data
rule_id
analysis_status
```

Do not introduce camelCase API fields without an explicit contract change.

---

# 32. Frontend Mapping

The TypeScript types in:

```text
frontend/src/types/analysis.ts
```

must mirror this contract.

The frontend should preferably consume the response without a separate transformation layer.

---

# 33. Backend Mapping

The Pydantic models in:

```text
backend/app/models/schemas.py
```

represent the API contract.

Internal implementation details must not leak into the public response.

---

# 34. No Fabricated Data

Never invent:

```text
TLS version
cipher
certificate issuer
certificate expiry
resolved IP
security evidence
```

Use:

```text
null
```

or:

```text
[]
```

according to the field definition.

---

# 35. Contract Change Procedure

If a field or behavior needs to change:

```text
Need identified
      ↓
Check affected owners
      ↓
Update API_CONTRACT.md
      ↓
Update backend Pydantic models
      ↓
Update frontend TypeScript types
      ↓
Update producer/consumer code
      ↓
Update tests
      ↓
Run full integration checks
```

Do not silently rename or change fields.

---

# 36. Compatibility

Adding an optional field is generally safer than renaming or removing an existing field.

Breaking changes require coordinated updates to:

```text
contract
backend
frontend
tests
documentation
```

---

# 37. API Contract Testing

Integration/contract tests should verify:

```text
[ ] /health returns status = ok
[ ] /analyze accepts valid HTTPS URL
[ ] invalid URL produces HTTP 400
[ ] expected analysis failure produces structured error
[ ] analysis_status is valid
[ ] field names use snake_case
[ ] certificate subject/issuer are strings or null
[ ] evidence accepts string/list/null
[ ] score is 0–100
[ ] grade is A–F
[ ] finding status is valid
[ ] finding severity is valid
[ ] error shape is valid
[ ] SAN is always an array
```

---

# 38. Current Implementation Alignment

This version intentionally aligns the contract with the current working backend.

Important implementation-aligned decisions:

1. `certificate.subject` is a string or null.
2. `certificate.issuer` is a string or null.
3. `security.findings[].evidence` may be a string, string array, or null.
4. `analysis_status` is mandatory.
5. Analysis failures use a structured response envelope.
6. Invalid URL input uses HTTP 400.
7. The score and grade are produced by the backend rather than the frontend.
8. The visualizer receives protocol context and conceptual handshake steps.

---

# 39. Technical Honesty

The project performs real DNS/TCP/TLS operations and extracts real negotiated TLS and certificate information.

The handshake visualization is not raw packet capture.

Therefore:

> Do not describe the MVP as a packet sniffer, packet analyzer, or browser-network-trace replacement.

---

# 40. Contract Freeze

**Version 1.1** should be treated as the current implementation-aligned MVP contract.

After the team agrees to this version:

```text
Frontend → implement against this contract
Backend  → preserve this contract
Security → produce this structure
Visualizer → consume this structure
Testing → validate this structure
```

Any later breaking change requires a new contract version and coordinated updates.
