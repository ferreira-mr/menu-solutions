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
        Schema::create('controle_de_producao_e_consumo', function (Blueprint $table) {
            $table->id();
            $table->string('nome_alimento', 100);
            $table->date('data_alimento');
            $table->decimal('quantidade_alimento');
            $table->string('medida_alimento', 10);
            $table->integer('pessoas_alimento');
            $table->decimal('sobra_limpa_alimento');
            $table->decimal('desperdicio_alimento');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('controle_de_producao_e_consumo');
    }
};
