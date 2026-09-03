<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Class AlunosHasNecessidade
 *
 * @property $id
 * @property $alunos_id
 * @property $necessidades_id
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 * @property Aluno $aluno
 * @property Necessidade $necessidade
 * @property ContagemNe[] $contagemNes
 *
 * @mixin Builder
 */
class AlunosHasNecessidade extends Model
{
    use HasFactory;

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['alunos_id', 'necessidades_id'];

    /**
     * @return BelongsTo
     */
    public function aluno()
    {
        return $this->belongsTo(Aluno::class, 'alunos_id');
    }

    /**
     * @return BelongsTo
     */
    public function necessidade()
    {
        return $this->belongsTo(Necessidade::class, 'necessidades_id');
    }

    /**
     * @return HasMany
     */
    public function contagemNes()
    {
        return $this->hasMany(ContagemNe::class, 'alunos_has_necessidades_id', 'id');
    }

    public function necessidadesHasCronogramas()
    {
        return $this->belongsToMany(Cronograma::class, 'necessidades_has_cronograma', 'alunos_has_necessidades_id', 'cronograma_id');
    }
}
