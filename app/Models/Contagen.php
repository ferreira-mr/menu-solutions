<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class Contagen
 *
 * @property $id
 * @property $data_contagem
 * @property $hora_contagem
 * @property $qtd_contagem
 * @property $turmas_id
 * @property $users_id
 * @property $contagenscol
 * @property $deleted_at
 * @property Turma $turma
 * @property User $user
 *
 * @mixin Builder
 */
class Contagen extends Model
{
    use HasFactory, SoftDeletes;

    public $timestamps = false;

    protected function casts(): array
    {
        return ['data_contagem' => 'date:Y-m-d'];
    }

    protected $perPage = 20;

    public static function updateRule()
    {
        return [
            'qtd_contagem' => 'sometimes|int|min:0',
            'turmas_id' => 'sometimes|int|exists:turmas,id',
        ];
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['data_contagem', 'hora_contagem', 'qtd_contagem', 'turmas_id', 'users_id'];

    /**
     * @return BelongsTo
     */
    public function turma()
    {
        return $this->belongsTo(Turma::class, 'turmas_id', 'id');
    }

    /**
     * @return BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'users_id', 'id');
    }
}
