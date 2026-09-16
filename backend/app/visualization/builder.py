"""Build the ``visualization`` block of the /analyze response.

The rule this module follows, from API_CONTRACT.md section 41 and section 57:
only attach ``actual_data`` that the backend genuinely observed or can
defensibly associate with that step. Everything else stays ``None``.

What we can defensibly attach
-----------------------------
client_hello  the SNI hostname we sent, because we chose it ourselves
server_hello  the negotiated TLS version and cipher, read from the live socket
certificate   fields parsed from the peer certificate we actually received

Everything else (key exchange internals, ChangeCipherSpec, Finished hashes)
is not observable through the ``ssl`` module, so it stays ``None`` rather
than being invented.
"""

from app.visualization.protocol_steps import TLS_1_2_STEPS, TLS_1_3_STEPS


EMPTY_VISUALIZATION: dict = {
    "protocol_version": None,
    "steps": [],
}


def select_protocol_steps(tls_version: str | None) -> list[dict]:
    """Choose the step sequence that matches the negotiated TLS version.

    Unknown or missing versions fall back to the TLS 1.2 sequence, which is
    the longer and more general of the two, rather than returning nothing.
    """
    if tls_version is None:
        return TLS_1_2_STEPS

    normalized = tls_version.upper().replace(" ", "").replace("_", "")

    if "1.3" in normalized:
        return TLS_1_3_STEPS

    return TLS_1_2_STEPS


def _certificate_summary(certificate: dict | None) -> dict | None:
    if not certificate:
        return None

    summary = {
        "subject": certificate.get("subject"),
        "issuer": certificate.get("issuer"),
        "valid_from": certificate.get("valid_from"),
        "valid_until": certificate.get("valid_until"),
        "serial_number": certificate.get("serial_number"),
        "hostname_match": certificate.get("hostname_match"),
        "self_signed": certificate.get("self_signed"),
        "san_count": len(certificate.get("san") or []),
    }

    populated = {
        key: value
        for key, value in summary.items()
        if value is not None
    }

    return populated or None


def _server_hello_data(
    tls_version: str | None,
    cipher: dict | None,
) -> dict | None:
    cipher = cipher or {}

    data = {
        "negotiated_tls_version": tls_version,
        "cipher_suite": cipher.get("name"),
        "cipher_protocol": cipher.get("protocol"),
        "symmetric_key_bits": cipher.get("bits"),
    }

    populated = {
        key: value
        for key, value in data.items()
        if value is not None
    }

    return populated or None


def build_visualization(
    tls_version: str | None,
    cipher: dict | None,
    certificate: dict | None,
    hostname: str | None = None,
) -> dict:
    """Return a ``VisualizationInfo`` dict for the API response.

    The returned steps are copies, so callers cannot mutate the canonical
    protocol definitions.
    """
    steps_template = select_protocol_steps(tls_version)

    observed: dict[str, dict | None] = {
        "client_hello": {"sni_hostname": hostname} if hostname else None,
        "server_hello": _server_hello_data(tls_version, cipher),
        "certificate": _certificate_summary(certificate),
    }

    steps = []

    for template in steps_template:
        step = dict(template)
        step["actual_data"] = observed.get(step["id"])
        steps.append(step)

    return {
        "protocol_version": tls_version,
        "steps": steps,
    }
