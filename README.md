# Hub CLT — Plataforma de Simulação Trabalhista e Financeira

O **Hub CLT** é uma aplicação Full-Stack desenvolvida em React 19 + Vite + Express/Node.js para cálculo e simulação de direitos trabalhistas (Salário Líquido, Férias, Rescisão Contratual e Guia CLT).

---

## 🔐 Variáveis de Ambiente em Produção

Para publicação em produção, as seguintes variáveis de ambiente são **OBRIGATÓRIAS**. 

> ⚠️ **ATENÇÃO DE SEGURANÇA (AppSec):** NENHUMA chave real deve ser commitada no repositório ou no arquivo `.env`. Configure-as exclusivamente no painel de segredos/variáveis de ambiente da sua plataforma de hospedagem em produção (ex: Cloud Run, Render, Vercel, Railway).

| Variável | Descrição | Onde Obter / Valor Recomendado |
| :--- | :--- | :--- |
| `JWT_SECRET` | Chave secreta para assinatura e validação dos tokens JWT de autenticação dos usuários. | Gere uma string aleatória forte com 32+ caracteres (`openssl rand -hex 32`). |
| `SUPABASE_URL` ou `VITE_SUPABASE_URL` | URL do projeto PostgreSQL no Supabase. | Painel do Supabase -> Project Settings -> API -> Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de administração do Supabase (Service Role) usada exclusivamente pelo backend Express para bypass de RLS. | Painel do Supabase -> Project Settings -> API -> Service Role Secret. |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anônima do Supabase para inicialização de cliente. | Painel do Supabase -> Project Settings -> API -> anon public key. |
| `NODE_ENV` | Define o ambiente de execução da aplicação. | Defina como `production`. |
| `ALLOWED_ORIGINS` | Domínios permitidos nas requisições CORS do servidor Express. | Ex: `https://hubclt.app,https://www.hubclt.app` (ou `*` para público). |

---

## 🚨 LEMBRETE IMPORTANTE DE SEGURANÇA (ROTAÇÃO DE CHAVES)

> **[AÇÃO MANUAL NECESSÁRIA ANTES DA PUBLICAÇÃO]**  
> Antes de publicar a aplicação em produção, você deve **rotacionar (redefinir) a `SUPABASE_SERVICE_ROLE_KEY` e a `VITE_SUPABASE_ANON_KEY`** diretamente no painel de configurações do Supabase (Project Settings -> API -> Roll Keys), pois as chaves anteriores foram expostas durante o ambiente de desenvolvimento local.

---

## 🗄️ Configuração do Banco de Dados Supabase

Para preparar o banco de dados no Supabase:
1. Acesse o **SQL Editor** do seu projeto no Supabase.
2. Execute o script contido em `supabase/schema.sql` para criar as tabelas `users` e `calculation_history`, índices, triggers de `updated_at` e as políticas de **Row Level Security (RLS)** em modo *Deny All*.
3. (Opcional) Para criar o usuário demonstrativo de testes (`operador@clt.com.br / senha123`), execute o script de seed:
   ```bash
   npm run seed
   ```

---

## 🚀 Como Executar Localmente

### Modo Desenvolvimento Local (sem Supabase)
Se o Supabase não estiver configurado, o servidor subirá automaticamente em modo de desenvolvimento local com fallback de persistência em arquivos na pasta `data/`.

```bash
npm install
npm run dev
```

### Executar Testes e Lint
```bash
npm run lint
npm run test
```

---

## 📄 Licença e Termos
Consulte os termos legais e a Política de Privacidade na aplicação.
