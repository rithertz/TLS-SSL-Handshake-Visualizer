import socket
import ssl


def resolve_hostname(hostname: str) -> list[str]:
    addresses = socket.getaddrinfo(
        hostname,
        443,
        type=socket.SOCK_STREAM,
    )

    return sorted(
        {
            address[4][0]
            for address in addresses
        }
    )


def create_tls_connection(hostname: str, timeout: float = 10.0):
    context = ssl.create_default_context()

    raw_socket = socket.create_connection(
        (hostname, 443),
        timeout=timeout,
    )

    tls_socket = context.wrap_socket(
        raw_socket,
        server_hostname=hostname,
    )

    return tls_socket
