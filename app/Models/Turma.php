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
 * Class Turma
 *
 * @property $id
 * @property $nome_turma
 * @property $categorias_id
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 * @property Categoria $categoria
 * @property Contagen[] $contagens
 * @property Restrico[] $restricoes
 * @property Sala[] $salas
 * @property Tarefa[] $tarefas
 * @property Aluno[] $alunos
 * @property Contagen[] $contagens
 *
 * @mixin Builder
 */
class Turma extends Model
{
    use HasFactory, SoftDeletes;

    protected $perPage = 20;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['nome_turma', 'categorias_id'];

    public static function updateRule(?self $turma = null, array $attributes = [])
    {
        $finalName = $attributes['nome_turma'] ?? $turma?->nome_turma;
        $finalCategoryId = $attributes['categorias_id'] ?? $turma?->categorias_id;

        return [
            'nome_turma' => array_values(array_filter([
                'sometimes',
                'string',
                'max:45',
                $turma
                    ? Rule::unique('turmas', 'nome_turma')
                        ->where(fn ($query) => $query->where('categorias_id', $finalCategoryId))
                        ->ignore($turma->id)
                    : null,
            ])),
            'categorias_id' => [
                'sometimes',
                'integer',
                Rule::exists('categorias', 'id')->whereNull('deleted_at'),
                function (string $attribute, mixed $value, \Closure $fail) use ($turma, $finalName): void {
                    if (! $turma || ! is_scalar($finalName)) {
                        return;
                    }

                    $conflict = self::query()
                        ->where('categorias_id', $value)
                        ->where('nome_turma', $finalName)
                        ->whereKeyNot($turma->id)
                        ->exists();

                    if ($conflict) {
                        $fail('A turma já existe nesta categoria.');
                    }
                },
            ],
        ];
    }

    /**
     * @return BelongsTo
     */
    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categorias_id');
    }

    /**
     * @return HasMany
     */
    public function contagen()
    {
        return $this->hasMany(Contagen::class, 'turmas_id')
            ->orderByDesc('data_contagem')
            ->orderByDesc('hora_contagem')
            ->orderByDesc('id');
    }

    public function alunos()
    {
        return $this->hasMany(Aluno::class, 'turmas_id');
    }
}
