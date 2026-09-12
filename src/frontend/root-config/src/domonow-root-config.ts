import { registerApplication, start, navigateToUrl, triggerAppChange } from 'single-spa';

console.log('[DomoNow Root Config] Initializing Single-SPA Root Orchestrator with Auth & i18n...');

export type SupportedLang = 'es' | 'en';

const AUTH_STORAGE_KEY = 'domonow_auth_user';

// Static User for Gatehouse Demo
const STATIC_USER = {
  email: 'guardia@domonow.io',
  password: 'DomoNow2026!',
  nameEs: 'Portería Principal',
  nameEn: 'Main Gatehouse',
  roleEs: 'Guardia de Turno',
  roleEn: 'On-Duty Guard'
};

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_STORAGE_KEY) !== null;
}

// Complete Translations Dictionary
const translations: Record<SupportedLang, {
  // Shell Navbar
  tabParking: string;
  tabAnalytics: string;
  propertyName: string;
  guardName: string;
  guardRole: string;
  logoutButton: string;
  // Login Screen
  loginTitle: string;
  loginSubtitle: string;
  demoHint: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  loginSubmit: string;
  loginError: string;
  securityNote: string;
}> = {
  es: {
    tabParking: '🚗 Operaciones de Parqueadero',
    tabAnalytics: '📈 Analítica & Demanda Predictiva',
    propertyName: 'Condominio Altos de la Pradera - Torre 1 & 2',
    guardName: 'Portería Principal',
    guardRole: 'Guardia de Turno',
    logoutButton: 'Cerrar Sesión',
    loginTitle: 'Control de Acceso',
    loginSubtitle: 'Plataforma de Gestión Integral de Portería & Parqueaderos',
    demoHint: '⚡ Clic para autocompletar',
    emailLabel: 'Usuario / Correo Electrónico',
    emailPlaceholder: 'guardia@domonow.io',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: '••••••••',
    loginSubmit: 'Iniciar Sesión',
    loginError: 'Credenciales incorrectas. Usa guardia@domonow.io y DomoNow2026!',
    securityNote: '🔒 Acceso restringido y auditado para personal de portería y administración.'
  },
  en: {
    tabParking: '🚗 Parking Operations',
    tabAnalytics: '📈 Analytics & Demand Forecast',
    propertyName: 'Altos de la Pradera Condominium - Tower 1 & 2',
    guardName: 'Main Gatehouse',
    guardRole: 'On-Duty Guard',
    logoutButton: 'Sign Out',
    loginTitle: 'Access Control',
    loginSubtitle: 'Integrated Gatehouse & Visitor Parking Platform',
    demoHint: '⚡ Click to auto-fill',
    emailLabel: 'User / Email Address',
    emailPlaceholder: 'guardia@domonow.io',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    loginSubmit: 'Sign In',
    loginError: 'Invalid credentials. Use guardia@domonow.io and DomoNow2026!',
    securityNote: '🔒 Restricted & audited access for gatehouse and management staff.'
  }
};

let currentLang: SupportedLang = (localStorage.getItem('domonow-lang') as SupportedLang) || 'es';

function updateTexts(lang: SupportedLang) {
  const t = translations[lang];

  // 1. Shell Navbar Texts
  const labelTabParking = document.getElementById('label-tab-parking');
  const labelTabAnalytics = document.getElementById('label-tab-analytics');
  const labelPropertyName = document.getElementById('label-property-name');
  const labelGuardName = document.getElementById('label-guard-name');
  const labelGuardRole = document.getElementById('label-guard-role');
  const labelLogout = document.getElementById('label-logout-text');

  if (labelTabParking) labelTabParking.textContent = t.tabParking;
  if (labelTabAnalytics) labelTabAnalytics.textContent = t.tabAnalytics;
  if (labelPropertyName) labelPropertyName.textContent = t.propertyName;
  if (labelGuardName) labelGuardName.textContent = t.guardName;
  if (labelGuardRole) labelGuardRole.textContent = t.guardRole;
  if (labelLogout) labelLogout.textContent = t.logoutButton;

  // 2. Login Screen Texts
  const labelLoginTitle = document.getElementById('label-login-title');
  const labelLoginSubtitle = document.getElementById('label-login-subtitle');
  const labelDemoHint = document.getElementById('label-demo-hint');
  const labelLoginEmail = document.getElementById('label-login-email');
  const labelLoginPassword = document.getElementById('label-login-password');
  const labelLoginSubmit = document.getElementById('label-login-submit');
  const labelLoginError = document.getElementById('label-login-error');
  const labelSecurityNote = document.getElementById('label-security-note');

  if (labelLoginTitle) labelLoginTitle.textContent = t.loginTitle;
  if (labelLoginSubtitle) labelLoginSubtitle.textContent = t.loginSubtitle;
  if (labelDemoHint) labelDemoHint.textContent = t.demoHint;
  if (labelLoginEmail) labelLoginEmail.textContent = t.emailLabel;
  if (labelLoginPassword) labelLoginPassword.textContent = t.passwordLabel;
  if (labelLoginSubmit) labelLoginSubmit.textContent = t.loginSubmit;
  if (labelLoginError) labelLoginError.textContent = t.loginError;
  if (labelSecurityNote) labelSecurityNote.textContent = t.securityNote;

  // 3. Update active states on both language switcher button sets
  const btnEs = document.getElementById('lang-btn-es');
  const btnEn = document.getElementById('lang-btn-en');
  const loginBtnEs = document.getElementById('login-lang-btn-es');
  const loginBtnEn = document.getElementById('login-lang-btn-en');

  [btnEs, loginBtnEs].forEach(btn => {
    if (btn) {
      if (lang === 'es') btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });

  [btnEn, loginBtnEn].forEach(btn => {
    if (btn) {
      if (lang === 'en') btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
}

export function setLanguage(lang: SupportedLang) {
  currentLang = lang;
  localStorage.setItem('domonow-lang', lang);
  updateTexts(lang);

  // Dispatch custom event for single-spa in-memory apps
  window.dispatchEvent(new CustomEvent('domonow:lang-changed', {
    detail: { lang }
  }));

  // Broadcast postMessage to all running microfrontend iframes
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

/**
 * Synchronize UI visibility according to auth status
 */
function syncAuthStateUI() {
  const isAuth = isAuthenticated();
  const loginView = document.getElementById('login-view');
  const shellNavbar = document.getElementById('domo-shell-navbar');
  const angularContainer = document.getElementById('single-spa-application:@domonow/angular-parking');
  const vueContainer = document.getElementById('single-spa-application:@domonow/vue-analytics');

  if (isAuth) {
    if (loginView) loginView.style.display = 'none';
    if (shellNavbar) shellNavbar.style.display = 'flex';
    updateActiveTabs();
  } else {
    if (loginView) loginView.style.display = 'flex';
    if (shellNavbar) shellNavbar.style.display = 'none';
    if (angularContainer) angularContainer.style.display = 'none';
    if (vueContainer) vueContainer.style.display = 'none';
  }
}

/**
 * Handle Login Form Submission
 */
function handleLogin(email: string, pass: string): boolean {
  const errorBox = document.getElementById('login-error-box');

  if (email.trim().toLowerCase() === STATIC_USER.email.toLowerCase() && pass === STATIC_USER.password) {
    if (errorBox) errorBox.style.display = 'none';
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      email: STATIC_USER.email,
      name: STATIC_USER.nameEs,
      role: STATIC_USER.roleEs,
      loginTime: new Date().toISOString()
    }));

    syncAuthStateUI();

    // If currently at root or invalid path, redirect to /parking
    if (window.location.pathname === '/' || window.location.pathname === '/login') {
      window.history.pushState(null, '', '/parking');
    }

    triggerAppChange();
    return true;
  } else {
    if (errorBox) errorBox.style.display = 'flex';
    return false;
  }
}

/**
 * Handle Logout
 */
function handleLogout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  syncAuthStateUI();
  triggerAppChange();
  console.log('[DomoNow Root Config] User logged out successfully.');
}

/**
 * Initialize Event Listeners for UI & Controls
 */
let isInitialized = false;

function initAppControls() {
  if (isInitialized) return;
  isInitialized = true;

  updateTexts(currentLang);
  syncAuthStateUI();

  // Language Switchers (Top Navbar)
  document.getElementById('lang-btn-es')?.addEventListener('click', (e) => {
    e.preventDefault();
    setLanguage('es');
  });
  document.getElementById('lang-btn-en')?.addEventListener('click', (e) => {
    e.preventDefault();
    setLanguage('en');
  });

  // Language Switchers (Login Screen)
  document.getElementById('login-lang-btn-es')?.addEventListener('click', (e) => {
    e.preventDefault();
    setLanguage('es');
  });
  document.getElementById('login-lang-btn-en')?.addEventListener('click', (e) => {
    e.preventDefault();
    setLanguage('en');
  });

  // Quick Demo Fill Pill
  const demoBox = document.getElementById('demo-creds-box');
  const inputEmail = document.getElementById('login-email') as HTMLInputElement;
  const inputPassword = document.getElementById('login-password') as HTMLInputElement;
  const errorBox = document.getElementById('login-error-box');

  demoBox?.addEventListener('click', () => {
    if (inputEmail) inputEmail.value = STATIC_USER.email;
    if (inputPassword) inputPassword.value = STATIC_USER.password;
    if (errorBox) errorBox.style.display = 'none';
  });

  // Password Visibility Toggle
  const btnTogglePwd = document.getElementById('btn-toggle-pwd');
  btnTogglePwd?.addEventListener('click', () => {
    if (inputPassword) {
      const isPwd = inputPassword.type === 'password';
      inputPassword.type = isPwd ? 'text' : 'password';
      btnTogglePwd.textContent = isPwd ? '🙈' : '👁️';
    }
  });

  // Login Form Submit
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = inputEmail?.value || '';
    const pass = inputPassword?.value || '';
    handleLogin(email, pass);
  });

  // Logout Button
  const btnLogout = document.getElementById('btn-logout');
  btnLogout?.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
  });
}

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

// Run immediate init or on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppControls);
} else {
  initAppControls();
}

/**
 * Register MFE 1: Angular 19 Parking Operations
 * Active when: user is authenticated AND path is /parking or /
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
  activeWhen: (location) => isAuthenticated() && (location.pathname === '/' || location.pathname.startsWith('/parking'))
});

/**
 * Register MFE 2: Vue 3 Analytics & Predictive Demand
 * Active when: user is authenticated AND path is /analytics
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
  activeWhen: (location) => isAuthenticated() && location.pathname.startsWith('/analytics')
});

// Start the Single-SPA Engine
start({
  urlRerouteOnly: true
});
