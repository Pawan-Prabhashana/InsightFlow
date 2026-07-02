# InsightFlow

**Turn messy research into trustworthy, confidence-scored briefs — with a human approval gate before anything is publish-ready.**

Live demo: _[add your Vercel URL here after deploying]_

---

## The problem

**Option 3 — AI Research-to-Output Agent.**

People who produce content — analysts, marketers, journalists, founders, students — constantly turn a pile of messy inputs (pasted notes, article excerpts, quotes, link dumps) into something structured and shareable. Generic AI tools do this fast, but they present every output with the same confident tone, whether a claim is rock-solid or completely made up. That confidence is the danger: it makes hallucinations and weak sourcing easy to publish by accident.

The user is anyone who has to **stand behind** what they publish and cannot afford to ship an unverified claim.

## What InsightFlow does

InsightFlow takes raw research and produces a structured brief — but its real differentiator is the **Trust Layer**, which treats skepticism as a first-class feature:

- **Confidence rating on every claim** — each extracted claim is rated **High / Medium / Low**, with a plain-language reason (source strength, corroboration, specificity, hedging language).
- **Flagged weak claims** — claims that are single-sourced, vague, contradictory, or unverifiable are flagged with a specific reason and collected into a "Verify before publishing" checklist.
- **Gap detection** — the analysis surfaces what's *missing* from the input, not just what's present.
- **Escalation** — if the input is too thin, self-contradictory, or touches a sensitive domain (medical, legal, financial advice, unverified breaking news), InsightFlow **refuses to produce an approvable brief** and routes it to a human instead.
- **Human approval gate** — a brief starts as **DRAFT — NOT APPROVED**. The user must tick off every flagged claim before the **Approve** button unlocks. Only then can the brief be exported. This is the core "human control" guarantee: nothing is marked publish-ready without explicit human sign-off.

## Tech stack

- **Frontend:** vanilla HTML, CSS, and JavaScript (ES modules). No frameworks, no build step.
- **Backend:** a single Vercel serverless function (`api/analyze.js`, Node.js runtime).
- **AI:** Anthropic Claude (`claude-sonnet-4-5`) via the Messages API, driven by an engineered "Trust Layer" system prompt that forces conservative, schema-locked JSON output.
- **Hosting:** Vercel (static frontend + serverless API).
- **Zero runtime dependencies** — no npm packages are required to run the app.

## How to run locally

**Prerequisites:** Node.js installed, and an Anthropic API key.

1. Clone the repo and enter it:
   ```bash
   git clone https://github.com/Pawan-Prabhashana/InsightFlow.git
   cd InsightFlow
   ```

2. Create a `.env.local` file with your Anthropic key (this file is git-ignored and never committed):
   ```bash
   echo 'ANTHROPIC_API_KEY=sk-ant-your-real-key-here' > .env.local
   ```
   See `.env.example` for the expected variable name.

3. Start the Vercel dev server (this runs the static site **and** the serverless function together):
   ```bash
   set -a; . ./.env.local; set +a
   npx vercel dev --listen 3000
   ```
   Exporting the key into the shell before launching guarantees the function receives it regardless of dotenv-loading differences between CLI versions.

4. Open **http://localhost:3000**.

> **No key? No problem.** Click any **⚡ Instant demo** button in the left panel to see three fully-interactive, pre-analyzed results (approval gate and export included) with **zero setup and no API call**.

## Known limitations & what I'd improve with more time

- **No live URL fetching** — the user pastes text; InsightFlow doesn't crawl links itself. I'd add server-side fetching + readability extraction so a user can drop in URLs directly.
- **Single-model, single-pass** — claims are judged only against the pasted input. I'd add multi-source cross-checking (retrieval) so confidence reflects the wider record, not just internal consistency.
- **No PII / confidentiality scrubbing** — research is sent as-is to a third-party model. I'd add client-side redaction and a clear data-handling notice before send.
- **Approval isn't audited** — approvals are in-memory for the session. I'd persist who approved what and when, and track human overrides of AI confidence to calibrate the model over time.
- **Escalation is model-judged** — the sensitive-domain check lives in the prompt. I'd add a deterministic keyword/classifier backstop so escalation can't be prompt-injected away.
