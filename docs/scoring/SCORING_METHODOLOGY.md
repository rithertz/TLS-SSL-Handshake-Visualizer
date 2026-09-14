# Security Scoring Methodology

## TLS/SSL Handshake Visualizer & Website Security Analyzer

**Course:** Computer Networks — BCSE308L  
**Purpose:** Document the rule-based security scoring approach used by the MVP  
**Status:** Baseline MVP methodology

---

## 1. Purpose

The security scoring engine converts observed TLS and certificate properties into:

- security findings;
- a numerical score from 0 to 100;
- a letter grade from A to F;
- recommendations for failed or warning conditions.

The score is intended as an **educational, explainable assessment** of the properties inspected by this project.

It is not intended to replace a professional security audit or a complete vulnerability scanner.

---

## 2. Scoring Philosophy

The scoring system is deliberately rule based.

Each security rule examines one observable or derived property.

The result of a rule is represented as:

```text
PASS
WARN
FAIL
```

Each finding also has a severity:

```text
INFO
LOW
MEDIUM
HIGH
CRITICAL
```

The scoring engine starts from a baseline of:

```text
100 points
```

Penalties are then applied according to the conditions observed during analysis.

The final value is clamped to:

```text
0–100
```

This approach makes the score deterministic and easy to explain during the project review.

---

## 3. Current MVP Rules

The baseline scorer currently evaluates four areas:

1. TLS version
2. Certificate validity
3. Certificate hostname matching
4. Self-signed certificate status

These rules are intentionally limited for the Review-1 MVP.

Future rules may be added after the core system is stable.

---

# 4. Rule: TLS Version

## Rule ID

```text
TLS_VERSION
```

## Purpose

Checks the TLS protocol version negotiated with the target server.

## Current behavior

| Condition | Status | Penalty |
|---|---|---:|
| TLS 1.3 | PASS | 0 |
| TLS 1.2 | WARN | -10 |
| Other / unavailable | FAIL | -30 |

### Interpretation

TLS 1.3 receives the strongest result in the current baseline.

TLS 1.2 receives a warning because the project treats the newer protocol version as preferable for the educational scoring model.

An unavailable or unexpected protocol value is treated as a failure.

---

# 5. Rule: Certificate Validity

## Rule ID

```text
CERT_EXPIRY
```

## Purpose

Checks whether the certificate is currently valid according to the certificate validity interval available to the analyzer.

## Current behavior

| Condition | Status | Penalty |
|---|---|---:|
| Certificate is valid | PASS | 0 |
| Certificate is invalid / unavailable | FAIL | -30 |

The baseline implementation treats certificate validity as a required security property.

---

# 6. Rule: Hostname Match

## Rule ID

```text
HOSTNAME_MATCH
```

## Purpose

Checks whether the target hostname matches the certificate identity information.

The check uses the certificate's relevant hostname information, including SAN values and supported wildcard matching.

## Current behavior

| Condition | Status | Penalty |
|---|---|---:|
| Hostname matches | PASS | 0 |
| Hostname does not match / unavailable | FAIL | -35 |

A hostname mismatch is heavily penalized because the certificate may not authenticate the requested website identity.

---

# 7. Rule: Self-Signed Certificate

## Rule ID

```text
SELF_SIGNED
```

## Purpose

Checks whether the certificate is identified as self-signed.

## Current behavior

| Condition | Status | Penalty |
|---|---|---:|
| Not self-signed | PASS | 0 |
| Self-signed | WARN | -25 |

The current implementation reports a self-signed certificate as a warning rather than a hard failure.

This reflects the project's educational scoring model rather than a universal security judgment.

---

# 8. Baseline Score Calculation

The current scoring algorithm is conceptually:

```text
score = 100

if TLS version is TLS 1.3:
    penalty = 0
elif TLS version is TLS 1.2:
    penalty = 10
else:
    penalty = 30

if certificate is invalid:
    penalty += 30

if hostname does not match:
    penalty += 35

if certificate is self-signed:
    penalty += 25

score = max(0, min(100, 100 - total_penalty))
```

The actual implementation should remain the authoritative source for executable scoring behavior.

---

# 9. Grade Calculation

The current baseline maps the final score to grades as follows:

| Score | Grade |
|---:|:---:|
| 90–100 | A |
| 80–89 | B |
| 70–79 | C |
| 60–69 | D |
| 50–59 | E |
| 0–49 | F |

The grade is calculated after all applicable penalties have been applied.

---

# 10. Examples

## Example A — Strong baseline result

Observed:

```text
TLS version: TLSv1.3
Certificate valid: yes
Hostname match: yes
Self-signed: no
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

---

## Example B — TLS 1.2

Observed:

```text
TLS version: TLSv1.2
Certificate valid: yes
Hostname match: yes
Self-signed: no
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

---

## Example C — TLS 1.2 + self-signed

Observed:

```text
TLS version: TLSv1.2
Certificate valid: yes
Hostname match: yes
Self-signed: yes
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

---

## Example D — Multiple certificate problems

Observed:

```text
TLS version: TLSv1.2
Certificate invalid: yes
Hostname mismatch: yes
Self-signed: yes
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

---

# 11. Findings

Each rule produces a structured finding.

Example:

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

The finding explains **why** a particular rule passed, warned, or failed.

This is important because the score should not be presented as an unexplained number.

---

# 12. Recommendations

Recommendations are generated for conditions that need attention.

Example:

```json
{
  "rule_id": "TLS_VERSION",
  "text": "Use TLS 1.3 where supported."
}
```

The recommendation is linked to the rule through `rule_id`.

This allows the frontend to associate a recommendation with the relevant finding.

---

# 13. Severity vs Score Penalty

Severity and numerical penalty are related but are not the same concept.

### Severity

Describes how serious a finding is within the project's finding system.

### Penalty

Determines how many points are removed from the score.

Therefore:

```text
severity != penalty
```

For example, the current self-signed rule produces a `WARN` result and applies a 25-point penalty.

The exact severity assigned to each rule is defined by the implementation in:

```text
backend/app/security/rules.py
```

---

# 14. Missing or Unavailable Data

The API distinguishes unavailable data from negative observations.

Examples:

```text
hostname_match = false
```

means the hostname was checked and did not match.

Whereas:

```text
hostname_match = null
```

means the property could not be determined.

The scoring engine must avoid treating unavailable data as a successful security property.

The current baseline may classify missing/invalid values as failures for rules where the information is required.

---

# 15. Why Use a Rule-Based Model?

A rule-based model was selected because it is:

- deterministic;
- transparent;
- easy to test;
- easy to explain during a viva;
- directly connected to networking concepts;
- simple enough for the MVP.

The evaluator can trace:

```text
Observed TLS/certificate data
          ↓
Security rule
          ↓
Finding
          ↓
Penalty
          ↓
Score
          ↓
Grade
```

No machine-learning model is required.

---

# 16. What the Score Does Not Measure

The current score does **not** represent complete website security.

It does not currently evaluate, for example:

- application vulnerabilities;
- SQL injection;
- XSS;
- authentication security;
- server-side software vulnerabilities;
- complete HTTP security headers;
- HSTS;
- certificate-chain quality in full detail;
- all possible TLS configuration weaknesses;
- packet-level network behavior.

These are outside the current MVP scoring scope.

---

# 17. Future Scoring Extensions

Possible future rules include:

```text
CERT_EXPIRY_WARNING
CERT_CHAIN
HSTS
HTTP_SECURITY_HEADERS
WEAK_CIPHER
TLS_CONFIGURATION
```

Any new rule should define:

1. rule ID;
2. condition;
3. finding status;
4. severity;
5. penalty;
6. explanation;
7. evidence;
8. recommendation;
9. test cases.

New rules should be added only when the required observation is actually implemented.

---

# 18. Scoring Determinism

For the same analysis result, the scoring engine should produce the same:

```text
score
grade
findings
recommendations
```

The scorer should not use randomness or external data during scoring.

This makes the system reproducible and testable.

---

# 19. Implementation Location

The current implementation is located in:

```text
backend/app/security/rules.py
backend/app/security/scorer.py
```

`rules.py` contains rule-related definitions/descriptions.

`scorer.py` performs the current baseline scoring calculation.

As the project grows, scoring logic should remain separated from:

- API routing;
- TLS connection handling;
- certificate parsing;
- frontend presentation.

---

# 20. Testing Requirements

Each scoring rule should have tests covering at least:

```text
PASS condition
WARN condition, where applicable
FAIL condition
missing/unavailable data
score boundary behavior
grade boundary behavior
```

Important grade boundaries include:

```text
90
80
70
60
50
49
```

The score should always remain within:

```text
0–100
```

---

# 21. Important Technical Qualification

The numerical values in this document describe the **current educational baseline**, not an industry-standard SSL/TLS security score.

In the project review, describe it as:

> “An explainable rule-based security score based on the TLS and certificate properties currently analyzed by our system.”

Do not describe it as:

> “A definitive measure of website security.”

---

# 22. MVP Scope Summary

The Review-1 scoring engine currently demonstrates:

```text
Real TLS connection
       ↓
Observed TLS/certificate properties
       ↓
Rule evaluation
       ↓
PASS / WARN / FAIL findings
       ↓
Weighted penalties
       ↓
0–100 score
       ↓
A–F grade
       ↓
Recommendations
```

This provides a complete, explainable scoring pipeline while leaving room for additional networking/security checks in later project iterations.
