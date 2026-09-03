<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

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

    public static function updateRule()
    {
        return [
            'nome_turma' => 'sometimes|string',
            'categorias_id' => 'sometimes|integer|exists:categorias,id',
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
            ->orderByDesc('hora_contagem');
    }

    public function alunos()
    {
        return $this->hasMany(Aluno::class, 'turmas_id');
    }
}
