# Sujay --- Individual Workload & AI Coding Guide

## TLS/SSL Handshake Visualizer & Website Security Analyzer

**Course:** Computer Networks --- BCSE308L\
**Member:** Sujay\
**Primary ownership:** Frontend Dashboard & Security Analysis
Presentation Layer\
**Secondary ownership:** Frontend State Management, API Result Rendering
& UI Quality\
**Review-1 target:** A polished, functional React dashboard that
consumes the real backend analysis response and clearly presents TLS,
certificate, security-score, findings, recommendations, and
handshake-visualizer entry points.

------------------------------------------------------------------------

# 1. Role Definition

The original project worksheet assigned you the **Frontend
UI/Dashboard** role.

That remains your primary responsibility, but the role is expanded into
a proper frontend engineering ownership area.

You own:

> **The user-facing dashboard that turns the backend's structured
> network/security analysis into a clear, usable, technically honest
> interface.**

Your frontend is not supposed to perform the network analysis itself.

The backend does:

``` text
DNS
TCP
TLS
Certificate parsing
Security scoring
```

Your frontend does:

``` text
Input
 ↓
Request
 ↓
Loading state
 ↓
Result presentation
 ↓
Interactive explanation
```

------------------------------------------------------------------------

# 2. Why This Role Matters

The project is an educational analyzer.

A technically correct backend is not enough if the user cannot
understand the result.

The frontend should let a user quickly answer:

``` text
What website did I analyze?
Did TLS work?
Which TLS version was negotiated?
Which cipher was used?
Who issued the certificate?
Is the certificate valid?
What is the security score?
Why did I get this score?
What should I improve?
How does the TLS handshake work?
```

The dashboard is therefore the project's main communication layer.

------------------------------------------------------------------------

# 3. Your Ownership Boundary

## You own

### Main UI

-   URL input;
-   Analyze action;
-   loading state;
-   result dashboard;
-   TLS information cards;
-   certificate information;
-   security score;
-   grade;
-   findings;
-   recommendations;
-   errors;
-   responsive layout.

### API consumption

-   frontend API client;
-   request creation;
-   response parsing;
-   loading/error/result state.

### Data presentation

-   mapping backend fields to UI;
-   handling missing/null values;
-   formatting dates;
-   formatting lists such as SANs;
-   displaying cipher/TLS information.

### UI quality

-   readable hierarchy;
-   consistent spacing;
-   accessible controls;
-   responsive behavior;
-   clear visual feedback.

------------------------------------------------------------------------

# 4. What You Do NOT Own

You are not responsible for implementing:

``` text
DNS resolution
TCP sockets
TLS negotiation
Certificate parsing
Security scoring rules
FastAPI internals
GitHub administration
Final project report
```

You also should not duplicate backend security logic in React.

For example, do not write:

``` text
if tlsVersion === "TLSv1.3":
    score += 25
```

inside the frontend.

The backend security engine owns the score.

The frontend only displays it.

------------------------------------------------------------------------

# 5. Recommended Frontend Structure

Use the shared React + TypeScript + Vite architecture.

A reasonable structure:

``` text
frontend/
└── src/
    ├── components/
    │   ├── UrlAnalyzer.tsx
    │   ├── AnalysisSummary.tsx
    │   ├── TlsDetails.tsx
    │   ├── CertificateDetails.tsx
    │   ├── SecurityScore.tsx
    │   ├── FindingsList.tsx
    │   ├── Recommendations.tsx
    │   └── ErrorMessage.tsx
    │
    ├── services/
    │   └── api.ts
    │
    ├── types/
    │   └── analysis.ts
    │
    ├── App.tsx
    └── main.tsx
```

Do not create dozens of components just to make the project look
complex.

Components should have meaningful responsibilities.

------------------------------------------------------------------------

# 6. Core User Flow

The primary flow must be:

``` text
┌─────────────────────────────┐
│ Enter HTTPS website URL     │
└──────────────┬──────────────┘
               ↓
        [ Analyze ]
               ↓
           Loading
               ↓
        Backend analysis
               ↓
      ┌────────┴─────────┐
      ↓                  ↓
   Success              Error
      ↓                  ↓
 Dashboard          Error message
```

On success:

``` text
Dashboard
├── Target
├── TLS
├── Certificate
├── Security Score
├── Findings
├── Recommendations
└── Handshake Visualizer
```

For now, since the backend part is not yet implemented, provide a hardcoded examples with fields and values and show them them on the dashboard named as examples.

------------------------------------------------------------------------

# 7. URL Input

The URL input should:

-   clearly indicate HTTPS is expected;
-   prevent obviously invalid submission;
-   trim accidental whitespace;
-   disable duplicate submission while loading;
-   show a useful validation message.

Example:

``` text
Website URL

[ https://example.com                         ]

                         [ Analyze ]
```

Do not rely only on frontend validation.

Backend validation remains authoritative.

------------------------------------------------------------------------

# 8. Loading State

Network analysis may take time.

Do not leave the user wondering whether the application is broken.

Show:

``` text
Analyzing example.com...

Resolving host...
Establishing secure connection...
Inspecting TLS configuration...
Reading certificate...
Calculating security score...
```

Only display stages that the backend can support honestly.

If the backend does not stream progress, these can be a simple frontend
loading presentation rather than claims of real-time progress.

Do not falsely imply that the frontend knows which backend operation is
currently executing.

A safe generic version is:

``` text
Analyzing website...
This may take a few seconds.
```

------------------------------------------------------------------------

# 9. Dashboard Layout

A useful hierarchy:

``` text
================================================
 TLS/SSL Handshake Visualizer & Security Analyzer
================================================

[ Website URL                         ] [Analyze]

Target
example.com

------------------------------------------------

Security Score                  TLS
      92                         TLS 1.3
      A                          Cipher: ...

------------------------------------------------

Certificate
Issuer: ...
Valid from: ...
Valid until: ...
SAN: ...

------------------------------------------------

Security Findings
✓ TLS configuration is strong
⚠ Certificate expires soon

------------------------------------------------

Recommendations
• Renew the certificate before expiration.

------------------------------------------------

[ Explore TLS Handshake ]
```

The exact visual design is yours to decide.

The information hierarchy is more important than decorative complexity.

------------------------------------------------------------------------

# 10. Security Score Card

The score should be visually prominent.

Example:

``` text
SECURITY SCORE

92 / 100
Grade A
```

But never display the number without context.

Also show:

``` text
Why this score?
```

or:

``` text
Security findings
```

The user should be able to understand the deductions.

------------------------------------------------------------------------

# 11. Do Not Recalculate the Score

The backend returns:

``` json
"security": {
  "score": 92,
  "grade": "A",
  "findings": []
}
```

The frontend displays it.

Do not recreate:

``` text
score = 100 - ...
```

in React.

Reason:

``` text
Backend scoring policy
        ↓
single source of truth
```

This avoids frontend/backend disagreement.

------------------------------------------------------------------------

# 12. TLS Information

Display important negotiated information:

``` text
TLS Version
TLS 1.3

Cipher Suite
...

Connection
HTTPS / 443
```

If the backend provides additional useful fields:

``` text
Negotiated protocol
Cipher
Resolved IP
```

they can be shown in an appropriate details section.

Avoid overwhelming the user with raw internal data.

------------------------------------------------------------------------

# 13. Certificate Section

Display:

``` text
Issuer
Subject
Valid From
Valid Until
SANs
Serial Number
```

Possible presentation:

``` text
Certificate

Issuer
Let's Encrypt

Valid
Jun 10, 2026 → Sep 8, 2026

Subject
example.com

Subject Alternative Names
example.com
www.example.com
```

Format dates consistently.

If a field is unavailable:

``` text
Not available
```

not:

``` text
undefined
null
[object Object]
```

------------------------------------------------------------------------

# 14. Certificate Expiry Presentation

If the backend provides an expiry warning:

``` text
Certificate expires soon
```

display it clearly.

Do not independently calculate a conflicting warning in the frontend.

The backend/security engine should be the source of security findings.

------------------------------------------------------------------------

# 15. Findings

Findings should answer:

``` text
What happened?
How serious is it?
Why does it matter?
```

Example:

``` text
⚠ Certificate expires soon

Severity: LOW

The certificate is approaching the end of its
validity period.

Evidence:
18 days remaining.
```

The exact wording should come from the backend finding model.

The frontend should format it rather than invent security claims.

------------------------------------------------------------------------

# 16. Recommendations

Display recommendations separately from findings.

Example:

``` text
Recommendations

1. Renew the certificate before expiration.
2. Prefer modern TLS configurations.
```

This gives the user a direct:

``` text
problem → action
```

relationship.

------------------------------------------------------------------------

# 17. Error UI

Errors are a first-class feature.

Possible categories:

``` text
Invalid URL
Unsupported scheme
DNS failure
Connection timeout
TLS failure
Certificate analysis failure
Unexpected server error
```

Example:

``` text
Unable to analyze this website.

The secure connection could not be established.

Please verify that:
• the URL is correct;
• the website supports HTTPS;
• the server is reachable.
```

Do not expose Python stack traces to the user.

------------------------------------------------------------------------

# 18. Empty State

Before the first analysis:

``` text
Analyze an HTTPS website

Enter a URL above to inspect its TLS configuration,
certificate, and security posture.
```

The page should look intentional rather than broken.

------------------------------------------------------------------------

# 19. Visualization Entry Point

Your dashboard should provide a clear path to Jayanth's handshake
visualizer.

For example:

``` text
TLS Handshake

TLS 1.3 negotiated

[ Explore Handshake ]
```

The visualizer should then receive the actual negotiated context.

Important:

``` text
Backend:
TLS 1.3

Dashboard:
TLS 1.3

Visualizer:
TLS 1.3 sequence
```

Do not hardcode the protocol version.

------------------------------------------------------------------------

# 20. API Client

Keep API calls outside UI components where practical.

Example conceptual structure:

``` text
components
     ↓
services/api.ts
     ↓
POST /analyze
     ↓
typed response
```

This keeps network code separate from presentation.

------------------------------------------------------------------------

# 21. TypeScript Types

Create explicit types for the backend response.

Conceptually:

``` ts
interface AnalysisResult {
  target: TargetInfo;
  network: NetworkInfo;
  tls: TlsInfo;
  certificate: CertificateInfo;
  security: SecurityResult;
  visualization: VisualizationInfo;
  error: string | null;
}
```

Exact fields must follow the shared API contract.

Do not invent fields just because they are convenient.

------------------------------------------------------------------------

# 22. State Model

A simple state machine is sufficient:

``` text
idle
 ↓
loading
 ↓
success
```

or:

``` text
idle
 ↓
loading
 ↓
error
```

A useful React state model:

``` text
status:
  "idle"
  "loading"
  "success"
  "error"
```

Avoid unnecessary state duplication.

For example, do not maintain:

``` text
result
tlsVersion
cipher
certificate
score
grade
```

as separate independently mutable states if they all originate from one
API response.

Prefer:

``` text
analysisResult
```

and derive display values from it.

------------------------------------------------------------------------

# 23. Responsive Design

The project should work at least on:

``` text
desktop
laptop
tablet-sized viewport
```

Use responsive CSS using TailwindCSS.

Avoid:

``` text
fixed-width dashboard
horizontal overflow
tiny text
buttons that disappear on smaller screens
```

------------------------------------------------------------------------

# 24. Accessibility Basics

Ensure:

``` text
[ ] labels associated with inputs
[ ] keyboard-accessible buttons
[ ] visible focus state
[ ] sufficient text contrast
[ ] meaningful headings
[ ] errors understandable without color alone
```

Do not rely only on:

``` text
red = bad
green = good
```

Use text such as:

``` text
FAIL
WARNING
PASS
```

as well.

------------------------------------------------------------------------

# 25. Visual Design Direction

Aim for:

``` text
technical
clean
modern
professional
educational
```

Avoid making it look like:

``` text
a generic banking dashboard
```

or:

``` text
a cybersecurity "hacker" landing page
```

No unnecessary:

``` text
matrix rain
skulls
fake terminal animations
random hexadecimal backgrounds
```

The visual language should support the networking/education theme.

------------------------------------------------------------------------

# 26. Recommended Color Semantics

You may choose the exact design system, but maintain consistent semantic
meaning:

``` text
Success → positive
Warning → caution
Danger → serious issue
Info → neutral information
```

Do not make the UI depend entirely on colors.

------------------------------------------------------------------------

# 27. Review-1 Timeline

## Day 0 --- Frontend foundation

Create:

``` text
React + TypeScript + Vite
```

Implement:

``` text
App shell
URL input
basic layout
```

Acceptance:

``` text
[ ] app starts
[ ] URL field works
[ ] Analyze button works
[ ] clean initial state
```

------------------------------------------------------------------------

## Day 1 --- API client

Implement:

``` text
services/api.ts
types/analysis.ts
```

Connect:

``` text
POST /analyze
```

At first, you may use a temporary mock response if the backend contract
is not yet available.

But clearly label it as mock data.

------------------------------------------------------------------------

## Day 2 --- Result dashboard

Implement:

``` text
Target
TLS
Certificate
```

Acceptance:

``` text
[ ] real response renders
[ ] missing fields handled
[ ] dates formatted
[ ] no hardcoded final results
```

------------------------------------------------------------------------

## Day 3 --- Security result UI

Integrate Shantanu's output:

``` text
score
grade
findings
severity
evidence
recommendations
```

Acceptance:

``` text
[ ] score displayed
[ ] grade displayed
[ ] findings displayed
[ ] severity displayed
[ ] recommendations displayed
```

------------------------------------------------------------------------

## Day 4 --- Loading + error states

Implement:

``` text
idle
loading
success
error
```

Test:

``` text
invalid URL
backend unavailable
timeout
malformed response
```

------------------------------------------------------------------------

## Day 5 --- Visualizer integration

Work with Jayanth.

Ensure:

``` text
dashboard
    ↓
Explore Handshake
    ↓
visualizer
```

receives the actual TLS context.

------------------------------------------------------------------------

## Day 6 --- UI polish

Focus on:

``` text
spacing
typography
responsive layout
accessibility
empty states
error presentation
```

Do not start a major redesign.

------------------------------------------------------------------------

## Day 7 --- Review stabilization

Freeze the visual design.

Test:

``` text
valid target
TLS 1.2 target if available
TLS 1.3 target
security warning
error case
visualizer
mobile/tablet viewport
```

------------------------------------------------------------------------

# 28. Frontend Testing

Use Vitest/React testing tools according to the shared project standard.

Test important behavior rather than every CSS/TailwindCSS rule.

## Input

``` text
[ ] empty input
[ ] valid HTTPS URL
[ ] malformed URL
```

## Loading

``` text
[ ] button disabled while loading
[ ] loading indicator shown
```

## Success

``` text
[ ] TLS version displayed
[ ] cipher displayed
[ ] certificate information displayed
[ ] score displayed
[ ] grade displayed
[ ] findings displayed
[ ] recommendations displayed
```

## Error

``` text
[ ] error message displayed
[ ] old result not accidentally shown as current
```

------------------------------------------------------------------------

# 29. Mock API Data

For frontend development before backend completion, create deterministic
fixtures such as:

``` text
mock-analysis-good.json
mock-analysis-warning.json
mock-analysis-error.json
```

Example scenarios:

``` text
GOOD
TLS 1.3
valid certificate
high score

WARNING
TLS 1.2
certificate approaching expiry
moderate score

ERROR
analysis failure
```

These are development/test fixtures.

Do not present them as live website analysis.

------------------------------------------------------------------------

# 30. Avoid Overengineering

For MVP, do not add:

``` text
Redux
complex state-management libraries
D3
large animation libraries
database
authentication
user accounts
theme engines
```

unless the team explicitly decides they are necessary.

React state + TypeScript + TailwindCSS is enough for the first review.

------------------------------------------------------------------------

# 31. AI Coding Rules

Your AI coding agent should always receive:

``` text
System Architecture
Technology Standard
API Contract
Your Workload
Relevant backend response examples
```

Rules:

1.  Do not implement backend logic.
2.  Do not recalculate security scores.
3.  Do not invent API fields.
4.  Do not hardcode live-analysis results.
5.  Keep components understandable.
6.  Prefer simple React state.
7.  Handle null/optional fields.
8.  Add tests for meaningful UI behavior.
9.  Keep styling maintainable.
10. Do not add dependencies without a reason.
11. Preserve the agreed API contract.
12. Report assumptions before changing shared interfaces.

------------------------------------------------------------------------


------------------------------------------------------------------------

# 39. Coordination With Other Members

## Rithwik

You need:

``` text
API endpoint
request schema
response schema
error format
```

If the backend changes:

``` text
Rithwik → informs
Sujay → updates frontend types/client
```

------------------------------------------------------------------------

## Shantanu

You need:

``` text
security.score
security.grade
security.findings
security.recommendations
```

Do not recreate his scoring logic.

------------------------------------------------------------------------

## Jayanth

You need:

``` text
visualizer component interface
TLS version/context input
navigation method
```

Coordinate the visualizer entry point.

------------------------------------------------------------------------

## Dheeraj

He will verify:

``` text
frontend startup
API integration
E2E flow
error paths
clean setup
```

If he reports a UI integration bug, reproduce it before fixing it.

------------------------------------------------------------------------

# 40. Demo Responsibility

You should be able to demonstrate:

``` text
1. Open dashboard
2. Enter HTTPS URL
3. Click Analyze
4. Show loading state
5. Show target
6. Show TLS version
7. Show cipher
8. Show certificate
9. Show score/grade
10. Explain findings
11. Show recommendation
12. Open handshake visualizer
```

Your explanation should emphasize:

> The frontend is a presentation layer. The security result is generated
> by the backend from the observed TLS/certificate data.

------------------------------------------------------------------------

# 41. Viva Questions

### Why React?

Because the project needs an interactive client-side interface with
reusable components and state management.

### Why TypeScript?

It gives compile-time type checking for the API response and reduces
frontend/backend data-contract mistakes.

### Why separate API code from components?

To separate network communication from UI presentation.

### Why not calculate the score in React?

The backend security engine is the single source of truth.

### What happens when a certificate field is missing?

The UI displays a safe fallback instead of crashing.

### Why have loading and error states?

Network analysis is asynchronous and can fail.

### Why use mock data?

To develop and test the frontend deterministically before the live
backend is complete.

### Are mock results presented as real?

No. They are explicitly development/test fixtures.

### How does the visualizer know whether to show TLS 1.2 or 1.3?

It receives the negotiated TLS context from the analysis result and
selects the corresponding protocol model.

------------------------------------------------------------------------

# 42. Definition of Done

Your frontend is complete when:

``` text
User
 ↓
enters HTTPS URL
 ↓
clicks Analyze
 ↓
loading state
 ↓
backend response
 ↓
dashboard renders:
    target
    TLS
    certificate
    score
    findings
    recommendations
 ↓
handshake visualizer accessible
```

and:

``` text
invalid input
backend failure
missing optional data
```

do not crash the application.

------------------------------------------------------------------------

# 43. Final Personal Checklist

## Core UI

``` text
[ ] URL input
[ ] Analyze button
[ ] Initial/empty state
[ ] Loading state
[ ] Error state
[ ] Result state
```

## Results

``` text
[ ] Target
[ ] TLS version
[ ] Cipher
[ ] Certificate
[ ] Security score
[ ] Grade
[ ] Findings
[ ] Recommendations
```

## Integration

``` text
[ ] Real API connected
[ ] Types match contract
[ ] No score recalculation
[ ] Visualizer connected
[ ] Null fields handled
```

## Quality

``` text
[ ] Responsive layout
[ ] Accessible input/buttons
[ ] Meaningful frontend tests
[ ] No hardcoded live results
[ ] No unnecessary dependencies
```

## Demo

``` text
[ ] Valid HTTPS analysis
[ ] Security score explanation
[ ] Certificate explanation
[ ] Handshake visualizer
[ ] Error scenario
```

------------------------------------------------------------------------

# 44. Your Contribution in One Sentence

> **Sujay owns the frontend experience that transforms the project's
> real TLS, certificate, and security-analysis output into a clear,
> interactive, educational dashboard.**

The goal is not to make the frontend enormous.

The goal is to make the project's technical work **understandable and
usable**.
