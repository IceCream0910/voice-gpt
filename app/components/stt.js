import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { useSettings } from '../settings/SettingsContext';

const SpeechRecognitionComponent = forwardRef(({ onResult }, ref) => {
    const { guidePrompt, updateGuidePrompt } = useSettings();

    const {
        transcript,
        listening,
        resetTranscript,
        finalTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        if (!browserSupportsSpeechRecognition) {
            alert('지원되지 않는 브라우저입니다.');
        }
    }, []);

    const startListening = () => {
        SpeechRecognition.startListening({
            continuous: false,
            language: 'ko-KR',
            interimResults: true
        });
    };

    useEffect(() => {
        if (finalTranscript) {
            onResult(finalTranscript);
        } else {
        }
    }, [finalTranscript]);

    const stopListening = () => {
        SpeechRecognition.stopListening();
        if (finalTranscript) {
            onResult(finalTranscript);
            resetTranscript();
        } else {
            updateGuidePrompt('위 버튼을 눌러 말하기 시작');
        }
    };

    useEffect(() => {
        if (transcript.length > 0) {
            updateGuidePrompt(transcript);
        }
    }, [transcript]);

    useEffect(() => {
        if (listening) {
            updateGuidePrompt('듣는 중');
        } else {
            if (finalTranscript) {
                updateGuidePrompt('생각하는 중');
                resetTranscript();
            } else {
                updateGuidePrompt('위 버튼을 눌러 말하기 시작');
            }
        }
    }, [listening]);

    useImperativeHandle(ref, () => ({
        startListening,
        stopListening
    }));

    return (
        <>
            <button className={`toggleRecognition ${listening ? 'stop' : 'start'}`} onClick={listening ? stopListening : startListening}>
                <div className="leaf leaf1"></div>
                <div className="leaf leaf2"></div>
                <div className="leaf leaf3"></div>
                <div className="leaf leaf4"></div>
            </button>
        </>
    );
});

export default SpeechRecognitionComponent;

