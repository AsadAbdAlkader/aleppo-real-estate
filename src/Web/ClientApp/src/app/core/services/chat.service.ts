import { Injectable, inject, signal, isDevMode } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ChatMessage, ChatConversation, SendChatMessageRequest } from '../models/chat.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/chat';

  private readonly STORAGE_KEY_CONVS = 'dev_chat_conversations';
  private readonly STORAGE_KEY_MSGS = 'dev_chat_messages';

  // Signals
  readonly conversations = signal<ChatConversation[]>([]);
  readonly activeMessages = signal<ChatMessage[]>([]);
  readonly activeContact = signal<ChatConversation | null>(null);
  readonly unreadChatCount = signal<number>(0);
  readonly loading = signal<boolean>(false);

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.getConversations().subscribe({ error: () => {} });
    }
  }

  /**
   * Retrieves a list of all active conversations for the current user.
   */
  getConversations(silent: boolean = false): Observable<ChatConversation[]> {
    if (!silent) this.loading.set(true);
    return this.http.get<ChatConversation[]>(`${this.apiUrl}/conversations`).pipe(
      tap((convs) => {
        if (!silent) this.loading.set(false);
        const list = convs || [];
        this.conversations.set(list);
        this.recalculateUnreadCount(list);
      }),
      catchError((err) => {
        if (!silent) this.loading.set(false);
        if (isDevMode()) {
          if (!silent) {
            console.warn('API getConversations call failed. Triggering dev-mode fallback.', err);
          }
          const devConvs = this.getStoredDevConversations();
          this.conversations.set(devConvs);
          this.recalculateUnreadCount(devConvs);
          return of(devConvs);
        }
        throw err;
      })
    );
  }

  /**
   * Retrieves chat message history with a specific user.
   */
  getMessages(otherUserId: string, propertyId?: string, silent: boolean = false): Observable<ChatMessage[]> {
    if (!silent) this.loading.set(true);
    let params = new HttpParams();
    if (propertyId) {
      params = params.set('propertyId', propertyId);
    }

    return this.http.get<ChatMessage[]>(`${this.apiUrl}/messages/${otherUserId}`, { params }).pipe(
      tap((msgs) => {
        if (!silent) this.loading.set(false);
        const messages = msgs || [];
        const currentMsgs = this.activeMessages();
        if (messages.length !== currentMsgs.length || JSON.stringify(messages) !== JSON.stringify(currentMsgs)) {
          this.activeMessages.set(messages);
        }
        this.markConversationAsReadLocal(otherUserId);
      }),
      catchError((err) => {
        if (!silent) this.loading.set(false);
        if (isDevMode()) {
          if (!silent) {
            console.warn('API getMessages call failed. Triggering dev-mode fallback.', err);
          }
          const devMsgs = this.getStoredDevMessages(otherUserId);
          this.activeMessages.set(devMsgs);
          this.markConversationAsReadLocal(otherUserId);
          return of(devMsgs);
        }
        throw err;
      })
    );
  }

  /**
   * Sends a direct chat message to another user.
   */
  sendMessage(receiverId: string, message: string, propertyId?: string): Observable<ChatMessage> {
    const payload: SendChatMessageRequest = {
      receiverId,
      propertyId,
      message
    };

    return this.http.post<ChatMessage>(`${this.apiUrl}/send`, payload).pipe(
      tap((newMsg) => {
        this.appendMessageLocal(newMsg);
        this.updateConversationOnSend(receiverId, message, newMsg.propertyTitle || this.activeContact()?.propertyTitle, propertyId);
      }),
      catchError((err) => {
        if (isDevMode()) {
          console.warn('API sendMessage call failed. Triggering dev-mode fallback.', err);
          const currentUserId = this.authService.currentUser()?.id || '3fa85f64-5717-4562-b3fc-2c963f66b111';
          const mockMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            senderId: currentUserId,
            receiverId: receiverId,
            propertyId: propertyId || this.activeContact()?.propertyId,
            propertyTitle: this.activeContact()?.propertyTitle,
            message: message,
            isRead: false,
            createdAt: new Date().toISOString()
          };

          this.saveStoredDevMessage(mockMsg);
          this.appendMessageLocal(mockMsg);
          this.updateConversationOnSend(receiverId, message, mockMsg.propertyTitle, propertyId);
          return of(mockMsg);
        }
        throw err;
      })
    );
  }

  setActiveContact(contact: ChatConversation | null): void {
    this.activeContact.set(contact);
  }

  private markConversationAsReadLocal(otherUserId: string): void {
    const list = this.conversations();
    const updated = list.map(c => {
      if (c.otherUserId === otherUserId) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    });
    this.conversations.set(updated);
    this.recalculateUnreadCount(updated);

    if (isDevMode()) {
      this.saveStoredDevConversations(updated);
    }
  }

  private appendMessageLocal(msg: ChatMessage): void {
    this.activeMessages.update(msgs => [...msgs, msg]);
  }

  private updateConversationOnSend(otherUserId: string, lastMessage: string, propertyTitle?: string, propertyId?: string): void {
    const list = this.conversations();
    const existingIndex = list.findIndex(c => c.otherUserId === otherUserId);
    const nowStr = new Date().toISOString();

    let updatedList: ChatConversation[];
    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const updatedConv: ChatConversation = {
        ...existing,
        lastMessage,
        lastMessageTime: nowStr,
        propertyTitle: propertyTitle || existing.propertyTitle,
        propertyId: propertyId || existing.propertyId
      };
      updatedList = [updatedConv, ...list.filter((_, idx) => idx !== existingIndex)];
    } else {
      const active = this.activeContact();
      const newConv: ChatConversation = {
        otherUserId,
        otherUserName: active?.otherUserName || 'معلن العقار',
        otherUserRole: active?.otherUserRole || 'Agent',
        otherUserPhone: active?.otherUserPhone || '+963911000001',
        lastMessage,
        unreadCount: 0,
        lastMessageTime: nowStr,
        propertyId,
        propertyTitle
      };
      updatedList = [newConv, ...list];
    }

    this.conversations.set(updatedList);
    if (isDevMode()) {
      this.saveStoredDevConversations(updatedList);
    }
  }

  private recalculateUnreadCount(list: ChatConversation[]): void {
    const total = list.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    this.unreadChatCount.set(total);
  }

  // --- Dev Mode Storage Helpers ---

  private getStoredDevConversations(): ChatConversation[] {
    const defaultConvs: ChatConversation[] = [
      {
        otherUserId: '3fa85f64-5717-4562-b3fc-2c963f66b222',
        otherUserName: 'سامر العقاري',
        otherUserRole: 'Agent',
        otherUserPhone: '+963911000001',
        lastMessage: 'أهلاً بك، نعم الفيلا متاحة ويمكننا تحديد موعد للمعاينة غداً.',
        unreadCount: 1,
        lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        propertyId: '4a123f64-5717-4562-b3fc-2c963f66bba7',
        propertyTitle: 'فيلا مستقلة مع حديقة في الفرقان'
      },
      {
        otherUserId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
        otherUserName: 'أحمد الحلبي',
        otherUserRole: 'Buyer',
        otherUserPhone: '+963922333444',
        lastMessage: 'مرحباً أستاذ سامر، هل يناسبك المعاينة الساعة 5 مساءً؟',
        unreadCount: 0,
        lastMessageTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        propertyId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        propertyTitle: 'شقة فاخرة للبيع في حي الشهباء'
      }
    ];

    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(this.STORAGE_KEY_CONVS);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as ChatConversation[];
          if (parsed && parsed.length > 0 && (parsed[0].otherUserId === '3fa85f64-5717-4562-b3fc-2c963f66b222' || parsed[0].otherUserId === '3fa85f64-5717-4562-b3fc-2c963f66b111')) {
            return parsed;
          }
        } catch {}
      }
    }

    this.saveStoredDevConversations(defaultConvs);
    return defaultConvs;
  }

  private saveStoredDevConversations(convs: ChatConversation[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY_CONVS, JSON.stringify(convs));
      } catch {}
    }
  }

  private getStoredDevMessages(otherUserId: string): ChatMessage[] {
    const currentUserId = this.authService.currentUser()?.id || '3fa85f64-5717-4562-b3fc-2c963f66b111';

    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(`${this.STORAGE_KEY_MSGS}_${otherUserId}`);
      if (stored) {
        try {
          return JSON.parse(stored) as ChatMessage[];
        } catch {}
      }
    }

    let defaultMsgs: ChatMessage[] = [
      {
        id: 'msg-1',
        senderId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
        receiverId: '3fa85f64-5717-4562-b3fc-2c963f66b222',
        propertyId: '4a123f64-5717-4562-b3fc-2c963f66bba7',
        propertyTitle: 'فيلا مستقلة مع حديقة في الفرقان',
        message: 'مرحباً، هل الفيلا في حي الفرقان ما زالت متاحة للمعاينة؟',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-2',
        senderId: '3fa85f64-5717-4562-b3fc-2c963f66b222',
        receiverId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
        propertyId: '4a123f64-5717-4562-b3fc-2c963f66bba7',
        propertyTitle: 'فيلا مستقلة مع حديقة في الفرقان',
        message: 'أهلاً بك، نعم الفيلا متاحة ويمكننا تحديد موعد للمعاينة غداً.',
        isRead: true,
        createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
      },
      {
        id: 'msg-3',
        senderId: '3fa85f64-5717-4562-b3fc-2c963f66b111',
        receiverId: '3fa85f64-5717-4562-b3fc-2c963f66b222',
        propertyId: '4a123f64-5717-4562-b3fc-2c963f66bba7',
        propertyTitle: 'فيلا مستقلة مع حديقة في الفرقان',
        message: 'ممتاز، يناسبني الساعة الخامسة مساءً.',
        isRead: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ];

    this.saveStoredDevMessages(otherUserId, defaultMsgs);
    return defaultMsgs;
  }

  private saveStoredDevMessages(otherUserId: string, msgs: ChatMessage[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`${this.STORAGE_KEY_MSGS}_${otherUserId}`, JSON.stringify(msgs));
      } catch {}
    }
  }

  private saveStoredDevMessage(msg: ChatMessage): void {
    const existing = this.getStoredDevMessages(msg.receiverId);
    const updated = [...existing, msg];
    this.saveStoredDevMessages(msg.receiverId, updated);
  }
}
