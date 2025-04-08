import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  reseedDatabase(): Observable<boolean> {
    return this.http.post('/api/admin/seed', {}).pipe(map(() => true));
  }
}
