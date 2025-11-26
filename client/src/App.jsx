import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Upload from './components/Upload';
import AnalysisView from './components/AnalysisView';
import AIAnalysisView from './components/AIAnalysisView';
import ExportView from './components/ExportView';
import SettingsView from './components/SettingsView';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
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
        <div className="container">
          <div className="flex justify-between items-center" style={{ padding: '1rem 0' }}>
            <div className="flex items-center gap-md">
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                📊 Transcript Analyzer
              </div>
            </div>

            <div className="flex gap-sm">
              <button
                className={`btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentView('dashboard')}
              >
                📈 Dashboard
              </button>
              <button
                className={`btn ${currentView === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentView('upload')}
              >
                📁 Upload
              </button>
              <button
                className={`btn ${currentView === 'analysis' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentView('analysis')}
              >
                🔍 Analysis
              </button>
              <button
                className={`btn ${currentView === 'ai-analysis' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentView('ai-analysis')}
              >
                🤖 AI Analysis
              </button>
              <button
                className={`btn ${currentView === 'export' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentView('export')}
              >
                ⬇️ Export
              </button>
              <button
                className={`btn ${currentView === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentView('settings')}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'upload' && <Upload />}
        {currentView === 'analysis' && <AnalysisView />}
        {currentView === 'ai-analysis' && <AIAnalysisView />}
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
  );
}

export default App;
