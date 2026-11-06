export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  propertyId?: string;
  propertyTitle?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatConversation {
  otherUserId: string;
  otherUserName: string;
  otherUserRole?: string;
  otherUserPhone?: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageTime: string;
  propertyId?: string;
  propertyTitle?: string;
}

export interface SendChatMessageRequest {
  receiverId: string;
  propertyId?: string;
  message: string;
}
