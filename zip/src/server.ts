import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

// Mock Data
let users = [
  { id: 'USR-001', name: 'Ana Silva (Tu)', email: 'admin@finansmart.pt', role: 'Admin', date: '2023-01-15' },
  { id: 'USR-042', name: 'João Pereira', email: 'joao.p@exemplo.pt', role: 'User', date: '2023-11-02' }
];

const dashboardData = {
  balance: 45230.50,
  income: 8450.00,
  expense: 3220.00,
  recentTransactions: [
    { id: 1, description: 'Apple Store', date: '24 Out 2023', category: 'Eletrônicos', amount: 2499.00, type: 'expense' },
    { id: 2, description: 'Upwork Escrow', date: '22 Out 2023', category: 'Renda', amount: 4500.00, type: 'income' },
    { id: 3, description: 'Restaurante Nobu', date: '21 Out 2023', category: 'Alimentação', amount: 340.50, type: 'expense' },
    { id: 4, description: 'Dividendos Vanguard', date: '15 Out 2023', category: 'Investimentos', amount: 320.75, type: 'income' }
  ]
};

// --- Mock API Endpoints ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Missing credentials' });
    return;
  }
  
  const user = users.find(u => u.email === email);
  if (user && password) {
    res.json({ token: 'mock-jwt-token-12345', user });
  } else {
    // If not found, let's just mock a success for ease of previewing
    const mockUser = { id: 'USR-999', name: 'Usuário Teste', email: email, role: 'Admin' };
    res.json({ token: 'mock-jwt-token-abcd', user: mockUser });
  }
});

app.post('/api/auth/register', (req, res) => {
  const mockUser = { id: `USR-${Math.floor(Math.random() * 1000)}`, name: req.body.fullName || 'New User', email: req.body.email, role: 'User' };
  res.json({ token: 'mock-jwt-token-new', user: mockUser });
});

app.get('/api/dashboard', (req, res) => {
  res.json(dashboardData);
});

app.get('/api/admin/utilizadores', (req, res) => {
  res.json(users);
});
// --- End Mock Endpoints ---

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
