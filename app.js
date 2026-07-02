// InsightFlow – Parts 3–5: input wired to /api/analyze, Trust Layer rendering,
// human approval gate, flagged-claim checkboxes, and export.

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

let selectedOutputType = 'brief';

// --- Session state (Part 5) -----------------------------------------------
// Single source of truth. Reset on every new Analyze click, before the request.
//
// reviewState: { [claimId]: { checked: boolean, text: string } }
//   claimId = "${themeIndex}-${claimIndex}" — stable within one analysis session.

let reviewState       = {};
let briefData         = null;  // last successful API response (used for export)
let isApproved        = false;
let approvalTimestamp = null;

function resetSessionState() {
  reviewState       = {};
  briefData         = null;
  isApproved        = false;
  approvalTimestamp = null;
}

// --- Sample data ---------------------------------------------------------

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

// --- Input UI helpers ---------------------------------------------------

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

  const text = researchTextarea.value.trim();
  if (!text) {
    showError('Please paste some research text before analyzing.');
    return;
  }

  // Reset ALL session state before every request — this also clears old brief
  resetSessionState();

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
      showError(data.message || `Request failed (${response.status}). Please try again.`);
      return;
    }

    briefData = data;
    renderBrief(data);
  } catch {
    showError('Network error — please check your connection and try again.');
  } finally {
    setLoading(false);
  }
}

// --- Review state (Part 5) -----------------------------------------------

// Build reviewState from themes. Only flagged claims get entries.
function buildReviewState(themes) {
  const state = {};
  if (!Array.isArray(themes)) return state;
  themes.forEach((theme, ti) => {
    (theme.claims || []).forEach((claim, ci) => {
      if (claim.flagged === true) {
        state[`${ti}-${ci}`] = { checked: false, text: claim.text || '' };
      }
    });
  });
  return state;
}

// Single handler for any checkbox change (claim row OR verify list).
// Updates reviewState → syncs both checkbox locations → updates all UI.
function onClaimCheck(claimId, checked) {
  if (!reviewState[claimId]) return;
  reviewState[claimId].checked = checked;

  // Sync every checkbox input sharing this claimId (theme + verify list)
  document.querySelectorAll(`input.verify-checkbox[data-claim-id="${claimId}"]`).forEach((cb) => {
    cb.checked = checked;
  });

  // Sync custom checkmark visuals
  document.querySelectorAll(`.verify-checkmark[data-claim-id="${claimId}"]`).forEach((mark) => {
    mark.classList.toggle('verify-checkmark--checked', checked);
  });

  // Update claim row in Findings section
  const claimRow = document.querySelector(`.claim-row[data-claim-id="${claimId}"]`);
  if (claimRow) claimRow.classList.toggle('claim-row--verified', checked);

  // Update item in Verify list
  const verifyItem = document.querySelector(`.verify-item[data-claim-id="${claimId}"]`);
  if (verifyItem) verifyItem.classList.toggle('verify-item--verified', checked);

  syncApprovalState();
}

// Re-derive all approval UI from current reviewState.
function syncApprovalState() {
  const allIds     = Object.keys(reviewState);
  const unchecked  = allIds.filter((id) => !reviewState[id].checked).length;
  const allDone    = unchecked === 0;

  // Status bar hint
  const draftHint = document.getElementById('draft-hint');
  if (draftHint) {
    if (allIds.length === 0) {
      draftHint.textContent = 'No flagged claims — ready to approve immediately.';
    } else if (allDone) {
      draftHint.textContent = 'All claims reviewed — ready to approve.';
    } else {
      draftHint.textContent =
        `${unchecked} item${unchecked !== 1 ? 's' : ''} need${unchecked === 1 ? 's' : ''} review before this is publish-ready`;
    }
  }

  // Approve button
  const approveBtn = document.getElementById('approve-btn');
  if (approveBtn) {
    approveBtn.disabled = !allDone;
    approveBtn.querySelector('.approve-btn-label').textContent = allDone
      ? 'Approve brief for use'
      : 'Approve brief';
  }
}

// One-way approval action. Called when the human clicks "Approve brief for use".
function handleApprove() {
  if (isApproved) return;
  isApproved        = true;
  approvalTimestamp = new Date();

  // Flip draft pill → approved
  const draftPill = document.getElementById('draft-pill');
  if (draftPill) {
    draftPill.className   = 'draft-pill draft-pill--approved';
    draftPill.textContent = 'APPROVED BY HUMAN';
  }
  const draftHint = document.getElementById('draft-hint');
  if (draftHint) {
    draftHint.textContent = `Approved on ${formatDate(approvalTimestamp)}`;
  }

  // Replace approve bar content with confirmation + copy button
  const approveBar = document.getElementById('approve-bar');
  if (approveBar) {
    approveBar.innerHTML = `
      <p class="approve-confirmed">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="6.25" stroke="currentColor" stroke-width="1.25"/>
          <path d="M4.75 7.5l2.25 2.25 3.25-3.75" stroke="currentColor" stroke-width="1.25"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Approved and ready to export.
      </p>
      <button class="btn-copy" id="copy-btn" type="button">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="4.5" y="4.5" width="8" height="8" rx="1.5"
                stroke="currentColor" stroke-width="1.25"/>
          <path d="M2.5 9.5v-7a1 1 0 0 1 1-1h7" stroke="currentColor"
                stroke-width="1.25" stroke-linecap="round"/>
        </svg>
        <span class="copy-label">Copy brief</span>
      </button>
    `;
    document.getElementById('copy-btn').addEventListener('click', handleCopy);
  }
}

// Copy plain-text brief to clipboard. Only enabled post-approval.
async function handleCopy() {
  if (!briefData || !approvalTimestamp) return;
  const text  = buildExportText(briefData, approvalTimestamp);
  const btn   = document.getElementById('copy-btn');
  const label = btn?.querySelector('.copy-label');

  try {
    await navigator.clipboard.writeText(text);
    if (label) label.textContent = 'Copied!';
    btn?.classList.add('btn-copy--success');
  } catch {
    if (label) label.textContent = 'Copy failed';
  } finally {
    setTimeout(() => {
      if (label) label.textContent = 'Copy brief';
      btn?.classList.remove('btn-copy--success');
    }, 2000);
  }
}

// Build a clean plain-text export of the approved brief.
function buildExportText(data, timestamp) {
  const lines = [
    'INSIGHTFLOW BRIEF',
    '═════════════════',
    '',
    'SUMMARY',
    '───────',
    data.tldr || '',
    '',
  ];

  if (Array.isArray(data.themes) && data.themes.length > 0) {
    lines.push('FINDINGS', '────────');
    for (const theme of data.themes) {
      lines.push('', `■ ${theme.title}`);
      for (const claim of (theme.claims || [])) {
        lines.push(`  • [${claim.confidence || 'Medium'}] ${claim.text || ''}`);
        if (claim.flagged) {
          lines.push(`    ⚠ ${claim.flag_reason || 'Flagged for review'} — verified by human`);
        }
      }
    }
    lines.push('');
  }

  if (Array.isArray(data.gaps) && data.gaps.length > 0) {
    lines.push('GAPS / MISSING INFORMATION', '──────────────────────────');
    for (const gap of data.gaps) lines.push(`  ? ${gap}`);
    lines.push('');
  }

  if (Array.isArray(data.suggested_angles) && data.suggested_angles.length > 0) {
    lines.push('SUGGESTED NEXT STEPS', '────────────────────');
    for (const angle of data.suggested_angles) lines.push(`  → ${angle}`);
    lines.push('');
  }

  lines.push(
    '─────────────────────────────────────────────────',
    `APPROVED BY HUMAN: ${formatDate(timestamp)}`,
    'Generated by InsightFlow — AI-assisted, human-approved.',
  );

  return lines.join('\n');
}

// --- Render (Parts 4–5) ---------------------------------------------------
// renderBrief() is the single entry point. Two paths: escalated vs. normal.

function renderBrief(data) {
  briefPanelBody.innerHTML = '';

  // Build review state from this response
  reviewState = buildReviewState(data.themes);

  // ── Escalated path: no draft bar, no checkboxes, no approval flow ──
  if (data.escalate) {
    const output = document.createElement('div');
    output.className = 'brief-output';
    output.appendChild(renderEscalationBanner(data.escalation_reason));

    const routeMsg = document.createElement('div');
    routeMsg.className = 'routing-message';
    routeMsg.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 6v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="10" cy="14" r="0.875" fill="currentColor"/>
      </svg>
      <p>InsightFlow will not produce an approvable brief for this input.
         Route this to a human researcher.</p>
    `;
    output.appendChild(routeMsg);

    // Best-effort read-only content (de-emphasized)
    const content = document.createElement('div');
    content.className = 'brief-content brief-content--escalated';
    const sublabel = document.createElement('p');
    sublabel.className = 'escalated-sublabel';
    sublabel.textContent = 'Best-effort analysis only — do not publish without expert review.';
    content.appendChild(sublabel);
    content.appendChild(renderTldr(data.tldr));
    if (Array.isArray(data.themes) && data.themes.length > 0) {
      content.appendChild(renderThemesInner(data.themes, false));
    }
    output.appendChild(content);

    briefPanelBody.appendChild(output);
    return;
  }

  // ── Normal path: full approval flow ──

  // Draft status bar — direct child of #brief-panel-body so sticky works correctly
  briefPanelBody.appendChild(renderDraftStatusBar());

  const output = document.createElement('div');
  output.className = 'brief-output';

  output.appendChild(renderTldr(data.tldr));
  output.appendChild(renderThemesInner(data.themes, true));     // interactive
  output.appendChild(renderVerifyList(data.themes));             // built from themes
  if (Array.isArray(data.gaps) && data.gaps.length > 0) {
    output.appendChild(renderGaps(data.gaps));
  }
  if (Array.isArray(data.suggested_angles) && data.suggested_angles.length > 0) {
    output.appendChild(renderAngles(data.suggested_angles));
  }
  output.appendChild(renderApproveBar());

  briefPanelBody.appendChild(output);

  // Attach checkbox listeners — single pass after all DOM is built
  document.querySelectorAll('input.verify-checkbox').forEach((cb) => {
    cb.addEventListener('change', () => onClaimCheck(cb.dataset.claimId, cb.checked));
  });

  // Approve button
  document.getElementById('approve-btn')?.addEventListener('click', handleApprove);

  // Sync initial state (sets approve button enabled/disabled, hint text)
  syncApprovalState();
}

// ── Sub-renderers ──

function renderDraftStatusBar() {
  const flaggedCount = Object.keys(reviewState).length;
  const bar = document.createElement('div');
  bar.className = 'draft-status-bar';
  bar.id = 'draft-status-bar';
  bar.setAttribute('role', 'status');
  bar.innerHTML = `
    <span class="draft-pill draft-pill--pending" id="draft-pill">DRAFT — NOT APPROVED</span>
    <span class="draft-hint" id="draft-hint">
      ${flaggedCount > 0
        ? `${flaggedCount} item${flaggedCount !== 1 ? 's' : ''} need review before this is publish-ready`
        : 'No flagged claims — ready to approve immediately.'}
    </span>
  `;
  return bar;
}

function renderApproveBar() {
  const bar = document.createElement('div');
  bar.className = 'approve-bar brief-section';
  bar.id = 'approve-bar';
  bar.innerHTML = `
    <p class="approve-hint" id="approve-hint">Check all flagged claims to enable approval.</p>
    <button class="btn-approve" id="approve-btn" type="button" disabled>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d="M3 7.5l3.5 3.5 5.5-6" stroke="currentColor" stroke-width="1.75"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="approve-btn-label">Approve brief</span>
    </button>
  `;
  return bar;
}

function renderEscalationBanner(reason) {
  const el = document.createElement('div');
  el.className = 'escalation-banner';
  el.setAttribute('role', 'alert');
  el.innerHTML = `
    <div class="escalation-icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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

// Core themes renderer. interactive=true adds checkboxes to flagged claims.
function renderThemesInner(themes, interactive) {
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

  themes.forEach((theme, ti) => {
    html += `<div class="theme-block">`;
    html += `<h4 class="theme-title">${escapeHtml(theme.title || 'Untitled theme')}</h4>`;

    const claims = Array.isArray(theme.claims) ? theme.claims : [];
    if (claims.length === 0) {
      html += `<p class="brief-empty-note">No claims recorded for this theme.</p>`;
    } else {
      claims.forEach((claim, ci) => {
        const conf      = claim.confidence || 'Medium';
        const confKey   = conf.toLowerCase();
        const isFlagged = claim.flagged === true;
        const claimId   = `${ti}-${ci}`;

        html += `<div class="claim-row${isFlagged ? ' claim-row--flagged' : ''}"
                      ${interactive && isFlagged ? `data-claim-id="${claimId}"` : ''}>`;
        html += `  <div class="claim-main">`;
        html += `    <p class="claim-text">${escapeHtml(claim.text || '')}</p>`;
        html += `    <span class="badge-tooltip-wrap">`;
        html += `      <span class="confidence-badge confidence-badge--${confKey}" tabindex="0" role="note"
                           aria-label="${escapeHtml(conf)} confidence — ${escapeHtml(claim.confidence_reason || '')}">
                           ${escapeHtml(conf)} confidence
                         </span>`;
        html += `      <span class="badge-tooltip" role="tooltip">${escapeHtml(claim.confidence_reason || '')}</span>`;
        html += `    </span>`;
        html += `  </div>`;

        if (isFlagged) {
          html += `  <div class="flag-note">
                       <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                         <path d="M2 1v10" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
                         <path d="M2 1h7.5L7 4.5l2.5 3.5H2" stroke="currentColor"
                               stroke-width="1.25" stroke-linejoin="round"/>
                       </svg>
                       <span>${escapeHtml(claim.flag_reason || 'Needs verification')}</span>
                     </div>`;

          if (interactive) {
            // Hidden native checkbox + custom visual + label text
            html += `  <label class="verify-check-label">
                         <input type="checkbox" class="verify-checkbox"
                                data-claim-id="${claimId}"
                                aria-label="I've verified this claim" />
                         <span class="verify-checkmark" data-claim-id="${claimId}"
                               aria-hidden="true"></span>
                         <span class="verify-check-text">I've verified this claim</span>
                       </label>`;
          }
        }

        html += `</div>`; // .claim-row
      });
    }
    html += `</div>`; // .theme-block
  });

  html += '</div>'; // .themes-list
  el.innerHTML = html;
  return el;
}

// Verify list — rebuilt from themes so claim IDs match the review state exactly.
function renderVerifyList(themes) {
  const el = document.createElement('div');
  el.className = 'brief-section';

  // Collect flagged claims with their stable claim IDs
  const flagged = [];
  if (Array.isArray(themes)) {
    themes.forEach((theme, ti) => {
      (theme.claims || []).forEach((claim, ci) => {
        if (claim.flagged === true) {
          flagged.push({ id: `${ti}-${ci}`, text: claim.text || '' });
        }
      });
    });
  }

  const count = flagged.length;
  let html = `<h3 class="brief-section-heading">
    Verify before publishing <span class="section-count">(${count} item${count !== 1 ? 's' : ''})</span>
  </h3>`;

  if (count === 0) {
    html += `<p class="verify-empty">✓ No flagged claims — but always sanity-check before publishing.</p>`;
  } else {
    html += `<ul class="verify-list">`;
    for (const { id, text } of flagged) {
      html += `<li class="verify-item" data-claim-id="${id}">
                 <label class="verify-check-label verify-check-label--list">
                   <input type="checkbox" class="verify-checkbox"
                          data-claim-id="${id}"
                          aria-label="Mark as verified: ${escapeHtml(text)}" />
                   <span class="verify-checkmark" data-claim-id="${id}" aria-hidden="true"></span>
                   <span class="verify-check-text">${escapeHtml(text)}</span>
                 </label>
               </li>`;
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
  for (const gap of gaps) html += `<li>${escapeHtml(gap)}</li>`;
  html += `</ul>`;
  el.innerHTML = html;
  return el;
}

function renderAngles(angles) {
  const el = document.createElement('div');
  el.className = 'brief-section';
  let html = `<h3 class="brief-section-heading">Suggested next steps</h3><ul class="angles-list">`;
  for (const angle of angles) html += `<li>${escapeHtml(angle)}</li>`;
  html += `</ul>`;
  el.innerHTML = html;
  return el;
}

// --- Utility ---------------------------------------------------------------

function formatDate(date) {
  return date.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
