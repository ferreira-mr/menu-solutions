<?php

namespace App\Http\Controllers;

use App\Http\Resources\DashboardResource;
use App\Models\Categoria;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function contagemDashboard(Request $request)
    {
        $validated = $request->validate([
            'data' => ['sometimes', 'date_format:Y-m-d'],
        ]);
        $date = $validated['data'] ?? today()->toDateString();

        $data = Categoria::with(['turmas.contagen' => function ($query) use ($date) {
            $query->where('data_contagem', $date)->latest('hora_contagem');
        }])->get();

        return DashboardResource::collection($data);
    }
}
