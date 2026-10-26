import { useEffect, useMemo, useState } from 'react';
import { Box, ButtonBase, InputAdornment, Skeleton, TextField, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useAppDispatch } from '../../../store/hooks';
import { countData, latestData } from '../../../store/actions/managementActions';
import { ellipsis, focusRing, sectionLabelSx, squareInput, str, ui } from '../users/userUi';
import { CountUp, TiltCard, staggerSx, tiltLayer, useIntro } from '../motion';

// Overview (user brief 2026-10-18, canvas "Overview v2", built with the
// console's square corners and its blue / orange / navy): a welcome header,
// key numbers, one card per section the user may open, recent activity and
// a setup checklist. Only real data is shown: activity is the newest rooms,
// groups and people (there is no audit log), and the search finds a
// section. Orange marks what needs attention.
const attention = { border: ui.orange, bg: '#fff8ef', tint: ui.orangeLight, text: '#8a4b00' } as const;

const copy = {
	welcome: 'Welcome back',
	subtitle: 'Here’s what’s happening across your tenant today.',
	newRoom: 'New room',
	find: 'Find a section',
	findPlaceholder: 'Find a section…',
	noMatch: 'No section matches your search.',
	keyNumbers: 'Key numbers',
	manage: 'Manage',
	actionNeeded: 'Action needed',
	open: (label: string) => `Open ${label.toLowerCase()}`,
	activity: 'Recent activity',
	activityEmpty: 'Nothing yet. New rooms, groups and people show up here.',
	event: 'Event',
	name: 'Name',
	when: 'When',
	setup: 'Setup checklist',
	setupDone: (n: number, total: number) => `${n} of ${total} done`,
	setupProgress: 'Setup progress',
	start: 'Start',
	done: 'Done',
	todo: 'To do',
	unnamed: 'Unnamed',
} as const;

// Count words per section; Defaults has no count.
const words: Record<string, [string, string]> = {
	room: [ 'room', 'rooms' ],
	meetings: [ 'meeting', 'meetings' ],
	user: [ 'user', 'users' ],
	group: [ 'group', 'groups' ],
	role: [ 'role', 'roles' ],
	tenant: [ 'tenant', 'tenants' ],
	rule: [ 'rule', 'rules' ],
};
const services: Record<string, string> = { room: 'rooms', meetings: 'meetings', user: 'users', group: 'groups', role: 'roles', tenant: 'tenants', rule: 'rules' };
const countOf = (key: string, n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? words[key][0] : words[key][1]}`;

export type OverviewItem = { key: string; label: string; description: string; icon: SvgIconComponent };

type Activity = { kind: string; event: string; name: string; at: number; id: number };

const timeOf = (v: unknown) => {
	if (typeof v === 'number') return v;
	if (typeof v === 'string' && v) {
		const n = Number(v);

		return Number.isFinite(n) ? n : Date.parse(v) || 0;
	}

	return 0;
};
const whenText = (t: number) => {
	if (!t) return '—';
	const mins = Math.round((Date.now() - t) / 60000);

	if (mins < 1) return 'Just now';
	if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
	const hours = Math.round(mins / 60);

	if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
	const days = Math.round(hours / 24);

	if (days === 1) return 'Yesterday';
	if (days < 7) return `${days} days ago`;

	return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const cardSx = { bgcolor: '#fff', border: `1px solid ${ui.line}` } as const;
const linkSx = { minHeight: 44, gap: 0.75, px: 0.5, fontSize: 14, fontWeight: 600, color: ui.blueDark, '&:hover': { color: ui.navy, textDecoration: 'underline' }, '&.Mui-focusVisible': focusRing } as const;

type Props = {
	name: string;
	roleLabel: string;
	items: OverviewItem[];
	onOpen: (key: string) => void;
	onNewRoom?: () => void;
};

const Overview = ({ name, roleLabel, items, onOpen, onNewRoom }: Props) => {
	const dispatch = useAppDispatch();
	const has = (key: string) => items.some((i) => i.key === key);
	const keys = items.map((i) => i.key).join(',');

	// ----- Data: totals, a few extra counts and the newest items -----
	const [ totals, setTotals ] = useState<Record<string, number>>({});
	const [ extra, setExtra ] = useState<{ locked?: number; newUsers?: number; members?: number }>({});
	const [ activity, setActivity ] = useState<Activity[] | null>(null);

	useEffect(() => {
		let live = true;
		const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

		items.filter((i) => services[i.key]).forEach((i) => {
			dispatch(countData(services[i.key])).then((n) => {
				if (live && typeof n === 'number') setTotals((t) => ({ ...t, [i.key]: n }));
			});
		});
		if (has('room')) dispatch(countData('rooms', { locked: true })).then((n) => { if (live && typeof n === 'number') setExtra((e) => ({ ...e, locked: n })); });
		if (has('user')) dispatch(countData('users', { createdAt: { $gte: monthStart } })).then((n) => { if (live && typeof n === 'number') setExtra((e) => ({ ...e, newUsers: n })); });
		if (has('group')) dispatch(countData('groupUsers')).then((n) => { if (live && typeof n === 'number') setExtra((e) => ({ ...e, members: n })); });

		const sources: Array<[string, string, string]> = [ [ 'room', 'rooms', 'Room created' ], [ 'group', 'groups', 'Group added' ], [ 'user', 'users', 'Person joined' ] ];

		Promise.all(sources.filter(([ key ]) => has(key)).map(([ key, service, event ]) => dispatch(latestData(service, 5)).then((rows) => rows.map((r) => {
			const row = r as { id?: number; name?: unknown; email?: unknown; createdAt?: unknown };

			return { kind: key, event, name: str(row.name) || str(row.email) || copy.unnamed, at: timeOf(row.createdAt), id: Number(row.id ?? 0) };
		})))).then((lists) => {
			if (!live) return;
			setActivity(lists.flat().sort((a, b) => (b.at - a.at) || (b.id - a.id))
				.slice(0, 6));
		});

		return () => { live = false; };
	}, [ keys ]);

	// ----- Search: filters the section cards, Enter opens the first -----
	const [ query, setQuery ] = useState('');
	const shownItems = useMemo(() => {
		const q = query.trim().toLowerCase();

		return q ? items.filter((i) => `${i.label} ${i.description}`.toLowerCase().includes(q)) : items;
	}, [ items, query ]);

	const intro = useIntro(items.length > 0);
	const t = (key: string) => totals[key];
	const needs = (key: string) => (key === 'room' || key === 'role') && t(key) === 0;

	// ----- Key numbers -----
	const kpis = [
		has('room') && {
			key: 'room',
			label: 'Rooms',
			value: t('room'),
			caption: t('room') === 0 ? 'Create your first room' : extra.locked !== undefined && t('room') !== undefined ? `${t('room') - extra.locked} open · ${extra.locked} locked` : '',
		},
		has('meetings') && { key: 'meetings', label: 'Meetings', value: t('meetings'), caption: 'Scheduled with email invites' },
		has('user') && { key: 'user', label: 'Users', value: t('user'), caption: extra.newUsers !== undefined ? `${extra.newUsers} new this month` : '' },
		has('group') && { key: 'group', label: 'Groups', value: t('group'), caption: extra.members !== undefined ? `${extra.members} ${extra.members === 1 ? 'member' : 'members'} in total` : '' },
		has('role') && { key: 'role', label: 'Roles', value: t('role'), caption: t('role') === 0 ? 'Setup needed' : 'Ready to use in rooms' },
	].filter(Boolean) as Array<{ key: string; label: string; value: number | undefined; caption: string }>;
	const iconOf = (key: string) => items.find((i) => i.key === key)?.icon;

	// ----- Setup checklist -----
	const steps = [
		has('room') && { key: 'room', label: 'Create your first room', done: (t('room') ?? 0) > 0, start: onNewRoom ?? (() => onOpen('room')) },
		has('group') && { key: 'group', label: 'Add a group', done: (t('group') ?? 0) > 0, start: () => onOpen('group') },
		has('role') && { key: 'role', label: 'Define roles and permissions', done: (t('role') ?? 0) > 0, start: () => onOpen('role') },
		has('rule') && { key: 'rule', label: 'Add a sign-in rule', done: (t('rule') ?? 0) > 0, start: () => onOpen('rule') },
	].filter(Boolean) as Array<{ key: string; label: string; done: boolean; start: () => void }>;
	const stepsKnown = steps.every((s) => t(s.key) !== undefined);
	const doneCount = steps.filter((s) => s.done).length;
	const firstTodo = steps.find((s) => !s.done)?.key;

	const iconSquare = (Icon: SvgIconComponent | undefined, warn: boolean, size = 40) => (
		<Box aria-hidden sx={{ width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: warn ? attention.tint : ui.blueLight, color: warn ? attention.text : ui.blueDark }}>
			{warn ? <WarningAmberOutlinedIcon sx={{ fontSize: size * 0.5 }} /> : Icon && <Icon sx={{ fontSize: size * 0.5 }} />}
		</Box>
	);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 4 } }}>
			{/* Header */}
			<Box sx={{ display: 'flex', alignItems: { xs: 'stretch', md: 'flex-end' }, justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 1 }}>
						<Typography component='h2' sx={{ m: 0, fontSize: { xs: 24, md: 28 }, lineHeight: { xs: '32px', md: '36px' }, fontWeight: 700, color: ui.navy, overflowWrap: 'anywhere' }}>
							{name ? `${copy.welcome}, ${name}` : copy.welcome}
						</Typography>
						{roleLabel && <Box component='span' sx={{ fontSize: 12, lineHeight: '16px', fontWeight: 600, color: ui.navy, bgcolor: ui.orangeLight, border: `1px solid ${ui.orange}`, px: 1.25, py: '3px', whiteSpace: 'nowrap' }}>{roleLabel}</Box>}
					</Box>
					<Typography sx={{ fontSize: 16, lineHeight: '24px', color: ui.muted }}>{copy.subtitle}</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
					<TextField
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => { if (e.key === 'Enter' && shownItems[0]) onOpen(shownItems[0].key); }}
						placeholder={copy.findPlaceholder}
						sx={{ width: { xs: '100%', sm: 280 }, '& .MuiInputBase-root': { height: 44 } }}
						slotProps={{
							htmlInput: { 'aria-label': copy.find, type: 'search' },
							input: { startAdornment: <InputAdornment position='start'><SearchOutlinedIcon sx={{ color: ui.muted }} /></InputAdornment>, sx: squareInput },
						}}
					/>
					{has('room') && onNewRoom && (
						<ButtonBase onClick={onNewRoom} sx={{ height: 44, gap: 1, pl: 1.75, pr: 2.5, flexGrow: { xs: 1, sm: 0 }, bgcolor: ui.orange, color: ui.navy, fontSize: 15, fontWeight: 600, '&:hover': { bgcolor: ui.orangeHover }, '&.Mui-focusVisible': focusRing }}>
							<AddOutlinedIcon sx={{ fontSize: 20 }} />{copy.newRoom}
						</ButtonBase>
					)}
				</Box>
			</Box>

			{/* Key numbers */}
			<Box component='section' aria-label={copy.keyNumbers} sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: `repeat(${Math.max(kpis.length, 1)}, minmax(0, 1fr))` }, gap: 2 }}>
				{kpis.map((k, i) => {
					const warn = needs(k.key);

					return (
						<Box key={k.key} sx={{ ...cardSx, ...(warn ? { bgcolor: attention.bg, borderColor: attention.border } : {}), p: 2.5, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, ...staggerSx(i, intro) }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
								<Box component='span' sx={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: warn ? attention.text : ui.muted }}>{k.label}</Box>
								{iconSquare(iconOf(k.key), warn, 36)}
							</Box>
							<Box component='span' sx={{ position: 'relative', fontSize: 32, lineHeight: '40px', fontWeight: 700, color: ui.navy, fontVariantNumeric: 'tabular-nums' }}>
								{k.value === undefined ? <Skeleton width={40} sx={{ borderRadius: 0 }} /> : <CountUp value={k.value} />}
							</Box>
							<Box component='span' sx={{ minHeight: 18, fontSize: 13, lineHeight: '18px', fontWeight: warn ? 600 : 400, color: warn ? attention.text : ui.muted, ...ellipsis }}>{k.caption}</Box>
						</Box>
					);
				})}
			</Box>

			{/* Manage */}
			<Box component='section' aria-labelledby='overview-manage' sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<Typography id='overview-manage' component='h2' sx={{ m: 0, fontSize: 20, lineHeight: '28px', fontWeight: 700, color: ui.navy }}>{copy.manage}</Typography>
				{shownItems.length === 0 ? (
					<Box sx={{ ...cardSx, p: 3, textAlign: 'center', color: ui.muted }}>{copy.noMatch}</Box>
				) : (
					<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
						{shownItems.map((item, i) => {
							const warn = needs(item.key);
							const n = t(item.key);
							const action = warn ? (item.key === 'room' && onNewRoom ? onNewRoom : () => onOpen(item.key)) : () => onOpen(item.key);
							const actionText = warn ? (item.key === 'room' ? 'Create a room' : 'Create a role') : copy.open(item.label);

							return (
								<Box component='li' key={item.key} sx={{ display: 'flex', minWidth: 0, ...staggerSx(i + kpis.length, intro) }}>
									{/* 3D hover card (user brief 2026-10-26); orange when it needs attention. */}
									<TiltCard accent={warn ? 'orange' : 'blue'} restBorder={warn ? attention.border : undefined} sx={{ ...(warn ? { bgcolor: attention.bg } : {}), flexGrow: 1, minWidth: 0, p: '20px 20px 4px', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
											<Box className={tiltLayer.icon}>{iconSquare(item.icon, false, 44)}</Box>
											{warn && <Box component='span' sx={{ fontSize: 12, lineHeight: '16px', fontWeight: 700, color: attention.text, bgcolor: attention.tint, border: `1px solid ${attention.border}`, px: 1.25, py: '4px' }}>{copy.actionNeeded}</Box>}
										</Box>
										<Typography component='h3' className={tiltLayer.title} sx={{ m: 0, fontSize: 17, lineHeight: '24px', fontWeight: 700, color: ui.navy }}>{item.label}</Typography>
										<Typography className={tiltLayer.desc} sx={{ flexGrow: 1, fontSize: 14, lineHeight: '20px', color: ui.muted }}>{item.description}</Typography>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, borderTop: `1px solid ${warn ? attention.border : ui.lineSoft}`, pt: 0.5 }}>
											<Box component='span' sx={{ fontSize: 14, color: warn ? attention.text : ui.muted, fontVariantNumeric: 'tabular-nums' }}>{words[item.key] ? (n === undefined ? '' : countOf(item.key, n)) : ''}</Box>
											<ButtonBase onClick={action} sx={linkSx}>
												{actionText}<ArrowForwardOutlinedIcon aria-hidden sx={{ fontSize: 18 }} />
											</ButtonBase>
										</Box>
									</TiltCard>
								</Box>
							);
						})}
					</Box>
				)}
			</Box>

			{/* Recent activity + setup checklist */}
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 62fr) minmax(0, 38fr)' }, gap: 3, alignItems: 'start' }}>
				<Box component='section' aria-labelledby='overview-activity' sx={{ ...cardSx, minWidth: 0 }}>
					<Typography id='overview-activity' component='h2' sx={{ m: 0, px: 2.5, pt: 2, pb: 1, fontSize: 18, lineHeight: '26px', fontWeight: 700, color: ui.navy }}>{copy.activity}</Typography>
					{activity === null ? (
						<Box sx={{ px: 2.5, pb: 2 }}>{[ 0, 1, 2 ].map((i) => <Skeleton key={i} height={44} sx={{ borderRadius: 0 }} />)}</Box>
					) : activity.length === 0 ? (
						<Typography sx={{ px: 2.5, pb: 2.5, fontSize: 14, color: ui.muted }}>{copy.activityEmpty}</Typography>
					) : (
						<Box sx={{ overflowX: 'auto' }}>
							<Box component='table' sx={{ width: '100%', minWidth: { xs: 0, sm: 460 }, borderCollapse: 'collapse', fontSize: 14, '& th': { ...sectionLabelSx, textAlign: 'left', px: { xs: 1.5, sm: 2.5 }, py: 1.25, borderBottom: `1px solid ${ui.line}` }, '& td': { px: { xs: 1.5, sm: 2.5 }, py: 1.25, borderBottom: `1px solid ${ui.lineSoft}`, color: ui.text }, '& tr:last-of-type td': { borderBottom: 0 } }}>
								<thead><tr><th scope='col'>{copy.event}</th><th scope='col'>{copy.name}</th><th scope='col'>{copy.when}</th></tr></thead>
								<tbody>
									{activity.map((a) => (
										<tr key={`${a.kind}${a.id}`}>
											<Box component='td' sx={{ fontWeight: 600, whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>{a.event}</Box>
											<Box component='td' sx={{ maxWidth: { xs: 120, sm: 260 } }}>
												<ButtonBase onClick={() => onOpen(a.kind)} sx={{ ...linkSx, minHeight: 32, px: 0, display: 'block', maxWidth: '100%', textAlign: 'left', fontWeight: 500, ...ellipsis }}>{a.name}</ButtonBase>
											</Box>
											<Box component='td' sx={{ color: `${ui.muted} !important`, whiteSpace: { xs: 'normal', sm: 'nowrap' } }}>{whenText(a.at)}</Box>
										</tr>
									))}
								</tbody>
							</Box>
						</Box>
					)}
				</Box>

				{steps.length > 0 && (
					<Box component='section' aria-labelledby='overview-setup' sx={{ ...cardSx, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
							<Typography id='overview-setup' component='h2' sx={{ m: 0, fontSize: 18, lineHeight: '26px', fontWeight: 700, color: ui.navy }}>{copy.setup}</Typography>
							{stepsKnown && <Box component='span' sx={{ fontSize: 14, fontWeight: 600, color: ui.muted }}>{copy.setupDone(doneCount, steps.length)}</Box>}
						</Box>
						<Box role='progressbar' aria-label={copy.setupProgress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stepsKnown ? Math.round((doneCount / steps.length) * 100) : 0} sx={{ height: 8, bgcolor: ui.blueLight }}>
							<Box sx={{ height: '100%', width: `${stepsKnown ? (doneCount / steps.length) * 100 : 0}%`, bgcolor: ui.blue, transition: 'width 450ms ease', '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }} />
						</Box>
						<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0 }}>
							{steps.map((s) => {
								const warn = !s.done && s.key === firstTodo;

								return (
									<Box component='li' key={s.key} sx={{ minHeight: 48, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${ui.lineSoft}`, '&:last-of-type': { borderBottom: 0 } }}>
										{s.done ? (
											<CheckCircleRoundedIcon titleAccess={copy.done} sx={{ fontSize: 22, color: ui.green }} />
										) : (
											<Box component='span' role='img' aria-label={copy.todo} sx={{ width: 18, height: 18, mx: '2px', flexShrink: 0, borderRadius: '50%', border: `2px dashed ${warn ? ui.orange : ui.slateDot}` }} />
										)}
										<Box component='span' sx={{ flexGrow: 1, fontSize: 15, lineHeight: '20px', fontWeight: s.done ? 400 : 600, color: s.done ? ui.muted : ui.text, textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</Box>
										{!s.done && stepsKnown && <ButtonBase onClick={s.start} sx={{ ...linkSx, color: warn ? attention.text : ui.blueDark }}>{copy.start}</ButtonBase>}
									</Box>
								);
							})}
						</Box>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default Overview;
