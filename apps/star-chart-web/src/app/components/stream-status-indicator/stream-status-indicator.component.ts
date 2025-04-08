import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';
import { WebSocketRegistrationService } from '../../services/websocket-registration.service';
import { LoggerService } from '../../services/logger.service';

interface StreamStatus {
  name: string;
  displayName: string;
  description: string;
  registered: boolean;
  important: boolean;
  isMock?: boolean;
}

@Component({
  selector: 'app-stream-status-indicator',
  templateUrl: './stream-status-indicator.component.html',
  styleUrls: ['./stream-status-indicator.component.scss']
})
export class StreamStatusIndicatorComponent implements OnInit, OnDestroy {
  // Connection status
  wsConnected$: Observable<boolean>;
  
  // Stream statuses
  streamStatuses$ = new BehaviorSubject<StreamStatus[]>([]);
  private subscriptions: Subscription[] = [];
  
  constructor(
    private wsService: WebSocketService,
    private wsRegistrationService: WebSocketRegistrationService,
    private logger: LoggerService
  ) {
    this.wsConnected$ = this.wsService.connectionStatus$;
  }
  
  ngOnInit(): void {
    this.logger.info('StreamStatusIndicator', 'Stream status indicator component initialized');
    
    // Initialize with default statuses
    const initialStatuses: StreamStatus[] = [
      { name: 'metrics', displayName: 'Metrics', description: 'System metrics data', registered: false, important: true },
      { name: 'performance-metrics', displayName: 'Performance', description: 'Performance metrics data', registered: false, important: true },
      { name: 'health-metrics', displayName: 'Health', description: 'Health status data', registered: false, important: true },
      { name: 'database', displayName: 'Database', description: 'Database metrics', registered: false, important: false },
      { name: 'graphql', displayName: 'GraphQL', description: 'GraphQL queries', registered: false, important: false },
      { name: 'section-colors', displayName: 'UI Colors', description: 'Section color data', registered: false, important: false },
      { name: 'metric-legend', displayName: 'Legend', description: 'Metrics legend data', registered: false, important: false }
    ];
    this.streamStatuses$.next(initialStatuses);
    
    // Update stream registrations whenever they change
    this.subscriptions.push(
      this.wsRegistrationService.getRegisteredStreams().subscribe((streams: string[]) => {
        const currentStatuses = this.streamStatuses$.getValue();
        const mockMode = this.wsService.isMockMode();
        
        const updatedStatuses = currentStatuses.map(status => ({
          ...status,
          registered: streams.includes(status.name),
          isMock: mockMode
        }));
        
        this.streamStatuses$.next(updatedStatuses);
      })
    );
    
    // Listen for mock mode changes to update isMock flag
    this.subscriptions.push(
      this.wsService.getMockModeChanges().subscribe(isMock => {
        const currentStatuses = this.streamStatuses$.getValue();
        const updatedStatuses = currentStatuses.map(status => ({
          ...status,
          isMock: isMock && status.registered
        }));
        
        this.streamStatuses$.next(updatedStatuses);
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  // Helper method for status classes
  getStatusClass(isRegistered: boolean): string {
    return isRegistered ? 'status-registered' : 'status-unregistered';
  }
}
