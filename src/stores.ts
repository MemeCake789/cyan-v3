import { writable } from 'svelte/store';

function generateAnonymousName() {
  return "anonymous-" + Math.floor(Math.random() * 10000);
}

export const username = writable(generateAnonymousName());

export const chats = writable([]);

export const activeChat = writable<{ chatId: string; name: string; type: string; key?: string } | null>({
    chatId: 'global',
    name: 'Global',
    type: 'public'
});

export const showCreateChatModal = writable(false);
export const newlyCreatedChat = writable<{ chatId: string; name: string; type: string; key?: string } | null>(null);
