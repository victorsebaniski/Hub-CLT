import React, { useState } from 'react';
import { ShieldCheck, X, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { UserAccount } from '../types';
import { apiFetch, clearSessionData } from '../utils/storage';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onUserDeleted?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
  isOpen,
  onClose,
  user,
  onUserDeleted,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setErrorMsg(null);
    setDeleteMsg(null);

    try {
      await apiFetch('/api/profile', { method: 'DELETE' });
      clearSessionData();
      setDeleteMsg('Sua conta e todo o seu histórico foram excluídos permanentemente.');
      setTimeout(() => {
        if (onUserDeleted) onUserDeleted();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir a conta.';
      setErrorMsg(msg);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Política de Privacidade & LGPD</h2>
              <p className="text-xs text-slate-500">Transparência e controle total sobre seus dados no Hub CLT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 leading-relaxed">
          {deleteMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{deleteMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center space-x-2 font-semibold">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">1. Quais dados coletamos?</h3>
            <p>
              Coletamos apenas as informações estritamente necessárias para a prestação dos serviços de simulação trabalhista:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-500">
              <li><strong>Dados de Identificação:</strong> Nome, endereço de e-mail e hash criptografado de senha (utilizando bcrypt).</li>
              <li><strong>Perfil Remuneratório:</strong> Salário bruto, quantidade de dependentes, descontos eventuais (VT, plano de saúde) e escala de trabalho configurados no Perfil Base para execução dos cálculos.</li>
              <li><strong>Histórico de Simulações:</strong> Relatórios e resultados salvos por sua solicitação explícita.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">2. Onde e como armazenamos seus dados?</h3>
            <p>
              Seus dados são armazenados com segurança em banco de dados em nuvem gerenciado pelo <strong>Supabase (PostgreSQL)</strong>.
              Toda a comunicação entre seu navegador e nossos servidores é protegida por criptografia TLS/HTTPS e os dados são protegidos por tokens de autenticação JWT com criptografia HMAC-SHA256.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">3. Não compartilhamento comercial</h3>
            <p>
              O Hub CLT se compromete rigorosamente a <strong>jamais vender, alugar ou compartilhar</strong> seus dados pessoais ou financeiros com terceiros para fins publicitários ou de marketing.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">4. Seus Direitos LGPD & Exclusão de Dados</h3>
            <p>
              Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você possui o direito de consultar, retificar e excluir definitivamente seus dados de nossa base a qualquer momento.
            </p>
          </div>

          {/* Account Deletion Section if user logged in */}
          {user && (
            <div className="mt-8 p-5 bg-red-50/60 border border-red-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-red-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Exclusão Definitiva de Conta (Direito ao Esquecimento)</span>
              </div>
              <p className="text-[11px] text-red-700">
                Ao excluir sua conta, seu cadastro e todo o seu histórico de simulações salvas serão permanentemente removidos de nossas tabelas no Supabase sem possibilidade de recuperação.
              </p>

              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Solicitar Exclusão da Minha Conta</span>
                </button>
              ) : (
                <div className="p-3 bg-white border border-red-300 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-red-900">
                    Tem certeza absoluta? Esta ação é irreversível.
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleDeleteAccount}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      {deleting ? 'Excluindo...' : 'Sim, Excluir Meus Dados'}
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
