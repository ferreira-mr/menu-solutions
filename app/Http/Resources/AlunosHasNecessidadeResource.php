<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlunosHasNecessidadeResource extends JsonResource
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
            'alunos_id' => $this->alunos_id,
            'necessidades_id' => $this->necessidades_id,
            'aluno' => AlunoResource::make($this->whenLoaded('aluno')),
            'necessidade' => NecessidadeResource::make($this->whenLoaded('necessidade')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
