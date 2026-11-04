# Tunnelmole (URLs públicas)

## Instalar dependencias (una vez)

```bash
cd "c:\Users\Diego\Desktop\Bases de datos\bd"
npm install
```

## Arranque

```bash
# Solo local (localhost)
npm run dev

# Local + túneles públicos
npm run dev:public
```

## URLs estáticas (misma cada vez)

En el `.env` de la raíz del repo:

```env
TMOLE_API_DOMAIN=velora-api.tunnelmole.net
TMOLE_WEB_DOMAIN=velora-web.tunnelmole.net
```

Eso ejecuta:

```bash
tmole 4000 as velora-api.tunnelmole.net
tmole 5173 as velora-web.tunnelmole.net
```

**Importante:** en el servicio gratuito hosted, los subdominios personalizados suelen requerir [suscripción Tunnelmole](https://tunnelmole.com/pricing). Sin ella el comando puede fallar o no reservar el nombre.

Sin dominios fijos (deja `TMOLE_*_DOMAIN` vacío): Tunnelmole genera URL aleatoria en cada inicio.

## Qué configurar una sola vez (con URLs fijas)

### Wompi — URL de eventos

```text
https://velora-api.tunnelmole.net/api/payments/wompi/webhook
```

### Google OAuth — redirect URI

```text
https://velora-api.tunnelmole.net/api/oauth/google/callback
```

También en `backend/.env`:

```env
FRONTEND_ORIGIN=https://velora-web.tunnelmole.net
GOOGLE_REDIRECT_URI=https://velora-api.tunnelmole.net/api/oauth/google/callback
```

## Solo el túnel del API (Wompi/OAuth)

Si no necesitas el front público:

```bash
npm run tunnel:api
```
