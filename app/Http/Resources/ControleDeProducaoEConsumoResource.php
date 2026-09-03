<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ControleDeProducaoEConsumoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome_alimento' => $this->nome_alimento,
            'data_alimento' => $this->data_alimento,
            'quantidade_alimento' => $this->quantidade_alimento,
            'medida_alimento' => $this->medida_alimento,
            'pessoas_alimento' => $this->pessoas_alimento,
            'sobra_limpa_alimento' => $this->sobra_limpa_alimento,
            'desperdicio_alimento' => $this->desperdicio_alimento,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
