"""Explainable & Deterministic Security Scoring Engine.

Course: Computer Networks — BCSE308L
Owner: Shantanu (Security Engine Module)
"""

from datetime import datetime, timezone
from typing import Any

from app.security.recommendations import build_recommendation
from app.security.rules import RULES


def calculate_grade(score: int) -> str:
    """Derive letter grade (A-F) deterministically from numerical score."""
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    if score >= 50:
        return "E"
    return "F"


def score_security(
    tls_version: str | None,
    certificate: dict[str, Any] | None,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Score an HTTPS target configuration based on deterministic security rules.

    Args:
        tls_version: Negotiated TLS protocol string (e.g. 'TLSv1.3', 'TLSv1.2').
        certificate: Parsed certificate properties dictionary.
        now: Optional reference timestamp (defaults to current UTC time) for testing.

    Returns:
        dict containing 'score', 'grade', 'findings', and 'recommendations'.
    """
    if now is None:
        now = datetime.now(timezone.utc)
    elif now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    score = 100
    findings: list[dict[str, Any]] = []
    recommendations: list[dict[str, Any]] = []
    cert_data = certificate or {}

    # ---------------------------------------------------------
    # Rule R1: TLS Protocol Version
    # ---------------------------------------------------------
    rule_tls = RULES["TLS_VERSION"]
    if tls_version == "TLSv1.3":
        findings.append({
            "rule_id": "TLS_VERSION",
            "status": "PASS",
            "severity": "INFO",
            "title": rule_tls["title"],
            "explanation": "The server negotiated TLS 1.3, which is the most modern and secure TLS protocol version.",
            "evidence": tls_version,
        })
    elif tls_version == "TLSv1.2":
        score -= 10
        findings.append({
            "rule_id": "TLS_VERSION",
            "status": "WARN",
            "severity": "LOW",
            "title": rule_tls["title"],
            "explanation": "The server negotiated TLS 1.2. It remains acceptable and widely compatible, but TLS 1.3 is preferred.",
            "evidence": tls_version,
        })
        recommendations.append(build_recommendation("TLS_VERSION", "TLS_VERSION_WARN"))
    else:
        score -= 30
        findings.append({
            "rule_id": "TLS_VERSION",
            "status": "FAIL",
            "severity": "HIGH",
            "title": rule_tls["title"],
            "explanation": "The negotiated TLS version is obsolete, insecure, or could not be determined.",
            "evidence": tls_version or "Unavailable",
        })
        recommendations.append(build_recommendation("TLS_VERSION", "TLS_VERSION_FAIL"))

    # ---------------------------------------------------------
    # Rule R2: Certificate Validity Interval
    # ---------------------------------------------------------
    rule_expiry = RULES["CERT_EXPIRY"]
    valid_from_str = cert_data.get("valid_from")
    valid_until_str = cert_data.get("valid_until")
    is_cert_valid = False
    valid_until_dt: datetime | None = None

    if valid_from_str and valid_until_str:
        try:
            valid_from_dt = datetime.fromisoformat(valid_from_str.replace("Z", "+00:00"))
            valid_until_dt = datetime.fromisoformat(valid_until_str.replace("Z", "+00:00"))

            if valid_from_dt <= now <= valid_until_dt:
                is_cert_valid = True
                findings.append({
                    "rule_id": "CERT_EXPIRY",
                    "status": "PASS",
                    "severity": "INFO",
                    "title": rule_expiry["title"],
                    "explanation": "The server certificate is currently within its active validity period.",
                    "evidence": f"Valid from {valid_from_str} to {valid_until_str}",
                })
            else:
                score -= 30
                findings.append({
                    "rule_id": "CERT_EXPIRY",
                    "status": "FAIL",
                    "severity": "HIGH",
                    "title": rule_expiry["title"],
                    "explanation": "The server certificate is expired or not yet valid.",
                    "evidence": f"Valid from {valid_from_str} to {valid_until_str}",
                })
                recommendations.append(build_recommendation("CERT_EXPIRY", "CERT_EXPIRY_FAIL"))
        except Exception:
            score -= 30
            findings.append({
                "rule_id": "CERT_EXPIRY",
                "status": "FAIL",
                "severity": "HIGH",
                "title": rule_expiry["title"],
                "explanation": "Unable to parse valid_from / valid_until certificate timestamps.",
                "evidence": f"from: {valid_from_str}, until: {valid_until_str}",
            })
            recommendations.append(build_recommendation("CERT_EXPIRY", "CERT_EXPIRY_FAIL"))
    else:
        score -= 30
        findings.append({
            "rule_id": "CERT_EXPIRY",
            "status": "FAIL",
            "severity": "HIGH",
            "title": rule_expiry["title"],
            "explanation": "Certificate validity timestamps are missing.",
            "evidence": "No timestamp data",
        })
        recommendations.append(build_recommendation("CERT_EXPIRY", "CERT_EXPIRY_FAIL"))

    # ---------------------------------------------------------
    # Rule R3: Hostname Match Check
    # ---------------------------------------------------------
    rule_host = RULES["HOSTNAME_MATCH"]
    hostname_match = cert_data.get("hostname_match")
    san_list = cert_data.get("san", [])

    if hostname_match is True:
        findings.append({
            "rule_id": "HOSTNAME_MATCH",
            "status": "PASS",
            "severity": "INFO",
            "title": rule_host["title"],
            "explanation": "The requested hostname matches the certificate identity.",
            "evidence": san_list if san_list else "SAN match confirmed",
        })
    else:
        score -= 35
        findings.append({
            "rule_id": "HOSTNAME_MATCH",
            "status": "FAIL",
            "severity": "CRITICAL",
            "title": rule_host["title"],
            "explanation": "The certificate does not match the requested target domain hostname.",
            "evidence": f"SAN domains: {san_list}" if san_list else "No SAN match",
        })
        recommendations.append(build_recommendation("HOSTNAME_MATCH", "HOSTNAME_MATCH_FAIL"))

    # ---------------------------------------------------------
    # Rule R4: Expiry Proximity Warning (Anti-Double-Counting)
    # ---------------------------------------------------------
    if is_cert_valid and valid_until_dt:
        rule_prox = RULES["EXPIRY_PROXIMITY"]
        days_remaining = (valid_until_dt - now).days

        if days_remaining <= 7:
            score -= 15
            findings.append({
                "rule_id": "EXPIRY_PROXIMITY",
                "status": "WARN",
                "severity": "MEDIUM",
                "title": rule_prox["title"],
                "explanation": f"Critical expiry window: The certificate will expire in {days_remaining} day(s).",
                "evidence": f"{days_remaining} days remaining",
            })
            recommendations.append(build_recommendation("EXPIRY_PROXIMITY", "EXPIRY_PROXIMITY_WARN_7"))
        elif days_remaining <= 30:
            score -= 10
            findings.append({
                "rule_id": "EXPIRY_PROXIMITY",
                "status": "WARN",
                "severity": "LOW",
                "title": rule_prox["title"],
                "explanation": f"Upcoming expiry window: The certificate expires in {days_remaining} day(s).",
                "evidence": f"{days_remaining} days remaining",
            })
            recommendations.append(build_recommendation("EXPIRY_PROXIMITY", "EXPIRY_PROXIMITY_WARN_30"))
        else:
            findings.append({
                "rule_id": "EXPIRY_PROXIMITY",
                "status": "PASS",
                "severity": "INFO",
                "title": rule_prox["title"],
                "explanation": f"Certificate has ample validity remaining ({days_remaining} days).",
                "evidence": f"{days_remaining} days remaining",
            })

    # ---------------------------------------------------------
    # Rule R5: Self-Signed Certificate Indicator
    # ---------------------------------------------------------
    rule_self = RULES["SELF_SIGNED"]
    self_signed = cert_data.get("self_signed")
    issuer_info = cert_data.get("issuer")

    if self_signed is False:
        findings.append({
            "rule_id": "SELF_SIGNED",
            "status": "PASS",
            "severity": "INFO",
            "title": rule_self["title"],
            "explanation": "The certificate subject and issuer differ, so it does not appear to be self-signed.",
            "evidence": issuer_info if issuer_info else "Issuer metadata unavailable",
        })
    elif self_signed is True:
        score -= 25
        findings.append({
            "rule_id": "SELF_SIGNED",
            "status": "WARN",
            "severity": "HIGH",
            "title": rule_self["title"],
            "explanation": "The certificate subject and issuer match, so it appears to be self-signed.",
            "evidence": issuer_info if issuer_info else "Self-signed certificate",
        })
        recommendations.append(build_recommendation("SELF_SIGNED", "SELF_SIGNED_WARN"))

    # ---------------------------------------------------------
    # Rule R6: Certificate Identity Metadata
    # ---------------------------------------------------------
    rule_ident = RULES["CERT_IDENTITY"]
    subject_info = cert_data.get("subject")
    if subject_info and issuer_info:
        findings.append({
            "rule_id": "CERT_IDENTITY",
            "status": "PASS",
            "severity": "INFO",
            "title": rule_ident["title"],
            "explanation": "Certificate Subject and Issuer metadata are correctly populated.",
            "evidence": f"Subject: {subject_info}, Issuer: {issuer_info}",
        })

    # Final score clamping to [0, 100]
    final_score = max(0, min(100, score))
    grade = calculate_grade(final_score)

    return {
        "score": final_score,
        "grade": grade,
        "findings": findings,
        "recommendations": recommendations,
    }
