import { useEffect, useRef } from 'react';

export const AuroraBackground = () => {
  const bgRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: 50, y: 50 });
  const targetRef = useRef({ x: 50, y: 50 });

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;

    // 设置初始背景
    const { x, y } = mouseRef.current;
    bg.style.background = `
      radial-gradient(ellipse 60% 50% at ${x}% ${y}%, rgba(0, 217, 255, 0.18), transparent 50%),
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99, 102, 241, 0.12), transparent 50%),
      radial-gradient(ellipse 50% 50% at 80% 70%, rgba(168, 85, 247, 0.1), transparent 50%)
    `;

    const handleMouseMove = (e) => {
      targetRef.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
    };

    const animate = () => {
      // 平滑插值
      mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.05;

      const { x, y } = mouseRef.current;

      bg.style.background = `
        radial-gradient(ellipse 60% 50% at ${x}% ${y}%, rgba(0, 217, 255, 0.18), transparent 50%),
        radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99, 102, 241, 0.12), transparent 50%),
        radial-gradient(ellipse 50% 50% at 80% 70%, rgba(168, 85, 247, 0.1), transparent 50%)
      `;

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div ref={bgRef} className="aurora-bg" />
      <div className="noise-overlay" />
    </>
  );
};
