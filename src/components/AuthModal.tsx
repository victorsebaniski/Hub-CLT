import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Building2,
  DollarSign,
  Users,
} from 'lucide-react';
import { UserProfile } from '../types';
import { apiFetch, setSessionData } from '../utils/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; email: string; name: string; profile: UserProfile }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Initial Profile Fields during Register
  const [salarioBruto, setSalarioBruto] = useState<number>(3850);
  const [dependentes, setDependentes] = useState<number>(1);
  const [escalaTrabalho, setEscalaTrabalho] = useState<'220' | '180' | '150' | '12x36' | '2x2'>('220');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        setSessionData(response.user.email, response.token, response.user, response.refreshToken);
        onSuccess(response.user);
        onClose();
      } else {
        if (!salarioBruto || salarioBruto <= 0) {
          setErrorMsg('O salário bruto deve ser um valor maior que zero.');
          setLoading(false);
          return;
        }

        const response = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            initialProfile: {
              salarioBruto,
              dependentes,
              escalaTrabalho,
            },
          }),
        });

        setSessionData(response.user.email, response.token, response.user, response.refreshToken);
        onSuccess(response.user);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar. Verifique suas informações.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-fadeIn my-8">
        {/* Header Visual */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-6 relative">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Hub CLT - Autenticação</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {mode === 'login'
                  ? 'Acesse seu perfil e cofres de cálculos'
                  : 'Crie sua conta e configure seu Perfil Base'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-800/80 rounded-lg p-1 mt-5 border border-slate-700">
            <button
              type="button"
              id="auth-tab-login"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              id="auth-tab-register"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                mode === 'register' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Criar Novo Perfil
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seu Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    id="input-auth-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail do Trabalhador</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  id="input-auth-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@trabalho.com.br"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  id="input-auth-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            {/* If Register: Configure Initial Base Profile */}
            {mode === 'register' && (
              <div className="pt-3 border-t border-slate-200 mt-2 space-y-3">
                <p className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Configuração Inicial do Perfil Base</span>
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Salário Bruto (R$)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="number"
                        step="0.01"
                        required
                        id="input-auth-salario"
                        value={salarioBruto}
                        onChange={(e) => setSalarioBruto(Number(e.target.value))}
                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Dependentes (IR)
                    </label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="number"
                        min="0"
                        id="input-auth-dependentes"
                        value={dependentes}
                        onChange={(e) => setDependentes(Number(e.target.value))}
                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Escala de Trabalho</label>
                  <select
                    id="select-auth-escala"
                    value={escalaTrabalho}
                    onChange={(e) => setEscalaTrabalho(e.target.value as UserProfile['escalaTrabalho'])}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="220">220h/mês (Padrão 44h semanais)</option>
                    <option value="180">180h/mês (36h semanais / Turnos)</option>
                    <option value="12x36">Escala 12x36 (180h/mês)</option>
                    <option value="2x2">Escala 2x2 (180h/mês)</option>
                    <option value="150">150h/mês (30h semanais)</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              id="btn-auth-submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 mt-4"
            >
              <span>{loading ? 'Processando...' : mode === 'login' ? 'Entrar no Hub CLT' : 'Concluir Cadastro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 text-center leading-normal">
            <p className="font-semibold text-slate-600 mb-1">
              Sua senha é protegida com criptografia forte (bcrypt); seus dados não são compartilhados com terceiros.
            </p>
            <p>
              O Hub CLT oferece estimativas baseadas na legislação trabalhista vigente e não substitui a orientação de um contador ou advogado trabalhista. Valores reais podem variar conforme acordos coletivos e políticas internas da empresa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
