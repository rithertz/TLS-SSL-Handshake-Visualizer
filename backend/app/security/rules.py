RULES = {
    "TLS_VERSION": {
        "title": "TLS version",
        "description": "Checks whether the negotiated TLS version is modern and secure.",
    },
    "CERT_EXPIRY": {
        "title": "Certificate expiry",
        "description": "Checks whether the server certificate is currently valid.",
    },
    "HOSTNAME_MATCH": {
        "title": "Certificate hostname",
        "description": "Checks whether the certificate matches the requested hostname.",
    },
    "SELF_SIGNED": {
        "title": "Self-signed certificate",
        "description": "Checks whether the certificate is self-signed.",
    },
}
