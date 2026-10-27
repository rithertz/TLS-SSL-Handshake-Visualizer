import React from "react";
import type {
  SecurityResult,
  SecurityFinding,
  CertificateInfo,
} from "../types/analysis";
import { formatDate } from "../utils/formatters";

/**
 * In-depth "Why this score?" explanation.
 *
 * The backend owns score calculation. This component never changes the score
 * or grade it is given; it only *explains* them by reading the findings the
 * backend returned and mapping each one to the documented penalty
 * (docs/scoring/SECURITY_SCORING.md). A reconciliation row at the end shows
 * whether the explained total agrees with the backend's number.
 */

interface ScoreExplanationProps {
  security: SecurityResult | null;
  certificate: CertificateInfo | null;
}

/* ------------------------------------------------------------------ */
/* Static knowledge about the six rules (from the scoring specification) */
/* ------------------------------------------------------------------ */

interface Outcome {
  label: string;
  status: "PASS" | "WARN" | "FAIL";
  severity: string;
  penalty: number;
}

interface RuleMeta {
  id: string;
  name: string;
  checks: string;
  whyItMatters: string;
  outcomes: Outcome[];
}

const RULE_ORDER: RuleMeta[] = [
  {
    id: "TLS_VERSION",
    name: "TLS Protocol Version",
    checks:
      "The TLS protocol version that the server actually negotiated during the handshake.",
    whyItMatters:
      "The protocol version decides which cryptographic building blocks protect the connection. TLS 1.3 removed legacy algorithms and shortened the handshake, so it is the strongest result. TLS 1.2 is still widely used and acceptable, but it earns a small deduction. Anything older (or an unknown version) is treated as insecure.",
    outcomes: [
      { label: "TLSv1.3", status: "PASS", severity: "INFO", penalty: 0 },
      { label: "TLSv1.2", status: "WARN", severity: "LOW", penalty: 10 },
      {
        label: "Older, obsolete or unavailable",
        status: "FAIL",
        severity: "HIGH",
        penalty: 30,
      },
    ],
  },
  {
    id: "CERT_EXPIRY",
    name: "Certificate Validity Interval",
    checks:
      "Whether the certificate's valid-from and valid-until timestamps exist, can be parsed, and the current time falls between them.",
    whyItMatters:
      "A certificate outside its validity window is rejected by browsers. An expired or not-yet-valid certificate means the server's identity can no longer be vouched for by the issuing authority, so this is a heavy deduction.",
    outcomes: [
      {
        label: "valid_from ≤ now ≤ valid_until",
        status: "PASS",
        severity: "INFO",
        penalty: 0,
      },
      {
        label: "Expired, not yet valid, missing or unparsable",
        status: "FAIL",
        severity: "HIGH",
        penalty: 30,
      },
    ],
  },
  {
    id: "HOSTNAME_MATCH",
    name: "Certificate Hostname Match",
    checks:
      "Whether the hostname you asked for appears in the certificate's identity information (Subject Alternative Names).",
    whyItMatters:
      "Encryption is only useful if you are talking to the right party. A certificate issued for a different name does not authenticate the site you requested, so this carries the largest single penalty in the model.",
    outcomes: [
      { label: "Hostname matches", status: "PASS", severity: "INFO", penalty: 0 },
      {
        label: "Mismatch or could not be determined",
        status: "FAIL",
        severity: "CRITICAL",
        penalty: 35,
      },
    ],
  },
  {
    id: "EXPIRY_PROXIMITY",
    name: "Certificate Expiry Proximity",
    checks:
      "How many days remain before a currently valid certificate expires.",
    whyItMatters:
      "A certificate that is valid today but about to lapse is an operational risk: if it is not renewed in time the site will start failing. The closer the deadline, the larger the deduction. This rule only runs when the validity rule passed, so one expiry problem is never counted twice.",
    outcomes: [
      { label: "More than 30 days left", status: "PASS", severity: "INFO", penalty: 0 },
      { label: "8–30 days left", status: "WARN", severity: "LOW", penalty: 10 },
      { label: "0–7 days left", status: "WARN", severity: "MEDIUM", penalty: 15 },
    ],
  },
  {
    id: "SELF_SIGNED",
    name: "Self-Signed Certificate Indicator",
    checks:
      "Whether the certificate's subject and issuer are identical, which indicates the certificate vouches for itself.",
    whyItMatters:
      "A self-signed certificate is not vouched for by any certificate authority, so a browser has no independent reason to trust it. Note the limit of this check: 'not self-signed' only means subject and issuer differ. It does not prove a full trusted chain, revocation status or browser trust.",
    outcomes: [
      { label: "Not self-signed", status: "PASS", severity: "INFO", penalty: 0 },
      { label: "Self-signed", status: "WARN", severity: "HIGH", penalty: 25 },
      {
        label: "Could not be determined",
        status: "PASS",
        severity: "n/a",
        penalty: 0,
      },
    ],
  },
  {
    id: "CERT_IDENTITY",
    name: "Certificate Metadata Identity",
    checks: "Whether both the subject and the issuer fields are present.",
    whyItMatters:
      "This is an informational rule. It makes the explanation more complete by recording who the certificate was issued to and by, but it never changes the score.",
    outcomes: [
      {
        label: "Subject and issuer present",
        status: "PASS",
        severity: "INFO",
        penalty: 0,
      },
      { label: "Either missing", status: "PASS", severity: "n/a", penalty: 0 },
    ],
  },
];

const GRADE_BANDS: { grade: string; min: number; max: number }[] = [
  { grade: "A", min: 90, max: 100 },
  { grade: "B", min: 80, max: 89 },
  { grade: "C", min: 70, max: 79 },
  { grade: "D", min: 60, max: 69 },
  { grade: "E", min: 50, max: 59 },
  { grade: "F", min: 0, max: 49 },
];

const NOT_MEASURED: string[] = [
  "Application vulnerabilities (SQL injection, XSS, authentication flaws)",
  "Server software vulnerabilities",
  "HTTP security headers and HSTS",
  "Full certificate-chain quality and browser trust decisions",
  "Revocation status and Certificate Transparency",
  "Cipher-suite strength and TLS extension details",
  "Packet-level network behaviour",
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Documented penalty for a finding. Unknown rules map to 0. */
function penaltyFor(finding: SecurityFinding): number {
  const sev = finding.severity?.toUpperCase();
  switch (finding.rule_id) {
    case "TLS_VERSION":
      if (finding.status === "WARN") return 10;
      if (finding.status === "FAIL") return 30;
      return 0;
    case "CERT_EXPIRY":
      return finding.status === "FAIL" ? 30 : 0;
    case "HOSTNAME_MATCH":
      return finding.status === "FAIL" ? 35 : 0;
    case "EXPIRY_PROXIMITY":
      if (finding.status === "WARN") return sev === "MEDIUM" ? 15 : 10;
      return 0;
    case "SELF_SIGNED":
      return finding.status === "WARN" ? 25 : 0;
    default:
      return 0;
  }
}

function evidenceText(ev: SecurityFinding["evidence"]): string {
  if (ev === null || ev === undefined) return "No evidence recorded";
  return Array.isArray(ev) ? ev.join(", ") : ev;
}

function statusClass(status: string): string {
  switch (status) {
    case "PASS":
      return "badge-success";
    case "WARN":
      return "badge-warn";
    case "FAIL":
      return "badge-fail";
    default:
      return "badge-neutral";
  }
}

/** Plain-language reason the rule ended up with the result it did. */
function reasonFor(finding: SecurityFinding, penalty: number): string {
  const ev = evidenceText(finding.evidence);
  switch (finding.rule_id) {
    case "TLS_VERSION":
      if (finding.status === "PASS")
        return `The server negotiated ${ev}, the most modern protocol version, so nothing was deducted.`;
      if (finding.status === "WARN")
        return `The server negotiated ${ev}. It is still acceptable, but TLS 1.3 is preferred, so ${penalty} points were deducted.`;
      return `The negotiated version (${ev}) is obsolete or could not be determined, so ${penalty} points were deducted.`;
    case "CERT_EXPIRY":
      if (finding.status === "PASS")
        return "The current time falls inside the certificate's validity window, so nothing was deducted.";
      return `The certificate is expired, not yet valid, or its dates were missing/unreadable (${ev}), so ${penalty} points were deducted.`;
    case "HOSTNAME_MATCH":
      if (finding.status === "PASS")
        return "The requested hostname is covered by the certificate, so the certificate does authenticate this site.";
      return `The certificate does not cover the requested hostname (${ev}), so it cannot authenticate this site. ${penalty} points were deducted, the largest single penalty.`;
    case "EXPIRY_PROXIMITY":
      if (finding.status === "PASS")
        return `${ev}: comfortably more than 30 days, so nothing was deducted.`;
      return `Only ${ev}. The closer the expiry date, the larger the deduction, so ${penalty} points were deducted.`;
    case "SELF_SIGNED":
      if (finding.status === "PASS")
        return "Subject and issuer differ, so the certificate does not appear to be self-signed. This does not by itself prove the chain is trusted.";
      return `Subject and issuer are identical, so no certificate authority vouches for it. ${penalty} points were deducted.`;
    case "CERT_IDENTITY":
      return "Subject and issuer are both present. This is informational and never changes the score.";
    default:
      return finding.explanation;
  }
}

/** Why a rule produced no finding at all. */
function skippedReason(
  ruleId: string,
  byRule: Map<string, SecurityFinding>,
  certificate: CertificateInfo | null,
): string {
  switch (ruleId) {
    case "EXPIRY_PROXIMITY": {
      const validity = byRule.get("CERT_EXPIRY");
      if (validity && validity.status !== "PASS")
        return "Skipped on purpose. The validity rule already failed, and the model never penalises the same expiry problem twice.";
      return "No finding was produced for this rule in this scan.";
    }
    case "SELF_SIGNED":
      if (certificate && certificate.self_signed === null)
        return "The backend could not determine whether the certificate is self-signed, so no finding was produced and no points were deducted.";
      return "No finding was produced for this rule in this scan, so no points were deducted.";
    case "CERT_IDENTITY":
      return "Subject or issuer metadata was missing, so no finding was produced and no points were deducted.";
    default:
      return "No finding was returned for this rule in this scan.";
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface LedgerRow {
  meta: RuleMeta;
  finding: SecurityFinding | null;
  penalty: number;
  before: number;
  after: number;
}

export const ScoreExplanation: React.FC<ScoreExplanationProps> = ({
  security,
  certificate,
}) => {
  if (!security) {
    return (
      <div className="dashboard-card score-explain" data-testid="score-explanation">
        <div className="card-header">
          <div className="card-header-left">
            <span className="card-icon">🧮</span>
            <div>
              <h2 className="card-title">How This Score Was Calculated</h2>
              <p className="card-subtitle">No scoring data was returned for this scan.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { score, grade, findings } = security;

  const byRule = new Map<string, SecurityFinding>();
  findings.forEach((f) => {
    if (!byRule.has(f.rule_id)) byRule.set(f.rule_id, f);
  });

  // Build the running ledger, starting from 100 and following the rule order.
  const ledger: LedgerRow[] = [];
  for (const meta of RULE_ORDER) {
    const finding = byRule.get(meta.id) ?? null;
    const penalty = finding ? penaltyFor(finding) : 0;
    const before = ledger.length > 0 ? ledger[ledger.length - 1].after : 100;
    ledger.push({ meta, finding, penalty, before, after: before - penalty });
  }

  const unknownFindings = findings.filter(
    (f) => !RULE_ORDER.some((r) => r.id === f.rule_id),
  );

  const totalPenalty = ledger.reduce((sum, r) => sum + r.penalty, 0);
  const explainedRaw = 100 - totalPenalty;
  const explainedScore = Math.max(0, Math.min(100, explainedRaw));
  const wasClamped = explainedRaw !== explainedScore;
  const reconciles = explainedScore === score && unknownFindings.length === 0;

  const penalised = ledger.filter((r) => r.penalty > 0);
  const passedCount = ledger.filter((r) => r.finding && r.penalty === 0).length;

  // Grade position. The grade itself always comes from the backend; the bands
  // below are only used to describe where the backend's grade sits.
  const gradeLetter = String(grade).toUpperCase();
  const band = GRADE_BANDS.find((b) => b.grade === gradeLetter) ?? null;
  const scoreInBand = band ? score >= band.min && score <= band.max : false;
  const bandIndex = band ? GRADE_BANDS.indexOf(band) : -1;
  const nextUp = bandIndex > 0 ? GRADE_BANDS[bandIndex - 1] : null;
  const pointsToNext = nextUp ? nextUp.min - score : 0;
  const bufferBelow = band ? score - band.min : 0;

  // What-if: points recovered by fixing each penalised rule. No grade is derived.
  const whatIf = penalised.map((r) => ({ row: r, gain: r.penalty }));

  return (
    <div className="dashboard-card score-explain" data-testid="score-explanation">
      <div className="card-header">
        <div className="card-header-left">
          <span className="card-icon">🧮</span>
          <div>
            <h2 className="card-title">How This Score Was Calculated</h2>
            <p className="card-subtitle">
              A rule-by-rule explanation of why this scan scored {score}/100 (grade{" "}
              {gradeLetter})
            </p>
          </div>
        </div>
        <span className="badge badge-neutral font-mono">Deterministic • Rule-based</span>
      </div>

      <div className="score-explain-body">
        {/* 1. Summary narrative */}
        <section className="se-section" aria-labelledby="se-summary-title">
          <h3 className="se-heading" id="se-summary-title">
            1. The short answer
          </h3>
          <p className="se-text" data-testid="se-summary">
            Every scan starts at <strong>100 points</strong>. Each security rule then
            inspects one property of the TLS connection or certificate and takes points
            away only when that property is weak.{" "}
            {penalised.length === 0 ? (
              <>
                No rule deducted anything for this scan, which explains a score of{" "}
                <strong>{explainedScore}/100</strong>.
              </>
            ) : (
              <>
                For this scan, <strong>{penalised.length}</strong>{" "}
                {penalised.length === 1 ? "rule" : "rules"} deducted a total of{" "}
                <strong>{totalPenalty} points</strong> ({penalised
                  .map((r) => `${r.meta.id} −${r.penalty}`)
                  .join(", ")}
                ), which explains a score of <strong>{explainedScore}/100</strong>.
              </>
            )}{" "}
            {passedCount > 0 && (
              <>
                {passedCount} {passedCount === 1 ? "rule" : "rules"} passed with no
                penalty.
              </>
            )}{" "}
            The backend reported <strong>{score}/100</strong> (grade{" "}
            <strong>{gradeLetter}</strong>).
          </p>

          <div className="se-equation font-mono" data-testid="se-equation">
            <span className="se-eq-term">100</span>
            {penalised.map((r) => (
              <React.Fragment key={r.meta.id}>
                <span className="se-eq-op">−</span>
                <span className="se-eq-term se-eq-penalty" title={r.meta.id}>
                  {r.penalty}
                </span>
              </React.Fragment>
            ))}
            <span className="se-eq-op">=</span>
            <span className={`se-eq-term se-eq-result ${reconciles ? "" : "se-eq-bad"}`}>
              {explainedScore}
            </span>
          </div>
          {!reconciles && (
            <p className="se-mismatch" role="alert" data-testid="se-mismatch">
              <strong>Mismatch:</strong> the deductions explained by the findings give{" "}
              {explainedScore}, but the backend reported {score}.{" "}
              {unknownFindings.length > 0
                ? `This scan includes findings this panel has no penalty mapping for (${unknownFindings
                    .map((f) => f.rule_id)
                    .join(", ")}). `
                : "The scoring rules may have changed since this panel was written. "}
              The backend score and grade are authoritative.
            </p>
          )}
        </section>

        {/* 2. Score bar */}
        <section className="se-section" aria-labelledby="se-bar-title">
          <h3 className="se-heading" id="se-bar-title">
            2. Where the 100 points went
          </h3>
          <div
            className="se-bar"
            role="img"
            aria-label={`Of 100 points, ${explainedScore} were kept and ${totalPenalty} were deducted`}
          >
            <div
              className="se-bar-kept"
              style={{ width: `${explainedScore}%` }}
            >
              {explainedScore >= 8 && <span>{explainedScore} kept</span>}
            </div>
            {penalised.map((r) => (
              <div
                key={r.meta.id}
                className={`se-bar-lost se-bar-${r.finding?.status.toLowerCase()}`}
                style={{ width: `${r.penalty}%` }}
                title={`${r.meta.id}: −${r.penalty}`}
              >
                {r.penalty >= 10 && <span>−{r.penalty}</span>}
              </div>
            ))}
          </div>
          {penalised.length > 0 && (
            <ul className="se-legend">
              {penalised.map((r) => (
                <li key={r.meta.id}>
                  <span
                    className={`se-swatch se-swatch-${r.finding?.status.toLowerCase()}`}
                  />
                  <span className="font-mono">{r.meta.id}</span>
                  <span className="se-legend-pts">−{r.penalty}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 3. Rule-by-rule ledger */}
        <section className="se-section" aria-labelledby="se-ledger-title">
          <h3 className="se-heading" id="se-ledger-title">
            3. Rule-by-rule breakdown
          </h3>
          <p className="se-text-muted">
            Rules are applied in this order. Expand any rule to see what it checked, what
            was observed on this scan, and why it ended up with its result.
          </p>

          <div className="se-ledger">
            {ledger.map((row) => {
              const { meta, finding, penalty } = row;
              const status = finding?.status ?? null;
              return (
                <details
                  key={meta.id}
                  className={`se-rule ${
                    status ? `se-rule-${status.toLowerCase()}` : "se-rule-none"
                  }`}
                  open={penalty > 0}
                  data-testid={`se-rule-${meta.id}`}
                >
                  <summary className="se-rule-summary">
                    <div className="se-rule-title-group">
                      <span className="rule-id-tag font-mono">{meta.id}</span>
                      <span className="se-rule-name">{meta.name}</span>
                    </div>
                    <div className="se-rule-right">
                      {finding ? (
                        <>
                          <span className={`badge ${statusClass(finding.status)}`}>
                            {finding.status}
                          </span>
                          <span
                            className={`se-penalty font-mono ${
                              penalty > 0 ? "se-penalty-neg" : "se-penalty-zero"
                            }`}
                          >
                            {penalty > 0 ? `−${penalty}` : "±0"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="badge badge-neutral">NO FINDING</span>
                          <span className="se-penalty se-penalty-zero font-mono">±0</span>
                        </>
                      )}
                      <span className="se-running font-mono" title="Running score after this rule">
                        {row.after}
                      </span>
                    </div>
                  </summary>

                  <div className="se-rule-body">
                    <dl className="se-dl">
                      <dt>What this rule checks</dt>
                      <dd>{meta.checks}</dd>

                      <dt>What was observed</dt>
                      <dd>
                        {finding ? (
                          <span className="font-mono se-evidence">
                            {evidenceText(finding.evidence)}
                          </span>
                        ) : (
                          <span className="text-muted">Nothing recorded</span>
                        )}
                      </dd>

                      <dt>Why it scored this way</dt>
                      <dd>
                        {finding
                          ? reasonFor(finding, penalty)
                          : skippedReason(meta.id, byRule, certificate)}
                      </dd>

                      <dt>Effect on the score</dt>
                      <dd className="font-mono">
                        {row.before} {penalty > 0 ? `− ${penalty}` : "− 0"} = {row.after}
                        {finding && (
                          <span className="se-sev-note">
                            {" "}
                            (severity {finding.severity}, penalty {penalty})
                          </span>
                        )}
                      </dd>

                      <dt>Why this matters</dt>
                      <dd>{meta.whyItMatters}</dd>
                    </dl>

                    <div className="se-outcomes">
                      <span className="se-outcomes-title">
                        Every possible outcome for this rule
                      </span>
                      <table className="se-table">
                        <thead>
                          <tr>
                            <th>Condition</th>
                            <th>Status</th>
                            <th>Severity</th>
                            <th className="se-num">Penalty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meta.outcomes.map((o) => {
                            const isHit =
                              !!finding &&
                              finding.status === o.status &&
                              (o.severity === "n/a" ||
                                finding.severity?.toUpperCase() === o.severity) &&
                              o.penalty === penalty;
                            return (
                              <tr
                                key={o.label}
                                className={isHit ? "se-hit" : undefined}
                              >
                                <td>
                                  {o.label}
                                  {isHit && <span className="se-hit-tag">this scan</span>}
                                </td>
                                <td>{o.severity === "n/a" ? "no finding" : o.status}</td>
                                <td>{o.severity}</td>
                                <td className="se-num font-mono">
                                  {o.penalty > 0 ? `−${o.penalty}` : "0"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        {/* 4. Grade position */}
        <section className="se-section" aria-labelledby="se-grade-title">
          <h3 className="se-heading" id="se-grade-title">
            4. From score to grade
          </h3>
          <p className="se-text">
            The letter grade is returned by the backend, which derives it <em>after</em> all
            penalties from fixed score bands. This panel does not calculate a grade of its
            own. The backend reported <strong>{score}</strong> and grade{" "}
            <strong>{gradeLetter}</strong>
            {band && scoreInBand && (
              <>
                , and grade {gradeLetter} covers {band.min}–{band.max} in the scoring
                specification.
                {nextUp ? (
                  <>
                    {" "}
                    It needs{" "}
                    <strong>
                      {pointsToNext} more {pointsToNext === 1 ? "point" : "points"}
                    </strong>{" "}
                    to reach grade {nextUp.grade}.
                  </>
                ) : (
                  <> This is the highest grade available.</>
                )}
                {band.min > 0 && (
                  <>
                    {" "}
                    It would move to a lower grade after losing{" "}
                    <strong>
                      {bufferBelow + 1} more {bufferBelow + 1 === 1 ? "point" : "points"}
                    </strong>
                    .
                  </>
                )}
              </>
            )}
            {band && !scoreInBand && (
              <strong className="se-flag" data-testid="se-grade-mismatch">
                {" "}
                — but that score is outside the {band.min}–{band.max} band documented for
                grade {gradeLetter}. The backend grade is shown as-is; the specification
                or this panel may be out of date.
              </strong>
            )}
            {!band && (
              <strong className="se-flag" data-testid="se-grade-mismatch">
                {" "}
                — which is not a grade this panel recognises. The backend grade is shown
                as-is.
              </strong>
            )}
            .
          </p>

          <div className="se-grade-ladder" role="list">
            {GRADE_BANDS.map((b) => {
              const current = b.grade === gradeLetter;
              return (
                <div
                  key={b.grade}
                  role="listitem"
                  className={`se-grade-step ${current ? "se-grade-current" : ""}`}
                  aria-current={current ? "true" : undefined}
                >
                  <span className="se-grade-letter">{b.grade}</span>
                  <span className="se-grade-range font-mono">
                    {b.min}–{b.max}
                  </span>
                  {current && <span className="se-grade-marker">◀ you are here</span>}
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. What-if */}
        <section className="se-section" aria-labelledby="se-whatif-title">
          <h3 className="se-heading" id="se-whatif-title">
            5. What would improve it
          </h3>
          {whatIf.length === 0 ? (
            <p className="se-text" data-testid="se-whatif-none">
              Nothing was deducted, so there is nothing to recover within this model. The
              score is already at the top of what these six rules can award.
            </p>
          ) : (
            <>
              <p className="se-text-muted">
                Each line shows how many points the rule took away, which is what fixing that
                one problem would give back. Fixing everything would recover{" "}
                <strong>{totalPenalty} points</strong>. These are illustrative only: a new
                scan is the only way to get a real score and grade.
              </p>
              <table className="se-table se-whatif" data-testid="se-whatif">
                <thead>
                  <tr>
                    <th>Fix this</th>
                    <th className="se-num">Points recovered</th>
                  </tr>
                </thead>
                <tbody>
                  {whatIf.map((w) => (
                    <tr key={w.row.meta.id}>
                      <td>
                        <span className="font-mono">{w.row.meta.id}</span> —{" "}
                        {w.row.meta.name}
                      </td>
                      <td className="se-num font-mono">+{w.gain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="se-text-muted">
                See the Actionable Recommendations card above for concrete steps.
              </p>
            </>
          )}
        </section>

        {/* 6. Reconciliation */}
        <section className="se-section" aria-labelledby="se-recon-title">
          <h3 className="se-heading" id="se-recon-title">
            6. Does the explanation add up?
          </h3>
          <div
            className={`se-recon ${reconciles ? "se-recon-ok" : "se-recon-warn"}`}
            data-testid="se-reconciliation"
          >
            <div className="se-recon-row font-mono">
              <span>Starting points</span>
              <span>100</span>
            </div>
            <div className="se-recon-row font-mono">
              <span>Total penalties explained above</span>
              <span>−{totalPenalty}</span>
            </div>
            {wasClamped && (
              <div className="se-recon-row font-mono">
                <span>Clamped into the 0–100 range</span>
                <span>{explainedRaw} → {explainedScore}</span>
              </div>
            )}
            <div className="se-recon-row se-recon-total font-mono">
              <span>Explained score</span>
              <span>{explainedScore}</span>
            </div>
            <div className="se-recon-row se-recon-total font-mono">
              <span>Score reported by backend</span>
              <span>{score}</span>
            </div>
          </div>
          <p className="se-text-muted">
            {reconciles
              ? "The explanation matches the backend score exactly. The backend remains the source of truth; this panel only explains its result and never recalculates it."
              : "The explained total does not match the backend score" +
                (unknownFindings.length > 0
                  ? ", because this scan contains findings from rules this panel has no penalty mapping for (" +
                    unknownFindings.map((f) => f.rule_id).join(", ") +
                    "). The backend score shown elsewhere on this page is the authoritative one."
                  : ". The backend score shown elsewhere on this page is the authoritative one.")}
          </p>
          {wasClamped && (
            <p className="se-text-muted">
              Penalties can add up to more than 100. The score is clamped so it never goes
              below 0 or above 100.
            </p>
          )}
        </section>

        {/* 7. Certificate context */}
        {certificate && (
          <section className="se-section" aria-labelledby="se-cert-title">
            <h3 className="se-heading" id="se-cert-title">
              7. The certificate facts behind the rules
            </h3>
            <div className="se-facts">
              <div className="se-fact">
                <span className="se-fact-label">Valid from</span>
                <span className="se-fact-value font-mono">
                  {formatDate(certificate.valid_from)}
                </span>
              </div>
              <div className="se-fact">
                <span className="se-fact-label">Valid until</span>
                <span className="se-fact-value font-mono">
                  {formatDate(certificate.valid_until)}
                </span>
              </div>
              <div className="se-fact">
                <span className="se-fact-label">Hostname match</span>
                <span className="se-fact-value font-mono">
                  {certificate.hostname_match === null
                    ? "Undetermined"
                    : certificate.hostname_match
                      ? "Yes"
                      : "No"}
                </span>
              </div>
              <div className="se-fact">
                <span className="se-fact-label">Self-signed</span>
                <span className="se-fact-value font-mono">
                  {certificate.self_signed === null
                    ? "Undetermined"
                    : certificate.self_signed
                      ? "Yes"
                      : "No"}
                </span>
              </div>
              <div className="se-fact se-fact-wide">
                <span className="se-fact-label">Subject</span>
                <span className="se-fact-value font-mono">
                  {certificate.subject ?? "Not available"}
                </span>
              </div>
              <div className="se-fact se-fact-wide">
                <span className="se-fact-label">Issuer</span>
                <span className="se-fact-value font-mono">
                  {certificate.issuer ?? "Not available"}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 8. Limits */}
        <section className="se-section" aria-labelledby="se-limits-title">
          <h3 className="se-heading" id="se-limits-title">
            {certificate ? "8" : "7"}. What this score does not tell you
          </h3>
          <p className="se-text">
            This is an educational, explainable score based only on the TLS and
            certificate properties this project inspects. It is{" "}
            <strong>not a professional security audit</strong> or a complete vulnerability
            scan, and a high grade does not prove a website is secure. It does not evaluate:
          </p>
          <ul className="se-list">
            {NOT_MEASURED.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="se-text-muted">
            Determinism: for identical inputs the scorer always returns the same score,
            grade, findings and recommendations. The only time-sensitive input is the
            comparison of certificate dates against the current time.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ScoreExplanation;
