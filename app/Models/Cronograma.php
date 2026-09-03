<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Cronograma
 *
 * @property $id
 * @property $dia
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 * @property NecessidadesHasCronograma[] $necessidadesHasCronogramas
 *
 * @mixin Builder
 */
class Cronograma extends Model
{
    use HasFactory, SoftDeletes;

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['dia'];

    /**
     * @return HasMany
     */
    public function necessidadesHasCronogramas()
    {
        return $this->hasMany(NecessidadesHasCronograma::class, 'cronograma_id');
    }
}
