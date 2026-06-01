import { request } from "./api";

const mapContact = (contact) => ({
  id: contact.id,
  name: contact.name,
  email: contact.email,
  department: contact.department || "",
  role: contact.role || "",
  lastMessage: contact.lastMessage || "",
  lastMessageAt: contact.lastMessageAt || null,
});

const mapMessage = (message) => ({
  id: message.id,
  senderId: message.senderId ?? message.sender_id,
  recipientId: message.recipientId ?? message.recipient_id,
  body: message.body,
  createdAt: message.createdAt ?? message.created_at,
  senderName: message.senderName ?? message.sender_name,
  senderRole: message.senderRole ?? message.sender_role,
  recipientName: message.recipientName ?? message.recipient_name,
  recipientRole: message.recipientRole ?? message.recipient_role,
});

export const getMessageContacts = async () => {
  const data = await request("/messages/contacts");
  return (data.contacts || []).map(mapContact);
};

export const getMessageThread = async (userId) => {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const data = await request(`/messages/thread${query}`);

  return {
    counterpart: data.counterpart ? mapContact(data.counterpart) : null,
    messages: (data.messages || []).map(mapMessage),
  };
};

export const sendMessage = async ({ recipientId, body }) => {
  const data = await request("/messages", {
    method: "POST",
    body: JSON.stringify({ recipientId, body }),
  });

  return {
    counterpart: data.counterpart ? mapContact(data.counterpart) : null,
    message: data.message ? mapMessage(data.message) : null,
  };
};
