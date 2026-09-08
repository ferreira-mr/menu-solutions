<?php

namespace App\Services;

use App\Http\Resources\ContagenResource;
use App\Http\Resources\DashboardResource;
use App\Models\Categoria;
use App\Models\Contagen;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class ContagemService
{
    public function __construct(
        protected SchoolCalendarService $schoolCalendar,
        protected ContagemTotalsService $contagemTotals,
    ) {}

    /**
     * Retorna contagens com filtros e ordenação padrão.
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $day = $filters['data'] ?? $filters['date'] ?? null;
        $dataInicio = $filters['data_inicio'] ?? null;
        $dataFim = $filters['data_fim'] ?? null;

        $query = Contagen::with(['turma.categoria'])
            ->orderBy('data_contagem', 'DESC')
            ->orderBy('hora_contagem', 'DESC')
            ->orderBy('id', 'DESC');

        if ($day) {
            $query->where('data_contagem', $day);
        } elseif ($dataInicio && $dataFim) {
            $query->whereBetween('data_contagem', [$dataInicio, $dataFim]);
        } elseif ($dataInicio) {
            $query->where('data_contagem', '>=', $dataInicio);
        } elseif ($dataFim) {
            $query->where('data_contagem', '<=', $dataFim);
        }

        $perPage = $filters['limit'] ?? 15;

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Cria contagem com auditoria de usuário e horário automático do servidor.
     */
    public function create(array $data, int $userId): Contagen
    {
        $agora = $this->schoolCalendar->nowLocal();

        return Contagen::create(array_merge($data, [
            'data_contagem' => $agora->toDateString(),
            'hora_contagem' => $agora->toTimeString(),
            'users_id' => $userId,
        ]));
    }

    /**
     * Atualiza contagem garantindo a regra de janela diária (RN14).
     */
    public function update(Contagen $contagem, array $data): Contagen
    {
        $dataContagemStr = $contagem->data_contagem?->format('Y-m-d') ?? (string) $contagem->data_contagem;
        $hojeStr = $this->schoolCalendar->currentDate();

        if ($dataContagemStr !== $hojeStr) {
            throw ValidationException::withMessages([
                'data_contagem' => ['Não é permitido editar contagens de dias anteriores.'],
            ]);
        }

        $contagem->update($data);

        return $contagem;
    }

    public function isCurrentSchoolDate(?string $civilDate): bool
    {
        return $this->schoolCalendar->isCurrentDate($civilDate);
    }

    /**
     * Exclui contagem (soft delete).
     */
    public function delete(Contagen $contagem): void
    {
        $contagem->delete();
    }

    /**
     * Carrega dados do dashboard de contagem por categoria para a data especificada.
     */
    public function getDashboard(string $date): AnonymousResourceCollection
    {
        $data = Categoria::with(['turmas.contagen' => function ($query) use ($date) {
            $query->where('data_contagem', $date)
                ->orderByDesc('hora_contagem')
                ->orderByDesc('id');
        }])->get();

        return DashboardResource::collection($data)->additional([
            'totals' => $this->contagemTotals->fromDashboardCategories($data),
        ]);
    }
}
