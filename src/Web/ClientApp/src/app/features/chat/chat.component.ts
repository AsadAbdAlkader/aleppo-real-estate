import { Component, OnInit, ElementRef, ViewChild, inject, signal, computed, DestroyRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { PropertyService } from '../../core/services/property.service';
import { ChatConversation, ChatMessage } from '../../core/models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrls: []
})
export class ChatComponent implements OnInit, AfterViewChecked {
  readonly chatService = inject(ChatService);
  readonly authService = inject(AuthService);
  private readonly propertyService = inject(PropertyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('messageContainer') private messageContainer?: ElementRef<HTMLDivElement>;

  readonly searchTerm = signal<string>('');
  readonly newMessageText = signal<string>('');
  readonly showEmojiPicker = signal<boolean>(false);
  readonly isMobileConversationSelected = signal<boolean>(false);
  readonly attachmentToast = signal<string | null>(null);

  private shouldScrollToBottom = false;

  readonly commonEmojis = ['😊', '👍', '🤝', '🏠', '✨', '🔑', '📍', '💵', '📋', '✅', '🙏', '📞'];

  readonly currentUserId = computed<string>(() => {
    return this.authService.currentUser()?.id || 'current-user-dev';
  });

  readonly filteredConversations = computed<ChatConversation[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.chatService.conversations();
    if (!term) return all;

    return all.filter(c =>
      c.otherUserName.toLowerCase().includes(term) ||
      c.lastMessage.toLowerCase().includes(term) ||
      (c.propertyTitle && c.propertyTitle.toLowerCase().includes(term))
    );
  });

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const userId = params['userId'];
        const propertyId = params['propertyId'];

        this.chatService.getConversations().subscribe({
          next: (convs) => {
            if (userId) {
              this.handleTargetUserConversation(userId, propertyId, convs);
            } else if (convs.length > 0 && !this.chatService.activeContact()) {
              this.selectConversation(convs[0]);
            }
          },
          error: () => {
            if (userId) {
              this.handleTargetUserConversation(userId, propertyId, this.chatService.conversations());
            }
          }
        });
      });

    // Auto-poll for new real-time messages & conversation updates every 3 seconds silently
    interval(3000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const active = this.chatService.activeContact();
        if (active) {
          const prevMsgCount = this.chatService.activeMessages().length;
          this.chatService.getMessages(active.otherUserId, active.propertyId, true).subscribe(() => {
            if (this.chatService.activeMessages().length > prevMsgCount) {
              this.shouldScrollToBottom = true;
            }
          });
        }
        this.chatService.getConversations(true).subscribe();
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private handleTargetUserConversation(userId: string, propertyId?: string, existingConvs: ChatConversation[] = []): void {
    const existing = existingConvs.find(c => c.otherUserId === userId);
    if (existing) {
      this.selectConversation(existing, propertyId);
    } else {
      // Create temporary active contact for initiating chat
      let tempTitle = 'محادثة بخصوص عقار';

      if (propertyId) {
        this.propertyService.getPropertyById(propertyId).subscribe({
          next: (prop) => {
            if (prop) tempTitle = prop.title;
            this.initNewConversationContact(userId, tempTitle, propertyId, prop?.ownerName);
          },
          error: () => {
            this.initNewConversationContact(userId, tempTitle, propertyId);
          }
        });
      } else {
        this.initNewConversationContact(userId, tempTitle, propertyId);
      }
    }
  }

  private initNewConversationContact(userId: string, propertyTitle: string, propertyId?: string, ownerName?: string): void {
    const newContact: ChatConversation = {
      otherUserId: userId,
      otherUserName: ownerName || 'معلن العقار',
      otherUserRole: 'Agent',
      otherUserPhone: '+963911000000',
      lastMessage: 'بدء محادثة جديدة...',
      unreadCount: 0,
      lastMessageTime: new Date().toISOString(),
      propertyId,
      propertyTitle
    };

    this.chatService.setActiveContact(newContact);
    this.isMobileConversationSelected.set(true);
    this.chatService.getMessages(userId, propertyId).subscribe(() => {
      this.shouldScrollToBottom = true;
    });
  }

  selectConversation(conv: ChatConversation, propertyIdOverride?: string): void {
    this.chatService.setActiveContact(conv);
    this.isMobileConversationSelected.set(true);
    this.showEmojiPicker.set(false);
    const targetPropId = propertyIdOverride || conv.propertyId;

    this.chatService.getMessages(conv.otherUserId, targetPropId).subscribe(() => {
      this.shouldScrollToBottom = true;
    });
  }

  sendMessage(): void {
    const text = this.newMessageText().trim();
    const contact = this.chatService.activeContact();
    if (!text || !contact) return;

    this.chatService.sendMessage(contact.otherUserId, text, contact.propertyId).subscribe({
      next: () => {
        this.newMessageText.set('');
        this.showEmojiPicker.set(false);
        this.shouldScrollToBottom = true;
      }
    });
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker.update(v => !v);
  }

  addEmoji(emoji: string): void {
    this.newMessageText.update(text => text + emoji);
    this.showEmojiPicker.set(false);
  }

  onAttachmentClick(): void {
    this.attachmentToast.set('تم رفع المرفق (محاكاة)');
    setTimeout(() => this.attachmentToast.set(null), 3000);
  }

  backToConversationList(): void {
    this.isMobileConversationSelected.set(false);
  }

  private scrollToBottom(): void {
    if (this.messageContainer?.nativeElement) {
      const el = this.messageContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  getRoleBadge(role?: string): { text: string, css: string } {
    switch (role?.toLowerCase()) {
      case 'agent':
      case 'وكيل عقاري':
        return { text: 'وكيل عقاري', css: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'owner':
      case 'مالك العقار':
        return { text: 'مالك العقار', css: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { text: 'مشتري', css: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString('ar-SY', { month: 'short', day: 'numeric' });
  }

  formatMessageTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });
  }
}
