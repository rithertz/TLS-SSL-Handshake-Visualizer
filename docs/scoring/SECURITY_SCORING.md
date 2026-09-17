# Security Scoring Specification

## Purpose

This document is the authoritative explanation of the current security scoring system.

The scoring engine converts observed TLS and certificate properties into:

- structured findings;
- a numerical score from 0 to 100;
- a letter grade from A to F;
- recommendations for warning/failure conditions.

The score is an educational, explainable assessment of the properties inspected by this project. It is not a professional security audit or complete vulnerability scanner.

## Implementation Location

Current implementation:

```text
backend/app/security/rules.py
backend/app/security/scorer.py
backend/app/security/recommendations.py
```

Tests are under:

```text
backend/tests/
```

The backend owns score calculation. The frontend renders score data but does not recalculate it.

## Scoring Philosophy

The system is deliberately rule based.

Each rule examines one observable or derived property and produces a finding with:

- stable `rule_id`;
- `status`;
- `severity`;
- `title`;
- `explanation`;
- `evidence`.

Rule statuses:

```text
PASS
WARN
FAIL
```

Finding severities:

```text
INFO
LOW
MEDIUM
HIGH
CRITICAL
```

The scorer starts from:

```text
100 points
```

Penalties are applied according to current rule behavior. The final score is clamped to:

```text
0-100
```

This model is used because it is:

- deterministic;
- transparent;
- easy to test;
- easy to explain during a viva;
- directly connected to observed networking/certificate data;
- appropriate for the MVP scope.

## Determinism

For the same inputs, the scorer should produce the same:

- score;
- grade;
- findings;
- recommendations.

The scorer should not depend on randomness or external calls. The only time-sensitive behavior is certificate date comparison against the current time or an injected test time.

## Grade Calculation

| Score | Grade |
|---:|:---:|
| 90-100 | A |
| 80-89 | B |
| 70-79 | C |
| 60-69 | D |
| 50-59 | E |
| 0-49 | F |

The grade is calculated after all applicable penalties have been applied and the score is clamped.

## Current Rules

The current implementation evaluates six rule IDs:

```text
TLS_VERSION
CERT_EXPIRY
HOSTNAME_MATCH
EXPIRY_PROXIMITY
SELF_SIGNED
CERT_IDENTITY
```

## Rule: TLS Version

Rule ID:

```text
TLS_VERSION
```

Purpose:

Checks the TLS protocol version negotiated with the target server.

Current behavior:

| Condition | Status | Severity | Penalty |
|---|---|---|---:|
| `TLSv1.3` | PASS | INFO | 0 |
| `TLSv1.2` | WARN | LOW | -10 |
| other, obsolete, or unavailable | FAIL | HIGH | -30 |

Interpretation:

TLS 1.3 receives the strongest result. TLS 1.2 remains acceptable and widely compatible, but TLS 1.3 is preferred in this educational scoring model.

## Rule: Certificate Validity Interval

Rule ID:

```text
CERT_EXPIRY
```

Purpose:

Checks whether certificate validity timestamps are present, parseable, and currently active.

Current behavior:

| Condition | Status | Severity | Penalty |
|---|---|---|---:|
| `valid_from <= now <= valid_until` | PASS | INFO | 0 |
| expired or not yet valid | FAIL | HIGH | -30 |
| missing timestamps | FAIL | HIGH | -30 |
| unparsable timestamps | FAIL | HIGH | -30 |

The implementation uses ISO-8601-compatible timestamp strings from the parsed certificate data.

## Rule: Hostname Match

Rule ID:

```text
HOSTNAME_MATCH
```

Purpose:

Checks whether the requested hostname matches the certificate identity information.

Current behavior:

| Condition | Status | Severity | Penalty |
|---|---|---|---:|
| `hostname_match is True` | PASS | INFO | 0 |
| `hostname_match` is false or unavailable | FAIL | CRITICAL | -35 |

A hostname mismatch is heavily penalized because the certificate may not authenticate the requested website identity.

## Rule: Expiry Proximity

Rule ID:

```text
EXPIRY_PROXIMITY
```

Purpose:

Warns when a currently valid certificate is close to expiration.

Current behavior:

| Condition | Status | Severity | Penalty |
|---|---|---|---:|
| more than 30 days remaining | PASS | INFO | 0 |
| 8-30 days remaining | WARN | LOW | -10 |
| 0-7 days remaining | WARN | MEDIUM | -15 |

Anti-double-counting rule:

`EXPIRY_PROXIMITY` runs only when `CERT_EXPIRY` passed. If the certificate is already expired, not yet valid, missing, or unparsable, the proximity rule is skipped because the validity rule already captured the problem.

## Rule: Self-Signed Certificate Indicator

Rule ID:

```text
SELF_SIGNED
```

Purpose:

Checks whether the certificate appears self-signed based on subject and issuer metadata.

Current behavior:

| Condition | Status | Severity | Penalty |
|---|---|---|---:|
| `self_signed is False` | PASS | INFO | 0 |
| `self_signed is True` | WARN | HIGH | -25 |
| `self_signed is null` | no finding | n/a | 0 |

Important trust boundary:

```text
not self-signed != trusted CA chain
```

A `false` value means subject and issuer metadata differ. It does not prove complete certificate-chain trust, revocation status, CT log presence, or browser trust.

## Rule: Certificate Identity Metadata

Rule ID:

```text
CERT_IDENTITY
```

Purpose:

Adds an informational finding when subject and issuer metadata are present.

Current behavior:

| Condition | Status | Severity | Penalty |
|---|---|---|---:|
| subject and issuer are present | PASS | INFO | 0 |
| either value is missing | no finding | n/a | 0 |

This rule currently improves explainability but does not change the score.

## Score Calculation

Conceptual current algorithm:

```text
score = 100

apply TLS_VERSION penalty
apply CERT_EXPIRY penalty
apply HOSTNAME_MATCH penalty

if certificate is valid:
    apply EXPIRY_PROXIMITY penalty

if self_signed is true:
    apply SELF_SIGNED penalty

if subject and issuer are present:
    add CERT_IDENTITY info finding

score = max(0, min(100, score))
grade = grade_from_score(score)
```

The executable behavior in `backend/app/security/scorer.py` remains authoritative.

## Examples

### Example A: Strong Result

Observed:

```text
TLS version: TLSv1.3
Certificate validity: active
Hostname match: true
Expiry proximity: more than 30 days
Self-signed: false
Subject and issuer: present
```

Penalty:

```text
0
```

Score:

```text
100
```

Grade:

```text
A
```

### Example B: TLS 1.2

Observed:

```text
TLS version: TLSv1.2
Certificate validity: active
Hostname match: true
Expiry proximity: more than 30 days
Self-signed: false
```

Penalty:

```text
10
```

Score:

```text
90
```

Grade:

```text
A
```

### Example C: TLS 1.2 And Self-Signed

Observed:

```text
TLS version: TLSv1.2
Certificate validity: active
Hostname match: true
Self-signed: true
```

Penalty:

```text
10 + 25 = 35
```

Score:

```text
65
```

Grade:

```text
D
```

### Example D: Multiple Certificate Problems

Observed:

```text
TLS version: TLSv1.2
Certificate validity: expired
Hostname match: false
Self-signed: true
```

Penalty:

```text
10 + 30 + 35 + 25 = 100
```

Score:

```text
0
```

Grade:

```text
F
```

### Example E: Valid But Near Expiry

Observed:

```text
TLS version: TLSv1.3
Certificate validity: active
Hostname match: true
Expiry proximity: 5 days
Self-signed: false
```

Penalty:

```text
15
```

Score:

```text
85
```

Grade:

```text
B
```

## Findings

Each rule produces structured findings where applicable.

Example:

```json
{
  "rule_id": "TLS_VERSION",
  "status": "PASS",
  "severity": "INFO",
  "title": "TLS Protocol Version",
  "explanation": "The server negotiated TLS 1.3, which is the most modern and secure TLS protocol version.",
  "evidence": "TLSv1.3"
}
```

Findings explain what happened, why it matters, and what evidence supports the result.

## Recommendations

Recommendations are generated for warning and failure conditions where the implementation defines one.

Example:

```json
{
  "rule_id": "TLS_VERSION",
  "text": "Enable TLS 1.3 where supported and prefer modern cipher suites."
}
```

The recommendation is linked to the rule through `rule_id`.

## Severity Versus Score Penalty

Severity and penalty are related but not identical.

Severity communicates seriousness in the finding model.

Penalty determines how many points are removed from the score.

Therefore:

```text
severity != penalty
```

For example, a `WARN` finding may still apply a meaningful penalty when the project wants that condition to affect the educational score.

## Missing Or Unavailable Data

The API distinguishes negative observations from unavailable data.

Example:

```text
hostname_match = false
```

means the hostname was checked and did not match.

```text
hostname_match = null
```

means the property could not be determined.

The current scorer treats unavailable required data as failure for rules where that property is necessary, such as hostname matching and certificate validity timestamps.

Unavailable self-signed data currently does not add a finding.

## What The Score Does Not Measure

The current score does not evaluate:

- application vulnerabilities;
- SQL injection;
- XSS;
- authentication or authorization security;
- server-side software vulnerabilities;
- complete HTTP security headers;
- HSTS;
- full certificate-chain quality;
- revocation status;
- Certificate Transparency;
- browser trust decisions;
- all TLS extension details;
- packet-level network behavior.

These are outside the current MVP scoring scope.

## Future Scoring Extensions

Possible future rules:

```text
CERT_CHAIN
REVOCATION_STATUS
CERTIFICATE_TRANSPARENCY
HSTS
HTTP_SECURITY_HEADERS
WEAK_CIPHER
TLS_CONFIGURATION
TLS_EXTENSIONS
```

Each new rule should define:

1. rule ID;
2. required input data;
3. condition;
4. finding status;
5. severity;
6. penalty;
7. explanation;
8. evidence;
9. recommendation;
10. tests.

New rules should be added only when the backend actually observes or derives the required data.

## Testing Requirements

Each scoring rule should have tests for:

- pass condition;
- warn condition, where applicable;
- fail condition, where applicable;
- missing/unavailable data;
- score boundary behavior;
- grade boundary behavior;
- score clamping.

Important grade boundaries:

```text
90
80
70
60
50
49
```

The score must always remain within:

```text
0-100
```

## Review/Demo Wording

Safe description:

```text
An explainable rule-based security score based on the TLS and certificate properties currently analyzed by the system.
```

Avoid:

```text
A definitive measure of website security.
```

The scoring system demonstrates a complete educational pipeline:

```text
Observed TLS/certificate properties
        |
        v
Rule evaluation
        |
        v
PASS / WARN / FAIL findings
        |
        v
Weighted penalties
        |
        v
0-100 score
        |
        v
A-F grade
        |
        v
Recommendations
```
