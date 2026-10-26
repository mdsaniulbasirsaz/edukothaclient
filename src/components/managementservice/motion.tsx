import { MouseEvent, ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
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

// ----- 3D hover card (user brief 2026-10-26) -----
// A white, square card that tilts toward the cursor (at most 6°), lifts 6px
// and floats on a deeper shadow; a blue border with a soft ring, a 4px top
// bar and a pale light that follows the cursor fade in. Its layers float at
// different depths: mark the icon tile with tiltLayer.icon (36px), the title
// with tiltLayer.title (20px) and the description with tiltLayer.desc (10px);
// everything else stays on the card face. The cursor position is written to
// CSS variables once per frame, so moving the mouse never re-renders React.
// Only a real mouse tilts (no sticky tilt after a tap); keyboard focus inside
// the card lifts it without tilting; with reduced motion it only lifts a little.
const TILT_MAX = 6;
const tiltEase = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const finePointer = '@media (hover: hover) and (pointer: fine)';
const INTER_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';

export const tiltLayer = { icon: 'tilt-icon', title: 'tilt-title', desc: 'tilt-desc' } as const;

const tiltPalette = {
	blue: { accent: '#1a81ec', ring: 'rgba(26, 129, 236, 0.12)', shadow: 'rgba(26, 129, 236, 0.30)' },
	orange: { accent: '#fe9b2a', ring: 'rgba(254, 155, 42, 0.16)', shadow: 'rgba(254, 155, 42, 0.30)' },
} as const;

// Inter is not part of the console's own fonts; the cards load it once.
const useInterFont = () => {
	useEffect(() => {
		if (document.querySelector(`link[href="${INTER_HREF}"]`)) return;
		const link = document.createElement('link');

		link.rel = 'stylesheet';
		link.href = INTER_HREF;
		document.head.appendChild(link);
	}, []);
};

type TiltCardProps = {
	children: ReactNode;
	// Orange instead of blue, for cards that need attention.
	accent?: 'blue' | 'orange';
	// Resting border colour (default #DFE6EF).
	restBorder?: string;
	component?: React.ElementType;
	sx?: SxProps<Theme>;
};

export const TiltCard = ({ children, accent = 'blue', restBorder = '#dfe6ef', component = 'article', sx }: TiltCardProps) => {
	const ref = useRef<HTMLElement>(null);
	const frame = useRef(0);
	const c = tiltPalette[accent];

	useInterFont();
	useEffect(() => () => cancelAnimationFrame(frame.current), []);

	const write = (rx: number, ry: number, mx: number, my: number) => {
		const el = ref.current;

		if (!el) return;
		el.style.setProperty('--tilt-rx', `${rx.toFixed(2)}deg`);
		el.style.setProperty('--tilt-ry', `${ry.toFixed(2)}deg`);
		el.style.setProperty('--tilt-mx', `${mx.toFixed(1)}%`);
		el.style.setProperty('--tilt-my', `${my.toFixed(1)}%`);
	};

	const onMouseMove = (e: MouseEvent<HTMLElement>) => {
		if (prefersLessMotion()) return;
		const r = e.currentTarget.getBoundingClientRect();
		const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
		const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));

		cancelAnimationFrame(frame.current);
		// The edge nearest the cursor dips away: top → positive rotateX,
		// right → positive rotateY.
		frame.current = requestAnimationFrame(() => write((0.5 - py) * 2 * TILT_MAX, (px - 0.5) * 2 * TILT_MAX, px * 100, py * 100));
	};

	const onMouseLeave = () => {
		cancelAnimationFrame(frame.current);
		write(0, 0, 50, 0);
	};

	const lifted = {
		borderColor: c.accent,
		boxShadow: `0 0 0 4px ${c.ring}, 0 2px 4px rgba(4, 44, 106, 0.06), 0 24px 48px -12px ${c.shadow}`,
		'& > .tilt-bar': { opacity: 1 },
	};
	const depth = (z: number, shadow?: string) => ({ transform: `translateZ(${z}px)`, ...(shadow ? { boxShadow: shadow } : {}) });

	return (
		<Box
			ref={ref}
			component={component}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
			sx={[
				{
					'--tilt-rx': '0deg',
					'--tilt-ry': '0deg',
					'--tilt-mx': '50%',
					'--tilt-my': '0%',
					position: 'relative',
					bgcolor: '#fff',
					border: `1px solid ${restBorder}`,
					borderRadius: 0,
					boxShadow: '0 1px 2px rgba(4, 44, 106, 0.05)',
					fontFamily: '"Inter", "Roboto", sans-serif',
					'& .MuiTypography-root, & button': { fontFamily: 'inherit' },
					transformStyle: 'preserve-3d',
					transform: 'perspective(1000px) translateY(0) scale(1) rotateX(0deg) rotateY(0deg)',
					transition: `transform 450ms ${tiltEase}, box-shadow 450ms ${tiltEase}, border-color 300ms ease`,
					willChange: 'transform',
					// Top bar and cursor light: drawn on the card face.
					'& > .tilt-bar': { position: 'absolute', top: -1, left: -1, right: -1, height: 4, bgcolor: c.accent, opacity: 0, transition: 'opacity 300ms ease', pointerEvents: 'none' },
					'& > .tilt-sheen': {
						position: 'absolute',
						inset: 0,
						pointerEvents: 'none',
						opacity: 0,
						transition: 'opacity 300ms ease',
						background: 'radial-gradient(380px circle at var(--tilt-mx) var(--tilt-my), rgba(232, 242, 253, 0.95) 0%, rgba(240, 246, 255, 0.45) 38%, rgba(255, 255, 255, 0) 70%)',
					},
					// Content is positioned too, so it paints above the light (DOM order).
					'& > :not(.tilt-sheen):not(.tilt-bar)': { position: 'relative' },
					[`& .${tiltLayer.icon}, & .${tiltLayer.title}, & .${tiltLayer.desc}`]: {
						position: 'relative',
						transform: 'translateZ(0)',
						transition: `transform 450ms ${tiltEase}, box-shadow 450ms ${tiltEase}`,
					},
					'&:focus-within': { ...lifted, transform: 'perspective(1000px) translateY(-6px) scale(1.02)' },
					[finePointer]: {
						'&:hover': {
							...lifted,
							transform: 'perspective(1000px) translateY(-6px) scale(1.02) rotateX(var(--tilt-rx)) rotateY(var(--tilt-ry))',
							'& > .tilt-sheen': { opacity: 1 },
							[`& .${tiltLayer.icon}`]: depth(34, '0 10px 18px -6px rgba(4, 44, 106, 0.28)'),
							[`& .${tiltLayer.title}`]: depth(20),
							[`& .${tiltLayer.desc}`]: depth(10),
						},
					},
					// Reduced motion: no tilt, no depth, only a gentle lift.
					[reduceMotion]: {
						transition: 'box-shadow 300ms ease, border-color 300ms ease, transform 300ms ease',
						'&:hover, &:focus-within': { transform: 'translateY(-3px)' },
						[`&:hover .${tiltLayer.icon}, &:hover .${tiltLayer.title}, &:hover .${tiltLayer.desc}`]: { transform: 'none', boxShadow: 'none' },
						'&:hover > .tilt-sheen': { opacity: 0 },
					},
				},
				...(Array.isArray(sx) ? sx : [ sx ]),
			]}
		>
			<span className='tilt-sheen' aria-hidden />
			<span className='tilt-bar' aria-hidden />
			{ children }
		</Box>
	);
};
