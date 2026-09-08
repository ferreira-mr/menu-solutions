<?php

namespace App\Console\Commands;

use App\Services\StudentPhotoMigrationService;
use Illuminate\Console\Command;

class MigrateStudentPhotos extends Command
{
    protected $signature = 'photos:migrate-to-private
        {--dry-run : Apenas inventaria e verifica sem copiar ou remover arquivos}
        {--remove-public : Remove cada origem pública somente após cópia e hash verificados}';

    protected $description = 'Migra fotos de alunos para o disco privado sem apagar diretórios inteiros';

    public function handle(StudentPhotoMigrationService $migrationService): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $removePublic = (bool) $this->option('remove-public');

        if ($dryRun && $removePublic) {
            $this->error('Não combine --dry-run com --remove-public.');

            return self::INVALID;
        }

        $result = $migrationService->migrate($dryRun, $removePublic);
        $mode = $dryRun ? 'simulação' : 'execução';
        $this->info("Modo {$mode}: {$result['inventory']} referência(s) inventariada(s).");
        $this->line("Migradas: {$result['migrated']}; já privadas: {$result['already_private']}; remoções públicas: {$result['removed_public']}; previstas: {$result['would_migrate']}.");

        foreach ($result['errors'] as $error) {
            $this->error($error);
        }

        return $result['errors'] === [] ? self::SUCCESS : self::FAILURE;
    }
}
