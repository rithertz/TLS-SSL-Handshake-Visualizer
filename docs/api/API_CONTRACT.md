# API Contract

## TLS/SSL Handshake Visualizer & Website Security Analyzer

**Course:** Computer Networks --- BCSE308L\
**Document type:** Shared frontend/backend API contract\
**Status:** MVP contract --- freeze before parallel implementation\
**Version:** 1.0\
**Primary endpoint:** `POST /analyze`

------------------------------------------------------------------------

# 1. Purpose

This document defines the shared contract between the frontend, backend,
TLS/certificate analysis modules, security scoring engine, and handshake
visualizer.

It answers:

> **Exactly what data enters the system, what data leaves the system,
> what every field means, what type it has, when it can be absent, and
> which team member owns it.**

This document is a **contract**, not an implementation guide.

The implementation may use different internal classes/functions, but the
externally visible API must follow this specification.

------------------------------------------------------------------------

# 2. Why This Contract Exists

The project has five contributors working on interconnected components.

Without a fixed contract, different modules may independently create
incompatible structures:

``` text
Backend:
tls.version

Frontend:
tlsVersion

Security:
tls_version

Visualizer:
protocolVersion
```

This contract establishes:

``` text
                    API CONTRACT
                         │
             ┌───────────┴───────────┐
             ↓                       ↓
          Backend                 Frontend
             │
       ┌─────┴──────┐
       ↓            ↓
   TLS/Cert      Security
   Analysis       Scoring
       │            │
       └──────┬─────┘
              ↓
        Visualization
```

All contributors must treat this document as the source of truth for the
MVP API.

------------------------------------------------------------------------

# 3. Scope

## Included in MVP

The API supports:

-   HTTPS URL analysis;
-   hostname/port information;
-   DNS resolution information;
-   negotiated TLS version;
-   negotiated cipher information;
-   peer certificate information;
-   certificate validity;
-   certificate SANs;
-   security score;
-   security grade;
-   security findings;
-   recommendations;
-   handshake visualization context;
-   structured errors.

## Not required in MVP

The following are intentionally outside the initial contract:

-   packet capture;
-   raw TLS packet bytes;
-   full browser DevTools-style network traces;
-   persistent scan history;
-   database-backed users;
-   authentication;
-   HTTP security-header analysis unless separately added to the
    contract;
-   complete vulnerability scanning;
-   automated penetration testing;
-   ML-based security classification.

------------------------------------------------------------------------

# 4. Architectural Flow

The expected request flow is:

``` text
User
 ↓
React Frontend
 ↓
POST /analyze
 ↓
FastAPI
 ↓
Input Validation
 ↓
Hostname/DNS
 ↓
TCP Connection :443
 ↓
TLS Negotiation
 ↓
Certificate Extraction/Parsing
 ↓
Security Scoring
 ↓
Visualization Context
 ↓
Unified AnalysisResponse
 ↓
React Dashboard
 ↓
Handshake Visualizer
```

------------------------------------------------------------------------

# 5. API Base

During local development, the backend will normally run on localhost.

Example:

``` text
http://127.0.0.1:<BACKEND_PORT>
```

The frontend must obtain the backend base URL from configuration rather
than hardcoding a machine-specific address throughout components.

The exact development port should be established in the repository setup
documentation.

------------------------------------------------------------------------

# 6. Endpoint Summary

  Method   Endpoint     Purpose
  -------- ------------ -----------------------------
  GET      `/health`    Verify backend availability
  POST     `/analyze`   Analyze an HTTPS target

The MVP does not require additional API endpoints.

------------------------------------------------------------------------

# 7. `GET /health`

## Purpose

Used by:

-   developers;
-   frontend startup checks if desired;
-   integration tests;
-   deployment/debugging.

## Request

``` http
GET /health
```

No request body.

## Successful response

HTTP:

``` text
200 OK
```

Example:

``` json
{
  "status": "ok"
}
```

## Health response contract

``` text
status
type: string
required: yes
allowed MVP value: "ok"
```

The frontend should not depend on additional undocumented fields.

------------------------------------------------------------------------

# 8. `POST /analyze`

## Purpose

Analyze an HTTPS website and return a unified security/network/TLS
result.

## Request

``` http
POST /analyze
Content-Type: application/json
```

Body:

``` json
{
  "url": "https://example.com"
}
```

------------------------------------------------------------------------

# 9. Analysis Request Schema

## `AnalysisRequest`

  Field   Type       Required Description
  ------- -------- ---------- ----------------------
  `url`   string          yes HTTPS URL to analyze

### Rules

The backend must:

1.  validate that the JSON body exists;
2.  validate that `url` exists;
3.  reject empty values;
4.  validate URL syntax;
5.  require HTTPS for the MVP;
6.  determine hostname;
7.  use port `443` unless an explicitly supported port policy is
    introduced.

The backend is authoritative for validation.

------------------------------------------------------------------------

# 10. Valid Request Examples

``` json
{
  "url": "https://example.com"
}
```

``` json
{
  "url": "https://www.example.com/"
}
```

The frontend may normalize obvious whitespace around the value, but
backend validation remains mandatory.

------------------------------------------------------------------------

# 11. Invalid Request Examples

Empty:

``` json
{
  "url": ""
}
```

Missing:

``` json
{}
```

HTTP:

``` json
{
  "url": "http://example.com"
}
```

Malformed:

``` json
{
  "url": "not a valid url"
}
```

------------------------------------------------------------------------

# 12. Successful Analysis Response

The top-level response is:

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

For a successful analysis:

``` text
target         → required
network        → required
tls            → required
certificate    → required
security       → required
visualization  → required
error          → null
```

Some nested fields may be nullable or optional as specified below.

------------------------------------------------------------------------

# 13. Top-Level `AnalysisResponse`

``` text
AnalysisResponse
├── target
├── network
├── tls
├── certificate
├── security
├── visualization
└── error
```

  Field             Type            Required Meaning
  ----------------- ------------- ---------- ------------------------------------
  `target`          object               yes Requested target
  `network`         object               yes Network-level observations
  `tls`             object               yes Negotiated TLS data
  `certificate`     object               yes Peer certificate data
  `security`        object               yes Explainable security analysis
  `visualization`   object               yes Context for handshake visualizer
  `error`           object/null          yes Error information; null on success

------------------------------------------------------------------------

# 14. `TargetInfo`

``` json
{
  "url": "https://example.com",
  "hostname": "example.com",
  "port": 443
}
```

Schema:

  Field        Type        Required Description
  ------------ --------- ---------- -----------------------------------------
  `url`        string           yes Original/normalized requested HTTPS URL
  `hostname`   string           yes Hostname used for analysis
  `port`       integer          yes TCP destination port

For the MVP:

``` text
port = 443
```

unless the team explicitly extends the supported-port policy.

------------------------------------------------------------------------

# 15. `NetworkInfo`

``` json
{
  "resolved_ips": [
    "93.184.216.34"
  ]
}
```

Schema:

  -------------------------------------------------------------------------
  Field            Type                           Required Description
  ---------------- ----------------- --------------------- ----------------
  `resolved_ips`   array\[string\]                     yes IP addresses
                                                           resolved for the
                                                           hostname

  -------------------------------------------------------------------------

An empty array is valid when resolution produced no usable result,
although such a case will normally accompany an error.

Do not use:

``` json
"resolved_ips": null
```

when an empty list accurately represents "no addresses available."

------------------------------------------------------------------------

# 16. `TLSInfo`

Example:

``` json
{
  "version": "TLSv1.3",
  "cipher": {
    "name": "TLS_AES_256_GCM_SHA384",
    "protocol": "TLSv1.3",
    "bits": 256
  }
}
```

Schema:

  Field       Type            Required Description
  ----------- ------------- ---------- -------------------------------
  `version`   string/null          yes Negotiated TLS version
  `cipher`    object               yes Negotiated cipher information

The fields are required at the object level but individual values may be
unavailable in an error/partial-analysis scenario.

------------------------------------------------------------------------

# 17. `CipherInfo`

``` json
{
  "name": "TLS_AES_256_GCM_SHA384",
  "protocol": "TLSv1.3",
  "bits": 256
}
```

  ------------------------------------------------------------------------
  Field            Type                          Required Description
  ---------------- ---------------- --------------------- ----------------
  `name`           string/null                        yes Negotiated
                                                          cipher suite
                                                          name

  `protocol`       string/null                        yes Protocol
                                                          associated with
                                                          the negotiated
                                                          cipher

  `bits`           integer/null                       yes Reported cipher
                                                          security
                                                          level/bit value
                                                          when available
  ------------------------------------------------------------------------

Do not fabricate `bits` if the underlying TLS API does not provide it.

Use:

``` json
"bits": null
```

when unavailable.

------------------------------------------------------------------------

# 18. TLS Version Values

The backend should report the negotiated protocol using the runtime's
canonical representation, with the MVP expected to use values such as:

``` text
TLSv1.2
TLSv1.3
```

If older protocols are encountered, report the actual negotiated version
rather than silently converting it into another value.

The security engine decides how that value affects the score.

The frontend displays it.

The visualizer selects its protocol model from it.

------------------------------------------------------------------------

# 19. `CertificateInfo`

Example:

``` json
{
  "subject": {
    "common_name": "example.com"
  },
  "issuer": {
    "common_name": "Example CA"
  },
  "valid_from": "2026-06-01T00:00:00Z",
  "valid_until": "2026-08-30T23:59:59Z",
  "san": [
    "example.com",
    "www.example.com"
  ],
  "serial_number": "123456789",
  "hostname_match": true,
  "self_signed": false
}
```

------------------------------------------------------------------------

# 20. Certificate Schema

  ---------------------------------------------------------------------------
  Field              Type                           Required Description
  ------------------ ----------------- --------------------- ----------------
  `subject`          object                              yes Certificate
                                                             subject
                                                             attributes

  `issuer`           object                              yes Certificate
                                                             issuer
                                                             attributes

  `valid_from`       string/null                         yes Certificate
                                                             start of
                                                             validity

  `valid_until`      string/null                         yes Certificate
                                                             expiration

  `san`              array\[string\]                     yes Subject
                                                             Alternative
                                                             Names

  `serial_number`    string/null                         yes Certificate
                                                             serial number

  `hostname_match`   boolean/null                        yes Whether
                                                             requested
                                                             hostname matches
                                                             certificate
                                                             identity

  `self_signed`      boolean/null                        yes Whether
                                                             certificate is
                                                             identified as
                                                             self-signed
  ---------------------------------------------------------------------------

The final implementation may expose additional certificate attributes
later, but these are the MVP contract fields.

------------------------------------------------------------------------

# 21. Subject and Issuer Objects

The MVP should keep these structured rather than returning only an
opaque string.

Example:

``` json
{
  "common_name": "example.com"
}
```

Potential additional fields may include:

``` text
organization
organizational_unit
country
state
locality
```

However:

> Only fields actually extracted by the certificate parser should be
> populated.

Missing attributes should not be fabricated.

If the team needs additional fields, update this contract before
frontend integration.

------------------------------------------------------------------------

# 22. Date/Time Format

Certificate timestamps should use ISO-8601-compatible strings.

Preferred form:

``` text
2026-08-30T23:59:59Z
```

The backend should provide a timezone-aware representation.

The frontend may format it for display:

``` text
Aug 30, 2026
```

but should retain the original machine-readable value internally.

------------------------------------------------------------------------

# 23. SAN --- Subject Alternative Names

`san` is always an array.

Example:

``` json
{
  "san": [
    "example.com",
    "www.example.com"
  ]
}
```

If no SAN values are available:

``` json
{
  "san": []
}
```

Do not use:

``` json
"san": null
```

for a genuinely empty SAN list.

------------------------------------------------------------------------

# 24. Hostname Match

This is an important derived certificate property.

Example:

``` json
"hostname_match": true
```

Allowed conceptual states:

``` text
true
false
null
```

Meaning:

``` text
true  → hostname was checked and matched
false → hostname was checked and did not match
null  → unable to determine
```

The security engine must distinguish `false` from `null`.

The frontend should communicate uncertainty rather than presenting
`null` as failure.

------------------------------------------------------------------------

# 25. Self-Signed Indicator

Example:

``` json
"self_signed": false
```

Allowed:

``` text
true
false
null
```

Meaning:

``` text
true  → identified as self-signed
false → identified as not self-signed
null  → unable to determine
```

Do not interpret this field in the frontend.

Shantanu's security engine owns the scoring decision.

------------------------------------------------------------------------

# 26. `SecurityResult`

Example:

``` json
{
  "score": 92,
  "grade": "A",
  "findings": [],
  "recommendations": []
}
```

Schema:

  Field               Type                       Required Description
  ------------------- ------------------------ ---------- -----------------------------------
  `score`             integer                         yes Security score from 0--100
  `grade`             string                          yes Security grade
  `findings`          array\[object\]                 yes Explainable security observations
  `recommendations`   array\[object/string\]          yes Recommended actions

The exact recommendation object shape must be frozen before
implementation if recommendations contain more than text.

For the simplest MVP, recommendations may be structured objects as
defined below.

------------------------------------------------------------------------

# 27. Score

Rules:

``` text
minimum = 0
maximum = 100
```

The score must be an integer for the MVP.

Examples:

``` text
100
92
75
61
0
```

Invalid:

``` text
-5
101
92.73
```

unless the contract is explicitly revised.

------------------------------------------------------------------------

# 28. Grade

Allowed MVP grades:

``` text
A
B
C
D
F
```

The grade is derived from the score according to the scoring
specification.

The frontend must never independently determine the grade.

------------------------------------------------------------------------

# 29. `SecurityFinding`

Recommended structure:

``` json
{
  "rule_id": "CERT_EXPIRY",
  "status": "WARN",
  "severity": "LOW",
  "title": "Certificate expires soon",
  "explanation": "The certificate is approaching the end of its validity period.",
  "evidence": "18 days remaining."
}
```

Schema:

  Field           Type            Required Description
  --------------- ------------- ---------- -----------------------------------
  `rule_id`       string               yes Stable identifier of the rule
  `status`        enum                 yes PASS/WARN/FAIL
  `severity`      enum                 yes INFO/LOW/MEDIUM/HIGH/CRITICAL
  `title`         string               yes Short human-readable title
  `explanation`   string               yes Why the result matters
  `evidence`      string/null          yes Observed/derived supporting value

------------------------------------------------------------------------

# 30. Finding Status

Allowed:

``` text
PASS
WARN
FAIL
```

Meaning:

### PASS

The rule's desired condition was observed.

### WARN

The condition is not ideal but does not represent the strongest failure
state.

### FAIL

A significant negative condition was detected.

Do not use arbitrary values such as:

``` text
GOOD
BAD
CAUTION
DANGER
```

in the API.

------------------------------------------------------------------------

# 31. Finding Severity

Allowed:

``` text
INFO
LOW
MEDIUM
HIGH
CRITICAL
```

Severity and status are not identical.

For example:

``` text
status = WARN
severity = LOW
```

is valid.

The scoring specification defines which severity belongs to each rule
outcome.

------------------------------------------------------------------------

# 32. `Recommendation`

Recommended MVP structure:

``` json
{
  "rule_id": "CERT_EXPIRY",
  "text": "Renew the certificate before expiration."
}
```

Schema:

  Field       Type       Required Description
  ----------- -------- ---------- ----------------------------------------
  `rule_id`   string          yes Rule that generated the recommendation
  `text`      string          yes Actionable recommendation

This allows the UI to connect:

``` text
Finding
   ↓
Recommendation
```

without relying on array ordering.

------------------------------------------------------------------------

# 33. Recommendation Example

``` json
{
  "rule_id": "TLS_VERSION",
  "text": "Prefer modern TLS configurations and disable obsolete protocol versions."
}
```

Recommendations must be technically conservative.

Do not produce claims such as:

``` text
Your website has been hacked.
```

unless the analyzer actually establishes that, which is outside the MVP
scope.

------------------------------------------------------------------------

# 34. Findings vs Recommendations

These are deliberately separate.

### Finding

Answers:

> What did we observe?

### Recommendation

Answers:

> What should be done?

Example:

``` text
Finding:
Certificate expires soon.

Recommendation:
Renew the certificate before expiration.
```

------------------------------------------------------------------------

# 35. `VisualizationInfo`

The visualization object connects real analysis data to Jayanth's
protocol visualizer.

Example:

``` json
{
  "protocol_version": "TLSv1.3",
  "steps": [
    {
      "id": "client_hello",
      "sequence": 1,
      "sender": "client",
      "receiver": "server",
      "message": "ClientHello",
      "title": "ClientHello",
      "description": "The client begins the TLS handshake.",
      "purpose": "Initiate negotiation.",
      "actual_data": null
    }
  ]
}
```

------------------------------------------------------------------------

# 36. Visualization Principle

The visualizer is a **protocol-sequence representation enriched with
real negotiated analysis data**.

It is NOT raw packet capture.

The project must not claim:

``` text
We captured and decoded every TLS packet.
```

unless packet-level capture is implemented later.

The MVP claim should be:

> The analyzer obtains real TLS connection parameters and uses them to
> contextualize an interactive representation of the TLS handshake
> sequence.

------------------------------------------------------------------------

# 37. `VisualizationInfo` Schema

  -----------------------------------------------------------------------------
  Field                Type                           Required Description
  -------------------- ----------------- --------------------- ----------------
  `protocol_version`   string/null                         yes Negotiated TLS
                                                               version used to
                                                               select protocol
                                                               model

  `steps`              array\[object\]                     yes Ordered
                                                               handshake
                                                               sequence
  -----------------------------------------------------------------------------

------------------------------------------------------------------------

# 38. `HandshakeStep`

Recommended structure:

``` json
{
  "id": "client_hello",
  "sequence": 1,
  "sender": "client",
  "receiver": "server",
  "message": "ClientHello",
  "title": "ClientHello",
  "description": "The client begins the TLS handshake.",
  "purpose": "Initiate negotiation.",
  "actual_data": null
}
```

------------------------------------------------------------------------

# 39. Handshake Step Schema

  ------------------------------------------------------------------------
  Field            Type                          Required Description
  ---------------- ---------------- --------------------- ----------------
  `id`             string                             yes Stable step
                                                          identifier

  `sequence`       integer                            yes Display/order
                                                          position

  `sender`         enum                               yes Message sender

  `receiver`       enum                               yes Message receiver

  `message`        string                             yes Protocol message
                                                          name

  `title`          string                             yes User-facing
                                                          title

  `description`    string                             yes Educational
                                                          explanation

  `purpose`        string                             yes Why this message
                                                          exists

  `actual_data`    object/null                        yes Real analysis
                                                          data relevant to
                                                          this step
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 40. Sender/Receiver Values

Allowed:

``` text
client
server
```

For the MVP.

Example:

``` text
ClientHello
sender: client
receiver: server
```

------------------------------------------------------------------------

# 41. `actual_data`

This field exists to connect the abstract protocol step to real analyzed
information.

Example:

``` json
{
  "actual_data": {
    "tls_version": "TLSv1.3",
    "cipher": "TLS_AES_256_GCM_SHA384"
  }
}
```

However:

> Only include actual values that the backend genuinely observed or can
> defensibly associate with that step.

Do not populate every step with fabricated packet contents.

`null` is valid.

------------------------------------------------------------------------

# 42. TLS 1.2 vs TLS 1.3

The visualization sequence may differ between TLS versions.

The backend should provide:

``` text
visualization.protocol_version
```

and Jayanth's visualizer should use the corresponding protocol model.

The exact educational step sequence is owned by Jayanth and should be
documented separately from this API contract.

------------------------------------------------------------------------

# 43. Error Contract

The top-level response contains:

``` json
"error": null
```

on success.

On an analysis failure:

``` json
"error": {
  "code": "DNS_RESOLUTION_FAILED",
  "message": "Unable to resolve the target hostname."
}
```

------------------------------------------------------------------------

# 44. `ErrorInfo`

  Field       Type       Required Description
  ----------- -------- ---------- ------------------------------------
  `code`      string          yes Stable machine-readable error code
  `message`   string          yes Safe user-facing explanation

Do not expose:

``` text
Python stack traces
internal filesystem paths
secrets
debug-only exception details
```

through the public response.

------------------------------------------------------------------------

# 45. Recommended Error Codes

Initial MVP codes:

``` text
INVALID_REQUEST
INVALID_URL
UNSUPPORTED_SCHEME
DNS_RESOLUTION_FAILED
CONNECTION_FAILED
CONNECTION_TIMEOUT
TLS_HANDSHAKE_FAILED
CERTIFICATE_ERROR
ANALYSIS_FAILED
INTERNAL_ERROR
```

The exact set may expand.

New error codes must be documented before frontend implementation
depends on them.

------------------------------------------------------------------------

# 46. HTTP Status vs Error Body

Recommended behavior:

### Validation error

``` text
HTTP 400
```

### Target/network/TLS analysis failure

Depending on the agreed implementation policy, these may use a
controlled 4xx/5xx response or a successful analysis envelope containing
`error`.

The team must choose one consistent policy before final implementation.

For the MVP, the recommended approach is:

``` text
Client/input validation failure
→ HTTP 400

Expected target-analysis failure
→ HTTP 200 with structured `error`

Unexpected backend failure
→ HTTP 500
```

This keeps expected website-analysis failures distinguishable from
server crashes.

------------------------------------------------------------------------

# 47. Partial Results

A failed analysis may not have complete data.

Example:

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
    "version": null,
    "cipher": {
      "name": null,
      "protocol": null,
      "bits": null
    }
  },
  "certificate": {
    "subject": {},
    "issuer": {},
    "valid_from": null,
    "valid_until": null,
    "san": [],
    "serial_number": null,
    "hostname_match": null,
    "self_signed": null
  },
  "security": {
    "score": 0,
    "grade": "F",
    "findings": [],
    "recommendations": []
  },
  "visualization": {
    "protocol_version": null,
    "steps": []
  },
  "error": {
    "code": "TLS_HANDSHAKE_FAILED",
    "message": "Unable to establish a TLS connection."
  }
}
```

However:

> The team should not automatically interpret `score: 0` as "the website
> is definitely insecure" when analysis itself failed.

A failed analysis is different from a successfully analyzed website
receiving zero.

Therefore the scoring model may need an explicit analysis-state
distinction.

------------------------------------------------------------------------

# 48. Important Recommendation: Analysis State

To prevent the ambiguity above, the final implementation should consider
adding:

``` json
"analysis_status": "SUCCESS"
```

at the top level.

Allowed values:

``` text
SUCCESS
PARTIAL
FAILED
```

This field is recommended for the MVP.

Then:

``` text
SUCCESS + score 0
```

means:

> Analysis completed and produced a zero score.

while:

``` text
FAILED
```

means:

> A meaningful security score could not be established because analysis
> failed.

If adopted, the top-level schema becomes:

``` json
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

**Team decision required:** This should be frozen before coding.

------------------------------------------------------------------------

# 49. Data Ownership Matrix

  Data                         Primary Owner   Consumer
  ---------------------------- --------------- --------------------------
  URL validation               rithertz         Sujay
  Target                       rithertz         Sujay
  Resolved IPs                 rithertz         Sujay
  TLS version                  rithertz         Jayanth, Sujay, Shantanu
  Cipher                       rithertz         Sujay, Shantanu, Jayanth
  Certificate                  rithertz         Shantanu, Sujay
  Security rules               Shantanu        rithertz, Sujay
  Security score               Shantanu        Sujay
  Findings                     Shantanu        Sujay
  Recommendations              Shantanu        Sujay
  Visualization model          Jayanth         Sujay
  Integration contract tests   Dheeraj         Everyone

------------------------------------------------------------------------

# 50. Source-of-Truth Rules

This is extremely important.

## TLS data

Source of truth:

``` text
rithertz's TLS analyzer
```

## Certificate data

Source of truth:

``` text
rithertz's certificate parser
```

## Security score

Source of truth:

``` text
Shantanu's security engine
```

## Visualization protocol sequence

Source of truth:

``` text
Jayanth's visualizer model
```

## Display

Source of truth:

``` text
Sujay's frontend
```

But Sujay does not alter the underlying meaning of backend data.

------------------------------------------------------------------------

# 51. Frontend Rules

Sujay's frontend:

``` text
READS API DATA
      ↓
FORMATS IT
      ↓
DISPLAYS IT
```

It must NOT:

``` text
recalculate score
reinterpret TLS security policy
parse X.509 certificates
perform DNS
open TLS sockets
invent findings
```

------------------------------------------------------------------------

# 52. Security Engine Rules

Shantanu's security engine:

``` text
RECEIVES structured observations
      ↓
EVALUATES rules
      ↓
PRODUCES security result
```

It must NOT:

``` text
open network connections
parse raw certificates
call frontend code
depend on React
```

------------------------------------------------------------------------

# 53. TLS Analyzer Rules

rithertz's analyzer:

``` text
RECEIVES validated target
      ↓
network/TLS analysis
      ↓
structured observations
```

It must not embed frontend presentation logic.

------------------------------------------------------------------------

# 54. Visualizer Rules

Jayanth's visualizer:

``` text
RECEIVES protocol/context data
      ↓
renders educational handshake sequence
```

It must not become a second TLS analyzer.

------------------------------------------------------------------------

# 55. Integration Rules

Dheeraj's integration tests should verify:

``` text
request
 ↓
API
 ↓
analysis
 ↓
security result
 ↓
response
```

and that the frontend can safely consume the response.

------------------------------------------------------------------------

# 56. Nullability Rules

Use `null` when:

> The field conceptually exists but could not be determined or is
> unavailable.

Use an empty array when:

> The field is a list and there are zero values.

Examples:

``` json
"san": []
```

not:

``` json
"san": null
```

when there are simply no SAN values.

For scalar values:

``` json
"valid_until": null
```

is acceptable if the certificate could not be parsed.

------------------------------------------------------------------------

# 57. No Fabricated Data

This is a hard project rule.

Never invent:

``` text
TLS version
cipher
certificate issuer
certificate expiry
resolved IP
security evidence
```

If unavailable:

``` text
null
```

or:

``` text
[]
```

according to the field's nullability rule.

------------------------------------------------------------------------

# 58. Real Data vs Derived Data

The response contains both.

## Observed data

Examples:

``` text
resolved IP
negotiated TLS version
negotiated cipher
certificate fields
```

## Derived data

Examples:

``` text
hostname_match
security score
grade
finding
recommendation
```

The project should distinguish these conceptually.

For viva:

> Observed properties come from the actual connection/certificate;
> derived properties are calculated from those observations using
> deterministic rules.

------------------------------------------------------------------------

# 59. JSON Naming Convention

Use:

``` text
snake_case
```

throughout the API.

Examples:

``` text
resolved_ips
valid_from
valid_until
serial_number
hostname_match
self_signed
protocol_version
actual_data
rule_id
```

Do not mix:

``` text
snake_case
camelCase
PascalCase
```

in the same contract.

------------------------------------------------------------------------

# 60. TypeScript Mapping

Frontend types should preserve the API naming exactly unless the team
intentionally introduces a transformation layer.

Example:

``` ts
interface TLSInfo {
  version: string | null;
  cipher: CipherInfo;
}
```

Not:

``` ts
interface TLSInfo {
  tlsVersion: string;
}
```

unless the API client deliberately transforms it.

For MVP:

> Prefer no transformation layer unless necessary.

This reduces integration complexity.

------------------------------------------------------------------------

# 61. Python/Pydantic Mapping

The backend should represent the contract using typed models.

Conceptually:

``` python
class AnalysisRequest(BaseModel):
    url: str
```

and:

``` python
class AnalysisResponse(BaseModel):
    target: TargetInfo
    network: NetworkInfo
    tls: TLSInfo
    certificate: CertificateInfo
    security: SecurityResult
    visualization: VisualizationInfo
    error: ErrorInfo | None
```

Exact implementation belongs to rithertz.

------------------------------------------------------------------------

# 62. Example Complete Success Response

``` json
{
  "analysis_status": "SUCCESS",

  "target": {
    "url": "https://example.com",
    "hostname": "example.com",
    "port": 443
  },

  "network": {
    "resolved_ips": [
      "93.184.216.34"
    ]
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
    "subject": {
      "common_name": "example.com"
    },
    "issuer": {
      "common_name": "Example CA"
    },
    "valid_from": "2026-06-01T00:00:00Z",
    "valid_until": "2026-08-30T23:59:59Z",
    "san": [
      "example.com",
      "www.example.com"
    ],
    "serial_number": "123456789",
    "hostname_match": true,
    "self_signed": false
  },

  "security": {
    "score": 92,
    "grade": "A",
    "findings": [
      {
        "rule_id": "CERT_EXPIRY",
        "status": "WARN",
        "severity": "LOW",
        "title": "Certificate expires soon",
        "explanation": "The certificate is approaching the end of its validity period.",
        "evidence": "18 days remaining."
      }
    ],
    "recommendations": [
      {
        "rule_id": "CERT_EXPIRY",
        "text": "Renew the certificate before expiration."
      }
    ]
  },

  "visualization": {
    "protocol_version": "TLSv1.3",
    "steps": [
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
    ]
  },

  "error": null
}
```

------------------------------------------------------------------------

# 63. Example Failed Response

``` json
{
  "analysis_status": "FAILED",

  "target": {
    "url": "https://unreachable.example",
    "hostname": "unreachable.example",
    "port": 443
  },

  "network": {
    "resolved_ips": []
  },

  "tls": {
    "version": null,
    "cipher": {
      "name": null,
      "protocol": null,
      "bits": null
    }
  },

  "certificate": {
    "subject": {},
    "issuer": {},
    "valid_from": null,
    "valid_until": null,
    "san": [],
    "serial_number": null,
    "hostname_match": null,
    "self_signed": null
  },

  "security": {
    "score": 0,
    "grade": "F",
    "findings": [],
    "recommendations": []
  },

  "visualization": {
    "protocol_version": null,
    "steps": []
  },

  "error": {
    "code": "DNS_RESOLUTION_FAILED",
    "message": "Unable to resolve the target hostname."
  }
}
```

Again:

> `analysis_status = FAILED` prevents the UI from misleadingly treating
> `score = 0` as proof of an insecure website.

------------------------------------------------------------------------

# 64. API Contract Testing

Dheeraj should create tests verifying:

``` text
[ ] required top-level fields exist
[ ] field names are correct
[ ] field types are correct
[ ] nullability is correct
[ ] arrays are arrays
[ ] score is 0–100
[ ] grade is A–F
[ ] finding status is valid
[ ] finding severity is valid
[ ] error shape is valid
```

------------------------------------------------------------------------

# 65. Contract Change Procedure

The API must not change casually.

If someone needs a change:

``` text
Need identified
      ↓
Explain why
      ↓
Check affected owners
      ↓
Update API_CONTRACT.md
      ↓
Update Python models
      ↓
Update TypeScript types
      ↓
Update tests
      ↓
Integrate
```

Affected members should be informed before merging the change.

------------------------------------------------------------------------

# 66. Versioning

For the academic MVP, a separate public API version such as:

``` text
/api/v1/analyze
```

is optional.

The project can use:

``` text
POST /analyze
```

for simplicity.

This document itself should carry a contract version:

``` text
Version: 1.0
```

When the schema changes materially:

``` text
1.0 → 1.1
```

for compatible additions, or:

``` text
1.x → 2.0
```

for breaking changes.

------------------------------------------------------------------------

# 67. Backward Compatibility

Adding an optional field is generally safer than renaming/removing an
existing field.

Prefer:

``` text
add optional field
```

over:

``` text
rename tls.version → tls.protocol_version
```

after frontend development has started.

Breaking changes require:

``` text
contract update
+
backend update
+
frontend update
+
tests
```

------------------------------------------------------------------------

# 68. What Should NOT Be Added Yet

Do not add these to the MVP contract unless a real requirement appears:

``` text
user accounts
database IDs
scan history
authentication tokens
webhooks
background jobs
PDF URLs
AI-generated explanations
ML confidence
packet captures
HTTP header scanning
```

These can be future extensions.

The MVP contract should stay small enough for the team to implement
reliably.

------------------------------------------------------------------------

# 69. Future Extensions

Possible P2 extensions include:

``` text
HSTS analysis
HTTP security headers
certificate-chain visualization
certificate-chain trust details
historical scans
PDF export
comparison between scans
packet-level capture
richer visualization metadata
```

Any extension must be added to the contract before implementation.

------------------------------------------------------------------------

# 70. Final Freeze Checklist

Before creating the project structure:

``` text
[ ] endpoint names finalized
[ ] request JSON finalized
[ ] response JSON finalized
[ ] naming convention finalized
[ ] nullable fields finalized
[ ] error format finalized
[ ] security result finalized
[ ] finding structure finalized
[ ] recommendation structure finalized
[ ] visualization structure finalized
[ ] analysis_status decision made
[ ] score range finalized
[ ] grade values finalized
[ ] HTTP error policy finalized
```

------------------------------------------------------------------------

# 71. Team Sign-Off

All five members should read this document before implementation.

### rithertz

Confirm:

``` text
[ ] backend can produce the required fields
[ ] Python models can represent the contract
[ ] error behavior is implementable
```

### Jayanth

Confirm:

``` text
[ ] visualization fields are sufficient
[ ] protocol version selection works
[ ] handshake step representation is sufficient
```

### Shantanu

Confirm:

``` text
[ ] required security inputs exist
[ ] security output is sufficient
[ ] findings/recommendations structure works
```

### Sujay

Confirm:

``` text
[ ] dashboard can render the response
[ ] null/optional behavior is clear
[ ] error response is usable
```

### Dheeraj

Confirm:

``` text
[ ] contract can be tested
[ ] integration path is clear
[ ] clean API fixtures can be created
```

------------------------------------------------------------------------

# 72. Final Rule

Once the team agrees on this contract:

> **Code should adapt to the contract. The contract should not
> constantly adapt to whichever code was written first.**

This is the foundation that allows five people to work in parallel
without constantly breaking one another's modules.

------------------------------------------------------------------------

# 73. Immediate Next Steps After This Document

Do **not** start implementing features yet.

The next sequence should be:

``` text
1. Team reviews API_CONTRACT.md
        ↓
2. Resolve remaining contract decisions
        ↓
3. Freeze Version 1.0
        ↓
4. Create GitHub repository
        ↓
5. Add all four collaborators
        ↓
6. Create repository structure
        ↓
7. Add README + .gitignore + docs
        ↓
8. Add API contract
        ↓
9. Add initial Python/TypeScript model skeletons
        ↓
10. Run basic health endpoint/frontend shell
        ↓
11. FIRST COMMIT
        ↓
12. Branches for individual work
        ↓
13. Parallel implementation
```

The first commit should establish a **clean, buildable project
foundation**, not contain unfinished feature implementations.
