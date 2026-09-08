<?php

namespace App\Services;

use App\Models\ControleDeProducaoEConsumo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProducaoConsumoService
{
    /**
     * Lista registros de produção paginados.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $day = $filters['data'] ?? $filters['date'] ?? null;
        $dataInicio = $filters['data_inicio'] ?? null;
        $dataFim = $filters['data_fim'] ?? null;

        $query = ControleDeProducaoEConsumo::query()
            ->orderByDesc('data_alimento')
            ->orderByDesc('id');

        if ($day) {
            $query->where('data_alimento', $day);
        } elseif ($dataInicio && $dataFim) {
            $query->whereBetween('data_alimento', [$dataInicio, $dataFim]);
        } elseif ($dataInicio) {
            $query->where('data_alimento', '>=', $dataInicio);
        } elseif ($dataFim) {
            $query->where('data_alimento', '<=', $dataFim);
        }

        return $query->paginate($filters['limit'] ?? 15)->withQueryString();
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
