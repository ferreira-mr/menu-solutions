<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class E2eSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['nif' => '22222222222'],
            [
                'name' => 'Nutricionista E2E',
                'email' => 'e2e-nutri@example.test',
                'password' => Hash::make('password'),
                'nivel_user' => 2,
            ],
        );

        User::updateOrCreate(
            ['nif' => '33333333333'],
            [
                'name' => 'Diretora E2E',
                'email' => 'e2e-diretora@example.test',
                'password' => Hash::make('password'),
                'nivel_user' => 3,
            ],
        );

        User::updateOrCreate(
            ['nif' => '11111111111'],
            [
                'name' => 'Inspetora E2E',
                'email' => 'e2e-inspetora@example.test',
                'password' => Hash::make('password'),
                'nivel_user' => 1,
            ],
        );

        $categoria = \App\Models\Categoria::firstOrCreate(
            ['nome_categoria' => 'Ensino Médio']
        );

        \App\Models\Turma::firstOrCreate(
            ['nome_turma' => '1º Ano A', 'categorias_id' => $categoria->id]
        );

        \App\Models\Autorizado::firstOrCreate(
            ['titulo' => 'Autorização Lanche Especial'],
            [
                'conteudo' => 'Autorização para lanche especial dos alunos da feira de ciências.',
                'status' => 'pendente',
            ]
        );

        \App\Models\ControleDeProducaoEConsumo::firstOrCreate(
            ['nome_alimento' => 'Arroz Integral'],
            [
                'data_alimento' => now()->toDateString(),
                'quantidade_alimento' => 45.5,
                'medida_alimento' => 'kg',
                'pessoas_alimento' => 280,
                'sobra_limpa_alimento' => 2.5,
                'desperdicio_alimento' => 1.0,
            ]
        );
    }
}
