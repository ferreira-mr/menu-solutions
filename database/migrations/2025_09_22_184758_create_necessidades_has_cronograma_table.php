<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('necessidades_has_cronograma', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alunos_has_necessidades_id')->constrained();
            $table->foreignId('cronograma_id')->constrained();
            $table->timestamps();
            $table->unique(['alunos_has_necessidades_id', 'cronograma_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('necessidades_has_cronograma');
    }
};
