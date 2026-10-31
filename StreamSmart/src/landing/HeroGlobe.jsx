import { useMemo } from "react";

export default function HeroGlobe() {
  const particles = useMemo(
    () =>
      Array.from({ length: 36 }, (_, index) => ({
        id: index,
        left: `${(index * 37 + 11) % 100}%`,
        top: `${(index * 53 + 7) % 100}%`,
        delay: `${(index % 9) * -0.7}s`,
        duration: `${5 + (index % 6)}s`,
        size: `${2 + (index % 3)}px`,
      })),
    [],
  );

  return (
    <div
      className="ss-globe-visual"
      role="img"
      aria-label="Animated network globe showing connected streaming regions"
    >
      <div className="ss-globe-grid" />
      <div className="ss-globe-orbit ss-globe-orbit-one" />
      <div className="ss-globe-orbit ss-globe-orbit-two" />

      <div className="ss-globe-stage">
        <div className="ss-globe-halo" />

        <div className="ss-globe-sphere">
          <div className="ss-globe-dots" />

          <div className="ss-globe-lat ss-globe-lat-one" />
          <div className="ss-globe-lat ss-globe-lat-two" />
          <div className="ss-globe-lat ss-globe-lat-three" />

          <div className="ss-globe-long ss-globe-long-one" />
          <div className="ss-globe-long ss-globe-long-two" />
          <div className="ss-globe-long ss-globe-long-three" />

          <svg
            className="ss-globe-routes"
            viewBox="0 0 520 520"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="ss-globe-gradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#35d9ee" />
                <stop offset="100%" stopColor="#a9f57d" />
              </linearGradient>
            </defs>

            <path d="M 105 190 Q 230 45 350 165 T 420 315" />
            <path d="M 105 190 Q 180 330 295 280 T 420 315" />
            <path d="M 190 95 Q 260 245 350 165" />
            <path d="M 190 95 Q 250 390 295 280" />
            <path d="M 295 280 Q 345 360 420 315" />
          </svg>

          <span className="ss-globe-node ss-globe-node-cyan" />
          <span className="ss-globe-node ss-globe-node-green" />
          <span className="ss-globe-node ss-globe-node-small" />
        </div>

        <div className="ss-globe-tag ss-globe-tag-india">
          <i /> INDIA EDGE
        </div>

        <div className="ss-globe-tag ss-globe-tag-singapore">
          <i /> SINGAPORE
        </div>

        <div className="ss-globe-tag ss-globe-tag-origin">
          <i /> ORIGIN
        </div>
      </div>

      <div className="ss-globe-particles" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              width: particle.size,
              height: particle.size,
            }}
          />
        ))}
      </div>

      <div className="ss-globe-caption">
        <span />
        <small>GLOBAL DELIVERY NETWORK</small>
        <strong>LIVE TOPOLOGY / 01</strong>
      </div>
    </div>
  );
}
