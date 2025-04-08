import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { BehaviorSubject, Subscription } from 'rxjs';

interface DatabaseMetric {
  name: string;
  value: number;
  unit: string;
  type: string;
}

interface DatabaseQuery {
  id: string;
  statement: string;
  type: string;
  collection: string;
  duration: number;
  timestamp: Date;
  status: 'completed' | 'error' | 'running';
  affectedRows?: number;
  isMock?: boolean;
}

interface DatabaseStats {
  connections: number;
  activeQueries: number;
  avgQueryTime: number;
  size: string;
  collections: number;
  uptime: string;
  isMock?: boolean;
}

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss']
})
export class DatabaseComponent implements OnInit, OnDestroy {
  // Track recent database queries
  recentQueries$ = new BehaviorSubject<DatabaseQuery[]>([]);
  
  // Track database metrics
  databaseMetrics$ = new BehaviorSubject<DatabaseMetric[]>([]);
  
  // Track database stats
  databaseStats$ = new BehaviorSubject<DatabaseStats>({
    connections: 24,
    activeQueries: 5,
    avgQueryTime: 45,
    size: '2.4GB',
    collections: 12,
    uptime: '14d 7h',
    isMock: true
  });
  
  // Track mock data status
  isMockData = true;
  
  private subscriptions: Subscription[] = [];
  
  constructor(private wsService: WebSocketService) {}
  
  ngOnInit(): void {
    // Subscribe to database metrics
    this.subscriptions.push(
      this.wsService.subscribe<any>('database').subscribe(data => {
        if (data) {
          // Update metrics if available
          if (data.metrics) {
            this.databaseMetrics$.next(data.metrics.map((m: any) => ({
              ...m,
              isMock: m.isMock || data.isMock
            })));
          }
          
          // Update queries if available
          if (data.queries) {
            this.recentQueries$.next(data.queries.map((q: any) => ({
              ...q,
              timestamp: new Date(q.timestamp),
              isMock: q.isMock || data.isMock
            })));
          }
          
          // Update stats if available
          if (data.stats) {
            this.databaseStats$.next({
              ...data.stats,
              isMock: data.stats.isMock || data.isMock
            });
          }
          
          // Update mock data flag
          this.isMockData = data.isMock === true || 
                          (data.stats?.isMock === true) || 
                          (data.queries?.some((q: any) => q.isMock)) ||
                          (data.metrics?.some((m: any) => m.isMock));
        }
      })
    );
    
    // Initialize with mock data
    this.initializeMockData();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  private initializeMockData(): void {
    // Sample database queries
    const mockQueries: DatabaseQuery[] = [
      {
        id: '1',
        statement: 'SELECT * FROM users WHERE active = true LIMIT 10',
        type: 'SELECT',
        collection: 'users',
        duration: 25,
        timestamp: new Date(),
        status: 'completed',
        affectedRows: 10,
        isMock: true
      },
      {
        id: '2',
        statement: 'UPDATE posts SET views = views + 1 WHERE id = 123',
        type: 'UPDATE',
        collection: 'posts',
        duration: 18,
        timestamp: new Date(Date.now() - 60000),
        status: 'completed',
        affectedRows: 1,
        isMock: true
      },
      {
        id: '3',
        statement: 'CREATE INDEX idx_username ON users(username)',
        type: 'CREATE INDEX',
        collection: 'users',
        duration: 350,
        timestamp: new Date(Date.now() - 120000),
        status: 'completed',
        isMock: true
      },
      {
        id: '4',
        statement: 'DELETE FROM temp_logs WHERE created_at < NOW() - INTERVAL 7 DAY',
        type: 'DELETE',
        collection: 'temp_logs',
        duration: 432,
        timestamp: new Date(Date.now() - 180000),
        status: 'error',
        isMock: true
      }
    ];
    this.recentQueries$.next(mockQueries);
    
    // Sample database metrics
    const mockMetrics: DatabaseMetric[] = [
      { name: 'Query Throughput', value: 142, unit: 'queries/sec', type: 'throughput' },
      { name: 'Read Latency', value: 5.2, unit: 'ms', type: 'latency' },
      { name: 'Write Latency', value: 8.7, unit: 'ms', type: 'latency' },
      { name: 'Connections', value: 24, unit: 'conns', type: 'connections' }
    ];
    this.databaseMetrics$.next(mockMetrics);
    
    // This is already set in the BehaviorSubject initialization
    // No need to initialize databaseStats$ again
  }
  
  // Method to run a database query (simulated)
  runQuery(query: string): void {
    console.log('Running query:', query);
    
    // Create a new query object 
    const newQuery: DatabaseQuery = {
      id: Date.now().toString(),
      statement: query,
      type: this.determineQueryType(query),
      collection: this.determineCollection(query),
      duration: Math.floor(Math.random() * 100) + 10,
      timestamp: new Date(),
      status: Math.random() > 0.9 ? 'error' : 'completed', // 10% chance of error
      affectedRows: Math.floor(Math.random() * 50),
      isMock: true
    };
    
    // Add to recent queries
    const currentQueries = this.recentQueries$.getValue();
    this.recentQueries$.next([newQuery, ...currentQueries.slice(0, 9)]);  // Keep only 10 most recent
  }
  
  private determineQueryType(query: string): string {
    query = query.trim().toUpperCase();
    if (query.startsWith('SELECT')) return 'SELECT';
    if (query.startsWith('INSERT')) return 'INSERT';
    if (query.startsWith('UPDATE')) return 'UPDATE';
    if (query.startsWith('DELETE')) return 'DELETE';
    if (query.startsWith('CREATE')) return 'CREATE';
    if (query.startsWith('ALTER')) return 'ALTER';
    if (query.startsWith('DROP')) return 'DROP';
    return 'OTHER';
  }
  
  private determineCollection(query: string): string {
    query = query.trim().toUpperCase();
    
    // This is a simplified parsing logic
    let parts = query.split(' ');
    let fromIndex = parts.findIndex(p => p === 'FROM' || p === 'INTO' || p === 'UPDATE' || p === 'TABLE');
    
    if (fromIndex !== -1 && fromIndex + 1 < parts.length) {
      const tableName = parts[fromIndex + 1].replace(/[^a-zA-Z0-9_]/g, '');
      return tableName || 'unknown';
    }
    
    return 'unknown';
  }
}
