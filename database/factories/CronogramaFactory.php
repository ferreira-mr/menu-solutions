<?php

namespace Database\Factories;

use App\Models\Cronograma;
use Illuminate\Database\Eloquent\Factories\Factory;

class CronogramaFactory extends Factory
{
    protected $model = Cronograma::class;

    public function definition(): array
    {
        return ['dia' => fake()->unique()->dayOfWeek()];
    }
}
