<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NutriRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Nível 2 é o administrador operacional (nutricionista). O diretor
        // (nível 3) possui somente as rotas explicitamente destinadas a ele.
        if (! $request->user() || (int) $request->user()->nivel_user !== 2) {
            return response()->json(['message' => 'Rota protegida para a nutricionista administradora (nível 2)'], 403);
        }

        return $next($request);
    }
}
