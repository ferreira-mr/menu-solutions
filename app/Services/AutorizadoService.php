<?php

namespace App\Services;

use App\Enums\AutorizadoStatus;
use App\Models\Autorizado;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class AutorizadoService
{
    /**
     * Lista autorizações ordenadas por status (pendente primeiro) e data.
     */
    public function list(int $perPage = 20): LengthAwarePaginator
    {
        return Autorizado::orderByRaw("CASE WHEN status = 'pendente' THEN 0 ELSE 1 END")
            ->latest('created_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Cria autorização com status padrão 'pendente'.
     */
    public function create(array $data): Autorizado
    {
        return Autorizado::create([
            'titulo' => $data['titulo'],
            'conteudo' => $data['conteudo'],
        ]);
    }

    /**
     * Atualização feita pela Nutricionista (edição de conteúdo).
     */
    public function update(Autorizado $autorizado, array $data): Autorizado
    {
        if (! $autorizado->status->isPendente()) {
            throw new ConflictHttpException(
                'Autorização decidida não pode ser alterada sem um fluxo de reabertura.'
            );
        }

        $autorizado->update($data);

        return $autorizado;
    }

    /**
     * Aprovação / revisão realizada exclusivamente pela Diretoria.
     */
    public function approve(Autorizado $autorizado, array $data, User $decisor): Autorizado
    {
        $status = AutorizadoStatus::from($data['status']);
        $currentStatus = $autorizado->status;

        if (! $currentStatus->isPendente()) {
            if ($currentStatus === $status) {
                return $autorizado;
            }

            throw new ConflictHttpException(
                'A decisão final não pode ser alterada sem um fluxo de reabertura.'
            );
        }

        if ($status->isPendente()) {
            throw new ConflictHttpException('A decisão deve confirmar ou recusar a autorização.');
        }

        $autorizado->forceFill([
            'status' => $status,
            'decidido_por' => $decisor->id,
            'decidido_em' => now(),
        ])->save();

        return $autorizado;
    }

    /**
     * Exclui autorização.
     */
    public function delete(Autorizado $autorizado): void
    {
        $autorizado->delete();
    }
}
