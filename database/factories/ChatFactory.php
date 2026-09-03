<?php

namespace Database\Factories;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChatFactory extends Factory
{
    protected $model = Chat::class;

    public function definition(): array
    {
        return [
            'mensagem_chat' => fake()->sentence(4),
            'visto' => 'n',
            'data' => now(),
            'users_id' => User::factory(),
        ];
    }
}
