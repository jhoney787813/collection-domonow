import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 9000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  preview: {
    port: 9000,
    cors: true
  }
});
