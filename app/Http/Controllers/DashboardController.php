<?php

namespace App\Http\Controllers;

use App\Services\ContagemService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected ContagemService $contagemService
    ) {}

    public function contagemDashboard(Request $request)
    {
        $validated = $request->validate([
            'data' => ['sometimes', 'date_format:Y-m-d'],
        ]);
        $date = $validated['data'] ?? today()->toDateString();

        return $this->contagemService->getDashboard($date);
    }
}
