"""Actionable Security Recommendations Generator."""

RECOMMENDATION_TEMPLATES = {
    "TLS_VERSION_WARN": "Prefer TLS 1.3 when supported by the server to enhance privacy and reduce handshake latency.",
    "TLS_VERSION_FAIL": "Upgrade the web server configuration to enable TLS 1.2 or TLS 1.3 and disable deprecated protocols (SSLv3, TLS 1.0, TLS 1.1).",
    "CERT_EXPIRY_FAIL": "Renew or replace the server digital certificate immediately to prevent browser security blocking.",
    "HOSTNAME_MATCH_FAIL": "Install a digital certificate whose Subject Alternative Name (SAN) list covers the requested domain hostname.",
    "EXPIRY_PROXIMITY_WARN_30": "Plan certificate renewal soon as the current certificate will expire in less than 30 days.",
    "EXPIRY_PROXIMITY_WARN_7": "Urgent: Renew the server certificate immediately as it expires within 7 days.",
    "SELF_SIGNED_WARN": "Replace the self-signed certificate with one issued by a publicly trusted Certificate Authority (CA) for public websites.",
}


def build_recommendation(rule_id: str, template_key: str) -> dict:
    """Build a structured recommendation dictionary matching API Contract v1.0."""
    return {
        "rule_id": rule_id,
        "text": RECOMMENDATION_TEMPLATES.get(template_key, "Review security configuration."),
    }
