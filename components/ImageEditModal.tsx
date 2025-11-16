import React from 'react';
import { t, Language } from '../localization/i18n';
import InlineImageEditor from './InlineImageEditor';

interface ImagePart {
    base64: string;
    mimeType: string;
    prompt?: string;
}

interface ImageEditModalProps {
  image: ImagePart;
  onApply: (sourceImage: ImagePart, maskImage: ImagePart, color: string) => Promise<void>;
  onClose: () => void;
  isProcessing: boolean;
  language: Language;
  addLog: (message: string) => void;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ image, onApply, onClose, isProcessing, language, addLog }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#181629] border border-fuchsia-500/30 rounded-lg shadow-2xl shadow-fuchsia-500/10 w-[95vw] h-[95vh] flex flex-col text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-fuchsia-500/20 flex-shrink-0">
          <h2 className="text-lg font-bold text-fuchsia-300">
            {t('imageEditModal.title', language)}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl font-light leading-none"
            aria-label={t('manual.close', language)}
          >
            &times;
          </button>
        </header>
        <main className="p-4 overflow-hidden flex-grow">
            <InlineImageEditor 
                image={image}
                onApply={onApply}
                onCancel={onClose}
                isProcessing={isProcessing}
                language={language}
                addLog={addLog}
            />
        </main>
      </div>
    </div>
  );
};

export default ImageEditModal;