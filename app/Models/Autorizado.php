<?php

namespace App\Models;

use App\Enums\AutorizadoStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Autorizado
 *
 * @property $id
 * @property $titulo
 * @property $conteudo
 * @property AutorizadoStatus $status
 * @property int|null $decidido_por
 * @property \Illuminate\Support\Carbon|null $decidido_em
 * @property $created_at
 * @property $updated_at
 *
 * @mixin Builder
 */
class Autorizado extends Model
{
    use HasFactory;

    protected $perPage = 20;

    protected $attributes = [
        'status' => 'pendente',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['titulo', 'conteudo'];

    protected function casts(): array
    {
        return [
            'status' => AutorizadoStatus::class,
            'decidido_em' => 'datetime',
        ];
    }

    public static function updateRule()
    {
        return [
            'titulo' => 'sometimes|string|max:255',
            'conteudo' => 'sometimes|string|max:10000',
            'status' => 'prohibited',
        ];
    }
}
