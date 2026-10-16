<?php

namespace App\Services;

use App\Enums\AutorizadoStatus;
use App\Models\Autorizado;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class AutorizadoService
{
    /**
     * Lista autorizações ordenadas por status (pendente primeiro) e data.
     */
    public function list(int $perPage = 20): LengthAwarePaginator
    {
        return Autorizado::orderByRaw('CASE WHEN status = ? THEN 0 ELSE 1 END', [AutorizadoStatus::Pendente->value])
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
        return DB::transaction(function () use ($autorizado, $data): Autorizado {
            $locked = Autorizado::query()->lockForUpdate()->findOrFail($autorizado->id);

            if (! $locked->status->isPendente()) {
                throw new ConflictHttpException(
                    'Autorização decidida não pode ser alterada sem um fluxo de reabertura.'
                );
            }

            $locked->update($data);

            return $locked->refresh();
        });
    }

    /**
     * Aprovação / revisão realizada exclusivamente pela Diretoria.
     */
    public function approve(Autorizado $autorizado, array $data, User $decisor): Autorizado
    {
        return DB::transaction(function () use ($autorizado, $data, $decisor): Autorizado {
            $locked = Autorizado::query()->lockForUpdate()->findOrFail($autorizado->id);
            $status = AutorizadoStatus::from($data['status']);
            $currentStatus = $locked->status;

            if (! $currentStatus->isPendente()) {
                if ($currentStatus === $status) {
                    return $locked;
                }

                throw new ConflictHttpException(
                    'A decisão final não pode ser alterada sem um fluxo de reabertura.'
                );
            }

            if ($status->isPendente()) {
                throw new ConflictHttpException('A decisão deve confirmar ou recusar a autorização.');
            }

            $locked->forceFill([
                'status' => $status,
                'decidido_por' => $decisor->id,
                'decidido_em' => now(),
            ])->save();

            return $locked->refresh();
        });
    }

    /**
     * Exclui autorização.
     */
    public function delete(Autorizado $autorizado): void
    {
        DB::transaction(function () use ($autorizado): void {
            $locked = Autorizado::query()->lockForUpdate()->findOrFail($autorizado->id);

            if (! $locked->status->isPendente()) {
                throw new ConflictHttpException(
                    'Não é possível excluir uma solicitação já decidida pela diretoria.'
                );
            }

            $locked->delete();
        });
    }
}
