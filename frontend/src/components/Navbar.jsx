import React, { useState } from 'react';
import { Brain, Zap, Moon, Sun, Eye, Keyboard, CheckCircle2 } from 'lucide-react';

export function Navbar({ theme, setTheme, latencyStats, systemStatus }) {
  const [showKeyModal, setShowKeyModal] = useState(false);

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('high-contrast');
    else if (theme === 'high-contrast') setTheme('light');
    else setTheme('dark');
  };

  return (
    <header className="app-header" role="banner">
      <div className="brand">
        <div className="brand-icon" aria-hidden="true">
          <Brain size={22} />
        </div>
        <div>
          <h1 className="brand-title">TrainerAI</h1>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '-4px' }}>
            Context-Aware Training Assistant
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Latency Metric Badge */}
        <div className="badge badge-emerald" title="Sub-second low latency vector retrieval & inference pipeline">
          <Zap size={14} />
          <span>Latency: {latencyStats?.total_latency ? `${latencyStats.total_latency}ms` : '< 50ms'}</span>
        </div>

        {/* Knowledge Base Status */}
        <div className="badge badge-blue">
          <CheckCircle2 size={14} />
          <span>Indexed Chunks: {systemStatus?.indexed_chunks || 0}</span>
        </div>

        {/* Keyboard Shortcuts Trigger */}
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          onClick={() => setShowKeyModal(!showKeyModal)}
          aria-label="View Keyboard Shortcuts (Ctrl+K)"
          title="Keyboard Shortcuts"
        >
          <Keyboard size={16} />
          <span>Shortcuts</span>
        </button>

        {/* Accessibility Theme Switcher */}
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          onClick={toggleTheme}
          aria-label={`Toggle Theme. Current: ${theme}`}
          title="Toggle Dark / High Contrast / Light mode"
        >
          {theme === 'dark' && <Moon size={16} />}
          {theme === 'high-contrast' && <Eye size={16} />}
          {theme === 'light' && <Sun size={16} />}
          <span style={{ textTransform: 'capitalize' }}>{theme} Mode</span>
        </button>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowKeyModal(false)}
        >
          <div
            className="panel-card animate-fade-in"
            style={{ width: '400px', padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Keyboard size={20} className="text-blue" /> Accessible Keyboard Shortcuts
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <kbd style={{ background: 'var(--bg-card-hover)', padding: '2px 8px', borderRadius: '4px' }}>Ctrl + K</kbd>
                <span>Focus Question Search Input</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <kbd style={{ background: 'var(--bg-card-hover)', padding: '2px 8px', borderRadius: '4px' }}>Alt + 1</kbd>
                <span>Select Chat Panel</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <kbd style={{ background: 'var(--bg-card-hover)', padding: '2px 8px', borderRadius: '4px' }}>Alt + 2</kbd>
                <span>Select Document Recommendations</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <kbd style={{ background: 'var(--bg-card-hover)', padding: '2px 8px', borderRadius: '4px' }}>Alt + 3</kbd>
                <span>Select Smart Notes Panel</span>
              </li>
            </ul>
            <button
              className="btn btn-primary"
              style={{ marginTop: '20px', width: '100%' }}
              onClick={() => setShowKeyModal(false)}
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
