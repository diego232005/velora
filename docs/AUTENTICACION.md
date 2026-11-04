# Autenticación

## Local (implementado)

- Login/registro MySQL (`hash_contrasena` aún en texto plano demo — riesgo documentado).
- Token opaco Bearer (`createSessionToken`) en memoria; intento de persistencia hash en SQL Server.
- Frontend guarda `{ user, token }` en storage.

## Google OAuth (en progreso)

Endpoints:

- `GET /api/oauth/providers`
- `GET /api/oauth/google/start`
- `GET /api/oauth/google/callback`

### Configurado en este entorno

- `GOOGLE_CLIENT_ID` — sí
- `GOOGLE_CLIENT_SECRET` — sí (en `backend/.env`, no versionar)
- Redirect URI obligatorio en Google Cloud Console:

```text
http://localhost:4000/api/oauth/google/callback
```

Si el botón de Google falla con `redirect_uri_mismatch`, añade esa URI exacta en el cliente OAuth (tipo Aplicación web).

### Flujo

1. Usuario pulsa “Continuar con Google” en `/login`
2. Google autentica y vuelve al callback del backend
3. Backend crea/vincula usuario en MySQL y redirige al frontend con `token` + `user`

## Microsoft OAuth

Misma estructura (`/api/oauth/microsoft/start` + callback). Faltan `MICROSOFT_CLIENT_ID` y `MICROSOFT_CLIENT_SECRET` (Entra ID → Registro de aplicaciones).

## Roles

MySQL `rol` + SQL Server `rol`/`permiso` (opcional). El registro OAuth asigna rol cliente (`id_rol=3`).
