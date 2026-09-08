<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome_categoria' => $this->nome_categoria,
            'inclui_total_regular' => (bool) $this->inclui_total_regular,
            'turmas' => $this->turmas->map(function ($turma) {
                $contagem = $turma->contagen->first();

                return [
                    'id' => $turma->id,
                    'nome_turma' => $turma->nome_turma,
                    'qtd_contagem' => $contagem?->qtd_contagem ?? 0,
                    'data_contagem' => $contagem?->data_contagem?->toDateString(),
                ];
            }),
        ];
    }
}
