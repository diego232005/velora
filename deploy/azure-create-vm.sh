#!/usr/bin/env bash
# Crear VM Ubuntu barata para Velora (Azure Education / Cloud Shell).
#
# En Cloud Shell (https://shell.azure.com → Bash):
#   nano azure-create-vm.sh   # pegar este archivo
#   chmod +x azure-create-vm.sh
#   bash azure-create-vm.sh
#
# Variables opcionales:
#   RG=rg-velora LOCATION=eastus SIZE=Standard_B2s ADMIN_USER=azureuser

set -euo pipefail

RG="${RG:-rg-velora}"
LOCATION="${LOCATION:-eastus}"
VM_NAME="${VM_NAME:-vm-velora}"
# B1s es barato pero justo para 5 DBs; B2s recomendado; B2ms si MSSQL aprieta
SIZE="${SIZE:-Standard_B2s}"
ADMIN_USER="${ADMIN_USER:-azureuser}"
IMAGE="${IMAGE:-Canonical:0001-com-ubuntu-server-jammy:22_04-lts-gen2:latest}"

echo "==> Cuentas / suscripciones (elige Education si hay varias)"
az account list -o table

# Preferir suscripción con "Education", "Students" o "Azure for Students"
EDU_SUB=$(az account list --query "[?contains(name, 'Education') || contains(name, 'Students') || contains(name, 'Azure for Students')].id | [0]" -o tsv 2>/dev/null || true)
if [[ -n "${EDU_SUB:-}" ]]; then
  echo "==> Usando suscripción Education: $EDU_SUB"
  az account set --subscription "$EDU_SUB"
else
  echo "==> No detecté 'Education/Students'. Usando la suscripción actual:"
  az account show --query "{name:name, id:id, state:state}" -o table
  echo "Si no es la correcta: az account set --subscription \"NOMBRE_O_ID\""
fi

STATE=$(az account show --query state -o tsv)
if [[ "$STATE" != "Enabled" ]]; then
  echo "ERROR: la suscripción está en estado '$STATE'. Actívala en portal o pide acceso al admin."
  exit 1
fi

echo "==> Probar si el tamaño $SIZE está permitido en $LOCATION"
if ! az vm list-skus --location "$LOCATION" --size "$SIZE" --all --query "[?name=='$SIZE'] | [0].name" -o tsv | grep -q "$SIZE"; then
  echo "AVISO: $SIZE puede no estar disponible. Probando alternativas..."
  for ALT in Standard_B2s Standard_B2ms Standard_D2s_v3 Standard_B1ms Standard_DS1_v2; do
    if az vm list-skus --location "$LOCATION" --size "$ALT" --all --query "[?name=='$ALT'] | [0].name" -o tsv 2>/dev/null | grep -q "$ALT"; then
      SIZE="$ALT"
      echo "Usaré SIZE=$SIZE"
      break
    fi
  done
fi

echo "==> Resource group $RG en $LOCATION"
az group create --name "$RG" --location "$LOCATION" -o table

if [[ ! -f ~/.ssh/id_rsa.pub ]]; then
  echo "==> Generando clave SSH"
  ssh-keygen -t rsa -b 2048 -f ~/.ssh/id_rsa -N "" -q
fi

echo "==> Creando VM $VM_NAME ($SIZE)..."
set +e
CREATE_OUT=$(az vm create \
  --resource-group "$RG" \
  --name "$VM_NAME" \
  --image "$IMAGE" \
  --size "$SIZE" \
  --admin-username "$ADMIN_USER" \
  --ssh-key-values ~/.ssh/id_rsa.pub \
  --public-ip-sku Standard \
  --os-disk-size-gb 64 \
  --storage-sku StandardSSD_LRS \
  -o json 2>&1)
CREATE_RC=$?
set -e

if [[ $CREATE_RC -ne 0 ]]; then
  echo "$CREATE_OUT"
  echo ""
  echo "FALLO al crear la VM. Causas típicas en cuenta institucional:"
  echo "  1) Política: RequestDisallowedByPolicy → pide excepción o otra región (LOCATION=westus2 / centralus)"
  echo "  2) Cuota: QuotaExceeded → az vm list-usage -l $LOCATION -o table"
  echo "  3) Tamaño bloqueado → SIZE=Standard_D2s_v3 bash azure-create-vm.sh"
  echo "  4) Suscripción incorrecta → az account list -o table && az account set --subscription ID"
  exit 1
fi

echo "==> Abrir puertos 22, 80, 443"
az vm open-port --resource-group "$RG" --name "$VM_NAME" --port 22 --priority 1000 -o none
az vm open-port --resource-group "$RG" --name "$VM_NAME" --port 80 --priority 1001 -o none
az vm open-port --resource-group "$RG" --name "$VM_NAME" --port 443 --priority 1002 -o none

IP=$(az vm list-ip-addresses -g "$RG" -n "$VM_NAME" --query "[0].virtualMachine.network.publicIpAddresses[0].ipAddress" -o tsv)

echo ""
echo "OK — VM lista"
echo "  IP:  $IP"
echo "  SSH: ssh ${ADMIN_USER}@${IP}"
echo "  Clave privada en Cloud Shell: ~/.ssh/id_rsa (descárgala si vas a conectar desde tu PC)"
echo ""
echo "Siguiente: DuckDNS → esa IP, luego en la VM: sudo -E bash deploy/azure-vm-setup.sh"
echo "$IP" > /tmp/velora-vm-ip.txt
