import React, { useEffect } from 'react';

const OnboardingAnimation = ({ onComplete }) => {
  const slogan = "Your Personal Genius";

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000); // Display for 3 seconds before calling onComplete

    return () => clearTimeout(timer);
  }, [onComplete]);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000',
    color: '#fff',
    position: 'fixed',
    top: 0,
    left: 0,
  };

  const logoStyle = {
    fontSize: '50px',
    color: '#0d6cf7',
    marginBottom: '24px',
    opacity: 0,
    animation: 'fadeIn 0.5s ease-out forwards',
  };

  const sloganStyle = {
    fontSize: '30px',
    color: '#fff',
    opacity: 0,
    animation: 'fadeIn 0.5s ease-out 0.3s forwards',
  };

  return (
    <div style={containerStyle}>
      <h1 style={logoStyle}>Maya</h1>
      <p style={sloganStyle}>{slogan}</p>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default OnboardingAnimation;