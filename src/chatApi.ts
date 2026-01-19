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

export async function getAllChats() {
  const chatsCol = collection(db, "chats");
  const chatSnapshot = await getDocs(chatsCol);
  const chatList = chatSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return chatList;
}

export function getMessages(
  callback: (messages: any[]) => void
) {
  const messagesCol = collection(db, "messages");
  const q = query(messagesCol, orderBy("timestamp", "desc"), limit(50));

  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }))
      .reverse();
    callback(messages);
  });
}

export async function sendMessage(text: string, user: string) {
  const messagesCol = collection(db, "messages");
  await addDoc(messagesCol, {
    text,
    user,
    timestamp: Timestamp.fromDate(new Date()),
  });
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
