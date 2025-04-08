import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { APP_INITIALIZER } from '@angular/core';

// Material modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';

// Components
import { AppComponent } from './app.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

// Services
import { LoggerService } from './services/logger.service';
import { WebSocketService } from './services/websocket.service';
import { WebSocketRegistrationService } from './services/websocket-registration.service';
import { MetricsService } from './services/metrics.service';
import { PerformanceService } from './services/performance.service';
import { UserStateService } from './services/user-state.service';

// Feature Modules
import { UserStateModule } from './components/user-state/user-state.module';
import { UserGraphModule } from './components/user-graph/user-graph.module';
import { TopNavModule } from './layout/top-nav/top-nav.module';
import { FooterModule } from './layout/footer/footer.module';
import { DirectivesModule } from './directives/directives.module';

// Page modules
import { DashboardModule } from './pages/dashboard/dashboard.module';
import { MetricsModule } from './pages/metrics/metrics.module'; 
import { LogsModule } from './pages/logs/logs.module';
import { GraphqlModule } from './pages/graphql/graphql.module';
import { DatabaseModule } from './pages/database/database.module';
import { PerformanceModule } from './pages/performance/performance.module';
import { AboutModule } from './pages/about/about.module';
import { ContactModule } from './pages/contact/contact.module';
import { NotFoundModule } from './pages/not-found/not-found.module';

// Page components (import for routing only)
import { MetricsComponent } from './pages/metrics/metrics.component';
import { LogsComponent } from './pages/logs/logs.component';
import { GraphqlComponent } from './pages/graphql/graphql.component';
import { DatabaseComponent } from './pages/database/database.component';
import { PerformanceComponent } from './pages/performance/performance.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'metrics', component: MetricsComponent },
  { path: 'logs', component: LogsComponent },
  { path: 'graphql', component: GraphqlComponent },
  { path: 'database', component: DatabaseComponent },
  { path: 'performance', component: PerformanceComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', component: NotFoundComponent }
];

// Factory function for APP_INITIALIZER
export function initializeWebSocketStreams(wsRegistrationService: WebSocketRegistrationService) {
  return () => {
    return wsRegistrationService.initializeDataStreams();
  };
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    
    // Material modules
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    
    // Feature modules
    TopNavModule,
    FooterModule,
    DirectivesModule,
    
    // Page modules
    DashboardModule,
    MetricsModule,
    LogsModule,
    GraphqlModule,
    DatabaseModule,
    PerformanceModule,
    AboutModule,
    ContactModule,
    NotFoundModule,
    
    // Component modules
    UserStateModule,
    UserGraphModule
  ],
  providers: [
    LoggerService,
    WebSocketService,
    WebSocketRegistrationService,
    MetricsService,
    PerformanceService,
    UserStateService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeWebSocketStreams,
      deps: [WebSocketRegistrationService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
