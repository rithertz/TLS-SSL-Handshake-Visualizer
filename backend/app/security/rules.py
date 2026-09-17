"""Security Rules Registry for TLS/SSL Security Analyzer."""

RULES = {
    "TLS_VERSION": {
        "title": "TLS Protocol Version",
        "description": "Checks whether the negotiated TLS version is modern and secure.",
    },
    "CERT_EXPIRY": {
        "title": "Certificate Expiry & Validity",
        "description": "Checks whether the server certificate is currently within its validity period.",
    },
    "HOSTNAME_MATCH": {
        "title": "Certificate Hostname Match",
        "description": "Checks whether the certificate Subject Alternative Names (SAN) match the requested hostname.",
    },
    "EXPIRY_PROXIMITY": {
        "title": "Certificate Expiry Proximity",
        "description": "Checks whether a valid certificate is approaching its expiration date.",
    },
    "SELF_SIGNED": {
        "title": "Self-Signed Certificate Check",
        "description": "Checks whether the certificate appears to be self-signed based on subject and issuer metadata.",
    },
    "CERT_IDENTITY": {
        "title": "Certificate Metadata Identity",
        "description": "Checks whether the certificate contains complete Subject and Issuer identity metadata.",
    },
}
