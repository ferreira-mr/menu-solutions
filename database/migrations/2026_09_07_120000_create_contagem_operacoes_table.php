<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contagem_operacoes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('users_id')->constrained();
            $table->string('operacao', 80);
            $table->uuid('chave');
            $table->string('payload_hash', 64);
            $table->unsignedSmallInteger('status_http');
            $table->json('resposta');
            $table->timestamps();

            $table->unique(['users_id', 'operacao', 'chave']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contagem_operacoes');
    }
};
