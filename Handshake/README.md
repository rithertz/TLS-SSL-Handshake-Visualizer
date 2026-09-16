# TLS Handshake Visualizer

Module owner: Jayanth S (24BCT0293)
Branch: `feature/jayanth-handshake`
Course: Computer Networks — BCSE308L

This document explains what the module is, how it is put together, what every
file does, and — the part that matters most for the viva — exactly which parts
of what you see on screen are measured from the real server and which parts
are protocol knowledge.

---

## 1. What this module is

The project analyzes an HTTPS site and reports on its TLS security. This module
is the part that turns the connection into something a person can read: an
interactive client/server sequence of the TLS handshake, with the real
negotiated parameters attached to the messages they belong to.

It is two halves that meet at the API contract:

```
POST /analyze
      │
      ├── TLS analyzer (Rithwik)  ── negotiated version, cipher, certificate
      │         │
      │         ▼
      │   visualization builder   ── this module, backend half
      │         │
      │         ▼
      │   response.visualization  ── protocol_version + ordered steps
      │
      ▼
React dashboard (Sujay)
      │
      ▼
<HandshakeVisualizer />          ── this module, frontend half
```

Before this branch, `/analyze` returned `"visualization": null`. The API
contract lists the field as required (section 12), so the frontend had nothing
to render. Both halves had to exist for the feature to work at all.

---

## 2. The honesty boundary

This is the single most important design constraint in the module, and the
thing to be ready to explain if you are asked about it.

The backend connects using Python's `ssl` module, which performs the handshake
for us and hands back a finished socket. It is **not** a packet capture. From
that socket we can genuinely read:

- the negotiated TLS version (`socket.version()`)
- the negotiated cipher suite and its key size (`socket.cipher()`)
- the peer certificate in DER form (`socket.getpeercert(binary_form=True)`)

We cannot see the contents of ClientKeyExchange, the key shares, the
ChangeCipherSpec records, or the Finished verify data. Those never surface
through the high-level API.

So the module draws a hard line:

| Where the data comes from | How it is shown |
| --- | --- |
| Observed on the live socket | Attached to the step it belongs to, displayed as a labelled value |
| Protocol knowledge (RFC behaviour) | Shown as the step's description and purpose, clearly worded as what the message *does* |
| Not observable | `actual_data: null`, and the UI says so in plain words |

The panel for an unobservable step reads:

> No measured values for this message. The analyzer reads the connection
> through the TLS library, so only the negotiated parameters and the
> certificate are directly observed.

And every render carries the footnote:

> This is a representative protocol flow enriched with real negotiated data,
> not a packet capture.

There is a test (`never claims to have captured packets`) that fails if that
disclaimer is removed. Filling the empty steps with plausible-looking invented
values would be the easiest way to lose marks on this project, so it is
enforced rather than left to discipline.

This matches API_CONTRACT.md sections 36, 41 and 57, and section 9 of the
individual workload document.

---

## 3. Backend half

### `backend/app/visualization/protocol_steps.py`

Two module-level lists, `TLS_1_2_STEPS` and `TLS_1_3_STEPS`. Pure data — no
imports from the rest of the app, no server-specific content. Each entry is a
dict carrying every field the contract's `HandshakeStep` schema requires:
`id`, `sequence`, `sender`, `receiver`, `message`, `title`, `description`,
`purpose`.

**TLS 1.2 — ten messages, two round trips before application data:**

```
CLIENT                                           SERVER
  1  ClientHello              ───────────────▶
                              ◀───────────────   2  ServerHello
                              ◀───────────────   3  Certificate
                              ◀───────────────   4  ServerKeyExchange*
                              ◀───────────────   5  ServerHelloDone
  6  ClientKeyExchange        ───────────────▶
  7  ChangeCipherSpec         ───────────────▶
  8  Finished                 ───────────────▶
                              ◀───────────────   9  ChangeCipherSpec
                              ◀───────────────  10  Finished
```

**TLS 1.3 — seven messages, one round trip:**

```
CLIENT                                           SERVER
  1  ClientHello              ───────────────▶     (already carries a key share)
                              ◀───────────────   2  ServerHello
                              ◀───────────────   3  EncryptedExtensions
                              ◀───────────────   4  Certificate*
                              ◀───────────────   5  CertificateVerify*
                              ◀───────────────   6  Finished
  7  Finished                 ───────────────▶
```

`*` marks conditional messages. ServerKeyExchange appears only when the cipher
suite needs it — true for the ephemeral Diffie-Hellman suites in normal modern
use, not for static RSA. In TLS 1.3 the Certificate and CertificateVerify pair
is skipped on a resumed pre-shared-key session.

Rather than adding an `optional` field to the API (which would have meant a
contract version bump and sign-off from four other people), the condition is
stated inside each step's own `description`. The frontend copy of the data has
a presentation-only `conditional` flag that never crosses the wire.

### `backend/app/visualization/builder.py`

Three public things:

- **`select_protocol_steps(tls_version)`** — normalizes the version string and
  returns the matching list. Anything that is not 1.3 falls back to the TLS 1.2
  sequence, which is the longer and more general of the two. Returning nothing
  would leave the UI blank for an old or unrecognised version.
- **`build_visualization(tls_version, cipher, certificate, hostname)`** —
  copies the template steps and attaches observed data.
- **`EMPTY_VISUALIZATION`** — `{"protocol_version": None, "steps": []}`, the
  exact shape the contract's failed-response example uses (section 63).

What gets attached, and the justification for each:

| Step | Keys | Why we may claim it |
| --- | --- | --- |
| `client_hello` | `sni_hostname` | We chose and sent this value ourselves |
| `server_hello` | `negotiated_tls_version`, `cipher_suite`, `cipher_protocol`, `symmetric_key_bits` | Read directly off the live socket |
| `certificate` | `subject`, `issuer`, `valid_from`, `valid_until`, `serial_number`, `hostname_match`, `self_signed`, `san_count` | Parsed from the certificate the server actually presented |

Every other step gets `actual_data: None`.

Two details worth knowing when reviewing:

- Keys whose value is `None` are stripped before the dict is returned, so an
  unobserved field is absent rather than present-and-null. A step with nothing
  to show ends up with `actual_data: None` rather than an empty object.
- Steps are copied with `dict(template)` before mutation, so the canonical
  definitions are never modified. A test asserts this, because a shared mutable
  default would have leaked one site's certificate into the next request.

### `backend/app/services/analysis_service.py`

Modified, not rewritten. Five lines:

```python
from app.visualization.builder import EMPTY_VISUALIZATION, build_visualization
```

The success path swaps `"visualization": None` for a `build_visualization(...)`
call. The three failure paths swap it for `EMPTY_VISUALIZATION`, so a failed
analysis returns the shape the contract documents instead of a bare null.

Nothing else in the orchestrator changed. No API field was added, renamed or
removed anywhere — the contract stays at version 1.0.

---

## 4. Frontend half

### File layout

```
frontend/src/visualizer/
├── handshakeTypes.ts          types
├── handshakeData.ts           protocol models (fallback + offline rendering)
├── visualizerUtils.ts         pure functions, no React
├── HandshakeMessage.tsx       one message row
├── HandshakeVisualizer.tsx    state, controls, detail panel
├── HandshakeVisualizer.css    scoped styles
└── __tests__/
    ├── handshakeData.test.ts
    └── HandshakeVisualizer.test.tsx
```

The split exists so protocol knowledge never lives inside JSX. Rewording an
explanation or adding a message touches `handshakeData.ts` only. Changing how
a row looks touches the component only. This is also what makes the protocol
data testable on its own, with no DOM involved.

### `handshakeTypes.ts`

`VisualStep` extends the contract's `HandshakeStep` (imported from
`src/types/analysis.ts`, the shared type file — not redeclared) with two
presentation-only fields, `conditional` and `model`. Extending rather than
redefining means that if the contract changes, TypeScript breaks here loudly
instead of the two definitions drifting apart silently.

### `handshakeData.ts`

The frontend's own copy of both sequences. It serves three purposes: a fallback
when the backend sends no steps, a way to render the component in isolation for
styling work, and fixtures for the tests. `MODEL_NOTES` holds the one-line
summary of why the two sequences differ, shown under the heading.

Keep the wording here in sync with `protocol_steps.py`. Duplication is the
trade-off for a component that still works with the backend down.

### `visualizerUtils.ts`

Pure functions, unit-tested without rendering anything:

- **`toProtocolModel(version)`** — maps a version string onto `"TLS1.2"` or
  `"TLS1.3"`. Handles `"TLSv1.3"` (what Python produces), `"tls 1.3"` and
  similar. Returns `null` for TLS 1.1, SSLv3 and anything else we have no model
  for, so those are handled deliberately rather than silently mislabelled.
- **`describeVersion(version)`** — the heading text. An old version is named
  honestly even though the TLS 1.2 diagram is what gets drawn beneath it.
- **`resolveSequence(visualization, fallbackVersion)`** — decides what to
  render. Covered in detail below.
- **`toDisplayFields(actualData)`** — turns `actual_data` into labelled rows.
  Drops nulls rather than printing `"null"`, renders booleans as Yes/No, key
  sizes as `"256 bits"`, ISO timestamps as plain dates, and falls back to a
  humanized version of any key it does not recognise, so a new backend field
  appears sensibly instead of breaking the panel.

### `resolveSequence` — where the steps come from

```
visualization.steps present and well-formed?
        │
        ├── yes ──▶ sort by `sequence`, render those      source: "backend"
        │             (these carry the real observed data)
        │
        └── no  ──▶ pick the local model from the reported version
                                                          source: "local"
                    and say so in the footnote
```

Malformed steps are filtered out individually — a step missing an `id`, or with
a `sender` that is not `client` or `server`, is dropped rather than crashing the
panel. The fallback exists so the component is usable offline and in tests, but
it never pretends local data came from the server: the footnote changes to
*"Showing the built-in TLS 1.3 model. The analyzer did not return a sequence
for this result."*

### `HandshakeVisualizer.tsx` — state

Three pieces of state, plus one for change detection:

| State | Meaning |
| --- | --- |
| `index` | which message is current, 0-based |
| `wantsPlayback` | whether the user has pressed Play |
| `openIndex` | which row's details are expanded, or `null` |
| `renderedSequence` | the sequence identity currently on screen |

Two decisions here were driven by bugs found while testing, and are worth
understanding before anyone refactors them:

**Playback is derived, not stored.** `isPlaying = wantsPlayback && !atEnd`.
The obvious implementation stores an `isPlaying` boolean and sets it to `false`
from inside the effect when the last step is reached. That is a `setState`
inside an effect, which React 19's lint rules reject as a cascading render, and
it makes a stuck state possible where the timer outlives the sequence. Deriving
it means playback stops at the end on its own, with no state write at all.

**Rewind happens during render, not in an effect.** When a new analysis
arrives, `sequence` gets a new identity, `renderedSequence !== sequence`, and
the component rewinds to step 1 in the same render pass. This is React's
documented "adjusting state during render" pattern. The first version used
`useEffect(..., [steps])`, which looked correct and silently broke everything:
`resolveSequence` builds a new array each call, so the effect fired on every
render and pinned the visualizer to step 1. Ten tests failed on it. `useMemo`
around `resolveSequence` gives the sequence a stable identity, and the
during-render check does the rewind.

**One timer, always.** The playback effect schedules a single `setTimeout` per
step and clears it on cleanup, rather than running one repeating interval.
There is no path on which two timers are alive at once, and a test asserts the
call count.

### Controls

| Control | Behaviour |
| --- | --- |
| Play | Advances automatically; restarts from step 1 if already at the end |
| Pause | Stops advancing, keeps position |
| Next / Previous | One step, stops playback |
| Reset | Back to step 1, collapses the detail panel; disabled at step 1 |
| Click a row | Jumps to that message and toggles its details |

Play reads **Replay** at the end, so the button says what it will actually do.

### Styling and accessibility

Every selector is prefixed `hv-`, so nothing collides with the dashboard.
Colours are CSS custom properties defined on `.hv` and inherited, which makes
retheming a four-line change. The message row is a real `<button>` inside an
`<li>`, the current step carries `aria-current="step"`, the progress line is an
`aria-live` region, focus is visible, and the arrow animation is disabled under
`prefers-reduced-motion`. Below 520px the direction labels drop away rather
than wrapping.

---

## 5. Integration

The component makes **no network requests**. It renders what it is handed.
That is deliberate: fetching belongs in `services/api.ts`, and a component that
fetches cannot be tested or reused.

```tsx
import HandshakeVisualizer from "./visualizer/HandshakeVisualizer";

<HandshakeVisualizer
  visualization={analysis.visualization}
  tlsVersion={analysis.tls?.version}
/>
```

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `visualization` | `VisualizationInfo \| null` | no | The `visualization` block from `/analyze` |
| `tlsVersion` | `string \| null` | no | Only used if `protocol_version` is missing |
| `stepDurationMs` | `number` | no | Defaults to 1500 |

With no props at all it renders the built-in TLS 1.2 model, which is useful for
styling without a running backend.

The current placement in `App.tsx` is a placeholder so the demo works end to
end. Move it wherever the dashboard wants it.

---

## 6. Testing

```bash
cd backend  && python -m pytest tests -q   # 10 passed
cd frontend && npm run test                # 44 passed
cd frontend && npm run lint                # clean
cd frontend && npm run build               # clean
```

The frontend had no test runner before this branch, despite Vitest being in the
agreed stack. This adds Vitest plus jsdom and Testing Library, a `test` script,
and the jsdom environment config in `vite.config.ts`. Run `npm install` after
pulling.

**Backend (10 cases)** — unique step ids, contiguous sequence numbering,
required fields present, sender and receiver always differ, TLS 1.3 shorter
than TLS 1.2, version selection including unknown and null, real values landing
on the right steps, unobservable steps staying null, tolerance of missing data,
and non-mutation of the canonical definitions.

**Frontend (44 cases)** — the same structural checks on the frontend data,
every branch of `toProtocolModel` and `toDisplayFields`, all four `resolveSequence`
paths, backend-vs-fallback rendering, real values appearing in the panel, the
absence message instead of `null`, each control including disabled edges,
`aria-current`, playback advancing, pausing, settling at the end, replaying,
stopping when the user steps manually, and the single-timer assertion.

Verified once against a live host (`https://example.com`), which returned
`analysis_status: SUCCESS` with a seven-step TLS 1.3 sequence, cipher
`TLS_AES_256_GCM_SHA384` at 256 bits.

Not covered: no browser was available in the environment the code was written
in, so the CSS has not been looked at. Run `npm run dev` before opening the PR.

---

## 7. Scope

**Owned here:** protocol modelling for both versions, the backend
`visualization` builder, the React visualizer, its state and animation, the
educational copy, and tests for all of it.

**Not owned:** the TLS socket code, certificate parsing, scoring rules, the
dashboard layout, CI configuration, and the API contract itself. This branch
consumes those and reports problems rather than editing them.

Two open items for the group, both in
`docs/HANDSHAKE_VISUALIZER_HANDOFF.md`: `certificate.subject` and `issuer` are
objects in contract section 21 but strings in the code and both type files, and
CI runs no tests despite pytest and Vitest both being in the stack decision.

---

## 8. Questions you should be ready to answer

**Why do the two sequences differ?** TLS 1.3 sends a key share in ClientHello
instead of waiting to learn the server's parameters first. The server can
answer it immediately, so keys exist one flight earlier — one round trip
instead of two, with everything after ServerHello encrypted.

**How does the visualizer know which one to draw?** The backend reports the
negotiated version on the socket; `resolveSequence` maps it to a model. The
frontend never guesses.

**Why isn't every step filled in?** Because we use the `ssl` module, not a
packet capture. Section 2 above is the full answer.

**Why is the protocol data separate from the component?** It is testable
without a DOM, reusable, and editable without touching rendering. The backend
and frontend both hold a copy for the same reason the fallback exists — the
component has to work when the backend does not.

**What are the asterisked messages?** Conditional ones. ServerKeyExchange
depends on the negotiated key exchange; TLS 1.3's Certificate and
CertificateVerify are skipped on a resumed session. The UI marks them rather
than presenting them as certain.
