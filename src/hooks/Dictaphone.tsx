import React, { useEffect } from 'react';
import SpeechRecognition, {
    useSpeechRecognition,
} from 'react-speech-recognition';

const Dictaphone: React.FC = () => {
    const {
        listening,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    useEffect(() => {
        // Request microphone permission when the component mounts
        if (browserSupportsSpeechRecognition) {
            SpeechRecognition.startListening();
        }
    }, [browserSupportsSpeechRecognition]);

    if (!browserSupportsSpeechRecognition) {
        return <span>Browser doesn't support speech recognition.</span>;
    }

    const startListening = () => SpeechRecognition.startListening();
    const stopListening = () => SpeechRecognition.stopListening();

    return (
        <div>
            <p>Microphone: {listening ? 'on' : 'off'}</p>
            <button onClick={startListening}>Start</button>
            <button onClick={stopListening}>Stop</button>
            <button onClick={() => SpeechRecognition.startListening()}>Start</button>
            <button onClick={() => SpeechRecognition.stopListening()}>Stop</button>
        </div>
    );
};

export default Dictaphone;
