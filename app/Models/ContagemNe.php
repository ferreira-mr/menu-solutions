<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class ContagemNe
 *
 * @property $id
 * @property $alunos_has_necessidades_id
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 * @property AlunosHasNecessidade $alunosHasNecessidade
 *
 * @mixin Builder
 */
class ContagemNe extends Model
{
    use HasFactory, SoftDeletes;

    public $table = 'contagem_nes';

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['alunos_has_necessidades_id'];

    /**
     * @return BelongsTo
     */
    public function alunosHasNecessidade()
    {
        return $this->belongsTo(AlunosHasNecessidade::class, 'alunos_has_necessidades_id');
    }
}
