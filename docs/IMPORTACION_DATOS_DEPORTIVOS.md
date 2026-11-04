# Importación de datos deportivos

## Alcance

Únicamente fútbol colombiano definido en el proyecto (Liga BetPlay DIMAYOR / seed actual).

## Fuente actual verificada

| Fuente | Estado | Contenido |
|--------|--------|-----------|
| `database/mysql/init.sql` | **Usada** | 20 clubes, 40 jugadores demo, 10 partidos, mercados 1X2/BTTS |
| API deportiva externa | **No configurada** | No se ha importado nada adicional |

Los jugadores del seed incluyen etiquetas `Demo` en algunos apellidos: son datos de demostración académica, no un plantel oficial certificado.

## Proceso implementado

1. Validación estructural en MySQL (FKs).
2. Sync a PostgreSQL vía `syncSportsFromMysqlToPostgres` (upsert, historial de cuotas).
3. Evento Mongo `sports.synced`.
4. No se inventan clubes/partidos en el sync.

## Si se añade API externa

Variables sugeridas (no inventadas como activas):

```env
SPORTS_API_BASE_URL=
SPORTS_API_KEY=
```

El importador debe: validar, deduplicar, actualizar, preservar historial, registrar errores en `import_runs` (Mongo) y reportar insertados/actualizados/rechazados.

## Limpieza de registros extranjeros

En MySQL seed: **no hay ligas extranjeras**.  
En frontend legado: `liveEvents.js` / `upcomingEvents.js` contenían deportes internacionales — **ya no alimentan Home**; Home usa la API. Los archivos estáticos quedan obsoletos y no deben presentarse como datos reales.
