'use client';

import { useRef, useCallback, useEffect } from 'react';
import type { Player } from '@/lib/types';
import { WHEEL_COLORS, COLORS } from '@/lib/constants';

interface WheelAnimationOptions {
  players: Player[];
  onTick?: () => void;
  onComplete?: (player: Player) => void;
  onSegmentClick?: (player: Player) => void;
}

export function useWheelAnimation({ players, onTick, onComplete, onSegmentClick }: WheelAnimationOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const spinningRef = useRef(false);
  const targetPlayerRef = useRef<Player | null>(null);
  const lastSegmentRef = useRef(-1);
  const rafRef = useRef<number>(0);

  const getWheelGeometry = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    return { centerX, centerY, radius };
  }, []);

  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, width, height);

    if (players.length === 0) return;

    const segmentAngle = (2 * Math.PI) / players.length;

    // Draw segments
    players.forEach((player, i) => {
      const startAngle = angleRef.current + i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(12, Math.min(18, 300 / players.length))}px Rajdhani, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(player.name, radius - 20, 5);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a0a0f';
    ctx.fill();
    ctx.strokeStyle = COLORS.ctPrimary;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CS2', centerX, centerY);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Pointer triangle at top
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 15);
    ctx.lineTo(centerX - 15, centerY - radius - 35);
    ctx.lineTo(centerX + 15, centerY - radius - 35);
    ctx.closePath();
    ctx.fillStyle = COLORS.neonGreen;
    ctx.fill();
    ctx.shadowColor = COLORS.neonGreen;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [players]);

  const getSegmentAtPointer = useCallback((): number => {
    if (players.length === 0) return -1;
    const segmentAngle = (2 * Math.PI) / players.length;
    const pointerAngle = -Math.PI / 2;
    let normalizedAngle = (pointerAngle - angleRef.current) % (2 * Math.PI);
    if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
    return Math.floor(normalizedAngle / segmentAngle) % players.length;
  }, [players]);

  const getSegmentAtPosition = useCallback((clientX: number, clientY: number): number => {
    const geo = getWheelGeometry();
    if (!geo || players.length === 0) return -1;

    const canvas = canvasRef.current;
    if (!canvas) return -1;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - geo.centerX;
    const y = clientY - rect.top - geo.centerY;

    const distance = Math.sqrt(x * x + y * y);
    if (distance > geo.radius || distance < 30) return -1; // outside wheel or inside center

    let clickAngle = Math.atan2(y, x);
    let relAngle = (clickAngle - angleRef.current) % (2 * Math.PI);
    if (relAngle < 0) relAngle += 2 * Math.PI;

    const segmentAngle = (2 * Math.PI) / players.length;
    return Math.floor(relAngle / segmentAngle) % players.length;
  }, [players, getWheelGeometry]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    if (spinningRef.current) {
      angleRef.current += velocityRef.current;
      velocityRef.current *= 0.985;

      const currentSeg = getSegmentAtPointer();
      if (currentSeg !== lastSegmentRef.current && currentSeg >= 0) {
        lastSegmentRef.current = currentSeg;
        onTick?.();
      }

      if (velocityRef.current < 0.001) {
        spinningRef.current = false;
        velocityRef.current = 0;
        const winnerIndex = getSegmentAtPointer();
        if (winnerIndex >= 0 && winnerIndex < players.length) {
          onComplete?.(players[winnerIndex]);
        }
      }
    }

    drawWheel(ctx, width, height);
    rafRef.current = requestAnimationFrame(animate);
  }, [drawWheel, getSegmentAtPointer, onTick, onComplete, players]);

  const spin = useCallback((targetPlayer?: Player) => {
    if (spinningRef.current || players.length === 0) return;

    targetPlayerRef.current = targetPlayer || players[Math.floor(Math.random() * players.length)];
    const targetIndex = players.indexOf(targetPlayerRef.current);

    const segmentAngle = (2 * Math.PI) / players.length;
    const targetSegCenter = targetIndex * segmentAngle + segmentAngle / 2;
    const extraRotations = 5 + Math.random() * 3;
    const targetAngle = -Math.PI / 2 - targetSegCenter + extraRotations * 2 * Math.PI;
    const deltaAngle = targetAngle - angleRef.current;

    velocityRef.current = deltaAngle * 0.015;
    if (velocityRef.current < 0.15) velocityRef.current = 0.15 + Math.random() * 0.1;

    spinningRef.current = true;
    lastSegmentRef.current = -1;
  }, [players]);

  // Handle canvas click for segment selection
  const handleCanvasClick = useCallback((e: MouseEvent) => {
    if (spinningRef.current || players.length === 0) return;

    const segIndex = getSegmentAtPosition(e.clientX, e.clientY);
    if (segIndex >= 0 && segIndex < players.length) {
      onSegmentClick?.(players[segIndex]);
    }
  }, [players, getSegmentAtPosition, onSegmentClick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);

    canvas.addEventListener('click', handleCanvasClick);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [animate, handleCanvasClick]);

  return { canvasRef, spin, isSpinning: spinningRef };
}
