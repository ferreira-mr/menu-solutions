<?php

namespace App\Http\Controllers;

use App\Services\ContagemService;
use App\Services\SchoolCalendarService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected ContagemService $contagemService,
        protected SchoolCalendarService $schoolCalendar,
    ) {}

    public function contagemDashboard(Request $request)
    {
        $validated = $request->validate([
            'data' => ['sometimes', 'date_format:Y-m-d'],
        ]);
        $date = $validated['data'] ?? $this->schoolCalendar->currentDate();

        return $this->contagemService->getDashboard($date);
    }
}
