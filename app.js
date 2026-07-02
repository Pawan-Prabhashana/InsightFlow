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

    renderBrief(data);
  } catch {
    showError('Network error — please check your connection and try again.');
  } finally {
    setLoading(false);
  }
}

// --- Render (Part 4) -------------------------------------------------------
// Full Trust Layer brief renderer. Each sub-function returns a DOM Element.
// renderBrief() orchestrates them and injects into the right panel.

function renderBrief(data) {
  // Clear previous results cleanly before painting new ones
  briefPanelBody.innerHTML = '';

  const output = document.createElement('div');
  output.className = 'brief-output';

  // 1. Escalation banner — always first if present
  if (data.escalate) {
    output.appendChild(renderEscalationBanner(data.escalation_reason));
  }

  // 2. Main content wrapper (de-emphasized when escalated)
  const content = document.createElement('div');
  content.className = data.escalate
    ? 'brief-content brief-content--escalated'
    : 'brief-content';

  if (data.escalate) {
    const sublabel = document.createElement('p');
    sublabel.className = 'escalated-sublabel';
    sublabel.textContent = 'Best-effort analysis only — do not publish without expert review.';
    content.appendChild(sublabel);
  }

  content.appendChild(renderTldr(data.tldr));
  content.appendChild(renderThemes(data.themes));
  content.appendChild(renderVerifyList(data.verify_before_publishing));

  // Gaps: hidden entirely when array is empty (per spec)
  if (Array.isArray(data.gaps) && data.gaps.length > 0) {
    content.appendChild(renderGaps(data.gaps));
  }

  // Suggested angles: hidden entirely when escalate is true (per API contract)
  if (!data.escalate && Array.isArray(data.suggested_angles) && data.suggested_angles.length > 0) {
    content.appendChild(renderAngles(data.suggested_angles));
  }

  output.appendChild(content);
  briefPanelBody.appendChild(output);
}

function renderEscalationBanner(reason) {
  const el = document.createElement('div');
  el.className = 'escalation-banner';
  el.setAttribute('role', 'alert');
  el.innerHTML = `
    <div class="escalation-icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2.5 2.5 17h15L10 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <line x1="10" y1="8.5" x2="10" y2="12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="10" cy="14.75" r="0.875" fill="currentColor"/>
      </svg>
    </div>
    <div>
      <strong class="escalation-heading">This needs a human, not auto-output</strong>
      ${reason ? `<p class="escalation-reason">${escapeHtml(reason)}</p>` : ''}
    </div>
  `;
  return el;
}

function renderTldr(tldr) {
  const el = document.createElement('div');
  el.className = 'brief-section';
  el.innerHTML = `
    <h3 class="brief-section-heading">Summary</h3>
    <p class="brief-tldr">${escapeHtml(tldr || '')}</p>
  `;
  return el;
}

function renderThemes(themes) {
  const el = document.createElement('div');
  el.className = 'brief-section';

  if (!Array.isArray(themes) || themes.length === 0) {
    el.innerHTML = `
      <h3 class="brief-section-heading">Findings</h3>
      <p class="brief-empty-note">No structured findings in this analysis.</p>
    `;
    return el;
  }

  let html = '<h3 class="brief-section-heading">Findings</h3><div class="themes-list">';

  for (const theme of themes) {
    html += `<div class="theme-block">`;
    html += `<h4 class="theme-title">${escapeHtml(theme.title || 'Untitled theme')}</h4>`;

    const claims = Array.isArray(theme.claims) ? theme.claims : [];
    if (claims.length === 0) {
      html += `<p class="brief-empty-note">No claims recorded for this theme.</p>`;
    } else {
      for (const claim of claims) {
        const conf     = claim.confidence || 'Medium';
        const confKey  = conf.toLowerCase();   // 'high' | 'medium' | 'low'
        const isFlagged = claim.flagged === true;

        html += `<div class="claim-row${isFlagged ? ' claim-row--flagged' : ''}">`;
        html += `  <div class="claim-main">`;
        html += `    <p class="claim-text">${escapeHtml(claim.text || '')}</p>`;
        // Badge + tooltip wrapper (tabindex so keyboard/tap can trigger :focus-within)
        html += `    <span class="badge-tooltip-wrap">`;
        html += `      <span class="confidence-badge confidence-badge--${confKey}" tabindex="0" role="note"
                         aria-label="${escapeHtml(conf)} confidence — ${escapeHtml(claim.confidence_reason || '')}">
                         ${escapeHtml(conf)} confidence
                       </span>`;
        html += `      <span class="badge-tooltip" role="tooltip">${escapeHtml(claim.confidence_reason || '')}</span>`;
        html += `    </span>`;
        html += `  </div>`;

        if (isFlagged) {
          html += `  <div class="flag-note">`;
          html += `    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                         <path d="M2 1v10" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
                         <path d="M2 1h7.5L7 4.5l2.5 3.5H2" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/>
                       </svg>`;
          html += `    <span>${escapeHtml(claim.flag_reason || 'Needs verification')}</span>`;
          html += `  </div>`;
        }

        html += `</div>`; // .claim-row
      }
    }

    html += `</div>`; // .theme-block
  }

  html += '</div>'; // .themes-list
  el.innerHTML = html;
  return el;
}

function renderVerifyList(items) {
  const el = document.createElement('div');
  el.className = 'brief-section';
  const count = Array.isArray(items) ? items.length : 0;

  let html = `<h3 class="brief-section-heading">
    Verify before publishing <span class="section-count">(${count} item${count !== 1 ? 's' : ''})</span>
  </h3>`;

  if (count === 0) {
    html += `<p class="verify-empty">✓ No flagged claims — but always sanity-check before publishing.</p>`;
  } else {
    html += `<ul class="verify-list">`;
    for (const item of items) {
      html += `<li class="verify-item">${escapeHtml(item)}</li>`;
    }
    html += `</ul>`;
  }

  el.innerHTML = html;
  return el;
}

function renderGaps(gaps) {
  const el = document.createElement('div');
  el.className = 'brief-section';
  let html = `<h3 class="brief-section-heading">What's missing</h3><ul class="gaps-list">`;
  for (const gap of gaps) {
    html += `<li>${escapeHtml(gap)}</li>`;
  }
  html += `</ul>`;
  el.innerHTML = html;
  return el;
}

function renderAngles(angles) {
  const el = document.createElement('div');
  el.className = 'brief-section';
  let html = `<h3 class="brief-section-heading">Suggested next steps</h3><ul class="angles-list">`;
  for (const angle of angles) {
    html += `<li>${escapeHtml(angle)}</li>`;
  }
  html += `</ul>`;
  el.innerHTML = html;
  return el;
}

// --- Utility ---------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
