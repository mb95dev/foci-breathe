import { useRef, useEffect } from 'react';
import type { BreathingPattern, SessionState } from '../types/breathing';

interface Props {
  session: SessionState;
  pattern: BreathingPattern;
}

const TRACK_HEIGHT = 420;
const BALL_RADIUS = 36;
const GLOW_RADIUS = 80;

export function BreathingBall({ session, pattern }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 200;
    const height = TRACK_HEIGHT + BALL_RADIUS * 2 + 40;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const trackX = width / 2;
      const trackTop = 30;
      const trackBottom = trackTop + TRACK_HEIGHT;

      // target zone background
      const zoneTop = trackTop + TRACK_HEIGHT * 0.15;
      const zoneBottom = trackTop + TRACK_HEIGHT * 0.85;
      const zoneGrad = ctx.createLinearGradient(0, zoneTop, 0, zoneBottom);
      zoneGrad.addColorStop(0, hexToRgba(pattern.color, 0.06));
      zoneGrad.addColorStop(0.5, hexToRgba(pattern.color, 0.12));
      zoneGrad.addColorStop(1, hexToRgba(pattern.color, 0.06));
      ctx.fillStyle = zoneGrad;
      roundRect(ctx, trackX - 50, zoneTop, 100, zoneBottom - zoneTop, 12);
      ctx.fill();

      // track line
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(trackX, trackTop);
      ctx.lineTo(trackX, trackBottom);
      ctx.stroke();

      // tick marks
      for (let i = 0; i <= 10; i++) {
        const y = trackTop + (TRACK_HEIGHT * i) / 10;
        const tickW = i % 5 === 0 ? 16 : 8;
        ctx.strokeStyle = i % 5 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(trackX - tickW / 2, y);
        ctx.lineTo(trackX + tickW / 2, y);
        ctx.stroke();
      }

      // ball position — Y=1 is top, Y=0 is bottom
      const ballY = trackBottom - session.ballY * TRACK_HEIGHT;

      // outer glow
      const glowGrad = ctx.createRadialGradient(trackX, ballY, 0, trackX, ballY, GLOW_RADIUS);
      glowGrad.addColorStop(0, hexToRgba(pattern.color, 0.25));
      glowGrad.addColorStop(0.5, hexToRgba(pattern.color, 0.08));
      glowGrad.addColorStop(1, hexToRgba(pattern.color, 0));
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(trackX, ballY, GLOW_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // ball body
      const bodyGrad = ctx.createRadialGradient(
        trackX - BALL_RADIUS * 0.25, ballY - BALL_RADIUS * 0.25, BALL_RADIUS * 0.1,
        trackX, ballY, BALL_RADIUS,
      );
      bodyGrad.addColorStop(0, hexToRgba(pattern.accentColor, 1));
      bodyGrad.addColorStop(0.7, hexToRgba(pattern.color, 0.95));
      bodyGrad.addColorStop(1, hexToRgba(pattern.color, 0.7));
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(trackX, ballY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // specular highlight
      const specGrad = ctx.createRadialGradient(
        trackX - BALL_RADIUS * 0.3, ballY - BALL_RADIUS * 0.3, 0,
        trackX - BALL_RADIUS * 0.3, ballY - BALL_RADIUS * 0.3, BALL_RADIUS * 0.6,
      );
      specGrad.addColorStop(0, 'rgba(255,255,255,0.35)');
      specGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.arc(trackX, ballY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [session.ballY, pattern.color, pattern.accentColor]);

  return (
    <div className="breathing-ball-wrapper">
      <canvas ref={canvasRef} className="breathing-ball-canvas" />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
