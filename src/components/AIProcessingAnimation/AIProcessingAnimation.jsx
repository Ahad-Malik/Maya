import React, { useEffect, useRef } from 'react';

const AIProcessingAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const drawCircle = (x, y, radius, start, end, color, lineWidth) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, start, end);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    const animate = (time) => {
      time *= 0.001;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 5;

      // Pulsing effect for the ball
      const pulseFactor = Math.sin(time * 2) * 0.15 + 1; // Oscillates between 0.85 and 1.15

      // Circular lines
      for (let i = 0; i < 5; i++) {
        const radius = maxRadius - i * 10 - 10; // Increased gap between lines and brought them closer to the ball
        if (radius <= 0) continue;
        const speed = 1 - i * 0.1;
        const startAngle = (time * speed) % (Math.PI * 2);
        const endAngle = startAngle + Math.PI / 2 + Math.sin(time * 2) * Math.PI / 4;

        const gradient = ctx.createLinearGradient(
          centerX - radius, centerY - radius,
          centerX + radius, centerY + radius
        );
        gradient.addColorStop(0, `rgba(0, 201, 255, ${0.7 - i * 0.1})`);  // Cyan
        gradient.addColorStop(0.5, `rgba(13, 108, 247, ${0.7 - i * 0.1})`);  // Blue
        gradient.addColorStop(1, `rgba(138, 43, 226, ${0.7 - i * 0.1})`);  // Purple

        drawCircle(centerX, centerY, radius, startAngle, endAngle, gradient, 3 - i * 0.4);
      }

      // Center ball
      const baseCenterRadius = 30;
      const centerRadius = baseCenterRadius * pulseFactor;
      const gradient = ctx.createRadialGradient(
        centerX - centerRadius * 0.3, centerY - centerRadius * 0.3, 0,
        centerX, centerY, centerRadius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.2, 'rgba(0, 201, 255, 0.9)');  // Cyan
      gradient.addColorStop(0.6, 'rgba(13, 108, 247, 0.9)');  // Blue
      gradient.addColorStop(1, 'rgba(138, 43, 226, 0.9)');  // Purple

      ctx.beginPath();
      ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Shine effect
      ctx.beginPath();
      ctx.arc(centerX - centerRadius * 0.2, centerY - centerRadius * 0.2, centerRadius * 0.6, 0, Math.PI * 2);
      const shineGradient = ctx.createRadialGradient(
        centerX - centerRadius * 0.2, centerY - centerRadius * 0.2, 0,
        centerX - centerRadius * 0.2, centerY - centerRadius * 0.2, centerRadius * 0.6
      );
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = shineGradient;
      ctx.fill();

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    animate(0);
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="ai-processing-container">
      <canvas ref={canvasRef} className="ai-processing-canvas" />
      <style jsx>{`
        .ai-processing-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60%;
          height: 60%;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          pointer-events: none;
        }
        .ai-processing-canvas {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default AIProcessingAnimation;