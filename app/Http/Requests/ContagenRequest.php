<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
			'qtd_contagem' => ['required', 'integer', 'min:0', 'max:2147483647'],
			'turmas_id' => ['required', 'integer', Rule::exists('turmas', 'id')->whereNull('deleted_at')],
        ];
    }
}
