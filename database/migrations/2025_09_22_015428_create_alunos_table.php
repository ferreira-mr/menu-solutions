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
        Schema::create('alunos', function (Blueprint $table) {
            $table->id();
            $table->string('nome', 45);
            $table->string('genero', 200);
            $table->longText('descricao')->nullable();
            $table->enum('dia', ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta'])->nullable();
            $table->string('foto', 255)->nullable();
            $table->foreignId('turmas_id')->constrained();
            $table->date('data_nascimento');
            $table->string('rm', 200)->unique();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alunos');
    }
};
