import type { BasicInfo, BlendDesign, MarshallPoint, MarshallSpec, OacResult, PerformanceCheck, MaterialSource } from '../types';

export function interp(xs: number[], ys: number[], x: number): number {
  if (xs.length === 0 || ys.length === 0) return 0;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];

  for (let i = 0; i < xs.length - 1; i++) {
    if (x >= xs[i] && x <= xs[i + 1]) {
      const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys[0];
}

export function interpMax(xs: number[], ys: number[], requireInteriorPeak = false): number | null {
  if (xs.length === 0 || ys.length === 0) return 0;
  let mi = 0;
  ys.forEach((v, i) => {
    if (v > ys[mi]) mi = i;
  });

  if (mi === 0 || mi === ys.length - 1) return requireInteriorPeak ? null : xs[mi];

  const x0 = xs[mi - 1], x1 = xs[mi], x2 = xs[mi + 1];
  const y0 = ys[mi - 1], y1 = ys[mi], y2 = ys[mi + 1];

  const num = x0 * x0 * (y1 - y2) + x1 * x1 * (y2 - y0) + x2 * x2 * (y0 - y1);
  const den = 2 * (x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1));

  return den === 0 ? x1 : num / den;
}

export function interpTarget(xs: number[], ys: number[], target: number): number | null {
  if (xs.length === 0 || ys.length === 0) return null;
  for (let i = 0; i < ys.length - 1; i++) {
    if ((ys[i] - target) * (ys[i + 1] - target) <= 0) {
      if (ys[i] === ys[i + 1]) return xs[i];
      const t = (target - ys[i]) / (ys[i + 1] - ys[i]);
      return xs[i] + t * (xs[i + 1] - xs[i]);
    }
  }
  return null;
}

export function calculateBlendGradation(materials: MaterialSource[]): BlendDesign {
  const total = materials.reduce((sum, m) => sum + Math.max(0, m.proportion || 0), 0);
  const sieveCount = materials[0]?.passRates.length ?? 0;
  const passRates = Array.from({ length: sieveCount }, (_, i) => {
    if (!total) return 0;
    const value = materials.reduce((sum, m) => sum + (m.passRates[i] ?? 0) * Math.max(0, m.proportion || 0), 0) / total;
    return round(value, 1);
  });

  const warnings: string[] = [];
  if (Math.abs(total - 100) > 0.2) warnings.push(`材料比例合计为 ${round(total, 1)}%，建议调整为 100%。`);
  materials.forEach(m => {
    if (m.passRates.length !== sieveCount) warnings.push(`${m.name} 的筛孔数据不完整。`);
  });

  return { passRates, totalProportion: round(total, 1), warnings };
}

export function validateGradation(
  passRates: number[],
  spec: { sieves: readonly number[]; lo: readonly number[]; hi: readonly number[] }
): string[] {
  const warnings: string[] = [];
  spec.sieves.forEach((sieve, i) => {
    const value = passRates[i] ?? 0;
    if (value < spec.lo[i] || value > spec.hi[i]) {
      warnings.push(`筛孔 ${sieve}mm 通过率 ${value}% 超出 ${spec.lo[i]}~${spec.hi[i]}%。`);
    }
  });

  const i03 = spec.sieves.findIndex(s => s === 0.3);
  const i06 = spec.sieves.findIndex(s => s === 0.6);
  if (i03 >= 0 && i06 >= 0 && passRates[i03] > passRates[i06]) {
    warnings.push('0.3mm~0.6mm 区间出现反向驼峰，应调整细集料或矿粉比例。');
  }
  return warnings;
}

export function fitBlendToMidpoint(materials: MaterialSource[], spec: { lo: readonly number[]; hi: readonly number[] }): MaterialSource[] {
  if (materials.length === 0) return materials;
  const mids = spec.lo.map((lo, i) => (lo + spec.hi[i]) / 2);
  let props = materials.map(m => Math.max(0, m.proportion || 0));
  props = normalizeProps(props);

  let step = 12;
  let bestScore = blendScore(materials, props, mids);
  for (let pass = 0; pass < 80; pass++) {
    let improved = false;
    for (let i = 0; i < props.length; i++) {
      for (let j = 0; j < props.length; j++) {
        if (i === j || props[j] < step) continue;
        const next = [...props];
        next[i] += step;
        next[j] -= step;
        const score = blendScore(materials, next, mids);
        if (score < bestScore) {
          props = next;
          bestScore = score;
          improved = true;
        }
      }
    }
    if (!improved) step *= 0.55;
    if (step < 0.05) break;
  }

  props = normalizeProps(props);
  return materials.map((m, i) => ({ ...m, proportion: round(props[i], 1) }));
}

export function calculateVolumetrics(point: MarshallPoint, basicInfo: Pick<BasicInfo, 'gammaSb'>): MarshallPoint {
  const next = { ...point };
  if (next.den && next.gt) {
    next.vv = round((1 - next.den / next.gt) * 100, 1);
  }
  if (next.den && next.oac && basicInfo.gammaSb) {
    next.vma = round((1 - (next.den / basicInfo.gammaSb) * (100 / (100 + next.oac))) * 100, 1);
    if (next.vma) next.vfa = round(((next.vma - next.vv) / next.vma) * 100, 1);
  }
  return next;
}

export function calculateTheoreticalMaxDensity(oac: number, gammaSa: number, denB: number): number {
  if (!gammaSa || !denB) return 0;
  return round((100 + oac) / (100 / gammaSa + oac / denB), 3);
}

export function calculateOacAnalysis(points: MarshallPoint[], spec: MarshallSpec): OacResult | null {
  const data = [...points].filter(p => p.oac && p.den && p.ms && p.gt).sort((a, b) => a.oac - b.oac);
  if (data.length < 5) return null;
  const xs = data.map(d => d.oac);
  const warnings: string[] = [];
  const vvTarget = (spec.vv.lo + (spec.vv.hi ?? spec.vv.lo)) / 2;
  const vfaTarget = (spec.vfa.lo + (spec.vfa.hi ?? spec.vfa.lo)) / 2;

  const a1Peak = interpMax(xs, data.map(d => d.den), true);
  const a2Peak = interpMax(xs, data.map(d => d.ms), true);
  const a3 = interpTarget(xs, data.map(d => d.vv), vvTarget);
  const a4 = interpTarget(xs, data.map(d => d.vfa), vfaTarget);
  if (a4 === null) warnings.push('VFA 曲线未覆盖目标中值，OAC1 按 a1、a2、a3 计算。');
  if (a1Peak === null || a2Peak === null) warnings.push('密度或稳定度曲线峰值未出现在试验区间内，OAC1 回退为空隙率目标值 a3。');
  if (a3 === null) warnings.push('空隙率曲线未穿越目标空隙率，无法可靠确定 OAC。');

  if (a3 === null) return null;
  const a1 = a1Peak ?? a3;
  const a2 = a2Peak ?? a3;
  const oac1 = (a1Peak === null || a2Peak === null)
    ? a3
    : average([a1, a2, a3, ...(a4 === null ? [] : [a4])]);

  const passingXs: number[] = [];
  const minX = xs[0];
  const maxX = xs[xs.length - 1];
  for (let x = minX; x <= maxX + 0.0001; x += 0.01) {
    const row = interpolatePoint(data, x);
    if (isWithin(row.ms, spec.ms) && isWithin(row.fl, spec.fl) && isWithin(row.vv, spec.vv) && isWithin(row.vfa, spec.vfa)) {
      passingXs.push(round(x, 2));
    }
  }

  const oacMin = passingXs.length ? passingXs[0] : null;
  const oacMax = passingXs.length ? passingXs[passingXs.length - 1] : null;
  const oac2 = oacMin !== null && oacMax !== null ? round((oacMin + oacMax) / 2, 3) : null;
  if (oac2 === null) warnings.push('未找到同时满足稳定度、流值、空隙率、VFA 的共同油石比范围。');
  const oac = oac2 === null ? oac1 : (oac1 + oac2) / 2;
  const finalPoint = interpolatePoint(data, oac);
  const checks = buildPerformanceChecks(finalPoint, spec);

  return {
    oac: round(oac, 3),
    oac1: round(oac1, 3),
    oac2,
    oacMin,
    oacMax,
    a1: round(a1, 3),
    a2: round(a2, 3),
    a3: round(a3, 3),
    a4: a4 === null ? null : round(a4, 3),
    den: round(finalPoint.den, 3),
    ms: round(finalPoint.ms, 1),
    fl: round(finalPoint.fl, 1),
    vv: round(finalPoint.vv, 1),
    vma: round(finalPoint.vma, 1),
    vfa: round(finalPoint.vfa, 1),
    checks,
    warnings,
  };
}

export function buildPerformanceChecks(point: Pick<MarshallPoint, 'ms' | 'fl' | 'vv' | 'vma' | 'vfa'>, spec: MarshallSpec): PerformanceCheck[] {
  return [
    check('ms', '稳定度 MS', point.ms, spec.ms, 'kN'),
    check('fl', '流值 FL', point.fl, spec.fl, '0.1mm'),
    check('vv', '空隙率 VV', point.vv, spec.vv, '%'),
    check('vma', '矿料间隙率 VMA', point.vma, spec.vma, '%'),
    check('vfa', '沥青饱和度 VFA', point.vfa, spec.vfa, '%'),
  ];
}

function interpolatePoint(data: MarshallPoint[], oac: number): MarshallPoint {
  const xs = data.map(d => d.oac);
  const at = (key: keyof MarshallPoint) => interp(xs, data.map(d => d[key] as number), oac);
  return {
    oac,
    den: at('den'),
    gt: at('gt'),
    ms: at('ms'),
    fl: at('fl'),
    vv: at('vv'),
    vma: at('vma'),
    vfa: at('vfa'),
  };
}

function check(key: PerformanceCheck['key'], label: string, value: number, range: { lo: number; hi: number | null }, unit: string): PerformanceCheck {
  return {
    key,
    label,
    value,
    requirement: range.hi === null ? `≥ ${range.lo} ${unit}` : `${range.lo}~${range.hi} ${unit}`,
    ok: isWithin(value, range),
  };
}

function isWithin(value: number, range: { lo: number; hi: number | null }): boolean {
  return value >= range.lo && (range.hi === null || value <= range.hi);
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function round(value: number, digits: number): number {
  const m = 10 ** digits;
  return Math.round((value + Number.EPSILON) * m) / m;
}

function normalizeProps(props: number[]): number[] {
  const total = props.reduce((sum, p) => sum + Math.max(0, p), 0);
  if (!total) return props.map((_, i) => (i === 0 ? 100 : 0));
  const normalized = props.map(p => Math.max(0, p) / total * 100);
  const drift = 100 - normalized.reduce((sum, p) => sum + p, 0);
  normalized[normalized.length - 1] += drift;
  return normalized;
}

function blendScore(materials: MaterialSource[], props: number[], target: number[]): number {
  const total = props.reduce((sum, p) => sum + p, 0) || 1;
  return target.reduce((sum, t, i) => {
    const v = materials.reduce((s, m, mi) => s + (m.passRates[i] ?? 0) * props[mi], 0) / total;
    return sum + (v - t) ** 2;
  }, 0);
}
