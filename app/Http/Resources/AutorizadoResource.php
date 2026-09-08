<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AutorizadoResource extends JsonResource
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
            'titulo' => $this->titulo,
            'conteudo' => $this->conteudo,
            'status' => $this->status,
            'decidido_por' => $this->decidido_por,
            'decidido_em' => $this->decidido_em,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
