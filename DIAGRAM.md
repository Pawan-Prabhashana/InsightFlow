# InsightFlow — Workflow Diagram

The flow below shows how raw research becomes an approved, exportable brief. The
🔒 markers highlight the **human-control checkpoints** where a person — not the AI —
decides what happens next.

```mermaid
flowchart TD
    A[User pastes research<br/>+ output type + audience] --> B{Server-side validation<br/>length &amp; min-substance}
    B -- "too short / too long" --> B1[Return guardrail error<br/>no AI call made]
    B1 --> A
    B -- "valid" --> C[Trust Layer Analysis<br/>Claude + engineered system prompt]

    C --> D{escalate == true?}

    D -- "Yes<br/>thin / contradictory / sensitive domain" --> E[🔒 Human Review Required<br/>locked state, no approval flow<br/>routes to a human researcher]

    D -- "No" --> F[Structured Brief<br/>TL;DR, themes &amp; claims<br/>with High / Medium / Low<br/>confidence ratings]
    F --> G[Weak claims flagged +<br/>gaps detected +<br/>Verify-before-publishing list]

    G --> H[🔒 Human Approval Gate<br/>status: DRAFT — NOT APPROVED]
    H --> I{All flagged claims<br/>checked by human?}
    I -- "No — some unchecked" --> H
    I -- "Yes — human ticks each one" --> J[🔒 Human clicks Approve<br/>status: APPROVED BY HUMAN + timestamp]

    J --> K[Export / Copy brief<br/>plain-text, approval-stamped]

    classDef human fill:#EEF2FF,stroke:#4F46E5,stroke-width:2px,color:#0F172A;
    classDef stop fill:#FEE2E2,stroke:#DC2626,stroke-width:2px,color:#0F172A;
    classDef ai fill:#DCFCE7,stroke:#16A34A,stroke-width:1.5px,color:#0F172A;

    class E stop;
    class H,I,J human;
    class C ai;
```

**Human-control checkpoints (🔒):**

1. **Human Review Required** — when the AI escalates, it refuses to produce an approvable brief and hands the input to a person.
2. **Human Approval Gate** — every brief starts as an unapproved draft; the AI cannot self-approve.
3. **Approve** — the brief becomes usable/exportable only after a human has verified each flagged claim and explicitly approved it.
