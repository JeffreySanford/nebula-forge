import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';
import { LoggerService } from '../../services/logger.service';
import { Subscription, BehaviorSubject } from 'rxjs';

interface GraphQLOperation {
  id: string;
  type: 'query' | 'mutation' | 'subscription';
  name: string;
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
  duration: number;
  isMock?: boolean;
}

interface SchemaType {
  name: string;
  fields: string[];
  type: 'object' | 'scalar' | 'input' | 'enum';
  description?: string;
}

@Component({
  selector: 'app-graphql',
  templateUrl: './graphql.component.html',
  styleUrls: ['./graphql.component.scss']
})
export class GraphqlComponent implements OnInit, OnDestroy {
  operations$ = new BehaviorSubject<GraphQLOperation[]>([]);
  schema$ = new BehaviorSubject<SchemaType[]>([]);
  schemaString$ = new BehaviorSubject<string>('');
  operationStats = {
    totalQueries: 0,
    totalMutations: 0,
    totalErrors: 0,
    avgDuration: 0
  };
  
  // Sample query that users can try
  sampleQuery = `query {
  getMetrics(type: "cpu") {
    name
    value
    unit
    timestamp
  }
}`;

  // Flag to track mock data
  isMockData = true;

  // Add the missing jsonResponse property used in the template
  jsonResponse = `{
  "data": {
    "getMetrics": [
      {
        "name": "CPU Usage",
        "value": 45.2,
        "unit": "%",
        "timestamp": "2025-04-08T11:15:30.123Z"
      },
      {
        "name": "CPU Usage",
        "value": 42.7,
        "unit": "%",
        "timestamp": "2025-04-08T11:15:25.123Z"
      }
    ]
  }
}`;

  // Add property for section color
  sectionColor = '#FF9800'; // Default GraphQL color (Orange)
  private subscriptions: Subscription[] = [];
  
  constructor(
    private wsService: WebSocketService,
    private logger: LoggerService
  ) {}
  
  ngOnInit(): void {
    // Subscribe to GraphQL operation events
    this.subscriptions.push(
      this.wsService.subscribe<any>('graphql').subscribe(data => {
        if (data && data.operations) {
          const operations = data.operations.map((op: any) => ({
            ...op,
            timestamp: new Date(op.timestamp),
            isMock: op.isMock || data.isMock
          }));
          
          this.operations$.next(operations);
          this.updateOperationStats(operations);
          
          // Update mock data flag
          this.isMockData = operations.some((op: GraphQLOperation) => op.isMock);
        }
        
        if (data && data.schema) {
          this.schema$.next(data.schema);
          this.schemaString$.next(data.schemaString || '');
        }
      })
    );

    // Subscribe to section colors to get the graphql section color
    this.subscriptions.push(
      this.wsService.subscribe<Record<string, string>>('section-colors').subscribe(
        colors => {
          if (colors && colors['graphql']) {
            this.sectionColor = colors['graphql'];
            this.logger.debug('GraphQL', 'Received graphql section color', { color: colors['graphql'] });
            
            // Apply section color to the component's styles
            this.applyThemeColor(this.sectionColor);
          }
        }
      )
    );
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  private updateOperationStats(operations: GraphQLOperation[]): void {
    if (!operations.length) return;
    
    this.operationStats.totalQueries = operations.filter(op => op.type === 'query').length;
    this.operationStats.totalMutations = operations.filter(op => op.type === 'mutation').length;
    this.operationStats.totalErrors = operations.filter(op => op.status === 'error').length;
    
    const totalDuration = operations.reduce((sum, op) => sum + op.duration, 0);
    this.operationStats.avgDuration = Math.round(totalDuration / operations.length);
  }
  
  private initializeSampleData(): void {
    // Sample operations
    const sampleOperations: GraphQLOperation[] = [
      {
        id: '1',
        type: 'query',
        name: 'GetMetrics',
        status: 'success',
        timestamp: new Date(),
        duration: 45,
        isMock: true
      },
      {
        id: '2',
        type: 'mutation',
        name: 'UpdateUserProfile',
        status: 'success',
        timestamp: new Date(Date.now() - 60000),
        duration: 120,
        isMock: true
      },
      {
        id: '3',
        type: 'query',
        name: 'GetUserState',
        status: 'error',
        timestamp: new Date(Date.now() - 120000),
        duration: 350,
        isMock: true
      }
    ];
    
    this.operations$.next(sampleOperations);
    this.updateOperationStats(sampleOperations);
    
    // Sample schema types
    const sampleSchema: SchemaType[] = [
      {
        name: 'Metric',
        type: 'object',
        fields: ['id: ID!', 'name: String!', 'value: Float!', 'unit: String!', 'timestamp: DateTime!']
      },
      {
        name: 'User',
        type: 'object',
        fields: ['id: ID!', 'username: String!', 'email: String', 'roles: [String!]!']
      },
      {
        name: 'Query',
        type: 'object',
        fields: ['getMetrics(type: String): [Metric!]!', 'userState: UserState!']
      }
    ];
    
    this.schema$.next(sampleSchema);
    
    // Sample schema string
    this.schemaString$.next(`
type Metric {
  id: ID!
  name: String!
  value: Float!
  unit: String!
  timestamp: DateTime!
}

type User {
  id: ID!
  username: String!
  email: String
  roles: [String!]!
}

type Query {
  getMetrics(type: String): [Metric!]!
  userState: UserState!
}
`);
  }
  
  executeQuery(query: string): void {
    // This would normally send the query to the server
    console.log('Executing GraphQL query:', query);
    
    // Simulate response
    const newOperation: GraphQLOperation = {
      id: Date.now().toString(),
      type: 'query',
      name: 'ExecutedQuery',
      status: Math.random() > 0.2 ? 'success' : 'error', // 80% success rate
      timestamp: new Date(),
      duration: Math.floor(Math.random() * 200) + 30,
      isMock: true
    };
    
    const currentOperations = this.operations$.getValue();
    this.operations$.next([newOperation, ...currentOperations]);
    this.updateOperationStats([...currentOperations, newOperation]);
  }

  // Method to apply theme color to component styles
  private applyThemeColor(color: string): void {
    document.documentElement.style.setProperty('--graphql-primary-color', color);
    document.documentElement.style.setProperty('--graphql-light-color', `${color}20`);
  }
}
