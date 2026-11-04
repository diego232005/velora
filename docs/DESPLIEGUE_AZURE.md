# Despliegue Azure Education + DuckDNS + Caddy

Guía para publicar Velora (frontend, API y 5 motores en Docker) en una VM Ubuntu con dominio gratis DuckDNS y HTTPS automático (Let’s Encrypt vía Caddy).

## Arquitectura

```
Usuario → https://<subdominio>.duckdns.org
       → Caddy :443
         ├─ /           → frontend (nginx SPA)
         ├─ /api/*      → backend :4000
         ├─ /uploads/*  → backend :4000
         └─ /ws         → backend :4000
Backend → mysql | postgres | mssql | mongo | Firebase cloud | Wompi
```

Los puertos de bases de datos **no** se publican a Internet (solo red Docker interna).

## Coste orientativo (créditos Education)

| Recurso | Nota |
|---------|------|
| VM Standard_B2s (2 vCPU / 4 GB) | ~15–25 USD/mes; usar **B2ms** si MSSQL aprieta RAM |
| Disco OS 30–64 GB + IP pública | Incluido en la VM |
| Con ~100 USD Education | Varios meses de demo académica |

---

## 1. Crear la VM por consola (recomendado)

No hace falta el portal gráfico. Usa **Azure Cloud Shell** (tiene `az` instalado) o Azure CLI en tu PC.

### Opción A — Cloud Shell (sin instalar nada)

1. Entra a [https://shell.azure.com](https://shell.azure.com) (o el icono `>_` en el portal).
2. Elige **Bash**.
3. Sube el script o pégalo:

```bash
# Pegar contenido de deploy/azure-create-vm.sh, o clonarlo si el repo es público
curl -fsSL -o azure-create-vm.sh "RAW_URL_OPCIONAL"
# o crea el archivo a mano y:
chmod +x azure-create-vm.sh
RG=rg-velora LOCATION=eastus SIZE=Standard_B2s bash azure-create-vm.sh
```

El script:

- Crea resource group + VM Ubuntu 22.04
- Abre NSG **22 / 80 / 443**
- Imprime la **IP pública** y el comando `ssh`

Comandos equivalentes a mano:

```bash
az group create -n rg-velora -l eastus

az vm create \
  -g rg-velora -n vm-velora \
  --image Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --os-disk-size-gb 64

az vm open-port -g rg-velora -n vm-velora --port 22 --priority 1000
az vm open-port -g rg-velora -n vm-velora --port 80 --priority 1001
az vm open-port -g rg-velora -n vm-velora --port 443 --priority 1002

az vm list-ip-addresses -g rg-velora -n vm-velora -o table
```

Luego:

```bash
ssh azureuser@<IP_PUBLICA>
```

### Opción B — Portal (manual)

1. Portal → **Create a resource** → **Virtual machine**.
2. Ubuntu 22.04 LTS, size **B2s** (o **B2ms**), SSH key, disco 30–64 GB.
3. NSG: permitir **22, 80, 443**. No abrir puertos de BD.
4. Anotar IP pública.

### Firewall dentro de la VM

`deploy/azure-vm-setup.sh` habilita UFW 22/80/443. Sin script:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

> **Nota:** Azure Cloud Shell crea la VM y abre puertos; el stack Docker (Compose + Caddy) se levanta **dentro de la VM** por SSH (`azure-vm-setup.sh`). No es un “Deploy to App Service” de un clic: con 5 motores en contenedores la VM es el camino barato con créditos Education.

---


## 2. DuckDNS

1. Entra en [https://www.duckdns.org](https://www.duckdns.org) e inicia sesión.
2. Crea un subdominio, ej. `velora-betplay` → `velora-betplay.duckdns.org`.
3. Pon la **IP pública** de la VM y guarda.
4. Copia el **token** de la cuenta.

El cron del script de bootstrap refresca la IP cada 5 minutos.

---

## 3. Subir el proyecto a la VM

Desde tu PC (PowerShell), con la IP de Azure:

```powershell
scp -r . azureuser@<IP_PUBLICA>:/tmp/velora-src
```

En la VM:

```bash
sudo mkdir -p /opt/velora
sudo rsync -a /tmp/velora-src/ /opt/velora/
cd /opt/velora
```

Asegura secretos Firebase (si aplica):

```bash
# En el PC, copia el JSON del service account a backend/secrets/
# En la VM debe existir:
ls /opt/velora/backend/secrets/firebase-adminsdk.json
```

---

## 4. Variables de entorno

### Raíz: `.env.prod`

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Rellena al menos:

```env
DOMAIN=velora-betplay.duckdns.org
DUCKDNS_TOKEN=tu-token
DUCKDNS_SUBDOMAIN=velora-betplay
MYSQL_ROOT_PASSWORD=...
POSTGRES_PASSWORD=...
MSSQL_SA_PASSWORD=...
```

### Backend: `backend/.env.production`

```bash
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
```

- Sustituye `TU-SUBDOMINIO.duckdns.org` por tu dominio real.
- Copia claves Wompi / Google OAuth / Firebase desde tu `.env` local.
- Alinea passwords MySQL/Postgres/MSSQL con `.env.prod`.

---

## 5. Redirects OAuth y Wompi (consolas externas)

Actualiza **antes** de probar login/pagos en producción:

| Servicio | Qué configurar |
|----------|----------------|
| **Google Cloud OAuth** | Authorized redirect URI: `https://<dominio>/api/oauth/google/callback` |
| **Google OAuth** | Authorized JavaScript origins: `https://<dominio>` |
| **Wompi** | Redirect / URL de retorno: `https://<dominio>/billetera` |
| **Wompi webhook** (si usas eventos) | `https://<dominio>/api/payments/wompi/webhook` (o la ruta que uses) |
| **Env backend** | `FRONTEND_ORIGIN`, `PUBLIC_FRONTEND_ORIGIN`, `WOMPI_REDIRECT_URL`, `GOOGLE_REDIRECT_URI` con `https://...` |

Microsoft OAuth sigue fuera de alcance hasta Entra ID.

---

## 6. Bootstrap automático

```bash
cd /opt/velora
export DOMAIN=velora-betplay.duckdns.org
export DUCKDNS_TOKEN=tu-token
export DUCKDNS_SUBDOMAIN=velora-betplay
sudo -E bash deploy/azure-vm-setup.sh
```

El script instala Docker + Compose, UFW, cron DuckDNS y ejecuta:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Manual (sin script)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

---

## 7. Checklist de verificación (post-deploy)

Marca cada ítem tras el primer `up`:

### Infra y HTTPS

- [ ] `curl -I https://<dominio>/` → **200** (HTML de la SPA)
- [ ] Certificado Let’s Encrypt válido (candado en el navegador; Caddy lo emite solo)
- [ ] `http://<dominio>/` redirige a HTTPS
- [ ] Puertos DB **no** accesibles desde Internet (`Test-NetConnection <IP> -Port 3306` debe fallar)

### API y bases

- [ ] `curl -s "https://<dominio>/api/health?all=1"` → JSON con motores en estado ok (MySQL, Postgres, MSSQL, Mongo; Firebase según config)
- [ ] `docker compose -f docker-compose.prod.yml ps` → `caddy`, `frontend`, `backend` y DBs `running`/`healthy`
- [ ] Logs sin bucle de crash: `docker compose -f docker-compose.prod.yml logs --tail=80 backend`

### UI y auth

- [ ] Abrir `https://<dominio>/` → login / home cargan
- [ ] Login cliente demo (usuario/contraseña) funciona
- [ ] Rutas SPA profundas (`/billetera`, `/deportes`) no dan 404 al refrescar (nginx `try_files`)
- [ ] Google OAuth (si configurado): flujo completa y vuelve a `https://<dominio>/...`

### Wompi y tiempo real

- [ ] Desde billetera, iniciar depósito sandbox → redirect vuelve a `https://<dominio>/billetera`
- [ ] Tras pago aprobado (o simulación), saldo/transacción se refleja
- [ ] WebSocket odds: en DevTools → Network → WS a `wss://<dominio>/ws` conecta

### Medios

- [ ] Escudos / imágenes vía `/api/drive/...` o `/uploads/...` cargan por HTTPS same-origin

Si algo falla, orden típico de debug: NSG/UFW → DuckDNS IP → logs `caddy` (cert) → logs `backend` (DB/env) → redirects en consolas Google/Wompi.

---

## 8. Comandos útiles

```bash
cd /opt/velora
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml logs -f caddy backend
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml down
```

Actualizar código:

```bash
# tras rsync/git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

---

## Criterio de éxito

1. `https://<tu>.duckdns.org` carga la UI.
2. `https://<tu>.duckdns.org/api/health?all=1` reporta motores ok.
3. Login cliente + depósito/apuesta demo funcionan contra el dominio HTTPS.
