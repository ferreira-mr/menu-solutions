<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffOrNutriRole
{
    /**
     * Handle an incoming request.
     * Permite operadores de contagem (nível 1 - Inspetora e nível 2 - Nutricionista).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $allowed = [UserRole::Staff->value, UserRole::Nutri->value];
        $val = $user && $user->nivel_user instanceof UserRole ? $user->nivel_user->value : ($user ? (int) $user->nivel_user : null);

        if (! $user || ! in_array($val, $allowed, true)) {
            return response()->json(['message' => 'Acesso restrito para inspetoria e nutrição'], 403);
        }

        return $next($request);
    }
}
