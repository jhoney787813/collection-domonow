import { registerApplication, start, navigateToUrl } from 'single-spa';

console.log('[DomoNow Root Config] Initializing Single-SPA Root Orchestrator...');

// Dynamic Tab Highlighting
function updateActiveTabs() {
  const path = window.location.pathname;
  const tabParking = document.getElementById('tab-parking');
  const tabAnalytics = document.getElementById('tab-analytics');

  if (tabParking && tabAnalytics) {
    if (path.startsWith('/analytics')) {
      tabParking.classList.remove('active');
      tabAnalytics.classList.add('active');
    } else {
      tabParking.classList.add('active');
      tabAnalytics.classList.remove('active');
    }
  }
}

window.addEventListener('single-spa:routing-event', updateActiveTabs);
window.addEventListener('popstate', updateActiveTabs);
updateActiveTabs();

// Intercept tab clicks to navigate smoothly without full reload
document.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest('a');
  if (target && target.classList.contains('nav-tab')) {
    e.preventDefault();
    const href = target.getAttribute('href');
    if (href) {
      window.history.pushState(null, '', href);
      navigateToUrl(href);
      updateActiveTabs();
    }
  }
});

/**
 * Register MFE 1: Angular 19 Parking Operations
 * Active on: /parking and / (default root)
 */
registerApplication({
  name: '@domonow/angular-parking',
  app: async () => ({
    bootstrap: async () => {
      console.log('[Root Config] Bootstrapping Angular Operations MFE (Port 9001)...');
    },
    mount: async () => {
      console.log('[Root Config] Mounting Angular Operations MFE...');
      const container = document.getElementById('single-spa-application:@domonow/angular-parking');
      if (container) {
        container.style.display = 'block';
        if (!container.querySelector('iframe')) {
          container.innerHTML = `
            <iframe
              id="iframe-angular-parking"
              src="http://localhost:9001"
              style="width: 100%; height: calc(100vh - 68px); border: none; display: block;"
              title="DomoNow Angular Parking Operations"
            ></iframe>
          `;
        }
      }
    },
    unmount: async () => {
      console.log('[Root Config] Unmounting Angular Operations MFE...');
      const container = document.getElementById('single-spa-application:@domonow/angular-parking');
      if (container) {
        container.style.display = 'none';
      }
    }
  }),
  activeWhen: (location) => location.pathname === '/' || location.pathname.startsWith('/parking')
});

/**
 * Register MFE 2: Vue 3 Analytics & Predictive Demand
 * Active on: /analytics
 */
registerApplication({
  name: '@domonow/vue-analytics',
  app: async () => ({
    bootstrap: async () => {
      console.log('[Root Config] Bootstrapping Vue Analytics MFE (Port 9002)...');
    },
    mount: async () => {
      console.log('[Root Config] Mounting Vue Analytics MFE...');
      const container = document.getElementById('single-spa-application:@domonow/vue-analytics');
      if (container) {
        container.style.display = 'block';
        if (!container.querySelector('iframe')) {
          container.innerHTML = `
            <iframe
              id="iframe-vue-analytics"
              src="http://localhost:9002"
              style="width: 100%; height: calc(100vh - 68px); border: none; display: block;"
              title="DomoNow Vue Analytics & Predictive Demand"
            ></iframe>
          `;
        }
      }
    },
    unmount: async () => {
      console.log('[Root Config] Unmounting Vue Analytics MFE...');
      const container = document.getElementById('single-spa-application:@domonow/vue-analytics');
      if (container) {
        container.style.display = 'none';
      }
    }
  }),
  activeWhen: (location) => location.pathname.startsWith('/analytics')
});

// Start the Single-SPA Engine
start({
  urlRerouteOnly: true
});

console.log('[DomoNow Root Config] Single-SPA Orchestrator started.');
