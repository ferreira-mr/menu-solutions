<?php

namespace Tests\Feature\Testing;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class IsolationTest extends TestCase
{
    public function test_phpunit_uses_a_public_path_owned_by_this_test_run(): void
    {
        $normalPublicPath = realpath(base_path('public'));
        $effectivePublicPath = realpath(public_path());

        $this->assertNotFalse($normalPublicPath);
        $this->assertNotFalse($effectivePublicPath);
        $this->assertNotSame($normalPublicPath, $effectivePublicPath);
        $this->assertStringContainsString(
            DIRECTORY_SEPARATOR.'test-results'.DIRECTORY_SEPARATOR.'phpunit-runtime'.DIRECTORY_SEPARATOR,
            $effectivePublicPath,
        );
    }

    public function test_phpunit_uses_the_configured_in_memory_sqlite_connection(): void
    {
        $this->assertSame('testing', config('app.env'));
        $this->assertSame('sqlite', config('database.default'));
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        $this->assertSame('sqlite', DB::connection()->getDriverName());
    }

    public function test_cardapio_runtime_cannot_touch_the_normal_upload_directory(): void
    {
        $normalUploadDirectory = base_path('public/uploads/pdf');
        File::ensureDirectoryExists($normalUploadDirectory);
        $sentinel = $normalUploadDirectory.'/.t00-sentinel-'.bin2hex(random_bytes(8));
        $sentinelContents = 'normal-upload-sentinel';

        File::put($sentinel, $sentinelContents);

        try {
            File::ensureDirectoryExists(public_path('uploads/pdf'));
            File::put(public_path('uploads/pdf/runtime-only.txt'), 'runtime-file');

            $this->assertFileExists($sentinel);
            $this->assertSame($sentinelContents, File::get($sentinel));
            $this->assertFileExists(public_path('uploads/pdf/runtime-only.txt'));
            $this->assertNotSame(realpath($normalUploadDirectory), realpath(public_path('uploads/pdf')));
        } finally {
            File::delete($sentinel);
        }
    }
}
