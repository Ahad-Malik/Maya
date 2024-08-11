import React, { useEffect, useRef } from 'react';

const ModernBlueWaveform = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const numPoints = 200;
    const numWaves = 3;
    let waveforms = Array(numWaves).fill().map(() => Array(numPoints).fill(0));
    let phases = Array(numWaves).fill(0);

    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      waveforms.forEach((waveform, index) => {
        ctx.beginPath();
        const segmentWidth = canvas.width / (numPoints - 1);
        const scaleFactor = canvas.height / (8 + index * 2);
        for (let i = 0; i < numPoints; i++) {
          const x = i * segmentWidth;
          const y = canvas.height / 2 + waveform[i] * scaleFactor;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const xc = (x + (i - 1) * segmentWidth) / 2;
            const yc = (y + (canvas.height / 2 + waveform[i - 1] * scaleFactor)) / 2;
            ctx.quadraticCurveTo(xc, yc, x, y);
          }
        }
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, `rgba(0, 150, 255, ${0.2 - index * 0.05})`);
        gradient.addColorStop(0.5, `rgba(100, 200, 255, ${0.3 - index * 0.05})`);
        gradient.addColorStop(1, `rgba(0, 150, 255, ${0.2 - index * 0.05})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3 - index * 0.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.shadowColor = 'rgba(0, 150, 255, 0.3)';
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    };

    const animate = (time) => {
      time *= 0.001;
      waveforms.forEach((waveform, wIndex) => {
        phases[wIndex] += 0.01 * (wIndex + 1);
        for (let i = 0; i < numPoints; i++) {
          const phaseOffset = i / numPoints * Math.PI * 2;
          const baseAmplitude = Math.sin(phases[wIndex] + phaseOffset) * 0.7;
          waveform[i] = baseAmplitude * (1 - wIndex * 0.2);
        }
      });
      drawWaveform();
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
    <div className="modern-waveform-container">
      <canvas ref={canvasRef} className="modern-waveform-canvas" />
      <style>{`
        .modern-waveform-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          pointer-events: none;
        }
        .modern-waveform-canvas {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default ModernBlueWaveform;