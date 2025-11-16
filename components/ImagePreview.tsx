import React, { useState } from 'react';
import { t, Language } from '../localization/i18n';
import InlineImageEditor from './InlineImageEditor';

interface ImagePart {
    base64: string;
    mimeType: string;
    prompt?: string;
}

interface ImagePreviewProps {
  generatedImages: ImagePart[];
  isGenerating: boolean;
  onProofShot: (image: ImagePart, texts: { overlayText: string, paperText: string }) => Promise<void>;
  onCreateVideo: (image: ImagePart) => Promise<void>;
  onEditColor: (image: ImagePart) => void;
  isAnyItemBeingEdited: boolean;
  isProcessing: boolean;
  isGeneratingVideo: boolean;
  language: Language;
  addLog: (message: string) => void;
  defaultProofShotText: string;
  onImageClick: (image: ImagePart) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  generatedImages,
  isGenerating,
  onProofShot,
  onCreateVideo,
  onEditColor,
  isAnyItemBeingEdited,
  isProcessing,
  isGeneratingVideo,
  language,
  addLog,
  defaultProofShotText,
  onImageClick,
}) => {
  const hasImages = generatedImages.length > 0;
  const [proofingImage, setProofingImage] = useState<ImagePart | null>(null);
  const [proofShotTexts, setProofShotTexts] = useState({ overlayText: '', paperText: '' });

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
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-300">{t('imagePreview.title', language)}</h3>
      </div>

      <div className="flex-grow bg-black/20 border border-fuchsia-900/50 rounded-md p-2 flex items-center justify-center min-h-[300px]">
        {isGenerating && !isAnyItemBeingEdited ? (
          <div className="text-center text-slate-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-400 mx-auto"></div>
            <p className="mt-4">{t('imagePreview.generatingMessage', language)}</p>
          </div>
        ) : hasImages ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full overflow-y-auto">
            {generatedImages.map((image, index) => {
                return (
                  <div key={index} className="flex flex-col gap-2">
                    <div
                      onClick={() => !isAnyItemBeingEdited && onImageClick(image)}
                      className={`group relative rounded-lg overflow-hidden border-2 border-transparent  transition-all ${!isAnyItemBeingEdited ? 'hover:border-fuchsia-500 cursor-pointer' : 'opacity-50'}`}
                    >
                        <img
                            src={`data:${image.mimeType};base64,${image.base64}`}
                            alt={`Generated content ${index + 1}`}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    
                    {proofingImage && proofingImage.base64 === image.base64 ? (
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
                            disabled={isGenerating}
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
                              onClick={() => onEditColor(image)}
                              disabled={isGenerating || !!proofingImage || isGeneratingVideo || isAnyItemBeingEdited}
                              className="text-xs flex-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                          >
                              {t('imagePreview.colorEdit', language)}
                          </button>
                          <button 
                              onClick={() => handleStartProofShot(image)}
                              disabled={isGenerating || !!proofingImage || isGeneratingVideo || isAnyItemBeingEdited}
                              className="text-xs flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                          >
                              {t('imagePreview.proofShot', language)}
                          </button>
                          <button 
                              onClick={() => onCreateVideo(image)}
                              disabled={isGeneratingVideo || !!proofingImage || isGenerating || isAnyItemBeingEdited}
                              className="text-xs flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                          >
                              {isGeneratingVideo ? t('imagePreview.creatingVideoButton', language) : t('imagePreview.createVideoButton', language)}
                          </button>
                      </div>
                    )}
                  </div>
                )
            })}
          </div>
        ) : (
          <p className="text-slate-500">{t('imagePreview.placeholder', language)}</p>
        )}
      </div>
    </section>
  );
};

export default ImagePreview;
