import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getSupabaseServer } from '../src/lib/supabaseServer';
import { DEFAULT_DEMO_PROFILE } from '../src/constants/defaultProfile';
import { UserAccount, UserProfile } from '../src/types';

async function seed() {
  console.log('[Seed] Iniciando script de povoamento do usuário demo...');

  const supabase = getSupabaseServer();
  if (!supabase) {
    console.error('[Seed Erro] Supabase não está configurado. Verifique as variáveis VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash('senha123', 10);
  const demoProfile: UserProfile = { ...DEFAULT_DEMO_PROFILE, updatedAt: new Date().toISOString() };

  const demoUser: UserAccount = {
    id: 'usr_demo',
    email: 'operador@clt.com.br',
    name: 'Operador Fabril CLT',
    passwordHash: hashedPassword,
    createdAt: new Date().toISOString(),
    profile: demoProfile,
  };

  const { error } = await supabase.from('users').upsert(
    {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      password_hash: demoUser.passwordHash,
      profile: demoUser.profile,
      created_at: demoUser.createdAt,
    },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('[Seed Erro] Falha ao inserir usuário demo no Supabase:', error.message);
    process.exit(1);
  }

  console.log('[Seed Sucesso] Usuário demo (operador@clt.com.br / senha123) semeado com sucesso no Supabase!');
}

seed().catch((err) => {
  console.error('[Seed Erro Fatal]:', err);
  process.exit(1);
});
