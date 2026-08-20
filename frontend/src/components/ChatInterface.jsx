import React, { useRef, useEffect } from 'react';
import { MessageSquare, Search, Sparkles, Tag, History, Clock } from 'lucide-react';

export function ChatInterface({ query, setQuery, onSearch, loading, nlpAnalysis, history, onSelectHistory }) {
  const inputRef = useRef(null);

  const sampleQuestions = [
    "What is feature engineering in ML?",
    "Explain Precision vs Recall in model evaluation",
    "How does ReLU activation function work?",
    "What are best practices for scaling ML systems?"
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <aside className="panel-card" aria-label="Question Input Panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <MessageSquare size={18} className="text-blue" />
          Random Question Understanding
        </h2>
        <span className="badge badge-purple">NLP Intent Engine</span>
      </div>

      <div className="panel-body">
        {/* Search Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label htmlFor="student-query" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Enter Student / Learner Question:
          </label>

          <div style={{ position: 'relative' }}>
            <input
              id="student-query"
              ref={inputRef}
              type="text"
              className="form-control"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What is feature engineering in ML? (Ctrl+K)"
              aria-label="Ask a random question"
              style={{
                width: '100%',
                padding: '12px 14px 12px 38px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-bright)',
                fontSize: '0.9rem'
              }}
            />
            <Search
              size={18}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !query.trim()}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <Sparkles size={16} className="animate-spin" /> Processing NLP Inference...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Understand & Retrieve Notes
              </>
            )}
          </button>
        </form>

        {/* NLP Intent & Domain Analysis Results */}
        {nlpAnalysis && (
          <div
            className="animate-fade-in"
            style={{
              background: 'var(--bg-primary)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DETECTED DOMAIN</span>
              <span className="badge badge-amber">{nlpAnalysis.domain}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>INTENT CLASSIFICATION</span>
              <span className="badge badge-blue">{nlpAnalysis.intent}</span>
            </div>

            {nlpAnalysis.keywords && nlpAnalysis.keywords.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  KEYWORD EXTRACTS:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {nlpAnalysis.keywords.map((kw, i) => (
                    <span key={i} style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', color: 'var(--text-main)' }}>
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Sample Questions Pills */}
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
            <Tag size={14} /> Quick Demo Queries:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sampleQuestions.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(sq);
                  onSearch(sq);
                }}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  fontSize: '0.8rem',
                  padding: '8px 10px',
                  fontWeight: 400
                }}
              >
                💡 {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Search History */}
        {history.length > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <History size={14} /> Recent Questions ({history.length}):
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  onClick={() => onSelectHistory(h)}
                  style={{
                    padding: '6px 10px',
                    background: 'var(--bg-primary)',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--text-main)'
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                    {h.query}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Clock size={10} /> {h.latency_ms?.vector_retrieval || 5}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
