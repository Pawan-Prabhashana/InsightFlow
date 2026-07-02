// InsightFlow – baked-in demo cases (Part 6)
//
// Three complete, hand-crafted results matching the exact JSON schema returned by
// api/analyze.js. These power "Instant demo" mode so evaluators can see fully
// interactive, correct results with NO API key and NO network call.
//
// Each object: { id, label, inputText, outputType, audience, result }
// `result` matches the Trust Layer schema exactly:
//   { escalate, escalation_reason, tldr, themes[], gaps[], suggested_angles[],
//     verify_before_publishing[] }

export const DEMO_CASES = [
  // ─────────────────────────────────────────────────────────────────────────
  // A) CLEAN — well-sourced, mostly High confidence, zero flagged claims
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'clean',
    label: 'Market analysis (clean)',
    outputType: 'brief',
    audience: 'Product marketing team drafting a competitive positioning post',
    inputText: `Q3 2024 competitive analysis — SaaS project management tools:
• Asana reported $652M in FY2024 revenue, up 19% year-over-year (Asana Q4 2024 earnings call, Oct 2024).
• Monday.com posted $900M in FY2024 revenue, growing 34% YoY, with 89% gross margins (Monday.com investor day, Nov 2024).
• ClickUp raised a $537M Series C at a $4B valuation and claims 10M users across 800,000+ teams (ClickUp press release, Sep 2024).
• A G2 buyer survey (n=1,200, September 2024) found that 67% of teams cite "ease of onboarding" as the primary switching trigger away from their current tool.
• All three platforms announced AI-native workflow automation in their H1 2025 roadmaps, targeting mid-market teams of 50–500 members.
• Across G2, Capterra, and TrustRadius, Gantt chart usability scores for Asana run 15–22% lower than Monday.com and ClickUp among teams of 50+ members.`,
    result: {
      escalate: false,
      escalation_reason: null,
      tldr: 'The SaaS project-management market is growing quickly, with Monday.com leading on both revenue scale ($900M) and growth rate (34% YoY) among the three tracked vendors. Onboarding ease is the single strongest driver of switching decisions, and every major vendor is racing to ship AI-native automation in H1 2025. Asana trails specifically on Gantt-chart usability for larger teams, a concrete and repeatedly corroborated weakness.',
      themes: [
        {
          title: 'Revenue scale and growth trajectory',
          claims: [
            {
              text: 'Monday.com leads the tracked set with $900M in FY2024 revenue at 34% year-over-year growth and 89% gross margins.',
              confidence: 'High',
              confidence_reason: 'Specific, quantified figures attributed to a dated primary source (Monday.com investor day, Nov 2024), with three independent metrics that are internally consistent.',
              flagged: false,
              flag_reason: null,
            },
            {
              text: 'Asana reported $652M in FY2024 revenue, growing 19% year-over-year.',
              confidence: 'High',
              confidence_reason: 'Attributed to a dated primary source (Asana Q4 2024 earnings call) with a specific figure and growth rate.',
              flagged: false,
              flag_reason: null,
            },
            {
              text: 'ClickUp raised a $537M Series C at a $4B valuation and reports 10M users across 800,000+ teams.',
              confidence: 'High',
              confidence_reason: 'Specific funding, valuation, and usage figures tied to a dated company press release; figures are consistent with the funding stage.',
              flagged: false,
              flag_reason: null,
            },
          ],
        },
        {
          title: 'What drives buyers to switch',
          claims: [
            {
              text: 'Ease of onboarding is the primary switching trigger for 67% of teams evaluating a new tool.',
              confidence: 'High',
              confidence_reason: 'Backed by a named survey with a stated sample size (G2, n=1,200) and a specific, quantified result.',
              flagged: false,
              flag_reason: null,
            },
          ],
        },
        {
          title: 'Product roadmap convergence on AI',
          claims: [
            {
              text: 'All three vendors have announced AI-native workflow automation on their H1 2025 roadmaps, targeting mid-market teams of 50–500 members.',
              confidence: 'High',
              confidence_reason: 'Consistent, specific roadmap claim with a defined timeframe and target segment; corroborated across all three vendors in the input.',
              flagged: false,
              flag_reason: null,
            },
          ],
        },
        {
          title: 'Asana’s Gantt usability gap',
          claims: [
            {
              text: 'Asana’s Gantt-chart usability scores run 15–22% lower than Monday.com and ClickUp for teams of 50+ members.',
              confidence: 'High',
              confidence_reason: 'Quantified range corroborated across three independent review platforms (G2, Capterra, TrustRadius) with a defined team-size segment.',
              flagged: false,
              flag_reason: null,
            },
          ],
        },
      ],
      gaps: [
        'Net revenue retention and churn rates are not provided, so relative growth quality cannot be assessed.',
        'Pricing per seat and discounting behavior are absent, which matters for the mid-market segment all three target.',
        'The G2 onboarding survey’s respondent mix (company size, industry) is not described, limiting how far the 67% figure generalizes.',
      ],
      suggested_angles: [
        'Position a comparison post around "time-to-first-value / onboarding speed" — the data shows it is the decisive buying factor.',
        'Build a segment-specific angle for teams of 50+ where Asana’s Gantt weakness is a concrete, sourced differentiator.',
        'Frame an H1 2025 "AI automation shootout" preview since all three vendors are shipping into the same window.',
      ],
      verify_before_publishing: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // B) MESSY — spread of High/Medium/Low, several flagged claims, varied reasons
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'messy',
    label: 'Remote work debate (messy)',
    outputType: 'brief',
    audience: 'HR leadership deciding a 2025 return-to-office policy',
    inputText: `Remote work productivity — research roundup (sources vary, quality mixed):
• Stanford study (2023, n=500 call-center workers) showed a 13% productivity increase for remote employees vs. in-office counterparts.
• Microsoft's 2024 Work Trend Index reports collaboration quality drops "significantly" for fully remote teams — "significantly" is not defined anywhere in the report.
• Some analysts say remote work is just as productive as in-office; others say engagement is measurably worse. The evidence is openly contradictory.
• Amazon, JPMorgan, and Goldman Sachs all mandated full return-to-office in 2024, citing culture and mentorship — no internal productivity data was disclosed publicly.
• Burnout rates among remote workers are "rising sharply" per a 2024 wellness blog post (no methodology, no sample size, no institutional affiliation cited).
• Gallup Q3 2024 (n=15,000 US workers): hybrid models score 18% higher on engagement than either fully remote or fully in-office arrangements.
• Conclusion A (from Source 1): remote work is clearly superior for focused, deep-work tasks.
• Conclusion B (from Source 2): remote work is clearly inferior to in-office for any work requiring sustained concentration.`,
    result: {
      escalate: false,
      escalation_reason: null,
      tldr: 'The evidence on remote work is genuinely mixed and, in places, directly contradictory. The strongest signal is that hybrid models outperform both fully-remote and fully-in-office on engagement (Gallup, large sample). Several widely-cited claims here are weakly sourced — a wellness blog with no methodology, an undefined "significant" drop from Microsoft, and two flatly opposing conclusions — and should not drive policy without independent verification.',
      themes: [
        {
          title: 'Productivity effects',
          claims: [
            {
              text: 'Remote call-center workers showed a 13% productivity increase versus in-office peers.',
              confidence: 'Medium',
              confidence_reason: 'Named source with a sample size (Stanford, n=500), but the finding is specific to one job type (call-center) and may not generalize to knowledge work.',
              flagged: true,
              flag_reason: 'narrow population — call-center only, may not generalize',
            },
            {
              text: 'Remote work is clearly superior for focused deep-work tasks, and simultaneously clearly inferior for work requiring sustained concentration.',
              confidence: 'Low',
              confidence_reason: 'The input presents two directly opposing conclusions about essentially the same activity, with no reconciling evidence.',
              flagged: true,
              flag_reason: 'internal contradiction — Conclusion A and B directly conflict',
            },
          ],
        },
        {
          title: 'Engagement and wellbeing',
          claims: [
            {
              text: 'Hybrid work models score 18% higher on engagement than either fully-remote or fully-in-office arrangements.',
              confidence: 'High',
              confidence_reason: 'Named source, large sample (Gallup, n=15,000), recent (Q3 2024), and a specific quantified result with a clear comparison group.',
              flagged: false,
              flag_reason: null,
            },
            {
              text: 'Burnout rates among remote workers are rising sharply.',
              confidence: 'Low',
              confidence_reason: 'Sourced only to a wellness blog post with no methodology, sample size, or institutional affiliation; "sharply" is unquantified.',
              flagged: true,
              flag_reason: 'single unverified source — no methodology or sample size',
            },
            {
              text: 'Collaboration quality drops significantly for fully-remote teams.',
              confidence: 'Low',
              confidence_reason: 'Attributed to Microsoft’s 2024 Work Trend Index, but "significantly" is never defined or quantified in the source.',
              flagged: true,
              flag_reason: 'vague — "significantly" is undefined and unquantified',
            },
          ],
        },
        {
          title: 'Employer return-to-office moves',
          claims: [
            {
              text: 'Amazon, JPMorgan, and Goldman Sachs mandated full return-to-office in 2024, citing culture and mentorship.',
              confidence: 'Medium',
              confidence_reason: 'The policy actions are specific and consistent, but the stated rationale is the employers’ own framing and no supporting productivity data was disclosed.',
              flagged: true,
              flag_reason: 'stated rationale is unverified — no data disclosed to support it',
            },
          ],
        },
      ],
      gaps: [
        'No study here measures knowledge workers specifically, yet that is the population most RTO policies target.',
        'The time horizon differs across sources (2023 vs 2024), and none control for role, seniority, or industry.',
        'Causation vs. correlation is unaddressed — higher hybrid engagement could reflect who self-selects into hybrid roles.',
        'No cost data (real estate, attrition, hiring reach) is included, which usually dominates RTO decisions.',
      ],
      suggested_angles: [
        'Lead with the hybrid engagement finding — it is the best-supported claim and points to a defensible default policy.',
        'Commission or locate a knowledge-worker-specific productivity study before generalizing the call-center result.',
        'Treat the RTO announcements as competitor signaling, not evidence, until productivity data is disclosed.',
      ],
      verify_before_publishing: [
        'Remote call-center workers showed a 13% productivity increase versus in-office peers.',
        'Remote work is clearly superior for focused deep-work tasks, and simultaneously clearly inferior for work requiring sustained concentration.',
        'Burnout rates among remote workers are rising sharply.',
        'Collaboration quality drops significantly for fully-remote teams.',
        'Amazon, JPMorgan, and Goldman Sachs mandated full return-to-office in 2024, citing culture and mentorship.',
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // C) THIN / RISKY — short, sensitive (health) domain, escalate: true
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'thin_risky',
    label: 'Supplement claims (thin / risky)',
    outputType: 'recommendation',
    audience: 'Content team considering a supplement review article',
    inputText: `NeuroPlus is a nootropic supplement that clinical studies suggest may improve memory retention and overall cognitive performance. Users frequently report feeling sharper within two weeks. The formula uses only natural ingredients, so it should be safe for most healthy adults. Some medical professionals apparently recommend it for mental fatigue.`,
    result: {
      escalate: true,
      escalation_reason: 'This input makes health and safety claims about a supplement (cognitive benefits, safety for "most healthy adults") based on vague, unnamed sources. Publishing cognitive-health guidance without verified clinical evidence and medical review could cause real harm, so it requires a licensed professional’s judgment.',
      tldr: 'The input promotes a nootropic supplement using unnamed "clinical studies," anecdotal user reports, and an implied safety claim. None of the sources are identified, and the health/safety assertions cannot be responsibly published without expert medical review and verified evidence.',
      themes: [
        {
          title: 'Efficacy claims',
          claims: [
            {
              text: 'NeuroPlus may improve memory retention and overall cognitive performance.',
              confidence: 'Low',
              confidence_reason: 'Cites "clinical studies" with no name, publication, sample size, or design; hedged with "suggest" and "may."',
              flagged: true,
              flag_reason: 'unnamed clinical sources — no study identified or citable',
            },
            {
              text: 'Users report feeling sharper within two weeks of starting the supplement.',
              confidence: 'Low',
              confidence_reason: 'Anecdotal self-report with no controlled comparison; highly susceptible to placebo effect.',
              flagged: true,
              flag_reason: 'anecdotal — uncontrolled self-reported testimonials',
            },
          ],
        },
        {
          title: 'Safety claims',
          claims: [
            {
              text: 'Because the formula uses only natural ingredients, it should be safe for most healthy adults.',
              confidence: 'Low',
              confidence_reason: '"Natural" does not imply safe; no toxicology, dosage, or interaction data is provided, and the claim is a logical leap.',
              flagged: true,
              flag_reason: 'unsupported safety inference — "natural" ≠ safe, no evidence',
            },
          ],
        },
      ],
      gaps: [
        'No named clinical study, journal, sample size, or trial design is provided for any efficacy claim.',
        'No dosage, active-ingredient list, or known drug/condition interactions are disclosed.',
        'The claim that "medical professionals recommend it" names no professionals and cites no basis.',
        'No regulatory status (e.g., FDA/EFSA position on the ingredients or claims) is mentioned.',
      ],
      suggested_angles: [],
      verify_before_publishing: [
        'NeuroPlus may improve memory retention and overall cognitive performance.',
        'Users report feeling sharper within two weeks of starting the supplement.',
        'Because the formula uses only natural ingredients, it should be safe for most healthy adults.',
      ],
    },
  },
];

export default DEMO_CASES;
