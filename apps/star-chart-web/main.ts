import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { AppModule } from './src/app/app.module';

// Use standalone component bootstrapping
bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    importProvidersFrom(AppModule)
  ]
}).catch(err => console.error(err));
