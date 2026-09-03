<?php

namespace Database\Factories;

use App\Models\Necessidade;
use Illuminate\Database\Eloquent\Factories\Factory;

class NecessidadeFactory extends Factory
{
    protected $model = Necessidade::class;

    public function definition(): array
    {
        return ['necessidade' => fake()->unique()->words(2, true)];
    }
}
