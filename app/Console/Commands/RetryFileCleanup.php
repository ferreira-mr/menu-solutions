<?php

namespace App\Console\Commands;

use App\Models\FileCleanupFailure;
use App\Services\CardapioService;
use Illuminate\Console\Command;

class RetryFileCleanup extends Command
{
    protected $signature = 'files:retry-cleanup {id? : Identificador da falha; sem ele tenta todas as pendentes}';

    protected $description = 'Retenta limpezas de arquivos registradas como pendentes';

    public function handle(CardapioService $cardapioService): int
    {
        $query = FileCleanupFailure::query()->whereNull('resolved_at')->orderBy('id');

        if ($this->argument('id') !== null) {
            $query->whereKey((int) $this->argument('id'));
        }

        $failures = $query->get();

        if ($failures->isEmpty()) {
            $this->info('Nenhuma limpeza pendente encontrada.');

            return self::SUCCESS;
        }

        $failed = 0;
        foreach ($failures as $failure) {
            if ($cardapioService->retryCleanupFailure($failure)) {
                $this->info("Limpeza #{$failure->id} concluída.");
            } else {
                $this->error("Limpeza #{$failure->id} continua pendente.");
                $failed++;
            }
        }

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
