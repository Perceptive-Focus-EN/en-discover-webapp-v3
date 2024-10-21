// TextOutput.tsx
import React from 'react';
import styled from 'styled-components';

interface TextOutputProps {
    text: string;
}

const OutputContainer = styled.div`
    visibility: visible; // Make the container visible
    width: auto;
    height: auto;
    overflow: visible; // Ensure that content is shown
    position: static; // Keep the container in the normal document flow
`;

const TextOutput: React.FC<TextOutputProps> = ({ text }) => {
    return (
        <OutputContainer>
            {text}
        </OutputContainer>
    );
};

export default TextOutput;