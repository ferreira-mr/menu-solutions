import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    getUserData,
    getChatMembers,
    getChatMessages,
    sendMessage,
} from '../../services/api';
import placeholderAvatar from '../../assets/img/avatar.png';
import './ChatPage.css';

const CHAT_PAGE_SIZE = 20;

const messageChronologyValue = (message) => message?.data || message?.created_at || message?.updated_at;

const messageVersionValue = (message) => message?.updated_at || message?.created_at || message?.data;

const timestampOf = (value) => {
    const timestamp = Date.parse(value || '');
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const compareMessageIds = (left, right) => {
    if (left === undefined || left === null) return 1;
    if (right === undefined || right === null) return -1;

    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
    return String(left).localeCompare(String(right));
};

const compareMessages = (left, right) => (
    timestampOf(messageChronologyValue(left)) - timestampOf(messageChronologyValue(right))
    || compareMessageIds(left?.id, right?.id)
);

const incomingMessageIsNewer = (current, incoming) => {
    const currentVersion = timestampOf(messageVersionValue(current));
    const incomingVersion = timestampOf(messageVersionValue(incoming));

    if (incomingVersion !== currentVersion) return incomingVersion > currentVersion;
    return true;
};

const mergeMessages = (currentMessages, incomingMessages) => {
    const messagesById = new Map();
    const messagesWithoutId = [];

    [...currentMessages, ...incomingMessages].forEach((message) => {
        if (message?.id === undefined || message?.id === null) {
            messagesWithoutId.push(message);
            return;
        }

        const key = String(message.id);
        const current = messagesById.get(key);
        if (!current || incomingMessageIsNewer(current, message)) messagesById.set(key, message);
    });

    return [...messagesById.values(), ...messagesWithoutId].sort(compareMessages);
};

const normaliseMessagesResponse = (response) => {
    const data = response?.data;
    const messages = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
    const meta = response?.meta || (Array.isArray(data) ? {} : data?.meta) || {};

    return {
        messages,
        currentPage: Number(meta.current_page) > 0 ? Number(meta.current_page) : 1,
        lastPage: Number(meta.last_page) > 0 ? Number(meta.last_page) : 1,
    };
};

const isAbortError = (error) => error?.name === 'AbortError';

const ChatPage = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [messagePagination, setMessagePagination] = useState({ currentPage: 1, lastPage: 1 });
    const [messageError, setMessageError] = useState('');

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const pollingInterval = useRef(null);
    const mountedRef = useRef(false);
    const activeRequestsRef = useRef(new Set());
    const recentRequestSequenceRef = useRef(0);
    const lastAppliedRecentSequenceRef = useRef(0);

    const fetchMessages = useCallback(async ({ page = 1, initial = false } = {}) => {
        const controller = new AbortController();
        activeRequestsRef.current.add(controller);
        const requestSequence = page === 1 ? ++recentRequestSequenceRef.current : null;

        if (initial) setLoadingMessages(true);
        if (page > 1) setLoadingOlderMessages(true);

        try {
            const response = await getChatMessages(page, CHAT_PAGE_SIZE, { signal: controller.signal });
            if (!mountedRef.current) return;
            if (page === 1 && requestSequence < lastAppliedRecentSequenceRef.current) return;
            if (page === 1) lastAppliedRecentSequenceRef.current = requestSequence;

            const { messages: incomingMessages, currentPage, lastPage } = normaliseMessagesResponse(response);
            setMessages((currentMessages) => mergeMessages(currentMessages, incomingMessages));
            setMessagePagination((currentPagination) => ({
                currentPage: Math.max(currentPagination.currentPage, currentPage),
                lastPage: Math.max(currentPagination.lastPage, lastPage),
            }));
            setMessageError('');
        } catch (error) {
            if (!isAbortError(error) && mountedRef.current) {
                setMessageError('Não foi possível carregar as mensagens. Tente novamente.');
            }
        } finally {
            activeRequestsRef.current.delete(controller);
            if (mountedRef.current) {
                if (initial) setLoadingMessages(false);
                if (page > 1) setLoadingOlderMessages(false);
            }
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        const activeRequests = activeRequestsRef.current;

        const initChat = async () => {
            try {
                const userRes = await getUserData();
                const user = userRes.data || userRes;
                setCurrentUser(user);

                const membersRes = await getChatMembers();
                const membersData = membersRes.data || membersRes || [];
                setParticipants(membersData);

                await fetchMessages({ page: 1, initial: true });
            } catch (error) {
                if (mountedRef.current && !isAbortError(error)) {
                    setMessageError('Não foi possível iniciar o chat. Tente novamente.');
                }
            }
        };

        void initChat();

        pollingInterval.current = setInterval(() => {
            if (mountedRef.current) void fetchMessages({ page: 1 });
        }, 3000);

        return () => {
            mountedRef.current = false;
            if (pollingInterval.current) clearInterval(pollingInterval.current);
            activeRequests.forEach((controller) => controller.abort());
            activeRequests.clear();
        };
    }, [fetchMessages]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;

        if (isNearBottom || loadingMessages) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages, loadingMessages]);

    const loadOlderMessages = () => {
        if (loadingOlderMessages || messagePagination.currentPage >= messagePagination.lastPage) return;
        void fetchMessages({ page: messagePagination.currentPage + 1 });
    };

    const handleSendMessage = async (event) => {
        event.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
        const payload = {
            mensagem_chat: newMessage,
            visto: 'n',
            data: formattedDate,
            users_id: currentUser.id,
        };
        const messageText = newMessage;
        setNewMessage('');

        try {
            await sendMessage(payload);
            await fetchMessages({ page: 1 });
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (error) {
            setNewMessage(messageText);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessages = () => {
        let lastDate = null;

        return messages.map((message, index) => {
            const rawDate = messageChronologyValue(message);
            const messageDateObject = new Date(rawDate);
            const messageDate = messageDateObject.toLocaleDateString();
            const showDateDivider = messageDate !== lastDate;
            lastDate = messageDate;

            const isMe = String(message.users_id) === String(currentUser?.id);
            let senderName = 'Usuário';
            if (isMe) {
                senderName = currentUser.name;
            } else {
                const sender = participants.find((participant) => String(participant.id) === String(message.users_id));
                if (sender) senderName = sender.name;
            }

            return (
                <React.Fragment key={message.id || index}>
                    {showDateDivider && <div className="message-date-divider">{messageDate}</div>}
                    <div className={`message-bubble ${isMe ? 'sent' : 'received'}`}>
                        {!isMe && <div className="message-author">{senderName}</div>}
                        <div className="message-text">{message.mensagem_chat}</div>
                        <div className="message-footer">
                            <span className="message-time">{formatTime(rawDate)}</span>
                            {isMe && (
                                <i className={`bi ${message.visto === 's' ? 'bi-check2-all text-primary' : 'bi-check2'}`}></i>
                            )}
                        </div>
                    </div>
                </React.Fragment>
            );
        });
    };

    return (
        <div className="chat-container">
            <aside className="chat-sidebar">
                <div className="sidebar-header">
                    <h3>Membros</h3>
                </div>
                <div className="contacts-list">
                    {participants.map((contact) => (
                        <div key={contact.id} className="contact-item">
                            <div className="contact-avatar">
                                <img
                                    src={placeholderAvatar}
                                    alt={contact.name}
                                />
                                <span className={`status-dot ${contact.id === currentUser?.id ? 'online' : ''}`}></span>
                            </div>
                            <div className="contact-info">
                                <div className="contact-name">
                                    {contact.name} {contact.id === currentUser?.id ? '(Você)' : ''}
                                </div>
                                <div className="contact-role">
                                    {contact.nivel_user === 1 ? 'Inspetora' : contact.nivel_user === 2 ? 'Nutricionista' : 'Diretora'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="chat-window">
                <div className="chat-header">
                    <div className="chat-user-profile">
                        <div className="contact-avatar group-avatar">
                            <i className="bi bi-people-fill"></i>
                        </div>
                        <div className="chat-user-details">
                            <h4>Chat Geral da Equipe</h4>
                            <p className="chat-user-status">{participants.length} membros ativos</p>
                        </div>
                    </div>
                </div>

                <div className="messages-area" ref={messagesContainerRef}>
                    {messagePagination.currentPage < messagePagination.lastPage && (
                        <button
                            type="button"
                            className="chat-history-button"
                            onClick={loadOlderMessages}
                            disabled={loadingOlderMessages}
                        >
                            {loadingOlderMessages ? 'Carregando...' : 'Carregar mensagens anteriores'}
                        </button>
                    )}

                    {messageError && <div className="chat-error" role="alert">{messageError}</div>}

                    {loadingMessages && messages.length === 0 ? (
                        <div className="chat-loading">
                            <div className="spinner-border spinner-border-sm" role="status"></div>
                            <span>Carregando...</span>
                        </div>
                    ) : messages.length > 0 ? (
                        renderMessages()
                    ) : (
                        <div className="chat-empty-state">
                            <i className="bi bi-chat-dots"></i>
                            <p>Nenhuma mensagem ainda.</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Escreva uma mensagem..."
                        value={newMessage}
                        onChange={(event) => setNewMessage(event.target.value)}
                    />
                    <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
                        <i className="bi bi-send-fill"></i>
                    </button>
                </form>
            </main>
        </div>
    );
};

export default ChatPage;
