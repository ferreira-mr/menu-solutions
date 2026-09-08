<?php

namespace App\Services;

use App\Models\Aluno;
use App\Models\AlunosHasNecessidade;
use App\Models\ContagemNe;
use App\Models\Cronograma;
use App\Models\Necessidade;
use App\Models\NecessidadesHasCronograma;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VinculoService
{
    public function attachNecessidades(Aluno $aluno, array $necessidadeIds): Aluno
    {
        return DB::transaction(function () use ($aluno, $necessidadeIds): Aluno {
            $this->assertActiveAluno($aluno);

            $ids = array_values(array_unique(array_map('intval', $necessidadeIds)));
            $necessidades = Necessidade::query()
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get();

            if ($necessidades->count() !== count($ids)) {
                throw ValidationException::withMessages([
                    'necessidades' => ['Todas as necessidades devem estar ativas.'],
                ]);
            }

            $aluno->necessidades()->syncWithoutDetaching($ids);

            return $aluno->load('necessidades');
        });
    }

    public function attachCronogramas(AlunosHasNecessidade $relacao, array $cronogramaIds): AlunosHasNecessidade
    {
        return DB::transaction(function () use ($relacao, $cronogramaIds): AlunosHasNecessidade {
            $relacao = AlunosHasNecessidade::query()
                ->with(['aluno', 'necessidade'])
                ->lockForUpdate()
                ->findOrFail($relacao->id);
            $this->assertActiveRelation($relacao);

            $ids = array_values(array_unique(array_map('intval', $cronogramaIds)));
            $cronogramas = Cronograma::query()
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get();

            if ($cronogramas->count() !== count($ids)) {
                throw ValidationException::withMessages([
                    'dias' => ['Todos os dias devem estar ativos.'],
                ]);
            }

            $relacao->necessidadesHasCronogramas()->syncWithoutDetaching($ids);

            return $relacao->load('necessidadesHasCronogramas');
        });
    }

    public function detachCronogramas(AlunosHasNecessidade $relacao, array $cronogramaIds): AlunosHasNecessidade
    {
        return DB::transaction(function () use ($relacao, $cronogramaIds): AlunosHasNecessidade {
            $relacao = AlunosHasNecessidade::query()
                ->with(['aluno', 'necessidade'])
                ->lockForUpdate()
                ->findOrFail($relacao->id);
            $this->assertActiveRelation($relacao);

            $ids = array_values(array_unique(array_map('intval', $cronogramaIds)));
            $cronogramas = Cronograma::query()->whereIn('id', $ids)->lockForUpdate()->get();

            if ($cronogramas->count() !== count($ids)) {
                throw ValidationException::withMessages([
                    'dias' => ['Todos os dias devem estar ativos.'],
                ]);
            }

            $relacao->necessidadesHasCronogramas()->detach($ids);

            return $relacao->load('necessidadesHasCronogramas');
        });
    }

    public function createPresence(int $relacaoId): ContagemNe
    {
        return DB::transaction(function () use ($relacaoId): ContagemNe {
            $relacao = AlunosHasNecessidade::query()
                ->with(['aluno', 'necessidade'])
                ->lockForUpdate()
                ->findOrFail($relacaoId);
            $this->assertActiveRelation($relacao);

            return ContagemNe::create([
                'alunos_has_necessidades_id' => $relacao->id,
            ]);
        });
    }

    public function updatePresence(ContagemNe $presenca, int $relacaoId): ContagemNe
    {
        return DB::transaction(function () use ($presenca, $relacaoId): ContagemNe {
            $relacao = AlunosHasNecessidade::query()
                ->with(['aluno', 'necessidade'])
                ->lockForUpdate()
                ->findOrFail($relacaoId);
            $this->assertActiveRelation($relacao);

            $presenca->update(['alunos_has_necessidades_id' => $relacao->id]);

            return $presenca->refresh();
        });
    }

    public function removeStudentFromNeed(Necessidade $necessidade, int $alunoId): void
    {
        DB::transaction(function () use ($necessidade, $alunoId): void {
            if ($necessidade->trashed()) {
                throw new HttpException(422, 'A necessidade deve estar ativa.');
            }

            $relacao = AlunosHasNecessidade::query()
                ->where('alunos_id', $alunoId)
                ->where('necessidades_id', $necessidade->id)
                ->lockForUpdate()
                ->first();

            if (! $relacao) {
                throw new HttpException(404, 'Relação de necessidade e aluno não encontrada');
            }

            if (ContagemNe::withTrashed()
                ->where('alunos_has_necessidades_id', $relacao->id)
                ->exists()) {
                throw new HttpException(409, 'Não é possível remover uma relação que já possui contagens registradas');
            }

            NecessidadesHasCronograma::query()
                ->where('alunos_has_necessidades_id', $relacao->id)
                ->delete();
            $relacao->delete();
        });
    }

    private function assertActiveAluno(Aluno $aluno): void
    {
        if ($aluno->trashed()) {
            throw ValidationException::withMessages([
                'aluno' => ['O aluno deve estar ativo.'],
            ]);
        }
    }

    private function assertActiveRelation(AlunosHasNecessidade $relacao): void
    {
        if (! $relacao->aluno || ! $relacao->necessidade) {
            throw ValidationException::withMessages([
                'alunos_has_necessidades_id' => ['O aluno e a necessidade da relação devem estar ativos.'],
            ]);
        }
    }
}
