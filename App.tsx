import React, { useState, useEffect } from 'react';
import { Session } from './types';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import ApiTester from './components/ApiTester';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulator' | 'api'>('dashboard');
  
  // Initialize sessions from localStorage if available
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem('honeyPotSessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse sessions from storage:", e);
      return [];
    }
  });

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('honeyPotSessions', JSON.stringify(sessions));
    } catch (e) {
      console.error("Failed to save sessions to storage:", e);
    }
  }, [sessions]);

  const handleSessionUpdate = (updatedSession: Session) => {
    setSessions(prev => {
      const index = prev.findIndex(s => s.id === updatedSession.id);
      if (index >= 0) {
        const newSessions = [...prev];
        newSessions[index] = updatedSession;
        return newSessions;
      }
      return [...prev, updatedSession];
    });
  };

  const NavItem = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all mb-2 ${
        activeTab === id 
          ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Honey-Pot AI
          </h1>
          <p className="text-xs text-gray-500 mt-2">Agentic Defense System</p>
        </div>
        
        <nav className="flex-1 p-4">
          <NavItem 
            id="dashboard" 
            label="Dashboard" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>} 
          />
          <NavItem 
            id="simulator" 
            label="Live Simulator" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>} 
          />
          <NavItem 
            id="api" 
            label="API Playground" 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>} 
          />
        </nav>

        <div className="p-4 border-t border-gray-800">
           <div className="bg-gray-800 rounded p-3 text-xs text-gray-400 border border-gray-700">
              <div className="flex justify-between mb-1">
                <span>API Status:</span>
                <span className="text-green-400 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>Agent Model:</span>
                <span className="text-cyan-400">Gemini 3 Flash</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
         <header className="h-16 bg-gray-900/50 backdrop-blur border-b border-gray-800 flex items-center px-6 justify-between">
            <h2 className="text-lg font-semibold text-white">
              {activeTab === 'dashboard' && 'Security Operations Center'}
              {activeTab === 'simulator' && 'Scam Engagement Simulation'}
              {activeTab === 'api' && 'API Endpoint Tester'}
            </h2>
            <div className="flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-xs font-mono text-gray-400">SYSTEM PROTECTED</span>
            </div>
         </header>
         
         <div className="flex-1 overflow-hidden p-6">
            {activeTab === 'dashboard' && <Dashboard sessions={sessions} />}
            {activeTab === 'simulator' && <Simulator sessions={sessions} onSessionUpdate={handleSessionUpdate} />}
            {activeTab === 'api' && <ApiTester onSessionUpdate={handleSessionUpdate} />}
         </div>
      </main>
    </div>
  );
};

export default App;