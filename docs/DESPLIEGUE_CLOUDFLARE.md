# Despliegue Cloudflare

## Compatibilidad

| Componente | Opción Cloudflare | Notas |
|------------|-------------------|-------|
| Frontend (Vite build) | **Pages** | Estático; `VITE_API_URL` al API público |
| Backend Express + WS | **No** corre nativo en Workers sin adaptación | Usar contenedor externo (Cloud Run, Fly.io, VPS) o Cloudflare Containers si el plan lo permite |
| WebSockets | Requiere origen con WS durable | Workers WebSockets tienen modelo distinto; mantener API Node |
| MySQL/PG/MSSQL/Mongo | Externos gestionados | Hyperdrive solo PG/MySQL en algunos planes; SQL Server/Mongo fuera |
| Firebase | SaaS Google | Independiente de CF |
| Secretos | Pages/Workers secrets + secretos del host API | Nunca en el repo |

## Procedimiento propuesto (no ejecutado)

1. `npm run build` en frontend → deploy Pages.
2. Desplegar backend container en proveedor compatible con Docker + cinco BDs gestionadas.
3. DNS/proxy Cloudflare al frontend; API en subdominio con SSL.
4. CORS `FRONTEND_ORIGIN` = dominio Pages.
5. Verificar `/api/health?all=1`, `/api/docs`, `wss://api.../ws`.

## Estado

**No desplegado** en esta sesión. No hay cuenta Cloudflare configurada en el repositorio.
