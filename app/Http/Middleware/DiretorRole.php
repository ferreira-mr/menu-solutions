<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DiretorRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && (int) $request->user()->nivel_user === 3) {
            return $next($request);
        }

        return response()->json(['message' => 'Rota protegida apenas para Diretores'], 403);
    }
}
