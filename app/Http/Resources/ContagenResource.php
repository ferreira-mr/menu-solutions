<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContagenResource extends JsonResource
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
            'data_contagem' => $this->data_contagem,
            'hora_contagem' => $this->hora_contagem,
            'qtd_contagem' => $this->qtd_contagem,
            'turmas_id' => $this->turmas_id,
            'users_id' => $this->users_id,
            'turma' => TurmaResource::make($this->whenLoaded('turma')),
            'user' => UserResource::make($this->whenLoaded('user')),
        ];
    }
}
