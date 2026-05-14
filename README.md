# MMX Quota Monitor

Monitor de cuotas API MiniMax en tiempo real para Windows.

## Instalación

```bash
npm install
```

## Uso

```bash
npm start        # Ejecutar app
npm run build    # Construir exe
```

## Funcionamiento

### Barra de estado
- **Countdown**: Tiempo restante hasta el próximo refresh automático
- **Botón refresh**: Forza un refresh manual de los datos

### Lista de modelos
Cada modelo muestra:
- Nombre del modelo
- Rango horario (start - end UTC)
- Tiempo hasta reseteo
- Barra de progreso de uso
- Estadísticas de uso:
  - Uso actual / total en el período actual
  - Estadísticas semanales (si están disponibles)

### Colores de barras
- Verde: Uso < 50%
- Amarillo: Uso 50-79%
- Rojo: Uso >= 80%

### Modelos ocultos
Los modelos con `0/0` en uso tanto en período actual como semanal no se muestran.

## Atajos

| Atajo | Acción |
|-------|--------|
| `Ctrl+Shift+M` | Toggle modo transparencia |
| Doble clic | Abrir configuración |

## Modo transparencia

Cuando está activo:
- La ventana se vuelve casi invisible (15% opacidad)
- Los eventos de mouse atraviesan la ventana
- Para desactivar: `Ctrl+Shift+M`

## Configuración

Haz doble clic para abrir la ventana de configuración:

- **API Token**: Token Bearer de MiniMax
- **URL Base**: `https://api.minimax.io` (global) o `https://api.minimaxi.com` (CN)
- **Intervalo**: Frecuencia de refresh en segundos
- **Opacidad**: Opacidad de la ventana (50-100%)
- **Opacidad modelos**: Opacidad de las tarjetas de modelos (20-100%)
- **Filtrar modelos**: Lista de modelos a mostrar (vacío = todos)