const KNOWN_LABELS: [RegExp, string][] = [
  [/^3d\s*spatial\s*distribution/i, '3D Spatial Distribution'],
  [/^spatial\s*distribution/i, 'Spatial Distribution'],
  [/^cmd\s*first\s*cut/i, 'CMD Selection'],
  [/^cs\s*functions/i, 'Criteria Score Functions'],
  [/^cs\s*distribution/i, 'Criteria Score Distribution'],
  [/^escapers/i, 'Escapers Kinematic Distribution']
]

const KNOWN_ORDER: [RegExp, number][] = [
  [/^spatial\s*distribution/i, 10],
  [/^3d\s*spatial\s*distribution/i, 20],
  [/^cmd\s*first\s*cut/i, 30],
  [/^cs\s*functions/i, 40],
  [/^cs\s*distribution/i, 50],
  [/^escapers/i, 60]
]

export function prettyImageLabel(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')

  for (const [pattern, label] of KNOWN_LABELS) {
    if (pattern.test(base)) {
      return label
    }
  }

  return base
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

export function imageSortRank(filename: string): number {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')

  for (const [pattern, rank] of KNOWN_ORDER) {
    if (pattern.test(base)) {
      return rank
    }
  }

  return 100
}
