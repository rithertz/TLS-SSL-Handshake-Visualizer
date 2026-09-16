from app.services.analysis_service import analyze_url


def test_analyze_url_integrates_validation_tls_and_security(monkeypatch):
    """Verify that URL validation, TLS analysis, and security scoring are integrated."""

    mock_tls_data = {
        "resolved_ips": ["93.184.216.34"],
        "tls_version": "TLSv1.3",
        "cipher": {
            "name": "TLS_AES_256_GCM_SHA384",
            "protocol": "TLSv1.3",
            "bits": 256,
        },
        "certificate": {
            "subject": "CN=example.com",
            "issuer": "CN=Example CA",
            "valid_from": "2026-01-01T00:00:00+00:00",
            "valid_until": "2027-01-01T00:00:00+00:00",
            "san": ["example.com"],
            "serial_number": "123456789",
            "hostname_match": True,
            "self_signed": False,
        },
    }

    mock_security_data = {
        "score": 92,
        "grade": "A",
        "findings": [],
        "recommendations": [],
    }

    monkeypatch.setattr(
        "app.services.analysis_service.analyze_tls",
        lambda hostname: mock_tls_data,
    )

    monkeypatch.setattr(
        "app.services.analysis_service.score_security",
        lambda tls_version, certificate: mock_security_data,
    )

    result = analyze_url("https://example.com")

    assert result["analysis_status"] == "SUCCESS"

    assert result["target"]["url"] == "https://example.com"
    assert result["target"]["hostname"] == "example.com"
    assert result["target"]["port"] == 443

    assert result["network"]["resolved_ips"] == ["93.184.216.34"]

    assert result["tls"]["version"] == "TLSv1.3"
    assert result["tls"]["cipher"]["name"] == "TLS_AES_256_GCM_SHA384"

    assert result["certificate"]["subject"] == "CN=example.com"
    assert result["certificate"]["issuer"] == "CN=Example CA"
    assert result["certificate"]["hostname_match"] is True

    assert result["security"] == mock_security_data

    assert result["visualization"] is None
    assert result["error"] is None