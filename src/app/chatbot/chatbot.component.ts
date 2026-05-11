import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isChatStarted: boolean = false;
  username: string = '';
  isUserScrolledUp: boolean = false;
  private chatSub?: Subscription;

  // Quick suggestions for the welcome screen
  suggestions: string[] = [
    '🔍 Show me system status',
    '📊 Latest predictions summary',
    '🏧 List all ATMs',
    '⚠️ Any active alerts?'
  ];

  constructor(private chatService: ChatService) {
    this.username = localStorage.getItem('username') || 'User';
    // Subscribe to shared state
    this.chatSub = this.chatService.messages$.subscribe(msgs => {
      this.messages = msgs;
      if (msgs.length > 0) this.isChatStarted = true;
    });
  }

  ngOnDestroy(): void {
    if (this.chatSub) this.chatSub.unsubscribe();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(content?: string): void {
    const message = content || this.userInput.trim();
    if (!message || this.isLoading) return;

    this.userInput = '';
    this.isLoading = true;

    this.chatService.sendMessage(message).subscribe({
      next: () => {
        this.isLoading = false;
        setTimeout(() => this.messageInput.nativeElement.focus(), 0);
      },
      error: (err) => {
        this.isLoading = false;
        setTimeout(() => this.messageInput.nativeElement.focus(), 0);
        console.error('Chat error:', err);
      }
    });
  }

  sendSuggestion(suggestion: string): void {
    // Strip the emoji prefix for a cleaner query
    const cleanMessage = suggestion.replace(/^[\u{1F300}-\u{1FAFF}\u{2702}-\u{27B0}\u{FE00}-\u{FE0F}\u{200D}]+\s*/u, '').trim();
    this.sendMessage(cleanMessage || suggestion);
  }

  clearChat(): void {
    this.chatService.clearHistory();
    this.isChatStarted = false;
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getUserInitial(): string {
    return this.username ? this.username.charAt(0).toUpperCase() : 'U';
  }

  onScroll(): void {
    if (!this.messagesContainer) return;
    const element = this.messagesContainer.nativeElement;
    // Check if user has scrolled up more than 50px from the bottom
    const atBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= 50;
    this.isUserScrolledUp = !atBottom;
  }

  forceScrollToBottom(): void {
    this.isUserScrolledUp = false;
    this.scrollToBottom(true);
  }

  private scrollToBottom(force: boolean = false): void {
    try {
      if (this.messagesContainer && (!this.isUserScrolledUp || force)) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
