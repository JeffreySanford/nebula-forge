import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Metric, MetricSchema } from '../schemas/metric.schema';
import { MetricsService } from '../services/metrics.service';
import { MetricsResolver } from './metrics.resolver';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Metric.name, schema: MetricSchema }])
  ],
  providers: [MetricsService, MetricsResolver],
  controllers: [MetricsController],
  exports: [MetricsService]
})
export class MetricsModule {}
