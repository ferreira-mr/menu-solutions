<?php

namespace App\Models;

use Database\Factories\ContagenFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Validation\Rule;

/**
 * Class Contagem
 *
 * Canonical model for daily student headcounts.
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
class Contagem extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'contagens';

    public $timestamps = false;

    protected function casts(): array
    {
        return ['data_contagem' => 'date:Y-m-d'];
    }

    protected $perPage = 20;

    public static function updateRule()
    {
        return [
            'qtd_contagem' => ['sometimes', 'integer', 'min:0', 'max:2147483647'],
            'turmas_id' => ['sometimes', 'integer', Rule::exists('turmas', 'id')->whereNull('deleted_at')],
        ];
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['data_contagem', 'hora_contagem', 'qtd_contagem', 'turmas_id', 'users_id'];

    protected static function newFactory(): ContagenFactory
    {
        return ContagenFactory::new();
    }

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
