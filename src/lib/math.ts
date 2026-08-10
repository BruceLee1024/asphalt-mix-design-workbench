import type { BasicInfo, BlendDesign, MarshallPoint, MarshallSpec, OacResult, PerformanceCheck, MaterialSource, SpecialtyCheck, SpecialtyParameters } from '../types';

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

export function calculateBlendGradation(materials: MaterialSource[], rap?: SpecialtyParameters['rap']): BlendDesign {
  const sources = blendSources(materials, rap);
  const total = sources.reduce((sum, m) => sum + Math.max(0, m.proportion || 0), 0);
  const sieveCount = sources[0]?.passRates.length ?? materials[0]?.passRates.length ?? 0;
  const passRates = Array.from({ length: sieveCount }, (_, i) => {
    if (!total) return 0;
    const value = sources.reduce((sum, m) => sum + (m.passRates[i] ?? 0) * Math.max(0, m.proportion || 0), 0) / total;
    return round(value, 1);
  });

  const warnings: string[] = [];
  if (Math.abs(total - 100) > 0.2) warnings.push(`材料比例合计为 ${round(total, 1)}%，建议调整为 100%。`);
  sources.forEach(m => {
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

export function fitBlendToMidpoint(materials: MaterialSource[], spec: { lo: readonly number[]; hi: readonly number[]; sieves?: readonly number[] }, rap?: SpecialtyParameters['rap']): MaterialSource[] {
  if (materials.length === 0) return materials;
  const editableIndexes = materials.map((m, index) => m.type !== 'rap' || !rap?.enabled ? index : -1).filter(index => index >= 0);
  if (!editableIndexes.length) return materials;
  const editable = editableIndexes.map(index => materials[index]);
  const fixed = rapBlendSources(rap);
  const target = productionTargets(spec);
  const editableTotal = Math.max(0, 100 - fixed.reduce((sum, item) => sum + item.proportion, 0));
  let props = normalizeProps(editable.map(m => Math.max(0, m.proportion || 0)), editableTotal);

  let step = 12;
  let bestScore = blendScore([...editable, ...fixed], [...props, ...fixed.map(item => item.proportion)], target);
  for (let pass = 0; pass < 80; pass++) {
    let improved = false;
    for (let i = 0; i < props.length; i++) {
      for (let j = 0; j < props.length; j++) {
        if (i === j || props[j] < step) continue;
        const next = [...props];
        next[i] += step;
        next[j] -= step;
        const score = blendScore([...editable, ...fixed], [...next, ...fixed.map(item => item.proportion)], target);
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

  props = normalizeProps(props, editableTotal);
  return materials.map((material, index) => {
    const editableIndex = editableIndexes.indexOf(index);
    return editableIndex < 0 ? material : { ...material, proportion: round(props[editableIndex], 1) };
  });
}

export function calculateBinderBalance(oac: number, rap: SpecialtyParameters['rap']) {
  const recycledAsphalt = rap.enabled ? round(rap.content * rap.asphaltContent / 100, 3) : 0;
  const virginAsphalt = round(oac - recycledAsphalt, 3);
  return { targetOac: round(oac, 3), recycledAsphalt, virginAsphalt, ok: virginAsphalt >= 0 };
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
    method: 'marshall',
    sourceId: 'marshall-oac-common-range',
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

export function calculatePatentOac(vv1: number, vfa1: number, vv2: number, vfa2: number): OacResult | null {
  if (vv1 <= 0.4 || vv2 <= 0.4 || !vfa1 || !vfa2) return null;
  const oac2 = 2.52 / (vv2 - 0.4) + 7.85e-4 * vfa2 ** 2 - 0.066 * vfa2 + 4.89;
  const oac = 1.96e-4 * vfa1 ** 2 - 0.0165 * vfa1 + 0.63 / (vv1 - 0.4) + 2.42 + oac2 / 2;
  const warnings: string[] = [];
  if (vv1 < 3 || vv1 > 6 || vv2 < 3 || vv2 > 6) warnings.push('专利 OAC 直算输入 VV 超出常用目标范围，需复核适用性。');
  if (vfa1 < 60 || vfa1 > 80 || vfa2 < 60 || vfa2 > 80) warnings.push('专利 OAC 直算输入 VFA 超出常用目标范围，需复核适用性。');

  return {
    method: 'patent-oac',
    sourceId: 'patent-modified-asphalt-oac',
    oac: round(oac, 3),
    oac1: round(oac, 3),
    oac2: round(oac2, 3),
    oacMin: null,
    oacMax: null,
    a1: 0,
    a2: 0,
    a3: 0,
    a4: null,
    den: 0,
    ms: 0,
    fl: 0,
    vv: round(vv1, 1),
    vma: 0,
    vfa: round(vfa1, 1),
    checks: [],
    warnings,
  };
}

export function calculateSuperpaveResult(params: SpecialtyParameters['superpave']): OacResult | null {
  if (!params.asphaltContentAtNdes || !params.gmmAtNdes) return null;
  const warnings: string[] = [];
  if (Math.abs(params.gmmAtNdes - 96) > 0.5) warnings.push('Ndes 压实度未接近 96%Gmm（空隙率 4%），应通过试验插值修正最佳沥青用量。');
  if (params.gmmAtNmax >= 98) warnings.push('Nmax 压实度不小于 98%Gmm，存在后期压密、车辙或泛油风险。');
  return {
    method: 'superpave',
    sourceId: 'superpave-sgc-4vv',
    oac: round(params.asphaltContentAtNdes, 3),
    oac1: round(params.asphaltContentAtNdes, 3),
    oac2: null,
    oacMin: null,
    oacMax: null,
    a1: params.nini,
    a2: params.ndes,
    a3: params.nmax,
    a4: null,
    den: 0,
    ms: 0,
    fl: 0,
    vv: round(100 - params.gmmAtNdes, 1),
    vma: 0,
    vfa: 0,
    checks: [],
    warnings,
  };
}

export function buildSpecialtyChecks(basicInfo: Pick<BasicInfo, 'mixType' | 'designMethod'>, params: SpecialtyParameters): SpecialtyCheck[] {
  const checks: SpecialtyCheck[] = [];

  if (basicInfo.mixType === 'SMA-13') {
    checks.push({
      id: 'sma-vma',
      label: 'SMA VMA',
      value: params.sma.vma ? `${params.sma.vma}%` : '待录入',
      requirement: 'VMA >= 18%',
      ok: params.sma.vma > 0 ? params.sma.vma >= 18 : null,
      sourceId: 'term-vma',
      message: 'SMA 应满足足够矿料间隙率以容纳玛蹄脂并保证耐久性。',
      severity: 'blocking',
    });
    checks.push({
      id: 'sma-vca',
      label: 'SMA 粗集料骨架间隙率',
      value: params.sma.vcadrc && params.sma.vcamix ? `${params.sma.vcamix}% / ${params.sma.vcadrc}%` : '待录入',
      requirement: 'VCAmix <= VCADRC',
      ok: params.sma.vcadrc > 0 && params.sma.vcamix > 0 ? params.sma.vcamix <= params.sma.vcadrc : null,
      sourceId: 'term-vca',
      message: 'VCAmix 不大于 VCADRC 时，粗集料骨架嵌挤结构判定为有效。',
      severity: 'blocking',
    });
  }

  if (params.rap.enabled || basicInfo.mixType === 'RAP-AC-20') {
    checks.push({
      id: 'rap-moisture',
      label: 'RAP 含水率',
      value: `${params.rap.moisture}%`,
      requirement: '<= 3%',
      ok: params.rap.moisture > 0 ? params.rap.moisture <= 3 : null,
      sourceId: 'mat-rap',
      message: 'RAP 含水率超限会造成加热能耗升高、拌和不均和水稳定风险。',
      severity: 'blocking',
    });
    checks.push({
      id: 'rap-max-size',
      label: 'RAP 最大颗粒粒径',
      value: `${params.rap.maxParticleSize}mm`,
      requirement: '<= 26.5mm',
      ok: params.rap.maxParticleSize > 0 ? params.rap.maxParticleSize <= 26.5 : null,
      sourceId: 'mat-rap',
      message: 'RAP 最大颗粒粒径宜不大于 26.5mm，超限时应破碎筛分或调整再生料处理工艺。',
      severity: 'blocking',
    });
  }

  if (basicInfo.designMethod === 'superpave') {
    checks.push({
      id: 'superpave-ndes',
      label: 'Ndes 空隙率',
      value: params.superpave.gmmAtNdes ? `${round(100 - params.superpave.gmmAtNdes, 1)}%` : '待录入',
      requirement: 'VV = 4%',
      ok: params.superpave.gmmAtNdes > 0 ? Math.abs(params.superpave.gmmAtNdes - 96) <= 0.5 : null,
      sourceId: 'superpave-sgc-4vv',
      message: 'Superpave 以 Ndes 转数下空隙率 4% 对应沥青含量作为设计沥青用量。',
      severity: 'blocking',
    });
    checks.push({
      id: 'superpave-nmax',
      label: 'Nmax 压密度',
      value: params.superpave.gmmAtNmax ? `${params.superpave.gmmAtNmax}%Gmm` : '待录入',
      requirement: '< 98%Gmm',
      ok: params.superpave.gmmAtNmax > 0 ? params.superpave.gmmAtNmax < 98 : null,
      sourceId: 'superpave-sgc-nmax',
      message: 'Nmax 压密度应小于 98%Gmm，以降低后期车辙和泛油风险。',
      severity: 'blocking',
    });
  }

  return checks;
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

function normalizeProps(props: number[], target = 100): number[] {
  const total = props.reduce((sum, p) => sum + Math.max(0, p), 0);
  if (!total) return props.map((_, i) => (i === 0 ? target : 0));
  const normalized = props.map(p => Math.max(0, p) / total * target);
  const drift = target - normalized.reduce((sum, p) => sum + p, 0);
  normalized[normalized.length - 1] += drift;
  return normalized;
}

function blendScore(materials: Array<Pick<MaterialSource, 'passRates'>>, props: number[], target: number[]): number {
  const total = props.reduce((sum, p) => sum + p, 0) || 1;
  return target.reduce((sum, t, i) => {
    const v = materials.reduce((s, m, mi) => s + (m.passRates[i] ?? 0) * props[mi], 0) / total;
    return sum + (v - t) ** 2;
  }, 0);
}

function blendSources(materials: MaterialSource[], rap?: SpecialtyParameters['rap']): Array<Pick<MaterialSource, 'name' | 'proportion' | 'passRates'>> {
  const native = rap?.enabled ? materials.filter(material => material.type !== 'rap') : materials;
  return [...native, ...rapBlendSources(rap)];
}

function rapBlendSources(rap?: SpecialtyParameters['rap']): Array<Pick<MaterialSource, 'name' | 'proportion' | 'passRates'>> {
  if (!rap?.enabled || rap.content <= 0) return [];
  const fractions = rap.fractions?.length ? rap.fractions : [];
  if (!fractions.length) return [];
  return fractions.map(fraction => ({
    name: `RAP ${fraction.label}`,
    proportion: rap.content * Math.max(0, fraction.yield) / 100,
    passRates: fraction.passRates,
  }));
}

function productionTargets(spec: { lo: readonly number[]; hi: readonly number[]; sieves?: readonly number[] }) {
  return spec.lo.map((lo, index) => {
    const hi = spec.hi[index];
    const mid = (lo + hi) / 2;
    const sieve = spec.sieves?.[index];
    if (sieve === 9.5) return (mid + hi) / 2;
    if (sieve === 4.75) return mid;
    if (sieve === 2.36) return mid + (hi - mid) * 0.2;
    if (sieve !== undefined && sieve < 2.36) return (lo + mid) / 2;
    return mid;
  });
}
