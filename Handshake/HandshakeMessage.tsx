import type { VisualStep } from "./handshakeTypes";

interface HandshakeMessageProps {
  step: VisualStep;
  position: number;
  state: "pending" | "active" | "done";
  expanded: boolean;
  onSelect: (position: number) => void;
}

/**
 * One message in the handshake sequence.
 *
 * Renders as a row spanning the client lane and the server lane, with the
 * arrow pointing in the direction the message actually travels.
 */
export default function HandshakeMessage({
  step,
  position,
  state,
  expanded,
  onSelect,
}: HandshakeMessageProps) {
  const toServer = step.sender === "client";

  return (
    <li
      className={`hv-row hv-row--${state}`}
      data-testid={`hv-row-${step.id}`}
      data-state={state}
      aria-current={state === "active" ? "step" : undefined}
    >
      <button
        type="button"
        className="hv-row__button"
        onClick={() => onSelect(position)}
        aria-expanded={expanded}
      >
        <span className="hv-row__number">{step.sequence}</span>

        <span
          className={`hv-row__track hv-row__track--${
            toServer ? "to-server" : "to-client"
          }`}
        >
          <span className="hv-row__name">
            {step.message}
            {step.conditional ? (
              <span className="hv-row__conditional" title="Not sent in every handshake">
                {" "}
                (conditional)
              </span>
            ) : null}
          </span>

          <span className="hv-row__arrow" aria-hidden="true" />

          <span className="hv-row__direction">
            {toServer ? "client to server" : "server to client"}
          </span>
        </span>
      </button>
    </li>
  );
}
