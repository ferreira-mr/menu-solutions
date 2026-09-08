<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UserManagementRole
{
    /**
     * Allow only the roles that can manage another user's account.
     *
     * Self-profile operations remain available through the controller's
     * identity check and do not use this middleware.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->canManageUsers()) {
            return $next($request);
        }

        return response()->json(['message' => 'Permissão negada'], 403);
    }
}
