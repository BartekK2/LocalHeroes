import React from 'react';
import './AnimatedSVG.css';

// Animowane kształty dekoracyjne
export const FloatingShapes = () => {
    return (
        <div className="animated-svg-container">
            {/* Główny gradient blob */}
            <svg className="svg-blob blob-1" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6">
                            <animate attributeName="stop-color" values="#6366f1;#818cf8;#6366f1" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4">
                            <animate attributeName="stop-color" values="#818cf8;#a5b4fc;#818cf8" dur="4s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                </defs>
                <path fill="url(#gradient1)">
                    <animate
                        attributeName="d"
                        dur="10s"
                        repeatCount="indefinite"
                        values="
                            M43.5,-51.2C55.9,-41.3,65.2,-27.3,68.8,-11.4C72.4,4.5,70.2,22.4,61.5,35.5C52.8,48.7,37.5,57.2,21.2,62.1C4.9,67,-12.4,68.3,-27.5,62.5C-42.6,56.8,-55.4,43.9,-63.2,28.3C-71,12.7,-73.8,-5.6,-69.5,-22.1C-65.2,-38.5,-53.9,-53,-39.8,-62.4C-25.7,-71.8,-8.9,-76.1,4.3,-81.2C17.4,-86.4,31.1,-61.1,43.5,-51.2Z;
                            M47.7,-56.9C60.2,-47.4,67.8,-31.1,70.6,-14.1C73.4,2.9,71.3,20.6,62.8,34.5C54.2,48.4,39.2,58.5,22.8,64.2C6.5,69.9,-11.2,71.2,-27.4,65.8C-43.5,60.5,-58.2,48.4,-66.3,33C-74.4,17.5,-75.9,-1.3,-70.8,-17.8C-65.7,-34.4,-54,-48.6,-40.2,-57.8C-26.3,-67,-10.4,-71.1,4.1,-76C18.7,-80.8,35.3,-66.4,47.7,-56.9Z;
                            M43.5,-51.2C55.9,-41.3,65.2,-27.3,68.8,-11.4C72.4,4.5,70.2,22.4,61.5,35.5C52.8,48.7,37.5,57.2,21.2,62.1C4.9,67,-12.4,68.3,-27.5,62.5C-42.6,56.8,-55.4,43.9,-63.2,28.3C-71,12.7,-73.8,-5.6,-69.5,-22.1C-65.2,-38.5,-53.9,-53,-39.8,-62.4C-25.7,-71.8,-8.9,-76.1,4.3,-81.2C17.4,-86.4,31.1,-61.1,43.5,-51.2Z
                        "
                    />
                </path>
            </svg>

            {/* Drugi blob */}
            <svg className="svg-blob blob-2" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5">
                            <animate attributeName="stop-color" values="#f59e0b;#fbbf24;#f59e0b" dur="5s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.3">
                            <animate attributeName="stop-color" values="#fbbf24;#fcd34d;#fbbf24" dur="5s" repeatCount="indefinite" />
                        </stop>
                    </linearGradient>
                </defs>
                <path fill="url(#gradient2)">
                    <animate
                        attributeName="d"
                        dur="12s"
                        repeatCount="indefinite"
                        values="
                            M38.8,-49.2C50.3,-40.4,59.5,-28.1,64.1,-13.6C68.7,0.9,68.6,17.7,62.1,31.9C55.5,46.1,42.5,57.8,27.5,63.5C12.5,69.2,-4.5,68.9,-20.3,63.8C-36.1,58.6,-50.7,48.5,-58.9,34.8C-67.1,21.1,-68.9,3.8,-65.4,-12.1C-61.9,-28,-53.2,-42.4,-41.3,-51.1C-29.4,-59.8,-14.7,-62.7,-0.3,-62.4C14.1,-62,27.2,-58.1,38.8,-49.2Z;
                            M42.1,-52.8C54.3,-44.5,63.6,-31.4,67.4,-16.5C71.2,-1.6,69.4,15.1,62.3,29.3C55.2,43.5,42.7,55.2,28.4,61.1C14.1,67,-2.1,67.1,-17.5,62.5C-32.9,57.9,-47.5,48.7,-56.4,35.5C-65.3,22.3,-68.6,5.1,-66,-11C-63.4,-27.1,-54.9,-42.1,-43,-51.4C-31,-60.8,-15.5,-64.5,-0.2,-64.2C15.1,-64,29.9,-61.1,42.1,-52.8Z;
                            M38.8,-49.2C50.3,-40.4,59.5,-28.1,64.1,-13.6C68.7,0.9,68.6,17.7,62.1,31.9C55.5,46.1,42.5,57.8,27.5,63.5C12.5,69.2,-4.5,68.9,-20.3,63.8C-36.1,58.6,-50.7,48.5,-58.9,34.8C-67.1,21.1,-68.9,3.8,-65.4,-12.1C-61.9,-28,-53.2,-42.4,-41.3,-51.1C-29.4,-59.8,-14.7,-62.7,-0.3,-62.4C14.1,-62,27.2,-58.1,38.8,-49.2Z
                        "
                    />
                </path>
            </svg>

            {/* Pulsujące kółka */}
            <svg className="svg-circles" viewBox="0 0 100 100">
                <circle className="pulse-circle c1" cx="50" cy="50" r="8" />
                <circle className="pulse-circle c2" cx="50" cy="50" r="15" />
                <circle className="pulse-circle c3" cx="50" cy="50" r="22" />
            </svg>

            {/* Latające gwiazdki */}
            <div className="floating-stars">
                <svg className="star star-1" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <svg className="star star-2" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <svg className="star star-3" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
            </div>
        </div>
    );
};

// Animowany loader
export const AnimatedLoader = () => {
    return (
        <svg className="animated-loader" viewBox="0 0 50 50">
            <circle className="loader-track" cx="25" cy="25" r="20" />
            <circle className="loader-path" cx="25" cy="25" r="20" />
        </svg>
    );
};

// Animowane tło z particles
export const ParticleBackground = () => {
    return (
        <svg className="particle-bg" viewBox="0 0 400 400">
            <defs>
                <radialGradient id="particleGrad">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </radialGradient>
            </defs>
            {[...Array(20)].map((_, i) => (
                <circle
                    key={i}
                    className={`particle p-${i % 5}`}
                    cx={50 + (i * 20) % 300}
                    cy={50 + Math.floor(i / 3) * 50}
                    r={2 + (i % 3)}
                    fill="url(#particleGrad)"
                >
                    <animate
                        attributeName="cy"
                        from={50 + Math.floor(i / 3) * 50}
                        to={-50}
                        dur={`${3 + (i % 4)}s`}
                        repeatCount="indefinite"
                    />
                    <animate
                        attributeName="opacity"
                        values="0;1;0"
                        dur={`${3 + (i % 4)}s`}
                        repeatCount="indefinite"
                    />
                </circle>
            ))}
        </svg>
    );
};

export default FloatingShapes;
