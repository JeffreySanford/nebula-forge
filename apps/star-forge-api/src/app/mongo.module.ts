import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoService } from './mongo.service';
import { getMongoMemoryConfig } from './config/mongo-memory.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        // Use in-memory MongoDB in development, or real connection in production
        if (process.env.NODE_ENV !== 'production') {
          return getMongoMemoryConfig();
        }
        return {
          uri: process.env.MONGO_URI || 'mongodb://localhost/craft',
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
    }),
  ],
  providers: [MongoService],
  exports: [MongoService],
})
export class MongoModule {}
