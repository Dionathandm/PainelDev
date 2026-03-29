import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  ChevronRight, 
  Menu, 
  X,
  Plus,
  Send,
  ShieldCheck,
  Zap,
  Star,
  Instagram
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'client' | 'admin';
  status: 'pending' | 'active' | 'blocked';
  company?: string;
  phone?: string;
  createdAt: any;
}

interface Project {
  id: string;
  clientUid: string;
  title: string;
  description: string;
  status: 'analysis' | 'in-progress' | 'completed' | 'paused';
  plan: 'start' | 'pro';
  price: number;
  createdAt: any;
  updatedAt: any;
}

interface Message {
  id: string;
  chatId: string;
  senderUid: string;
  text: string;
  createdAt: any;
}

// --- Components ---

const LoadingScreen = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center"
    >
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Carregando...</p>
    </motion.div>
  </div>
);

const Footer = () => (
  <footer className="py-12 px-6 border-t border-white/5 bg-black text-center">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5">
          <Zap className="text-green-500 w-5 h-5 fill-current" />
        </div>
        <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold leading-relaxed max-w-2xl">
          copyright protegido 2026 Dionathan Martins <br />
          criador da BravaX Hydra Filmes hYdra músicas e biolink
        </p>
      </div>
      <div className="flex items-center justify-center gap-6">
        <Link to="/privacidade" className="text-zinc-600 hover:text-green-500 text-[10px] uppercase tracking-widest font-black transition-colors">
          Privacidade
        </Link>
        <span className="text-zinc-800">|</span>
        <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-black">
          Termos de Uso
        </span>
      </div>
    </div>
  </footer>
);

const FloatingInstagram = () => (
  <a 
    href="https://instagram.com/cortesdocaosdm" 
    target="_blank" 
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-[100] group"
  >
    <div className="relative">
      <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
      <div className="relative w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-110 transition-transform active:scale-95">
        <MessageSquare className="text-black w-6 h-6 fill-current" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </div>
      </div>
      <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          FALE COMIGO NO INSTAGRAM
        </div>
      </div>
    </div>
  </a>
);

const Navbar = ({ user, profile }: { user: FirebaseUser | null, profile: UserProfile | null }) => {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5 px-6 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Zap className="text-black w-5 h-5 fill-current" />
        </div>
        <span className="font-bold text-xl tracking-tight">DDev <span className="text-green-500">Studio</span></span>
      </Link>
      
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.displayName || user.displayName}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{profile?.role || 'Cliente'}</p>
            </div>
            <img 
              src={user.photoURL || ''} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border border-white/10"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-zinc-200 transition-colors"
          >
            Entrar
          </button>
        )}
      </div>
    </nav>
  );
};

// --- Pages ---

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-green-500 selection:text-black flex flex-col">
      <Navbar user={null} profile={null} />
      
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex-1">
        {/* Hero */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-zinc-900 border border-white/10 rounded-full text-xs font-bold text-green-500 mb-6 uppercase tracking-widest">
              Plataforma Premium Dionathan Dev
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
              TRANSFORME <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">IDEIAS EM REALIDADE</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium">
              Criação profissional de aplicativos, landing pages e sistemas sob medida com visual premium e alta performance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-10 py-4 bg-green-500 text-black font-black rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                SOLICITAR PROJETO <ChevronRight className="w-5 h-5" />
              </Link>
              <a 
                href="#planos" 
                className="w-full sm:w-auto px-10 py-4 bg-zinc-900 border border-white/10 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-colors"
              >
                VER PLANOS
              </a>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-32">
          {[
            { label: 'Projetos', value: '50+' },
            { label: 'Clientes', value: '30+' },
            { label: 'Satisfação', value: '100%' },
            { label: 'Suporte', value: '24/7' },
          ].map((stat, i) => (
            <div key={i} className="p-8 bg-zinc-900/50 border border-white/5 rounded-3xl text-center">
              <p className="text-4xl font-black text-white mb-1">{stat.value}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Planos */}
        <div id="planos" className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tighter mb-4">ESCOLHA SEU PLANO</h2>
            <p className="text-zinc-500">Estruturas profissionais para cada etapa do seu negócio.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Start */}
            <div className="group p-10 bg-zinc-900 border border-white/10 rounded-[40px] hover:border-green-500/50 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24" />
              </div>
              <h3 className="text-2xl font-black mb-2">PLANO START</h3>
              <p className="text-zinc-500 text-sm mb-8">Ideal para lançar seu projeto com estrutura profissional.</p>
              <div className="text-4xl font-black mb-8">R$ 3.800</div>
              <ul className="space-y-4 mb-10">
                {['Interface moderna', 'Login de usuários', 'Estrutura escalável', 'Configuração inicial', 'Suporte inicial'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block w-full py-4 bg-white text-black text-center font-black rounded-2xl hover:bg-zinc-200 transition-colors">
                COMEÇAR AGORA
              </Link>
            </div>

            {/* Pro */}
            <div className="group p-10 bg-zinc-900 border-2 border-green-500 rounded-[40px] relative overflow-hidden">
              <div className="absolute -top-4 -right-4 bg-green-500 text-black px-8 py-4 rotate-12 font-black text-xs">MAIS POPULAR</div>
              <h3 className="text-2xl font-black mb-2">PLANO PRO</h3>
              <p className="text-zinc-500 text-sm mb-8">Para quem quer um sistema robusto e preparado para crescer.</p>
              <div className="text-4xl font-black mb-8">R$ 5.200</div>
              <ul className="space-y-4 mb-10">
                {['Tudo do Start', 'Notificações Push', 'Gestão de Dados Avançada', 'Recursos Customizados', 'Prioridade na Fila'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block w-full py-4 bg-green-500 text-black text-center font-black rounded-2xl hover:scale-105 transition-transform">
                CONTRATAR PRO
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingInstagram />
    </div>
  );
};

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          await handlePostLogin(result.user);
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        handleLoginError(err);
      }
    };
    checkRedirect();
  }, []);

  const handlePostLogin = async (user: FirebaseUser) => {
    const isAdminEmail = user.email === 'dionathandm25@gmail.com';

    // Check if user profile exists
    let userDoc;
    try {
      userDoc = await getDoc(doc(db, 'users', user.uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }

    if (!userDoc?.exists()) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: isAdminEmail ? 'admin' : 'client',
          status: isAdminEmail ? 'active' : 'pending',
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    } else if (isAdminEmail && userDoc.data()?.role !== 'admin') {
      // Fix for existing admin user who was created as client
      try {
        await setDoc(doc(db, 'users', user.uid), {
          role: 'admin',
          status: 'active'
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
    navigate('/painel');
  };

  const handleLoginError = (err: any) => {
    console.error('Login error details:', err);
    let message = 'Ocorreu um erro ao fazer login. Tente novamente.';
    
    if (err.code === 'auth/popup-blocked') {
      message = 'O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site ou use o método alternativo abaixo.';
    } else if (err.code === 'auth/popup-closed-by-user') {
      message = 'O login foi cancelado.';
    } else if (err.code === 'auth/unauthorized-domain') {
      message = 'Este domínio não está autorizado no Firebase. Por favor, adicione este domínio (run.app) na lista de domínios autorizados no console do Firebase.';
    } else if (err.message && err.message.includes('FirestoreErrorInfo')) {
      try {
        const info = JSON.parse(err.message);
        message = `Erro de permissão: ${info.error}`;
      } catch {
        message = err.message;
      }
    } else if (err.message) {
      message = `Erro: ${err.message}`;
    }
    
    setError(message);
  };

  const handleLogin = async (useRedirect = false) => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      
      if (useRedirect) {
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await signInWithPopup(auth, provider);
      await handlePostLogin(result.user);
    } catch (err: any) {
      handleLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <Zap className="text-black w-10 h-10 fill-current" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">BEM-VINDO DE VOLTA</h1>
            <p className="text-zinc-500 text-sm">Acesse seu painel exclusivo Dionathan Dev.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => handleLogin(false)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-4 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  ENTRAR COM GOOGLE
                </>
              )}
            </button>

            <button
              onClick={() => handleLogin(true)}
              disabled={loading}
              className="w-full py-3 bg-zinc-900 text-zinc-400 text-xs font-bold rounded-xl hover:text-white transition-colors border border-white/5"
            >
              PROBLEMAS COM POPUP? USE O REDIRECIONAMENTO
            </button>
          </div>
          
          <p className="mt-8 text-center text-xs text-zinc-600 uppercase tracking-widest font-bold">
            Segurança garantida por Google Cloud
          </p>
        </div>
      </div>
      <Footer />
      <FloatingInstagram />
    </div>
  );
};

const WaitingPage = ({ profile }: { profile: UserProfile }) => {
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'payments'), where('clientUid', '==', profile.uid));
    const unsub = onSnapshot(q, (snap) => {
      setHasPaid(!snap.empty);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'payments'));
    return () => unsub();
  }, [profile.uid]);

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await setDoc(doc(collection(db, 'payments')), {
        clientUid: profile.uid,
        amount: 3800, // Default for start plan
        status: 'pending',
        pixKey: '51999007349',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'payments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 text-center overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full py-8"
        >
          {!hasPaid ? (
            <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px]">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CreditCard className="text-green-500 w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter mb-4 uppercase">Realizar Pagamento</h1>
              <p className="text-zinc-400 mb-8 text-sm">
                Para liberar seu acesso ao painel, realize o pagamento do plano via Pix.
              </p>
              
              <div className="p-6 bg-black border border-white/5 rounded-3xl mb-8 text-left">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Chave Pix (Celular)</p>
                <p className="text-lg sm:text-xl font-mono font-bold text-white mb-4 break-all">51999007349</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Nome</p>
                <p className="text-sm font-bold text-zinc-300">Dionathan Duarte Martins</p>
              </div>

              <button 
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full py-4 bg-green-500 text-black font-black rounded-2xl hover:scale-105 transition-transform disabled:opacity-50"
              >
                {loading ? "PROCESSANDO..." : "JÁ REALIZEI O PAGAMENTO"}
              </button>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                <Clock className="text-green-500 w-10 h-10 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter mb-4 uppercase">Pagamento em Análise</h1>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Olá, <span className="text-white font-bold">{profile.displayName}</span>! Recebemos sua confirmação. 
                Nossa equipe está validando o Pix. Em breve você terá acesso total ao painel.
              </p>
              
              <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl mb-8">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2">Sua posição na fila</p>
                <p className="text-5xl font-black text-green-500">23</p>
              </div>
            </>
          )}

          <button 
            onClick={() => signOut(auth)}
            className="mt-8 text-zinc-500 hover:text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <LogOut className="w-4 h-4" /> SAIR DA CONTA
          </button>
        </motion.div>
      </div>
      <Footer />
      <FloatingInstagram />
    </div>
  );
};

const Sidebar = ({ role, activeTab, onTabChange, isOpen, onClose }: { role: string, activeTab: string, onTabChange: (tab: string) => void, isOpen: boolean, onClose: () => void }) => {
  const menuItems = role === 'admin' ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ] : [
    { id: 'overview', label: 'Meu Projeto', icon: LayoutDashboard },
    { id: 'ai-landing', label: 'Criar Landing Page', icon: Zap },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
    { id: 'billing', label: 'Financeiro', icon: CreditCard },
    { id: 'profile', label: 'Meu Perfil', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-zinc-950 border-r border-white/5 flex flex-col h-screen z-50 transition-transform duration-300 lg:translate-x-0 lg:static",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Zap className="text-black w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight">DDev <span className="text-green-500">Studio</span></span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-zinc-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === item.id 
                  ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.2)]" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};

// --- Main App Logic ---

const PrivacyPage = () => (
  <div className="min-h-screen bg-black text-white flex flex-col">
    <Navbar user={null} profile={null} />
    <main className="flex-1 pt-32 pb-20 px-6 max-w-3xl mx-auto">
      <h1 className="text-4xl font-black tracking-tighter mb-8">POLÍTICA DE PRIVACIDADE</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-zinc-400 text-sm leading-relaxed">
        <p>
          Sua privacidade é importante para nós. É política do Dionathan Dev respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site.
        </p>
        <h2 className="text-white font-bold text-lg mt-8">1. Coleta de Informações</h2>
        <p>
          Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.
        </p>
        <h2 className="text-white font-bold text-lg mt-8">2. Uso de Dados</h2>
        <p>
          Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
        </p>
        <h2 className="text-white font-bold text-lg mt-8">3. Segurança</h2>
        <p>
          Protegemos os dados armazenados dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
        </p>
      </div>
    </main>
    <Footer />
    <FloatingInstagram />
  </div>
);

const AppContent = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();

    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (firebaseUser) {
        const isAdminEmail = firebaseUser.email === 'dionathandm25@gmail.com';
        
        profileUnsub = onSnapshot(doc(db, 'users', firebaseUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            if (data.role === 'admin') setActiveTab('dashboard');
            
            if (isAdminEmail && data.role !== 'admin') {
              try {
                await setDoc(doc(db, 'users', firebaseUser.uid), {
                  role: 'admin',
                  status: 'active'
                }, { merge: true });
              } catch (e) {
                console.error("Error auto-fixing admin role:", e);
              }
            }
          } else {
            setProfile(null);
            if (isAdminEmail) {
              try {
                await setDoc(doc(db, 'users', firebaseUser.uid), {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  role: 'admin',
                  status: 'active',
                  createdAt: serverTimestamp()
                });
              } catch (e) {
                console.error("Error creating admin profile:", e);
              }
            }
          }
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/painel" /> : <LoginPage />} />
      <Route path="/privacidade" element={<PrivacyPage />} />
      
      <Route path="/painel" element={
        !user ? <Navigate to="/login" /> : (
          profile?.status === 'pending' ? <WaitingPage profile={profile} /> : (
            <div className="flex min-h-screen bg-black text-white">
              <Sidebar 
                role={profile?.role || 'client'} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
              />
              <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950 sticky top-0 z-30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <Zap className="text-black w-5 h-5 fill-current" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">DDev Studio</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-zinc-400 hover:text-white"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-auto flex flex-col">
                  <div className="flex-1">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {profile?.role === 'admin' ? (
                          <AdminPanel activeTab={activeTab} />
                        ) : (
                          <ClientPanel activeTab={activeTab} profile={profile!} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="mt-12">
                    <Footer />
                  </div>
                </main>
              </div>
              <FloatingInstagram />
            </div>
          )
        )
      } />
    </Routes>
  );
};

// --- Panel Sub-components ---

const ClientPanel = ({ activeTab, profile }: { activeTab: string, profile: UserProfile }) => {
  if (activeTab === 'overview') {
    return (
      <div className="space-y-6 md:space-y-8">
        <header>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2 uppercase">OLÁ, {profile.displayName.split(' ')[0]}</h1>
          <p className="text-zinc-500 text-sm">Acompanhe o progresso do seu projeto em tempo real.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="p-5 md:p-6 bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">Status do Projeto</p>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-lg md:text-xl font-bold">EM ANÁLISE</span>
            </div>
          </div>
          <div className="p-5 md:p-6 bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">Plano Contratado</p>
            <span className="text-lg md:text-xl font-bold">PRO</span>
          </div>
          <div className="p-5 md:p-6 bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">Próxima Entrega</p>
            <span className="text-lg md:text-xl font-bold">--/--/--</span>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-zinc-900 border border-white/5 rounded-3xl md:rounded-[40px]">
          <h2 className="text-lg md:text-xl font-black mb-6">CRONOGRAMA DO PROJETO</h2>
          <div className="space-y-5 md:space-y-6">
            {[
              { label: 'Briefing & Análise', status: 'completed' },
              { label: 'Design de Interface', status: 'current' },
              { label: 'Desenvolvimento Base', status: 'pending' },
              { label: 'Integrações & Backend', status: 'pending' },
              { label: 'Testes & Publicação', status: 'pending' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  step.status === 'completed' ? "bg-green-500 text-black" : 
                  step.status === 'current' ? "border-2 border-green-500 text-green-500" : "border-2 border-zinc-800 text-zinc-800"
                )}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={cn(
                  "font-bold text-sm md:text-base",
                  step.status === 'pending' ? "text-zinc-700" : "text-white"
                )}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'ai-landing') {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2 uppercase">CRIAR LANDING PAGE COM IA</h1>
          <p className="text-zinc-500 text-sm">Gere páginas profissionais em segundos usando inteligência artificial.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 bg-zinc-900 border border-white/5 rounded-[40px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-32 h-32 text-green-500" />
            </div>
            
            <h2 className="text-xl font-black mb-4">GERADOR DE PÁGINAS IA</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              Nossa IA cria descrições persuasivas, páginas de agendamento, localização estratégica e layouts específicos para diversos nichos:
            </p>
            
            <ul className="space-y-3 mb-10">
              {[
                'Páginas para Advogados',
                'Apps de Veículos & Vendas',
                'Agendamento Online Inteligente',
                'Localização & Mapas Dinâmicos',
                'Descrições de Produtos com IA'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-xs font-bold text-zinc-300 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>

            <a 
              href="https://links-pro-eight.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-green-500 text-black font-black rounded-2xl hover:scale-105 transition-transform"
            >
              ACESSAR GERADOR IA <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl">
              <h3 className="font-bold mb-2 text-white">Como funciona?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Ao clicar no botão, você será redirecionado para nossa ferramenta externa de IA. Lá você poderá descrever seu negócio e a IA montará a estrutura completa da sua Landing Page.
              </p>
            </div>
            <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl">
              <h3 className="font-bold mb-2 text-white">Suporte Premium</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Se precisar de ajuda para integrar a página gerada ao seu domínio ou sistema, entre em contato via chat.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'messages') {
    return <ChatView chatId={profile.uid} senderUid={profile.uid} isAdmin={false} />;
  }

  return <div className="text-zinc-500 font-mono">Em desenvolvimento...</div>;
};

const AdminPanel = ({ activeTab }: { activeTab: string }) => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'clients' || activeTab === 'messages') {
      const q = query(collection(db, 'users'), where('role', '==', 'client'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setClients(snap.docs.map(doc => doc.data() as UserProfile));
        setLoading(false);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
      return () => unsub();
    }
  }, [activeTab]);

  if (activeTab === 'dashboard') {
    return (
      <div className="space-y-6 md:space-y-8">
        <header>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">ADMIN DASHBOARD</h1>
          <p className="text-zinc-500 text-sm">Visão geral da sua agência digital.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Total Clientes', value: '12', icon: Users },
            { label: 'Aguardando', value: '3', icon: Clock },
            { label: 'Projetos Ativos', value: '8', icon: Zap },
            { label: 'Faturamento', value: 'R$ 42k', icon: CreditCard },
          ].map((stat, i) => (
            <div key={i} className="p-5 md:p-6 bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl md:text-3xl font-black">{stat.value}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'clients') {
    return (
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">GESTÃO de CLIENTES</h1>
            <p className="text-zinc-500 text-sm">Gerencie acessos e status dos seus clientes.</p>
          </div>
        </header>

        <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Cliente</th>
                <th className="p-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Status</th>
                <th className="p-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={client.photoURL} className="w-8 h-8 rounded-full" alt="" />
                      <div>
                        <p className="font-bold text-sm">{client.displayName}</p>
                        <p className="text-xs text-zinc-500">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      client.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {client.status === 'pending' && (
                      <button 
                        onClick={async () => {
                          try {
                            await setDoc(doc(db, 'users', client.uid), { status: 'active' }, { merge: true });
                          } catch (e) {
                            handleFirestoreError(e, OperationType.UPDATE, `users/${client.uid}`);
                          }
                        }}
                        className="px-4 py-1.5 bg-green-500 text-black text-xs font-black rounded-lg hover:scale-105 transition-transform"
                      >
                        LIBERAR ACESSO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'payments') {
    const [payments, setPayments] = useState<any[]>([]);
    useEffect(() => {
      const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        setPayments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'payments'));
      return () => unsub();
    }, []);

    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">PAGAMENTOS</h1>
          <p className="text-zinc-500 text-sm">Confira e valide os pagamentos via Pix.</p>
        </header>

        <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Cliente UID</th>
                <th className="p-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Valor</th>
                <th className="p-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Status</th>
                <th className="p-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-xs font-mono text-zinc-400">{payment.clientUid}</td>
                  <td className="p-4 font-bold">R$ {payment.amount}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      payment.status === 'confirmed' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {payment.status === 'pending' && (
                      <button 
                        onClick={async () => {
                          try {
                            await setDoc(doc(db, 'payments', payment.id), { status: 'confirmed' }, { merge: true });
                          } catch (e) {
                            handleFirestoreError(e, OperationType.UPDATE, `payments/${payment.id}`);
                          }
                        }}
                        className="px-4 py-1.5 bg-green-500 text-black text-xs font-black rounded-lg hover:scale-105 transition-transform"
                      >
                        CONFIRMAR
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeTab === 'messages') {
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    return (
      <div className="h-full flex flex-col lg:flex-row gap-6">
        <div className={cn(
          "w-full lg:w-64 bg-zinc-900 border border-white/5 rounded-3xl p-4 overflow-auto",
          selectedClient ? "hidden lg:block" : "block"
        )}>
          <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-4 px-2">Conversas</h3>
          {clients.map(client => (
            <button
              key={client.uid}
              onClick={() => setSelectedClient(client.uid)}
              className={cn(
                "w-full text-left p-3 rounded-xl text-sm transition-all mb-1",
                selectedClient === client.uid ? "bg-green-500 text-black font-bold" : "text-zinc-400 hover:bg-white/5"
              )}
            >
              {client.displayName.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedClient ? "hidden lg:flex" : "flex"
        )}>
          {selectedClient ? (
            <>
              <button 
                onClick={() => setSelectedClient(null)}
                className="lg:hidden mb-4 text-xs font-bold text-zinc-500 flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> VOLTAR PARA LISTA
              </button>
              <ChatView chatId={selectedClient} senderUid={auth.currentUser?.uid || ''} isAdmin={true} />
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 font-mono italic">
              Selecione uma conversa para começar
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="text-zinc-500 font-mono">Em desenvolvimento...</div>;
};

const ChatView = ({ chatId, senderUid, isAdmin }: { chatId: string, senderUid: string, isAdmin: boolean }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `chats/${chatId}/messages`));
    return () => unsub();
  }, [chatId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const msgData = {
        chatId,
        senderUid,
        text: inputText,
        createdAt: serverTimestamp()
      };
      const msgRef = doc(collection(db, 'chats', chatId, 'messages'));
      await setDoc(msgRef, msgData);
      setInputText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `chats/${chatId}/messages`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] bg-zinc-900 border border-white/5 rounded-[40px] overflow-hidden">
      <header className="p-4 md:p-6 border-b border-white/5 bg-white/5">
        <h2 className="text-lg md:text-xl font-black tracking-tighter">CHAT COM SUPORTE</h2>
        <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest">Atendimento Direto Dionathan Dev</p>
      </header>

      <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "max-w-[85%] md:max-w-[80%] p-3 md:p-4 rounded-2xl text-sm",
              msg.senderUid === senderUid 
                ? "ml-auto bg-green-500 text-black font-medium rounded-tr-none" 
                : "bg-zinc-800 text-white rounded-tl-none"
            )}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 md:p-6 bg-white/5 border-t border-white/5 flex gap-2 md:gap-4">
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-black border border-white/10 rounded-2xl px-4 md:px-6 py-2 md:py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
        />
        <button 
          type="submit"
          className="w-10 h-10 md:w-12 md:h-12 bg-green-500 text-black rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shrink-0"
        >
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </form>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
