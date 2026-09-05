<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
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
        $user = $request->user();
        $isNutri = $user && ($user->nivel_user === UserRole::Nutri || (int) $user->nivel_user === UserRole::Nutri->value);

        if (! $isNutri) {
            return response()->json(['message' => 'Rota protegida para a nutricionista administradora (nível 2)'], 403);
        }

        return $next($request);
    }
}
