import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../services/chat.service';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-bubble.component.html',
  styleUrl: './chat-bubble.component.css'
})
export class ChatBubbleComponent implements AfterViewChecked {
  @ViewChild('bubbleMessages') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  isOpen: boolean = false;
  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isChatStarted: boolean = false;
  username: string = '';
  isUserScrolledUp: boolean = false;

  suggestions: string[] = [
    '🔍 System status',
    '📊 KPI summary',
    '🏧 List ATMs',
    '👥 Show users'
  ];

  constructor(private chatService: ChatService) {
    this.username = localStorage.getItem('username') || 'User';
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  closeChat(): void {
    this.isOpen = false;
  }

  sendMessage(content?: string): void {
    const message = content || this.userInput.trim();
    if (!message || this.isLoading) return;

    this.isChatStarted = true;

    this.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    this.forceScrollToBottom();

    this.userInput = '';
    this.isLoading = true;

    this.chatService.sendMessage(message).subscribe({
      next: (response) => {
        this.messages.push({
          role: 'bot',
          content: response,
          timestamp: new Date()
        });
        this.isLoading = false;
        setTimeout(() => this.messageInput?.nativeElement.focus(), 0);
      },
      error: (err) => {
        this.messages.push({
          role: 'bot',
          content: '⚠️ Connection error. Please try again.',
          timestamp: new Date()
        });
        this.isLoading = false;
        setTimeout(() => this.messageInput?.nativeElement.focus(), 0);
        console.error('Chat error:', err);
      }
    });
  }

  sendSuggestion(suggestion: string): void {
    const cleanMessage = suggestion.replace(/^[\u{1F300}-\u{1FAFF}\u{2702}-\u{27B0}\u{FE00}-\u{FE0F}\u{200D}]+\s*/u, '').trim();
    this.sendMessage(cleanMessage || suggestion);
  }

  clearChat(): void {
    this.messages = [];
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
