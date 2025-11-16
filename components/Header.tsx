import React from 'react';
import { t, Language } from '../localization/i18n';

interface HeaderProps {
    presetCount: number;
    legwearCount: number;
    shoeCount: number;
    onShowManual: () => void;
    language: Language;
    toggleLanguage: () => void;
}

const Header: React.FC<HeaderProps> = ({ presetCount, legwearCount, shoeCount, onShowManual, language, toggleLanguage }) => {
    const handleBookmark = () => {
        alert(t('header.bookmarkAlert', language));
    };

    return (
        <header className="px-4 py-3 border-b border-fuchsia-500/10 bg-black/20 backdrop-blur-lg flex gap-3 items-center justify-between sticky top-0 z-20">
            <h1 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-ellipsis whitespace-nowrap overflow-hidden">
                Giracle‑K Prompt Builder — MAXPRO ULTRA v7 SAFE++
            </h1>
            <div className="flex items-center gap-3 flex-shrink-0">
                <span className="px-3 py-1 rounded-full bg-fuchsia-950/30 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-mono">
                    {t('header.info', language, presetCount, legwearCount, shoeCount)}
                </span>
                <button
                    onClick={onShowManual}
                    className="text-xs bg-transparent border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20 hover:text-white rounded-full px-3 py-1 transition-all"
                    title={t('header.manualButtonTitle', language)}
                >
                    {t('header.manualButton', language)}
                </button>
                <button
                    onClick={toggleLanguage}
                    className="text-xs bg-transparent border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20 hover:text-white rounded-full px-3 py-1 transition-all"
                    title="Change UI Language"
                >
                    {t('header.langButton', language)}
                </button>
                <button
                    onClick={handleBookmark}
                    className="text-xs bg-transparent border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20 hover:text-white rounded-full px-3 py-1 transition-all"
                    title={t('header.bookmarkButtonTitle', language)}
                >
                    {t('header.bookmarkButton', language)}
                </button>
            </div>
        </header>
    );
};

export default Header;
