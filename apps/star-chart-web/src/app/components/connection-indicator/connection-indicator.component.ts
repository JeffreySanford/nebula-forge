import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-connection-indicator',
  template: `
    <div class="connection-indicator" [ngClass]="{'connected': connected}">
      <div class="status-dot"></div>
      <span class="status-text">{{ connected ? 'Connected' : 'Disconnected' }}</span>
    </div>
  `,
  styles: [`
    .connection-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #f44336;
      transition: background-color 0.3s ease;
    }
    
    .connected .status-dot {
      background-color: #4caf50;
      box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
    }
    
    .status-text {
      color: rgba(255, 255, 255, 0.7);
    }
  `]
})
export class ConnectionIndicatorComponent {
  @Input() connected = false;
}
