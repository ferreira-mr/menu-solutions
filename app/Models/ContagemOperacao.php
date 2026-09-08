<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContagemOperacao extends Model
{
    use HasFactory;

    protected $table = 'contagem_operacoes';

    protected $fillable = [
        'users_id',
        'operacao',
        'chave',
        'payload_hash',
        'status_http',
        'resposta',
    ];

    protected function casts(): array
    {
        return [
            'status_http' => 'integer',
            'resposta' => 'array',
        ];
    }
}
