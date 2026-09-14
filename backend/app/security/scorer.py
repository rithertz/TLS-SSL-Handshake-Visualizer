from datetime import datetime, timezone

from app.security.rules import RULES


def calculate_grade(score: int) -> str:
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
    certificate: dict,
) -> dict:
    score = 100
    findings = []
    recommendations = []

    # TLS version
    if tls_version == "TLSv1.3":
        findings.append({
            "rule_id": "TLS_VERSION",
            "status": "PASS",
            "severity": "INFO",
            "title": RULES["TLS_VERSION"]["title"],
            "explanation": "The server negotiated TLS 1.3, which is a modern TLS version.",
            "evidence": tls_version,
        })
    elif tls_version == "TLSv1.2":
        score -= 10
        findings.append({
            "rule_id": "TLS_VERSION",
            "status": "WARN",
            "severity": "LOW",
            "title": RULES["TLS_VERSION"]["title"],
            "explanation": "The server negotiated TLS 1.2. It is still widely supported, but TLS 1.3 is preferred.",
            "evidence": tls_version,
        })
        recommendations.append({
            "rule_id": "TLS_VERSION",
            "text": "Prefer TLS 1.3 when supported by the server.",
        })
    else:
        score -= 30
        findings.append({
            "rule_id": "TLS_VERSION",
            "status": "FAIL",
            "severity": "HIGH",
            "title": RULES["TLS_VERSION"]["title"],
            "explanation": "The negotiated TLS version is missing or is not a recommended modern version.",
            "evidence": tls_version,
        })
        recommendations.append({
            "rule_id": "TLS_VERSION",
            "text": "Upgrade the server to support TLS 1.3.",
        })

    # Certificate validity
    now = datetime.now(timezone.utc)
    valid_from = datetime.fromisoformat(certificate["valid_from"])
    valid_until = datetime.fromisoformat(certificate["valid_until"])

    if valid_from <= now <= valid_until:
        findings.append({
            "rule_id": "CERT_EXPIRY",
            "status": "PASS",
            "severity": "INFO",
            "title": RULES["CERT_EXPIRY"]["title"],
            "explanation": "The certificate is currently within its validity period.",
            "evidence": (
                f"Valid from {certificate['valid_from']} "
                f"until {certificate['valid_until']}"
            ),
        })
    else:
        score -= 30
        findings.append({
            "rule_id": "CERT_EXPIRY",
            "status": "FAIL",
            "severity": "HIGH",
            "title": RULES["CERT_EXPIRY"]["title"],
            "explanation": "The certificate is outside its validity period.",
            "evidence": (
                f"Valid from {certificate['valid_from']} "
                f"until {certificate['valid_until']}"
            ),
        })
        recommendations.append({
            "rule_id": "CERT_EXPIRY",
            "text": "Renew or replace the certificate before or after its validity period as appropriate.",
        })

    # Hostname match
    if certificate.get("hostname_match") is True:
        findings.append({
            "rule_id": "HOSTNAME_MATCH",
            "status": "PASS",
            "severity": "INFO",
            "title": RULES["HOSTNAME_MATCH"]["title"],
            "explanation": "The certificate matches the requested hostname.",
            "evidence": certificate.get("san"),
        })
    else:
        score -= 35
        findings.append({
            "rule_id": "HOSTNAME_MATCH",
            "status": "FAIL",
            "severity": "CRITICAL",
            "title": RULES["HOSTNAME_MATCH"]["title"],
            "explanation": "The certificate does not match the requested hostname.",
            "evidence": certificate.get("san"),
        })
        recommendations.append({
            "rule_id": "HOSTNAME_MATCH",
            "text": "Install a certificate whose SAN covers the requested hostname.",
        })

    # Self-signed certificate
    if certificate.get("self_signed") is False:
        findings.append({
            "rule_id": "SELF_SIGNED",
            "status": "PASS",
            "severity": "INFO",
            "title": RULES["SELF_SIGNED"]["title"],
            "explanation": "The certificate is not self-signed.",
            "evidence": certificate.get("issuer"),
        })
    else:
        score -= 25
        findings.append({
            "rule_id": "SELF_SIGNED",
            "status": "WARN",
            "severity": "HIGH",
            "title": RULES["SELF_SIGNED"]["title"],
            "explanation": "The certificate appears to be self-signed.",
            "evidence": certificate.get("issuer"),
        })
        recommendations.append({
            "rule_id": "SELF_SIGNED",
            "text": "Use a certificate issued by a trusted certificate authority for public websites.",
        })

    score = max(0, min(100, score))

    return {
        "score": score,
        "grade": calculate_grade(score),
        "findings": findings,
        "recommendations": recommendations,
    }
