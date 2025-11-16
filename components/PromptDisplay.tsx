import React from 'react';
import { t, Language } from '../localization/i18n';

interface PromptDisplayProps {
  promptParts: {main: string; placeholder: string; style: string; params: string;};
  statusBarText: string;
  logs: string[];
  clearPrompt: () => void;
  addLog: (message: string) => void;
  onRegenerate: () => void;
  language: Language;
  promptVerbosity: 'detailed' | 'concise';
  setPromptVerbosity: (v: 'detailed' | 'concise') => void;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ 
    promptParts, 
    statusBarText, 
    logs, 
    clearPrompt, 
    addLog, 
    onRegenerate, 
    language,
    promptVerbosity,
    setPromptVerbosity
}) => {
    const { main, placeholder, style, params } = promptParts;

    const primaryButtonClass = "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-md transition-all shadow-[0_0_15px_rgba(240,47,194,0.4)] hover:shadow-[0_0_20px_rgba(147,51,234,0.6)] active:opacity-80";
    const buttonClass = "bg-fuchsia-950/40 text-fuchsia-300 border border-fuchsia-500/40 py-2 px-4 rounded-md cursor-pointer transition-colors hover:bg-fuchsia-500/20 hover:border-fuchsia-400 hover:text-white active:bg-fuchsia-500/30";

    const handleCopy = (text: string, logMessage: string) => {
        if (!text.trim() || placeholder) {
            alert(t('promptDisplay.alert', language));
            return;
        }
        navigator.clipboard.writeText(text);
        addLog(logMessage);
    };

    const handleCopyForMidjourney = () => {
        const midjourneyPrompt = [[main, style].filter(Boolean).join(', '), params].filter(Boolean).join(' ');
        handleCopy(midjourneyPrompt, t('promptDisplay.copyMessages.midjourney', language));
    };

    const handleCopyForStandard = () => {
        const cleanedPrompt = [main, style].filter(Boolean).join('\n\n');
        handleCopy(cleanedPrompt, t('promptDisplay.copyMessages.standard', language));
    };

    const handleCopyForComfyUI = () => {
        const comfyPrompt = [main, style].filter(Boolean).join(', ');
        handleCopy(comfyPrompt, t('promptDisplay.copyMessages.comfy', language));
    };
    
    const promptElements: React.ReactNode[] = [];
    if (main) promptElements.push(<span key="main" className="text-cyan-300">{main}</span>);
    if (placeholder) promptElements.push(<span key="placeholder" className="text-yellow-400">{placeholder}</span>);
    if (style) promptElements.push(<span key="style">{style}</span>);
    if (params) promptElements.push(<span key="params">{params}</span>);

    const content = promptElements.length > 0 
        ? promptElements.reduce((prev, curr) => <>{prev}{'\n\n'}{curr}</>)
        : t('promptDisplay.placeholder', language);


    return (
        <section className="bg-black/20 backdrop-blur-sm border border-fuchsia-500/20 rounded-lg p-4 flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-300">{t('promptDisplay.title', language)}</h3>
                <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-md">
                    <button 
                        onClick={() => setPromptVerbosity('concise')}
                        className={`text-xs px-3 py-1 rounded-md transition-colors ${promptVerbosity === 'concise' ? 'bg-fuchsia-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                        {t('promptDisplay.verbosity.concise', language)}
                    </button>
                    <button 
                        onClick={() => setPromptVerbosity('detailed')}
                        className={`text-xs px-3 py-1 rounded-md transition-colors ${promptVerbosity === 'detailed' ? 'bg-fuchsia-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                        {t('promptDisplay.verbosity.detailed', language)}
                    </button>
                </div>
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
                <button onClick={handleCopyForMidjourney} className={primaryButtonClass}>{t('promptDisplay.buttons.midjourney', language)}</button>
                <button onClick={handleCopyForStandard} className={buttonClass}>{t('promptDisplay.buttons.standard', language)}</button>
                <button onClick={handleCopyForComfyUI} className={buttonClass}>{t('promptDisplay.buttons.comfy', language)}</button>
                <button onClick={onRegenerate} className={buttonClass}>{t('promptDisplay.buttons.regenerate', language)}</button>
                <button onClick={clearPrompt} className={buttonClass}>{t('promptDisplay.buttons.clear', language)}</button>
            </div>
            <pre className="whitespace-pre-wrap font-['Roboto_Mono',_monospace] text-sm bg-black/20 border border-fuchsia-900/50 rounded-md p-4 flex-grow overflow-auto text-slate-200 shadow-inner">
                {content}
            </pre>
            <div className="mt-2 text-xs text-slate-400 font-mono">{statusBarText}</div>
            <div className="mt-4 border-t border-dashed border-fuchsia-500/20 pt-3">
                <div className="text-xs font-bold text-slate-300">{t('promptDisplay.logsTitle', language)} <span className="text-slate-500 font-normal">{t('promptDisplay.logsSubtitle', language)}</span></div>
                <div className="max-h-36 overflow-auto bg-black/20 border border-dashed border-fuchsia-900/50 p-2 rounded-lg text-xs text-slate-400 mt-2 font-mono">
                    {logs.map((log, index) => (
                        <div key={index} className="whitespace-pre-wrap break-words">{log}</div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PromptDisplay;
