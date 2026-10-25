import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/material/styles';

// Motion for the admin console (user brief 2026-10-18, "subtle": 150–250ms,
// small distances, no bounce). Everything here is switched off for people
// who ask their system for less motion.
export const reduceMotion = '@media (prefers-reduced-motion: reduce)';
const ease = 'cubic-bezier(0.2, 0, 0, 1)';

export const prefersLessMotion = () => {
	try {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	} catch {
		return false;
	}
};

const riseIn = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: none; }
`;
const drawCheck = keyframes`
	from { stroke-dashoffset: 16; }
	to { stroke-dashoffset: 0; }
`;

// A section fades and rises into place when it opens.
export const sectionEnterSx = {
	animation: `${riseIn} 200ms ${ease} both`,
	[reduceMotion]: { animation: 'none' },
} as const;

const fadeIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;
const glow = keyframes`
	0% { box-shadow: 0 0 0 3px rgba(254, 155, 42, 0.9), 0 0 0 8px rgba(254, 155, 42, 0.25); background-color: #fff3e5; }
	70% { box-shadow: 0 0 0 3px rgba(254, 155, 42, 0.6), 0 0 0 8px rgba(254, 155, 42, 0); background-color: #fff3e5; }
	100% { box-shadow: 0 0 0 0 rgba(254, 155, 42, 0); }
`;
const rowFlash = keyframes`
	from { background-color: #e8f2fd; }
	to { background-color: transparent; }
`;
const leave = keyframes`
	to { opacity: 0; transform: scale(0.94); }
`;

// A quick fade, for swapped content (a view change, a changed badge).
export const fadeInSx = {
	animation: `${fadeIn} 200ms ease-out both`,
	[reduceMotion]: { animation: 'none' },
} as const;

// "This one changed": an orange glow that fades out over about 1.2s.
export const glowSx = {
	animation: `${glow} 1200ms ease-out both`,
	[reduceMotion]: { animation: 'none', outline: '3px solid #fe9b2a' },
} as const;

const rowGlow = keyframes`
	0%, 60% { background-color: #fff3e5; }
	100% { background-color: transparent; }
`;

// The table version of the glow: the row's cells tint orange, then clear.
export const rowGlowSx = {
	'& > td': { animation: `${rowGlow} 1400ms ease-out both` },
	[reduceMotion]: { '& > td': { animation: 'none', bgcolor: '#fff3e5' } },
} as const;

// A switch row flashes light blue when it is flipped.
export const rowFlashSx = {
	animation: `${rowFlash} 700ms ease-out both`,
	[reduceMotion]: { animation: 'none' },
} as const;

// A deleted item fades and shrinks away before it is removed.
export const leaveMs = 250;
export const leaveSx = {
	pointerEvents: 'none',
	animation: `${leave} ${leaveMs}ms ${ease} both`,
	[reduceMotion]: { animation: 'none', opacity: 0.4 },
} as const;

// Cards rise in one after another the first time a list shows. Only the
// first 12 are staggered, so long lists still appear quickly.
export const staggerSx = (index: number, on: boolean) => (on ? {
	animation: `${riseIn} 220ms ${ease} both`,
	animationDelay: `${Math.min(index, 11) * 30}ms`,
	[reduceMotion]: { animation: 'none' },
} : {});

// True while a list's opening stagger may play: from mount until shortly
// after its items have arrived. Filtering later does not replay it.
export const useIntro = (ready: boolean) => {
	const [ done, setDone ] = useState(false);

	useEffect(() => {
		if (!ready || done) return;
		const t = window.setTimeout(() => setDone(true), 800);

		return () => window.clearTimeout(t);
	}, [ ready ]);

	return !done;
};

// Card hover lift: up 2px with a soft shadow. Pass the card's own inset
// shadow (the orange bottom bar) so both show.
export const liftShadow = '0 6px 16px rgba(4, 44, 106, 0.10)';
export const liftTransition = 'transform 180ms ease';
export const liftOn = (inset?: string) => ({
	transform: 'translateY(-2px)',
	boxShadow: inset ? `${liftShadow}, ${inset}` : liftShadow,
	[reduceMotion]: { transform: 'none' },
});

// Smooth filter changes (FLIP): children of `ref` marked with data-flip
// slide from their old place to the new one, and new ones fade in. Layout
// offsets are used, so a move that is still running is never measured.
export const useFlip = (ref: RefObject<HTMLElement | null>, signature: string) => {
	const prev = useRef<Map<string, { x: number; y: number }>>(new Map());
	const first = useRef(true);

	useLayoutEffect(() => {
		const root = ref.current;
		const next = new Map<string, { x: number; y: number }>();

		if (!root) {
			prev.current = next;

			return;
		}
		const animate = !first.current && !prefersLessMotion();

		root.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
			const key = el.dataset.flip ?? '';
			const pos = { x: el.offsetLeft, y: el.offsetTop };

			next.set(key, pos);
			if (!animate || typeof el.animate !== 'function') return;
			const old = prev.current.get(key);

			if (!old) {
				el.animate([ { opacity: 0 }, { opacity: 1 } ], { duration: 180, easing: 'ease-out' });

				return;
			}
			const dx = old.x - pos.x;
			const dy = old.y - pos.y;

			if (dx || dy) el.animate([ { transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' } ], { duration: 220, easing: ease });
		});
		if (next.size) first.current = false;
		prev.current = next;
	}, [ signature ]);
};

// Save success: the button turns green for a moment with a check that
// draws in. `savedAt` is the time of the last successful save (0 = none).
export const useJustSaved = (savedAt: number | boolean, ms = 1600) => {
	const [ on, setOn ] = useState(false);

	useEffect(() => {
		if (!savedAt) {
			setOn(false);

			return;
		}
		setOn(true);
		const t = window.setTimeout(() => setOn(false), ms);

		return () => window.clearTimeout(t);
	}, [ savedAt ]);

	return on;
};

export const savedButtonSx = {
	'&, &:hover, &.Mui-disabled': { bgcolor: '#177a45', color: '#fff', boxShadow: 'none' },
	transition: 'background-color 150ms ease, color 150ms ease',
} as const;

export const SavedTick = ({ label }: { label: string }) => (
	<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
		<Box component='svg' aria-hidden viewBox='0 0 16 16' sx={{ width: 16, height: 16, flexShrink: 0 }}>
			<Box
				component='path'
				d='M3 8.5 6.5 12 13 4.5'
				sx={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', strokeDasharray: 16, animation: `${drawCheck} 300ms ${ease} both`, [reduceMotion]: { animation: 'none' } }}
			/>
		</Box>
		{label}
	</Box>
);

// Counts up to the value, and from the old value to a new one. Screen
// readers get the final number only.
export const CountUp = ({ value, duration = 800 }: { value: number; duration?: number }) => {
	const [ shown, setShown ] = useState(() => (prefersLessMotion() ? value : 0));
	const current = useRef(shown);

	useEffect(() => {
		const from = current.current;

		if (from === value || prefersLessMotion()) {
			current.current = value;
			setShown(value);

			return;
		}
		const started = performance.now();
		let frame = 0;
		const step = (now: number) => {
			const t = Math.min(1, (now - started) / duration);
			const next = Math.round(from + ((value - from) * (1 - ((1 - t) ** 3))));

			current.current = next;
			setShown(next);
			if (t < 1) frame = requestAnimationFrame(step);
		};

		frame = requestAnimationFrame(step);

		return () => cancelAnimationFrame(frame);
	}, [ value ]);

	return <>
		<span aria-hidden>{shown.toLocaleString('en-US')}</span>
		<Box component='span' sx={{ position: 'absolute', width: 1, height: 1, p: 0, m: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>{value.toLocaleString('en-US')}</Box>
	</>;
};
