<?php

namespace Tests\Feature\Database;

use App\Enums\AutorizadoStatus;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class AutorizadoMigrationCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    private string $connection = 'autorizado_upgrade';

    private string $databasePath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->databasePath = storage_path('app/autorizado-upgrade-'.bin2hex(random_bytes(8)).'.sqlite');
        touch($this->databasePath);
        Config::set('database.connections.'.$this->connection, [
            'driver' => 'sqlite',
            'database' => $this->databasePath,
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);
        Config::set('database.default', $this->connection);
        DB::purge($this->connection);
    }

    protected function tearDown(): void
    {
        DB::disconnect($this->connection);
        DB::purge($this->connection);
        Config::set('database.default', 'sqlite');

        if (is_file($this->databasePath)) {
            unlink($this->databasePath);
        }

        parent::tearDown();
    }

    public function test_upgrade_preserves_old_rows_allows_refusal_and_has_safe_rollback(): void
    {
        $schema = Schema::connection($this->connection);
        $db = DB::connection($this->connection);

        $schema->create('users', function (Blueprint $table): void {
            $table->id();
        });
        $db->table('users')->insert(['id' => 7]);

        $schema->create('autorizados', function (Blueprint $table): void {
            $table->id();
            $table->string('titulo');
            $table->longText('conteudo');
            $table->enum('status', [
                AutorizadoStatus::Pendente->value,
                AutorizadoStatus::Confirmado->value,
            ])->default(AutorizadoStatus::Pendente->value);
            $table->timestamps();
        });

        $db->table('autorizados')->insert([
            'id' => 11,
            'titulo' => 'Histórico',
            'conteudo' => 'Registro anterior',
            'status' => AutorizadoStatus::Confirmado->value,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require base_path('database/migrations/2026_09_08_120000_extend_autorizados_decision.php');
        $migration->up();

        $this->assertTrue($schema->hasColumn('autorizados', 'decidido_por'));
        $this->assertTrue($schema->hasColumn('autorizados', 'decidido_em'));
        $this->assertSame(
            AutorizadoStatus::Confirmado->value,
            $db->table('autorizados')->where('id', 11)->value('status'),
        );

        $db->table('autorizados')->insert([
            'id' => 12,
            'titulo' => 'Nova decisão',
            'conteudo' => 'Registro recusado',
            'status' => AutorizadoStatus::Recusado->value,
            'decidido_por' => 7,
            'decidido_em' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $migration->down();
            $this->fail('A reversão não deveria descartar uma recusa existente.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('Não é seguro reverter', $exception->getMessage());
        }

        $this->assertTrue($schema->hasColumn('autorizados', 'decidido_por'));
        $db->table('autorizados')->where('id', 12)->delete();
        $migration->down();

        $this->assertFalse($schema->hasColumn('autorizados', 'decidido_por'));
        $this->assertFalse($schema->hasColumn('autorizados', 'decidido_em'));
        $this->assertSame(1, $db->table('autorizados')->where('id', 11)->count());
    }
}
