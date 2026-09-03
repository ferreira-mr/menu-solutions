<?php

namespace Database\Factories;

use App\Models\AlunosHasNecessidade;
use App\Models\Cronograma;
use App\Models\NecessidadesHasCronograma;
use Illuminate\Database\Eloquent\Factories\Factory;

class NecessidadesHasCronogramaFactory extends Factory
{
    protected $model = NecessidadesHasCronograma::class;

    public function definition(): array
    {
        return [
            'alunos_has_necessidades_id' => AlunosHasNecessidade::factory(),
            'cronograma_id' => Cronograma::factory(),
        ];
    }
}
