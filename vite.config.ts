import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:5001',  // This forwards all API requests to the backend server running on port 5001
    },
  },
});
