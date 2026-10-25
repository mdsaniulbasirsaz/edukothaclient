// Shared look and helpers for the Users screen and its Statistics tab.
// Colours follow the admin console (Management.tsx, Room.tsx).
export const ui = {
	navy: '#042c6a',
	blue: '#1a81ec',
	blueDark: '#1668c4',
	blueLight: '#e8f2fd',
	orange: '#fe9b2a',
	orangeHover: '#e8851a',
	orangeLight: '#fff3e5',
	orangeText: '#c96a00',
	text: '#0f1f3a',
	body: '#334155',
	muted: '#5b6b82',
	line: '#d6e2f2',
	lineSoft: '#e2e8f0',
	grey: '#f1f5f9',
	slate: '#475569',
	slateDot: '#7d8ea8',
	green: '#177a45',
} as const;

// Chart colours for the three kinds of access, checked with the dataviz
// validator (all pairs, white surface, colour-blind safe). Amber and green
// sit under 3:1 on white, so every chart mark keeps a number or a legend.
export const accessColor = { member: '#3b82f6', admin: '#10b981', owner: '#f59e0b' } as const;
export const chartBlue = '#3b82f6';
export const chartBlueHover = '#1d4ed8';

export const asNumber = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v) : 0);
export const str = (v: unknown) => (typeof v === 'string' ? v : '');

export const initialsOf = (name: string, email: string) => {
	const source = name.trim() || email.replace(/@.*/, '');
	const parts = source.split(/[\s._-]+/).filter(Boolean);

	if (!parts.length) return '?';

	return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
};

export const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;
export const sectionLabelSx = { m: 0, fontSize: 12, lineHeight: '16px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: ui.slate } as const;
export const focusRing = { outline: `2px solid ${ui.blue}`, outlineOffset: 2 } as const;
export const squareInput = { borderRadius: 0, bgcolor: '#fff' } as const;
