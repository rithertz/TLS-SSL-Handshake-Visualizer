from app.visualization.builder import (
    EMPTY_VISUALIZATION,
    build_visualization,
    select_protocol_steps,
)
from app.visualization.protocol_steps import TLS_1_2_STEPS, TLS_1_3_STEPS


CERTIFICATE = {
    "subject": "CN=example.com",
    "issuer": "CN=Example CA,O=Example",
    "valid_from": "2026-06-01T00:00:00+00:00",
    "valid_until": "2026-08-30T23:59:59+00:00",
    "san": ["example.com", "www.example.com"],
    "serial_number": "123456789",
    "hostname_match": True,
    "self_signed": False,
}

CIPHER = {
    "name": "TLS_AES_256_GCM_SHA384",
    "protocol": "TLSv1.3",
    "bits": 256,
}


def test_sequences_have_unique_ids():
    for sequence in (TLS_1_2_STEPS, TLS_1_3_STEPS):
        ids = [step["id"] for step in sequence]
        assert len(ids) == len(set(ids))


def test_sequence_numbers_are_contiguous_and_ordered():
    for sequence in (TLS_1_2_STEPS, TLS_1_3_STEPS):
        numbers = [step["sequence"] for step in sequence]
        assert numbers == list(range(1, len(sequence) + 1))


def test_every_step_has_the_contract_fields():
    required = {
        "id",
        "sequence",
        "sender",
        "receiver",
        "message",
        "title",
        "description",
        "purpose",
    }

    for sequence in (TLS_1_2_STEPS, TLS_1_3_STEPS):
        for step in sequence:
            assert required.issubset(step.keys())
            assert step["sender"] in {"client", "server"}
            assert step["receiver"] in {"client", "server"}
            assert step["sender"] != step["receiver"]


def test_tls_13_is_shorter_than_tls_12():
    assert len(TLS_1_3_STEPS) < len(TLS_1_2_STEPS)


def test_version_selection():
    assert select_protocol_steps("TLSv1.3") is TLS_1_3_STEPS
    assert select_protocol_steps("TLSv1.2") is TLS_1_2_STEPS
    assert select_protocol_steps("TLSv1.1") is TLS_1_2_STEPS
    assert select_protocol_steps(None) is TLS_1_2_STEPS


def test_build_attaches_real_negotiated_values():
    visualization = build_visualization(
        "TLSv1.3",
        CIPHER,
        CERTIFICATE,
        hostname="example.com",
    )

    assert visualization["protocol_version"] == "TLSv1.3"

    by_id = {step["id"]: step for step in visualization["steps"]}

    assert by_id["server_hello"]["actual_data"]["cipher_suite"] == (
        "TLS_AES_256_GCM_SHA384"
    )
    assert by_id["server_hello"]["actual_data"]["symmetric_key_bits"] == 256
    assert by_id["certificate"]["actual_data"]["hostname_match"] is True
    assert by_id["certificate"]["actual_data"]["san_count"] == 2
    assert by_id["client_hello"]["actual_data"]["sni_hostname"] == "example.com"


def test_unobservable_steps_stay_null():
    visualization = build_visualization(
        "TLSv1.2",
        CIPHER,
        CERTIFICATE,
        hostname="example.com",
    )

    by_id = {step["id"]: step for step in visualization["steps"]}

    assert by_id["client_key_exchange"]["actual_data"] is None
    assert by_id["client_finished"]["actual_data"] is None
    assert by_id["server_change_cipher_spec"]["actual_data"] is None


def test_build_tolerates_missing_data():
    visualization = build_visualization(None, None, None)

    assert visualization["protocol_version"] is None
    assert len(visualization["steps"]) == len(TLS_1_2_STEPS)
    assert all(step["actual_data"] is None for step in visualization["steps"])


def test_build_does_not_mutate_the_canonical_definitions():
    build_visualization("TLSv1.3", CIPHER, CERTIFICATE, hostname="example.com")

    assert all("actual_data" not in step for step in TLS_1_3_STEPS)


def test_empty_visualization_matches_the_failed_response_shape():
    assert EMPTY_VISUALIZATION == {"protocol_version": None, "steps": []}
