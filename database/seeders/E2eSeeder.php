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

        // 2. Categorias e Turmas Oficiais do Projeto SESI
        $categoriasTurmas = [
            'Fundamental 1A' => [
                '1º Ano A',
                '2º Ano A',
            ],
            'Fundamental 1B' => [
                '3º Ano A',
                '4º Ano A',
                '5º Ano A',
            ],
            'Fundamental 2' => [
                '6º Ano A',
                '7º Ano A',
                '8º Ano A',
                '9º Ano A',
            ],
            'Ensino Médio' => [
                '1º Ano A',
                '2º Ano A',
                '3º Ano A',
            ],
            'Outros' => [
                'Robótica',
                'Personaliza',
            ],
        ];

        foreach ($categoriasTurmas as $catNome => $turmas) {
            $cat = \App\Models\Categoria::firstOrCreate(['nome_categoria' => $catNome]);
            foreach ($turmas as $turmaNome) {
                \App\Models\Turma::firstOrCreate([
                    'nome_turma' => $turmaNome,
                    'categorias_id' => $cat->id,
                ]);
            }
        }

        // 3. Cronogramas (Dias da Semana)
        $dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        foreach ($dias as $dia) {
            \App\Models\Cronograma::firstOrCreate(['dia' => $dia]);
        }

        // 4. Necessidades Especiais e Dietas
        $necessidades = [
            'NAI',
            'Personaliza',
            'Robótica',
            'Sem Glúten',
            'Sem Lactose',
        ];
        foreach ($necessidades as $nec) {
            \App\Models\Necessidade::firstOrCreate(['necessidade' => $nec]);
        }

        // 5. Autorizado de Exemplo
        \App\Models\Autorizado::firstOrCreate(
            ['titulo' => 'Autorização Lanche Especial'],
            [
                'conteudo' => 'Autorização para lanche especial dos alunos da feira de ciências.',
                'status' => 'pendente',
            ]
        );

        // 6. Registro de Produção de Exemplo
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
