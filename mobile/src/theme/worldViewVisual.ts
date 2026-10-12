/**
 * 2D visual helpers aligned with scene.html healthColor / PALETTE
 * (patchHealthy / patchDry / patchDepleted) for the same TerraWorldViewDTO.
 */

const HEALTHY = 0x3f6b46;
const DRY = 0x8a7a4a;
const DEPLETED = 0x4a4038;

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function hexColor(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function lerpHex(a: number, b: number, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  return hexColor(
    lerpChannel((a >> 16) & 255, (b >> 16) & 255, clamped),
    lerpChannel((a >> 8) & 255, (b >> 8) & 255, clamped),
    lerpChannel(a & 255, b & 255, clamped)
  );
}

/** Pad fill matching scene.html `healthColor(healthPct)`. */
export function worldViewPadColor(healthPct: number): string {
  if (healthPct >= 60) {
    const t = 1 - Math.min(1, (healthPct - 60) / 40);
    return lerpHex(HEALTHY, DRY, t * 0.25);
  }
  const t = Math.max(0, Math.min(1, (60 - healthPct) / 60));
  return lerpHex(DRY, DEPLETED, t);
}

/** Building stress flag aligned with wilting / negative available from DTO. */
export function worldViewBuildingStressed(healthPct: number, availableCents: number): boolean {
  return availableCents < 0 || healthPct < 30;
}
