<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AlunoResource extends JsonResource
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
            'nome' => $this->nome,
            'genero' => $this->genero,
            'descricao' => $this->descricao,
            'dia' => $this->dia,
            'foto' => $this->foto,
            'turmas_id' => $this->turmas_id,
            'data_nascimento' => $this->data_nascimento,
            'rm' => $this->rm,
            'turma' => TurmaResource::make($this->whenLoaded('turma')),
            'necessidades' => NecessidadeResource::collection($this->whenLoaded('necessidades')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
