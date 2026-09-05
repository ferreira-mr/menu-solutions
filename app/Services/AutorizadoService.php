<?php

namespace App\Services;

use App\Enums\AutorizadoStatus;
use App\Models\Autorizado;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AutorizadoService
{
    /**
     * Lista autorizações ordenadas por status (pendente primeiro) e data.
     */
    public function list(int $perPage = 20): LengthAwarePaginator
    {
        return Autorizado::orderByRaw("CASE WHEN status = 'pendente' THEN 0 ELSE 1 END")
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Cria autorização com status padrão 'pendente'.
     */
    public function create(array $data): Autorizado
    {
        return Autorizado::create(array_merge($data, [
            'status' => $data['status'] ?? AutorizadoStatus::Pendente->value,
        ]));
    }

    /**
     * Atualização feita pela Nutricionista (edição de conteúdo).
     */
    public function update(Autorizado $autorizado, array $data): Autorizado
    {
        $autorizado->update($data);

        return $autorizado;
    }

    /**
     * Aprovação / revisão realizada exclusivamente pela Diretoria.
     */
    public function approve(Autorizado $autorizado, array $data): Autorizado
    {
        $autorizado->update($data);

        return $autorizado;
    }

    /**
     * Exclui autorização.
     */
    public function delete(Autorizado $autorizado): void
    {
        $autorizado->delete();
    }
}
