import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import './LanguageSwitcher.css';

export type Language = 'en' | 'bg' | 'it';

interface LanguageSwitcherProps {
    currentLang: Language;
    onLangChange: (lang: Language) => void;
    onToggle: (isOpen: boolean) => void;
    translations: any; // Using any for simplicity, or import the type if strictly needed
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onLangChange, onToggle, translations }) => {
    const [isOpen, setIsOpen] = useState(false);

    const languages: { id: Language; label: string }[] = [
        { id: 'en', label: 'English' },
        { id: 'bg', label: 'Български' },
        { id: 'it', label: 'Italiano' },
    ];

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        onToggle(newState);
    };

    if (!translations || !translations.ui) {
        return null;
    }

    return (
        <div className="lang-switcher">
            <button
                className="lang-btn-icon"
                onClick={handleToggle}
                title={`${translations.ui?.language || 'Language'}: ${currentLang.toUpperCase()}`}
            >
                <Globe size={24} />
            </button>

            {isOpen && (
                <div className="lang-menu">
                    {languages.map((lang) => (
                        <button
                            key={lang.id}
                            className={`lang-item ${currentLang === lang.id ? 'active' : ''}`}
                            onClick={() => {
                                onLangChange(lang.id);
                                setIsOpen(false);
                                onToggle(false);
                            }}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
