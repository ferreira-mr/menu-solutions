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
        $aluno = $relacao?->aluno;

        return [
            'id' => $this->id,
            'relacao_id' => $relacao?->id,
            'aluno_id' => $aluno?->id,
            'necessidade_id' => $relacao?->necessidades_id,
            'data_hora_contagem'=>$this->created_at,
            'aluno'=>[
                'id'=>$aluno?->id,
                'nome'=>$aluno?->nome,
                'descricao'=>$aluno?->descricao,
                'rm'=>$aluno?->rm,
                'turmas_id'=>$aluno?->turmas_id,
                'necessidade'=>$relacao?->necessidade?->necessidade,
            ]
        ];
    }
}
