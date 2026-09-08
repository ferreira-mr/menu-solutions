<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SchoolCalendarService;

class SchoolCalendarController extends Controller
{
    public function __construct(
        protected SchoolCalendarService $schoolCalendar,
    ) {}

    public function show()
    {
        return response()->json(['data' => $this->schoolCalendar->metadata()]);
    }
}
