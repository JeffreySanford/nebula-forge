import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { AppResolver } from './app.resolver';
import { MessageResolver } from './message.resolver';
import { BlockchainModule } from './blockchain.module';
import { MongoModule } from './mongo.module';
import { AdminController } from './admin.controller';
import { UserStateService } from './user-state.service';
import { UserStateResolver } from './user-state.resolver';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerService } from './services/logger.service';
import { LogsGateway } from './gateways/logs.gateway';
import { MetricsService } from './services/metrics.service';
import { WebSocketService } from './services/websocket.service';
import { MetricsGateway } from './gateways/metrics.gateway';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'dist/schema.gql'),
      playground: true,
      introspection: true,
      subscriptions: {
        'graphql-ws': true,
      },
      context: (ctx: unknown) => ctx,
    }),
    BlockchainModule,
    MongoModule,
  ],
  providers: [
    UserStateResolver,
    UserStateService,
    AppResolver,
    MessageResolver,
    AppService,
    LoggerService,
    LogsGateway,
    MetricsService,
    WebSocketService,
    MetricsGateway,
  ],
  controllers: [AdminController, AppController],
})
export class AppModule {}