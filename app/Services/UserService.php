<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class UserService
{
    /**
     * Update a user and revoke sessions when credentials or role change.
     *
     * Validation belongs to the controller/FormRequest; persistence and its
     * session side effects are committed together here.
     *
     * @param array<string, mixed> $attributes
     */
    public function update(User $user, array $attributes, ?User $actor = null): User
    {
        $passwordChanged = array_key_exists('password', $attributes);
        $roleChanged = array_key_exists('nivel_user', $attributes)
            && (int) $user->nivel_user !== (int) $attributes['nivel_user'];

        if ($roleChanged && $user->is($actor)) {
            throw new ConflictHttpException('Não é permitido alterar o próprio nível de acesso.');
        }

        return DB::transaction(function () use ($user, $attributes, $passwordChanged, $roleChanged): User {
            if ($roleChanged && $this->isManager($user) && (int) $attributes['nivel_user'] === UserRole::Staff->value) {
                $this->ensureAnotherManagerExists($user);
            }

            $user->update($attributes);

            if ($passwordChanged || $roleChanged) {
                $user->tokens()->delete();
            }

            return $user->refresh();
        });
    }

    public function delete(User $user, ?User $actor = null): void
    {
        DB::transaction(function () use ($user): void {
            if ($this->isManager($user)) {
                $this->ensureAnotherManagerExists($user);
            }

            $user->delete();
            $user->tokens()->delete();
        });
    }

    public function changePassword(User $user, string $hashedPassword): User
    {
        return DB::transaction(function () use ($user, $hashedPassword): User {
            $user->update(['password' => $hashedPassword]);
            $user->tokens()->delete();

            return $user->refresh();
        });
    }

    private function isManager(User $user): bool
    {
        return $user->canManageUsers();
    }

    private function ensureAnotherManagerExists(User $user): void
    {
        $hasAnotherManager = User::query()
            ->whereKeyNot($user->id)
            ->whereIn('nivel_user', [UserRole::Nutri->value, UserRole::Diretor->value])
            ->lockForUpdate()
            ->exists();

        if (! $hasAnotherManager) {
            throw new ConflictHttpException('Não é permitido remover ou rebaixar o último gestor ativo.');
        }
    }
}
