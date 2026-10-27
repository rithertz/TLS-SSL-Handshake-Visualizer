"""Unit & Boundary Tests for Security Analysis Scoring Engine.

Course: Computer Networks — BCSE308L
Owner: Shantanu (Security Engine Tests)
"""

from datetime import datetime, timedelta, timezone

from app.security.scorer import calculate_grade, score_security

# Reference fixed timestamp for deterministic tests
FIXED_NOW = datetime(2026, 9, 16, 12, 0, 0, tzinfo=timezone.utc)


def test_perfect_score_tls13():
    """Test ideal configuration: TLS 1.3, valid cert (>30 days), matching SAN, CA signed."""
    cert = {
        "subject": {"common_name": "example.com"},
        "issuer": {"common_name": "DigiCert CA"},
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "san": ["example.com", "www.example.com"],
        "hostname_match": True,
        "self_signed": False,
    }

    result = score_security("TLSv1.3", cert, now=FIXED_NOW)

    assert result["score"] == 100
    assert result["grade"] == "A"
    assert len(result["recommendations"]) == 0

    rule_statuses = {f["rule_id"]: f["status"] for f in result["findings"]}
    assert rule_statuses["TLS_VERSION"] == "PASS"
    assert rule_statuses["CERT_EXPIRY"] == "PASS"
    assert rule_statuses["HOSTNAME_MATCH"] == "PASS"
    assert rule_statuses["EXPIRY_PROXIMITY"] == "PASS"
    assert rule_statuses["SELF_SIGNED"] == "PASS"


def test_tls12_minor_penalty():
    """TLS 1.2 applies -10 penalty, score = 90 (A)."""
    cert = {
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "san": ["example.com"],
        "hostname_match": True,
        "self_signed": False,
    }

    result = score_security("TLSv1.2", cert, now=FIXED_NOW)

    assert result["score"] == 90
    assert result["grade"] == "A"
    assert len(result["recommendations"]) == 1
    assert result["recommendations"][0]["rule_id"] == "TLS_VERSION"


def test_expiry_proximity_warning():
    """Cert expiring in 18 days applies -10 penalty under R4."""
    valid_until = (FIXED_NOW + timedelta(days=18)).isoformat()
    cert = {
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": valid_until,
        "san": ["example.com"],
        "hostname_match": True,
        "self_signed": False,
    }

    result = score_security("TLSv1.3", cert, now=FIXED_NOW)

    assert result["score"] == 90
    assert result["grade"] == "A"
    rule_statuses = {f["rule_id"]: f["status"] for f in result["findings"]}
    assert rule_statuses["EXPIRY_PROXIMITY"] == "WARN"


def test_urgent_expiry_proximity_warning():
    """Cert expiring in 4 days applies -15 penalty under R4."""
    valid_until = (FIXED_NOW + timedelta(days=4)).isoformat()
    cert = {
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": valid_until,
        "san": ["example.com"],
        "hostname_match": True,
        "self_signed": False,
    }

    result = score_security("TLSv1.3", cert, now=FIXED_NOW)

    assert result["score"] == 85
    assert result["grade"] == "B"
    rule_statuses = {f["rule_id"]: f["status"] for f in result["findings"]}
    assert rule_statuses["EXPIRY_PROXIMITY"] == "WARN"


def test_expired_cert_anti_double_counting():
    """Expired cert applies -30 penalty under R2, skips R4 proximity warning."""
    cert = {
        "valid_from": "2025-01-01T00:00:00Z",
        "valid_until": "2025-12-31T23:59:59Z",  # Already expired relative to FIXED_NOW (2026)
        "san": ["example.com"],
        "hostname_match": True,
        "self_signed": False,
    }

    result = score_security("TLSv1.3", cert, now=FIXED_NOW)

    assert result["score"] == 70
    assert result["grade"] == "C"
    rule_statuses = {f["rule_id"]: f["status"] for f in result["findings"]}
    assert rule_statuses["CERT_EXPIRY"] == "FAIL"
    assert "EXPIRY_PROXIMITY" not in rule_statuses  # Skipped due to anti-double-counting policy


def test_hostname_mismatch_critical():
    """Hostname mismatch applies -35 penalty (CRITICAL severity)."""
    cert = {
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "san": ["otherdomain.com"],
        "hostname_match": False,
        "self_signed": False,
    }

    result = score_security("TLSv1.3", cert, now=FIXED_NOW)

    assert result["score"] == 65
    assert result["grade"] == "D"
    rule_statuses = {f["rule_id"]: f["status"] for f in result["findings"]}
    assert rule_statuses["HOSTNAME_MATCH"] == "FAIL"


def test_self_signed_cert_warning():
    """Self-signed cert applies -25 penalty."""
    cert = {
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "san": ["example.com"],
        "hostname_match": True,
        "self_signed": True,
    }

    result = score_security("TLSv1.3", cert, now=FIXED_NOW)

    assert result["score"] == 75
    assert result["grade"] == "C"
    rule_statuses = {f["rule_id"]: f["status"] for f in result["findings"]}
    assert rule_statuses["SELF_SIGNED"] == "WARN"


def test_multiple_failures_clamped_to_zero():
    """Multiple failures apply accumulated penalties, score clamped to 0 (Grade F)."""
    cert = {
        "valid_from": "2020-01-01T00:00:00Z",
        "valid_until": "2020-12-31T23:59:59Z",
        "san": ["other.com"],
        "hostname_match": False,
        "self_signed": True,
    }

    # TLS 1.0 (-30), Expired (-30), Hostname Mismatch (-35), Self-signed (-25) -> Total penalty -120
    result = score_security("TLSv1.0", cert, now=FIXED_NOW)

    assert result["score"] == 0
    assert result["grade"] == "F"


def test_grade_boundaries():
    """Test boundary values for grade calculation."""
    assert calculate_grade(100) == "A"
    assert calculate_grade(90) == "A"
    assert calculate_grade(89) == "B"
    assert calculate_grade(80) == "B"
    assert calculate_grade(79) == "C"
    assert calculate_grade(70) == "C"
    assert calculate_grade(69) == "D"
    assert calculate_grade(60) == "D"
    assert calculate_grade(59) == "E"
    assert calculate_grade(50) == "E"
    assert calculate_grade(49) == "F"
    assert calculate_grade(0) == "F"


def test_determinism():
    """Ensure identical inputs produce identical SecurityResult objects."""
    cert = {
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-12-31T23:59:59Z",
        "san": ["example.com"],
        "hostname_match": True,
        "self_signed": False,
    }

    res1 = score_security("TLSv1.3", cert, now=FIXED_NOW)
    res2 = score_security("TLSv1.3", cert, now=FIXED_NOW)

    assert res1 == res2


# ---------------------------------------------------------------------------
# points_deducted: the backend reports each finding's penalty so clients never
# need to re-implement the scoring table.
# ---------------------------------------------------------------------------

_GOOD_CERT = {
    "subject": "CN=example.com",
    "issuer": "CN=DigiCert CA",
    "valid_from": "2026-01-01T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z",
    "san": ["example.com"],
    "hostname_match": True,
    "self_signed": False,
}


def _assert_points_add_up(result):
    total = sum(f["points_deducted"] for f in result["findings"])
    assert result["score"] == max(0, min(100, 100 - total))


def test_points_deducted_is_zero_for_a_clean_scan():
    result = score_security("TLSv1.3", _GOOD_CERT, now=FIXED_NOW)
    assert all(f["points_deducted"] == 0 for f in result["findings"])
    _assert_points_add_up(result)


def test_points_deducted_matches_each_rule_penalty():
    cert = {**_GOOD_CERT, "self_signed": True}
    result = score_security("TLSv1.2", cert, now=FIXED_NOW)
    points = {f["rule_id"]: f["points_deducted"] for f in result["findings"]}
    assert points["TLS_VERSION"] == 10
    assert points["SELF_SIGNED"] == 25
    assert points["HOSTNAME_MATCH"] == 0
    assert result["score"] == 65
    _assert_points_add_up(result)


def test_points_deducted_for_expiry_windows():
    near = {**_GOOD_CERT, "valid_until": "2026-09-20T00:00:00Z"}  # ~3 days
    soon = {**_GOOD_CERT, "valid_until": "2026-10-01T00:00:00Z"}  # ~14 days
    for cert, expected in ((near, 15), (soon, 10)):
        result = score_security("TLSv1.3", cert, now=FIXED_NOW)
        prox = next(f for f in result["findings"] if f["rule_id"] == "EXPIRY_PROXIMITY")
        assert prox["points_deducted"] == expected
        _assert_points_add_up(result)


def test_points_deducted_when_everything_fails_exceeds_clamped_score():
    cert = {
        **_GOOD_CERT,
        "valid_until": "2026-01-02T00:00:00Z",  # expired
        "hostname_match": False,
        "self_signed": True,
    }
    result = score_security("TLSv1.2", cert, now=FIXED_NOW)
    assert sum(f["points_deducted"] for f in result["findings"]) == 100
    assert result["score"] == 0
    _assert_points_add_up(result)


def test_points_deducted_for_missing_certificate_and_unknown_tls():
    result = score_security(None, None, now=FIXED_NOW)
    points = {f["rule_id"]: f["points_deducted"] for f in result["findings"]}
    assert points["TLS_VERSION"] == 30
    assert points["CERT_EXPIRY"] == 30
    assert points["HOSTNAME_MATCH"] == 35
    _assert_points_add_up(result)
