<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use App\Models\AlunosHasNecessidade;

class ContagemOperacaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'idempotency_key' => $this->header('Idempotency-Key'),
        ]);
    }

    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'uuid'],
            'contagem_id' => ['nullable', 'integer', Rule::exists('contagens', 'id')->whereNull('deleted_at')],
            'turmas_id' => ['required', 'integer', Rule::exists('turmas', 'id')->whereNull('deleted_at')],
            'qtd_contagem' => ['required', 'integer', 'min:0', 'max:2147483647'],
            'presencas' => ['nullable', 'array'],
            'presencas.*.relacao_id' => ['required', 'integer', 'exists:alunos_has_necessidades,id'],
            'presencas.*.presenca_id' => ['nullable', 'integer', Rule::exists('contagem_nes', 'id')->whereNull('deleted_at')],
            'presencas.*.presente' => ['required', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! is_array($this->input('presencas'))) {
                return;
            }

            $relationIds = collect($this->input('presencas', []))
                ->pluck('relacao_id')
                ->filter(fn ($id): bool => $id !== null)
                ->map(fn ($id): int => (int) $id);

            if ($relationIds->count() !== $relationIds->unique()->count()) {
                $validator->errors()->add('presencas', 'A mesma relação não pode aparecer mais de uma vez.');
            }

            if ($relationIds->isEmpty()) {
                return;
            }

            $relations = AlunosHasNecessidade::query()
                ->with(['aluno', 'necessidade'])
                ->whereIn('id', $relationIds->all())
                ->get()
                ->keyBy('id');

            foreach ($relationIds->unique() as $relationId) {
                $relation = $relations->get($relationId);

                if (! $relation || ! $relation->aluno || ! $relation->necessidade) {
                    $validator->errors()->add(
                        'presencas',
                        'O aluno e a necessidade da relação devem estar ativos.',
                    );
                    break;
                }
            }
        });
    }
}
