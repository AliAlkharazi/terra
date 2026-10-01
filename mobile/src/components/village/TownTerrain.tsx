import React, { useMemo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';

export const WORLD_W = 2800;
export const WORLD_H = 2200;
export const WORLD_CX = WORLD_W / 2;
export const WORLD_CY = WORLD_H / 2;

/** Isometric tile half-size */
const TILE_W = 54;
const TILE_H = 27;
/** Buildable diamond radius in tile coords */
const BUILD_R = 11;

function iso(i: number, j: number) {
  return {
    x: WORLD_CX + (i - j) * (TILE_W / 2),
    y: WORLD_CY + (i + j) * (TILE_H / 2),
  };
}

function tilePoly(i: number, j: number): string {
  const c = iso(i, j);
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return `${c.x},${c.y - hh} ${c.x + hw},${c.y} ${c.x},${c.y + hh} ${c.x - hw},${c.y}`;
}

type Tree = { x: number; y: number; s: number; tone: number };

function ringTrees(): Tree[] {
  const out: Tree[] = [];
  for (let a = 0; a < 56; a++) {
    const ang = (a / 56) * Math.PI * 2;
    const r = 620 + (a % 5) * 28;
    out.push({
      x: WORLD_CX + Math.cos(ang) * r,
      y: WORLD_CY + Math.sin(ang) * r * 0.62,
      s: 18 + (a % 4) * 5,
      tone: a % 3,
    });
  }
  // denser outer clumps
  for (let a = 0; a < 36; a++) {
    const ang = (a / 36) * Math.PI * 2 + 0.2;
    const r = 780 + (a % 4) * 40;
    out.push({
      x: WORLD_CX + Math.cos(ang) * r,
      y: WORLD_CY + Math.sin(ang) * r * 0.58,
      s: 22 + (a % 3) * 6,
      tone: (a + 1) % 3,
    });
  }
  return out;
}

const FOLIAGE = ['#C4A46A', '#A88848', '#8F7038'] as const;

/**
 * Procedural Clash-style town terrain: checker grass diamond, rim, trees, water corner.
 * Drawn in fixed world coordinates — pan/zoom the parent camera to explore.
 */
export function TownTerrain() {
  const tiles = useMemo(() => {
    const list: { i: number; j: number; dark: boolean }[] = [];
    for (let i = -BUILD_R; i <= BUILD_R; i++) {
      for (let j = -BUILD_R; j <= BUILD_R; j++) {
        if (Math.abs(i) + Math.abs(j) > BUILD_R) continue;
        list.push({ i, j, dark: (i + j) % 2 === 0 });
      }
    }
    return list;
  }, []);

  const trees = useMemo(() => ringTrees(), []);

  // Outer soft ground diamond (slightly larger than build grid)
  const rim = useMemo(() => {
    const R = BUILD_R + 1.35;
    const pts = [
      iso(0, -R),
      iso(R, 0),
      iso(0, R),
      iso(-R, 0),
    ];
    return pts.map((p) => `${p.x},${p.y}`).join(' ');
  }, []);

  const buildOutline = useMemo(() => {
    const R = BUILD_R + 0.05;
    const pts = [iso(0, -R), iso(R, 0), iso(0, R), iso(-R, 0)];
    return pts.map((p) => `${p.x},${p.y}`).join(' ');
  }, []);

  return (
    <Svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
      {/* Deep wilderness base */}
      <Path d={`M0 0 H${WORLD_W} V${WORLD_H} H0 Z`} fill="#2A4A22" />
      <Ellipse cx={WORLD_CX} cy={WORLD_CY} rx={980} ry={620} fill="#3A6A30" />

      {/* Water corner (SW) */}
      <Ellipse cx={WORLD_CX - 720} cy={WORLD_CY + 480} rx={280} ry={160} fill="#1E4A6E" />
      <Ellipse cx={WORLD_CX - 700} cy={WORLD_CY + 460} rx={220} ry={120} fill="#2A6A8E" opacity={0.85} />
      <Ellipse cx={WORLD_CX - 640} cy={WORLD_CY + 400} rx={160} ry={70} fill="#C4A878" opacity={0.9} />

      {/* Rocky waterfall hint (NE) */}
      <Ellipse cx={WORLD_CX + 640} cy={WORLD_CY - 420} rx={120} ry={70} fill="#6A7068" />
      <Ellipse cx={WORLD_CX + 620} cy={WORLD_CY - 390} rx={50} ry={90} fill="#3A6A8E" opacity={0.75} />

      {/* Soft rim around buildable field */}
      <Polygon points={rim} fill="#4C8C38" />
      <Polygon points={rim} fill="#3A6F34" opacity={0.35} />

      {/* Checker grass tiles */}
      <G>
        {tiles.map(({ i, j, dark }) => (
          <Polygon
            key={`${i},${j}`}
            points={tilePoly(i, j)}
            fill={dark ? '#7CB84A' : '#8FCB62'}
            opacity={0.98}
          />
        ))}
      </G>

      {/* Inner build border */}
      <Polygon
        points={buildOutline}
        fill="none"
        stroke="#5A9A40"
        strokeWidth={5}
        opacity={0.85}
      />

      {/* Dust / sparkle motes */}
      {Array.from({ length: 40 }).map((_, n) => {
        const a = (n / 40) * Math.PI * 2;
        const r = 80 + (n % 7) * 55;
        return (
          <Circle
            key={`mote-${n}`}
            cx={WORLD_CX + Math.cos(a) * r}
            cy={WORLD_CY + Math.sin(a) * r * 0.55}
            r={1.4 + (n % 3) * 0.4}
            fill="#F8F4E8"
            opacity={0.35 + (n % 4) * 0.1}
          />
        );
      })}

      {/* Tree ring */}
      {trees.map((t, idx) => (
        <G key={`tree-${idx}`}>
          <Ellipse cx={t.x} cy={t.y + t.s * 0.55} rx={t.s * 0.45} ry={t.s * 0.18} fill="#1A2814" opacity={0.28} />
          <Circle cx={t.x} cy={t.y} r={t.s} fill={FOLIAGE[t.tone]} />
          <Circle cx={t.x - t.s * 0.2} cy={t.y - t.s * 0.15} r={t.s * 0.35} fill="#E0C888" opacity={0.25} />
        </G>
      ))}
    </Svg>
  );
}

/** Convert isometric tile coords to world pixels (building pad centers). */
export function tileToWorld(i: number, j: number) {
  return iso(i, j);
}
