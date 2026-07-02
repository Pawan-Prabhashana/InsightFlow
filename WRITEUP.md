# InsightFlow — Written Explanation

## Problem chosen

Option 3: an AI Research-to-Output Agent. It converts messy research (pasted notes, article text, quotes, link lists) into a structured content brief. The twist I focused on is trust: generic AI presents every claim with equal confidence, which makes weak or hallucinated statements easy to publish by mistake.

## Who the user is

Anyone who has to stand behind what they publish — content marketers, analysts, journalists, founders, and students. They value speed but cannot afford to ship an unverified claim, so they need the tool to be honest about what it does and doesn't know.

## What I built

InsightFlow is a two-panel web app: paste research on the left, get a structured brief on the right. The differentiator is the **Trust Layer** — a confidence rating (High/Medium/Low) with a reason on every claim, automatic flagging of weak claims, gap detection, an escalation path for risky input, and a **human approval gate**: a brief stays "DRAFT — NOT APPROVED" until the user checks off every flagged claim, and only an approved brief can be exported.

## Tools used

Vanilla HTML/CSS/JavaScript (ES modules, no framework, no build step). One Vercel serverless function calls Anthropic's Claude (`claude-sonnet-4-5`) through the Messages API. The API key lives only in a Vercel environment variable, never in code. Hosted on Vercel.

## How the workflow works (step-by-step)

1. User pastes research, picks an output type (Summary/Brief/Report/Recommendation), and optionally names the audience.
2. The frontend POSTs to `/api/analyze`. The function validates input server-side (rejects anything under ~40 characters, caps length at 20,000) before spending a single token.
3. The function sends the text to Claude with an engineered "Trust Layer" system prompt that forces conservative reasoning and **schema-locked JSON only**.
4. Claude returns structured JSON: summary, themes, per-claim confidence + reasons, flags, gaps, suggested angles, and an escalation decision.
5. The frontend renders this as a brief with color-coded confidence badges and visibly flagged claims.
6. The human ticks off each flagged claim; the Approve button unlocks only when all are checked. Approval stamps a timestamp and enables plain-text export.

## Three sample inputs and outputs

These are the three baked-in **Instant demo** cases (no API key needed):

- **Market analysis (clean):** well-sourced SaaS competitive data. Output is mostly **High** confidence with **zero flagged claims**, so it's approvable almost immediately — plus concrete suggested angles. Shows the "happy path."
- **Remote-work debate (messy):** mixed-quality sources. Output is a genuine spread of High/Medium/Low with **five flagged claims carrying different reasons** — internal contradiction, single unverified source, undefined/vague term, narrow population, and unverified rationale. The user must resolve all five before approving.
- **Supplement claims (thin/risky):** short text making health claims from unnamed sources. Output sets **escalate: true** — no approval flow at all, just a hard "route this to a human" state with best-effort, de-emphasized findings.

## What could go wrong

- **Privacy:** pasting confidential research into a third-party model API is a real risk. Today the text is sent as-is; I'd add client-side redaction and a clear data-handling notice.
- **Hallucination / overconfidence:** the biggest AI risk here. The Trust Layer mitigates it by forcing a conservative bias (when in doubt, rate lower), demanding a reason for every rating, flagging anything single-sourced or vague, and — critically — never letting output be marked publish-ready without a human checking each flagged claim.
- **When AI shouldn't respond automatically:** the escalation logic explicitly catches thin input, contradictory input, and sensitive domains (medical, legal, financial advice, unverified breaking news). In those cases InsightFlow refuses to produce an approvable brief and routes to a human, rather than confidently guessing.

## How I would test and improve it

I'd add tests for the guardrails (length limits, JSON parsing, fence stripping) and schema validation on Claude's output. I'd log human overrides of AI confidence to calibrate the model, add multi-source cross-checking and live URL fetching, and add a deterministic classifier backstop so escalation can't be prompt-injected away.

## Which AI tools were used

Claude was used two ways. **Inside the product**, it is the reasoning engine performing the Trust Layer analysis. **During development**, Claude (via Cursor) was a build assistant that helped scaffold and refine the code and docs. All architecture and design decisions were reviewed and directed by me.
