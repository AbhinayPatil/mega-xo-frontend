import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService {

  private stompClient: Client | null = null;
  private connectionPromise: Promise<void> | null = null;
  private activeSubscriptions: Map<string, StompSubscription> = new Map();
  private messageSubjects: Map<string, Subject<any>> = new Map();

  connect(): Promise<void> {
    // Already connected — reuse
    if (this.stompClient?.connected) {
      return Promise.resolve();
    }

    // Connection in progress — wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Fresh connection
    this.connectionPromise = new Promise((resolve, reject) => {
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(environment.wsUrl) as any,
        reconnectDelay: 0,
        onConnect: () => {
          console.log('[WS] Connected');
          this.connectionPromise = null;
          resolve();
        },
        onStompError: (frame) => {
          console.error('[WS] STOMP error', frame);
          this.connectionPromise = null;
          reject(frame);
        }
      });
      this.stompClient.activate();
    });

    return this.connectionPromise;
  }

  subscribe(topic: string): Observable<any> {
    if (!this.stompClient?.connected) {
      console.error(`[WS] Cannot subscribe to ${topic} — not connected`);
      return new Observable();
    }

    // Reuse existing subject for this topic if already subscribed
    if (!this.messageSubjects.has(topic)) {
      this.messageSubjects.set(topic, new Subject<any>());

      const sub = this.stompClient.subscribe(topic, (message: IMessage) => {
        try {
          const parsed = JSON.parse(message.body);
          this.messageSubjects.get(topic)?.next(parsed);
        } catch (e) {
          console.error('[WS] Parse error', e);
        }
      });

      this.activeSubscriptions.set(topic, sub);
    }

    return this.messageSubjects.get(topic)!.asObservable();
  }

  // Unsubscribe from a specific topic only (used when leaving a room)
  unsubscribeTopic(topic: string): void {
    this.activeSubscriptions.get(topic)?.unsubscribe();
    this.activeSubscriptions.delete(topic);
    this.messageSubjects.get(topic)?.complete();
    this.messageSubjects.delete(topic);
  }

  send(destination: string, body: any): void {
    if (!this.stompClient?.connected) {
      console.error('[WS] Cannot send — not connected');
      return;
    }
    this.stompClient.publish({
      destination,
      body: JSON.stringify(body)
    });
  }

  // Full teardown — only call when returning to landing page
  disconnect(): void {
    this.activeSubscriptions.forEach(sub => {
      try { sub.unsubscribe(); } catch (_) {}
    });
    this.activeSubscriptions.clear();

    this.messageSubjects.forEach(s => s.complete());
    this.messageSubjects.clear();

    if (this.stompClient) {
      try { this.stompClient.deactivate(); } catch (_) {}
      this.stompClient = null;
    }

    this.connectionPromise = null;
  }
}
