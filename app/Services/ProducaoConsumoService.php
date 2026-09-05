<?php

namespace App\Services;

use App\Models\ControleDeProducaoEConsumo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProducaoConsumoService
{
    /**
     * Lista registros de produção paginados.
     */
    public function list(int $perPage = 15): LengthAwarePaginator
    {
        return ControleDeProducaoEConsumo::latest('data_alimento')->paginate($perPage);
    }

    /**
     * Cria registro de produção e consumo.
     */
    public function create(array $data): ControleDeProducaoEConsumo
    {
        return ControleDeProducaoEConsumo::create($data);
    }

    /**
     * Atualiza registro de produção existente.
     */
    public function update(ControleDeProducaoEConsumo $item, array $data): ControleDeProducaoEConsumo
    {
        $item->update($data);

        return $item;
    }

    /**
     * Deleta registro de produção (soft delete).
     */
    public function delete(ControleDeProducaoEConsumo $item): void
    {
        $item->delete();
    }
}
