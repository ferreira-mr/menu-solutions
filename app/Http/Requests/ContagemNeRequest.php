<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use App\Models\AlunosHasNecessidade;

class ContagemNeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'alunos_has_necessidades_id' => [
                'required',
                'integer',
                Rule::exists('alunos_has_necessidades', 'id'),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $relationId = $this->input('alunos_has_necessidades_id');

            if (! is_int($relationId)) {
                return;
            }

            $relation = AlunosHasNecessidade::query()
                ->with(['aluno', 'necessidade'])
                ->find($relationId);

            if (! $relation || ! $relation->aluno || ! $relation->necessidade) {
                $validator->errors()->add(
                    'alunos_has_necessidades_id',
                    'O aluno e a necessidade da relação devem estar ativos.',
                );
            }
        });
    }
}
