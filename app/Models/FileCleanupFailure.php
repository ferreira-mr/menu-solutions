<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileCleanupFailure extends Model
{
    protected $fillable = [
        'cardapio_id',
        'disk',
        'path',
        'operation',
        'attempts',
        'last_error',
        'next_attempt_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'cardapio_id' => 'integer',
            'attempts' => 'integer',
            'next_attempt_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }
}
