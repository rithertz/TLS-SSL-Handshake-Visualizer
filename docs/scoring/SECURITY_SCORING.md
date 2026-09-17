# Security Scoring Specification (Frozen Baseline)

**Course:** Computer Networks — BCSE308L  
**Owner:** Shantanu (Security Analysis & Scoring Engine)  
**Status:** Frozen Version 1.0  

---

## 1. Executive Summary

This document specifies the rule-based, deterministic security scoring engine for the **TLS/SSL Handshake Visualizer & Website Security Analyzer**.

The scoring engine evaluates real network, TLS, and certificate observations passed from the backend analysis pipeline and generates:
- An explainable list of `SecurityFinding` objects (Status: `PASS` | `WARN` | `FAIL`, Severity: `INFO` | `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`);
- A bounded numerical score between `0` and `100`;
- A letter grade (`A`, `B`, `C`, `D`, `E`, `F`);
- Actionable recommendations linked to triggered rules.

---

## 2. Rule Specification Matrix

| Rule ID | Rule Name | Evaluated Condition | Status | Severity | Score Penalty | Evidence Example | Actionable Recommendation |
|---|---|---|:---:|:---:|---:|---|---|
| **R1_TLS_VERSION** | TLS Version | Negotiated TLS is `TLSv1.3` | `PASS` | `INFO` | `0` | `"TLSv1.3"` | N/A |
| **R1_TLS_VERSION** | TLS Version | Negotiated TLS is `TLSv1.2` | `WARN` | `LOW` | `-10` | `"TLSv1.2"` | `"Prefer TLS 1.3 when supported by the server for enhanced privacy and faster key exchange."` |
| **R1_TLS_VERSION** | TLS Version | Negotiated TLS is `TLSv1.0`, `TLSv1.1`, or missing | `FAIL` | `HIGH` | `-30` | `"TLSv1.0"` or `null` | `"Upgrade the server to support modern TLS versions (TLS 1.2 / 1.3) and disable deprecated protocols."` |
| **R2_CERT_VALIDITY** | Certificate Validity | Current time is within `valid_from` and `valid_until` | `PASS` | `INFO` | `0` | `"Valid from 2026-01-01 to 2026-12-31"` | N/A |
| **R2_CERT_VALIDITY** | Certificate Validity | Current time is outside `valid_from` and `valid_until` | `FAIL` | `HIGH` | `-30` | `"Expired on 2025-12-31"` | `"Renew or replace the server certificate immediately to prevent browser security warnings."` |
| **R3_HOSTNAME_MATCH** | Hostname Match | `hostname_match` is `true` | `PASS` | `INFO` | `0` | `["example.com", "www.example.com"]` | N/A |
| **R3_HOSTNAME_MATCH** | Hostname Match | `hostname_match` is `false` or `null` | `FAIL` | `CRITICAL` | `-35` | `"SAN domains: ['other.com']"` | `"Install a digital certificate whose Subject Alternative Name (SAN) covers the requested hostname."` |
| **R4_EXPIRY_PROXIMITY**| Expiry Warning | Days remaining $> 30$ days | `PASS` | `INFO` | `0` | `"95 days remaining"` | N/A |
| **R4_EXPIRY_PROXIMITY**| Expiry Warning | $7 < \text{Days remaining} \le 30$ | `WARN` | `LOW` | `-10` | `"18 days remaining"` | `"Plan certificate renewal soon as it expires within 30 days."` |
| **R4_EXPIRY_PROXIMITY**| Expiry Warning | $0 \le \text{Days remaining} \le 7$ | `WARN` | `MEDIUM` | `-15` | `"4 days remaining"` | `"Urgent: Renew the server certificate immediately as it expires in less than 7 days."` |
| **R5_SELF_SIGNED** | Self-Signed Check | `self_signed` is `false` | `PASS` | `INFO` | `0` | `"Issuer: DigiCert Inc"` | N/A |
| **R5_SELF_SIGNED** | Self-Signed Check | `self_signed` is `true` | `WARN` | `HIGH` | `-25` | `"Issuer matches Subject"` | `"Use a certificate issued by a publicly trusted Certificate Authority (CA) for public HTTPS websites."` |
| **R6_CERT_IDENTITY** | Cert Metadata | Certificate issuer & subject details populated | `PASS` | `INFO` | `0` | `"CN=example.com, O=Example Inc"` | N/A |

---

## 3. Score & Grade Calculation

### Initial Baseline Score
$$\text{Starting Score} = 100$$

### Clamped Final Score
$$\text{Final Score} = \max(0, \min(100, 100 - \sum \text{Penalties}))$$

### Grade Boundary Mapping

| Numerical Score Range | Letter Grade | Evaluation Category |
|:---:|:---:|:---|
| **90 – 100** | **A** | Excellent TLS Security Configuration |
| **80 – 89** | **B** | Good / Acceptable Configuration |
| **70 – 79** | **C** | Moderate Security Warning |
| **60 – 69** | **D** | Significant Configuration Deficiencies |
| **50 – 59** | **E** | High Risk / Legacy Configuration |
| **0 – 49** | **F** | Critical Security Failure |

---

## 4. Anti-Double-Counting Policy

To avoid unfairly penalizing a single root cause multiple times:
1. If **R2_CERT_VALIDITY** triggers a `FAIL` because the certificate has already expired, **R4_EXPIRY_PROXIMITY** is skipped (since expiry proximity applies only to currently valid certificates).
2. Hostname mismatch (**R3_HOSTNAME_MATCH**) and Self-signed check (**R5_SELF_SIGNED**) are treated as independent security properties.

---

## 5. Output Verification & Determinism

For any given input object `(tls_info, certificate_info)`:
- The function MUST return identical findings, score, grade, and recommendations.
- No network, file system, or clock side-effects are allowed within the core evaluation function. Current time is accepted as an optional parameter (defaulting to UTC `now`) to allow exact, reproducible unit testing.
