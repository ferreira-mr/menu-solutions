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
        Schema::create('contagens', function (Blueprint $table) {
            $table->id();
            $table->date('data_contagem');
            $table->time('hora_contagem');
            $table->integer('qtd_contagem');
            $table->foreignId('turmas_id')->constrained();
            $table->foreignId('users_id')->constrained();
            $table->softDeletes();
            $table->index(['data_contagem', 'turmas_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contagens');
    }
};
