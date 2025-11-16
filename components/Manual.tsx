import React from 'react';
import { t, Language } from '../localization/i18n';

interface ManualProps {
  onClose: () => void;
  language: Language;
}

const Manual: React.FC<ManualProps> = ({ onClose, language }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-title"
    >
      <div
        className="bg-[#181629] border border-fuchsia-500/30 rounded-lg shadow-2xl shadow-fuchsia-500/10 w-full max-w-3xl max-h-[90vh] flex flex-col text-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-fuchsia-500/20 flex-shrink-0">
          <h2 id="manual-title" className="text-lg font-bold text-fuchsia-300">
            {t('manual.title', language)}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl font-light leading-none"
            aria-label={t('manual.close', language)}
          >
            &times;
          </button>
        </header>
        <main className="p-6 overflow-y-auto space-y-6 text-sm">
          <section>
            <h3 className="text-md font-semibold text-cyan-300 mb-2">{t('manual.sections.s1_title', language)}</h3>
            <p className="mb-2">
              {t('manual.sections.s1_p1', language)}
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 text-slate-400">
              <li><strong>{t('controlPanel.sections.camera', language)}:</strong> {t('manual.sections.s1_l1', language)}</li>
              <li><strong>{t('controlPanel.sections.subject', language)}:</strong> {t('manual.sections.s1_l2', language)}</li>
              <li><strong>{t('controlPanel.sections.outfit', language)}:</strong> {t('manual.sections.s1_l3', language)}</li>
              <li><strong>{t('controlPanel.sections.legwear', language)}:</strong> {t('manual.sections.s1_l4', language)}</li>
              <li><strong>{t('controlPanel.sections.environment', language)}:</strong> {t('manual.sections.s1_l5', language)}</li>
            </ul>
          </section>

          <section>
            <h3 className="text-md font-semibold text-cyan-300 mb-2">{t('manual.sections.s2_title', language)}</h3>
            <p className="mb-2">
              {t('manual.sections.s2_p1', language)}
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 text-slate-400">
              <li><strong>{t('controlPanel.buttons.analyze', language)}:</strong> {t('manual.sections.s2_l1', language)}</li>
              <li><strong>{t('controlPanel.buttons.edit', language)}:</strong> {t('manual.sections.s2_l2', language)}</li>
              <li><strong>{t('controlPanel.buttons.background', language)}:</strong> {t('manual.sections.s2_l3', language)}</li>
              <li><strong>{t('controlPanel.buttons.pose', language)}:</strong> {t('manual.sections.s2_l4', language)}</li>
              <li><strong>{t('controlPanel.buttons.scene', language)}:</strong> {t('manual.sections.s2_l5', language)}</li>
              <li><strong>{t('controlPanel.buttons.video', language)}:</strong> {t('manual.sections.s2_l6', language)}</li>
            </ul>
          </section>

          <section>
            <h3 className="text-md font-semibold text-cyan-300 mb-2">{t('manual.sections.s3_title', language)}</h3>
            <p className="mb-2">
              {t('manual.sections.s3_p1', language)}
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4 text-slate-400">
              <li><strong>{t('imagePreview.generateButton', language)}:</strong> {t('manual.sections.s3_l1', language)}</li>
              <li><strong>{t('controlPanel.sections.styleTransfer', language)}:</strong> {t('manual.sections.s3_l2', language)}</li>
              <li><strong>{t('imagePreview.proofShot', language)}:</strong> {t('manual.sections.s3_l3', language)}</li>
              <li><strong>{t('imagePreview.createVideoButton', language)}:</strong> {t('manual.sections.s3_l4', language)}</li>
              <li><strong>{t('promptDisplay.buttons.midjourney', language)} / {t('promptDisplay.buttons.comfy', language)}:</strong> {t('manual.sections.s3_l5', language)}</li>
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Manual;