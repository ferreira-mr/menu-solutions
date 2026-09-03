<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContagenRequest extends FormRequest
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
			'qtd_contagem' => 'required|int|min:0',
			'turmas_id' => 'required|int|exists:turmas,id',
        ];
    }
}
