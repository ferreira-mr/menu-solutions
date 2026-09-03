<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContagemNeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $relacao = $this->alunosHasNecessidade;

        return [
            'id'=>$this->id,
            'data_hora_contagem'=>$this->created_at,
            'aluno'=>[
                'id'=>$relacao?->id,
                'nome'=>$relacao?->aluno?->nome,
                'descricao'=>$relacao?->aluno?->descricao,
                'rm'=>$relacao?->aluno?->rm,
                'necessidade'=>$relacao?->necessidade?->necessidade,
                
            ]
        ];
    }
}
