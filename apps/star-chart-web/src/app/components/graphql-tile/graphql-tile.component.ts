import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GraphQLQuery {
  name: string;
  status: 'success' | 'error' | 'pending';
  timestamp: Date;
  duration: number;
  isMock?: boolean;
}

@Component({
  selector: 'app-graphql-tile',
  templateUrl: './graphql-tile.component.html',
  styleUrls: ['./graphql-tile.component.scss']
})
export class GraphQLTileComponent {
  // Set the mock flag for demo data
  isMockData = true;
  
  private queriesSubject = new BehaviorSubject<GraphQLQuery[]>([
    {
      name: 'GetUserProfile',
      status: 'success',
      timestamp: new Date(),
      duration: 45,
      isMock: true
    },
    {
      name: 'UpdateUserPreferences',
      status: 'error',
      timestamp: new Date(Date.now() - 120000),
      duration: 350,
      isMock: true
    }
  ]);
  
  queries$ = this.queriesSubject.asObservable();

  addQuery(query: GraphQLQuery): void {
    const current = this.queriesSubject.getValue();
    
    // Add the mock flag if applicable
    const updatedQuery = {
      ...query,
      isMock: query.isMock || this.isMockData
    };
    
    this.queriesSubject.next([updatedQuery, ...current.slice(0, 4)]);
    
    // Update mock data flag
    this.isMockData = this.queriesSubject.getValue().some(q => q.isMock);
  }
}
