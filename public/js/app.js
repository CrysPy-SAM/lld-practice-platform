const API_BASE = '/api';

let currentAttemptId = null;
let currentProblem = null;
let learnerId = null;

async function init() {
  try {
    const res = await fetch(`${API_BASE}/learner/default`);
    const data = await res.json();
    learnerId = data.learner.id;

    renderProblems();
  } catch (err) {
    console.error('Failed to initialize:', err);
  }
}

async function renderProblems() {
  const grid = document.getElementById('problems-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading">Loading problems...</div>';

  try {
    const res = await fetch(`${API_BASE}/problems`);
    const data = await res.json();
    const problems = data.problems;

    if (problems.length === 0) {
      grid.innerHTML = '<p>No problems available.</p>';
      return;
    }

    grid.innerHTML = problems
      .map(
        (p) => `
      <div class="problem-card" onclick="selectProblem('${p.id}')">
        <h3>${escapeHtml(p.title)}</h3>
        <span class="difficulty difficulty-${p.difficulty}">${p.difficulty}</span>
        <p style="margin-top: 0.5rem; color: #94a3b8; font-size: 0.85rem;">${escapeHtml((p.description || '').substring(0, 120))}${p.description && p.description.length > 120 ? '...' : ''}</p>
        <div class="tags">
          ${p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    grid.innerHTML = `<p style="color:#f87171;">Error loading problems: ${err.message}</p>`;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function selectProblem(problemId) {
  document.getElementById('problems-section').classList.remove('active');
  document.getElementById('attempt-section').classList.add('active');

  try {
    const res = await fetch(`${API_BASE}/problems/${problemId}`);
    const data = await res.json();
    currentProblem = data.problem;

    document.getElementById('attempt-problem-title').textContent =
      currentProblem.title;

    const details = document.getElementById('problem-details');
    details.innerHTML = `
      <p>${escapeHtml(currentProblem.description)}</p>
      <h4>Requirements:</h4>
      <ul>
        ${currentProblem.requirements
          .map((r) => `<li>${escapeHtml(r)}</li>`)
          .join('')}
      </ul>
      <h4 style="margin-top: 0.5rem;">Constraints:</h4>
      <ul>
        ${currentProblem.constraints
          .map((c) => `<li>${escapeHtml(c)}</li>`)
          .join('')}
      </ul>
      ${
        currentProblem.hints && currentProblem.hints.length
          ? `<h4 style="margin-top: 0.5rem;">Hints:</h4><ul>${currentProblem.hints.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`
          : ''
      }
    `;

    const attemptRes = await fetch(`${API_BASE}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerId: learnerId,
        problemId: problemId,
      }),
    });
    const attemptData = await attemptRes.json();
    currentAttemptId = attemptData.attempt.id;

    document.getElementById('save-draft-btn').addEventListener('click', saveDraft);
    document.getElementById('submit-btn').addEventListener('click', submitAttempt);
    document.getElementById('get-feedback-btn').addEventListener('click', getFeedback);
    document.getElementById('back-to-problems').onclick = backToProblems;
  } catch (err) {
    console.error('Failed to select problem:', err);
  }
}

function backToProblems() {
  currentAttemptId = null;
  currentProblem = null;
  document.getElementById('attempt-section').classList.remove('active');
  document.getElementById('problems-section').classList.add('active');
}

async function saveDraft() {
  const content = document.getElementById('solution-content').value;
  const explanation = document.getElementById('solution-explanation').value;

  try {
    await fetch(`${API_BASE}/attempts/${currentAttemptId}/solution`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, explanation }),
    });

    showNotification('Draft saved successfully');
  } catch (err) {
    showNotification(`Error saving draft: ${err.message}`, true);
  }
}

async function submitAttempt() {
  try {
    await fetch(`${API_BASE}/attempts/${currentAttemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    document.getElementById('submit-btn').style.display = 'none';
    document.getElementById('get-feedback-btn').style.display = 'inline-block';
    showNotification('Solution submitted! Click "Get Feedback" to evaluate.');
  } catch (err) {
    showNotification(`Error submitting: ${err.message}`, true);
  }
}

async function getFeedback() {
  const btn = document.getElementById('get-feedback-btn');
  btn.disabled = true;
  btn.textContent = 'Generating...';

  try {
    const res = await fetch(
      `${API_BASE}/attempts/${currentAttemptId}/feedback`,
      { method: 'POST' }
    );
    const data = await res.json();

    renderFeedback(data.feedback);

    document.getElementById('feedback-tab-link').style.display = 'inline-block';

    showNotification('Feedback received!');
  } catch (err) {
    showNotification(`Error generating feedback: ${err.message}`, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Get Feedback';
  }
}

function renderFeedback(feedback) {
  const container = document.getElementById('feedback-content');
  if (!container) return;

  const criteriaOrder = [
    'MODULARITY',
    'SOLID_PRINCIPLES',
    'DESIGN_PATTERNS',
    'RESPONSIBILITIES',
    'RELATIONSHIPS',
    'TRADEOFFS',
    'COMPLETENESS',
  ];

  const scoreMap = {};
  for (const s of feedback.scores || []) {
    scoreMap[s.criterion] = s;
  }

  let html = `
    <div class="feedback-content">
      <div class="feedback-summary">
        <strong>Overall Score: ${feedback.overallScore} / 5</strong>
        <p style="margin-top: 0.5rem;">${escapeHtml(feedback.summary)}</p>
      </div>
      <div class="score-section">
        <h4 style="color: #4facfe; margin-bottom: 0.5rem;">Detailed Scores</h4>
  `;

  for (const criterion of criteriaOrder) {
    const s = scoreMap[criterion];
    if (s) {
      html += `
        <div class="score-bar score-${s.score}">
          <span class="score-label">${formatCriterion(criterion)}</span>
          <span class="score-value">${s.score}/5</span>
          <div class="bar-bg"><div class="bar-fill"></div></div>
        </div>
        <div style="margin-left: 180px; color: #94a3b8; font-size: 0.8rem; margin-top: -0.5rem; margin-bottom: 0.5rem;">
          ${escapeHtml(s.comment)}
        </div>
      `;
    }
  }

  html += `</div>`;

  if (feedback.suggestions && feedback.suggestions.length > 0) {
    html += `
      <div class="feedback-suggestions">
        <h4 style="color: #4facfe; margin-bottom: 0.5rem;">Suggestions for Improvement</h4>
        <ul>
          ${feedback.suggestions.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function formatCriterion(c) {
  return c
    .toLowerCase()
    .replace('_', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function showNotification(message, isError) {
  let el = document.getElementById('notification');
  if (!el) {
    el = document.createElement('div');
    el.id = 'notification';
    el.style.cssText = `
      position: fixed; bottom: 20px; right: 20px;
      padding: 12px 20px; border-radius: 6px;
      font-weight: 600; z-index: 1000;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.background = isError ? '#f87171' : '#34d399';
  el.style.color = '#0f172a';
  el.style.opacity = '1';
  setTimeout(() => {
    el.style.opacity = '0';
  }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
