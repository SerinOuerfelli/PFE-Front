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

  isOpen: boolean = false;
  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isChatStarted: boolean = false;
  username: string = '';

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
      },
      error: (err) => {
        this.messages.push({
          role: 'bot',
          content: '⚠️ Connection error. Please try again.',
          timestamp: new Date()
        });
        this.isLoading = false;
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

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }
}
