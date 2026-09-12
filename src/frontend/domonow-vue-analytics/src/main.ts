import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import singleSpaVue from 'single-spa-vue';
import App from './App.vue';

const vueLifecycles = singleSpaVue({
  createApp,
  appOptions: {
    render() {
      return h(App);
    }
  },
  handleInstance(app) {
    app.use(createPinia());
  }
});

export const bootstrap = vueLifecycles.bootstrap;
export const mount = vueLifecycles.mount;
export const unmount = vueLifecycles.unmount;

// Standalone mode auto-bootstrap when not mounted by Single-SPA
if (!window.hasOwnProperty('singleSpaNavigate')) {
  const standaloneMount = document.getElementById('app');
  if (standaloneMount) {
    const app = createApp(App);
    app.use(createPinia());
    app.mount('#app');
    console.log('[DomoNow Vue Analytics] Running in standalone mode on port 9002');
  }
}
