# Plan de refactor / rediseño Velora (ejecutado)

## Alcance

| Incluido | Excluido (no inventar) |
|----------|-------------------------|
| Token cyber-neon + glass | Predicciones IA reales (solo UI demo) |
| Layout shell / home / betslip | Reescritura total del backend |
| ErrorBoundary + lazy routes | Panel admin completo |
| Hook WS cuotas | Liquidación automática nueva |
| Tests money/parlay | E2E Playwright |

## Principios

- Conservar React + Vite + Express existentes
- Datos deportivos solo vía API BetPlay
- Fallos de Postgres/Firebase no tumban la UI
- “AI Insights” etiquetado como demostración visual
