<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Laravel\Sanctum\PersonalAccessToken;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if (! auth()->user()->isNutri()) {
            return response()->json(['message' => 'Permissão negada'], 403);
        }

        $users = User::paginate();

        return UserResource::collection($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request): JsonResponse
    {
        $user = User::create(array_merge($request->validated(), ['password' => Hash::make($request->password)]));

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        if ($user->id != auth()->user()->id && ! auth()->user()->isNutri()) {
            return response()->json(['message' => 'Permissão negada'], 403);
        }

        return new UserResource($user);

    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        if ($user->id != auth()->user()->id && ! auth()->user()->isNutri()) {
            return response()->json(['message' => 'Permissão negada'], 403);
        }

        $rules = [
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'nif' => [
                'sometimes', 'string', 'max:255',
                Rule::unique('users', 'nif')->ignore($user->id),
            ],
        ];

        if (auth()->user()->isNutri()) {
            $rules['nivel_user'] = 'sometimes|integer|in:1,2,3';
            $rules['password'] = 'sometimes|string|min:8|max:72|confirmed';
        }

        $validated = $request->validate($rules);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return new UserResource($user);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(User $user): Response|JsonResponse
    {
        if ($user->is(auth()->user())) {
            return response()->json(['message' => 'Não é permitido remover o próprio usuário'], 422);
        }

        $user->delete();

        return response()->noContent();
    }

    public function resetPassword(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'senha_atual' => 'required|string',
            'new_password' => 'required|string|min:8|max:72|confirmed',
        ]);

        $passwordAtual = $validated['senha_atual'];
        $newPassword = $validated['new_password'];

        if (! Hash::check($passwordAtual, $user->password)) {
            return response()->json(['message' => 'Senha atual nao compativel'], 400);
        }

        $user->update([
            'password' => Hash::make($newPassword),
        ]);
        // Uma alteração de senha invalida sessões e tokens emitidos anteriormente.
        $user->tokens()->delete();
        if ($request->bearerToken()) {
            PersonalAccessToken::findToken($request->bearerToken())?->delete();
        }

        return response()->json(['message' => 'Senha alterada com sucesso!']);
    }
}
