"""Canonical TLS handshake step definitions.

These describe the *protocol sequence* only. They contain no data observed
from any specific server. Real negotiated values are attached separately by
``app.visualization.builder``.

Honesty note
------------
The MVP uses Python's high-level ``ssl`` module rather than raw packet
capture, so the exact set of messages exchanged on the wire is not observed.
These sequences are simplified, representative flows. Where a message is
conditional, that condition is stated in the step's own description rather
than encoded as an extra API field, so the API contract stays at version 1.0.
"""

TLS_1_2_STEPS: list[dict] = [
    {
        "id": "client_hello",
        "sequence": 1,
        "sender": "client",
        "receiver": "server",
        "message": "ClientHello",
        "title": "Client says hello",
        "description": (
            "The client opens the handshake and offers the TLS versions, "
            "cipher suites and extensions it supports, along with a random "
            "value and the server name it wants to reach."
        ),
        "purpose": (
            "Start negotiation and tell the server what the client is "
            "capable of."
        ),
    },
    {
        "id": "server_hello",
        "sequence": 2,
        "sender": "server",
        "receiver": "client",
        "message": "ServerHello",
        "title": "Server picks the parameters",
        "description": (
            "The server chooses one TLS version and one cipher suite from "
            "what the client offered, and returns its own random value."
        ),
        "purpose": "Fix the parameters both sides will use for this connection.",
    },
    {
        "id": "certificate",
        "sequence": 3,
        "sender": "server",
        "receiver": "client",
        "message": "Certificate",
        "title": "Server proves who it is",
        "description": (
            "The server sends its X.509 certificate chain. The client checks "
            "the signature chain, the validity dates and whether the "
            "certificate actually covers the hostname that was requested."
        ),
        "purpose": (
            "Give the client verifiable evidence of the server's identity."
        ),
    },
    {
        "id": "server_key_exchange",
        "sequence": 4,
        "sender": "server",
        "receiver": "client",
        "message": "ServerKeyExchange",
        "title": "Server sends key exchange data",
        "description": (
            "Sent only when the negotiated cipher suite needs extra key "
            "material, which is the case for the ephemeral Diffie-Hellman "
            "suites in normal modern use. Static RSA key exchange skips it."
        ),
        "purpose": (
            "Carry the server's ephemeral key share so that a fresh shared "
            "secret can be derived."
        ),
    },
    {
        "id": "server_hello_done",
        "sequence": 5,
        "sender": "server",
        "receiver": "client",
        "message": "ServerHelloDone",
        "title": "Server finishes its turn",
        "description": (
            "A short marker telling the client the server has sent everything "
            "it intends to send in this phase."
        ),
        "purpose": "Hand the conversation back to the client.",
    },
    {
        "id": "client_key_exchange",
        "sequence": 6,
        "sender": "client",
        "receiver": "server",
        "message": "ClientKeyExchange",
        "title": "Client sends its key material",
        "description": (
            "The client supplies its half of the key exchange. Both sides can "
            "now derive the same premaster secret and from it the session keys."
        ),
        "purpose": "Complete the key agreement.",
    },
    {
        "id": "client_change_cipher_spec",
        "sequence": 7,
        "sender": "client",
        "receiver": "server",
        "message": "ChangeCipherSpec",
        "title": "Client switches to encryption",
        "description": (
            "The client signals that everything it sends from this point "
            "onwards is protected with the newly derived keys."
        ),
        "purpose": "Mark the switch from plaintext to encrypted records.",
    },
    {
        "id": "client_finished",
        "sequence": 8,
        "sender": "client",
        "receiver": "server",
        "message": "Finished",
        "title": "Client confirms the handshake",
        "description": (
            "The first encrypted message. It contains a hash over the whole "
            "handshake so far, which proves nothing was tampered with in "
            "transit."
        ),
        "purpose": "Verify handshake integrity from the client's side.",
    },
    {
        "id": "server_change_cipher_spec",
        "sequence": 9,
        "sender": "server",
        "receiver": "client",
        "message": "ChangeCipherSpec",
        "title": "Server switches to encryption",
        "description": (
            "The server signals that its side of the connection is now "
            "encrypted too."
        ),
        "purpose": "Mark the server's switch to encrypted records.",
    },
    {
        "id": "server_finished",
        "sequence": 10,
        "sender": "server",
        "receiver": "client",
        "message": "Finished",
        "title": "Server confirms the handshake",
        "description": (
            "The server sends its own handshake hash. Once the client accepts "
            "it, application data such as the HTTP request can flow."
        ),
        "purpose": "Verify handshake integrity from the server's side.",
    },
]


TLS_1_3_STEPS: list[dict] = [
    {
        "id": "client_hello",
        "sequence": 1,
        "sender": "client",
        "receiver": "server",
        "message": "ClientHello",
        "title": "Client says hello and guesses a key",
        "description": (
            "As well as offering cipher suites and the server name, the client "
            "already sends one or more key shares. This guess is what removes "
            "a full round trip compared with TLS 1.2."
        ),
        "purpose": "Start negotiation and begin key agreement immediately.",
    },
    {
        "id": "server_hello",
        "sequence": 2,
        "sender": "server",
        "receiver": "client",
        "message": "ServerHello",
        "title": "Server picks parameters and answers the key share",
        "description": (
            "The server selects the cipher suite and returns its own key "
            "share. Both sides can now derive handshake keys, so the rest of "
            "the handshake is encrypted."
        ),
        "purpose": "Fix parameters and complete the key exchange early.",
    },
    {
        "id": "encrypted_extensions",
        "sequence": 3,
        "sender": "server",
        "receiver": "client",
        "message": "EncryptedExtensions",
        "title": "Server sends the remaining settings, encrypted",
        "description": (
            "Negotiated extensions that are not needed to establish keys are "
            "sent here, under encryption. In TLS 1.2 the equivalent "
            "information travelled in the clear."
        ),
        "purpose": "Deliver the rest of the negotiated parameters privately.",
    },
    {
        "id": "certificate",
        "sequence": 4,
        "sender": "server",
        "receiver": "client",
        "message": "Certificate",
        "title": "Server proves who it is",
        "description": (
            "The certificate chain, now encrypted so that an observer cannot "
            "see which site is being visited from the handshake alone. Skipped "
            "when the session is resumed from a pre-shared key."
        ),
        "purpose": "Give the client verifiable evidence of the server's identity.",
    },
    {
        "id": "certificate_verify",
        "sequence": 5,
        "sender": "server",
        "receiver": "client",
        "message": "CertificateVerify",
        "title": "Server signs the handshake",
        "description": (
            "The server signs a hash of the handshake with the private key "
            "belonging to the certificate it just sent. Sent whenever a "
            "certificate was sent."
        ),
        "purpose": (
            "Prove the server actually holds the private key, not just a copy "
            "of someone else's certificate."
        ),
    },
    {
        "id": "server_finished",
        "sequence": 6,
        "sender": "server",
        "receiver": "client",
        "message": "Finished",
        "title": "Server confirms the handshake",
        "description": (
            "A message authentication code over the whole handshake, proving "
            "the server derived the same keys and that nothing was modified."
        ),
        "purpose": "Verify handshake integrity from the server's side.",
    },
    {
        "id": "client_finished",
        "sequence": 7,
        "sender": "client",
        "receiver": "server",
        "message": "Finished",
        "title": "Client confirms the handshake",
        "description": (
            "The client checks the server's signature and Finished message, "
            "then sends its own. Application data can follow in the same "
            "flight."
        ),
        "purpose": "Verify handshake integrity from the client's side.",
    },
]
