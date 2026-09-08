<?php

namespace Tests\Feature\Testing;

use App\Models\Autorizado;
use App\Models\Categoria;
use App\Models\ControleDeProducaoEConsumo;
use App\Models\Cronograma;
use App\Models\Necessidade;
use App\Models\Turma;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\E2eSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class SeederSafetyTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_does_not_create_e2e_accounts_or_operational_facts(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('autorizados', 0);
        $this->assertDatabaseCount('controle_de_producao_e_consumo', 0);
    }

    public function test_e2e_seeder_is_rejected_outside_testing(): void
    {
        config(['app.env' => 'production']);

        $this->expectException(RuntimeException::class);
        $this->seed(E2eSeeder::class);
    }

    public function test_e2e_seeder_requires_a_disposable_database_identifier(): void
    {
        $this->expectException(RuntimeException::class);
        $this->seed(E2eSeeder::class);
    }

    public function test_bootstrap_admin_command_creates_a_gestor_without_printing_the_password(): void
    {
        $password = 'senha-super-segura';

        $this->artisan('app:bootstrap-admin', [
            '--name' => 'Gestor Inicial',
            '--nif' => '99999999999',
            '--email' => 'gestor@menusolutions.local',
        ])
            ->expectsQuestion('Senha inicial do gestor', $password)
            ->expectsQuestion('Confirme a senha inicial', $password)
            ->doesntExpectOutputToContain($password)
            ->assertExitCode(0);

        $this->assertTrue(Hash::check($password, User::where('nif', '99999999999')->value('password')));
        $this->assertSame(3, User::where('nif', '99999999999')->value('nivel_user'));
    }

    public function test_existing_gestor_is_not_modified_by_a_second_bootstrap_attempt(): void
    {
        $existing = User::factory()->diretor()->create([
            'name' => 'Gestor já existente',
            'nif' => '88888888888',
            'password' => Hash::make('senha-original'),
        ]);
        $originalHash = $existing->password;

        $this->artisan('app:bootstrap-admin', [
            '--name' => 'Outro Nome',
            '--nif' => $existing->nif,
            '--email' => 'outro@example.test',
        ])
            ->expectsOutputToContain('já existe')
            ->assertExitCode(0);

        $this->assertSame($originalHash, $existing->fresh()->password);
        $this->assertSame('Gestor já existente', $existing->fresh()->name);
    }

    public function test_catalog_bootstrap_restores_soft_deleted_rows_without_duplicates(): void
    {
        $this->seed(CatalogSeeder::class);

        $category = Categoria::where('nome_categoria', 'Fundamental 1A')->firstOrFail();
        $class = Turma::where('categorias_id', $category->id)->where('nome_turma', '1º Ano A')->firstOrFail();
        $schedule = Cronograma::where('dia', 'Segunda')->firstOrFail();
        $need = Necessidade::where('necessidade', 'NAI')->firstOrFail();

        $category->delete();
        $class->delete();
        $schedule->delete();
        $need->delete();

        $this->seed(CatalogSeeder::class);

        $this->assertSame($category->id, Categoria::where('nome_categoria', 'Fundamental 1A')->firstOrFail()->id);
        $this->assertSame($class->id, Turma::withTrashed()->where('categorias_id', $category->id)->where('nome_turma', '1º Ano A')->firstOrFail()->id);
        $this->assertSame($schedule->id, Cronograma::where('dia', 'Segunda')->firstOrFail()->id);
        $this->assertSame($need->id, Necessidade::where('necessidade', 'NAI')->firstOrFail()->id);
        $this->assertDatabaseCount('categorias', 5);
        $this->assertDatabaseCount('turmas', 14);
        $this->assertDatabaseCount('cronogramas', 5);
        $this->assertDatabaseCount('necessidades', 5);
    }

    public function test_e2e_bootstrap_is_idempotent_for_credentials_and_operational_history(): void
    {
        $runtimePath = base_path('test-results/phpunit-runtime/e2e-seeder-'.bin2hex(random_bytes(6)));
        $databasePath = $runtimePath.DIRECTORY_SEPARATOR.'database.sqlite';
        File::ensureDirectoryExists($runtimePath);
        File::put($databasePath, '');

        $previousRuntime = getenv('E2E_RUNTIME_DIR');
        $previousToken = getenv('E2E_RUN_TOKEN');
        putenv('E2E_RUNTIME_DIR='.$runtimePath);
        putenv('E2E_RUN_TOKEN=phpunit-e2e-'.bin2hex(random_bytes(4)));
        config([
            'app.env' => 'testing',
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => $databasePath,
        ]);
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        try {
            Artisan::call('migrate:fresh', ['--database' => 'sqlite', '--no-interaction' => true]);
            $this->seed(E2eSeeder::class);

            $account = User::where('nif', '22222222222')->firstOrFail();
            $account->update(['password' => Hash::make('senha-alterada')]);
            $authorization = Autorizado::where('titulo', 'Autorização Lanche Especial')->firstOrFail();
            $authorization->update(['conteudo' => 'histórico preservado']);
            $production = ControleDeProducaoEConsumo::where('nome_alimento', 'Arroz Integral')->firstOrFail();
            $production->update(['quantidade_alimento' => 99.99]);

            $this->seed(E2eSeeder::class);

            $this->assertTrue(Hash::check('senha-alterada', $account->fresh()->password));
            $this->assertSame('histórico preservado', $authorization->fresh()->conteudo);
            $this->assertSame('99.99', (string) $production->fresh()->quantidade_alimento);
            $this->assertDatabaseCount('users', 3);
            $this->assertDatabaseCount('autorizados', 1);
            $this->assertDatabaseCount('controle_de_producao_e_consumo', 1);
        } finally {
            config([
                'database.default' => 'sqlite',
                'database.connections.sqlite.database' => ':memory:',
            ]);
            DB::purge('sqlite');
            if ($previousRuntime === false) {
                putenv('E2E_RUNTIME_DIR');
            } else {
                putenv('E2E_RUNTIME_DIR='.$previousRuntime);
            }
            if ($previousToken === false) {
                putenv('E2E_RUN_TOKEN');
            } else {
                putenv('E2E_RUN_TOKEN='.$previousToken);
            }
            File::deleteDirectory($runtimePath);
        }
    }
}
