import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './material.module';

// Import layout modules
import { LayoutModule } from './layout/layout.module';
import { TopNavModule } from './layout/top-nav/top-nav.module';
import { FooterModule } from './layout/footer/footer.module';

// Import directives module
import { DirectivesModule } from './directives/directives.module';

// Import component modules for shared components
import { MetricsTileModule } from './components/metrics-tile/metrics-tile.module';
import { DatabaseTileModule } from './components/database-tile/database-tile.module';
import { GraphQLTileModule } from './components/graphql-tile/graphql-tile.module';
import { PerformanceTileModule } from './components/performance-tile/performance-tile.module';
import { LogViewerModule } from './components/log-viewer/log-viewer.module';
import { ConnectionIndicatorModule } from './components/connection-indicator/connection-indicator.module';
import { StreamStatusIndicatorModule } from './components/stream-status-indicator/stream-status-indicator.module';
import { LogFeedModule } from './components/log-feed/log-feed.module';
import { UserStateModule } from './components/user-state/user-state.module';
import { UserGraphModule } from './components/user-graph/user-graph.module';

// Import services
import { MetricsService } from './services/metrics.service';
import { LoggerService } from './services/logger.service';
import { WebSocketService } from './services/websocket.service';
import { WebSocketRegistrationService } from './services/websocket-registration.service';
import { MetricsApiService } from './services/metrics-api.service';
import { MetricsSocketService } from './services/metrics-socket.service';
import { DatabaseService } from './services/database.service';
import { UserStateService } from './services/user-state.service';
import { PerformanceService } from './services/performance.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    MaterialModule,
    
    // Layout modules
    LayoutModule,
    TopNavModule,
    FooterModule,
    
    // Directive modules
    DirectivesModule,
    
    // Component modules for shared components
    MetricsTileModule,
    DatabaseTileModule,
    GraphQLTileModule,
    PerformanceTileModule,
    LogViewerModule,
    ConnectionIndicatorModule,
    StreamStatusIndicatorModule,
    LogFeedModule,
    UserStateModule,
    UserGraphModule
  ],
  providers: [
    // Register all services
    MetricsService,
    LoggerService,
    WebSocketService,
    WebSocketRegistrationService,
    MetricsApiService,
    MetricsSocketService,
    DatabaseService,
    UserStateService,
    PerformanceService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
