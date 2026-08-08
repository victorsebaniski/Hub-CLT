import React from 'react';
import {
  Wallet,
  UserCheck,
  LogOut,
  History,
  Calculator,
  Palmtree,
  FileSpreadsheet,
  Sliders,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: { id: string; email: string; name: string; profile: UserProfile } | null;
  activeModule: 'perfil' | 'simulador' | 'ferias' | 'rescisao' | 'guia';
  setActiveModule: (module: 'perfil' | 'simulador' | 'ferias' | 'rescisao' | 'guia') => void;
  onOpenHistory: () => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeModule,
  setActiveModule,
  onOpenHistory,
  onLogout,
  onOpenLogin,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveModule('simulador')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-emerald-500 flex items-center justify-center shadow-md">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xl tracking-tight text-white">Hub</span>
                <span className="font-extrabold text-xl tracking-tight text-emerald-400">CLT</span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                Calculadora & Financeiro do Trabalhador
              </p>
            </div>
          </div>

          {/* User Quick Info Badge (if logged in) */}
          {user && (
            <div className="hidden lg:flex items-center space-x-4 bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/60">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-200">{user.profile.name}</p>
                <p className="text-[11px] text-emerald-400 font-medium">
                  Salário Base: R$ {user.profile.salarioBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-7 w-[1px] bg-slate-700"></div>
              <div className="text-xs text-slate-300 flex flex-col items-start">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Escala</span>
                <span className="font-semibold text-blue-300">{user.profile.escalaTrabalho}h/mês</span>
              </div>
            </div>
          )}

          {/* User Action Controls */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <button
                  id="btn-header-perfil"
                  onClick={() => setActiveModule('perfil')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeModule === 'perfil'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title="Acessar Perfil Base e Cofre do Usuário"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Perfil Base</span>
                </button>

                <button
                  id="btn-header-historico"
                  onClick={onOpenHistory}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  title="Histórico de Simulações Salvas"
                >
                  <History className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Histórico</span>
                </button>

                <button
                  id="btn-header-logout"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Sair da Conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                id="btn-header-login"
                onClick={onOpenLogin}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all transform hover:scale-[1.02]"
              >
                <UserCheck className="w-4 h-4" />
                <span>Entrar / Cadastrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Bar / Module Tabs */}
        <nav className="flex space-x-1 py-2 overflow-x-auto no-scrollbar border-t border-slate-800/80">
          <button
            id="nav-tab-perfil"
            onClick={() => setActiveModule('perfil')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              activeModule === 'perfil'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Perfil Base</span>
          </button>

          <button
            id="nav-tab-simulador"
            onClick={() => setActiveModule('simulador')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              activeModule === 'simulador'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Simulador do Mês</span>
          </button>

          <button
            id="nav-tab-ferias"
            onClick={() => setActiveModule('ferias')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              activeModule === 'ferias'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Palmtree className="w-4 h-4 text-amber-400" />
            <span>Raio-X Férias</span>
          </button>

          <button
            id="nav-tab-rescisao"
            onClick={() => setActiveModule('rescisao')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              activeModule === 'rescisao'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-400" />
            <span>Calculadora de Rescisão</span>
          </button>

          <button
            id="nav-tab-guia"
            onClick={() => setActiveModule('guia')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              activeModule === 'guia'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Guia de Direitos CLT</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
