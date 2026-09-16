import type { HandshakeStep, VisualizationInfo } from "../types/analysis";

/**
 * The protocol models this visualizer knows how to render.
 */
export type ProtocolModel = "TLS1.2" | "TLS1.3";

/**
 * A handshake step as rendered by the visualizer.
 *
 * This extends the API contract's `HandshakeStep` with two fields that are
 * presentation-only and never sent over the wire, so the API contract stays
 * at version 1.0:
 *
 * - `conditional` marks messages that are not present in every handshake;
 * - `model` records which protocol model the step came from.
 */
export interface VisualStep extends HandshakeStep {
  conditional?: boolean;
  model?: ProtocolModel;
}

/**
 * Where the rendered sequence came from.
 *
 * `backend`  the server sent visualization.steps and we are rendering those
 * `local`    the server sent nothing usable, so the built-in model is shown
 */
export type StepSource = "backend" | "local";

export interface ResolvedSequence {
  steps: VisualStep[];
  source: StepSource;
  model: ProtocolModel;
  /** The raw version string the backend reported, if any. */
  reportedVersion: string | null;
}

export type { HandshakeStep, VisualizationInfo };
