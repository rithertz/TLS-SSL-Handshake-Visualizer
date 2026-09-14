from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509 import DNSName
from cryptography.x509.extensions import ExtensionNotFound
from cryptography.x509.name import NameOID


def hostname_matches_certificate(
    certificate: x509.Certificate,
    hostname: str,
) -> bool:
    try:
        san_extension = certificate.extensions.get_extension_for_class(
            x509.SubjectAlternativeName
        )

        dns_names = san_extension.value.get_values_for_type(
            DNSName
        )

        hostname = hostname.lower().rstrip(".")

        for name in dns_names:
            name = name.lower().rstrip(".")

            if name.startswith("*."):
                suffix = name[1:]

                if hostname.endswith(suffix):
                    prefix = hostname[: -len(suffix)]
                    if prefix and "." not in prefix.rstrip("."):
                        return True
            elif hostname == name:
                return True

        return False

    except ExtensionNotFound:
        common_names = certificate.subject.get_attributes_for_oid(
            NameOID.COMMON_NAME
        )

        hostname = hostname.lower().rstrip(".")

        return any(
            attribute.value.lower().rstrip(".") == hostname
            for attribute in common_names
        )


def parse_certificate(
    certificate_der: bytes,
    hostname: str,
) -> dict:
    certificate = x509.load_der_x509_certificate(
        certificate_der,
        default_backend(),
    )

    subject = certificate.subject.rfc4514_string()
    issuer = certificate.issuer.rfc4514_string()

    san = []

    try:
        san_extension = certificate.extensions.get_extension_for_class(
            x509.SubjectAlternativeName
        )
        san = san_extension.value.get_values_for_type(
            x509.DNSName
        )
    except x509.ExtensionNotFound:
        pass

    hostname_match = hostname_matches_certificate(
        certificate,
        hostname,
    )

    self_signed = subject == issuer

    return {
        "subject": subject,
        "issuer": issuer,
        "valid_from": certificate.not_valid_before_utc.isoformat(),
        "valid_until": certificate.not_valid_after_utc.isoformat(),
        "san": san,
        "serial_number": str(certificate.serial_number),
        "hostname_match": hostname_match,
        "self_signed": self_signed,
    }
