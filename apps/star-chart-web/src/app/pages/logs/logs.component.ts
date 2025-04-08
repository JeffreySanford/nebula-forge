import { Component } from '@angular/core';
import { LoggerService } from '../../services/logger.service'; // Import LoggerService
import { WebSocketService } from '../../services/websocket.service'; // Import WebSocketService
import { WebSocketRegistrationService } from '../../services/websocket-registration.service'; // Import WebSocketRegistrationService
import { MatTooltipModule } from '@angular/material/tooltip'; // Import MatTooltipModule

interface LogEntry {
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  source?: string;
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent {
  logs: LogEntry[] = [
    { level: 'info', message: 'Application started', timestamp: new Date() },
    { level: 'warning', message: 'Low memory warning', timestamp: new Date(Date.now() - 120000) },
    { level: 'error', message: 'Failed to connect to database', timestamp: new Date(Date.now() - 300000) },
    { level: 'debug', message: 'User authentication flow complete', timestamp: new Date(Date.now() - 60000) }
  ];

  // Inject services
  constructor(
    private logger: LoggerService,
    private wsService: WebSocketService,
    private wsRegistrationService: WebSocketRegistrationService
  ) {}

  // --- Test Log Methods ---
  testLogInfo(): void {
    this.logger.info('LogsTest', 'Sample informational message for testing', { testId: 'info-test-123' });
  }

  testLogWarn(): void {
    this.logger.warning('LogsTest', 'Sample warning message for testing', { testId: 'warn-test-456' });
  }

  testLogError(): void {
    this.logger.error('LogsTest', 'Sample error message for testing', { testId: 'error-test-789', code: 500 });
  }

  testLogDebug(): void {
    this.logger.debug('LogsTest', 'Sample debug message with detailed context', { 
      testId: 'debug-test-101112',
      context: {
        session: 'user-session-xyz',
        browser: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
  }

  // --- Test WebSocket Methods ---
  testWsError(): void {
    this.logger.info('LogsTest', 'Simulating WebSocket connection error...');
    
    // First try a normal disconnect
    this.wsService.disconnect(); 
    this.logger.info('LogsTest', 'WebSocket test: Step 1 - Initiated disconnect');
    
    // Then set up environment for failure and try to reconnect
    setTimeout(() => {
      this.logger.info('LogsTest', 'WebSocket test: Step 2 - Attempting connection with invalid message');
      try {
        // Send malformed message to trigger error handling
        this.wsService.sendMessage({
          action: 'invalid-action',
          _forceError: true,
          target: 'websocket-error-test'
        });
        
        // Force a reconnect to simulate error
        this.wsService.forceReconnect();
      } catch (err) {
        this.logger.error('LogsTest', 'WebSocket test: Error caught in error simulation', { error: err });
      }
    }, 500);
  }

  testWsSlow(): void {
    this.logger.info('LogsTest', 'Simulating slow WebSocket response...');
    this.logger.info('LogsTest', 'WebSocket test: Step 1 - Starting slow response simulation');
    
    // Send message with a flag indicating this should be processed slowly
    this.wsService.sendMessage({
      action: 'simulate-slow-response',
      options: {
        delayMs: 3000, // Request 3 second delay
        requestId: `slow-test-${Date.now()}`
      }
    });
    
    this.logger.info('LogsTest', 'WebSocket test: Step 2 - Slow response request sent, awaiting response...');
  }

  testWsNormal(): void {
    this.logger.info('LogsTest', 'Testing normal WebSocket operation...');
    this.logger.info('LogsTest', 'WebSocket test: Step 1 - Starting normal operation test');
    
    // Send a regular ping message
    this.wsService.sendMessage({
      action: 'ping',
      options: {
        timestamp: new Date().toISOString(),
        requestId: `normal-test-${Date.now()}`
      }
    });
    
    this.logger.info('LogsTest', 'WebSocket test: Step 2 - Normal ping request sent, awaiting response...');
  }
  
  // Toggle between real and mock WebSocket mode
  toggleMockMode(): void {
    const currentMode = localStorage.getItem('useMockWebSocket') === 'true';
    const newMode = !currentMode;
    
    localStorage.setItem('useMockWebSocket', String(newMode));
    this.wsService.setMockMode(newMode);
    
    this.logger.info('LogsTest', `WebSocket mock mode ${newMode ? 'enabled' : 'disabled'}`);
  }
}
