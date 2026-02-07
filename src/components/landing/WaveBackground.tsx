import React, { useEffect, useRef } from 'react';

/**
 * WaveBackground recreates the elegant, horizontal ribbon effect.
 * It uses a collection of thin lines with slightly offset phase and frequency
 * to simulate the organic, high-detail vector flow from the screenshot.
 */
export const WaveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = window.innerWidth;
      const h = window.innerHeight;

      // We want about 30-40 thin lines
      const lineCount = 35;
      time += 0.005; // Gentle animation speed

      for (let i = 0; i < lineCount; i++) {
        ctx.beginPath();

        // Progress of this specific line (0 to 1)
        const p = i / lineCount;

        // Gradient for each line matching the reference
        const grad = ctx.createLinearGradient(0, h * 0.5, w, h);
        grad.addColorStop(0, `rgba(60, 80, 255, ${0.1 + p * 0.2})`); // Blue/Indigo left
        grad.addColorStop(0.5, `rgba(160, 100, 255, ${0.2 + p * 0.3})`); // Purple middle
        grad.addColorStop(1, `rgba(100, 255, 180, ${0.1 + p * 0.2})`); // Green right

        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;

        // Plot the horizontal sweep
        for (let x = -50; x <= w + 50; x += 5) {
          const normX = x / w;

          /**
           * We need a curve that:
           * 1. Starts low on the left
           * 2. Swells and pinches in the middle-right
           * 3. Has high-frequency harmonic offsets
           */

          // Base path: a slow sine sweep
          const baseCurve = Math.sin(normX * 3 + time * 0.5) * 60;

          // Harmonic offsets for the "ribbon" look
          // Shift each line by p (line progress) to create the parallel spread
          const spread = (p - 0.5) * 180 * Math.sin(normX * 2 + time * 0.2);

          // The "S" pinch effect from the image
          const pinch = Math.pow(Math.sin(normX * Math.PI), 2) * 80;

          // Additional complex oscillation
          const oscillation = Math.sin(normX * 8 - time + p * 2) * 15;

          // Vertical position (anchored toward the bottom right area)
          const y = (h * 0.75) + baseCurve + spread - pinch + oscillation;

          if (x === -50) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-[#0a0a0c]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          filter: 'contrast(1.1)',
        }}
      />
      {/* Soft overlay to match the image's dark, deep background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
