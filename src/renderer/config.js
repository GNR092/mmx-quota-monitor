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

function closeConfig() {
  if (window.electronAPI) {
    window.electronAPI.closeConfigWindow();
  } else {
    window.close();
  }
}

btnConfigClose.addEventListener('click', closeConfig);
btnCancel.addEventListener('click', closeConfig);

inputModelOpacity.addEventListener('input', () => {
  modelOpacityValue.textContent = inputModelOpacity.value;
});

function populateModelList() {
  const availableModels = JSON.parse(localStorage.getItem('mmx_available_models') || '[]');
  const selectedModels = (localStorage.getItem('mmx_models') || '').split(',').map(m => m.trim().toLowerCase()).filter(Boolean);

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

populateModelList();

btnSave.addEventListener('click', () => {
  localStorage.setItem('mmx_token', inputToken.value);
  localStorage.setItem('mmx_base_url', inputBaseUrl.value);
  localStorage.setItem('mmx_plan_key', inputPlanKey.value);
  localStorage.setItem('mmx_interval', inputInterval.value);
  localStorage.setItem('mmx_opacity', inputOpacity.value);
  localStorage.setItem('mmx_model_opacity', inputModelOpacity.value);

  const checked = Array.from(modelFilterList.querySelectorAll('input:checked')).map(i => i.dataset.model);
  localStorage.setItem('mmx_models', checked.length === availableModels.length ? '' : checked.join(','));

  if (window.electronAPI) {
    window.electronAPI.closeConfigWindow();
  } else {
    window.close();
  }
});

btnCancel.addEventListener('click', () => {
  if (window.electronAPI) {
    window.electronAPI.closeConfigWindow();
  } else {
    window.close();
  }
});