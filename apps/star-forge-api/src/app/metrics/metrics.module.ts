import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Metric, MetricSchema } from '../schemas/metric.schema';
import { MetricsService } from '../services/metrics.service';
import { LoggerService } from '../services/logger.service';
import { MetricsResolver } from './metrics.resolver';
import { MetricsController } from './metrics.controller';
import { MetricsGateway } from '../gateways/metrics.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Metric.name, schema: MetricSchema }
    ])
  ],
  providers: [MetricsService, LoggerService, MetricsResolver, MetricsGateway],
  controllers: [MetricsController],
  exports: [MetricsService]
})
export class MetricsModule {}
