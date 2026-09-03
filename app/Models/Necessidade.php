<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Necessidade
 *
 * @property $id
 * @property $necessidade
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 * @property AlunosHasNecessidade[] $alunosHasNecessidades
 * @property NecessidadesHasCronograma[] $necessidadesHasCronogramas
 *
 * @mixin Builder
 */
class Necessidade extends Model
{
    use HasFactory, SoftDeletes;

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['necessidade'];

    /**
     * @return HasMany
     */
    public function alunosHasNecessidades()
    {
        return $this->hasMany(AlunosHasNecessidade::class, 'necessidades_id', 'id');
    }

    /**
     * @return HasMany
     */
    public function alunos()
    {
        return $this->belongsToMany(Aluno::class, 'alunos_has_necessidades', 'necessidades_id', 'alunos_id')
            ->withPivot('id');

    }
}
