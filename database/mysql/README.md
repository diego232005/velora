# MySQL — `velora_betplay`

Catálogo deportivo colombiano (Liga BetPlay): clubes, jugadores, partidos seed, usuarios demo y cuentas.

## Contenido

| Archivo | Uso |
|---------|-----|
| `init.sql` | Schema completo (42 tablas) + datos demo |
| `llenar_tablas.sql` | Cargas / relleno adicional |
| `consultas_velora.sql` | Consultas de verificación académica |

## Arranque

```bash
docker compose up -d mysql
```

- Host: `localhost`
- Puerto Docker: **3307** → contenedor 3306
- Usuario: `root`
- BD: `velora_betplay`

Variables en `backend/.env`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

Health: `GET /api/health?all=1` → `engines.mysql.ok`.
