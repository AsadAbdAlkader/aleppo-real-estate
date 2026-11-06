import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { ChatConversation, ChatMessage } from '../../core/models/chat.model';
import { ChatComponent } from './chat.component';

describe('ChatService & ChatComponent', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  const mockConversations: ChatConversation[] = [
    {
      otherUserId: 'user-1',
      otherUserName: 'سامر العقاري',
      otherUserRole: 'Agent',
      lastMessage: 'مرحباً، هل تفضل زيارة اليوم؟',
      unreadCount: 1,
      lastMessageTime: '2026-09-30T10:00:00Z',
      propertyId: 'prop-1',
      propertyTitle: 'شقة فاخرة'
    }
  ];

  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      senderId: 'user-1',
      receiverId: 'current-user-dev',
      message: 'مرحباً، هل تفضل زيارة اليوم؟',
      isRead: false,
      createdAt: '2026-09-30T10:00:00Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [
        ChatService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);

    // Drain initial getConversations request if authenticated
    const initialReqs = httpMock.match('/api/chat/conversations');
    initialReqs.forEach(req => req.flush(mockConversations));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch conversations via GET /api/chat/conversations', () => {
    service.getConversations().subscribe(convs => {
      expect(convs.length).toBe(1);
      expect(convs[0].otherUserName).toBe('سامر العقاري');
      expect(service.unreadChatCount()).toBe(1);
    });

    const req = httpMock.expectOne('/api/chat/conversations');
    expect(req.request.method).toBe('GET');
    req.flush(mockConversations);
  });

  it('should fetch messages via GET /api/chat/messages/{otherUserId}', () => {
    service.getMessages('user-1', 'prop-1').subscribe(msgs => {
      expect(msgs.length).toBe(1);
      expect(msgs[0].message).toBe('مرحباً، هل تفضل زيارة اليوم؟');
    });

    const req = httpMock.expectOne('/api/chat/messages/user-1?propertyId=prop-1');
    expect(req.request.method).toBe('GET');
    req.flush(mockMessages);
  });

  it('should send message via POST /api/chat/send', () => {
    const sentMsg: ChatMessage = {
      id: 'msg-2',
      senderId: 'current-user-dev',
      receiverId: 'user-1',
      message: 'نعم، الساعة الخامسة مناسبة.',
      isRead: false,
      createdAt: '2026-09-30T10:05:00Z'
    };

    service.sendMessage('user-1', 'نعم، الساعة الخامسة مناسبة.', 'prop-1').subscribe(res => {
      expect(res.id).toBe('msg-2');
      expect(service.activeMessages().length).toBe(1);
    });

    const req = httpMock.expectOne('/api/chat/send');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      receiverId: 'user-1',
      propertyId: 'prop-1',
      message: 'نعم، الساعة الخامسة مناسبة.'
    });
    req.flush(sentMsg);
  });

  it('should fallback to dev-mode mock data when API call fails', () => {
    service.getConversations().subscribe(convs => {
      expect(convs).toBeDefined();
      expect(convs.length).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne('/api/chat/conversations');
    req.error(new ProgressEvent('Network Error'));
  });

  it('should create ChatComponent instance', () => {
    const fixture = TestBed.createComponent(ChatComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
