<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class BootstrapAdmin extends Command
{
    protected $signature = 'app:bootstrap-admin
                            {--name= : Nome completo do primeiro gestor}
                            {--nif= : NIF usado no login}
                            {--email= : E-mail do gestor}';

    protected $description = 'Cria o primeiro gestor sem redefinir uma identidade existente';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Nome completo do gestor');
        $nif = $this->option('nif') ?: $this->ask('NIF do gestor');
        $email = $this->option('email') ?: $this->ask('E-mail do gestor');

        $existing = User::withTrashed()->where('nif', $nif)->first();
        if ($existing !== null) {
            $this->info('A identidade informada já existe; nenhuma credencial foi alterada.');

            return self::SUCCESS;
        }

        $validation = Validator::make(
            compact('name', 'nif', 'email'),
            [
                'name' => ['required', 'string', 'max:255'],
                'nif' => ['required', 'string', 'max:255', 'unique:users,nif'],
                'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            ],
        );

        if ($validation->fails()) {
            foreach ($validation->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $password = $this->secret('Senha inicial do gestor');
        $confirmation = $this->secret('Confirme a senha inicial');

        if (! is_string($password) || mb_strlen($password) < 8 || mb_strlen($password) > 72) {
            $this->error('A senha deve ter entre 8 e 72 caracteres.');

            return self::FAILURE;
        }

        if (! is_string($confirmation) || ! hash_equals($password, $confirmation)) {
            $this->error('As senhas não conferem.');

            return self::FAILURE;
        }

        User::create([
            'name' => $name,
            'nif' => $nif,
            'email' => $email,
            'password' => Hash::make($password),
            'nivel_user' => UserRole::Diretor->value,
        ]);

        $this->info('Gestor inicial criado com sucesso.');

        return self::SUCCESS;
    }
}
