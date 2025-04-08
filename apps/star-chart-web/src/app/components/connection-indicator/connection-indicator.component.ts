import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-connection-indicator',
  templateUrl: './connection-indicator.component.html',
  styleUrls: ['./connection-indicator.component.scss']
})
export class ConnectionIndicatorComponent implements OnInit, OnDestroy {
  isConnected$: Observable<boolean>;
  isMockMode = false;
  connectionState = 'disconnected';
  private subscription: Subscription | null = null;
  
  constructor(public wsService: WebSocketService) {
    this.isConnected$ = this.wsService.connectionStatus$;
  }
  
  ngOnInit(): void {
    // Subscribe to mock mode changes
    this.subscription = this.wsService.getMockModeChanges().subscribe(isMock => {
      this.isMockMode = isMock;
    });
    
    // Get initial mock mode state
    this.isMockMode = this.wsService.isMockMode();
  }
  
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  // Manually trigger a reconnection attempt
  retryConnection(): void {
    this.wsService.forceReconnect();
  }
}
