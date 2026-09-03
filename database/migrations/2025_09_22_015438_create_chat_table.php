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
        Schema::create('chat', function (Blueprint $table) {
            $table->id();
            $table->string('mensagem_chat', 100);
            $table->enum('visto', ['s', 'n'])->default('n');
            $table->timestamp('data');
            $table->foreignId('users_id')->constrained();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['users_id', 'data']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat');
    }
};
