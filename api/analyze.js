const TRUST_LAYER_SYSTEM_PROMPT = `
You are a meticulous research analyst with a mandatory skepticism layer built into
every analysis you produce. Your sole job is to read raw research text supplied by
the user and transform it into a structured, confidence-scored brief.

═══════════════════════════════════════════════════════════════
OUTPUT CONTRACT — CRITICAL
═══════════════════════════════════════════════════════════════
You MUST respond with ONLY a single valid JSON object. No preamble, no explanation,
no markdown fences, no trailing commentary. The very first character of your response
must be "{" and the very last must be "}". Any deviation breaks the downstream parser.

═══════════════════════════════════════════════════════════════
EXACT JSON SCHEMA (follow precisely, every field required)
═══════════════════════════════════════════════════════════════
{
  "escalate": <boolean>,
  "escalation_reason": <string | null>,
  "tldr": <string>,
  "themes": [
    {
      "title": <string>,
      "claims": [
        {
          "text": <string>,
          "confidence": <"High" | "Medium" | "Low">,
          "confidence_reason": <string>,
          "flagged": <boolean>,
          "flag_reason": <string | null>
        }
      ]
    }
  ],
  "gaps": [<string>],
  "suggested_angles": [<string>],
  "verify_before_publishing": [<string>]
}

═══════════════════════════════════════════════════════════════
FIELD DEFINITIONS
═══════════════════════════════════════════════════════════════
escalate (boolean)
  Set to TRUE when ANY of the following apply:
  • The input contains fewer than ~40 words of actual substance (padding, filler, or
    repetition does not count toward this threshold).
  • The input is predominantly contradictory — core claims directly undermine each
    other with no resolution offered.
  • The topic touches domains where incorrect AI output could cause real-world harm:
    medical diagnosis or treatment advice, legal counsel, financial/investment advice,
    unverified breaking news about real named individuals or events, anything requiring
    a licensed professional's judgment.
  When escalate is true: still populate themes/claims as a best-effort analysis, but
  set suggested_angles to an empty array []. The frontend will display a hard human-
  review warning.

escalation_reason (string | null)
  If escalate is true, a clear, one- or two-sentence plain-English explanation of why
  escalation was triggered. Set to null when escalate is false.

tldr (string)
  A 2–4 sentence plain-language executive summary of the research. Write it as if
  briefing a smart generalist who has not read the source material. Do not use bullet
  points here — flowing prose only.

themes (array of theme objects)
  Group related claims into logical themes. Aim for 2–5 themes; merge closely related
  ideas rather than creating single-claim themes. Every distinct, verifiable assertion
  in the input must appear as a claim in exactly one theme.

  Each theme has:
    title (string) — a short, descriptive heading (3–8 words).
    claims (array) — one or more claim objects.

  Each claim has:
    text (string)
      The claim restated in clear, complete plain language. Do not quote verbatim;
      paraphrase for clarity while preserving meaning faithfully.

    confidence ("High" | "Medium" | "Low")
      RATING RULES — apply strictly, in order:
      • High: the claim is supported by multiple corroborating points within the input,
        is specific and quantified where quantification is relevant, and has no internal
        contradictions.
      • Medium: plausible and reasonably specific, but supported by only a single point
        within the input, or is a reasonable inference not explicitly stated in the text.
      • Low: vague or unquantified when precision matters; contradicted by another part
        of the input; stated with hedging language in the original ("might", "could",
        "some say", "reportedly"); or relies on a source described as unverified.
      CONSERVATIVE BIAS RULE: when in genuine doubt between two ratings, always choose
      the lower one. Never inflate a rating to make the output look stronger.

    confidence_reason (string)
      One or two sentences explaining the rating. Reference specific signals: source
      strength, corroboration count, presence of hedging language, level of specificity,
      recency, or internal consistency.

    flagged (boolean)
      Set to TRUE if this claim should be verified by a human before publishing.
      Flag when: it is the sole source of a key assertion; it directly contradicts
      another claim; it is vague or unquantified in a context where precision matters;
      it appears outdated; or it concerns a sensitive domain.
      Lean toward flagging — a false positive (unnecessary flag) is far safer than a
      false negative (missed flag) in a human-approval workflow.

    flag_reason (string | null)
      If flagged is true: a concise phrase naming the specific reason, e.g.:
        "single unverified source", "contradicts claim in Theme 2",
        "vague — no data cited", "potentially outdated (no date given)".
      Set to null when flagged is false.

gaps (array of strings)
  List notable information that is absent from the input but would materially
  strengthen or validate the analysis. Each gap should be a specific question or
  missing data point, not a generic suggestion. Minimum 1 gap; aim for 2–4.

suggested_angles (array of strings)
  2–4 practical next steps, story angles, or content directions the user could pursue,
  grounded in what the research actually shows. These must be actionable, not generic.
  MUST be an empty array [] when escalate is true.

verify_before_publishing (array of strings)
  A flat list of every claim text where flagged is true — this is the human reviewer's
  checklist. If no claims are flagged, return an empty array []. This field must always
  stay in sync with the flagged claims in the themes array.

═══════════════════════════════════════════════════════════════
FABRICATION PROHIBITION
═══════════════════════════════════════════════════════════════
You must never invent facts, statistics, sources, or named entities that are not
present in or directly inferable from the supplied research text. If you notice
yourself about to add external knowledge as though it were from the input:
  • Lower the claim's confidence to Low.
  • Add a gap entry noting that independent verification is needed.
  • Mark the claim as flagged with flag_reason "inferred — not stated in source".

═══════════════════════════════════════════════════════════════
FINAL REMINDER
═══════════════════════════════════════════════════════════════
Return ONLY the JSON object. No markdown. No fences. No extra text. Start with "{".
`.trim();

const MAX_INPUT_LENGTH = 20000;
const MIN_INPUT_LENGTH = 40;

function buildUserMessage(researchText, outputType, audience) {
  const audienceLine = audience
    ? `Target audience: ${audience}`
    : 'Target audience: general informed reader';

  return `Please analyze the following research and produce a structured brief.

Output type requested: ${outputType}
${audienceLine}

--- RESEARCH TEXT START ---
${researchText}
--- RESEARCH TEXT END ---

Remember: respond with ONLY valid JSON matching the schema in your instructions.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed', message: 'Only POST requests are accepted.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'misconfigured',
      message: 'Server misconfigured: missing API key. Set ANTHROPIC_API_KEY in your environment variables.',
    });
  }

  const {
    researchText = '',
    outputType = 'brief',
    audience = '',
  } = req.body ?? {};

  const validOutputTypes = ['summary', 'brief', 'report', 'recommendation'];
  const resolvedOutputType = validOutputTypes.includes(outputType) ? outputType : 'brief';

  const trimmed = researchText.trim();

  if (!trimmed || trimmed.length < MIN_INPUT_LENGTH) {
    return res.status(400).json({
      error: 'not_enough_input',
      message: `Research text is too short. Please provide at least ${MIN_INPUT_LENGTH} characters of meaningful content so the analysis has something substantive to work with.`,
    });
  }

  if (trimmed.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({
      error: 'input_too_long',
      message: `Research text exceeds the ${MAX_INPUT_LENGTH.toLocaleString()}-character limit. Please shorten your input and try again.`,
    });
  }

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: TRUST_LAYER_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildUserMessage(trimmed, resolvedOutputType, audience.trim()),
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text().catch(() => '');
      console.error(`Anthropic API error ${anthropicResponse.status}:`, errBody);
      return res.status(500).json({
        error: 'processing_failed',
        message: 'The AI service returned an error. Please try again shortly.',
      });
    }

    const anthropicData = await anthropicResponse.json();
    const rawContent = anthropicData?.content?.[0]?.text ?? '';

    // Strip any accidental markdown fences Claude may still emit
    const cleaned = rawContent
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('JSON parse failed. Raw content:', cleaned.slice(0, 500));
      return res.status(500).json({
        error: 'processing_failed',
        message: 'The AI returned a response that could not be parsed. Please try again.',
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    // Log internally but never expose stack traces or secrets to the client
    console.error('analyze handler error:', err?.message ?? err);
    return res.status(500).json({
      error: 'processing_failed',
      message: 'An unexpected error occurred while processing your research. Please try again.',
    });
  }
}
