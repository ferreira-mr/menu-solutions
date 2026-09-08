<?php

namespace Tests\Feature\BusinessRules;

use App\Models\Cardapio;
use App\Models\FileCleanupFailure;
use App\Models\User;
use App\Services\CardapioService;
use App\Services\FileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class CardapioConsistencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['filesystems.cardapio_disk' => 'uploads']);
        Storage::fake('uploads');
    }

    public function test_database_failure_after_upload_compensates_the_new_file_and_returns_generic_500(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);
        Cardapio::creating(static function (): void {
            throw new RuntimeException('injected database failure');
        });

        try {
            $response = $this->actingAs($nutri, 'sanctum')->post('/api/cardapios', [
                'file' => UploadedFile::fake()->create('falha.pdf', 10, 'application/pdf'),
            ], ['Accept' => 'application/json']);

            $response->assertStatus(500)
                ->assertJson(['message' => 'Não foi possível concluir a operação.'])
                ->assertJsonMissing(['exception' => 'RuntimeException']);
            $this->assertDatabaseCount('cardapio', 0);
            $this->assertSame([], Storage::disk('uploads')->allFiles('uploads/pdf'));
        } finally {
            Cardapio::flushEventListeners();
        }
    }

    public function test_update_failure_preserves_the_old_file_and_compensates_the_new_file(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);
        Storage::disk('uploads')->put('uploads/pdf/original.pdf', 'old pdf');
        $cardapio = Cardapio::create(['path' => 'original.pdf']);

        Cardapio::updating(static function (): void {
            throw new RuntimeException('injected update failure');
        });

        try {
            $response = $this->actingAs($nutri, 'sanctum')->put('/api/cardapios/'.$cardapio->id, [
                'file' => UploadedFile::fake()->create('novo.pdf', 10, 'application/pdf'),
            ], ['Accept' => 'application/json']);

            $response->assertStatus(500)
                ->assertJson(['message' => 'Não foi possível concluir a operação.']);
            $this->assertSame('original.pdf', $cardapio->fresh()->path);
            Storage::disk('uploads')->assertExists('uploads/pdf/original.pdf');
            $this->assertSame(['uploads/pdf/original.pdf'], Storage::disk('uploads')->allFiles('uploads/pdf'));
        } finally {
            Cardapio::flushEventListeners();
        }
    }

    public function test_successful_update_persists_the_new_file_and_removes_the_old_one_after_commit(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);
        Storage::disk('uploads')->put('uploads/pdf/old.pdf', 'old pdf');
        $cardapio = Cardapio::create(['path' => 'old.pdf']);

        $response = $this->actingAs($nutri, 'sanctum')->put('/api/cardapios/'.$cardapio->id, [
            'file' => UploadedFile::fake()->create('new.pdf', 10, 'application/pdf'),
        ], ['Accept' => 'application/json']);

        $response->assertOk();
        $newName = $cardapio->fresh()->path;
        $this->assertNotSame('old.pdf', $newName);
        Storage::disk('uploads')->assertMissing('uploads/pdf/old.pdf');
        Storage::disk('uploads')->assertExists('uploads/pdf/'.$newName);
        $this->assertSame([], FileCleanupFailure::query()->get()->all());
    }

    public function test_oversized_pdf_is_rejected_without_a_file_or_database_record(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);

        $this->actingAs($nutri, 'sanctum')->post('/api/cardapios', [
            'file' => UploadedFile::fake()->create('excessivo.pdf', 20001, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable();

        $this->assertDatabaseCount('cardapio', 0);
        $this->assertSame([], Storage::disk('uploads')->allFiles('uploads/pdf'));
    }

    public function test_delete_false_is_registered_and_a_retry_removes_only_the_target_file(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);
        Storage::disk('uploads')->put('uploads/pdf/to-remove.pdf', 'target');
        Storage::disk('uploads')->put('uploads/pdf/keep.pdf', 'keep');
        $cardapio = Cardapio::create(['path' => 'to-remove.pdf']);
        $calls = 0;

        $fileService = Mockery::mock(FileService::class)->makePartial();
        $fileService->shouldReceive('diskName')->andReturn('uploads');
        $fileService->shouldReceive('delete')->twice()->andReturnUsing(function (string $path) use (&$calls): bool {
            if ($calls++ === 0) {
                return false;
            }

            return Storage::disk('uploads')->delete($path);
        });
        $this->app->instance(FileService::class, $fileService);

        $this->actingAs($nutri, 'sanctum')
            ->deleteJson('/api/cardapios/'.$cardapio->id)
            ->assertNoContent();

        $failure = FileCleanupFailure::query()->firstOrFail();
        $this->assertSame('delete', $failure->operation);
        $this->assertSame('uploads/pdf/to-remove.pdf', $failure->path);
        $this->assertNull($failure->resolved_at);
        Storage::disk('uploads')->assertExists('uploads/pdf/to-remove.pdf');

        $this->assertTrue(app(CardapioService::class)->retryCleanupFailure($failure));
        $this->assertNotNull($failure->fresh()->resolved_at);
        Storage::disk('uploads')->assertMissing('uploads/pdf/to-remove.pdf');
        Storage::disk('uploads')->assertExists('uploads/pdf/keep.pdf');
    }

    public function test_delete_exception_is_registered_and_can_be_retried(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);
        Storage::disk('uploads')->put('uploads/pdf/retry.pdf', 'target');
        $cardapio = Cardapio::create(['path' => 'retry.pdf']);
        $calls = 0;

        $fileService = Mockery::mock(FileService::class)->makePartial();
        $fileService->shouldReceive('diskName')->andReturn('uploads');
        $fileService->shouldReceive('delete')->twice()->andReturnUsing(function (string $path) use (&$calls): bool {
            if ($calls++ === 0) {
                throw new RuntimeException('injected disk exception');
            }

            return Storage::disk('uploads')->delete($path);
        });
        $this->app->instance(FileService::class, $fileService);

        $this->actingAs($nutri, 'sanctum')
            ->deleteJson('/api/cardapios/'.$cardapio->id)
            ->assertNoContent();

        $failure = FileCleanupFailure::query()->firstOrFail();
        $this->assertStringContainsString('injected disk exception', $failure->last_error);
        $this->assertTrue(app(CardapioService::class)->retryCleanupFailure($failure));
        Storage::disk('uploads')->assertMissing('uploads/pdf/retry.pdf');
    }

    public function test_file_write_failure_returns_generic_500_without_creating_a_record(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);
        $fileService = Mockery::mock(FileService::class)->makePartial();
        $fileService->shouldReceive('diskName')->andReturn('uploads');
        $fileService->shouldReceive('FileUpload')->once()->andThrow(new RuntimeException('injected write failure'));
        $this->app->instance(FileService::class, $fileService);

        $this->actingAs($nutri, 'sanctum')->post('/api/upload/pdf', [
            'file' => UploadedFile::fake()->create('falha-escrita.pdf', 10, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertStatus(500)
            ->assertJson(['message' => 'Não foi possível concluir a operação.'])
            ->assertJsonMissing(['exception' => 'RuntimeException']);

        $this->assertDatabaseCount('cardapio', 0);
        $this->assertSame([], Storage::disk('uploads')->allFiles('uploads/pdf'));
    }
}
