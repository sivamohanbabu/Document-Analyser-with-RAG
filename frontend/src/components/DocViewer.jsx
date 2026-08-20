import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, Search, Layers, ShieldAlert } from 'lucide-react';

export function DocViewer({ referencedDocs, documentsList, onUploadSuccess, vectorLatency }) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedDocTab, setSelectedDocTab] = useState('recommendations'); // 'recommendations' | 'library' | 'upload'

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus({ type: 'success', message: data.message });
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setUploadStatus({ type: 'error', message: data.detail || 'Upload failed.' });
      }
    } catch (err) {
      setUploadStatus({ type: 'error', message: 'Failed to upload document.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="panel-card" aria-label="Document Retrieval and Reference Center">
      <div className="panel-header">
        <h2 className="panel-title">
          <FileText size={18} className="text-cyan" />
          Context-Aware Document Retrieval
        </h2>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn ${selectedDocTab === 'recommendations' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            onClick={() => setSelectedDocTab('recommendations')}
          >
            Matches ({referencedDocs?.length || 0})
          </button>
          <button
            className={`btn ${selectedDocTab === 'library' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            onClick={() => setSelectedDocTab('library')}
          >
            Library ({documentsList?.length || 0})
          </button>
          <button
            className={`btn ${selectedDocTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            onClick={() => setSelectedDocTab('upload')}
          >
            + Upload Doc
          </button>
        </div>
      </div>

      <div className="panel-body">
        {/* Tab 1: Recommended Document Snippets */}
        {selectedDocTab === 'recommendations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                TOP SEMANTIC VECTOR MATCHES (FAISS)
              </span>
              <span className="badge badge-emerald">FAISS Search: {vectorLatency || 3.2}ms</span>
            </div>

            {!referencedDocs || referencedDocs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Search size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p style={{ fontSize: '0.9rem' }}>Ask a question to retrieve relevant training document sections.</p>
              </div>
            ) : (
              referencedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="animate-fade-in"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                      📄 {doc.doc_name}
                    </span>
                    <span className="badge badge-blue">{doc.score > 0 ? `${doc.score}% Match` : 'Relevant Context'}</span>
                  </div>

                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 500 }}>
                    Section: {doc.title}
                  </span>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '10px', borderRadius: '6px', lineHeight: 1.6, borderLeft: '3px solid var(--accent-cyan)' }}>
                    "{doc.snippet}"
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Document Library */}
        {selectedDocTab === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              INDEXED KNOWLEDGE BASE DOCUMENTS ({documentsList.length})
            </span>

            {documentsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No documents uploaded yet.</p>
            ) : (
              documentsList.map((doc, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} className="text-blue" />
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{doc.name}</h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {doc.chunk_count} FAISS Chunks Indexed
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-emerald">Active Index</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Upload Document Panel */}
        {selectedDocTab === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Upload PDF or Training TXT Documents</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Uploaded documents will be automatically chunked, embedded using sentence-transformers, and added to the local FAISS index for real-time query retrieval.
            </p>

            <label
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '10px',
                padding: '30px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-primary)',
                transition: 'all 0.2s ease'
              }}
            >
              <Upload size={32} style={{ color: 'var(--accent-blue)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Click to Browse or Drag & Drop File</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports PDF, TXT, MD files</span>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>

            {uploading && (
              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent-blue)' }}>
                Chunking and embedding document into FAISS vector database...
              </div>
            )}

            {uploadStatus && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  background: uploadStatus.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: uploadStatus.type === 'success' ? 'var(--accent-emerald)' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {uploadStatus.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                {uploadStatus.message}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
