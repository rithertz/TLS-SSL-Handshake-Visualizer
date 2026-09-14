from app.certificate.parser import parse_certificate
from app.tls.connection import create_tls_connection, resolve_hostname


def analyze_tls(hostname: str) -> dict:
    resolved_ips = resolve_hostname(hostname)

    tls_socket = create_tls_connection(hostname)

    try:
        cipher_data = tls_socket.cipher()
        certificate_der = tls_socket.getpeercert(binary_form=True)

        certificate_data = parse_certificate(
            certificate_der,
            hostname,
        )

        return {
            "resolved_ips": resolved_ips,
            "tls_version": tls_socket.version(),
            "cipher": {
                "name": cipher_data[0] if cipher_data else None,
                "protocol": cipher_data[1] if cipher_data else None,
                "bits": cipher_data[2] if cipher_data else None,
            },
            "certificate": certificate_data,
        }

    finally:
        tls_socket.close()
