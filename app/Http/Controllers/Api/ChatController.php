<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatRequest;
use App\Http\Resources\ChatResource;
use App\Http\Resources\UserResource;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ChatController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $chats = Chat::with('user')->orderBy('created_at', 'DESC')->paginate();

        return ChatResource::collection($chats);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ChatRequest $request)
    {
        $chat = Chat::create([
            'mensagem_chat' => $request->validated()['mensagem_chat'],
            'visto' => 'n',
            'data' => now(),
            'users_id' => auth()->id(),
        ]);

        return (new ChatResource($chat))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Chat $chat)
    {
        return (new ChatResource($chat))->response();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Chat $chat)
    {
        abort_unless((int) $chat->users_id === (int) auth()->id(), 403, 'Você só pode editar suas próprias mensagens');

        $chat->update($request->validate([
            'mensagem_chat' => 'sometimes|string|max:100',
            'visto' => 'sometimes|in:s,n',
        ]));

        return (new ChatResource($chat))->response();
    }

    /**
     * Delete the specified resource.
     */
    public function destroy(Chat $chat): Response
    {
        abort_unless((int) $chat->users_id === (int) auth()->id(), 403, 'Você só pode remover suas próprias mensagens');

        $chat->delete();

        return response()->noContent();
    }

    public function getChatMembers()
    {
        $data = User::whereHas('chat')->orderBy('name')->get();

        return UserResource::collection($data);
    }
}
