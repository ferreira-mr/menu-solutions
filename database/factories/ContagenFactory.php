<?php

namespace Database\Factories;

use App\Models\Contagen;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContagenFactory extends Factory
{
    protected $model = Contagen::class;

    public function definition(): array
    {
        return [
            'data_contagem' => now()->toDateString(),
            'hora_contagem' => now()->format('H:i:s'),
            'qtd_contagem' => fake()->numberBetween(0, 100),
            'turmas_id' => Turma::factory(),
            'users_id' => User::factory()->nutricionista(),
        ];
    }
}
