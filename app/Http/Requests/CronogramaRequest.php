<?php

namespace App\Http\Requests;

use App\Models\Cronograma;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CronogramaRequest extends FormRequest
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
        $cronograma = $this->route('cronograma');
        $cronogramaId = $cronograma instanceof Cronograma ? $cronograma->id : null;

        return [
            'dia' => [
                'required',
                'string',
                'max:255',
                Rule::unique('cronogramas', 'dia')->ignore($cronogramaId),
            ],
        ];
    }
}
