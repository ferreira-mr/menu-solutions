<?php

namespace Tests\Feature\Api;

use App\Models\Aluno;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Command\Command;
use Tests\TestCase;

class StudentPhotoAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('uploads');
        Storage::fake('student_photos');
        config([
            'filesystems.cardapio_disk' => 'uploads',
            'filesystems.student_photo_disk' => 'student_photos',
        ]);
    }

    public function test_student_photo_is_attached_to_an_aluno_and_served_only_by_authenticated_endpoint(): void
    {
        $nutri = User::factory()->nutricionista()->create();
        $staff = User::factory()->create();
        $aluno = Aluno::factory()->create();

        $this->getJson('/api/alunos/'.$aluno->id.'/foto')->assertUnauthorized();

        $this->actingAs($staff, 'sanctum')
            ->post('/api/alunos/'.$aluno->id.'/foto', [
                'file' => UploadedFile::fake()->create('aluno.png', 10, 'image/png'),
            ])
            ->assertForbidden();

        $upload = $this->actingAs($nutri, 'sanctum')
            ->post('/api/alunos/'.$aluno->id.'/foto', [
                'file' => UploadedFile::fake()->create('aluno.png', 10, 'image/png'),
            ], ['Accept' => 'application/json'])
            ->assertOk();

        $photoReference = $aluno->fresh()->foto;
        $this->assertNotSame('', (string) $photoReference);
        Storage::disk('student_photos')->assertExists($photoReference);
        $this->assertSame([], Storage::disk('uploads')->allFiles('uploads'));
        $this->assertSame(route('alunos.foto', ['aluno' => $aluno->id]), $upload->json('data.foto_url'));

        $expectedStream = Storage::disk('student_photos')->readStream($photoReference);
        $expectedBytes = stream_get_contents($expectedStream);
        fclose($expectedStream);

        $photoResponse = $this->actingAs($staff, 'sanctum')
            ->get('/api/alunos/'.$aluno->id.'/foto')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');
        $this->assertSame($expectedBytes, $photoResponse->streamedContent());

        $this->actingAs($staff, 'sanctum')
            ->get('/api/alunos/'.$aluno->id.'/foto?path=../.env')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/alunos/999999/foto')
            ->assertNotFound();
    }

    public function test_student_photo_migration_is_dry_run_idempotent_and_does_not_touch_pdf_files(): void
    {
        $first = Aluno::factory()->create(['foto' => 'primeiro.jpg']);
        $second = Aluno::factory()->create(['foto' => 'segundo.jpg']);
        $broken = Aluno::factory()->create(['foto' => 'ausente.jpg']);
        Storage::disk('uploads')->put('uploads/primeiro.jpg', 'foto-um');
        Storage::disk('uploads')->put('uploads/segundo.jpg', 'foto-dois');
        Storage::disk('uploads')->put('uploads/pdf/cardapio.pdf', 'pdf-preservado');

        $this->artisan('photos:migrate-to-private', ['--dry-run' => true])
            ->assertExitCode(Command::FAILURE);
        Storage::disk('student_photos')->assertMissing('primeiro.jpg');
        Storage::disk('student_photos')->assertMissing('segundo.jpg');
        Storage::disk('uploads')->assertExists('uploads/primeiro.jpg');
        Storage::disk('uploads')->assertExists('uploads/pdf/cardapio.pdf');

        $this->artisan('photos:migrate-to-private', ['--remove-public' => true])
            ->assertExitCode(Command::FAILURE);

        Storage::disk('student_photos')->assertExists('primeiro.jpg');
        Storage::disk('student_photos')->assertExists('segundo.jpg');
        Storage::disk('uploads')->assertMissing('uploads/primeiro.jpg');
        Storage::disk('uploads')->assertMissing('uploads/segundo.jpg');
        Storage::disk('uploads')->assertExists('uploads/pdf/cardapio.pdf');
        $this->assertSame('primeiro.jpg', $first->fresh()->foto);
        $this->assertSame('segundo.jpg', $second->fresh()->foto);
        $this->assertSame('ausente.jpg', $broken->fresh()->foto);

        $firstHash = hash('sha256', Storage::disk('student_photos')->get('primeiro.jpg'));
        $this->artisan('photos:migrate-to-private', ['--remove-public' => true])
            ->assertExitCode(Command::FAILURE);

        $this->assertSame($firstHash, hash('sha256', Storage::disk('student_photos')->get('primeiro.jpg')));
        Storage::disk('student_photos')->assertExists('segundo.jpg');
        Storage::disk('uploads')->assertExists('uploads/pdf/cardapio.pdf');
    }
}
