<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TurmaResource extends JsonResource
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
            'nome_turma' => $this->nome_turma,
            'categorias_id' => $this->categorias_id,
            'categoria' => CategoriaResource::make($this->whenLoaded('categoria')),
            'alunos' => AlunoResource::collection($this->whenLoaded('alunos')),
            'contagens' => ContagenResource::collection($this->whenLoaded('contagen')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
