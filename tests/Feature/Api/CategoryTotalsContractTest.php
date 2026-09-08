<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Categoria;
use App\Models\Contagem;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CategoryTotalsContractTest extends TestCase
{
    use RefreshDatabase;

    private function api(User $user)
    {
        return $this->withToken($user->createToken('category-totals')->plainTextToken);
    }

    public function test_category_classification_is_explicit_and_exposed_in_count_contracts(): void
    {
        $user = User::factory()->create([
            'nif' => '20000000041',
            'nivel_user' => UserRole::Nutri->value,
            'password' => Hash::make('password123'),
        ]);
        $regular = Categoria::create(['nome_categoria' => 'Regular']);
        $outros = Categoria::create(['nome_categoria' => 'Outros']);
        $outros->forceFill(['inclui_total_regular' => false])->save();
        $turmaRegular = Turma::create(['nome_turma' => '7º Ano A', 'categorias_id' => $regular->id]);
        $turmaOutros = Turma::create(['nome_turma' => 'Robótica', 'categorias_id' => $outros->id]);

        $contagem = Contagem::create([
            'turmas_id' => $turmaOutros->id,
            'qtd_contagem' => 15,
            'data_contagem' => '2026-09-08',
            'hora_contagem' => '07:20:00',
            'users_id' => $user->id,
        ]);

        $this->api($user)->getJson('/api/categorias?limit=100')
            ->assertOk()
            ->assertJsonPath('data.0.inclui_total_regular', true)
            ->assertJsonPath('data.1.inclui_total_regular', false);

        $this->api($user)->getJson('/api/contagens?data=2026-09-08&limit=100')
            ->assertOk()
            ->assertJsonPath('data.0.id', $contagem->id)
            ->assertJsonPath('data.0.turma.categoria.inclui_total_regular', false);

        $this->assertSame(true, $regular->fresh()->inclui_total_regular);
        $this->assertSame(false, $outros->fresh()->inclui_total_regular);
        $this->assertDatabaseHas('contagens', ['id' => $contagem->id, 'qtd_contagem' => 15]);
        $this->assertDatabaseHas('turmas', ['id' => $turmaRegular->id, 'categorias_id' => $regular->id]);
    }
}
