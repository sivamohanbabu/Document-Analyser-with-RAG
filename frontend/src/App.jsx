import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatInterface } from './components/ChatInterface';
import { DocViewer } from './components/DocViewer';
import { SmartNotesPanel } from './components/SmartNotesPanel';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [nlpAnalysis, setNlpAnalysis] = useState(null);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [referencedDocs, setReferencedDocs] = useState([]);
  const [latencyStats, setLatencyStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [documentsList, setDocumentsList] = useState([]);

  // Apply theme dataset attribute to root document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch initial system status & indexed documents
  const fetchHealthAndDocs = async () => {
    try {
      const [hRes, dRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/documents')
      ]);
      if (hRes.ok) {
        const hData = await hRes.json();
        setSystemStatus(hData);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDocumentsList(dData.documents || []);
      }
    } catch (err) {
      console.warn('Backend server connecting...', err);
    }
  };

  useEffect(() => {
    fetchHealthAndDocs();
  }, []);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, top_k: 3 })
      });

      if (res.ok) {
        const data = await res.json();
        setNlpAnalysis(data.nlp_analysis);
        setAiAnswer(data.ai_answer);
        setReferencedDocs(data.ai_answer?.referenced_docs || []);
        setLatencyStats(data.latency_ms);

        // Update search history
        setHistory(prev => [data, ...prev.filter(item => item.query !== searchQuery)].slice(0, 8));
      }
    } catch (err) {
      console.error('Error submitting query:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = (item) => {
    setQuery(item.query);
    setNlpAnalysis(item.nlp_analysis);
    setAiAnswer(item.ai_answer);
    setReferencedDocs(item.ai_answer?.referenced_docs || []);
    setLatencyStats(item.latency_ms);
  };

  return (
    <div className="app-container">
      <Navbar
        theme={theme}
        setTheme={setTheme}
        latencyStats={latencyStats}
        systemStatus={systemStatus}
      />

      <div className="dashboard-grid" role="main">
        {/* Panel 1: Random Question Understanding */}
        <ChatInterface
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          loading={loading}
          nlpAnalysis={nlpAnalysis}
          history={history}
          onSelectHistory={handleSelectHistoryItem}
        />

        {/* Panel 2: Context-Aware Document Recommendation */}
        <DocViewer
          referencedDocs={referencedDocs}
          documentsList={documentsList}
          onUploadSuccess={fetchHealthAndDocs}
          vectorLatency={latencyStats?.vector_retrieval}
        />

        {/* Panel 3: Smart Notes Generator */}
        <SmartNotesPanel
          aiAnswer={aiAnswer}
          query={query}
        />
      </div>
    </div>
  );
}
