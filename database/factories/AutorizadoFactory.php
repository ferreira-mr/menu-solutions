<?php

namespace Database\Factories;

use App\Models\Autorizado;
use Illuminate\Database\Eloquent\Factories\Factory;

class AutorizadoFactory extends Factory
{
    protected $model = Autorizado::class;

    public function definition(): array
    {
        return [
            'titulo' => fake()->sentence(3),
            'conteudo' => fake()->paragraph(),
            'status' => 'pendente',
        ];
    }
}
