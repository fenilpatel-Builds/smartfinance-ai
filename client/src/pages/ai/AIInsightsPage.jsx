import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  MessageSquare,
  Bot,
  User,
  ShieldAlert,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';

const QUICK_QUESTIONS = [
  'Where am I spending the most money?',
  'What were my highest expenses this month?',
  'Compare my income and expenses.',
  'What are my recurring payments and top merchants?',
  'Explain my monthly financial performance.',
];

export const AIInsightsPage = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialAnalysis, setInitialAnalysis] = useState(null);

  const fetchInitialAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.post('/ai/analyze-spending');
      setInitialAnalysis(res.data);
      setMessages([
        {
          sender: 'ai',
          text: res.data.analysis,
          provider: res.data.provider,
        },
      ]);
    } catch (err) {
      console.error('Failed to load initial analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialAnalysis();
  }, []);

  const handleSendMessage = async (customQuery) => {
    const promptText = customQuery || query;
    if (!promptText.trim()) return;

    const userMsg = { sender: 'user', text: promptText };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/assistant', { question: promptText });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.data.answer,
          provider: res.data.provider,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Encountered an issue processing query. Please check server logs.',
          provider: 'error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            AI Financial Insights & Assistant
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Ask questions, analyze trends, identify recurring counterparties, and receive spending optimization suggestions
        </p>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400">Quick Prompts:</span>
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-brand-500 hover:bg-brand-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 transition-all cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 min-h-[460px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'ai' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`rounded-2xl p-4 max-w-2xl ${
                  m.sender === 'user'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                {m.sender === 'ai' && (
                  <div className="flex items-center gap-2 mb-2 border-b border-slate-200/50 dark:border-slate-700/50 pb-1.5 text-[10px] text-slate-400 font-semibold uppercase">
                    <span>Engine: {m.provider || 'AI Assistant'}</span>
                    <span>•</span>
                    <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Deterministic Verification Active
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-line prose prose-xs dark:prose-invert">
                  {m.text}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-600" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-600 delay-100" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-600 delay-200" />
              <span className="ml-1">Analyzing workspace finances...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your bank statements, spending patterns, or merchants..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-500 disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-2 text-[10px] text-slate-400 text-center">
            AI suggestions are non-binding. All balances and ledger figures are calculated deterministically by the financial engine.
          </p>
        </div>
      </div>
    </div>
  );
};

