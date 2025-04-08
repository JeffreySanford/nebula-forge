import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModuleOptions } from '@nestjs/mongoose';

let mongod: MongoMemoryServer;

export const getMongoMemoryConfig = async (): Promise<MongooseModuleOptions> => {
  if (!mongod) {
    mongod = await MongoMemoryServer.create();
  }
  
  const uri = mongod.getUri();
  return {
    uri,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoCreate: true,
  };
};

export const closeMongoMemoryConnection = async (): Promise<void> => {
  if (mongod) {
    await mongod.stop();
  }
};
