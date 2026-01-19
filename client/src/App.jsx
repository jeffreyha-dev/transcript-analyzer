import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ImportView from './components/ImportView';
import CombinedAnalysisView from './components/CombinedAnalysisView';
import ConversationsView from './components/ConversationsView';
import AIAnalysisView from './components/AIAnalysisView';
import LivePersonFetch from './components/LivePersonFetch';
import ExportView from './components/ExportView';
import SettingsView from './components/SettingsView';
import InteractiveExplorer from './components/InteractiveExplorer';
import AccountSelector from './components/AccountSelector';
import { AnalysisProvider } from './context/AnalysisContext';
import { AccountProvider } from './context/AccountContext';
import './index.css';

import { LayoutDashboard, Upload, MessageSquare, BarChart2, Cpu, Link, Compass, Download, Settings as SettingsIcon } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <AccountProvider>
      <AnalysisProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Navigation */}
          <nav style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(19, 24, 37, 0.9)'
          }}>
            <div className="container" style={{ maxWidth: '100%', padding: '0 1rem' }}>
              <div className="flex justify-between items-center" style={{ padding: '0.75rem 0' }}>
                <div className="flex items-center gap-md">
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    background: 'var(--gradient-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    whiteSpace: 'nowrap'
                  }}>
                    📊 Transcript Analyzer
                  </div>
                </div>

                <div className="flex items-center gap-sm">
                  <AccountSelector />

                  <div className="flex gap-2 text-sm">
                    <button
                      className={`btn btn-sm ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentView('dashboard')}
                      title="Dashboard"
                    >
                      <LayoutDashboard size={14} />
                      <span className="nav-label">Dashboard</span>
                    </button>
                    <button
                      className={`btn btn-sm ${currentView === 'import' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentView('import')}
                      title="Import"
                    >
                      <Upload size={14} />
                      <span className="nav-label">Import</span>
                    </button>
                    <button
                      className={`btn btn-sm ${currentView === 'conversations' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentView('conversations')}
                      title="Conversations"
                    >
                      <MessageSquare size={14} />
                      <span className="nav-label">Conversations</span>
                    </button>
                    <button
                      className={`btn btn-sm ${currentView === 'analysis' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentView('analysis')}
                      title="Analysis"
                    >
                      <BarChart2 size={14} />
                      <span className="nav-label">Analysis</span>
                    </button>
                    <button
                      className={`btn btn-sm ${currentView === 'ai-analysis' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentView('ai-analysis')}
                      title="AI Analysis"
                    >
                      <Cpu size={14} />
                      <span className="nav-label">AI Analysis</span>
                    </button>
                    <button
                      className={`btn btn-sm ${currentView === 'liveperson' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentView('liveperson')}
                      title="LivePerson"
                    >
                      <Link size={14} />
                      <span className="nav-label">LivePerson</span>
                    </button>
                    <button
                      className={`btn btn-sm ${currentView === 'explore' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentView('explore')}
                      title="Explore"
                    >
                      <Compass size={14} />
                      <span className="nav-label">Explore</span>
                    </button>
                    <button
                      className={`btn btn-sm ${currentView === 'export' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentView('export')}
                      title="Export"
                    >
                      <Download size={14} />
                      <span className="nav-label">Export</span>
                    </button>
                    <button
                      className={`btn btn-sm ${currentView === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCurrentView('settings')}
                      title="Settings"
                    >
                      <SettingsIcon size={14} />
                      <span className="nav-label">Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main style={{ flex: 1 }}>
            {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
            {currentView === 'import' && <ImportView />}
            {currentView === 'conversations' && <ConversationsView />}
            {currentView === 'analysis' && <CombinedAnalysisView />}
            {currentView === 'ai-analysis' && <AIAnalysisView />}
            {currentView === 'liveperson' && <LivePersonFetch onNavigate={setCurrentView} />}
            {currentView === 'explore' && <InteractiveExplorer />}
            {currentView === 'export' && <ExportView />}
            {currentView === 'settings' && <SettingsView />}
          </main>

          {/* Footer */}
          <footer style={{
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-color)',
            padding: '2rem 0',
            marginTop: '4rem'
          }}>
            <div className="container text-center">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Transcript Analyzer - AI-Powered Conversation Insights
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Built with Node.js, React, and Natural Language Processing
              </p>
            </div>
          </footer>
        </div>
      </AnalysisProvider>
    </AccountProvider>
  );
}

export default App;
