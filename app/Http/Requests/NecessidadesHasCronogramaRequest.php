<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NecessidadesHasCronogramaRequest extends FormRequest
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
			'alunos_has_necessidades_id' => 'required|integer|exists:alunos_has_necessidades,id',
			'cronograma_id' => ['required', 'integer', Rule::exists('cronogramas', 'id')->whereNull('deleted_at')],
        ];
    }
}
