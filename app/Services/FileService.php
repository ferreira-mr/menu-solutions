<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class FileService
{
    public $file;

    public function __construct($request) {
        $this->file = $request->file('file');
    }

    public function FileUpload($request): string
    {
        $request->validate([
            'file' => 'required|file|max:20000|mimes:pdf',
        ]);

        return $this->store($request->file('file'), 'uploads/pdf');
    }

    public function FileUploadImage($request): string
    {
        $request->validate([
            'file' => 'required|file|max:20000|mimes:jpg,jpeg,png,webp',
        ]);

        return $this->store($request->file('file'), 'uploads');
    }

    private function store($file, string $directory): string
    {
        $path = public_path($directory);
        File::ensureDirectoryExists($path);

        // Never use the client-provided filename: it can contain paths or an executable extension.
        $name = Str::uuid()->toString().'.'.$file->extension();
        $file->move($path, $name);

        return $name;
    }

}
