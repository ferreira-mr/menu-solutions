<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Class ControleDeProducaoEConsumo
 *
 * @property $id
 * @property $nome_alimento
 * @property $data_alimento
 * @property $quantidade_alimento
 * @property $medida_alimento
 * @property $pessoas_alimento
 * @property $sobra_limpa_alimento
 * @property $desperdicio_alimento
 * @property $created_at
 * @property $updated_at
 * @property $deleted_at
 *
 * @mixin Builder
 */
class ControleDeProducaoEConsumo extends Model
{
    use HasFactory, SoftDeletes;

    public $table = 'controle_de_producao_e_consumo';

    protected function casts(): array
    {
        return [
            'data_alimento' => 'date:Y-m-d',
            'quantidade_alimento' => 'decimal:2',
            'sobra_limpa_alimento' => 'decimal:2',
            'desperdicio_alimento' => 'decimal:2',
        ];
    }

    protected $perPage = 20;

    public static function updateRule()
    {
        return [
            'nome_alimento' => 'sometimes|string|max:100',
            'data_alimento' => 'sometimes|date_format:Y-m-d',
            'quantidade_alimento' => 'sometimes|numeric|min:0',
            'medida_alimento' => 'sometimes|string|max:10',
            'pessoas_alimento' => 'sometimes|integer|min:0',
            'sobra_limpa_alimento' => 'sometimes|numeric|min:0',
            'desperdicio_alimento' => 'sometimes|numeric|min:0',
        ];
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = ['nome_alimento', 'data_alimento', 'quantidade_alimento', 'medida_alimento', 'pessoas_alimento', 'sobra_limpa_alimento', 'desperdicio_alimento'];
}
