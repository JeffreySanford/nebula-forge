import { Controller, Post } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { spawn } from 'child_process';

@Controller('api/admin')
export class AdminController {
  @Post('seed')
  seed(): Observable<{ success: boolean }> {
    const resultSubject = new Subject<{ success: boolean }>();
    
    const seedProcess = spawn('ts-node', ['src/app/seed.ts']);
    
    seedProcess.on('close', (code) => {
      resultSubject.next({ success: code === 0 });
      resultSubject.complete();
    });
    
    seedProcess.on('error', () => {
      resultSubject.next({ success: false });
      resultSubject.complete();
    });
    
    return resultSubject.asObservable();
  }
}
