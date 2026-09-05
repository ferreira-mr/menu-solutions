<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
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
        $user = $request->user();
        $isDiretor = $user && ($user->nivel_user === UserRole::Diretor || (int) $user->nivel_user === UserRole::Diretor->value);

        if ($isDiretor) {
            return $next($request);
        }

        return response()->json(['message' => 'Rota protegida apenas para Diretores'], 403);
    }
}
