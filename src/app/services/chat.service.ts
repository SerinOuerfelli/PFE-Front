import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8080/api/chat';
  
  // Persistent messages state
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    this.loadMessages();
  }

  private createAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  sendMessage(message: string): Observable<string> {
    // Add user message immediately to the stream
    this.addMessage({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    const headers = this.createAuthHeaders();
    return this.http.post(this.apiUrl, { message }, { headers, responseType: 'text' }).pipe(
      tap(response => {
        // Add bot response to the stream
        this.addMessage({
          role: 'bot',
          content: response,
          timestamp: new Date()
        });
      })
    );
  }

  addMessage(msg: ChatMessage) {
    const current = this.messagesSubject.value;
    // Keep only the last 50 messages to ensure performance and storage efficiency
    const updated = [...current, msg].slice(-50);
    this.messagesSubject.next(updated);
    this.saveMessages(updated);
  }

  clearHistory() {
    this.messagesSubject.next([]);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('biat_chat_history');
    }
  }

  private loadMessages() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('biat_chat_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Ensure we don't exceed the 50-message limit on load
          this.messagesSubject.next(parsed.slice(-50));
        } catch (e) {
          console.error('Failed to load chat history', e);
        }
      }
    }
  }

  private saveMessages(messages: ChatMessage[]) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('biat_chat_history', JSON.stringify(messages));
    }
  }
}
