<?php

namespace Database\Factories;

use App\Models\AlunosHasNecessidade;
use App\Models\ContagemNe;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContagemNeFactory extends Factory
{
    protected $model = ContagemNe::class;

    public function definition(): array
    {
        return ['alunos_has_necessidades_id' => AlunosHasNecessidade::factory()];
    }
}
