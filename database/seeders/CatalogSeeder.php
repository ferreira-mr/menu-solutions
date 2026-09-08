<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Cronograma;
use App\Models\Necessidade;
use App\Models\Turma;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
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

        foreach ($categoriasTurmas as $nomeCategoria => $nomesTurmas) {
            $categoria = $this->restoreOrCreate(Categoria::class, [
                'nome_categoria' => $nomeCategoria,
            ]);

            if ($nomeCategoria === 'Outros' && $categoria->inclui_total_regular !== false) {
                $categoria->forceFill(['inclui_total_regular' => false])->save();
            }

            foreach ($nomesTurmas as $nomeTurma) {
                $this->restoreOrCreate(Turma::class, [
                    'nome_turma' => $nomeTurma,
                    'categorias_id' => $categoria->id,
                ]);
            }
        }

        foreach (['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'] as $dia) {
            $this->restoreOrCreate(Cronograma::class, ['dia' => $dia]);
        }

        foreach (['NAI', 'Personaliza', 'Robótica', 'Sem Glúten', 'Sem Lactose'] as $nomeNecessidade) {
            $this->restoreOrCreate(Necessidade::class, ['necessidade' => $nomeNecessidade]);
        }
    }

    /**
     * Restore the canonical soft-deleted catalog row instead of colliding with
     * its unique key or creating a second row on a repeated bootstrap.
     *
     * @param class-string<Model> $modelClass
     * @param array<string, mixed> $attributes
     */
    private function restoreOrCreate(string $modelClass, array $attributes): Model
    {
        $record = $modelClass::withTrashed()->firstOrNew($attributes);

        if ($record->exists) {
            if ($record->trashed()) {
                $record->restore();
            }

            return $record;
        }

        $record->save();

        return $record;
    }
}
