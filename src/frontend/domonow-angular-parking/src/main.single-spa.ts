import 'zone.js';
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { ApplicationRef } from '@angular/core';

let appRef: ApplicationRef | null = null;

/**
 * Single-SPA Lifecycle Interface Contract for DomoNow Angular Operations MFE
 */
export async function bootstrap(): Promise<void> {
  // Global initialization or dependency loading
  console.log('[DomoNow Angular Parking MFE] Bootstrapped.');
}

export async function mount(props: { domElement?: HTMLElement }): Promise<void> {
  console.log('[DomoNow Angular Parking MFE] Mounting...');
  const targetElement = props.domElement || document.getElementById('single-spa-application:@domonow/angular-parking');
  
  if (targetElement && !targetElement.querySelector('app-domonow-angular-parking')) {
    const customTag = document.createElement('app-domonow-angular-parking');
    targetElement.appendChild(customTag);
  }

  try {
    appRef = await bootstrapApplication(AppComponent);
    console.log('[DomoNow Angular Parking MFE] Mounted successfully.');
  } catch (err) {
    console.error('[DomoNow Angular Parking MFE] Error mounting application:', err);
  }
}

export async function unmount(): Promise<void> {
  console.log('[DomoNow Angular Parking MFE] Unmounting...');
  if (appRef) {
    appRef.destroy();
    appRef = null;
  }
  const targetElement = document.getElementById('single-spa-application:@domonow/angular-parking');
  if (targetElement) {
    targetElement.innerHTML = '';
  }
}
