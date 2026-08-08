/**
 * Hub CLT - Aplicativo Utilitário e Financeiro para Trabalhadores CLT
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ModulePerfilBase } from './components/ModulePerfilBase';
import { ModuleSimuladorMes } from './components/ModuleSimuladorMes';
import { ModuleFerias } from './components/ModuleFerias';
import { ModuleRescisao } from './components/ModuleRescisao';
import { CltEduGuide } from './components/CltEduGuide';
import { HistoryModal } from './components/HistoryModal';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { CheckCircle2, X } from 'lucide-react';

import { UserProfile, CalculationHistoryItem } from './types';
import { getCachedUser, setCachedUser, clearSessionData, apiFetch } from './utils/storage';
import { DEFAULT_DEMO_PROFILE } from './constants/defaultProfile';

export default function App() {
  // State
  const [user, setUser] = useState<{ id: string; email: string; name: string; profile: UserProfile } | null>(
    () => getCachedUser() || { id: 'usr_demo', email: 'operador@clt.com.br', name: 'Operador Fabril', profile: DEFAULT_DEMO_PROFILE }
  );

  const [activeModule, setActiveModule] = useState<'perfil' | 'simulador' | 'ferias' | 'rescisao' | 'guia'>('simulador');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<CalculationHistoryItem[]>([]);

  // Confirmation Toast Notification State
  const [toast, setToast] = useState<{ message: string; title?: string } | null>(null);

  const showToast = (message: string, title = 'Salvo com sucesso!') => {
    setToast({ message, title });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Load history when user logged in
  useEffect(() => {
    if (user) {
      apiFetch('/api/history')
        .then((res) => {
          if (res.history) setHistory(res.history);
        })
        .catch(() => {
          // ignore or fallback
        });
    }
  }, [user?.email]);

  const handleUpdateProfile = (newProfile: UserProfile) => {
    if (user) {
      const updatedUser = { ...user, profile: newProfile };
      setUser(updatedUser);
      setCachedUser(updatedUser);
    }
    showToast('Suas informações salariais foram salvas e sincronizadas!', 'Perfil Atualizado');
  };

  const handleSaveHistory = async (
    type: 'mensal' | 'ferias' | 'rescisao',
    title: string,
    netAmount: number,
    details: CalculationHistoryItem['detailsData']
  ) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await apiFetch('/api/history', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          type,
          title,
          summaryText: `Simulação de ${type} com valor líquido de R$ ${netAmount.toFixed(2)}`,
          valorLiquidoPrincipal: netAmount,
          detailsData: details,
        }),
      });

      if (res.item) {
        setHistory((prev) => [res.item, ...prev]);
      }
    } catch (err) {
      // Fallback local memory
      const newItem: CalculationHistoryItem = {
        id: `hist_${Date.now()}`,
        userId: user.id,
        type,
        title,
        date: new Date().toISOString(),
        summaryText: `Simulação de ${type}`,
        valorLiquidoPrincipal: netAmount,
        detailsData: details,
      };
      setHistory((prev) => [newItem, ...prev]);
    }

    showToast(`"${title}" gravada com sucesso em seu histórico!`, 'Simulação Salva');
  };

  const handleLogout = () => {
    clearSessionData();
    setUser(null);
    setIsAuthOpen(true);
  };

  const currentProfile = user ? user.profile : DEFAULT_DEMO_PROFILE;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header & Navigation Bar */}
      <Header
        user={user}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onLogout={handleLogout}
        onOpenLogin={() => setIsAuthOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeModule === 'perfil' && (
          <ModulePerfilBase profile={currentProfile} onUpdateProfile={handleUpdateProfile} />
        )}

        {activeModule === 'simulador' && (
          <ModuleSimuladorMes profile={currentProfile} onSaveHistory={handleSaveHistory} />
        )}

        {activeModule === 'ferias' && (
          <ModuleFerias profile={currentProfile} onSaveHistory={handleSaveHistory} />
        )}

        {activeModule === 'rescisao' && (
          <ModuleRescisao profile={currentProfile} onSaveHistory={handleSaveHistory} />
        )}

        {activeModule === 'guia' && <CltEduGuide />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">Hub CLT</span>
              <span>- Ferramenta de Precisão Financeira do Trabalhador Brasileiro</span>
            </div>
            <div className="flex items-center space-x-4">
              <p className="text-slate-500">
                Tabelas e Regras Atualizadas conforme a Legislação CLT Vigente (INSS & IRRF).
              </p>
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-blue-400 hover:text-blue-300 font-semibold underline transition-colors shrink-0"
              >
                Política de Privacidade & LGPD
              </button>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center leading-relaxed">
            O Hub CLT oferece estimativas baseadas na legislação trabalhista vigente e não substitui a orientação de um contador ou advogado trabalhista. Valores reais podem variar conforme acordos coletivos e políticas internas da empresa.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
        }}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicy
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        user={user}
        onUserDeleted={() => {
          setUser(null);
          setHistory([]);
          showToast('Sua conta e histórico de simulações foram excluídos permanentemente.', 'Conta Excluída');
        }}
      />

      {/* Global Confirmation Toast */}
      {toast && (
        <div
          id="toast-confirmacao"
          className="fixed top-20 right-4 sm:right-8 z-50 flex items-center space-x-3 bg-slate-900/95 text-white px-5 py-4 rounded-2xl shadow-2xl border border-emerald-500/60 backdrop-blur-md animate-fadeIn transition-all transform hover:scale-[1.02]"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">{toast.title}</p>
            <p className="text-xs font-semibold text-slate-100">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
