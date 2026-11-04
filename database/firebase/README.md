# Firebase (notificaciones / sync)

Velora usa Firebase para **notificaciones push de demostración** y sincronización ligera de estados públicos (partidos en vivo), no como libro financiero.

Productos previstos:

- **Cloud Firestore** (emulador puerto 8085 en compose profile `firebase`) — colecciones `notifications/{userId}/items`, `public_match_ticks/{matchId}`
- **Firebase Auth** — opcional; la identidad canónica queda en SQL Server + MySQL
- **Realtime Database** — no usado en esta versión

Sin credenciales de proyecto, el backend opera el adaptador `firebaseStub` y registra eventos también en MongoDB.

Variables:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_USE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=127.0.0.1:8085
```
