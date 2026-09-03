<?php

namespace Database\Factories;

use App\Models\Aluno;
use App\Models\AlunosHasNecessidade;
use App\Models\Necessidade;
use Illuminate\Database\Eloquent\Factories\Factory;

class AlunosHasNecessidadeFactory extends Factory
{
    protected $model = AlunosHasNecessidade::class;

    public function definition(): array
    {
        return [
            'alunos_id' => Aluno::factory(),
            'necessidades_id' => Necessidade::factory(),
        ];
    }
}
