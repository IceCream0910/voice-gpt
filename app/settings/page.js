"use client"
import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/select/filled-select';
import '@material/web/switch/switch.js';
import { useSettings } from './SettingsContext';

const Settings = () => {
    const { gpt4Enabled, toggleGpt4, naturalVoiceEnabled, toggleNaturalVoice } = useSettings();

    useEffect(() => {
        console.log(gpt4Enabled, naturalVoiceEnabled);
    }, [gpt4Enabled, naturalVoiceEnabled])

    return (
        <>
            <main>
                <br />
                <h1>설정</h1>
                <br />
                <label style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    GPT-4 사용
                    <md-switch {...(gpt4Enabled ? { selected: true } : {})} onClick={toggleGpt4}></md-switch>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    보다 자연스러운 음성 사용
                    <md-switch {...(naturalVoiceEnabled ? { selected: true } : {})} onClick={toggleNaturalVoice}></md-switch>
                </label>
                <br />
                <p style={{ opacity: 0.5, fontSize: '12px' }}>위 옵션은 사용량에 따라 요금이 부과됩니다.</p>
            </main>

            <Link href="/">
                <md-filled-button className="bottom-btn"
                    style={{ position: 'fixed', bottom: '10px', width: '100%', padding: '20px', boxSizing: 'border-box', height: '90px' }}
                >완료</md-filled-button>
            </Link>

            <style jsx>{`
        main {
            display: flex;
            width: 100%;
            height: 100vh;
            flex-direction: column;
            gap: 15px;
            padding: 20px;
        }
        `}</style>

        </>
    )
};

export default Settings;
