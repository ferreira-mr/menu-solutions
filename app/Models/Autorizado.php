<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Autorizado
 *
 * @property $id
 * @property $titulo
 * @property $conteudo
 * @property $status
 * @property $created_at
 * @property $updated_at
 *
 * @mixin Builder
 */
class Autorizado extends Model
{
    use HasFactory;

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['titulo', 'conteudo', 'status'];

    public static function updateRule()
    {
        return [
            'titulo' => 'sometimes|string|max:255',
            'conteudo' => 'sometimes|string|max:10000',
            'status' => 'sometimes|in:pendente,confirmado',
        ];
    }
}
