import { db } from "./firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  Timestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

/**
 * Retrieve all chat metadata (e.g., list of chat rooms).
 */
export async function getAllChats() {
  const chatsCol = collection(db, "chats");
  const chatSnapshot = await getDocs(chatsCol);
  const chatList = chatSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return chatList;
}

/**
 * Subscribe to a real‑time stream of messages, ordered by timestamp.
 *
 * @param callback   Called with the latest batch of messages.
 * @param batchLimit Maximum number of messages to fetch.
 * @returns A function that unsubscribes the listener.
 */
export function getMessages(
  callback: (messages: any[]) => void,
  batchLimit: number,
) {
  const messagesCol = collection(db, "messages");
  const q = query(messagesCol, orderBy("timestamp", "desc"), limit(batchLimit));

  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }))
      .reverse(); // reverse to get chronological order (oldest first)
    callback(messages);
  });
}

/**
 * Send a new chat message.
 *
 * @param text   Message text.
 * @param user   Username of the sender.
 * @param replyToId (optional) ID of the message being replied to.
 */
export async function sendMessage(
  text: string,
  user: string,
  replyToId?: string,
) {
  const messagesCol = collection(db, "messages");
  const payload: Record<string, any> = {
    text,
    user,
    timestamp: Timestamp.fromDate(new Date()),
  };
  if (replyToId) {
    payload.replyTo = replyToId;
  }
  await addDoc(messagesCol, payload);
}

/*
// Creating a new chat requires creating a new collection, which is not
// something that can be done from the client-side SDK with security rules
// that would be secure for a multi-user application. This functionality
// should be moved to a backend service (like a Firebase Function) for a
// production application.

export async function createChat(name: string) {
    const chatsCol = collection(db, "chats");
    const newChat = await addDoc(chatsCol, {
        name,
        createdAt: Timestamp.fromDate(new Date()),
    });
    return newChat.id;
}
*/
