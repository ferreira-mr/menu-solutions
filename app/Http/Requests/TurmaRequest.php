<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TurmaRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nome_turma' => [
                'required',
                'string',
                'max:45',
                Rule::unique('turmas', 'nome_turma')
                    ->where(fn ($query) => $query->where('categorias_id', $this->input('categorias_id'))),
            ],
            'categorias_id' => [
                'required',
                'integer',
                Rule::exists('categorias', 'id')->whereNull('deleted_at'),
            ],
        ];
    }
}
