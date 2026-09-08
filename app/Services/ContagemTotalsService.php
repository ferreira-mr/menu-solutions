<?php

namespace App\Services;

use Illuminate\Support\Collection;

class ContagemTotalsService
{
    /**
     * Soma somente uma revisão efetiva por turma já carregada no dashboard.
     * A classificação é sempre o atributo explícito da categoria.
     *
     * @return array{total_regular: int, total_outros: int, total_combinado: int}
     */
    public function fromDashboardCategories(Collection $categorias): array
    {
        $totals = [
            'total_regular' => 0,
            'total_outros' => 0,
            'total_combinado' => 0,
        ];

        foreach ($categorias as $categoria) {
            $totalCategoria = $categoria->turmas->sum(function ($turma): int {
                $contagem = $turma->contagen->first();

                return (int) ($contagem?->qtd_contagem ?? 0);
            });

            $totals['total_combinado'] += $totalCategoria;

            if ((bool) $categoria->inclui_total_regular) {
                $totals['total_regular'] += $totalCategoria;
            } else {
                $totals['total_outros'] += $totalCategoria;
            }
        }

        return $totals;
    }
}
