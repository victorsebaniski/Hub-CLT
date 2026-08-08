import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { UserAccount, UserProfile, CalculationHistoryItem } from './src/types';
import { DEFAULT_DEMO_PROFILE } from './src/constants/defaultProfile';
import { getSupabaseServer } from './src/lib/supabaseServer';
import {
  calculateMonthlyPaycheck,
  calculateVacation,
  calculateSeverance,
  SALARIO_MINIMO_DEFAULT,
} from './src/utils/cltMath';

// ============================================================================
// ENVIRONMENT VARIABLES BOOT VALIDATION
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: A variável de ambiente JWT_SECRET é obrigatória para iniciar o servidor.');
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Check production mandatory env vars
if (IS_PRODUCTION) {
  const missingVars: string[] = [];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl) missingVars.push('SUPABASE_URL (ou VITE_SUPABASE_URL)');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.VITE_SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');

  if (missingVars.length > 0) {
    throw new Error(
      `FATAL: Em ambiente de produção (NODE_ENV=production), as seguintes variáveis de ambiente são obrigatórias: ${missingVars.join(', ')}`
    );
  }
}

const app = express();
const PORT = 3000;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : '*';

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));

interface AuthenticatedRequest extends Request {
  user?: UserAccount;
}

class DatabaseError extends Error {
  constructor(message?: string) {
    super(message || 'Serviço de dados temporariamente indisponível');
    this.name = 'DatabaseError';
  }
}

// ============================================================================
// DATA LAYER — SUPABASE WITH FILE FALLBACK (DEV ONLY)
// ============================================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Local fallback helpers (used ONLY when Supabase is not configured)
function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadUsersFileFallback(): Record<string, UserAccount> {
  ensureDataDirExists();
  let users: Record<string, UserAccount> = {};
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      users = JSON.parse(content);
    }
  } catch (err) {
    console.error('[Fallback File Read Error - Users]:', err);
  }

  // Seed demo user locally if empty
  if (Object.keys(users).length === 0) {
    const demoProfile: UserProfile = { ...DEFAULT_DEMO_PROFILE, updatedAt: new Date().toISOString() };
    const demoUser: UserAccount = {
      id: 'usr_demo',
      email: 'operador@clt.com.br',
      name: 'Operador Fabril CLT',
      passwordHash: 'senha123',
      createdAt: new Date().toISOString(),
      profile: demoProfile,
    };
    users[demoUser.email] = demoUser;
  }

  // Hash plain text passwords
  let needsSave = false;
  for (const email of Object.keys(users)) {
    const u = users[email];
    if (u.passwordHash && !u.passwordHash.startsWith('$2a$') && !u.passwordHash.startsWith('$2b$')) {
      u.passwordHash = bcrypt.hashSync(u.passwordHash, 10);
      needsSave = true;
    }
  }

  if (needsSave) {
    saveUsersFileFallback(users);
  }

  return users;
}

function saveUsersFileFallback(users: Record<string, UserAccount>) {
  ensureDataDirExists();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('[Fallback File Write Error - Users]:', err);
  }
}

function loadHistoryFileFallback(): CalculationHistoryItem[] {
  ensureDataDirExists();
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[Fallback File Read Error - History]:', err);
  }
  return [];
}

function saveHistoryFileFallback(history: CalculationHistoryItem[]) {
  ensureDataDirExists();
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('[Fallback File Write Error - History]:', err);
  }
}

// Check Supabase availability at boot
const isSupabaseConfigured = Boolean(getSupabaseServer());
if (!isSupabaseConfigured) {
  console.warn(
    '\x1b[33m%s\x1b[0m',
    '[AVISO CRÍTICO] Supabase não configurado — rodando em modo de desenvolvimento local com fallback em arquivo, NÃO USE EM PRODUÇÃO'
  );
}

// Core Database Abstraction Layer
async function getUserByEmail(email: string): Promise<UserAccount | null> {
  const supabase = getSupabaseServer();
  const normalizedEmail = email.trim().toLowerCase();

  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('[Supabase Query Error - getUserByEmail]:', error.message);
      throw new DatabaseError();
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      passwordHash: data.password_hash,
      profile: data.profile as UserProfile,
      createdAt: data.created_at,
    };
  }

  const users = loadUsersFileFallback();
  return users[normalizedEmail] || null;
}

async function getUserById(id: string): Promise<UserAccount | null> {
  const supabase = getSupabaseServer();

  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[Supabase Query Error - getUserById]:', error.message);
      throw new DatabaseError();
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      passwordHash: data.password_hash,
      profile: data.profile as UserProfile,
      createdAt: data.created_at,
    };
  }

  const users = loadUsersFileFallback();
  return Object.values(users).find((u) => u.id === id) || null;
}

async function createUserInDb(user: UserAccount): Promise<void> {
  const supabase = getSupabaseServer();

  if (supabase) {
    const { error } = await supabase.from('users').insert({
      id: user.id,
      email: user.email,
      name: user.name,
      password_hash: user.passwordHash,
      profile: user.profile,
      created_at: user.createdAt,
    });

    if (error) {
      console.error('[Supabase Query Error - createUserInDb]:', error.message);
      throw new DatabaseError();
    }
    return;
  }

  const users = loadUsersFileFallback();
  users[user.email.toLowerCase()] = user;
  saveUsersFileFallback(users);
}

async function updateUserProfileInDb(email: string, profile: UserProfile): Promise<void> {
  const supabase = getSupabaseServer();
  const normalizedEmail = email.trim().toLowerCase();

  if (supabase) {
    const { error } = await supabase
      .from('users')
      .update({ profile, updated_at: new Date().toISOString() })
      .eq('email', normalizedEmail);

    if (error) {
      console.error('[Supabase Query Error - updateUserProfileInDb]:', error.message);
      throw new DatabaseError();
    }
    return;
  }

  const users = loadUsersFileFallback();
  if (users[normalizedEmail]) {
    users[normalizedEmail].profile = profile;
    saveUsersFileFallback(users);
  }
}

async function deleteUserAccountInDb(userId: string, email: string): Promise<void> {
  const supabase = getSupabaseServer();
  const normalizedEmail = email.trim().toLowerCase();

  if (supabase) {
    // Delete history first
    const { error: histError } = await supabase
      .from('calculation_history')
      .delete()
      .eq('user_id', userId);

    if (histError) {
      console.error('[Supabase Delete Error - History]:', histError.message);
      throw new DatabaseError();
    }

    // Delete user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (userError) {
      console.error('[Supabase Delete Error - User]:', userError.message);
      throw new DatabaseError();
    }
    return;
  }

  // Fallback file mode
  const users = loadUsersFileFallback();
  delete users[normalizedEmail];
  saveUsersFileFallback(users);

  const history = loadHistoryFileFallback().filter((h) => h.userId !== userId);
  saveHistoryFileFallback(history);
}

async function getUserHistoryFromDb(userId: string): Promise<CalculationHistoryItem[]> {
  const supabase = getSupabaseServer();

  if (supabase) {
    const { data, error } = await supabase
      .from('calculation_history')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('[Supabase Query Error - getUserHistoryFromDb]:', error.message);
      throw new DatabaseError();
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type as 'mensal' | 'ferias' | 'rescisao',
      title: row.title,
      date: row.date,
      summaryText: row.summary_text || '',
      valorLiquidoPrincipal: Number(row.valor_liquido_principal) || 0,
      detailsData: row.details_data,
    }));
  }

  const history = loadHistoryFileFallback();
  return history.filter((item) => item.userId === userId);
}

async function saveHistoryItemToDb(item: CalculationHistoryItem): Promise<void> {
  const supabase = getSupabaseServer();

  if (supabase) {
    const { error } = await supabase.from('calculation_history').insert({
      id: item.id,
      user_id: item.userId,
      type: item.type,
      title: item.title,
      date: item.date,
      summary_text: item.summaryText,
      valor_liquido_principal: item.valorLiquidoPrincipal,
      details_data: item.detailsData,
    });

    if (error) {
      console.error('[Supabase Query Error - saveHistoryItemToDb]:', error.message);
      throw new DatabaseError();
    }
    return;
  }

  const history = loadHistoryFileFallback();
  history.unshift(item);
  saveHistoryFileFallback(history);
}

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requisições por IP a cada 15 minutos
  message: { error: 'Muitas tentativas de autenticação. Por favor, aguarde 15 minutos e tente novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dedicated rate limiter for calculation simulation routes
const calcLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // máximo 60 requisições por IP a cada 1 minuto
  message: { error: 'Limite de simulações atingido. Por favor, aguarde 1 minuto e tente novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', authLimiter);

app.use('/api/calculate/monthly', calcLimiter);
app.use('/api/calculate/vacation', calcLimiter);
app.use('/api/calculate/severance', calcLimiter);

// Unified Auth Middleware
async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido ou formato inválido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; email: string };
    const user = await getUserByEmail(decoded.email);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado para o token fornecido.' });
    }

    req.user = user;
    next();
  } catch (err: unknown) {
    if (err instanceof DatabaseError) {
      return res.status(503).json({ error: 'Serviço de dados temporariamente indisponível' });
    }
    return res.status(401).json({ error: 'Sessão expirada ou token JWT inválido.' });
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

// API Health Check (with live Supabase DB query test)
app.get('/api/health', async (req, res) => {
  const supabase = getSupabaseServer();
  if (!supabase) {
    return res.json({
      status: 'ok',
      mode: 'local_file_fallback',
      supabase: {
        configured: false,
        connected: false,
      },
      app: 'Hub CLT',
      version: '1.0.0',
    });
  }

  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      return res.status(503).json({
        status: 'degraded',
        mode: 'supabase',
        supabase: {
          configured: true,
          connected: false,
          error: error.message,
        },
        app: 'Hub CLT',
        version: '1.0.0',
      });
    }

    return res.json({
      status: 'ok',
      mode: 'supabase',
      supabase: {
        configured: true,
        connected: true,
      },
      app: 'Hub CLT',
      version: '1.0.0',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro de conexão com banco de dados';
    return res.status(503).json({
      status: 'degraded',
      mode: 'supabase',
      supabase: {
        configured: true,
        connected: false,
        error: msg,
      },
      app: 'Hub CLT',
      version: '1.0.0',
    });
  }
});

// API Supabase Status
app.get('/api/supabase/status', (req, res) => {
  const supabase = getSupabaseServer();
  const isConfigured = Boolean(supabase);
  res.json({
    configured: isConfigured,
    message: isConfigured
      ? 'Supabase ativado e integrado com sucesso!'
      : 'Supabase não configurado. Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.',
  });
});

// AUTH: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, initialProfile } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await getUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado no Hub CLT.' });
    }

    const userId = `usr_${Date.now()}`;
    const defaultProfile: UserProfile = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      salarioBruto: initialProfile?.salarioBruto ? Number(initialProfile.salarioBruto) : 3000.0,
      dependentes: initialProfile?.dependentes ? Number(initialProfile.dependentes) : 0,
      descontoPlanoSaude: initialProfile?.descontoPlanoSaude ? Number(initialProfile.descontoPlanoSaude) : 0,
      descontoVT: initialProfile?.descontoVT ? Number(initialProfile.descontoVT) : 0,
      usarVTPercentual: initialProfile?.usarVTPercentual !== undefined ? Boolean(initialProfile.usarVTPercentual) : true,
      descontoOutros: initialProfile?.descontoOutros ? Number(initialProfile.descontoOutros) : 0,
      escalaTrabalho: initialProfile?.escalaTrabalho || '220',
      diasUteisMes: 22,
      domingosFeriados: 4,
      temInsalubridade: Boolean(initialProfile?.temInsalubridade),
      grauInsalubridade: initialProfile?.grauInsalubridade || 20,
      temPericulosidade: Boolean(initialProfile?.temPericulosidade),
      salarioMinimoVigente: SALARIO_MINIMO_DEFAULT,
      updatedAt: new Date().toISOString(),
    };

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: UserAccount = {
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      profile: defaultProfile,
    };

    await createUserInDb(newUser);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET!,
      { expiresIn: '2h' }
    );

    const refreshToken = jwt.sign(
      { type: 'refresh', userId: newUser.id, email: newUser.email },
      JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        profile: newUser.profile,
      },
    });
  } catch (err: unknown) {
    if (err instanceof DatabaseError) {
      return res.status(503).json({ error: 'Serviço de dados temporariamente indisponível' });
    }
    console.error('[Register Exception]:', err);
    res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

// AUTH: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique e-mail e senha.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique e-mail e senha.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET!,
      { expiresIn: '2h' }
    );

    const refreshToken = jwt.sign(
      { type: 'refresh', userId: user.id, email: user.email },
      JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login realizado com sucesso!',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
    });
  } catch (err: unknown) {
    if (err instanceof DatabaseError) {
      return res.status(503).json({ error: 'Serviço de dados temporariamente indisponível' });
    }
    console.error('[Login Exception]:', err);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// AUTH: Refresh Token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token não fornecido.' });
    }

    let decoded: { type?: string; userId?: string; email?: string };
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET!) as { type?: string; userId?: string; email?: string };
    } catch {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
    }

    if (decoded.type !== 'refresh' || !decoded.email) {
      return res.status(401).json({ error: 'Token fornecido não é um Refresh Token válido.' });
    }

    const user = await getUserByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado para o refresh token fornecido.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET!,
      { expiresIn: '2h' }
    );

    const newRefreshToken = jwt.sign(
      { type: 'refresh', userId: user.id, email: user.email },
      JWT_SECRET!,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Token renovado com sucesso!',
      token,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
      },
    });
  } catch (err: unknown) {
    if (err instanceof DatabaseError) {
      return res.status(503).json({ error: 'Serviço de dados temporariamente indisponível' });
    }
    console.error('[Refresh Exception]:', err);
    res.status(401).json({ error: 'Falha ao renovar sessão.' });
  }
});

// PROFILE: Get Profile (Protected by JWT)
app.get('/api/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ profile: req.user!.profile });
});

// PROFILE: Update Profile (Protected by JWT)
app.put('/api/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedFields = req.body;
    const currentProfile = req.user!.profile;

    const newProfile: UserProfile = {
      ...currentProfile,
      salarioBruto: updatedFields.salarioBruto !== undefined ? Number(updatedFields.salarioBruto) : currentProfile.salarioBruto,
      dependentes: updatedFields.dependentes !== undefined ? Number(updatedFields.dependentes) : currentProfile.dependentes,
      descontoPlanoSaude: updatedFields.descontoPlanoSaude !== undefined ? Number(updatedFields.descontoPlanoSaude) : currentProfile.descontoPlanoSaude,
      descontoVT: updatedFields.descontoVT !== undefined ? Number(updatedFields.descontoVT) : currentProfile.descontoVT,
      usarVTPercentual: updatedFields.usarVTPercentual !== undefined ? Boolean(updatedFields.usarVTPercentual) : currentProfile.usarVTPercentual,
      descontoOutros: updatedFields.descontoOutros !== undefined ? Number(updatedFields.descontoOutros) : currentProfile.descontoOutros,
      escalaTrabalho: updatedFields.escalaTrabalho || currentProfile.escalaTrabalho,
      diasUteisMes: updatedFields.diasUteisMes !== undefined ? Number(updatedFields.diasUteisMes) : currentProfile.diasUteisMes,
      domingosFeriados: updatedFields.domingosFeriados !== undefined ? Number(updatedFields.domingosFeriados) : currentProfile.domingosFeriados,
      temInsalubridade: updatedFields.temInsalubridade !== undefined ? Boolean(updatedFields.temInsalubridade) : currentProfile.temInsalubridade,
      grauInsalubridade: updatedFields.grauInsalubridade !== undefined ? Number(updatedFields.grauInsalubridade) as 10 | 20 | 40 : currentProfile.grauInsalubridade,
      temPericulosidade: updatedFields.temPericulosidade !== undefined ? Boolean(updatedFields.temPericulosidade) : currentProfile.temPericulosidade,
      updatedAt: new Date().toISOString(),
    };

    await updateUserProfileInDb(req.user!.email, newProfile);

    res.json({ message: 'Perfil Base atualizado com sucesso!', profile: newProfile });
  } catch (err: unknown) {
    if (err instanceof DatabaseError) {
      return res.status(503).json({ error: 'Serviço de dados temporariamente indisponível' });
    }
    console.error('[Update Profile Exception]:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar perfil.' });
  }
});

// PROFILE: Delete Account & Data (Protected by JWT - LGPD Compliance)
app.delete('/api/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteUserAccountInDb(req.user!.id, req.user!.email);
    res.json({ message: 'Sua conta e todo o seu histórico de simulações foram excluídos com sucesso do Hub CLT.' });
  } catch (err: unknown) {
    if (err instanceof DatabaseError) {
      return res.status(503).json({ error: 'Serviço de dados temporariamente indisponível' });
    }
    console.error('[Delete Profile Exception]:', err);
    res.status(500).json({ error: 'Erro interno ao excluir conta.' });
  }
});

// CALCULATIONS: Monthly (Public / Stateful Helper)
app.post('/api/calculate/monthly', (req, res) => {
  const { profile, input } = req.body;
  if (!profile) {
    return res.status(400).json({ error: 'Perfil do usuário é obrigatório.' });
  }

  const result = calculateMonthlyPaycheck(profile, input || {
    horasExtras50: 0,
    horasExtras100: 0,
    horasNoturnas: 0,
    faltasDias: 0,
    outrosProventos: 0,
    outrosDescontosEventuais: 0,
  });

  res.json({ result });
});

// CALCULATIONS: Vacation
app.post('/api/calculate/vacation', (req, res) => {
  const { profile, input } = req.body;
  if (!profile) {
    return res.status(400).json({ error: 'Perfil do usuário é obrigatório.' });
  }

  const result = calculateVacation(profile, input);
  res.json({ result });
});

// CALCULATIONS: Severance (Rescisão)
app.post('/api/calculate/severance', (req, res) => {
  const { profile, input } = req.body;
  if (!profile) {
    return res.status(400).json({ error: 'Perfil do usuário é obrigatório.' });
  }

  const result = calculateSeverance(profile, input);
  res.json({ result });
});

// HISTORY: Get User History (Protected by JWT)
app.get('/api/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userHistory = await getUserHistoryFromDb(req.user!.id);
    res.json({ history: userHistory });
  } catch (err: unknown) {
    if (err instanceof DatabaseError) {
      return res.status(503).json({ error: 'Serviço de dados temporariamente indisponível' });
    }
    console.error('[Get History Exception]:', err);
    res.status(500).json({ error: 'Erro interno ao carregar histórico.' });
  }
});

// HISTORY: Save Report (Protected by JWT)
app.post('/api/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, title, summaryText, valorLiquidoPrincipal, detailsData } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Dados incompletos para salvar histórico.' });
    }

    const newItem: CalculationHistoryItem = {
      id: `hist_${Date.now()}`,
      userId: req.user!.id,
      type,
      title,
      date: new Date().toISOString(),
      summaryText: summaryText || '',
      valorLiquidoPrincipal: valorLiquidoPrincipal || 0,
      detailsData,
    };

    await saveHistoryItemToDb(newItem);

    res.status(201).json({ message: 'Simulação salva no histórico com sucesso!', item: newItem });
  } catch (err: unknown) {
    if (err instanceof DatabaseError) {
      return res.status(503).json({ error: 'Serviço de dados temporariamente indisponível' });
    }
    console.error('[Save History Exception]:', err);
    res.status(500).json({ error: 'Erro interno ao salvar histórico.' });
  }
});

// Start Server with Vite Middleware in Dev
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hub CLT] Servidor rodando com sucesso em http://0.0.0.0:${PORT}`);
  });
}

startServer();
