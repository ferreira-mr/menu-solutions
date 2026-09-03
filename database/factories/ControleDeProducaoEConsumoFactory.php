<?php

namespace Database\Factories;

use App\Models\ControleDeProducaoEConsumo;
use Illuminate\Database\Eloquent\Factories\Factory;

class ControleDeProducaoEConsumoFactory extends Factory
{
    protected $model = ControleDeProducaoEConsumo::class;

    public function definition(): array
    {
        return [
            'nome_alimento' => fake()->words(2, true),
            'data_alimento' => now()->toDateString(),
            'quantidade_alimento' => 10.5,
            'medida_alimento' => 'kg',
            'pessoas_alimento' => fake()->numberBetween(1, 100),
            'sobra_limpa_alimento' => 1.0,
            'desperdicio_alimento' => 0.5,
        ];
    }
}
