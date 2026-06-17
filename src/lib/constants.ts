import type { MarshallSpec, StandardProfile, StandardProfileId } from '../types';

export const DENSE_AC_TYPES = ['AC-13', 'AC-16', 'AC-20', 'AC-25'] as const;

export const GRADS = {
  'AC-13': {
    sieves: [16, 13.2, 9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075],
    lo: [100, 90, 68, 38, 24, 15, 10, 7, 5, 4],
    hi: [100, 100, 85, 68, 50, 38, 28, 20, 15, 8],
  },
  'AC-16': {
    sieves: [19, 16, 13.2, 9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075],
    lo: [100, 92, 76, 60, 34, 20, 13, 9, 7, 5, 4],
    hi: [100, 100, 92, 80, 62, 48, 36, 26, 18, 14, 8],
  },
  'AC-20': {
    sieves: [26.5, 19, 16, 13.2, 9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075],
    lo: [100, 90, 78, 62, 50, 26, 16, 10, 7, 5, 4, 3],
    hi: [100, 100, 92, 80, 72, 54, 40, 30, 22, 16, 12, 7],
  },
  'AC-25': {
    sieves: [31.5, 26.5, 19, 16, 13.2, 9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075],
    lo: [100, 90, 75, 60, 50, 40, 28, 15, 10, 7, 5, 3, 2],
    hi: [100, 100, 90, 78, 70, 60, 52, 38, 28, 20, 15, 10, 6],
  },
  'SMA-13': {
    sieves: [16, 13.2, 9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075],
    lo: [100, 90, 50, 20, 15, 14, 12, 10, 9, 8],
    hi: [100, 100, 75, 34, 24, 20, 16, 14, 13, 12],
  },
  'OGFC-13': {
    sieves: [16, 13.2, 9.5, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075],
    lo: [100, 90, 60, 10, 5, 4, 3, 2, 2, 2],
    hi: [100, 100, 80, 25, 15, 12, 10, 8, 6, 4],
  },
} as const;

export const SPECS: Record<string, MarshallSpec> = {
  hw: {
    ms: { lo: 8, hi: null },
    fl: { lo: 20, hi: 40 },
    vv: { lo: 3, hi: 5 },
    vma: { lo: 15, hi: null },
    vfa: { lo: 65, hi: 75 },
  },
  '2nd': {
    ms: { lo: 6, hi: null },
    fl: { lo: 20, hi: 45 },
    vv: { lo: 3, hi: 6 },
    vma: { lo: 14, hi: null },
    vfa: { lo: 60, hi: 75 },
  },
  '3rd': {
    ms: { lo: 5, hi: null },
    fl: { lo: 20, hi: 45 },
    vv: { lo: 3, hi: 6 },
    vma: { lo: 14, hi: null },
    vfa: { lo: 60, hi: 75 },
  },
};

export const STANDARD_PROFILES: Record<StandardProfileId, StandardProfile> = {
  'jtg-f40-2004-jtg3410-2025': {
    id: 'jtg-f40-2004-jtg3410-2025',
    label: 'JTG F40-2004 + JTG 3410-2025',
    designSpec: 'JTG F40-2004 公路沥青路面施工技术规范',
    testSpec: 'JTG 3410-2025 公路工程沥青及沥青混合料试验规程',
    effectiveFrom: '2025-10-01',
  },
  'jtg-f40-2004-jtge20-2011': {
    id: 'jtg-f40-2004-jtge20-2011',
    label: 'JTG F40-2004 + JTG E20-2011',
    designSpec: 'JTG F40-2004 公路沥青路面施工技术规范',
    testSpec: 'JTG E20-2011 公路工程沥青及沥青混合料试验规程',
    effectiveFrom: '2011-12-01',
  },
};

export const ASPHALT_DENSITIES: Record<string, number> = {
  '70A': 1.03,
  '90A': 1.025,
  '110A': 1.02,
  'SBS-ID': 1.035,
  'SBS-IC': 1.038,
};
