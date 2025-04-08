import { Test } from '@nestjs/testing';
import { AppService } from './app.service';
import { firstValueFrom } from 'rxjs';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return "Hello API"', async () => {
      const result = await firstValueFrom(service.getData());
      expect(result).toEqual({ message: 'Hello API' });
    });
  });

  describe('updateMessage', () => {
    it('should update the message', async () => {
      service.updateMessage('Updated message');
      const result = await firstValueFrom(service.getData());
      expect(result).toEqual({ message: 'Updated message' });
    });
  });
});
