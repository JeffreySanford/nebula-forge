import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss']
})
export class TopNavComponent implements OnInit {
  navigationItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/metrics', label: 'Metrics' },
    { path: '/performance', label: 'Performance' },
    { path: '/logs', label: 'Logs' },
    { path: '/database', label: 'Database' },
    { path: '/graphql', label: 'GraphQL' }
  ];
  
  // Flag to track if mock data is being used
  useMockData = true;
  
  constructor(private wsService: WebSocketService) {}
  
  ngOnInit(): void {
    // Check localStorage for previously saved preference
    const storedMockSetting = localStorage.getItem('useMockWebSocket');
    this.useMockData = storedMockSetting !== null ? storedMockSetting === 'true' : true;
    
    // Apply the setting
    this.wsService.setMockMode(this.useMockData);
  }
  
  toggleMockData(event?: MatSlideToggleChange): void {
    if (event) {
      this.useMockData = event.checked;
    } else {
      this.useMockData = !this.useMockData;
    }
    
    // Save preference to localStorage
    localStorage.setItem('useMockWebSocket', String(this.useMockData));
    
    // Update service
    this.wsService.setMockMode(this.useMockData);
    console.log(`Switched to ${this.useMockData ? 'mock' : 'live'} data mode`);
  }
}
