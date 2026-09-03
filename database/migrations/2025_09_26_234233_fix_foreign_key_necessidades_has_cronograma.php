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
       // SQLite cannot alter foreign keys in place. The table migration already
       // creates the correct constraint for fresh SQLite databases.
       if (Schema::getConnection()->getDriverName() === 'sqlite') {
           return;
       }

       Schema::table('necessidades_has_cronograma', function (Blueprint $table) {
           $table->dropForeign(['alunos_has_necessidades_id']);
           $table->foreign('alunos_has_necessidades_id')
               ->references('id')
               ->on('alunos_has_necessidades')
               ->cascadeOnDelete();
       });
   }

   public function down(): void
   {
       // Nothing to reverse.
   }

};
