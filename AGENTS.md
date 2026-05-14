# AGENTS.md - MMX Quota Monitor

## Proyecto
- **Ubicación**: `C:\Users\Gener Can\Documents\Proyectos\mmx-quota-monitor`
- **Tipo**: App Electron para Windows
- **Objetivo**: Monitor de cuotas API MiniMax en tiempo real

## Estructura de archivos
```
src/
  main.js          - Proceso principal Electron, BrowserWindow, Tray, IPC
  preload.js       - Bridge seguro contextBridge/ipcRenderer
  renderer/
    index.html     - UI principal
    quota-checker.js - Lógica de fetching y renderizado
    config.html    - Ventana de configuración
    config.js      - Lógica de configuración
    styles.css     - Estilos UI
    assets/icon.png - Icono de bandeja
```

## Reglas de desarrollo

### Antes de cualquier tarea
1. Cargar skill `token-efficient-workflow`
2. Hacer búsqueda con `code-search` antes de leer archivos completos
3. Leer solo fragmentos necesarios

### Al resolver problemas
1. Identificar el problema exacto
2. Implementar solución mínima
3. Verificar que funciona
4. **Actualizar memoria** con:
   - Problema enfrentado
   - Causa raíz
   - Solución implementada
   - Detalles técnicos (IPs, variables, funciones, etc.)

### Al agregar features
1. Planificar cambio mínimo necesario
2. Implementar y probar
3. Commit con `commit-msg`
4. Actualizar memoria

### Commits
- Usar skill `commit-msg`
- Mensaje en español, sin prefijos (feat:, fix:, etc.)
- Título claro con verbo imperativo
- Body explicando el qué y por qué

## Configuración actual

### electron-store (persistido)
- `mmx_token` - API Token Bearer
- `mmx_base_url` - URL base API (default: https://api.minimax.io)
- `mmx_plan_key` - Token Plan Key (header opcional)
- `mmx_interval` - Intervalo refresh en segundos (default: 30)
- `mmx_opacity` - Opacidad ventana 50-100 (default: 95)
- `mmx_model_opacity` - Opacidad modelos 20-100 (default: 100)
- `mmx_models` - Lista de modelos a mostrar (vacío = todos)
- `mmx_available_models` - Modelos disponibles de la API
- `windowBounds` - Posición y tamaño de ventana

### IPC Channels
**Main → Renderer:**
- `do-refresh-quota` - Forzar refresh
- `settings-updated` - Notificar cambios en settings
- `config-closed` - Notificar cierre de config

**Renderer → Main:**
- `close-window` - Cerrar app completamente
- `hide-window` - Ocultar ventana
- `open-config-window` - Abrir settings
- `close-config-window` - Cerrar settings
- `save-settings` - Guardar settings en electron-store
- `get-settings` - Obtener settings (invoke)
- `refresh-quota` - Request refresh

### Flujo de datos
1. `fetchQuota()` → llama API con token/headers
2. `renderQuota()` → filtra modelos 0/0, aplica filter, renderiza HTML
3. Settings guardados via `electronAPI.saveSettings()`
4. Settings cargados via `electronAPI.getSettings()`

## Tips de debug
- Abrir DevTools: `F12` o `Ctrl+Shift+I`
- Revisar consola para errores JS
- electron-store guarda en: `%APPDATA%/mmx-quota-monitor/`

## Comandos útiles
```bash
npm start      # Ejecutar app
npm run build  # Construir exe
git log        # Ver commits
```