<?php

namespace Database\Factories;

use App\Models\Aluno;
use App\Models\Turma;
use Illuminate\Database\Eloquent\Factories\Factory;

class AlunoFactory extends Factory
{
    protected $model = Aluno::class;

    public function definition(): array
    {
        return [
            'nome' => fake()->name(),
            'genero' => fake()->randomElement(['Feminino', 'Masculino', 'Não informado']),
            'descricao' => fake()->optional()->sentence(),
            'dia' => fake()->optional()->randomElement(['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta']),
            'foto' => null,
            'turmas_id' => Turma::factory(),
            'data_nascimento' => fake()->date('Y-m-d', '-6 years'),
            'rm' => fake()->unique()->numerify('RM######'),
        ];
    }
}
