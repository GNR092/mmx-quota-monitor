const API_URL = 'https://api.minimax.io/v1/token_plan/remains';

const getRefreshInterval = () => parseInt(localStorage.getItem('mmx_interval')) || 30;

let countdown = getRefreshInterval();
let countdownInterval;
let isRefreshing = false;
let quotaData = null;
let availableModels = [];

const quotaListEl = document.getElementById('quotaList');
const countdownEl = document.getElementById('countdown');
const btnRefresh = document.getElementById('btnRefresh');
const btnMinimize = document.getElementById('btnMinimize');
const btnClose = document.getElementById('btnClose');
const btnToggleTop = document.getElementById('btnToggleTop');
const btnConfig = document.getElementById('btnConfig');

async function fetchQuota() {
  if (isRefreshing) return;
  isRefreshing = true;
  btnRefresh.style.opacity = '0.5';

  try {
    const token = localStorage.getItem('mmx_token') || '';
    const baseUrl = localStorage.getItem('mmx_base_url') || 'https://api.minimax.io';
    const planKey = localStorage.getItem('mmx_plan_key') || '';

    if (!token) {
      throw new Error('Token no configurado');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    if (planKey) {
      headers['Token-Plan-Key'] = planKey;
    }

    const response = await fetch(`${baseUrl}/v1/token_plan/remains`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    quotaData = data;
    renderQuota(data);
    resetCountdown();
  } catch (error) {
    renderError(error.message);
  } finally {
    isRefreshing = false;
    btnRefresh.style.opacity = '1';
  }
}

function renderQuota(data) {
  const models = data.model_remains || [];

  if (models.length === 0) {
    quotaListEl.innerHTML = '<div class="no-data">No hay datos de quota disponibles</div>';
    return;
  }

  availableModels = models.map(m => m.model_name).filter(Boolean);
  localStorage.setItem('mmx_available_models', JSON.stringify(availableModels));

  const timestamp = new Date().toLocaleTimeString();
  let html = '';

  models.forEach(model => {
    const used = model.current_interval_usage_count || 0;
    const total = model.current_interval_total_count || 0;

    if (total === 0) return;

    const modelName = model.model_name || 'Unknown';
    const allowedModels = localStorage.getItem('mmx_models');
    if (allowedModels) {
      const modelList = allowedModels.split(',').map(m => m.trim().toLowerCase());
      if (!modelList.includes(modelName.toLowerCase())) return;
    }

    const remaining = total - used;
    const percentage = Math.round((used / total) * 100);

    let colorClass = 'green';
    if (percentage >= 80) colorClass = 'red';
    else if (percentage >= 50) colorClass = 'yellow';

    html += `
      <div class="model-card">
        <div class="model-name">${escapeHtml(model.model_name || 'Unknown')}</div>
        <div class="progress-bar">
          <div class="progress-fill ${colorClass}" style="width: ${percentage}%"></div>
        </div>
        <div class="model-stats">
          <span class="used">${formatNumber(used)} / ${formatNumber(total)}</span>
          <span class="remaining">${formatNumber(remaining)} restantes</span>
        </div>
      </div>
    `;
  });

  html += `<div class="timestamp">Actualizado: ${timestamp}</div>`;
  quotaListEl.innerHTML = html;
  applyOpacity();
}

function renderError(message) {
  let hint = 'Ajusta el token en Configuración (⚙)';
  if (message.includes('401') || message.includes('Failed to fetch') || message.includes('token')) {
    hint = 'Token no configurado. Haz click en ⚙ para configurarlo.';
  }
  quotaListEl.innerHTML = `<div class="error">Error: ${escapeHtml(message)}<br><small>${hint}</small></div>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function resetCountdown() {
  countdown = getRefreshInterval();
  updateCountdownDisplay();
}

function updateCountdownDisplay() {
  countdownEl.textContent = `${countdown}s`;
}

function startCountdown() {
  countdownInterval = setInterval(() => {
    countdown--;
    updateCountdownDisplay();
    if (countdown <= 0) {
      fetchQuota();
    }
  }, 1000);
}

function applyOpacity() {
  const opacity = localStorage.getItem('mmx_opacity') || 95;
  document.querySelector('.content').style.background = `rgba(26, 26, 46, ${opacity / 100})`;

  const modelOpacity = localStorage.getItem('mmx_model_opacity') || 100;
  document.querySelectorAll('.model-card').forEach(card => {
    card.style.opacity = modelOpacity / 100;
  });
}

function showConfigModal() {
  if (window.electronAPI) {
    window.electronAPI.openConfigWindow();
  }
}

quotaListEl.addEventListener('dblclick', () => showConfigModal());

document.addEventListener('DOMContentLoaded', () => {
  applyOpacity();
  startCountdown();
  fetchQuota();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  applyOpacity();
  startCountdown();
  fetchQuota();
}

if (window.electronAPI) {
  window.electronAPI.onConfigClosed(() => {
    applyOpacity();
    resetCountdown();
    fetchQuota();
  });
  window.electronAPI.onDoRefreshQuota(() => {
    fetchQuota();
  });
}