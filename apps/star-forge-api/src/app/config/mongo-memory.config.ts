import { MongooseModuleOptions } from '@nestjs/mongoose';

// We'll create a mock implementation that doesn't require mongodb-memory-server
export async function getMongoMemoryConfig(): Promise<MongooseModuleOptions> {
  // Use a mock connection string for testing/development
  const uri = 'mongodb://localhost:27017/nebula-forge-test';
  
  return {
    uri,
    // Remove deprecated options
    autoCreate: true,
  };
}
