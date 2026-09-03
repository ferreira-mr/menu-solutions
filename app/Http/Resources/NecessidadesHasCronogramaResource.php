<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NecessidadesHasCronogramaResource extends JsonResource
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
            'alunos_has_necessidades_id' => $this->alunos_has_necessidades_id,
            'cronograma_id' => $this->cronograma_id,
            'cronograma' => CronogramaResource::make($this->whenLoaded('cronograma')),
            'aluno_has_necessidade' => AlunosHasNecessidadeResource::make($this->whenLoaded('aluno_has_necessidade')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
