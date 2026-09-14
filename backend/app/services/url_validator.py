from urllib.parse import urlparse


class URLValidationError(ValueError):
    pass


def validate_url(url: str) -> tuple[str, str]:
    url = url.strip()

    parsed = urlparse(url)

    if parsed.scheme.lower() != "https":
        raise URLValidationError("Only HTTPS URLs are supported.")

    if parsed.username is not None or parsed.password is not None:
        raise URLValidationError("URLs containing credentials are not allowed.")

    if not parsed.hostname:
        raise URLValidationError("URL must contain a valid hostname.")

    if parsed.port is not None and parsed.port != 443:
        raise URLValidationError("Only HTTPS port 443 is supported.")

    hostname = parsed.hostname.lower().rstrip(".")

    if not hostname:
        raise URLValidationError("URL must contain a valid hostname.")

    return url, hostname
