#!/usr/bin/env bash
# ==============================================================================
# Exportador de Appliance (.OVA) - Menu Solutions (Linux/macOS)
# ==============================================================================

set -e

VM_NAME="${1:-MenuSolutions-ContadorV2}"
OUTPUT_FILE="${2:-../MenuSolutions-ContadorV2.ova}"

echo "=========================================================="
echo "  Exportando VM '$VM_NAME' para appliance .OVA...         "
echo "=========================================================="

if ! command -v VBoxManage &> /dev/null; then
    echo "Erro: VBoxManage não encontrado no PATH."
    exit 1
fi

VM_STATE=$(VBoxManage showvminfo "$VM_NAME" --machinereadable | grep '^VMState=' | cut -d'=' -f2 | tr -d '"')

if [ "$VM_STATE" = "running" ]; then
    echo "==> Desligando VM..."
    VBoxManage controlvm "$VM_NAME" acpipowerbutton
    sleep 10
fi

VBoxManage export "$VM_NAME" -o "$OUTPUT_FILE" --ovf20

echo "==> Exportação concluída com sucesso: $OUTPUT_FILE"
