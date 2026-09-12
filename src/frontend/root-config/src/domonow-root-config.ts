import { registerApplication, start, navigateToUrl } from 'single-spa';

console.log('[DomoNow Root Config] Initializing Single-SPA Root Orchestrator with i18n...');

export type SupportedLang = 'es' | 'en';

const shellTranslations: Record<SupportedLang, {
  tabParking: string;
  tabAnalytics: string;
  propertyName: string;
  guardName: string;
  guardRole: string;
}> = {
  es: {
    tabParking: '🚗 Operaciones de Parqueadero',
    tabAnalytics: '📈 Analítica & Demanda Predictiva',
    propertyName: 'Condominio Altos de la Pradera - Torre 1 & 2',
    guardName: 'Portería Principal',
    guardRole: 'Guardia de Turno'
  },
  en: {
    tabParking: '🚗 Parking Operations',
    tabAnalytics: '📈 Analytics & Demand Forecast',
    propertyName: 'Altos de la Pradera Condominium - Tower 1 & 2',
    guardName: 'Main Gatehouse',
    guardRole: 'On-Duty Guard'
  }
};

let currentLang: SupportedLang = (localStorage.getItem('domonow-lang') as SupportedLang) || 'es';

function updateShellTexts(lang: SupportedLang) {
  const t = shellTranslations[lang];
  const labelTabParking = document.getElementById('label-tab-parking');
  const labelTabAnalytics = document.getElementById('label-tab-analytics');
  const labelPropertyName = document.getElementById('label-property-name');
  const labelGuardName = document.getElementById('label-guard-name');
  const labelGuardRole = document.getElementById('label-guard-role');

  if (labelTabParking) labelTabParking.textContent = t.tabParking;
  if (labelTabAnalytics) labelTabAnalytics.textContent = t.tabAnalytics;
  if (labelPropertyName) labelPropertyName.textContent = t.propertyName;
  if (labelGuardName) labelGuardName.textContent = t.guardName;
  if (labelGuardRole) labelGuardRole.textContent = t.guardRole;

  const btnEs = document.getElementById('lang-btn-es');
  const btnEn = document.getElementById('lang-btn-en');
  if (btnEs && btnEn) {
    if (lang === 'es') {
      btnEs.classList.add('active');
      btnEn.classList.remove('active');
    } else {
      btnEs.classList.remove('active');
      btnEn.classList.add('active');
    }
  }
}

export function setLanguage(lang: SupportedLang) {
  currentLang = lang;
  localStorage.setItem('domonow-lang', lang);
  updateShellTexts(lang);

  // 1. Dispatch custom event for single-spa in-memory apps
  window.dispatchEvent(new CustomEvent('domonow:lang-changed', {
    detail: { lang }
  }));

  // 2. Broadcast postMessage to all running microfrontend iframes
  document.querySelectorAll('iframe').forEach(frame => {
    try {
      frame.contentWindow?.postMessage({
        type: 'domonow:lang-changed',
        lang
      }, '*');
    } catch (e) {
      console.warn('[Root Config] Could not postMessage to iframe:', e);
    }
  });

  console.log(`[DomoNow Root Config] Language updated to: ${lang.toUpperCase()}`);
}

let isLangSwitcherInitialized = false;

function initLanguageSwitcher() {
  if (isLangSwitcherInitialized) return;
  const btnEs = document.getElementById('lang-btn-es');
  const btnEn = document.getElementById('lang-btn-en');
  if (!btnEs || !btnEn) return;
  isLangSwitcherInitialized = true;

  updateShellTexts(currentLang);

  btnEs.addEventListener('click', (e) => {
    e.preventDefault();
    setLanguage('es');
  });

  btnEn.addEventListener('click', (e) => {
    e.preventDefault();
    setLanguage('en');
  });
}

// Attach click listeners to language toggle buttons
document.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
});

// Also run immediately in case DOM is already parsed
initLanguageSwitcher();

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
          const iframe = document.createElement('iframe');
          iframe.id = 'iframe-angular-parking';
          iframe.src = 'http://localhost:9001';
          iframe.style.width = '100%';
          iframe.style.height = 'calc(100vh - 68px)';
          iframe.style.border = 'none';
          iframe.style.display = 'block';
          iframe.title = 'DomoNow Angular Parking Operations';

          // Ensure newly loaded iframe receives current language immediately
          iframe.onload = () => {
            try {
              iframe.contentWindow?.postMessage({
                type: 'domonow:lang-changed',
                lang: currentLang
              }, '*');
            } catch (err) {
              console.warn('[Root Config] Error sending initial lang to angular iframe:', err);
            }
          };

          container.appendChild(iframe);
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
          const iframe = document.createElement('iframe');
          iframe.id = 'iframe-vue-analytics';
          iframe.src = 'http://localhost:9002';
          iframe.style.width = '100%';
          iframe.style.height = 'calc(100vh - 68px)';
          iframe.style.border = 'none';
          iframe.style.display = 'block';
          iframe.title = 'DomoNow Vue Analytics & Predictive Demand';

          // Ensure newly loaded iframe receives current language immediately
          iframe.onload = () => {
            try {
              iframe.contentWindow?.postMessage({
                type: 'domonow:lang-changed',
                lang: currentLang
              }, '*');
            } catch (err) {
              console.warn('[Root Config] Error sending initial lang to vue iframe:', err);
            }
          };

          container.appendChild(iframe);
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
