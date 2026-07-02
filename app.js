// InsightFlow – Part 3: input panel wired to /api/analyze
// Logic for Parts 4–6 will be added in later sections of this file.

// --- DOM refs -----------------------------------------------------------

const researchTextarea = document.getElementById('research-text');
const charCountEl      = document.getElementById('char-count');
const charCounterEl    = document.getElementById('char-counter');
const audienceInput    = document.getElementById('audience-input');
const analyzeBtn       = document.getElementById('analyze-btn');
const analyzeBtnLabel  = analyzeBtn.querySelector('.btn-label');
const errorBanner      = document.getElementById('error-banner');
const errorMessageEl   = document.getElementById('error-message');
const briefPanelBody   = document.getElementById('brief-panel-body');
const segBtns          = document.querySelectorAll('.seg-btn');

// Track the currently selected output type (default matches the HTML active state)
let selectedOutputType = 'brief';

// --- Sample data ---------------------------------------------------------
// Three realistic prefill samples for manual testing convenience.
// Content is chosen to exercise different Trust Layer behaviours:
//   clean  → multiple corroborating, specific claims  → low escalation
//   messy  → contradictions + vague sources           → mixed confidence, flags
//   thin   → very short + health claims               → escalate: true

const SAMPLES = {
  clean: `Q3 2024 competitive analysis — SaaS project management tools:
• Asana reported $652M in FY2024 revenue, up 19% year-over-year (Asana Q4 2024 earnings call, Oct 2024).
• Monday.com posted $900M in FY2024 revenue, growing 34% YoY, with 89% gross margins (Monday.com investor day, Nov 2024).
• ClickUp raised a $537M Series C at a $4B valuation and claims 10M users across 800,000+ teams (ClickUp press release, Sep 2024).
• A G2 buyer survey (n=1,200, September 2024) found that 67% of teams cite "ease of onboarding" as the primary switching trigger away from their current tool.
• All three platforms announced AI-native workflow automation in their H1 2025 roadmaps, targeting mid-market teams of 50–500 members.
• Across G2, Capterra, and TrustRadius, Gantt chart usability scores for Asana run 15–22% lower than Monday.com and ClickUp among teams of 50+ members.`,

  messy: `Remote work productivity — research roundup (sources vary, quality mixed):
• Stanford study (2023, n=500 call-center workers) showed a 13% productivity increase for remote employees vs. in-office counterparts.
• Microsoft's 2024 Work Trend Index reports collaboration quality drops "significantly" for fully remote teams — "significantly" is not defined anywhere in the report.
• Some analysts say remote work is just as productive as in-office; others say engagement is measurably worse. The evidence is openly contradictory.
• Amazon, JPMorgan, and Goldman Sachs all mandated full return-to-office in 2024, citing culture and mentorship — no internal productivity data was disclosed publicly.
• Burnout rates among remote workers are "rising sharply" per a 2024 wellness blog post (no methodology, no sample size, no institutional affiliation cited).
• Gallup Q3 2024 (n=15,000 US workers): hybrid models score 18% higher on engagement than either fully remote or fully in-office arrangements.
• Conclusion A (from Source 1): remote work is clearly superior for focused, deep-work tasks.
• Conclusion B (from Source 2): remote work is clearly inferior to in-office for any work requiring sustained concentration. Both appear in research published this year.`,

  thin: `NeuroPlus is a nootropic supplement that clinical studies suggest may improve memory retention and overall cognitive performance. Users frequently report feeling sharper and more focused within two weeks of starting the regimen. The formula uses only natural ingredients, so it should be safe and well-tolerated for most healthy adults. Some medical professionals apparently recommend it for people dealing with mental fatigue. It could be particularly beneficial for students preparing for exams or executives managing high cognitive loads.`,
};

// --- Segmented control --------------------------------------------------

segBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    segBtns.forEach((b) => b.classList.remove('seg-btn--active'));
    btn.classList.add('seg-btn--active');
    selectedOutputType = btn.dataset.type;
  });
});

// --- Sample prefill buttons ---------------------------------------------

document.querySelectorAll('.btn-sample').forEach((btn) => {
  btn.addEventListener('click', () => {
    researchTextarea.value = SAMPLES[btn.dataset.sample] ?? '';
    updateCharCounter();
    hideError();
    researchTextarea.focus();
  });
});

// --- Character counter --------------------------------------------------

researchTextarea.addEventListener('input', updateCharCounter);

function updateCharCounter() {
  const len = researchTextarea.value.length;
  charCountEl.textContent = len.toLocaleString();
  charCounterEl.classList.toggle('char-counter--over', len > 20000);
}

// --- UI state helpers ---------------------------------------------------

function setLoading(isLoading) {
  analyzeBtn.classList.toggle('btn-analyze--loading', isLoading);
  analyzeBtn.disabled = isLoading;
  analyzeBtnLabel.textContent = isLoading ? 'Analyzing…' : 'Analyze';
}

function showError(msg) {
  errorMessageEl.textContent = msg;
  errorBanner.hidden = false;
  errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  errorBanner.hidden = true;
  errorMessageEl.textContent = '';
}

// --- API call -----------------------------------------------------------

analyzeBtn.addEventListener('click', runAnalysis);

async function runAnalysis() {
  hideError();

  // Basic client-side UX check only — real validation lives in api/analyze.js
  const text = researchTextarea.value.trim();
  if (!text) {
    showError('Please paste some research text before analyzing.');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        researchText: text,
        outputType: selectedOutputType,
        audience: audienceInput.value.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Show the exact message from the API's { error, message } envelope
      showError(data.message || `Request failed (${response.status}). Please try again.`);
      return;
    }

    renderRaw(data);
  } catch {
    showError('Network error — please check your connection and try again.');
  } finally {
    setLoading(false);
  }
}

// --- Render (temporary) -------------------------------------------------
// Raw JSON dump so we can confirm the end-to-end pipeline works.
// This will be replaced by a rich renderer in Part 4.

function renderRaw(data) {
  briefPanelBody.innerHTML = `
    <div class="raw-output-wrap">
      <p class="raw-output-label">
        Raw API response
        <span class="raw-output-badge">temporary — Part 4 will make this readable</span>
      </p>
      <pre class="raw-output">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
    </div>
  `;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
