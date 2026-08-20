import React, { useState } from 'react';
import { BookOpen, Copy, Download, HelpCircle, Check, Star, Sparkles, FileSpreadsheet } from 'lucide-react';

export function SmartNotesPanel({ aiAnswer, query }) {
  const [copied, setCopied] = useState(false);

  if (!aiAnswer) {
    return (
      <aside className="panel-card" aria-label="Smart Notes Output Section">
        <div className="panel-header">
          <h2 className="panel-title">
            <BookOpen size={18} className="text-purple" />
            Smart Notes Generator
          </h2>
          <span className="badge badge-amber">Auto Summarizer</span>
        </div>

        <div className="panel-body" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sparkles size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontSize: '0.9rem' }}>Smart notes will auto-generate here when you submit a question.</p>
        </div>
      </aside>
    );
  }

  const handleCopy = () => {
    const formattedNotes = `
# TrainerAI Smart Notes: ${query}

## 📌 Key Definition
${aiAnswer.key_definition}

## 📌 Simple Explanation
${aiAnswer.simple_explanation}

## 📌 Important Key Points
${aiAnswer.important_points.map(p => `- ${p}`).join('\n')}

## 📌 Real-World Example
${aiAnswer.real_world_example}

## 📌 Interview & Exam Questions
${aiAnswer.interview_questions.map((iq, i) => `Q${i+1}: ${iq.question}\nA: ${iq.answer}`).join('\n\n')}
    `.trim();

    navigator.clipboard.writeText(formattedNotes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const formattedNotes = `
# TrainerAI Smart Notes: ${query}

## 📌 Key Definition
${aiAnswer.key_definition}

## 📌 Simple Explanation
${aiAnswer.simple_explanation}

## 📌 Important Key Points
${aiAnswer.important_points.map(p => `- ${p}`).join('\n')}

## 📌 Real-World Example
${aiAnswer.real_world_example}

## 📌 Interview & Exam Questions
${aiAnswer.interview_questions.map((iq, i) => `Q${i+1}: ${iq.question}\nA: ${iq.answer}`).join('\n\n')}
    `.trim();

    const blob = new Blob([formattedNotes], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trainer_notes_${query.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    a.click();
  };

  return (
    <aside className="panel-card" aria-label="Smart Notes Output Section">
      <div className="panel-header">
        <h2 className="panel-title">
          <BookOpen size={18} className="text-purple" />
          Smart Notes Generator
        </h2>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            onClick={handleCopy}
            title="Copy structured notes to clipboard"
          >
            {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            onClick={handleDownloadMarkdown}
            title="Download Notes as Markdown file"
          >
            <Download size={14} />
            Export .MD
          </button>
        </div>
      </div>

      <div className="panel-body">
        {/* Simple Explanation */}
        <div className="animate-fade-in">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', letterSpacing: '0.05em' }}>
            💬 SIMPLE EXPLANATION
          </span>
          <p style={{ fontSize: '0.88rem', marginTop: '4px', lineHeight: 1.6, color: 'var(--text-main)' }}>
            {aiAnswer.simple_explanation}
          </p>
        </div>

        {/* Key Definition Box */}
        {aiAnswer.key_definition && (
          <div
            className="animate-fade-in"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              borderLeft: '4px solid var(--accent-blue)',
              padding: '12px',
              borderRadius: '6px'
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={14} /> KEY DEFINITION (CLASSROOM SLIDE READY)
            </span>
            <p style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: '4px', color: 'var(--text-bright)' }}>
              {aiAnswer.key_definition}
            </p>
          </div>
        )}

        {/* Important Key Points */}
        {aiAnswer.important_points && aiAnswer.important_points.length > 0 && (
          <div className="animate-fade-in">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald)', letterSpacing: '0.05em' }}>
              📌 IMPORTANT TRAINER HIGHLIGHTS
            </span>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {aiAnswer.important_points.map((pt, i) => (
                <li key={i} style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--accent-emerald)', marginTop: '2px' }}>✓</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Real-World Industry Example */}
        {aiAnswer.real_world_example && (
          <div
            className="animate-fade-in"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              padding: '12px',
              borderRadius: '8px'
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)', display: 'block', marginBottom: '4px' }}>
              🏬 REAL-WORLD INDUSTRY EXAMPLE
            </span>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              {aiAnswer.real_world_example}
            </p>
          </div>
        )}

        {/* Exam & Interview Questions */}
        {aiAnswer.interview_questions && aiAnswer.interview_questions.length > 0 && (
          <div className="animate-fade-in">
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <HelpCircle size={14} /> INTERVIEW & EXAM FAQs
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {aiAnswer.interview_questions.map((iq, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '10px'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--accent-purple)' }}>
                    Q{i + 1}: {iq.question}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    A: {iq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
