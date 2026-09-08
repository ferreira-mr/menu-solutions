<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Validation\Rule;

/**
 * Class Aluno
 *
 * @property $id
 * @property $nome
 * @property $genero
 * @property $dia
 * @property string|null $foto
 * @property $turmas_id
 * @property $data_nascimento
 * @property $rm
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 * @property Turma $turma
 * @property AlunosHasNecessidade[] $alunosHasNecessidades
 *
 * @mixin Builder
 */
class Aluno extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return ['data_nascimento' => 'date:Y-m-d'];
    }

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['nome', 'genero', 'descricao', 'foto', 'turmas_id', 'data_nascimento', 'rm'];

    public static function updateRule(?self $aluno = null)
    {
        return [
            'nome' => 'sometimes|string|max:45',
            'descricao' => 'sometimes|nullable|string|max:10000',
            'genero' => 'sometimes|string|max:200',
            'foto' => 'prohibited',
            'turmas_id' => [
                'sometimes',
                'integer',
                Rule::exists('turmas', 'id')->whereNull('deleted_at'),
            ],
            'data_nascimento' => 'sometimes|date_format:Y-m-d',
            'rm' => array_values(array_filter([
                'sometimes',
                'string',
                'max:200',
                $aluno ? Rule::unique('alunos', 'rm')->ignore($aluno->id) : null,
            ])),
        ];
    }

    /**
     * @return BelongsTo
     */
    public function turma()
    {
        return $this->belongsTo(Turma::class, 'turmas_id', 'id');
    }

    /**
     * @return HasMany
     */
    public function necessidades()
    {
        return $this->belongsToMany(Necessidade::class, 'alunos_has_necessidades', 'alunos_id', 'necessidades_id');
    }

    public function alunosHasNecessidades()
    {
        return $this->hasMany(AlunosHasNecessidade::class, 'alunos_id');
    }
}
