<?php

namespace Tests\Feature\BusinessRules;

use App\Models\Cardapio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class CardapioAndStorageTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        $uploadDir = public_path('uploads/pdf');
        if (File::isDirectory($uploadDir)) {
            File::cleanDirectory($uploadDir);
        }
        parent::tearDown();
    }

    public function test_nutricionista_can_upload_pdf_cardapio(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);
        $pdfFile = UploadedFile::fake()->create('cardapio_semanal.pdf', 150, 'application/pdf');

        $response = $this->actingAs($nutri, 'sanctum')->post('/api/cardapios', [
            'file' => $pdfFile,
        ], ['Accept' => 'application/json']);

        $response->assertCreated();
        $this->assertDatabaseCount('cardapio', 1);

        $cardapio = Cardapio::first();
        $this->assertNotNull($cardapio->path);
        $this->assertFileExists(public_path('uploads/pdf/'.$cardapio->path));
    }

    public function test_inspetora_and_diretora_cannot_upload_cardapio(): void
    {
        $inspetora = User::factory()->create(['nivel_user' => 1]);
        $diretora = User::factory()->create(['nivel_user' => 3]);
        $pdfFile = UploadedFile::fake()->create('cardapio.pdf', 100, 'application/pdf');

        $this->actingAs($inspetora, 'sanctum')->post('/api/cardapios', [
            'file' => $pdfFile,
        ], ['Accept' => 'application/json'])->assertForbidden();

        $this->actingAs($diretora, 'sanctum')->post('/api/cardapios', [
            'file' => $pdfFile,
        ], ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_cardapio_upload_rejects_non_pdf_files(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);
        $txtFile = UploadedFile::fake()->create('malicious.txt', 10, 'text/plain');

        $response = $this->actingAs($nutri, 'sanctum')->post('/api/cardapios', [
            'file' => $txtFile,
        ], ['Accept' => 'application/json']);

        $response->assertUnprocessable();
    }

    public function test_deleting_cardapio_removes_record_and_file(): void
    {
        $nutri = User::factory()->create(['nivel_user' => 2]);
        $pdfFile = UploadedFile::fake()->create('cardapio_remover.pdf', 50, 'application/pdf');

        $this->actingAs($nutri, 'sanctum')->post('/api/cardapios', [
            'file' => $pdfFile,
        ], ['Accept' => 'application/json'])->assertCreated();

        $cardapio = Cardapio::first();
        $filePath = public_path('uploads/pdf/'.$cardapio->path);
        $this->assertFileExists($filePath);

        $this->actingAs($nutri, 'sanctum')
            ->deleteJson('/api/cardapios/'.$cardapio->id)
            ->assertNoContent();

        $this->assertSoftDeleted('cardapio', ['id' => $cardapio->id]);
        $this->assertFileDoesNotExist($filePath);
    }
}
