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
  app: async () => {
    try {
      // Attempt to load from Port 9001 if running as separate server
      // or fall back to local direct import
      return await import('../../domonow-angular-parking/src/main.single-spa');
    } catch (err) {
      console.warn('[Root Config] Could not dynamically load angular parking MFE, fallback:', err);
      return {
        bootstrap: async () => {},
        mount: async () => {
          const el = document.getElementById('single-spa-application:@domonow/angular-parking');
          if (el) el.innerHTML = '<div style="padding: 40px; text-align: center;">Cargando MFE de Operaciones en puerto 9001...</div>';
        },
        unmount: async () => {}
      };
    }
  },
  activeWhen: (location) => location.pathname === '/' || location.pathname.startsWith('/parking')
});

/**
 * Register MFE 2: Vue 3 Analytics & Predictive Demand
 * Active on: /analytics
 */
registerApplication({
  name: '@domonow/vue-analytics',
  app: async () => {
    try {
      // Attempt to load from Port 9002 if running as separate server
      // or fall back to local direct import
      return await import('../../domonow-vue-analytics/src/main');
    } catch (err) {
      console.warn('[Root Config] Could not dynamically load vue analytics MFE, fallback:', err);
      return {
        bootstrap: async () => {},
        mount: async () => {
          const el = document.getElementById('single-spa-application:@domonow/vue-analytics');
          if (el) el.innerHTML = '<div style="padding: 40px; text-align: center;">Cargando MFE de Analítica en puerto 9002...</div>';
        },
        unmount: async () => {}
      };
    }
  },
  activeWhen: (location) => location.pathname.startsWith('/analytics')
});

// Start the Single-SPA Engine
start({
  urlRerouteOnly: true
});

console.log('[DomoNow Root Config] Single-SPA Orchestrator started.');
