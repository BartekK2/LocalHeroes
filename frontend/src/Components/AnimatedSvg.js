import React from 'react';

/**
 * AnimatedHeroSvg - Animated SVG illustration for the Home page
 * Features floating location pins and abstract shapes with smooth animations
 * Colors: Blue theme
 */
const AnimatedHeroSvg = ({ className = '', width = 400, height = 400 }) => {
    return (
        <svg
            className={className}
            width={width}
            height={height}
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
        >
            {/* Definitions for gradients and filters */}
            <defs>
                {/* Primary gradient (blue) */}
                <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>

                {/* Secondary gradient (cyan) */}
                <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>

                {/* Mixed gradient (blue to purple to cyan) */}
                <linearGradient id="mixedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>

                {/* Light gradient */}
                <linearGradient id="lightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f8fafc" />
                </linearGradient>

                {/* Drop shadow filter */}
                <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#2563eb" floodOpacity="0.25" />
                </filter>

                {/* Soft glow filter */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                {/* Stronger glow for pins */}
                <filter id="pinGlow" x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Background decorative circles */}
            <g opacity="0.15">
                <circle cx="320" cy="80" r="60" fill="url(#primaryGradient)">
                    <animate
                        attributeName="r"
                        values="60;72;60"
                        dur="4s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    />
                </circle>
                <circle cx="80" cy="320" r="80" fill="url(#secondaryGradient)">
                    <animate
                        attributeName="r"
                        values="80;95;80"
                        dur="5s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    />
                </circle>
                <circle cx="350" cy="300" r="40" fill="url(#mixedGradient)">
                    <animate
                        attributeName="r"
                        values="40;50;40"
                        dur="3.5s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    />
                </circle>
            </g>

            {/* Main store/building illustration */}
            <g filter="url(#dropShadow)">
                {/* Building base with glass effect */}
                <rect x="120" y="180" width="160" height="120" rx="12" fill="url(#lightGradient)" stroke="#e2e8f0" strokeWidth="2" />

                {/* Building roof with gradient */}
                <path d="M100 185 L200 110 L300 185 Z" fill="url(#primaryGradient)" />

                {/* Roof highlight */}
                <path d="M115 182 L200 117 L285 182 Z" fill="url(#mixedGradient)" opacity="0.3" />

                {/* Door */}
                <rect x="175" y="235" width="50" height="65" rx="8" fill="url(#primaryGradient)" />
                <circle cx="215" cy="268" r="4" fill="url(#secondaryGradient)">
                    <animate
                        attributeName="opacity"
                        values="0.6;1;0.6"
                        dur="2s"
                        repeatCount="indefinite"
                    />
                </circle>

                {/* Windows with animated glow */}
                <rect x="135" y="200" width="32" height="28" rx="6" fill="#dbeafe">
                    <animate
                        attributeName="fill"
                        values="#dbeafe;#bfdbfe;#dbeafe"
                        dur="3s"
                        repeatCount="indefinite"
                    />
                </rect>
                <rect x="233" y="200" width="32" height="28" rx="6" fill="#cffafe">
                    <animate
                        attributeName="fill"
                        values="#cffafe;#a5f3fc;#cffafe"
                        dur="3s"
                        repeatCount="indefinite"
                        begin="1s"
                    />
                </rect>

                {/* Store sign with gradient */}
                <rect x="140" y="145" width="120" height="30" rx="6" fill="url(#secondaryGradient)" />
                <text x="200" y="166" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Inter, sans-serif">
                    LocalHeroes
                </text>
            </g>

            {/* Floating location pin 1 (main) */}
            <g filter="url(#pinGlow)">
                <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0,0; 0,-18; 0,0"
                    dur="3s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                />
                <path
                    d="M200 50 C177 50 160 67 160 90 C160 118 200 155 200 155 C200 155 240 118 240 90 C240 67 223 50 200 50"
                    fill="url(#primaryGradient)"
                />
                <circle cx="200" cy="86" r="14" fill="white" />
                <circle cx="200" cy="86" r="6" fill="url(#secondaryGradient)">
                    <animate
                        attributeName="r"
                        values="6;8;6"
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                </circle>
            </g>

            {/* Floating location pin 2 (left) */}
            <g transform="translate(45, 95)" opacity="0.85">
                <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="45,95; 45,82; 45,95"
                    dur="4s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    begin="0.5s"
                />
                <path
                    d="M0 0 C-15 0 -26 11 -26 26 C-26 45 0 68 0 68 C0 68 26 45 26 26 C26 11 15 0 0 0"
                    fill="url(#secondaryGradient)"
                    transform="scale(0.65)"
                />
                <circle cx="0" cy="17" r="8" fill="white" transform="scale(0.65)" />
            </g>

            {/* Floating location pin 3 (right) */}
            <g transform="translate(340, 120)" opacity="0.75">
                <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="340,120; 340,105; 340,120"
                    dur="3.5s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                    begin="1s"
                />
                <path
                    d="M0 0 C-12 0 -21 9 -21 21 C-21 36 0 54 0 54 C0 54 21 36 21 21 C21 9 12 0 0 0"
                    fill="url(#mixedGradient)"
                    transform="scale(0.55)"
                />
                <circle cx="0" cy="13" r="6" fill="white" transform="scale(0.55)" />
            </g>

            {/* Decorative floating elements */}
            <g>
                {/* Stars/sparkles */}
                <circle cx="85" cy="85" r="4" fill="url(#primaryGradient)">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="330" cy="240" r="5" fill="url(#secondaryGradient)">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
                </circle>
                <circle cx="55" cy="210" r="3" fill="url(#mixedGradient)">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" begin="1s" />
                </circle>
                <circle cx="360" cy="170" r="4" fill="url(#primaryGradient)">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" repeatCount="indefinite" begin="0.3s" />
                </circle>
                <circle cx="70" cy="150" r="3" fill="url(#secondaryGradient)">
                    <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" repeatCount="indefinite" begin="0.7s" />
                </circle>
            </g>

            {/* Animated connection lines (dotted) */}
            <g stroke="url(#primaryGradient)" strokeWidth="2" strokeDasharray="5 5" fill="none" opacity="0.5">
                <path d="M200 155 Q 180 170 175 180">
                    <animate attributeName="stroke-dashoffset" values="0;10" dur="1s" repeatCount="indefinite" />
                </path>
                <path d="M45 140 Q 90 160 120 180">
                    <animate attributeName="stroke-dashoffset" values="0;10" dur="1.2s" repeatCount="indefinite" />
                </path>
                <path d="M340 150 Q 310 170 280 185">
                    <animate attributeName="stroke-dashoffset" values="0;10" dur="1.1s" repeatCount="indefinite" />
                </path>
            </g>

            {/* Ground shadow */}
            <ellipse cx="200" cy="325" rx="110" ry="18" fill="url(#primaryGradient)" opacity="0.12">
                <animate
                    attributeName="rx"
                    values="110;125;110"
                    dur="3s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                />
            </ellipse>
        </svg>
    );
};

export default AnimatedHeroSvg;
