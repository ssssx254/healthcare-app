export type ConversationParticipant = {
  id: string;
  name: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderRole: "customer" | "provider" | "system_admin" | "system";
  senderId: string;
  senderName: string;
  text: string;
  sentAtIso: string;
  deliveryState?: "sending" | "failed" | "sent";
};

export type ChatConversation = {
  id: string;
  customer: ConversationParticipant;
  provider: ConversationParticipant;
  providerTitle?: string;
  providerPresence: "online" | "offline";
  messages: ChatMessage[];
  unreadForCustomer: number;
  unreadForProvider: number;
  updatedAtIso: string;
};

