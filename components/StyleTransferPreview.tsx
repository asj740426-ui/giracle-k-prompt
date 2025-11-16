import React, { useMemo, useState } from 'react';
import { t, Language } from '../localization/i18n';
import { STYLE_PROMPT_MAP } from '../constants';

interface ImagePart {
    base64: string;
    mimeType: string;
    prompt?: string;
}

interface StyleTransferPreviewProps {
  result: { original: ImagePart; styled: ImagePart; styleKey: string; } | null;
  isStyling: boolean;
  onAccept: (image: ImagePart, combinedPrompt: string, styleKey: string) => void;
  onClear: () => void;
  language: Language;
  addLog: (message: string) => void;
  onImageClick: (image: ImagePart) => void;
  onEditColor: (image: ImagePart) => void;
  isAnyItemBeingEdited: boolean;
  isProcessing: boolean;
  realifiedPrompt: string | null;
  isAnalyzingRealifiedPrompt: boolean;
  onAnalyzeRealifiedImage: (image: ImagePart) => void;
  analyzedPromptVerbosity: 'detailed' | 'concise';
  setAnalyzedPromptVerbosity: (v: 'detailed' | 'concise') => void;
  onProofShot: (image: ImagePart, texts: { overlayText: string, paperText: string }) => Promise<void>;
  defaultProofShotText: string;
}

const StyleTransferPreview: React.FC<StyleTransferPreviewProps> = ({
  result,
  isStyling,
  onAccept,
  onClear,
  language,
  addLog,
  onImageClick,
  onEditColor,
  isAnyItemBeingEdited,
  isProcessing,
  realifiedPrompt,
  isAnalyzingRealifiedPrompt,
  onAnalyzeRealifiedImage,
  analyzedPromptVerbosity,
  setAnalyzedPromptVerbosity,
  onProofShot,
  defaultProofShotText,
}) => {
  const [proofingImage, setProofingImage] = useState<ImagePart | null>(null);
  const [proofShotTexts, setProofShotTexts] = useState({ overlayText: '', paperText: '' });

  const displayPrompt = useMemo(() => {
    if (!result) {
      return '';
    }

    const originalPrompt = result.original.prompt || '';

    // The prompt for the latest action. We want the short version for combining.
    let actionPromptFragment = '';
    
    if (result.styleKey.startsWith('custom:')) {
        actionPromptFragment = result.styleKey.substring('custom:'.length);
    } else if (result.styleKey.startsWith('color:') || result.styleKey === 'copyright_cert') {
        // For edits like color change or adding a watermark, the core creative prompt doesn't change.
        // We should just show the original prompt.
        return originalPrompt;
    } else {
        // Use the short, composable prompt from STYLE_PROMPT_MAP for standard styles.
        actionPromptFragment = STYLE_PROMPT_MAP[result.styleKey] || '';
    }

    // 'realify' isn't in STYLE_PROMPT_MAP, so we handle it specially.
    if (result.styleKey === 'realify') {
        // The goal is to make the original prompt photorealistic.
        // We can append some keywords. The original prompt might have non-photo keywords we want to override.
        // For simplicity, let's just append.
        actionPromptFragment = 'photorealistic photograph, realistic textures, cinematic lighting, 8k';
    }

    return [originalPrompt, actionPromptFragment].filter(Boolean).join(', ');
  }, [result]);
  
  const isColorChange = result?.styleKey.startsWith('color:');

  const handleCopyAnalyzedPrompt = () => {
    if (realifiedPrompt) {
        navigator.clipboard.writeText(realifiedPrompt);
        addLog('Analyzed prompt copied to clipboard.');
    }
  };
  
  const handleStartProofShot = (image: ImagePart) => {
    setProofingImage(image);
    setProofShotTexts({ overlayText: defaultProofShotText, paperText: '' });
  };

  const handleConfirmProofShot = () => {
    if (proofingImage && (proofShotTexts.overlayText || proofShotTexts.paperText)) {
      onProofShot(proofingImage, proofShotTexts);
    }
    setProofingImage(null);
    setProofShotTexts({ overlayText: '', paperText: '' });
  };

  const handleCancelProofShot = () => {
    setProofingImage(null);
    setProofShotTexts({ overlayText: '', paperText: '' });
  };

  return (
    <section className="bg-black/20 backdrop-blur-sm border border-fuchsia-500/20 rounded-lg p-4 flex flex-col">
      <h3 className="text-sm font-bold text-slate-300 mb-3">{t('styleTransferPreview.title', language)}</h3>
      <div className="flex-grow bg-black/20 border border-fuchsia-900/50 rounded-md p-2 flex items-center justify-center min-h-[250px]">
        {isStyling ? (
          <div className="text-center text-slate-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="mt-4">{t('styleTransferPreview.stylingMessage', language)}</p>
          </div>
        ) : result ? (
          <div className="w-full h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-center mb-1 text-slate-400">{t('styleTransferPreview.original', language)}</h4>
                  <div onClick={() => !isAnyItemBeingEdited && onImageClick(result.original)} className={`group relative rounded-lg overflow-hidden border-2 border-transparent transition-all ${!isAnyItemBeingEdited ? 'hover:border-fuchsia-500 cursor-pointer' : 'opacity-50'}`}>
                      <img
                          src={`data:${result.original.mimeType};base64,${result.original.base64}`}
                          alt={t('styleTransferPreview.original', language)}
                          className="w-full h-auto object-contain rounded-md"
                      />
                  </div>
                  <button 
                      onClick={() => onEditColor(result.original)}
                      disabled={isStyling || isAnyItemBeingEdited}
                      className="text-xs w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                  >
                      {t('imagePreview.colorEdit', language)}
                  </button>
              </div>
              <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-center mb-1 text-cyan-300">{t('styleTransferPreview.styled', language)}</h4>
                  <div onClick={() => !isAnyItemBeingEdited && onImageClick(result.styled)} className={`group relative rounded-lg overflow-hidden border-2 border-cyan-500/50 transition-all ${!isAnyItemBeingEdited ? 'hover:border-fuchsia-500 cursor-pointer' : 'opacity-50'}`}>
                      <img
                          src={`data:${result.styled.mimeType};base64,${result.styled.base64}`}
                          alt={t('styleTransferPreview.styled', language)}
                          className="w-full h-auto object-contain rounded-md"
                      />
                  </div>
                    {proofingImage && proofingImage.base64 === result.styled.base64 ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={proofShotTexts.overlayText}
                          onChange={(e) => setProofShotTexts(prev => ({...prev, overlayText: e.target.value}))}
                          placeholder={t('imagePreview.overlayTextPlaceholder', language)}
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
                        />
                        <input
                          type="text"
                          value={proofShotTexts.paperText}
                          onChange={(e) => setProofShotTexts(prev => ({...prev, paperText: e.target.value}))}
                          placeholder={t('imagePreview.paperTextPlaceholder', language)}
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleConfirmProofShot}
                            disabled={isProcessing}
                            className="text-xs flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:bg-slate-500"
                          >
                            {t('imagePreview.confirmProofShot', language)}
                          </button>
                          <button
                            onClick={handleCancelProofShot}
                            className="text-xs flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-3 rounded-md transition-colors"
                          >
                            {t('imagePreview.cancelProofShot', language)}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                            onClick={() => onEditColor(result.styled)}
                            disabled={isStyling || isAnyItemBeingEdited || !!proofingImage}
                            className="text-xs flex-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                        >
                            {t('imagePreview.colorEdit', language)}
                        </button>
                        <button 
                            onClick={() => handleStartProofShot(result.styled)}
                            disabled={isStyling || isAnyItemBeingEdited || !!proofingImage}
                            className="text-xs flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                        >
                            {t('imagePreview.proofShot', language)}
                        </button>
                      </div>
                    )}
              </div>
            </div>
            
            {displayPrompt && !isAnyItemBeingEdited && !isColorChange && (
                <div className="bg-slate-900/50 p-2 rounded-md mt-4">
                    <h5 className="text-xs font-semibold text-slate-400 mb-1">{t('styleTransferPreview.combinedPromptTitle', language)}</h5>
                    <p className="text-xs text-slate-300 font-mono break-all max-h-20 overflow-y-auto pr-2">
                        {displayPrompt}
                    </p>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(displayPrompt);
                            addLog(t('imagePreview.promptCopied', language));
                        }}
                        className="text-xs text-cyan-300 hover:underline mt-1 font-semibold"
                    >
                        {t('imagePreview.copyPrompt', language)}
                    </button>
                </div>
            )}

            <div className="flex gap-2 mt-4">
                <button
                    onClick={() => onAccept(result.styled, displayPrompt, result.styleKey)}
                    disabled={isAnyItemBeingEdited}
                    className="flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold py-2 px-4 rounded-md transition-all shadow-[0_0_10px_rgba(240,47,194,0.4)] hover:shadow-[0_0_15px_rgba(147,51,234,0.6)] disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none"
                >
                    {t('styleTransferPreview.acceptButton', language)}
                </button>
                <button
                    onClick={onClear}
                    disabled={isAnyItemBeingEdited}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                    {t('styleTransferPreview.clearButton', language)}
                </button>
            </div>

            {result.styleKey === 'realify' && !isAnyItemBeingEdited && (
                <div className="mt-4 pt-4 border-t border-fuchsia-500/20">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-fuchsia-400 uppercase">{t('styleTransferPreview.analyzedPromptTitle', language)}</h4>
                        <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-md">
                            <button 
                                onClick={() => setAnalyzedPromptVerbosity('concise')}
                                className={`text-xs px-3 py-1 rounded-md transition-colors ${analyzedPromptVerbosity === 'concise' ? 'bg-fuchsia-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                            >
                                {t('promptDisplay.verbosity.concise', language)}
                            </button>
                            <button 
                                onClick={() => setAnalyzedPromptVerbosity('detailed')}
                                className={`text-xs px-3 py-1 rounded-md transition-colors ${analyzedPromptVerbosity === 'detailed' ? 'bg-fuchsia-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                            >
                                {t('promptDisplay.verbosity.detailed', language)}
                            </button>
                        </div>
                    </div>
                    {isAnalyzingRealifiedPrompt ? (
                         <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-fuchsia-400"></div>
                            <span>{t('styleTransferPreview.analyzingPrompt', language)}</span>
                        </div>
                    ) : realifiedPrompt ? (
                        <div className="flex gap-2">
                             <textarea 
                                readOnly 
                                value={realifiedPrompt}
                                rows={4}
                                className="flex-grow w-full bg-slate-800/50 border border-slate-700 rounded-md px-3 py-2 text-xs font-mono focus:ring-fuchsia-500 focus:border-fuchsia-500"
                             />
                            <button 
                                onClick={handleCopyAnalyzedPrompt}
                                className="text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-3 rounded-md transition-colors"
                            >
                                {t('styleTransferPreview.copyAnalyzedPrompt', language)}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => onAnalyzeRealifiedImage(result.styled)}
                            disabled={isAnalyzingRealifiedPrompt || isAnyItemBeingEdited}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-all shadow-[0_0_10px_rgba(22,163,209,0.4)] hover:shadow-[0_0_15px_rgba(37,99,235,0.6)] disabled:from-slate-600 disabled:to-slate-700 disabled:shadow-none"
                        >
                            {t('styleTransferPreview.analyzeAndCopyPrompt', language)}
                        </button>
                    )}
                </div>
            )}

          </div>
        ) : (
          <p className="text-slate-500">{t('styleTransferPreview.placeholder', language)}</p>
        )}
      </div>
    </section>
  );
};

export default StyleTransferPreview;
