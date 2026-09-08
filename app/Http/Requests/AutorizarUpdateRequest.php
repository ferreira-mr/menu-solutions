<?php

namespace App\Http\Requests;

use App\Enums\AutorizadoStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AutorizarUpdateRequest extends FormRequest
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
            'titulo' => 'prohibited',
            'conteudo' => 'prohibited',
            'status' => ['required', Rule::enum(AutorizadoStatus::class)],
        ];
    }
}
