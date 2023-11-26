"use client"// SettingsContext.js
import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [gpt4Enabled, setGpt4Enabled] = useState(typeof window !== 'undefined' && window.localStorage.getItem('gpt4Enabled') ? window.localStorage.getItem('gpt4Enabled') === 'true' : false);
    const [naturalVoiceEnabled, setNaturalVoiceEnabled] = useState(typeof window !== 'undefined' && window.localStorage.getItem('naturalVoiceEnabled') ? window.localStorage.getItem('naturalVoiceEnabled') === 'true' : false);
    const [freeGptEnabled, setFreeGptEnabled] = useState(typeof window !== 'undefined' && window.localStorage.getItem('freeGptEnabled') ? window.localStorage.getItem('freeGptEnabled') === 'true' : false);

    const [guidePrompt, setGuidePrompt] = useState('버튼을 눌러 말하기 시작');

    const toggleGpt4 = () => {
        setGpt4Enabled((prev) => !prev);
        localStorage.setItem('gpt4Enabled', !gpt4Enabled);
    };
    const toggleNaturalVoice = () => {
        setNaturalVoiceEnabled((prev) => !prev);
        localStorage.setItem('naturalVoiceEnabled', !naturalVoiceEnabled);
    };
    const toggleFreeGpt = () => {
        setFreeGptEnabled((prev) => !prev);
        localStorage.setItem('freeGptEnabled', !freeGptEnabled);
    };
    const updateGuidePrompt = (prompt) => {
        setGuidePrompt(prompt);
    }

    return (
        <SettingsContext.Provider
            value={{
                gpt4Enabled,
                toggleGpt4,
                naturalVoiceEnabled,
                toggleNaturalVoice,
                freeGptEnabled,
                toggleFreeGpt,
                guidePrompt,
                updateGuidePrompt
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
