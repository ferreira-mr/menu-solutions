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
        Schema::create('alunos_has_necessidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alunos_id')->constrained();
            $table->foreignId('necessidades_id')->constrained();
            $table->timestamps();
            $table->unique(['alunos_id', 'necessidades_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alunos_has_necessidades');
    }
};
