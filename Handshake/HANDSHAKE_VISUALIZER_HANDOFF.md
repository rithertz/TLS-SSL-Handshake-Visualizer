# Handshake visualizer — branch notes

Branch: `feature/jayanth-handshake`

Everything below was written against the current `main` skeleton. Nothing in
the existing foundation was removed. Two shared files are touched, both
additively, and both are called out at the bottom.

---

## Where the files go

```
backend/app/visualization/__init__.py          new
backend/app/visualization/protocol_steps.py    new
backend/app/visualization/builder.py           new
backend/app/services/analysis_service.py       modified (5 lines)
backend/tests/test_visualization.py            new

frontend/src/visualizer/handshakeTypes.ts      new
frontend/src/visualizer/handshakeData.ts       new
frontend/src/visualizer/visualizerUtils.ts     new
frontend/src/visualizer/HandshakeMessage.tsx   new
frontend/src/visualizer/HandshakeVisualizer.tsx new
frontend/src/visualizer/HandshakeVisualizer.css new
frontend/src/visualizer/__tests__/*            new
frontend/src/App.tsx                           modified (6 lines)
frontend/package.json                          modified (test deps + script)
frontend/vite.config.ts                        modified (jsdom test config)
```

After copying, install the new frontend dev dependencies:

```bash
cd frontend
npm install
```

## Verifying locally

```bash
# backend
cd backend
python -m pytest tests -q          # 10 passed

# frontend
cd frontend
npm run lint                       # clean
npm run build                      # clean
npm run test                       # 44 passed
```

All three of these were run against a clean clone of `main` before this was
written, plus one live check against `https://example.com`, which returned
`analysis_status: SUCCESS` with a seven-step TLS 1.3 sequence.

---

## What the backend change does

`/analyze` was returning `"visualization": null`. The API contract (section 12)
lists `visualization` as required, so the frontend had nothing to render.

`build_visualization()` now fills it. It picks the TLS 1.2 or TLS 1.3 step
sequence from the negotiated version and attaches real observed values to the
three steps where we actually have them:

| Step           | What gets attached                                    |
| -------------- | ----------------------------------------------------- |
| `client_hello` | the SNI hostname, because we chose and sent it         |
| `server_hello` | negotiated version, cipher suite, key size, read off the live socket |
| `certificate`  | subject, issuer, validity dates, serial, hostname match, SAN count |

Every other step gets `actual_data: null`. That is deliberate and it is what
contract sections 41 and 57 ask for. We use Python's `ssl` module, not raw
packet capture, so the contents of ClientKeyExchange or the Finished hashes
are not observable. Inventing plausible-looking values there would be the one
thing that could sink this in the viva.

The three failure paths now return `EMPTY_VISUALIZATION`
(`{"protocol_version": null, "steps": []}`) instead of `null`, matching the
failed-response example in contract section 63.

No API fields were added, renamed or removed. Contract stays at 1.0.

## What the frontend component does

`<HandshakeVisualizer />` takes the `visualization` block and renders it as a
client/server sequence with Play, Pause, Next, Previous and Reset, plus a
details panel for the selected message.

It makes no network requests. It renders what it is handed.

Two behaviours worth knowing about when reviewing:

- **It prefers the backend's sequence.** If `visualization.steps` is empty or
  malformed, it falls back to its own built-in model, selected from
  `tls.version`, and says so in the footnote. That means the component still
  works if the backend is down or if someone renders it in isolation, without
  ever silently pretending local data came from the server.
- **Playback ends by itself.** `isPlaying` is derived, not stored, so the
  visualizer cannot get stuck in a state where the timer is running past the
  last step. There is one `setTimeout` alive at a time, and a test asserts it.

Protocol data lives in `handshakeData.ts`, never in JSX. Adding a message or
rewording an explanation does not touch the component.

## Integration for Sujay

The change to `App.tsx` is a placeholder so the demo works end to end. Move it
wherever the real dashboard wants it — the component is self-contained and its
CSS is prefixed `hv-`, so it will not collide with anything:

```tsx
import HandshakeVisualizer from "./visualizer/HandshakeVisualizer";

<HandshakeVisualizer
  visualization={analysis.visualization}
  tlsVersion={analysis.tls?.version}
/>
```

Both props are optional. Passing nothing renders the built-in TLS 1.2 model,
which is handy for styling work without a running backend.

---

## Things the group needs to decide

These are not blocking this branch, but they will bite someone later.

**1. `certificate.subject` and `certificate.issuer` disagree with the contract.**

Contract section 21 defines them as objects:

```json
"subject": { "common_name": "example.com" }
```

The skeleton's `parse_certificate` returns RFC 4514 strings
(`"CN=example.com,O=Example Inc"`), and both `schemas.py` and `analysis.ts`
type them as `str | None`. Code and contract currently say different things.

This affects Rithwik (parser), Sujay (rendering), Shantanu (if any rule reads
the issuer) and Dheeraj (whose contract tests will have to assert one or the
other). Worth settling before those tests get written. The string form is
easier to display; the object form is easier to score against. Either is fine,
but it should be one of them, in the contract and in both type files.

**2. The contract's top-level table omits `analysis_status`.**

Section 13 lists seven fields and no `analysis_status`, but sections 48, 62 and
63 use it and the code implements it. The table just needs the row added.

**3. `backend/requirements.txt` is UTF-16 encoded.**

It was probably written with `pip freeze > requirements.txt` in PowerShell.
`pip install -r` copes, but most tools that read it as text will not. A
one-line fix, someone's call whose branch it goes in.

**4. CI does not run any tests.**

Vitest and pytest are both in the stack decision; neither runs in CI, and there
was no test runner installed on the frontend at all. This branch adds the
frontend one. Suggested additions to `.github/workflows/ci.yml` — `.github/` is
owned by @rithertz per CODEOWNERS, so this needs his sign-off rather than
being slipped in:

```yaml
# in the backend job, after installing dependencies
      - name: Run backend tests
        working-directory: backend
        run: python -m pytest tests -q

# in the frontend job, between lint and build
      - name: Run frontend tests
        working-directory: frontend
        run: npm run test
```

---

## Suggested PR description

```markdown
## Summary
Implements the TLS handshake visualizer and the backend `visualization` block
that feeds it. `/analyze` previously returned `"visualization": null`.

## Protocol
- TLS 1.2 sequence (10 messages)
- TLS 1.3 sequence (7 messages)
- Version selected from the negotiated `tls.version`
- Conditional messages marked as conditional rather than presented as certain

## Backend
- `app/visualization/protocol_steps.py` — canonical step definitions
- `app/visualization/builder.py` — attaches observed values to the three steps
  where we genuinely have them; everything else stays null
- `analysis_service.py` wired up; failure paths return the empty visualization
  shape from contract section 63

## UI
- Client/server lanes with directional messages
- Play / Pause / Next / Previous / Reset
- Click a message for its explanation and its real values
- Falls back to the built-in model, and says so, if the backend sends no steps

## Testing
- 10 pytest cases for the builder and protocol data
- 44 Vitest cases for the data, the pure helpers and the component
- Adds Vitest to the frontend, which had no test runner
- Verified against a live TLS 1.3 host

## API contract
No fields added, renamed or removed. Contract stays at 1.0.

## Limitations
The MVP visualizes the protocol sequence enriched with real negotiated
parameters. It does not capture raw TLS packets, and the UI says so.

## Needs a group decision
`certificate.subject` / `issuer` are objects in the contract and strings in the
code. Flagged in `docs/HANDSHAKE_VISUALIZER_HANDOFF.md`, not changed here.
```

## Suggested commits

```
feat: add canonical TLS 1.2 and 1.3 handshake step definitions
feat: build visualization block from real negotiated TLS data
test: cover visualization builder and protocol data
feat: add TLS handshake visualizer data model and helpers
feat: add handshake visualizer component with step controls
feat: render the visualizer from live analysis results
test: add vitest and visualizer interaction tests
```
