const API_URL = 'https://api.minimax.io/v1/token_plan/remains';

let settings = {};
let countdownInterval;
let isRefreshing = false;
let quotaData = null;
let availableModels = [];

const quotaListEl = document.getElementById('quotaList');
const countdownEl = document.getElementById('countdown');
const btnRefresh = document.getElementById('btnRefresh');

const getRefreshInterval = () => settings.mmx_interval || 30;
let countdown = getRefreshInterval();

async function loadSettings() {
  if (window.electronAPI) {
    settings = await window.electronAPI.getSettings();
  } else {
    settings = JSON.parse(localStorage.getItem('mmx_settings') || '{}');
  }
  availableModels = JSON.parse(settings.mmx_available_models || '[]');
}

async function fetchQuota() {
  if (isRefreshing) return;
  isRefreshing = true;
  btnRefresh.style.opacity = '0.5';

  if (Object.keys(settings).length === 0) {
    await loadSettings();
  }

  try {
    const token = settings.mmx_token || '';
    const baseUrl = settings.mmx_base_url || 'https://api.minimax.io';

    if (!token) {
      throw new Error('Token no configurado');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

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

  if (window.electronAPI) {
    window.electronAPI.saveSettings({ mmx_available_models: JSON.stringify(availableModels) });
  }

  const timestamp = new Date().toLocaleTimeString();
  let html = '';

  models.forEach(model => {
    const modelName = model.model_name || 'Unknown';
    const allowedModels = settings.mmx_models;
    if (allowedModels) {
      const modelList = allowedModels.split(',').map(m => m.trim().toLowerCase());
      if (!modelList.includes(modelName.toLowerCase())) return;
    }

    // Nuevos campos de porcentaje (token-based billing)
    const remainingPercent = model.current_interval_remaining_percent;
    const weeklyRemainingPercent = model.current_weekly_remaining_percent;
    const intervalStatus = model.current_interval_status;
    const weeklyStatus = model.current_weekly_status;

    // Fallback a campos antiguos si no hay porcentaje
    if (remainingPercent === undefined || remainingPercent === null) {
      const total = model.current_interval_total_count || 0;
      const weeklyTotal = model.current_weekly_total_count || 0;
      if (total === 0 && weeklyTotal === 0) return;
    }

    const usedPercent = remainingPercent !== undefined && remainingPercent !== null
      ? Math.max(0, Math.min(100, 100 - remainingPercent))
      : 0;

    let colorClass = 'green';
    if (usedPercent >= 80) colorClass = 'red';
    else if (usedPercent >= 50) colorClass = 'yellow';

    const timeRange = `${formatTimestamp(model.start_time)}-${formatTimestamp(model.end_time)}`;
    const resetInfo = formatRemainsTime(model.remains_time);
    const weeklyResetInfo = formatRemainsTime(model.weekly_remains_time);

    const isExhausted = intervalStatus === 3;
    const statusText = isExhausted ? '<span class="status-exhausted">· Sin cuota</span>' : '';

    const showWeekly = weeklyRemainingPercent !== undefined && weeklyRemainingPercent !== null && weeklyStatus !== 3;

    html += `
      <div class="model-card">
        <div class="model-name">${escapeHtml(modelName)} ${statusText}</div>
        <div class="model-time">${timeRange}(UTC) · ${resetInfo}</div>
        <div class="progress-bar">
          <div class="progress-fill ${colorClass}" style="width: ${usedPercent}%"></div>
        </div>
        <div class="model-stats">
          <span class="used">${remainingPercent || 0}% restante</span>
        </div>
        ${showWeekly ? `
        <div class="model-weekly">
          <span class="weekly-label">Weekly</span>
          <span class="weekly-stats">${weeklyRemainingPercent}% restante · ${weeklyResetInfo}</span>
        </div>
        ` : ''}
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

function formatTimestamp(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const mins = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

function formatRemainsTime(ms) {
  if (!ms) return '';
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `Resetea: ${days}d ${hours % 24}h`;
  }
  return `Resetea: ${hours}h ${mins}m`;
}

function formatPeriod(weeklyStart, weeklyEnd) {
  if (!weeklyStart || !weeklyEnd) return '';
  const start = formatTimestamp(weeklyStart);
  const end = formatTimestamp(weeklyEnd);
  if (start === '00:00' && end === '24:00') return 'Daily';
  return '';
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
  const opacity = settings.mmx_opacity || 95;
  document.querySelector('.content').style.background = `rgba(26, 26, 46, ${opacity / 100})`;

  const modelOpacity = settings.mmx_model_opacity || 100;
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
  window.electronAPI.onConfigClosed(async () => {
    await loadSettings();
    applyOpacity();
    resetCountdown();
    fetchQuota();
  });
  window.electronAPI.onDoRefreshQuota(() => {
    fetchQuota();
  });
  window.electronAPI.onSettingsUpdated(async (newSettings) => {
    settings = { ...settings, ...newSettings };
    availableModels = JSON.parse(settings.mmx_available_models || '[]');
    applyOpacity();
    resetCountdown();
  });
}