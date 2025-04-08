import { Component, OnInit } from '@angular/core';
import { MetricsSocketService } from '../../services/metrics-socket.service';

export interface DbEvent {
  type: 'connection' | 'query' | 'error';
  message: string;
  timestamp: Date;
  operation?: string;
  collection?: string; 
  isMock?: boolean;
}

@Component({
  selector: 'app-database-tile',
  templateUrl: './database-tile.component.html',
  styleUrls: ['./database-tile.component.scss']
})
export class DatabaseTileComponent implements OnInit {
  public events: DbEvent[] = [];
  public isMockData = true; // Default to true since we start with no real data

  constructor(private metricsSocketService: MetricsSocketService) {}

  ngOnInit() {
    this.metricsSocketService.listenForHealthMetrics().subscribe(data => {
      // Handle incoming real-time data and check if it's mock data
      this.events = Array.isArray(data) ? data : [];
      
      // Check each event for mock flag
      if (this.events.length > 0) {
        // If the data has a source field indicating mock, add isMock flag
        this.events = this.events.map(event => ({
          ...event,
          isMock: event.isMock || (typeof data === 'object' && data.isMock) || false
        }));
        
        // Update the mock data flag
        this.isMockData = this.events.some(event => event.isMock);
      }
    });
    
    // For initial demo, add some mock events
    this.events = [
      {
        type: 'connection',
        message: 'Connected to database',
        timestamp: new Date(),
        isMock: true
      },
      {
        type: 'query',
        message: 'SELECT * FROM users LIMIT 10',
        timestamp: new Date(Date.now() - 5000),
        operation: 'SELECT',
        collection: 'users',
        isMock: true
      }
    ];
  }
}
