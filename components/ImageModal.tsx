import React, { useEffect } from 'react';
import { t, Language } from '../localization/i18n';

interface ImagePart {
    base64: string;
    mimeType: string;
    prompt?: string;
}

interface ImageModalProps {
  image: ImagePart | null;
  onClose: () => void;
  language: Language;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, language }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!image) {
    return null;
  }

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:${image.mimeType};base64,${image.base64}`;
    const fileExtension = image.mimeType.split('/')[1] || 'png';
    link.download = `giracle-k-generated-image-${Date.now()}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#181629] border border-fuchsia-500/30 rounded-lg shadow-2xl shadow-fuchsia-500/10 w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-fuchsia-500/20 flex-shrink-0">
          <h2 className="text-lg font-bold text-fuchsia-300">
            {t('imageModal.title', language)}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl font-light leading-none"
            aria-label={t('manual.close', language)}
          >
            &times;
          </button>
        </header>
        <main className="p-4 overflow-auto flex-grow flex items-center justify-center min-h-0">
          <img
            src={`data:${image.mimeType};base64,${image.base64}`}
            alt={t('imageModal.altText', language)}
            className="max-w-full max-h-full object-contain"
          />
        </main>
        <footer className="p-4 border-t border-fuchsia-500/20 flex-shrink-0 flex justify-end">
          <button
            onClick={handleDownload}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2 px-5 rounded-md transition-all shadow-[0_0_15px_rgba(22,163,209,0.4)] hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] active:opacity-80"
          >
            {t('imageModal.downloadButton', language)}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ImageModal;