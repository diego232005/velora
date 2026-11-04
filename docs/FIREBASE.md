# Firebase

## Proyecto

- Nombre: **Velora Betplay**
- ID: `velora-betplay-660e7`
- Credenciales locales: `backend/secrets/firebase-adminsdk.json` (gitignored)

## Estado

- Service account: **cargada** (`mode: cloud`)
- Cloud Firestore API: **habilitada**
- Base Firestore: **creada y verificada** (`testFirebase` → ok, mode `cloud`)

## Uso en Velora

Notificaciones de usuario vía `pushUserNotification` → colección `notifications/{userId}/items`.
