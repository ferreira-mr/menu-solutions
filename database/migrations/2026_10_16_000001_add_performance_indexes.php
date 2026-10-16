<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('contagem_nes')) {
            Schema::table('contagem_nes', function (Blueprint $table) {
                $table->index('created_at', 'contagem_nes_created_at_idx');
                $table->index(['alunos_has_necessidades_id', 'created_at'], 'contagem_nes_relacao_created_idx');
            });
        }

        if (Schema::hasTable('controle_de_producao_e_consumo')) {
            Schema::table('controle_de_producao_e_consumo', function (Blueprint $table) {
                $table->index('data_alimento', 'controle_producao_data_idx');
            });
        }

        if (Schema::hasTable('autorizados')) {
            Schema::table('autorizados', function (Blueprint $table) {
                $table->index(['status', 'created_at'], 'autorizados_status_created_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('autorizados')) {
            Schema::table('autorizados', function (Blueprint $table) {
                $table->dropIndex('autorizados_status_created_idx');
            });
        }

        if (Schema::hasTable('controle_de_producao_e_consumo')) {
            Schema::table('controle_de_producao_e_consumo', function (Blueprint $table) {
                $table->dropIndex('controle_producao_data_idx');
            });
        }

        if (Schema::hasTable('contagem_nes')) {
            Schema::table('contagem_nes', function (Blueprint $table) {
                $table->dropIndex('contagem_nes_relacao_created_idx');
                $table->dropIndex('contagem_nes_created_at_idx');
            });
        }
    }
};
