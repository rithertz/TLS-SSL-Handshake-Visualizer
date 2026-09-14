from app.security.scorer import score_security
from app.services.url_validator import validate_url
from app.tls.analyzer import analyze_tls


def analyze_url(url: str) -> dict:
    normalized_url, hostname = validate_url(url)

    try:
        tls_data = analyze_tls(hostname)

        security_data = score_security(
            tls_data["tls_version"],
            tls_data["certificate"],
        )

        return {
            "analysis_status": "SUCCESS",
            "target": {
                "url": normalized_url,
                "hostname": hostname,
                "port": 443,
            },
            "network": {
                "resolved_ips": tls_data["resolved_ips"],
            },
            "tls": {
                "version": tls_data["tls_version"],
                "cipher": tls_data["cipher"],
            },
            "certificate": tls_data["certificate"],
            "security": security_data,
            "visualization": None,
            "error": None,
        }

    except TimeoutError:
        return {
            "analysis_status": "FAILED",
            "target": {
                "url": normalized_url,
                "hostname": hostname,
                "port": 443,
            },
            "network": None,
            "tls": None,
            "certificate": None,
            "security": None,
            "visualization": None,
            "error": {
                "code": "CONNECTION_TIMEOUT",
                "message": "The target server did not respond within the allowed time.",
            },
        }

    except OSError as error:
        return {
            "analysis_status": "FAILED",
            "target": {
                "url": normalized_url,
                "hostname": hostname,
                "port": 443,
            },
            "network": None,
            "tls": None,
            "certificate": None,
            "security": None,
            "visualization": None,
            "error": {
                "code": "NETWORK_ERROR",
                "message": str(error),
            },
        }

    except Exception as error:
        return {
            "analysis_status": "FAILED",
            "target": {
                "url": normalized_url,
                "hostname": hostname,
                "port": 443,
            },
            "network": None,
            "tls": None,
            "certificate": None,
            "security": None,
            "visualization": None,
            "error": {
                "code": "ANALYSIS_ERROR",
                "message": str(error),
            },
        }
