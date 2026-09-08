<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categorias', function (Blueprint $table): void {
            $table->boolean('inclui_total_regular')->default(true)->after('nome_categoria');
        });

        DB::table('categorias')
            ->whereRaw('LOWER(TRIM(nome_categoria)) = ?', ['outros'])
            ->update(['inclui_total_regular' => false]);
    }

    public function down(): void
    {
        Schema::table('categorias', function (Blueprint $table): void {
            $table->dropColumn('inclui_total_regular');
        });
    }
};
