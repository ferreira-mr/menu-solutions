<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContagemOperacaoRequest;
use App\Services\ContagemOperationService;

class ContagemOperationController extends Controller
{
    public function __construct(
        protected ContagemOperationService $contagemOperationService,
    ) {}

    public function store(ContagemOperacaoRequest $request)
    {
        $result = $this->contagemOperationService->execute(
            $request->validated(),
            (int) $request->user()->id,
        );

        return response()->json(['data' => $result['body']], $result['status']);
    }
}
