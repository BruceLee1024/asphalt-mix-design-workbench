import type { MarshallSpec, StandardProfile, StandardProfileId } from '../types';
import { GRADATION_KNOWLEDGE, MARSHALL_SPEC_KNOWLEDGE } from './knowledge';

export const DENSE_AC_TYPES = ['AC-13', 'AC-16', 'AC-20', 'AC-25', 'HM-20', 'RAP-AC-20'] as const;

export const GRADS = GRADATION_KNOWLEDGE;

export const SPECS: Record<string, MarshallSpec> = MARSHALL_SPEC_KNOWLEDGE;

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
  'SBR': 1.032,
  'HM': 1.040,
};
