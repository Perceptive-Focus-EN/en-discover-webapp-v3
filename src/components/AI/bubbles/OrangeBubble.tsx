import React from 'react';

interface BubbleProps {
    onClick?: (color: string) => void;
}

const OrangeBubble: React.FC<BubbleProps> = ({ onClick }) => {
    return (
        <div onClick={() => onClick && onClick('orange')} style={{ cursor: 'pointer' }}>

            <svg
                width="193"
                height="212"
                viewBox="0 0 193 212"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g filter="url(#filter0_d_23_61782)">
                    <rect x="24" y="20" width="164" height="164" rx="82" fill="url(#paint0_linear_23_61782)" shape-rendering="crispEdges" />
                </g>
                <defs>
                    <filter id="filter0_d_23_61782" x="0" y="0" width="212" height="212" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                        <feOffset dy="4" />
                        <feGaussianBlur stdDeviation="12" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix type="matrix" values="0 0 0 0 0.08575 0 0 0 0 0.6125 0 0 0 0 0 0 0 0 0 0.3 0" />
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_23_61782" />
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_23_61782" result="shape" />
                    </filter>
                    <linearGradient id="paint0_linear_23_61782" x1="106" y1="20" x2="106" y2="184" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FFA480" />
                        <stop offset="1" stop-color="#FF6C4A" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};

export default OrangeBubble;
