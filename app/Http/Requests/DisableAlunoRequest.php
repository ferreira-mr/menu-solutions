<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class DisableAlunoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'alunos' => ['required'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $value = $this->input('alunos');
            $validScalar = is_int($value) && $value > 0;
            $validArray = is_array($value)
                && array_keys($value) === [0]
                && is_int($value[0])
                && $value[0] > 0;

            if (! $validScalar && ! $validArray) {
                $validator->errors()->add(
                    'alunos',
                    'Informe um ID inteiro positivo ou um array com exatamente um ID inteiro positivo.',
                );
            }
        });
    }

    public function alunoId(): int
    {
        $value = $this->validated('alunos');

        return is_array($value) ? $value[0] : $value;
    }
}
