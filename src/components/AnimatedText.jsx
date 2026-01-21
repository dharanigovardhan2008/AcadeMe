import React from 'react';

const AnimatedText = ({ text, className = "", style = {} }) => {
    return (
        <span className={className} style={style} aria-label={text}>
            {text.split('').map((char, index) => (
                <span 
                    key={index} 
                    className="char-split" 
                    style={{ 
                        '--char-index': index, 
                        display: char === ' ' ? 'inline' : 'inline-block' 
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </span>
    );
};

export default AnimatedText;
