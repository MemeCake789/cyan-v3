const API_URL = "https://cyan-data.vercel.app/api/chat";

export async function getAllChats() {
  const res = await fetch(`${API_URL}?action=get_all_chats`);
  if (!res.ok) throw new Error("Failed to fetch chats");
  return await res.json();
}

export async function getMessages(
  chatId: string,
  key: string | null = null,
  since: string | null = null
) {
  const headers = new Headers();
  if (key) {
    headers.append("x-chat-key", key);
  }
  let url = `${API_URL}?chatId=${chatId}`;
  if (since) {
    url += `&since=${since}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to load messages");
  return await res.json();
}

export async function sendMessage(chatId: string, text: string, user: string, key: string | null = null) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (key) {
    headers.append("x-chat-key", key);
  }

  const payload = { action: "send_message", chatId, text, user };

  const res = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Failed to send message' }));
    throw new Error(errorData.message || 'Failed to send message');
  }
  return await res.json();
}

export async function createChat(name: string, type: 'public' | 'private', key: string | null = null) {
  const payload: { action: string; name: string; type: 'public' | 'private'; key?: string } = {
    action: "create_chat",
    name,
    type,
  };

  if (type === 'private' && key) {
    payload.key = key;
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Failed to create chat' }));
    throw new Error(errorData.message || 'Failed to create chat');
  }
  return await res.json();
}