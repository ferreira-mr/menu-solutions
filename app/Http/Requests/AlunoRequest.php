<?php

namespace App\Http\Requests;

use App\Models\Aluno;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AlunoRequest extends FormRequest
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
        $routeAluno = $this->route('aluno');
        $alunoId = $routeAluno instanceof Aluno ? $routeAluno->id : $routeAluno;

        return [
            'nome' => 'required|string|max:45',
            'genero' => 'required|string|max:200',
            'descricao' => 'nullable|string|max:10000',
            'foto' => 'nullable|string|max:255',
            'turmas_id' => 'required|integer|exists:turmas,id',
            'data_nascimento' => 'required|date_format:Y-m-d',
            'rm' => ['required', 'string', 'max:200', Rule::unique('alunos', 'rm')->ignore($alunoId)],
        ];
    }
}
