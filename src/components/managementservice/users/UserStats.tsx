import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, ButtonBase, MenuItem, Skeleton, TextField, Typography, useMediaQuery } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { keyframes } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import { Roles, Room, Tenant, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { getData } from '../../../store/actions/managementActions';
import { hiddenNameLabel, tenantLabel } from '../../translated/translatedComponents';
import { accessColor, asNumber, chartBlue, chartBlueHover, ellipsis, focusRing, initialsOf, squareInput, str, ui } from './userUi';

// Statistics tab of the Users screen (canvas "Users statistics", approved
// 2026-10-17): number tiles, new users over time, access mix, users per
// tenant, room roles, profile completeness and room ownership. Everything is
// computed in the browser from users, tenants, rooms (with their owners and
// user roles) and roles. Bars are plain boxes with square ends, like the rest
// of the console; no chart library.

const copy = {
	allTenants: 'All tenants',
	period: 'Period',
	exportCsv: 'Export CSV',
	totalUsers: 'Total users',
	thisMonth: (n: number) => `+${n} this month`,
	noneThisMonth: 'None this month',
	newIn: (p: string) => `New in ${p}`,
	busiest: (label: string, n: number) => `Busiest: ${label} (${n})`,
	noNewUsers: 'Nobody joined in this period',
	owners: 'Tenant owners',
	admins: 'Tenant admins',
	members: 'Members',
	ownersNote: (n: number) => (n === 0 ? 'No owners yet' : n === 1 ? 'in 1 tenant' : `in ${n} tenants`),
	share: (pct: number) => `${pct}% of users`,
	roomOwners: 'Room owners',
	roomOwnersNote: 'own 1 room or more',
	incomplete: 'Incomplete profiles',
	incompleteNote: 'hidden name or email',
	allComplete: 'Every profile is complete',
	newUsers: 'New users',
	joinedNote: (joined: number, total: number) => `${joined} joined · ${total} in total`,
	undated: (n: number) => `${n} older ${n === 1 ? 'account has' : 'accounts have'} no sign-up date and ${n === 1 ? 'is' : 'are'} not counted here.`,
	noDates: 'Sign-up dates are not available for these users yet.',
	tooltipNew: (n: number) => `${n} new ${n === 1 ? 'user' : 'users'}`,
	tooltipTotal: (n: number) => `${n} in total`,
	accessMix: 'Access mix',
	users: 'users',
	accessNote: 'Someone who is both owner and admin counts once, as owner.',
	perTenant: 'Users per tenant',
	hoverHint: 'Point at a bar to see its numbers.',
	byRole: 'Users by room role',
	byRoleNote: 'Roles given to people in rooms. One person can have several.',
	noRole: 'No room role',
	noRoles: 'No room roles have been given yet.',
	profile: 'Profile completeness',
	hasName: 'Has a name',
	hasEmail: 'Has an email',
	hasPicture: 'Has a picture',
	of: (n: number, total: number) => `${n} of ${total}`,
	roomsOwned: 'Rooms owned per user',
	ownBuckets: [ 'None', '1 room', '2–3', '4 or more' ],
	ownersSummary: (n: number) => `${n} ${n === 1 ? 'person owns' : 'people own'} at least one room.`,
	topOwners: 'Top room owners',
	noOwners: 'Nobody owns a room yet.',
	rooms: (n: number) => (n === 1 ? 'room' : 'rooms'),
	noUsers: 'No users to count yet.',
} as const;

type PeriodKey = '30d' | '90d' | '12m' | 'all';
const periods: Array<{ key: PeriodKey; label: string; long: string }> = [
	{ key: '30d', label: '30 days', long: '30 days' },
	{ key: '90d', label: '90 days', long: '90 days' },
	{ key: '12m', label: '12 months', long: '12 months' },
	{ key: 'all', label: 'All time', long: 'all time' },
];
const PERIOD_KEY = 'mgmt-users-stats-period';

type Access = 'member' | 'admin' | 'owner';
const accessOf = (u: User): Access => (u.tenantOwner ? 'owner' : u.tenantAdmin ? 'admin' : 'member');
const accessRows: Array<{ key: Access; label: string }> = [
	{ key: 'member', label: copy.members },
	{ key: 'admin', label: copy.admins },
	{ key: 'owner', label: copy.owners },
];

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
const joinedAt = (u: User) => {
	const t = Number(u.createdAt ?? 0);

	return Number.isFinite(t) && t > 0 ? t : 0;
};

// A round axis top (1, 2, 5 × 10ⁿ steps) with four or five gridlines.
const niceScale = (max: number) => {
	if (max <= 4) return { top: 4, step: 1 };
	const raw = max / 4;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const step = [ 1, 2, 5, 10 ].map((m) => m * mag).find((s) => s >= raw) ?? raw;

	return { top: Math.ceil(max / step) * step, step };
};

type Bucket = { start: number; end: number; short: string; long: string; showLabel: boolean };

// Day, week or month buckets for the chosen period, oldest first.
const bucketsFor = (period: PeriodKey, firstJoin: number, now = new Date()): Bucket[] => {
	const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', o);

	if (period === '30d' || period === '90d') {
		const span = period === '30d' ? 1 : 7;
		const count = period === '30d' ? 30 : 13;
		const today = day(now);
		const list: Bucket[] = [];

		for (let i = count - 1; i >= 0; i--) {
			const s = new Date(today);

			s.setDate(today.getDate() - (i * span) - (span - 1));
			const e = new Date(s);

			e.setDate(s.getDate() + span);
			const last = new Date(e.getTime() - 1);

			list.push({
				start: s.getTime(),
				end: e.getTime(),
				short: span === 1 ? fmt(s, { day: 'numeric' }) : fmt(s, { day: 'numeric', month: 'short' }),
				long: span === 1 ? fmt(s, { day: 'numeric', month: 'long', year: 'numeric' }) : `${fmt(s, { day: 'numeric', month: 'short' })} – ${fmt(last, { day: 'numeric', month: 'short', year: 'numeric' })}`,
				showLabel: span === 1 ? (count - 1 - i) % 5 === 0 || i === 0 : (count - 1 - i) % 2 === 0,
			});
		}

		return list;
	}

	const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	let months = 12;

	if (period === 'all' && firstJoin) {
		const f = new Date(firstJoin);

		months = Math.max(1, ((thisMonth.getFullYear() - f.getFullYear()) * 12) + thisMonth.getMonth() - f.getMonth() + 1);
	}

	// Very long histories read better by year.
	if (months > 36) {
		const firstYear = new Date(firstJoin).getFullYear();

		return Array.from({ length: now.getFullYear() - firstYear + 1 }, (_, i) => {
			const y = firstYear + i;

			return { start: new Date(y, 0, 1).getTime(), end: new Date(y + 1, 0, 1).getTime(), short: String(y), long: String(y), showLabel: true };
		});
	}

	return Array.from({ length: months }, (_, i) => {
		const s = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - (months - 1 - i), 1);
		const e = new Date(s.getFullYear(), s.getMonth() + 1, 1);

		return {
			start: s.getTime(),
			end: e.getTime(),
			short: fmt(s, { month: 'short' }),
			long: fmt(s, { month: 'long', year: 'numeric' }),
			showLabel: months <= 14 || i % Math.ceil(months / 12) === 0,
		};
	});
};

// CSV cells: quote everything, and stop spreadsheets from running formulas.
const csvCell = (v: unknown) => {
	let t = v == null ? '' : String(v);

	if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`;

	return `"${t.replace(/"/g, '""')}"`;
};

// Motion (user request 2026-10-17): tiles and cards rise in one after
// another, bars grow from their baseline, numbers count up and bars glide to
// new values when the period or tenant changes. All of it is switched off
// for people who ask the system for less motion.
const easeOut = 'cubic-bezier(0.16, 1, 0.3, 1)';
const riseIn = keyframes`
	from { opacity: 0; transform: translateY(12px); }
	to { opacity: 1; transform: none; }
`;
const growUp = keyframes`
	from { transform: scaleY(0); }
	to { transform: scaleY(1); }
`;
const growRight = keyframes`
	from { transform: scaleX(0); }
	to { transform: scaleX(1); }
`;
const lessMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none', transition: 'none' } } as const;
const rise = (order: number) => ({ animation: `${riseIn} 480ms ${easeOut} ${order * 60}ms both`, ...lessMotion });
const grow = (direction: 'up' | 'right', order = 0) => ({
	transformOrigin: direction === 'up' ? 'bottom' : 'left',
	animation: `${direction === 'up' ? growUp : growRight} 720ms ${easeOut} ${200 + (order * 35)}ms both`,
	transition: `height 450ms ${easeOut}, width 450ms ${easeOut}`,
	...lessMotion,
});

const prefersLessMotion = () => {
	try {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	} catch {
		return false;
	}
};

// Counts up to the value, and from the old value to a new one. Screen
// readers get the final number only.
const CountUp = ({ value }: { value: number }) => {
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
			const t = Math.min(1, (now - started) / 800);
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
		<Box component='span' sx={visuallyHidden}>{value.toLocaleString('en-US')}</Box>
	</>;
};

const cardSx = { bgcolor: '#fff', border: `1px solid ${ui.line}`, p: { xs: 2, sm: '18px 20px' }, display: 'flex', flexDirection: 'column', gap: 1.75, minWidth: 0 } as const;
const titleSx = { m: 0, fontSize: 16, lineHeight: '24px', fontWeight: 600, color: ui.navy } as const;
const noteSx = { m: 0, fontSize: 13, lineHeight: '18px', color: ui.muted } as const;
const numberSx = { fontWeight: 700, color: ui.text, fontVariantNumeric: 'tabular-nums' } as const;

type Kpi = { label: string; value: number; note: string; noteColor?: string; ink: string };

const KpiTile = ({ k, order }: { k: Kpi; order: number }) => (
	<Box component='li' sx={{ bgcolor: '#fff', border: `1px solid ${ui.line}`, borderBottom: `3px solid ${k.ink}`, p: '16px 18px', display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, ...rise(order) }}>
		<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', fontWeight: 500, color: ui.slate, overflowWrap: 'anywhere' }}>{k.label}</Box>
		<Box component='span' sx={{ ...numberSx, fontSize: 32, lineHeight: '40px' }}><CountUp value={k.value} /></Box>
		<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: k.noteColor ?? ui.muted, fontWeight: k.noteColor ? 600 : 400 }}>{k.note}</Box>
	</Box>
);

const Legend = () => (
	<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, fontSize: 13, color: ui.body }}>
		{accessRows.map((a) => (
			<Box key={a.key} component='span' sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
				<Box component='span' aria-hidden sx={{ width: 10, height: 10, bgcolor: accessColor[a.key] }} />
				{a.label}
			</Box>
		))}
	</Box>
);

// A horizontal bar whose length is its share of the largest bar; the number
// sits at its tip.
const HBar = ({ label, value, max, color, title, order = 0 }: { label: string; value: number; max: number; color: string; title: string; order?: number }) => (
	<Box component='li' sx={{ display: 'grid', gridTemplateColumns: { xs: '96px minmax(0, 1fr)', sm: '120px minmax(0, 1fr)' }, alignItems: 'center', gap: 1.5, fontSize: 14 }}>
		<Box component='span' sx={{ color: ui.body, ...ellipsis }} title={label}>{label}</Box>
		<Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
			<Box component='span' title={title} sx={{ height: 22, width: `${max ? Math.max(1, (value / max) * 82) : 0}%`, minWidth: value ? 3 : 0, bgcolor: color, flexShrink: 0, ...grow('right', order) }} />
			<Box component='span' sx={numberSx}>{value}</Box>
		</Box>
	</Box>
);

export type UserStatsProps = {
	users: User[];
	tenants: Tenant[];
	loading: boolean;
};

const UserStats = ({ users, tenants, loading }: UserStatsProps) => {
	const dispatch = useAppDispatch();
	const [ rooms, setRooms ] = useState<Room[]>([]);
	const [ roles, setRoles ] = useState<Roles[]>([]);
	const [ roomsLoading, setRoomsLoading ] = useState(true);

	useEffect(() => {
		Promise.all([
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(getData('rooms')).then((d: any) => { if (d != undefined) setRooms(d.data ?? []); }),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			dispatch(getData('roles')).then((d: any) => { if (d != undefined) setRoles(d.data ?? []); }),
		]).finally(() => setRoomsLoading(false));
	}, []);

	const [ tenantFilter, setTenantFilter ] = useState('all');
	const [ period, setPeriod ] = useState<PeriodKey>(() => {
		try {
			const saved = localStorage.getItem(PERIOD_KEY);

			return periods.some((p) => p.key === saved) ? saved as PeriodKey : '12m';
		} catch {
			return '12m';
		}
	});
	const pickPeriod = (p: PeriodKey) => {
		setPeriod(p);
		try {
			localStorage.setItem(PERIOD_KEY, p);
		} catch {
			// private window: the choice just isn't remembered
		}
	};
	const narrow = useMediaQuery('(max-width: 599.95px)');
	const [ hoverBar, setHoverBar ] = useState<number | null>(null);
	const [ hoverTenant, setHoverTenant ] = useState<string | null>(null);

	const tenantName = (id: unknown) => tenants.find((t) => t.id == asNumber(id))?.name ?? `${tenantLabel()} #${asNumber(id)}`;
	const people = useMemo(
		() => (tenantFilter === 'all' ? users : users.filter((u) => String(u.tenantId) === tenantFilter)),
		[ users, tenantFilter ]
	);
	const total = people.length;
	const peopleIds = useMemo(() => new Set(people.map((u) => asNumber(u.id))), [ people ]);

	// ----- Sign-ups over time -----
	const growth = useMemo(() => {
		const dated = people.map(joinedAt).filter(Boolean);
		const firstJoin = dated.length ? Math.min(...dated) : 0;
		const buckets = bucketsFor(period, firstJoin);
		const from = buckets[0]?.start ?? 0;
		const counts = buckets.map((b) => dated.filter((t) => t >= b.start && t < b.end).length);
		let running = people.filter((u) => joinedAt(u) && joinedAt(u) < from).length + people.filter((u) => !joinedAt(u)).length;
		const totals = counts.map((c) => (running += c));
		const joined = counts.reduce((a, b) => a + b, 0);
		const peak = counts.reduce((best, c, i) => (c > counts[best] ? i : best), 0);
		const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

		return {
			buckets,
			counts,
			totals,
			joined,
			peak,
			hasDates: dated.length > 0,
			undated: people.length - dated.length,
			thisMonth: dated.filter((t) => t >= monthStart).length,
			scale: niceScale(Math.max(1, ...counts)),
		};
	}, [ people, period ]);

	// ----- Access -----
	const accessCount = useMemo(() => {
		const c = { member: 0, admin: 0, owner: 0 };

		people.forEach((u) => { c[accessOf(u)]++; });

		return c;
	}, [ people ]);
	const ownerTenants = new Set(people.filter((u) => u.tenantOwner).map((u) => asNumber(u.tenantId))).size;

	const perTenant = useMemo(() => tenants
		.map((t) => {
			const list = users.filter((u) => u.tenantId == t.id);
			const c = { member: 0, admin: 0, owner: 0 };

			list.forEach((u) => { c[accessOf(u)]++; });

			return { id: String(t.id), name: t.name, total: list.length, ...c };
		})
		.filter((t) => t.total > 0)
		.sort((a, b) => b.total - a.total), [ users, tenants ]);
	const maxTenant = Math.max(1, ...perTenant.map((t) => t.total));

	// ----- Rooms: ownership and room roles -----
	const roomStats = useMemo(() => {
		const owned = new Map<number, number>();
		const byRole = new Map<string, Set<number>>();
		const roleName = (id: unknown, embedded?: { name?: string }) => embedded?.name || roles.find((r) => r.id == asNumber(id))?.name || '';

		rooms.forEach((r) => {
			new Set((r.owners ?? []).map((o) => asNumber(o.userId))).forEach((uid) => {
				if (peopleIds.has(uid)) owned.set(uid, (owned.get(uid) ?? 0) + 1);
			});
			// The rooms service adds each room's user roles (rooms.schema userRoles).
			((r as Room & { userRoles?: Array<{ userId: number; roleId: number; role?: { name?: string } }> }).userRoles ?? []).forEach((ur) => {
				const uid = asNumber(ur.userId);
				const name = roleName(ur.roleId, ur.role);

				if (!name || !peopleIds.has(uid)) return;
				if (!byRole.has(name)) byRole.set(name, new Set());
				byRole.get(name)?.add(uid);
			});
		});

		const withRole = new Set<number>();

		byRole.forEach((set) => set.forEach((id) => withRole.add(id)));
		const roleRows = [ ...byRole ].map(([ name, set ]) => ({ name, n: set.size })).sort((a, b) => b.n - a.n);
		const counts = [ ...owned.values() ];
		const buckets = [
			total - owned.size,
			counts.filter((n) => n === 1).length,
			counts.filter((n) => n >= 2 && n <= 3).length,
			counts.filter((n) => n >= 4).length,
		];
		const top = [ ...owned ]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([ id, n ]) => ({ user: people.find((u) => asNumber(u.id) === id), n }))
			.filter((t): t is { user: User; n: number } => Boolean(t.user));

		return { owners: owned.size, buckets, top, roleRows, noRole: total - withRole.size };
	}, [ rooms, roles, people, peopleIds, total ]);

	const incomplete = people.filter((u) => !str(u.name) || !str(u.email)).length;
	const periodLong = periods.find((p) => p.key === period)?.long ?? '';

	const kpis: Kpi[] = [
		{ label: copy.totalUsers, value: total, note: growth.hasDates ? (growth.thisMonth ? copy.thisMonth(growth.thisMonth) : copy.noneThisMonth) : `${tenantFilter === 'all' ? tenants.length : 1} ${tenantFilter === 'all' && tenants.length !== 1 ? 'tenants' : 'tenant'}`, noteColor: growth.thisMonth ? '#047857' : undefined, ink: '#2563eb' },
		{ label: copy.newIn(periodLong), value: growth.joined, note: growth.joined ? copy.busiest(growth.buckets[growth.peak]?.long ?? '', growth.counts[growth.peak]) : copy.noNewUsers, ink: '#0369a1' },
		{ label: copy.owners, value: people.filter((u) => u.tenantOwner).length, note: copy.ownersNote(ownerTenants), ink: '#b45309' },
		{ label: copy.admins, value: people.filter((u) => u.tenantAdmin).length, note: copy.share(pct(people.filter((u) => u.tenantAdmin).length, total)), ink: '#047857' },
		{ label: copy.roomOwners, value: roomStats.owners, note: copy.roomOwnersNote, ink: '#6d28d9' },
		{ label: copy.incomplete, value: incomplete, note: incomplete ? copy.incompleteNote : copy.allComplete, noteColor: incomplete ? '#b45309' : undefined, ink: '#c2410c' },
	];

	const exportCsv = () => {
		const ownedBy = new Map<number, number>();

		rooms.forEach((r) => new Set((r.owners ?? []).map((o) => asNumber(o.userId))).forEach((uid) => ownedBy.set(uid, (ownedBy.get(uid) ?? 0) + 1)));
		const head = [ 'id', 'name', 'email', 'tenant', 'access', 'tenantOwner', 'tenantAdmin', 'roomsOwned', 'joined' ];
		const rows = people.map((u) => [
			asNumber(u.id), str(u.name), str(u.email), tenantName(u.tenantId), accessRows.find((a) => a.key === accessOf(u))?.label,
			u.tenantOwner ? 'yes' : 'no', u.tenantAdmin ? 'yes' : 'no', ownedBy.get(asNumber(u.id)) ?? 0,
			joinedAt(u) ? new Date(joinedAt(u)).toISOString() : '',
		]);
		const csv = [ head, ...rows ].map((r) => r.map(csvCell).join(',')).join('\r\n');
		const url = URL.createObjectURL(new Blob([ '﻿', csv ], { type: 'text/csv;charset=utf-8' }));
		const a = document.createElement('a');

		a.href = url;
		a.download = `edukotha-users-${new Date().toISOString()
			.slice(0, 10)}.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	};

	if (loading && users.length === 0) {
		return (
			<Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 2 }}>
				{[ 0, 1, 2, 3, 4, 5 ].map((i) => <Skeleton key={i} variant='rectangular' height={128} sx={{ borderRadius: 0 }} />)}
				<Skeleton variant='rectangular' height={300} sx={{ borderRadius: 0, gridColumn: '1 / -1' }} />
			</Box>
		);
	}

	// ----- Pieces -----
	const plotHeight = 210;
	const { buckets, counts, totals, scale } = growth;
	const ticks = Array.from({ length: Math.round(scale.top / scale.step) + 1 }, (_, i) => i * scale.step);
	const barW = buckets.length > 16 ? 12 : 24;

	const growthCard = (
		<Box component='section' aria-labelledby='stats-growth' sx={{ ...cardSx, ...rise(6) }}>
			<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
				<Typography id='stats-growth' component='h3' sx={{ ...titleSx, flexGrow: 1 }}>{copy.newUsers} · {periodLong}</Typography>
				{growth.hasDates && <Typography sx={noteSx}>{copy.joinedNote(growth.joined, total)}</Typography>}
			</Box>
			{!growth.hasDates ? (
				<Typography sx={{ ...noteSx, py: 6, textAlign: 'center' }}>{total ? copy.noDates : copy.noUsers}</Typography>
			) : (
				<Box sx={{ overflowX: 'auto', mx: -0.5, px: 0.5 }}>
					<Box sx={{ position: 'relative', height: plotHeight + 26 + 8, minWidth: buckets.length > 16 ? (buckets.length * 18) + 40 : 0, pl: '40px', pt: 1, display: 'flex' }}>
						<Box aria-hidden sx={{ position: 'absolute', left: 0, right: 0, top: 8, bottom: 26 }}>
							{ticks.map((t) => (
								<Box key={t} sx={{ position: 'absolute', left: 0, right: 0, bottom: `${(t / scale.top) * plotHeight}px`, display: 'flex', alignItems: 'center', gap: 1, transform: 'translateY(50%)' }}>
									<Box component='span' sx={{ width: 30, textAlign: 'right', fontSize: 12, color: ui.muted, fontVariantNumeric: 'tabular-nums' }}>{t}</Box>
									<Box component='span' sx={{ flexGrow: 1, height: '1px', bgcolor: t === 0 ? '#cbd5e1' : '#eef2f7' }} />
								</Box>
							))}
						</Box>
						{buckets.map((b, i) => {
							const v = counts[i];
							const h = (v / scale.top) * plotHeight;
							const on = hoverBar === i;
							// Keep the tooltip inside the chart at both ends.
							const align = i < 2 ? { left: 0 } : i > buckets.length - 3 ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' };

							return (
								<Box key={b.start} sx={{ flex: '1 1 0', minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
									<ButtonBase
										aria-label={`${b.long}: ${copy.tooltipNew(v)}`}
										onMouseEnter={() => setHoverBar(i)}
										onMouseLeave={() => setHoverBar(null)}
										onFocus={() => setHoverBar(i)}
										onBlur={() => setHoverBar(null)}
										disableRipple
										sx={{ position: 'absolute', top: 0, bottom: 26, left: 1, right: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', bgcolor: on ? 'rgba(59,130,246,0.08)' : 'transparent', cursor: 'default', '&.Mui-focusVisible': focusRing }}
									>
										<Box component='span' sx={{ width: barW, maxWidth: '100%', height: `${h}px`, minHeight: v ? 2 : 0, bgcolor: on ? chartBlueHover : chartBlue, ...grow('up', i), transition: `height 450ms ${easeOut}, background-color 120ms ease` }} />
									</ButtonBase>
									{i === growth.peak && v > 0 && !on && (
										<Box component='span' aria-hidden sx={{ position: 'absolute', bottom: 26 + h + 4, fontSize: 12, fontWeight: 600, color: ui.text, pointerEvents: 'none' }}>{v}</Box>
									)}
									<Box component='span' aria-hidden sx={{ height: 26, display: 'flex', alignItems: 'flex-end', fontSize: 12, color: ui.muted, whiteSpace: 'nowrap', visibility: b.showLabel && (!narrow || buckets.length <= 6 || i % 3 === 0) ? 'visible' : 'hidden' }}>{b.short}</Box>
									{on && (
										<Box role='status' sx={{ position: 'absolute', zIndex: 2, bottom: 26 + h + 10, ...align, whiteSpace: 'nowrap', bgcolor: ui.text, color: '#fff', px: 1.25, py: 1, boxShadow: '0 6px 16px rgba(15,31,58,0.18)', display: 'flex', flexDirection: 'column', gap: '2px', pointerEvents: 'none' }}>
											<Box component='span' sx={{ fontSize: 16, fontWeight: 700 }}>{copy.tooltipNew(v)}</Box>
											<Box component='span' sx={{ fontSize: 12, color: '#c9d5e6' }}>{b.long} · {copy.tooltipTotal(totals[i])}</Box>
										</Box>
									)}
								</Box>
							);
						})}
					</Box>
				</Box>
			)}
			{growth.hasDates && growth.undated > 0 && <Typography sx={noteSx}>{copy.undated(growth.undated)}</Typography>}
		</Box>
	);

	const accessCard = (
		<Box component='section' aria-labelledby='stats-access' sx={{ ...cardSx, ...rise(7) }}>
			<Typography id='stats-access' component='h3' sx={titleSx}>{copy.accessMix}</Typography>
			<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
				<Box component='span' sx={{ ...numberSx, fontSize: 32, lineHeight: '40px' }}><CountUp value={total} /></Box>
				<Box component='span' sx={{ fontSize: 14, color: ui.muted }}>{copy.users}</Box>
			</Box>
			<Box role='img' aria-label={`${copy.accessMix}: ${accessRows.map((a) => `${a.label} ${accessCount[a.key]}`).join(', ')}`} sx={{ height: 28, display: 'flex', gap: '2px', bgcolor: total ? 'transparent' : ui.grey, ...grow('right') }}>
				{accessRows.filter((a) => accessCount[a.key] > 0).map((a) => (
					<Box key={a.key} component='span' title={`${a.label}: ${accessCount[a.key]}`} sx={{ flex: `${accessCount[a.key]} 1 0`, minWidth: 4, bgcolor: accessColor[a.key], transition: `flex-grow 450ms ${easeOut}`, ...lessMotion }} />
				))}
			</Box>
			<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0 }}>
				{accessRows.map((a) => (
					<Box component='li' key={a.key} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1.25, borderTop: `1px solid ${ui.lineSoft}`, fontSize: 14 }}>
						<Box component='span' aria-hidden sx={{ width: 12, height: 12, flexShrink: 0, bgcolor: accessColor[a.key] }} />
						<Box component='span' sx={{ flexGrow: 1, color: ui.body }}>{a.label}</Box>
						<Box component='span' sx={numberSx}>{accessCount[a.key]}</Box>
						<Box component='span' sx={{ width: 48, textAlign: 'right', color: ui.muted, fontVariantNumeric: 'tabular-nums' }}>{pct(accessCount[a.key], total)}%</Box>
					</Box>
				))}
			</Box>
			<Typography sx={{ ...noteSx, fontSize: 12, lineHeight: '16px' }}>{copy.accessNote}</Typography>
		</Box>
	);

	const hovered = hoverTenant ? (() => {
		const [ id, key ] = hoverTenant.split(':');
		const t = perTenant.find((x) => x.id === id);
		const a = accessRows.find((x) => x.key === key);

		return t && a ? `${t.name} · ${a.label}: ${t[a.key]} of ${t.total}` : '';
	})() : '';

	const tenantCard = (
		<Box component='section' aria-labelledby='stats-tenant' sx={{ ...cardSx, ...rise(8) }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
				<Typography id='stats-tenant' component='h3' sx={{ ...titleSx, flexGrow: 1 }}>{copy.perTenant}</Typography>
				<Legend />
			</Box>
			<Typography role='status' sx={{ ...noteSx, minHeight: 18, color: hovered ? ui.text : ui.muted, fontWeight: hovered ? 600 : 400 }}>{hovered || copy.hoverHint}</Typography>
			<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 2.25 }}>
				{perTenant.map((t, ti) => (
					<Box component='li' key={t.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
						<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, fontSize: 14 }}>
							<Box component='span' sx={{ flexGrow: 1, color: ui.body, ...ellipsis }}>{t.name}</Box>
							<Box component='span' sx={numberSx}>{t.total}</Box>
						</Box>
						<Box sx={{ display: 'flex', gap: '2px', height: 22, width: `${(t.total / maxTenant) * 100}%`, minWidth: 12, ...grow('right', ti) }}>
							{accessRows.filter((a) => t[a.key] > 0).map((a) => {
								const key = `${t.id}:${a.key}`;

								return (
									<ButtonBase
										key={a.key}
										disableRipple
										aria-label={`${t.name}, ${a.label}: ${t[a.key]}`}
										onMouseEnter={() => setHoverTenant(key)}
										onMouseLeave={() => setHoverTenant(null)}
										onFocus={() => setHoverTenant(key)}
										onBlur={() => setHoverTenant(null)}
										sx={{ flex: `${t[a.key]} 1 0`, minWidth: 4, bgcolor: accessColor[a.key], opacity: hoverTenant && hoverTenant !== key ? 0.45 : 1, cursor: 'default', transition: 'opacity 120ms ease', '&.Mui-focusVisible': focusRing }}
									/>
								);
							})}
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);

	const roleMax = Math.max(1, roomStats.noRole, ...roomStats.roleRows.map((r) => r.n));
	const roleCard = (
		<Box component='section' aria-labelledby='stats-roles' sx={{ ...cardSx, ...rise(9) }}>
			<Typography id='stats-roles' component='h3' sx={titleSx}>{copy.byRole}</Typography>
			<Typography sx={noteSx}>{copy.byRoleNote}</Typography>
			{roomsLoading ? <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 0 }} /> : (
				<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
					{roomStats.roleRows.length === 0 && <Typography component='li' sx={noteSx}>{copy.noRoles}</Typography>}
					{roomStats.roleRows.slice(0, 7).map((r, i) => (
						<HBar key={r.name} label={r.name} value={r.n} max={roleMax} color={chartBlue} title={`${r.name}: ${r.n}`} order={i} />
					))}
					<HBar label={copy.noRole} value={roomStats.noRole} max={roleMax} color='#cbd5e1' title={`${copy.noRole}: ${roomStats.noRole}`} order={Math.min(7, roomStats.roleRows.length)} />
				</Box>
			)}
		</Box>
	);

	const profileRows = [
		{ label: copy.hasName, n: people.filter((u) => str(u.name)).length },
		{ label: copy.hasEmail, n: people.filter((u) => str(u.email)).length },
		{ label: copy.hasPicture, n: people.filter((u) => str(u.avatar)).length },
	];
	const profileCard = (
		<Box component='section' aria-labelledby='stats-profile' sx={{ ...cardSx, ...rise(10) }}>
			<Typography id='stats-profile' component='h3' sx={titleSx}>{copy.profile}</Typography>
			<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
				{profileRows.map((r) => (
					<Box component='li' key={r.label} sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
						<Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, fontSize: 14 }}>
							<Box component='span' sx={{ flexGrow: 1, color: ui.body }}>{r.label}</Box>
							<Box component='span' sx={numberSx}>{pct(r.n, total)}%</Box>
							<Box component='span' sx={{ fontSize: 13, color: ui.muted }}>{copy.of(r.n, total)}</Box>
						</Box>
						<Box role='img' aria-label={`${r.label}: ${copy.of(r.n, total)}`} sx={{ height: 10, bgcolor: '#e6efff' }}>
							<Box sx={{ height: 10, width: `${pct(r.n, total)}%`, bgcolor: chartBlue, ...grow('right', profileRows.indexOf(r)) }} />
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);

	const bucketMax = Math.max(1, ...roomStats.buckets);
	const ownedCard = (
		<Box component='section' aria-labelledby='stats-owned' sx={{ ...cardSx, ...rise(11) }}>
			<Typography id='stats-owned' component='h3' sx={titleSx}>{copy.roomsOwned}</Typography>
			{roomsLoading ? <Skeleton variant='rectangular' height={190} sx={{ borderRadius: 0 }} /> : <>
				<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1.5, alignItems: 'end' }}>
					{roomStats.buckets.map((n, i) => (
						<Box component='li' key={copy.ownBuckets[i]} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
							<Box component='span' sx={{ ...numberSx, fontSize: 12 }}>{n}</Box>
							<Box component='span' title={`${copy.ownBuckets[i]}: ${n}`} sx={{ width: 24, height: `${Math.round((n / bucketMax) * 130)}px`, minHeight: n ? 2 : 0, bgcolor: chartBlue, ...grow('up', i) }} />
							<Box component='span' sx={{ width: '100%', borderTop: '1px solid #cbd5e1', pt: 0.75, textAlign: 'center', fontSize: 12, color: ui.muted }}>{copy.ownBuckets[i]}</Box>
						</Box>
					))}
				</Box>
				<Typography sx={noteSx}>{copy.ownersSummary(roomStats.owners)}</Typography>
			</>}
		</Box>
	);

	const topCard = (
		<Box component='section' aria-labelledby='stats-top' sx={{ ...cardSx, gap: 1, ...rise(12) }}>
			<Typography id='stats-top' component='h3' sx={{ ...titleSx, mb: 0.5 }}>{copy.topOwners}</Typography>
			{roomsLoading ? <Skeleton variant='rectangular' height={190} sx={{ borderRadius: 0 }} /> : roomStats.top.length === 0 ? (
				<Typography sx={noteSx}>{copy.noOwners}</Typography>
			) : (
				<Box component='ol' sx={{ listStyle: 'none', m: 0, p: 0 }}>
					{roomStats.top.map(({ user: u, n }, i) => (
						<Box component='li' key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderTop: `1px solid ${ui.lineSoft}`, fontSize: 14 }}>
							<Box component='span' sx={{ width: 18, color: ui.muted, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</Box>
							<Box component='span' aria-hidden sx={{ width: 32, height: 32, flexShrink: 0, bgcolor: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{initialsOf(str(u.name), str(u.email))}</Box>
							<Box component='span' sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
								<Box component='span' sx={{ color: ui.text, fontWeight: 600, ...ellipsis }}>{str(u.name) || str(u.email) || hiddenNameLabel()}</Box>
								<Box component='span' sx={{ fontSize: 12, color: ui.muted, ...ellipsis }}>{tenantName(u.tenantId)}</Box>
							</Box>
							<Box component='span' sx={numberSx}>{n}</Box>
							<Box component='span' sx={{ fontSize: 12, color: ui.muted }}>{copy.rooms(n)}</Box>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
				{tenants.length > 1 && (
					<TextField
						select
						size='small'
						value={tenantFilter}
						onChange={(e) => setTenantFilter(e.target.value)}
						slotProps={{ htmlInput: { 'aria-label': tenantLabel() }, input: { sx: squareInput } }}
						sx={{ minWidth: 190, flex: { xs: '1 1 100%', sm: 'none' } }}
					>
						<MenuItem value='all'>{copy.allTenants}</MenuItem>
						{tenants.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}
					</TextField>
				)}
				<Box role='group' aria-label={copy.period} sx={{ display: 'flex', border: `1px solid ${ui.line}`, bgcolor: '#fff', flex: { xs: '1 1 100%', sm: 'none' } }}>
					{periods.map((p, i) => {
						const on = period === p.key;

						return (
							<ButtonBase
								key={p.key}
								aria-pressed={on}
								onClick={() => pickPeriod(p.key)}
								sx={{ flex: { xs: 1, sm: 'none' }, height: { xs: 42, sm: 38 }, px: { xs: 1, sm: 1.75 }, borderLeft: i ? `1px solid ${ui.line}` : 0, bgcolor: on ? ui.navy : '#fff', color: on ? '#fff' : ui.body, fontSize: 14, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap', '&:hover': { bgcolor: on ? ui.navy : ui.grey }, '&.Mui-focusVisible': focusRing }}
							>
								{p.label}
							</ButtonBase>
						);
					})}
				</Box>
				<Box sx={{ flexGrow: 1 }} />
				<ButtonBase
					onClick={exportCsv}
					disabled={total === 0}
					sx={{ height: 40, gap: 1, px: 2, border: `1px solid ${ui.line}`, bgcolor: '#fff', color: ui.navy, fontSize: 14, fontWeight: 600, '&:hover': { bgcolor: ui.grey }, '&.Mui-focusVisible': focusRing, '&.Mui-disabled': { color: ui.slateDot } }}
				>
					<FileDownloadOutlinedIcon sx={{ fontSize: 20 }} />
					{copy.exportCsv}
				</ButtonBase>
			</Box>

			<Box component='ul' aria-label='Key numbers' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(auto-fit, minmax(170px, 1fr))' }, gap: { xs: 1.25, sm: 2 } }}>
				{kpis.map((k, i) => <KpiTile key={k.label} k={k} order={i} />)}
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' }, gap: 2 }}>
				{growthCard}
				{accessCard}
			</Box>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
				{tenantFilter === 'all' && perTenant.length > 1 ? tenantCard : profileCard}
				{roleCard}
			</Box>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
				{tenantFilter === 'all' && perTenant.length > 1 && profileCard}
				{ownedCard}
				{topCard}
			</Box>
		</Box>
	);
};

export default UserStats;
