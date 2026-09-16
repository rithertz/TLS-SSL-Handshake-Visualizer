import { useEffect, useMemo, useState } from "react";

import HandshakeMessage from "./HandshakeMessage";
import { MODEL_NOTES } from "./handshakeData";
import type { VisualizationInfo } from "./handshakeTypes";
import {
  describeVersion,
  resolveSequence,
  toDisplayFields,
} from "./visualizerUtils";

import "./HandshakeVisualizer.css";

interface HandshakeVisualizerProps {
  /** The `visualization` block from POST /analyze. */
  visualization?: VisualizationInfo | null;
  /**
   * The `tls.version` value, used only when `visualization.protocol_version`
   * is missing.
   */
  tlsVersion?: string | null;
  /** Milliseconds each step is held while playing. */
  stepDurationMs?: number;
}

const DEFAULT_STEP_DURATION_MS = 1500;

/**
 * Interactive view of the TLS handshake sequence, enriched with the real
 * parameters the backend negotiated with the target server.
 *
 * This component makes no network requests. It renders whatever it is given.
 */
export default function HandshakeVisualizer({
  visualization,
  tlsVersion,
  stepDurationMs = DEFAULT_STEP_DURATION_MS,
}: HandshakeVisualizerProps) {
  // Memoised so the rendered sequence keeps a stable identity across
  // re-renders. Without this, the rewind effect below would fire on every
  // render and pin the visualizer to the first step.
  const sequence = useMemo(
    () => resolveSequence(visualization, tlsVersion),
    [visualization, tlsVersion],
  );

  const { steps, source, model, reportedVersion } = sequence;

  const [index, setIndex] = useState(0);
  const [wantsPlayback, setWantsPlayback] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [renderedSequence, setRenderedSequence] = useState(sequence);

  // A new analysis arrives: rewind rather than leaving the old position.
  // Adjusting state during render is React's documented alternative to an
  // effect here, and it avoids a wasted render pass showing stale steps.
  if (renderedSequence !== sequence) {
    setRenderedSequence(sequence);
    setIndex(0);
    setWantsPlayback(false);
    setOpenIndex(null);
  }

  const lastIndex = steps.length - 1;
  const atEnd = index >= lastIndex;

  // Playback ends by itself at the last step, so there is no need to write
  // state from inside the effect below.
  const isPlaying = wantsPlayback && !atEnd;

  // One timeout per step, so there is never more than one timer alive.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIndex((current) => current + 1);
    }, stepDurationMs);

    return () => window.clearTimeout(timer);
  }, [isPlaying, index, stepDurationMs]);

  if (steps.length === 0) {
    return (
      <section className="hv" aria-label="TLS handshake">
        <p className="hv__empty">
          No handshake to show. Analyze an HTTPS site to see its TLS exchange.
        </p>
      </section>
    );
  }

  function handlePlayPause() {
    if (isPlaying) {
      setWantsPlayback(false);
      return;
    }

    if (atEnd) {
      setIndex(0);
    }

    setWantsPlayback(true);
  }

  function handleNext() {
    setWantsPlayback(false);
    setIndex((current) => Math.min(current + 1, lastIndex));
  }

  function handlePrevious() {
    setWantsPlayback(false);
    setIndex((current) => Math.max(current - 1, 0));
  }

  function handleReset() {
    setWantsPlayback(false);
    setIndex(0);
    setOpenIndex(null);
  }

  function handleSelect(position: number) {
    setWantsPlayback(false);
    setIndex(position);
    setOpenIndex((current) => (current === position ? null : position));
  }

  const current = steps[index];
  const fields = toDisplayFields(current.actual_data);
  const modelLabel = model === "TLS1.3" ? "TLS 1.3" : "TLS 1.2";

  return (
    <section className="hv" aria-label="TLS handshake">
      <header className="hv__header">
        <div>
          <h3 className="hv__title">{describeVersion(reportedVersion)}</h3>
          <p className="hv__note">{MODEL_NOTES[model]}</p>
        </div>

        <p className="hv__progress" aria-live="polite">
          Message {index + 1} of {steps.length}
        </p>
      </header>

      <div className="hv__lanes" aria-hidden="true">
        <span className="hv__lane-label">Client</span>
        <span className="hv__lane-label hv__lane-label--right">Server</span>
      </div>

      <ol className="hv__list">
        {steps.map((step, position) => (
          <HandshakeMessage
            key={step.id}
            step={step}
            position={position}
            state={
              position === index
                ? "active"
                : position < index
                  ? "done"
                  : "pending"
            }
            expanded={openIndex === position}
            onSelect={handleSelect}
          />
        ))}
      </ol>

      <div className="hv__controls">
        <button type="button" onClick={handlePrevious} disabled={index === 0}>
          Previous
        </button>

        <button
          type="button"
          className="hv__controls-primary"
          onClick={handlePlayPause}
        >
          {isPlaying ? "Pause" : atEnd ? "Replay" : "Play"}
        </button>

        <button type="button" onClick={handleNext} disabled={atEnd}>
          Next
        </button>

        <button type="button" onClick={handleReset} disabled={index === 0}>
          Reset
        </button>
      </div>

      <article className="hv__detail">
        <h4 className="hv__detail-title">{current.title}</h4>
        <p className="hv__detail-body">{current.description}</p>
        <p className="hv__detail-why">
          <span className="hv__detail-why-lead">Why it is sent: </span>
          {current.purpose}
        </p>

        {fields.length > 0 ? (
          <dl className="hv__fields">
            {fields.map((field) => (
              <div className="hv__field" key={field.key}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="hv__fields-empty">
            No measured values for this message. The analyzer reads the
            connection through the TLS library, so only the negotiated
            parameters and the certificate are directly observed.
          </p>
        )}
      </article>

      <footer className="hv__footnote">
        {source === "backend"
          ? "Sequence and values supplied by the analyzer for this connection."
          : "Showing the built-in " +
            modelLabel +
            " model. The analyzer did not return a sequence for this result."}{" "}
        This is a representative protocol flow enriched with real negotiated
        data, not a packet capture.
      </footer>
    </section>
  );
}
