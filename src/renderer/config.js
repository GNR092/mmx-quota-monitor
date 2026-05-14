const inputToken = document.getElementById('configToken');
const inputBaseUrl = document.getElementById('configBaseUrl');
const inputPlanKey = document.getElementById('configPlanKey');
const inputInterval = document.getElementById('configInterval');
const inputOpacity = document.getElementById('configOpacity');
const opacityValue = document.getElementById('opacityValue');
const inputModelOpacity = document.getElementById('configModelOpacity');
const modelOpacityValue = document.getElementById('modelOpacityValue');
const modelFilterList = document.getElementById('modelFilterList');
const btnSave = document.getElementById('btnSaveConfig');
const btnCancel = document.getElementById('btnCancelConfig');
const btnConfigClose = document.getElementById('btnConfigClose');

let availableModels = [];
let currentSettings = {};

async function loadSettings() {
  if (window.electronAPI) {
    currentSettings = await window.electronAPI.getSettings();
  } else {
    currentSettings = JSON.parse(localStorage.getItem('mmx_settings') || '{}');
  }

  inputToken.value = currentSettings.mmx_token || '';
  inputBaseUrl.value = currentSettings.mmx_base_url || 'https://api.minimax.io';
  inputPlanKey.value = currentSettings.mmx_plan_key || '';
  inputInterval.value = currentSettings.mmx_interval || '30';
  inputOpacity.value = currentSettings.mmx_opacity || 95;
  opacityValue.textContent = inputOpacity.value;
  inputModelOpacity.value = currentSettings.mmx_model_opacity || 100;
  modelOpacityValue.textContent = inputModelOpacity.value;

  availableModels = JSON.parse(currentSettings.mmx_available_models || '[]');
  populateModelList();
}

function populateModelList() {
  const selectedModels = (currentSettings.mmx_models || '').split(',').map(m => m.trim().toLowerCase()).filter(Boolean);

  modelFilterList.innerHTML = '';

  if (availableModels.length === 0) {
    modelFilterList.innerHTML = '<div style="font-size:11px;color:#888">Carga las cuotas primero</div>';
  } else {
    availableModels.forEach(modelName => {
      const isSelected = selectedModels.length === 0 || selectedModels.includes(modelName.toLowerCase());
      const item = document.createElement('label');
      item.className = 'model-filter-item';
      item.innerHTML = `<input type="checkbox" data-model="${modelName}" ${isSelected ? 'checked' : ''}> ${modelName}`;
      modelFilterList.appendChild(item);
    });
  }
}

loadSettings();

function closeConfig() {
  if (window.electronAPI) {
    window.electronAPI.closeConfigWindow();
  } else {
    window.close();
  }
}

btnConfigClose.addEventListener('click', closeConfig);
btnCancel.addEventListener('click', closeConfig);

inputOpacity.addEventListener('input', () => {
  opacityValue.textContent = inputOpacity.value;
});

inputModelOpacity.addEventListener('input', () => {
  modelOpacityValue.textContent = inputModelOpacity.value;
});

btnSave.addEventListener('click', () => {
  const settings = {
    mmx_token: inputToken.value,
    mmx_base_url: inputBaseUrl.value,
    mmx_plan_key: inputPlanKey.value,
    mmx_interval: parseInt(inputInterval.value) || 30,
    mmx_opacity: parseInt(inputOpacity.value) || 95,
    mmx_model_opacity: parseInt(inputModelOpacity.value) || 100
  };

  const checked = Array.from(modelFilterList.querySelectorAll('input:checked')).map(i => i.dataset.model);
  settings.mmx_models = checked.length === availableModels.length ? '' : checked.join(',');

  if (window.electronAPI) {
    window.electronAPI.saveSettings(settings);
    window.electronAPI.closeConfigWindow();
  } else {
    localStorage.setItem('mmx_settings', JSON.stringify(settings));
    window.close();
  }
});