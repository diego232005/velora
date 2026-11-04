# Auditoría inicial — Velora (BetPlay Colombia)

**Fecha:** 2026-10-19  
**Método:** inspección de manifiestos, código fuente, SQL y runtime del entorno local.  
**Alcance:** repositorio `bd/` (frontend + backend + database). No se inventaron resultados de pruebas.

---

## 1. Stack detectado

| Capa | Tecnología | Evidencia |
|------|------------|-----------|
| Backend language | JavaScript (ES modules) | `backend/package.json` `"type": "module"`, `src/**/*.js` |
| Backend framework | Express 4.21 | `express` en dependencias; `server.js` |
| Runtime | Node.js ≥18.18 (local: **v24.19.0**) | `engines` + `node -v` |
| Package manager | npm 11.17.0 | `package-lock.json` |
| Acceso a datos | `mysql2` pool (sin ORM) | `backend/src/db.js` |
| Frontend | React 18.3 + Vite 6 | `frontend/package.json` |
| Routing UI | react-router-dom 6 | `AppRoutes.jsx` |
| Iconos | lucide-react | dependencias |
| Excel | xlsx + multer | bulk upload |
| BD académica actual | **Solo MySQL** (`velora_betplay`, 42 tablas) | `database/velora_betplay.sql` |
| SQL Server / PostgreSQL / MongoDB / Firebase | **No presentes** | sin dependencias, configs ni Docker |
| Docker | **No configurado**; CLI Docker **no instalada** en el host | búsqueda + `docker --version` falló |
| Swagger/OpenAPI | **Ausente** | — |
| WebSockets | **Ausente** | — |
| OAuth Google/Microsoft | **Ausente** | — |
| Wompi | **Ausente** (pagos demo PSE/ACH en SQL) | — |
| Google Drive | **Ausente** | — |
| Framework de pruebas | **Ausente** | sin `*.test.*` / vitest / jest |
| Cloudflare | **Ausente** | — |

---

## 2. Arquitectura encontrada

```text
bd/
├── frontend/          React + Vite (UI demo + auth parcial)
├── backend/           Express API (auth, catálogo, carga masiva)
├── database/          Script MySQL monolítico + seeds
├── README.md
└── docs/              (creado en esta fase)
```

**Backend actual**

- `server.js` — CORS, JSON, health, monta routers
- `db.js` — pool MySQL
- `routes/auth.js` — login, register, recover, reset-password
- `routes/catalog.js` — ciudades, tipos documento
- `routes/bulk.js` — Excel clientes
- `seedUsers.js` — reseembra usuarios demo

**Frontend actual**

- Rutas: `/`, `/login`, `/register`, `/forgot-password`, `/carga-masiva`
- Home consume **datos estáticos ficticios** (`liveEvents.js`, `upcomingEvents.js`, `leagues.js`) con ligas europeas, baloncesto, tenis, esports (fuera de alcance)
- Cupón: `placeDemoBet()` — solo mensaje visual, **sin API**
- Auth: login/registro contra backend; sesión en `sessionStorage`/`localStorage` **sin tokens**

---

## 3. Estado del backend

| Área | Estado | Notas |
|------|--------|-------|
| Health + MySQL ping | Implementado | No verificado en runtime (API apagada en auditoría) |
| Login / registro / recover | Implementado, necesita correcciones | Contraseñas en texto plano; sin JWT/sesión servidor |
| Catálogo registro | Implementado | Depende de MySQL |
| Carga masiva Excel | Implementado | Inserta usuario/perfil/cuenta |
| Partidos / cuotas / apuestas | **No expuesto** por API | Datos existen en MySQL seed |
| Billetera / movimientos | **No expuesto** | Tablas en SQL |
| Swagger | No implementado | — |
| WebSockets | No implementado | — |
| Multi-BD | No implementado | — |
| Rate limiting / bcrypt | Ausente | Riesgo seguridad |

---

## 4. Estado del frontend

| Pantalla / feature | Estado |
|--------------------|--------|
| Home / live / upcoming | Parcial — datos fake internacionales |
| Cupón de apuestas | Parcial — demo local sin backend |
| Login / registro / forgot | Funciona con API (si MySQL está) |
| Carga masiva | Integrado con `/api/bulk` |
| Detalle partido, wallet, historial, admin, OAuth, notificaciones | **No implementados** |
| Juego responsable / legales | Componentes UI parciales |

---

## 5. Estado de las cinco bases (requisito académico)

| Motor | Estado | Fuente de verdad propuesta |
|-------|--------|----------------------------|
| MySQL | Schema + seed Liga BetPlay (20 clubes, 40 jugadores demo, 10 partidos) | Catálogo deportivo (clubes, jugadores, competiciones) |
| SQL Server | **No existe** | Identidad: usuarios, roles, permisos, perfiles |
| PostgreSQL | **No existe** | Motor apuestas: partidos operativos, mercados, cuotas, cupones, liquidaciones, libro |
| MongoDB | **No existe** | Eventos de dominio, auditoría documental |
| Firebase | **No existe** | Notificaciones / sync tiempo real |

**Relaciones actuales:** solo FKs MySQL. Sin sincronización entre motores.  
**Migraciones versionadas:** no hay (script `DROP DATABASE` + recreate).  
**Índices UNIQUE** en correo/documento: ausentes en SQL.

---

## 6. Datos deportivos MySQL (seed verificado en archivo)

| Entidad | Cantidad en `velora_betplay.sql` |
|----------|----------------------------------|
| Clubes Primera A | 20 |
| Jugadores | 40 (nombres demo; no inventar más como “oficiales”) |
| Partidos | 10 |
| Mercados | 6 |
| Apuestas demo | 3 |
| Usuarios | 7 |

Alcance SQL: **solo fútbol colombiano / Liga BetPlay**.  
Frontend: **contradice** el alcance (datos ficticios internacionales).

---

## 7. Integraciones existentes

- Ninguna integración externa real (OAuth, Wompi, Drive, Firebase, APIs deportivas).
- Pagos en seed: PSE / ACH Colombia (tablas), no Wompi.

---

## 8. Errores e inconsistencias identificados

1. Frontend muestra deportes/ligas fuera de Colombia.
2. Cupón no confirma apuestas en servidor.
3. Contraseñas almacenadas y comparadas en texto plano (`hash_contrasena`).
4. Sin autenticación por token; sesión solo en navegador.
5. Solo 1 de 5 bases de datos.
6. Sin Docker / Swagger / WebSockets / OAuth / Wompi / Drive / tests.
7. `DECIMAL(12,2)` para dinero (aceptable vs float JS; falta capa de centavos enteros en API).
8. Faltan UNIQUE en correo y documento.
9. Docker CLI no disponible en el entorno de desarrollo actual → bloquea verificación de compose hasta instalación.
10. Backend y frontend **apagados** durante la auditoría; health no pudo comprobarse.

---

## 9. Riesgos de seguridad

| Riesgo | Severidad |
|--------|-----------|
| Contraseñas en claro | Crítica |
| Sin rate limit en login | Alta |
| Sin tokens / CSRF OAuth | Alta |
| Secretos en `.env` con password default `0000` | Media (dev) |
| Confiar en cuotas/montos del frontend (hoy demo) | Alta si se habilita apuestas sin validar servidor |
| Bulk upload sin rol admin | Alta |

---

## 10. Funcionalidades faltantes (priorizadas)

**P0 — Bloquean el requisito académico / demo coherente**

1. Cinco bases de datos reales + compose + docs de sync  
2. API de partidos/mercados/cuotas desde datos BetPlay  
3. Confirmación de apuestas + billetera en servidor  
4. Sustituir datos fake del frontend por API colombiana  
5. Swagger/OpenAPI  
6. WebSockets (cuotas / estados)  
7. Dockerfiles + compose  

**P1 — Integraciones**

8. Wompi sandbox (adapter + webhooks idempotentes)  
9. OAuth Google + Microsoft (env + callbacks)  
10. Firebase notificaciones  
11. Google Drive para assets  

**P2 — Calidad**

12. bcrypt + sesiones  
13. Tests automatizados  
14. Panel admin / reportes  
15. Docs Cloudflare + seguridad + pruebas  

---

## 11. Plan de corrección priorizado (ejecución)

1. Documentar auditoría (este archivo) ✅  
2. Introducir capa multi-BD + schemas + docker-compose  
3. Expansión backend: sports, bets, wallet, swagger, ws  
4. Alinear frontend a Liga BetPlay vía API  
5. Adapters Wompi / OAuth / Drive / Firebase (credenciales = bloqueo humano)  
6. Tests + hardening seguridad  
7. Docs de entrega y procedimiento Cloudflare  

**Operaciones destructivas diferidas:** no se ejecutará `DROP DATABASE` automático en producción; migraciones nuevas serán aditivas.

---

## 12. Bloqueos que requieren intervención humana

| Bloqueo | Acción requerida |
|---------|------------------|
| Docker Desktop / Engine no instalado | Instalar Docker para levantar 5 BDs locales |
| Credenciales Wompi sandbox | `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET` |
| OAuth Google / Microsoft | Client IDs y secrets en consolas de desarrollador |
| Firebase proyecto | `FIREBASE_*` o emulador + service account |
| Google Drive API | OAuth o service account + folder ID |
| API deportiva externa (opcional) | Si se importa más allá del seed; sin credenciales solo queda seed MySQL |
| MySQL local en ejecución | Verificar servicio + ejecutar `velora_betplay.sql` |

---

*Siguiente paso inmediato: implementar arquitectura de datos y ampliar backend/frontend sin destruir el schema MySQL existente.*

---

## 13. Verificación runtime (misma sesión, post-implementación parcial)

| Comprobación | Resultado |
|--------------|-----------|
| MySQL `velora_betplay` | **OK** — conectado |
| `GET /api/health` | **OK** |
| `GET /api/sports/matches?status=upcoming` | **OK** — 4 partidos |
| `GET /api/sports/matches?status=live` | **OK** — 2 partidos |
| `GET /api/sports/clubs` | **OK** — 10 clubes en BD local actual (seed vivo ≠ 20 del SQL archivo) |
| Login `laura@correo.com` / `clave_123` | **OK** — token Bearer emitido |
| Swagger `/api/docs` + `/api/openapi.json` | **OK** HTTP 200 |
| PostgreSQL | **No disponible** en el host |
| MongoDB | **No disponible** (writes con timeout 1.5s, no bloquean login) |
| SQL Server / Firebase / Docker | **No verificados** (ausentes) |
| Unit tests `npm test` | **2/2 pass** (money) |

**Nota:** la BD MySQL local tiene usuarios distintos al texto del `velora_betplay.sql` del repo (`laura@correo.com` / `clave_123` vs `laura.gomez@correo.com` / `clave_demo_123`). No se sobrescribió la BD del usuario.
