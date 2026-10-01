import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Text as SvgText } from 'react-native-svg';
import type { DistrictId, PocketId } from '@/types';
import { themeFor } from '@/theme/categoryTheme';

export interface BuildingSvgProps {
  size?: number;
  overspent?: boolean;
  fill?: number;
}

type PlaceableId = Exclude<DistrictId, 'credit_card_payment'>;

export function GenericBuilding({
  size = 112,
  overspent,
  themeId,
}: BuildingSvgProps & { themeId: PocketId }) {
  const ox = 50;
  const oy = 90;
  const t = themeFor(themeId);
  const top = overspent ? '#B8A898' : t.top;
  const left = overspent ? '#8A8074' : t.left;
  const right = overspent ? '#C9BBA8' : t.right;
  const roofL = overspent ? '#8E422C' : t.roofL;
  const roofR = overspent ? '#B85A3A' : t.roofR;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 112">
      <ContactShadow cx={52} cy={100} />
      <IsoBox ox={ox} oy={oy} w={24} depth={18} h={17} top={top} left={left} right={right} />
      <GableRoof ox={ox} oy={oy} w={24} depth={18} h={17} rise={9} left={roofL} right={roofR} />
      <FaceWindow ox={ox} oy={oy} x={4} z={6} lit={!overspent} />
      <FaceWindow ox={ox} oy={oy} x={10.5} z={6} lit />
      <FaceWindow ox={ox} oy={oy} x={17} z={6} lit={!overspent} />
      <Path
        d={poly([iso(10, 0.12, 0, ox, oy), iso(14, 0.12, 0, ox, oy), iso(14, 0.12, 9, ox, oy), iso(10, 0.12, 9, ox, oy)])}
        fill={t.accent}
        opacity={0.85}
      />
    </Svg>
  );
}

function themedBuilding(themeId: PlaceableId): React.FC<BuildingSvgProps> {
  return function ThemedBuilding(props) {
    return <GenericBuilding {...props} themeId={themeId} />;
  };
}

export function iso(x: number, y: number, z: number, ox = 0, oy = 0) {
  return { x: ox + (x - y) * 0.866, y: oy + (x + y) * 0.5 - z };
}

function poly(pts: { x: number; y: number }[]) {
  return `${pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} Z`;
}

function IsoBox({
  ox,
  oy,
  w,
  depth,
  h,
  top,
  left,
  right,
}: {
  ox: number;
  oy: number;
  w: number;
  depth: number;
  h: number;
  top: string;
  left: string;
  right: string;
}) {
  const p = (x: number, y: number, z: number) => iso(x, y, z, ox, oy);
  return (
    <G>
      <Path d={poly([p(0, 0, 0), p(0, depth, 0), p(0, depth, h), p(0, 0, h)])} fill={left} />
      <Path d={poly([p(0, 0, 0), p(w, 0, 0), p(w, 0, h), p(0, 0, h)])} fill={right} />
      <Path d={poly([p(0, 0, h), p(w, 0, h), p(w, depth, h), p(0, depth, h)])} fill={top} />
      <Path
        d={`M${p(w, 0, h).x.toFixed(1)} ${p(w, 0, h).y.toFixed(1)} L${p(w, depth, h).x.toFixed(1)} ${p(w, depth, h).y.toFixed(1)}`}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth={1.1}
      />
    </G>
  );
}

function FaceWindow({
  ox,
  oy,
  x,
  z,
  w = 3.2,
  h = 3.6,
  lit = true,
}: {
  ox: number;
  oy: number;
  x: number;
  z: number;
  w?: number;
  h?: number;
  lit?: boolean;
}) {
  const p = (px: number, py: number, pz: number) => iso(px, py, pz, ox, oy);
  const pts = [p(x, 0.15, z), p(x + w, 0.15, z), p(x + w, 0.15, z + h), p(x, 0.15, z + h)];
  const c = p(x + w / 2, 0.15, z + h / 2);
  return (
    <G>
      {lit ? <Circle cx={c.x} cy={c.y} r={6.4} fill="#FFE08A" opacity={0.42} /> : null}
      <Path d={poly(pts)} fill={lit ? '#FFE9A8' : '#5C5348'} />
    </G>
  );
}

function GableRoof({
  ox,
  oy,
  w,
  depth,
  h,
  rise,
  left,
  right,
}: {
  ox: number;
  oy: number;
  w: number;
  depth: number;
  h: number;
  rise: number;
  left: string;
  right: string;
}) {
  const p = (x: number, y: number, z: number) => iso(x, y, z, ox, oy);
  const ridgeL = p(w / 2, 0, h + rise);
  const ridgeR = p(w / 2, depth, h + rise);
  return (
    <G>
      <Path d={poly([p(0, 0, h), p(w, 0, h), ridgeL])} fill={right} />
      <Path d={poly([p(0, depth, h), p(w, depth, h), ridgeR])} fill={left} />
      <Path d={poly([p(0, 0, h), p(0, depth, h), ridgeR, ridgeL])} fill={left} />
      <Path d={poly([p(w, 0, h), p(w, depth, h), ridgeR, ridgeL])} fill={right} />
    </G>
  );
}

function ContactShadow({ cx, cy }: { cx: number; cy: number }) {
  return <Ellipse cx={cx} cy={cy} rx={16} ry={4.5} fill="#1A331C" opacity={0.18} />;
}

export function DinerBuilding({ size = 112, overspent }: BuildingSvgProps) {
  const ox = 54;
  const oy = 86;
  const t = themeFor('dining');
  const roofR = overspent ? '#B85A3A' : t.roofR;
  const roofL = overspent ? '#8E422C' : t.roofL;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110">
      <ContactShadow cx={52} cy={96} />
      <IsoBox ox={ox} oy={oy} w={26} depth={20} h={16} top={t.top} left={t.left} right={t.right} />
      <GableRoof ox={ox} oy={oy} w={26} depth={20} h={16} rise={11} left={roofL} right={roofR} />
      <FaceWindow ox={ox} oy={oy} x={4} z={6} lit />
      <FaceWindow ox={ox} oy={oy} x={10.5} z={6} lit />
      <FaceWindow ox={ox} oy={oy} x={17} z={6} lit={!overspent} />
      <Path
        d={poly([iso(11, 0.1, 0, ox, oy), iso(15, 0.1, 0, ox, oy), iso(15, 0.1, 8, ox, oy), iso(11, 0.1, 8, ox, oy)])}
        fill="#6B3E24"
      />
      <SvgText
        x={iso(13, 0.2, 24, ox, oy).x}
        y={iso(13, 0.2, 24, ox, oy).y}
        fill={t.top}
        fontSize="6.5"
        fontWeight="700"
        textAnchor="middle"
      >
        DINER
      </SvgText>
    </Svg>
  );
}

export function PropertyBuilding({ size = 118, overspent }: BuildingSvgProps) {
  const ox = 50;
  const oy = 96;
  const t = themeFor('property');
  const top = overspent ? '#C9BBA8' : t.top;
  const left = overspent ? '#A89886' : t.left;
  const right = overspent ? '#D2C4B0' : t.right;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 120">
      <ContactShadow cx={50} cy={108} />
      <IsoBox ox={ox} oy={oy} w={22} depth={18} h={34} top={top} left={left} right={right} />
      {[8, 16, 24].map((z) => (
        <G key={z}>
          <FaceWindow ox={ox} oy={oy} x={4} z={z} lit={!overspent || z === 24} />
          <FaceWindow ox={ox} oy={oy} x={10} z={z} lit={!overspent} />
          <FaceWindow ox={ox} oy={oy} x={16} z={z} lit={z !== 16} />
        </G>
      ))}
      {overspent ? (
        <G>
          <Path
            d={`M${iso(12, 0, 34, ox, oy).x} ${iso(12, 0, 34, ox, oy).y} L${iso(18, 0, 18, ox, oy).x} ${iso(18, 0, 18, ox, oy).y}`}
            stroke="#8A7A6A"
            strokeWidth={1.2}
          />
          <Path d={poly([iso(-3, 4, 0, ox, oy), iso(-1.5, 4, 0, ox, oy), iso(-1.5, 4, 28, ox, oy), iso(-3, 4, 28, ox, oy)])} fill="#A89880" />
          <Path d={poly([iso(24, 4, 0, ox, oy), iso(25.5, 4, 0, ox, oy), iso(25.5, 4, 28, ox, oy), iso(24, 4, 28, ox, oy)])} fill="#C4B8A4" />
          <Path d={`M${iso(-3, 4, 20, ox, oy).x} ${iso(-3, 4, 20, ox, oy).y} L${iso(25.5, 4, 20, ox, oy).x} ${iso(25.5, 4, 20, ox, oy).y}`} stroke="#B8A888" strokeWidth={1.4} />
        </G>
      ) : null}
    </Svg>
  );
}

export function ClockTowerBuilding({ size = 120, overspent }: BuildingSvgProps) {
  const ox = 52;
  const oy = 102;
  const t = themeFor('bills');
  const gold = overspent ? '#C47A4A' : t.roofR;
  const goldDark = overspent ? '#9A5A32' : t.roofL;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 124">
      <ContactShadow cx={50} cy={112} />
      <IsoBox ox={ox} oy={oy} w={12} depth={12} h={36} top={t.top} left={t.left} right={t.right} />
      <Path
        d={poly([
          iso(0, 0, 36, ox, oy),
          iso(12, 0, 36, ox, oy),
          iso(6, 6, 50, ox, oy),
        ])}
        fill={gold}
      />
      <Path
        d={poly([
          iso(0, 0, 36, ox, oy),
          iso(0, 12, 36, ox, oy),
          iso(6, 6, 50, ox, oy),
        ])}
        fill={goldDark}
      />
      <Path
        d={poly([
          iso(12, 0, 36, ox, oy),
          iso(12, 12, 36, ox, oy),
          iso(6, 6, 50, ox, oy),
        ])}
        fill={gold}
      />
      <FaceWindow ox={ox} oy={oy} x={4.4} z={8} w={3.4} h={5} />
      <FaceWindow ox={ox} oy={oy} x={4.4} z={18} w={3.4} h={5} />
      <FaceWindow ox={ox} oy={oy} x={4.4} z={28} w={3.4} h={4.2} lit={!overspent} />
    </Svg>
  );
}

export function TrainStationBuilding({ size = 118, overspent }: BuildingSvgProps) {
  const ox = 40;
  const oy = 88;
  const t = themeFor('transport');
  return (
    <Svg width={size} height={size} viewBox="0 0 120 110">
      <ContactShadow cx={58} cy={98} />
      <IsoBox
        ox={ox}
        oy={oy}
        w={28}
        depth={14}
        h={10}
        top={overspent ? '#8A8074' : t.top}
        left={t.left}
        right={t.right}
      />
      <IsoBox ox={ox + 8} oy={oy - 2} w={8} depth={8} h={7} top={t.roofR} left={t.roofL} right={t.accent} />
      <Path
        d={`M${iso(2, 16, 0, ox, oy).x} ${iso(2, 16, 0, ox, oy).y} L${iso(30, 16, 0, ox, oy).x} ${iso(30, 16, 0, ox, oy).y}`}
        stroke={t.roofL}
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <Path
        d={`M${iso(2, 16, 0.6, ox, oy).x} ${iso(2, 16, 0.6, ox, oy).y} L${iso(30, 16, 0.6, ox, oy).x} ${iso(30, 16, 0.6, ox, oy).y}`}
        stroke={t.ink}
        strokeWidth={1.1}
        strokeDasharray="3 3"
      />
    </Svg>
  );
}

export function BarnBuilding({ size = 118, overspent }: BuildingSvgProps) {
  const ox = 48;
  const oy = 90;
  const t = themeFor('groceries');
  const wallR = overspent ? '#8A5A42' : t.right;
  const wallL = overspent ? '#6A4230' : t.left;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 112">
      <ContactShadow cx={54} cy={100} />
      <IsoBox ox={ox} oy={oy} w={24} depth={18} h={16} top={t.top} left={wallL} right={wallR} />
      <GableRoof ox={ox} oy={oy} w={24} depth={18} h={16} rise={10} left={t.roofL} right={t.roofR} />
      <Path
        d={poly([iso(9, 0.12, 0, ox, oy), iso(15, 0.12, 0, ox, oy), iso(15, 0.12, 10, ox, oy), iso(12, 0.12, 13, ox, oy), iso(9, 0.12, 10, ox, oy)])}
        fill="#E8D7A3"
      />
      <IsoBox ox={ox + 18} oy={oy + 10} w={8} depth={6} h={2.2} top={t.accent} left={t.roofL} right={t.roofR} />
      <IsoBox ox={ox + 10} oy={oy + 12} w={6} depth={5} h={2.2} top={t.pad} left={t.roofL} right={t.accent} />
    </Svg>
  );
}

export function VaultBuilding({ size = 148, overspent, fill = 0 }: BuildingSvgProps) {
  const ox = 58;
  const oy = 118;
  const t = themeFor('vault');
  const right = overspent ? '#E8C8A8' : t.right;
  const left = overspent ? '#C9A888' : t.left;
  const top = overspent ? '#EEDCC0' : t.top;
  const glow = 0.16 + fill * 0.42;
  return (
    <Svg width={size} height={size} viewBox="0 0 130 148">
      <Ellipse cx={64} cy={72} rx={52} ry={52} fill={t.accent} opacity={glow} />
      <ContactShadow cx={62} cy={132} />
      <IsoBox ox={ox} oy={oy} w={18} depth={18} h={44} top={top} left={left} right={right} />
      {[6, 14, 22, 30, 38].map((z) => (
        <G key={z}>
          <FaceWindow ox={ox} oy={oy} x={3.2} z={z} w={3} h={3.4} lit />
          <FaceWindow ox={ox} oy={oy} x={7.6} z={z} w={3} h={3.4} lit />
          <FaceWindow ox={ox} oy={oy} x={12} z={z} w={3} h={3.4} lit />
        </G>
      ))}
      <Path
        d={poly([
          iso(1, 1, 44, ox, oy),
          iso(17, 1, 44, ox, oy),
          iso(17, 17, 44, ox, oy),
          iso(1, 17, 44, ox, oy),
        ])}
        fill={t.roofR}
      />
      <Ellipse cx={iso(9, 9, 50, ox, oy).x} cy={iso(9, 9, 50, ox, oy).y} rx={11} ry={7} fill={t.accent} />
      <Ellipse cx={iso(9, 9, 54, ox, oy).x} cy={iso(9, 9, 54, ox, oy).y} rx={8} ry={5} fill={t.ink} />
      <Circle cx={iso(9, 9, 58, ox, oy).x} cy={iso(9, 9, 58, ox, oy).y} r={2.2} fill={t.roofR} />
    </Svg>
  );
}

export function CottageDecor({ size = 88 }: { size?: number }) {
  const ox = 50;
  const oy = 78;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 96">
      <ContactShadow cx={48} cy={86} />
      <IsoBox ox={ox} oy={oy} w={18} depth={16} h={10} top="#E8C8A0" left="#C48A48" right="#E0A45C" />
      <GableRoof ox={ox} oy={oy} w={18} depth={16} h={10} rise={12} left="#B56C28" right="#D0893A" />
    </Svg>
  );
}

export function ShopDecor({ size = 100 }: { size?: number }) {
  const ox = 48;
  const oy = 86;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 108">
      <ContactShadow cx={52} cy={96} />
      <IsoBox ox={ox} oy={oy} w={22} depth={16} h={18} top="#F3E6C4" left="#D2C2A4" right="#F0E4CC" />
      <GableRoof ox={ox} oy={oy} w={22} depth={16} h={18} rise={8} left="#B56C28" right="#D0893A" />
      <FaceWindow ox={ox} oy={oy} x={4} z={8} />
      <FaceWindow ox={ox} oy={oy} x={12} z={8} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Path
          key={i}
          d={poly([
            iso(2 + i * 3.6, -0.8, 7.2, ox, oy),
            iso(5 + i * 3.6, -0.8, 7.2, ox, oy),
            iso(5 + i * 3.6, -0.8, 4.2, ox, oy),
            iso(2 + i * 3.6, -0.8, 4.2, ox, oy),
          ])}
          fill={i % 2 ? '#E07A3A' : '#F7F0DE'}
        />
      ))}
    </Svg>
  );
}

export function DerrickDecor({ size = 90 }: { size?: number }) {
  const ox = 48;
  const oy = 86;
  return (
    <Svg width={size} height={size} viewBox="0 0 90 110">
      <ContactShadow cx={44} cy={98} />
      <IsoBox ox={ox} oy={oy} w={10} depth={10} h={8} top="#D8D0C4" left="#A8A090" right="#E8E2D6" />
      <Path
        d={`M${iso(5, 5, 8, ox, oy).x} ${iso(5, 5, 8, ox, oy).y} L${iso(5, 5, 32, ox, oy).x} ${iso(5, 5, 32, ox, oy).y}`}
        stroke="#C4B8A4"
        strokeWidth={2.4}
      />
      <Circle cx={iso(5, 5, 34, ox, oy).x} cy={iso(5, 5, 34, ox, oy).y} r={3.4} fill="#F8DE7A" />
      <Circle cx={iso(5, 5, 34, ox, oy).x} cy={iso(5, 5, 34, ox, oy).y} r={6} fill="#FFE08A" opacity={0.28} />
    </Svg>
  );
}

function Star({ x, y, r = 3 }: { x: number; y: number; r?: number }) {
  const d = `M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`;
  return <Path d={d} fill="#F8DE7A" opacity={0.9} />;
}

export function SceneSparkles() {
  return (
    <G>
      <Star x={220} y={96} r={4.5} />
      <Star x={168} y={128} r={2.4} />
      <Star x={272} y={128} r={2.4} />
      <Star x={148} y={188} r={2} />
      <Star x={292} y={188} r={2} />
      <Circle cx={200} cy={108} r={1.3} fill="#F4E6A8" />
      <Circle cx={240} cy={108} r={1.3} fill="#F4E6A8" />
    </G>
  );
}

/** Empty plot scaffold — Clash-style “build here” marker. */
export function EmptyPlotBuilding({ size = 120 }: BuildingSvgProps) {
  const ox = 48;
  const oy = 92;
  return (
    <Svg width={size} height={size} viewBox="0 0 96 110">
      <Ellipse cx={48} cy={98} rx={28} ry={8} fill="#0E1A12" opacity={0.22} />
      {/* dashed pad ring feel */}
      <Ellipse cx={48} cy={88} rx={30} ry={12} fill="none" stroke="#F4E6A8" strokeWidth={1.6} strokeDasharray="4 3" opacity={0.7} />
      <IsoBox ox={ox - 10} oy={oy} w={8} depth={8} h={14} top="#C9A24A" left="#8A7028" right="#E8C45A" />
      <IsoBox ox={ox + 6} oy={oy + 2} w={7} depth={7} h={10} top="#D4B25A" left="#8A7028" right="#F0D078" />
      {/* + flag */}
      <Path
        d={`M${iso(4, 4, 16, ox - 10, oy).x} ${iso(4, 4, 16, ox - 10, oy).y} L${iso(4, 4, 28, ox - 10, oy).x} ${iso(4, 4, 28, ox - 10, oy).y}`}
        stroke="#F4E6A8"
        strokeWidth={2}
      />
      <Circle cx={iso(4, 4, 30, ox - 10, oy).x} cy={iso(4, 4, 30, ox - 10, oy).y} r={5} fill="#E8A24B" />
      <SvgText
        x={iso(4, 4, 30, ox - 10, oy).x}
        y={iso(4, 4, 30, ox - 10, oy).y + 3.5}
        fill="#1B2E24"
        fontSize="8"
        fontWeight="700"
        textAnchor="middle"
      >
        +
      </SvgText>
    </Svg>
  );
}

export const BUILDING_BY_ID: Record<PlaceableId, React.FC<BuildingSvgProps>> = {
  dining: DinerBuilding,
  property: PropertyBuilding,
  bills: ClockTowerBuilding,
  transport: TrainStationBuilding,
  groceries: BarnBuilding,
  supermarket: themedBuilding('supermarket'),
  cinema: themedBuilding('cinema'),
  library: themedBuilding('library'),
  university: themedBuilding('university'),
  hospital: themedBuilding('hospital'),
  school: themedBuilding('school'),
  factory: themedBuilding('factory'),
  office: themedBuilding('office'),
  mall: themedBuilding('mall'),
  car_workshop: themedBuilding('car_workshop'),
};
