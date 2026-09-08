<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('file_cleanup_failures', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('cardapio_id')->nullable();
            $table->string('disk', 100);
            $table->string('path', 255);
            $table->string('operation', 50);
            $table->unsignedInteger('attempts')->default(1);
            $table->text('last_error')->nullable();
            $table->timestamp('next_attempt_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['disk', 'path', 'resolved_at']);
            $table->index(['cardapio_id', 'operation']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('file_cleanup_failures');
    }
};
