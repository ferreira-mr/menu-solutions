<?php

namespace Tests\Feature\BusinessRules;

use App\Models\Chat;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_send_chat_message(): void
    {
        $user = User::factory()->create(['name' => 'Inspetora Chat', 'nivel_user' => 1]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/chats', [
            'mensagem_chat' => 'Bom dia equipe, contagem finalizada!',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('chat', [
            'mensagem_chat' => 'Bom dia equipe, contagem finalizada!',
            'users_id' => $user->id,
            'visto' => 'n',
        ]);
    }

    public function test_message_validation_rejects_empty_or_too_long_content(): void
    {
        $user = User::factory()->create(['nivel_user' => 2]);

        $emptyRes = $this->actingAs($user, 'sanctum')->postJson('/api/chats', [
            'mensagem_chat' => '',
        ]);
        $emptyRes->assertUnprocessable();

        $tooLongRes = $this->actingAs($user, 'sanctum')->postJson('/api/chats', [
            'mensagem_chat' => str_repeat('A', 101),
        ]);
        $tooLongRes->assertUnprocessable();
    }

    public function test_only_message_author_can_update_or_delete_message(): void
    {
        $author = User::factory()->create(['nivel_user' => 1]);
        $otherUser = User::factory()->create(['nivel_user' => 2]);

        $chat = Chat::create([
            'mensagem_chat' => 'Mensagem original',
            'visto' => 'n',
            'data' => now(),
            'users_id' => $author->id,
        ]);

        // Other user attempts update -> 403
        $this->actingAs($otherUser, 'sanctum')
            ->putJson('/api/chats/'.$chat->id, ['mensagem_chat' => 'Alterado'])
            ->assertForbidden();

        // Other user attempts deletion -> 403
        $this->actingAs($otherUser, 'sanctum')
            ->deleteJson('/api/chats/'.$chat->id)
            ->assertForbidden();

        // Author updates -> 200
        $this->actingAs($author, 'sanctum')
            ->putJson('/api/chats/'.$chat->id, ['mensagem_chat' => 'Mensagem corrigida', 'visto' => 's'])
            ->assertOk();

        $this->assertDatabaseHas('chat', [
            'id' => $chat->id,
            'mensagem_chat' => 'Mensagem corrigida',
            'visto' => 's',
        ]);

        // Author deletes -> 204
        $this->actingAs($author, 'sanctum')
            ->deleteJson('/api/chats/'.$chat->id)
            ->assertNoContent();

        $this->assertSoftDeleted('chat', ['id' => $chat->id]);
    }

    public function test_recipient_can_mark_message_as_seen(): void
    {
        $author = User::factory()->create(['nivel_user' => 1]);
        $recipient = User::factory()->create(['nivel_user' => 2]);

        $chat = Chat::create([
            'mensagem_chat' => 'Olá!',
            'visto' => 'n',
            'data' => now(),
            'users_id' => $author->id,
        ]);

        $this->actingAs($recipient, 'sanctum')
            ->putJson('/api/chats/'.$chat->id, ['visto' => 's'])
            ->assertOk()
            ->assertJsonPath('data.visto', 's');

        $this->assertDatabaseHas('chat', [
            'id' => $chat->id,
            'visto' => 's',
        ]);
    }

    public function test_get_chat_members_returns_all_participants_with_messages(): void
    {
        $user1 = User::factory()->create(['name' => 'Ana Inspetora', 'nivel_user' => 1]);
        $user2 = User::factory()->create(['name' => 'Beatriz Nutri', 'nivel_user' => 2]);
        $user3 = User::factory()->create(['name' => 'Carlos Silencioso', 'nivel_user' => 3]);

        Chat::create([
            'mensagem_chat' => 'Olá',
            'visto' => 's',
            'data' => now(),
            'users_id' => $user1->id,
        ]);

        Chat::create([
            'mensagem_chat' => 'Oi Ana',
            'visto' => 's',
            'data' => now(),
            'users_id' => $user2->id,
        ]);

        $response = $this->actingAs($user1, 'sanctum')->getJson('/api/getMembers');
        $response->assertOk();

        $memberNames = collect($response->json('data'))->pluck('name')->all();
        $this->assertContains('Ana Inspetora', $memberNames);
        $this->assertContains('Beatriz Nutri', $memberNames);
        $this->assertNotContains('Carlos Silencioso', $memberNames);
    }

    public function test_chat_and_member_resources_expose_only_minimal_participant_fields(): void
    {
        $author = User::factory()->create(['name' => 'Autora', 'nivel_user' => 1]);
        $reader = User::factory()->create(['name' => 'Leitora', 'nivel_user' => 2]);
        Chat::create([
            'mensagem_chat' => 'Mensagem mínima',
            'visto' => 'n',
            'data' => now(),
            'users_id' => $author->id,
        ]);

        $members = $this->actingAs($reader, 'sanctum')->getJson('/api/getMembers')->assertOk();
        $member = collect($members->json('data'))->firstWhere('id', $author->id);
        $this->assertSame(['id', 'name', 'nivel_user'], array_keys($member));
        $this->assertArrayNotHasKey('email', $member);
        $this->assertArrayNotHasKey('nif', $member);

        $messages = $this->actingAs($reader, 'sanctum')->getJson('/api/chats')->assertOk();
        $participant = $messages->json('data.0.user');
        $this->assertSame(['id', 'name', 'nivel_user'], array_keys($participant));
        $this->assertArrayNotHasKey('email', $participant);
        $this->assertArrayNotHasKey('nif', $participant);
    }

    public function test_chat_index_keeps_paginated_envelope_and_deterministic_order(): void
    {
        $user = User::factory()->create(['nivel_user' => 1]);
        $createdAt = CarbonImmutable::parse('2026-09-04 07:15:00');

        foreach (['Primeira', 'Segunda', 'Terceira'] as $message) {
            $chat = new Chat([
                'mensagem_chat' => $message,
                'visto' => 'n',
                'data' => $createdAt,
                'users_id' => $user->id,
            ]);
            $chat->created_at = $createdAt;
            $chat->updated_at = $createdAt;
            $chat->save();
        }

        $pageOne = $this->actingAs($user, 'sanctum')->getJson('/api/chats?page=1&limit=2');
        $pageOne->assertOk()->assertJsonStructure([
            'data' => [['id', 'updated_at']],
            'links' => ['first', 'last', 'prev', 'next'],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
        $this->assertSame(1, $pageOne->json('meta.current_page'));
        $this->assertSame(2, $pageOne->json('meta.last_page'));
        $this->assertSame(2, $pageOne->json('meta.per_page'));
        $this->assertSame(3, $pageOne->json('meta.total'));
        $this->assertSame([3, 2], collect($pageOne->json('data'))->pluck('id')->all());

        $pageTwo = $this->actingAs($user, 'sanctum')->getJson('/api/chats?page=2&limit=2');
        $pageTwo->assertOk();
        $this->assertSame([1], collect($pageTwo->json('data'))->pluck('id')->all());
    }
}
