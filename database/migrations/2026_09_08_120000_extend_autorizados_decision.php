<?php

use App\Enums\AutorizadoStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('autorizados', function (Blueprint $table): void {
            $table->foreignId('decidido_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decidido_em')->nullable();
        });

        Schema::table('autorizados', function (Blueprint $table): void {
            $table->enum('status', array_map(
                static fn (AutorizadoStatus $status): string => $status->value,
                AutorizadoStatus::cases(),
            ))->default(AutorizadoStatus::Pendente->value)->change();
        });
    }

    public function down(): void
    {
        if (DB::table('autorizados')->where('status', AutorizadoStatus::Recusado->value)->exists()) {
            throw new RuntimeException(
                'Não é seguro reverter a migração enquanto existirem autorizações recusadas.'
            );
        }

        Schema::table('autorizados', function (Blueprint $table): void {
            $table->enum('status', [
                AutorizadoStatus::Pendente->value,
                AutorizadoStatus::Confirmado->value,
            ])->default(AutorizadoStatus::Pendente->value)->change();
        });

        Schema::table('autorizados', function (Blueprint $table): void {
            $table->dropForeign(['decidido_por']);
            $table->dropColumn(['decidido_por', 'decidido_em']);
        });
    }
};
