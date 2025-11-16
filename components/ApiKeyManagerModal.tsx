import React, { useState, useEffect } from 'react';
import { t, Language } from '../localization/i18n';
import { GoogleGenAI } from '@google/genai';
import { saveApiKeys, loadApiKeys } from '../services';

interface ApiKeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysReady: () => void;
  initialMode: 'setup' | 'unlock';
  language: Language;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const ApiKeyManagerModal: React.FC<ApiKeyManagerModalProps> = ({ isOpen, onClose, onKeysReady, initialMode, language }) => {
  const [mode, setMode] = useState(initialMode);
  const [geminiKey, setGeminiKey] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [geminiTestResult, setGeminiTestResult] = useState<{ status: TestStatus, message: string }>({ status: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setPassword('');
      setGeminiKey('');
      setGeminiTestResult({ status: 'idle', message: '' });
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleTestGemini = async () => {
    if (!geminiKey) {
        setGeminiTestResult({ status: 'error', message: 'Please enter a key.' });
        return;
    }
    setGeminiTestResult({ status: 'testing', message: 'Testing...' });
    try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{parts: [{text: 'test'}]}],
        });
        setGeminiTestResult({ status: 'success', message: 'Connection successful!' });
    } catch (e) {
        const err = e as Error;
        setGeminiTestResult({ status: 'error', message: err.message.length > 100 ? 'Invalid API Key.' : err.message });
    }
  };

  const handleSave = async () => {
    if (!geminiKey || !password) {
        setError("Please fill in all fields.");
        return;
    }
    setError(null);
    try {
        await saveApiKeys({ geminiKey }, password);
        onKeysReady();
    } catch (e) {
        setError((e as Error).message);
    }
  };

  const handleUnlock = async () => {
    if (!password) {
        setError("Please enter your password.");
        return;
    }
    setError(null);
    try {
        await loadApiKeys(password);
        onKeysReady();
    } catch (e) {
        setError("Failed to decrypt keys. Please check your password.");
    }
  };

  const renderTestStatus = (result: { status: TestStatus, message: string }) => {
    if (result.status === 'idle') return null;
    const color = result.status === 'success' ? 'text-green-400' : result.status === 'error' ? 'text-red-400' : 'text-slate-400';
    return <p className={`text-xs mt-1 ${color}`}>{result.message}</p>;
  };
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#181629] border border-fuchsia-500/30 rounded-lg shadow-2xl shadow-fuchsia-500/10 w-full max-w-lg flex flex-col text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-fuchsia-500/20">
          <h2 className="text-lg font-bold text-fuchsia-300">
            {mode === 'unlock' ? 'Unlock API Keys' : 'API Key Management'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl font-light leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </header>
        
        <main className="p-6 space-y-6">
          {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm rounded-md p-3">{error}</div>}

          {mode === 'setup' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Google Gemini API Key</label>
                <div className="flex gap-2">
                  <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className="flex-grow w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
                  <button onClick={handleTestGemini} disabled={geminiTestResult.status === 'testing'} className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-slate-500">Test</button>
                </div>
                {renderTestStatus(geminiTestResult)}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">Password for Encryption</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a password" className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500" />
            <p className="text-xs text-slate-500">This password encrypts your keys in your browser's local storage. It is never sent to any server. You will need it to unlock your keys on your next visit.</p>
          </div>
        </main>
        
        <footer className="p-4 border-t border-fuchsia-500/20 flex justify-end gap-3">
            <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors">
                Cancel
            </button>
            {mode === 'unlock' ? (
                <button onClick={handleUnlock} className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-md">
                    Unlock
                </button>
            ) : (
                <button onClick={handleSave} className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-md">
                    Save & Close
                </button>
            )}
        </footer>
      </div>
    </div>
  );
};

export default ApiKeyManagerModal;
