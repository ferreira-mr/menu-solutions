<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class NecessidadesHasCronograma
 *
 * @property $necessidades_id
 * @property $cronograma_id
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 * @property Cronograma $cronograma
 * @property Necessidade $necessidade
 *
 * @mixin Builder
 */
class NecessidadesHasCronograma extends Model
{
    use HasFactory;

    public $table = 'necessidades_has_cronograma';

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['alunos_has_necessidades_id', 'cronograma_id'];

    /**
     * @return BelongsTo
     */
    public function cronograma()
    {
        return $this->belongsTo(Cronograma::class, 'cronograma_id', 'id');
    }

    /**
     * @return BelongsTo
     */
    public function aluno_has_necessidade()
    {
        return $this->belongsTo(AlunosHasNecessidade::class, 'alunos_has_necessidades_id');
    }
}
