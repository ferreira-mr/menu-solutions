<?php

namespace Database\Factories;

use App\Models\Cardapio;
use Illuminate\Database\Eloquent\Factories\Factory;

class CardapioFactory extends Factory
{
    protected $model = Cardapio::class;

    public function definition(): array
    {
        return ['path' => fake()->uuid().'.pdf'];
    }
}
