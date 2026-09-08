<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(private UserService $userService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if (! auth()->user()->canManageUsers()) {
            return response()->json(['message' => 'Permissão negada'], 403);
        }

        $validated = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        $users = User::orderBy('id')->paginate($validated['limit'] ?? 15)->withQueryString();

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
        if (! $user->is(auth()->user()) && ! auth()->user()->canManageUsers()) {
            return response()->json(['message' => 'Permissão negada'], 403);
        }

        return new UserResource($user);

    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $actor = auth()->user();
        $isSelf = $user->is($actor);

        if (! $isSelf && ! $actor->canManageUsers()) {
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

        if (! $isSelf && $actor->canManageUsers()) {
            $rules['nivel_user'] = ['sometimes', 'integer', Rule::enum(UserRole::class)];
            $rules['password'] = 'sometimes|string|min:8|max:72|confirmed';
        } else {
            $rules['nivel_user'] = 'prohibited';
            $rules['password'] = 'prohibited';
        }

        $validated = $request->validate($rules);

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user = $this->userService->update($user, $validated, $actor);

        return new UserResource($user);
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(User $user): Response|JsonResponse
    {
        $actor = auth()->user();

        if ($user->is($actor)) {
            return response()->json(['message' => 'Não é permitido remover o próprio usuário'], 422);
        }

        if (! $actor->canManageUsers()) {
            return response()->json(['message' => 'Permissão negada'], 403);
        }

        $this->userService->delete($user, $actor);

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

        $this->userService->changePassword($user, Hash::make($newPassword));

        return response()->json(['message' => 'Senha alterada com sucesso!']);
    }
}
