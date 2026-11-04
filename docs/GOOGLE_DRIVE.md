# Google Drive

## Configurado

- `GOOGLE_DRIVE_API_KEY` — sí (en `backend/.env`)
- `GOOGLE_DRIVE_FOLDER_ID` — `1MxlQfwYPbrYntfOZ1JH9OK81DCWWxEQu`

## Endpoints

- `GET /api/drive/status`
- `GET /api/drive/assets/:kind` — `shields` | `players` | `competitions` | `all`

## Carpeta actual

`GOOGLE_DRIVE_FOLDER_ID=1MxlQfwYPbrYntfOZ1JH9OK81DCWWxEQu`  
Nombre verificado: **Velora Betplay** (acceso service account OK).

Si `GET /api/drive/assets/all` devuelve `items: []`, la carpeta está vacía: sube escudos/fotos.

## Acceso (importante)

El backend intenta listar con la **service account** de Firebase. Debes compartir la carpeta con:

```text
firebase-adminsdk-fbsvc@velora-betplay-660e7.iam.gserviceaccount.com
```

Rol: **Lector**.

También puedes dejarla como “Cualquiera con el enlace → Lector” (sirve para la API key).

Habilita **Google Drive API** en el mismo proyecto Cloud si aún no está.

Nombres sugeridos para filtros: `escudo`, `jugador`, `competicion`.

## Notas

- `webViewLink` no siempre sirve como `<img src>`
- La API expone `directUrl` / `previewUrl` de ayuda; prueba permisos reales antes de la demo
