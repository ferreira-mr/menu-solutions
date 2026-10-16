<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Categoria
 *
 * @property $id
 * @property $nome_categoria
 * @property bool $inclui_total_regular
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 * @property Turma[] $turmas
 * @property Turma[] $turmas
 *
 * @mixin Builder
 */
class Categoria extends Model
{
    use HasFactory, SoftDeletes;

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['nome_categoria', 'inclui_total_regular'];

    protected function casts(): array
    {
        return [
            'inclui_total_regular' => 'boolean',
        ];
    }

    /**
     * @return HasMany
     */
    public function turmas()
    {
        return $this->hasMany(Turma::class, 'categorias_id');
    }
}
