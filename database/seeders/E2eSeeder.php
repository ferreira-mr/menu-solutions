<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class E2eSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['nif' => '22222222222'],
            [
                'name' => 'Nutricionista E2E',
                'email' => 'e2e-nutri@example.test',
                'password' => Hash::make('password'),
                'nivel_user' => 2,
            ],
        );

        User::updateOrCreate(
            ['nif' => '33333333333'],
            [
                'name' => 'Diretora E2E',
                'email' => 'e2e-diretora@example.test',
                'password' => Hash::make('password'),
                'nivel_user' => 3,
            ],
        );

        User::updateOrCreate(
            ['nif' => '11111111111'],
            [
                'name' => 'Inspetora E2E',
                'email' => 'e2e-inspetora@example.test',
                'password' => Hash::make('password'),
                'nivel_user' => 1,
            ],
        );
    }
}
