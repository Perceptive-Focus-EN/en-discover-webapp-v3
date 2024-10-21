import React from 'react';

interface TranscriptionOutputProps {
  transcript: string;
  error: string;
}

const TranscriptionOutput: React.FC<TranscriptionOutputProps> = ({ transcript, error }) => {
  return (
    <div className="transcription-output">
      {transcript && (
        <div className="transcript">
          <h3>Transcription:</h3>
          <p>{transcript}</p>
        </div>
      )}
      {error && (
        <div className="error">
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
      {!transcript && !error && (
        <p>Start speaking to see the transcription here.</p>
      )}
    </div>
  );
};

export default TranscriptionOutput;