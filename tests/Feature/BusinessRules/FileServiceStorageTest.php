<?php

namespace Tests\Feature\BusinessRules;

use App\Services\FileService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class FileServiceStorageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['filesystems.cardapio_disk' => 'uploads']);
    }

    public function test_put_file_as_false_is_reported_as_a_write_failure(): void
    {
        $disk = Mockery::mock();
        $disk->shouldReceive('putFileAs')->once()->andReturnFalse();
        Storage::shouldReceive('disk')->once()->with('uploads')->andReturn($disk);

        $request = Request::create('/api/upload/pdf', 'POST', [], [], [
            'file' => UploadedFile::fake()->create('falha.pdf', 10, 'application/pdf'),
        ]);

        $this->expectException(RuntimeException::class);
        app(FileService::class)->FileUpload($request);
    }

    public function test_delete_exception_is_propagated_for_the_cleanup_service_to_track(): void
    {
        $disk = Mockery::mock();
        $disk->shouldReceive('delete')->once()->with('uploads/pdf/falha.pdf')->andThrow(new RuntimeException('disk unavailable'));
        Storage::shouldReceive('disk')->once()->with('uploads')->andReturn($disk);

        $this->expectException(RuntimeException::class);
        app(FileService::class)->delete('uploads/pdf/falha.pdf');
    }

    public function test_delete_false_is_returned_to_the_cleanup_service(): void
    {
        $disk = Mockery::mock();
        $disk->shouldReceive('delete')->once()->with('uploads/pdf/falha.pdf')->andReturnFalse();
        Storage::shouldReceive('disk')->once()->with('uploads')->andReturn($disk);

        $this->assertFalse(app(FileService::class)->delete('uploads/pdf/falha.pdf'));
    }
}
