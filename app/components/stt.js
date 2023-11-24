import { useState, useRef, forwardRef, useImperativeHandle } from 'react'

const SpeechRecognition = forwardRef(({ onResult }, ref) => {
    const recognition = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const tempResult = useRef(null);

    const startListening = () => {
        const tempRecognition = new window.webkitSpeechRecognition();
        tempRecognition.continuous = true;
        tempRecognition.interimResults = true;
        tempRecognition.lang = 'ko-KR';
        recognition.current = tempRecognition;
        setIsListening(true);
        tempRecognition.start();

        tempRecognition.onresult = (event) => {
            tempResult.current = event.results[0][0].transcript;
            if (event.results[0].isFinal) {
                tempRecognition.stop();
                setIsListening(false);
                onResult(event.results[0][0].transcript);
                recognition.current = null;
            }
        };
    };

    const stopListening = () => {
        if (recognition.current) {
            recognition.current.stop();
            //onResult(tempResult.current);
            setIsListening(false);
        }
    };

    useImperativeHandle(ref, () => ({
        startListening,
        stopListening
    }));

    return (
        <>
            <button className={`toggleRecognition ${isListening ? 'stop' : 'start'}`} onClick={isListening ? stopListening : startListening}>
                <div className="leaf leaf1"></div>
                <div className="leaf leaf2"></div>
                <div className="leaf leaf3"></div>
                <div className="leaf leaf4"></div>
            </button>
        </>
    );
});

export default SpeechRecognition;
