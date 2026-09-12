import 'zone.js';
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent)
  .then(() => console.log('[DomoNow Angular Parking] Running in standalone mode on port 9001'))
  .catch(err => console.error('[DomoNow Angular Parking] Bootstrap error:', err));
