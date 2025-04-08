import express from 'express';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const currentDir = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(currentDir, '../browser');

// Create Express server
const app = express();

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.get('/api/user-state', (req, res) => {
  res.json({
    id: 'demo-user',
    username: 'demo',
    state: 'active',
    roles: ['user', 'editor']
  });
});

// Serve static files
app.use(express.static(browserDistFolder, {
  maxAge: '1y'
}));

// All regular routes use the Angular app
app.get('*', (req, res) => {
  res.sendFile(join(browserDistFolder, 'index.html'));
});

// Start server when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Export Express app
export default app;
