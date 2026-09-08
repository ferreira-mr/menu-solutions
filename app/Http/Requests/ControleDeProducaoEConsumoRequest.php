<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ControleDeProducaoEConsumoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome_alimento' => 'required|string|max:100',
            'data_alimento' => 'required|date_format:Y-m-d',
            'quantidade_alimento' => ['required', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
            'medida_alimento' => 'required|string|max:10',
            'pessoas_alimento' => ['required', 'integer', 'min:0', 'max:2147483647'],
            'sobra_limpa_alimento' => ['required', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
            'desperdicio_alimento' => ['required', 'numeric', 'min:0', 'max:999999.99', 'decimal:0,2'],
        ];
    }
}
