import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Box, Button, ButtonBase, Dialog, IconButton, InputAdornment, MenuItem, Skeleton, Slide, Tab, Tabs, TextField, Typography, useMediaQuery } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { Tenant, User } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { getData, patchData } from '../../../store/actions/managementActions';
import UserStats from './UserStats';
import { asNumber, ellipsis, focusRing, initialsOf, sectionLabelSx, squareInput, str, ui } from './userUi';
import { SavedTick, liftOn, liftTransition, savedButtonSx, staggerSx, useFlip, useIntro, useJustSaved } from '../motion';
import { applyLabel, cancelLabel, closeLabel, hiddenEmailLabel, hiddenNameLabel, nameFieldLabel, rolesLabel, tenantAdminLabel, tenantLabel, tenantOwnerLabel, undefinedLabel, usersLabel } from '../../translated/translatedComponents';

// Users screen (user brief 2026-10-17, canvas option B): People and
// Statistics tabs (UserStats.tsx); square people cards with search, access,
// tenant and sort filters, a Cards/List switch,
// and a details modal that slides down from the top (user request
// 2026-10-17; it replaced a side panel), full screen on phones.
// Email, tenant and SSO ID come from sign-in and stay read only; only the
// name and avatar can be changed (the API accepts nothing else). Colours
// follow the admin console (Management.tsx, Room.tsx).
// The details modal drops in from the top of the screen and slides back up
// when it closes; the overlay fades on the same clock. MUI's Modal already
// covers the screen, locks page scrolling and waits for the exit animation
// before it unmounts.
const modalDuration = { enter: 360, exit: 300 } as const;
const modalEasing = {
	enter: 'cubic-bezier(0.16, 1, 0.3, 1)', // fast start, long soft landing
	exit: 'cubic-bezier(0.4, 0, 1, 1)', // moves at once, speeds up as it leaves
} as const;

const SlideDown = forwardRef(function SlideDownTransition(
	props: TransitionProps & { children: React.ReactElement },
	ref: React.Ref<unknown>,
) {
	return <Slide direction='down' ref={ref} {...props} />;
});

const copy = {
	subtitle: 'Find people and manage their accounts. People join through single sign-on.',
	all: 'All',
	owners: 'Owners',
	admins: 'Admins',
	members: 'Members',
	member: 'Member',
	access: 'Access',
	search: 'Search name, email or SSO ID',
	// The shared ssoId/email/avatar labels read as raw keys ("ssoId"), so
	// this screen spells them out.
	ssoId: 'SSO ID',
	email: 'Email',
	avatar: 'Picture URL',
	searchShort: 'Search users',
	tabs: 'Users view',
	people: 'People',
	statistics: 'Statistics',
	allTenants: 'All tenants',
	sort: 'Sort',
	sortNameAsc: 'Name A–Z',
	sortNameDesc: 'Name Z–A',
	sortNewest: 'Newest first',
	sortOldest: 'Oldest first',
	view: 'View',
	cards: 'Cards',
	list: 'List',
	user: 'User',
	showMore: 'Show more',
	showing: (n: number, total: number) => `Showing ${n} of ${total}`,
	noUsers: 'No users match your search.',
	clearFilters: 'Clear filters',
	fromSignIn: 'From sign-in · read only',
	profile: 'Profile',
	avatarHelp: 'Link to a square picture (https://…). Leave empty to show initials.',
	accessHelp: 'Owner and admin rights are set on the Tenants page.',
	readOnlyHelp: 'You can only change your own profile.',
	saved: 'Saved',
	userNo: (id: number) => `User #${id}`,
} as const;

type AccessFilter = 'all' | 'owners' | 'admins' | 'members';
type SortKey = 'name-asc' | 'name-desc' | 'newest' | 'oldest';
type ViewKey = 'cards' | 'list';
const PAGE = 24;
const VIEW_KEY = 'mgmt-users-view';
const TAB_KEY = 'mgmt-users-tab';

type TabKey = 'people' | 'stats';

// The API sends role names or role objects; show whichever it has.
// The super-admin account role is never shown (user request 2026-10-13).
const roleNames = (u: User): string[] => (Array.isArray(u.roles) ? u.roles : [])
	.map((r: unknown) => (typeof r === 'string' ? r : str((r as { name?: unknown })?.name)))
	.filter((r) => r && r !== 'super-admin');

type Tag = { label: string; color: string; bg: string; strong?: boolean };

const tagsOf = (u: User): Tag[] => {
	const tags: Tag[] = [];

	if (u.tenantOwner) tags.push({ label: tenantOwnerLabel(), color: ui.navy, bg: ui.orange, strong: true });
	if (u.tenantAdmin) tags.push({ label: tenantAdminLabel(), color: '#fff', bg: ui.navy, strong: true });
	roleNames(u).forEach((r) => tags.push({ label: r, color: ui.blueDark, bg: ui.blueLight }));
	if (!tags.length) tags.push({ label: copy.member, color: ui.slate, bg: ui.grey });

	return tags;
};

const Tags = ({ user, size = 12, nowrap = false }: { user: User; size?: number; nowrap?: boolean }) => (
	<Box sx={{ display: 'flex', flexWrap: nowrap ? 'nowrap' : 'wrap', gap: '4px', minWidth: 0, overflow: nowrap ? 'hidden' : 'visible' }}>
		{tagsOf(user).map((t) => (
			<Box component='span' key={t.label} sx={{ flexShrink: 0, fontSize: size, lineHeight: `${size + 4}px`, fontWeight: t.strong ? 600 : 500, color: t.color, bgcolor: t.bg, px: '8px', py: '3px', whiteSpace: 'nowrap' }}>
				{t.label}
			</Box>
		))}
	</Box>
);

// Square picture or initials. Owners get a navy tile so they stand out.
const UserAvatar = ({ user, size }: { user: User; size: number }) => {
	const hidden = !str(user.name) && !str(user.email);

	return (
		<Avatar
			variant='square'
			src={str(user.avatar) || undefined}
			alt=''
			sx={{
				width: size,
				height: size,
				flexShrink: 0,
				fontSize: Math.round(size * 0.36),
				fontWeight: 700,
				bgcolor: hidden ? ui.lineSoft : user.tenantOwner ? ui.navy : ui.blueLight,
				color: hidden ? ui.slate : user.tenantOwner ? '#fff' : ui.blueDark,
			}}
		>
			{initialsOf(str(user.name), str(user.email))}
		</Avatar>
	);
};

const nameText = (u: User) => str(u.name) || hiddenNameLabel();
const emailText = (u: User) => str(u.email) || hiddenEmailLabel();
// Orange only at 19px bold or larger (#c96a00 is 3.8:1 on white, large-text
// contrast); smaller names, as in the list, use navy.
const nameSx = (u: User, color: string = ui.orangeText) => ({ color: str(u.name) ? color : ui.muted, fontStyle: str(u.name) ? 'normal' : 'italic' });
const emailSx = (u: User) => ({ fontStyle: str(u.email) ? 'normal' : 'italic' });
const hoverSx = (selectedNow: boolean, bar: 'bottom' | 'left') => {
	const shadow = bar === 'bottom' ? `inset 0 -4px 0 ${ui.orange}` : `inset 4px 0 0 ${ui.orange}`;
	const active = { bgcolor: ui.orangeLight, borderColor: ui.orange, boxShadow: shadow };

	// Cards also lift on hover (2026-10-18); list rows stay flat.
	return {
		transition: `background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, ${liftTransition}`,
		...(selectedNow ? active : {}),
		'&:hover, &.Mui-focusVisible': bar === 'bottom' ? { ...active, ...liftOn(shadow) } : active,
		'&.Mui-focusVisible': { ...active, ...focusRing },
		'@media (prefers-reduced-motion: reduce)': { transition: 'none' },
	};
};
const listColumns = 'minmax(0, 2.4fr) minmax(0, 1.3fr) minmax(0, 1.8fr) minmax(0, 1.1fr) 24px';

type UserItemProps = {
	user: User;
	tenantName: string;
	variant: 'card' | 'phone' | 'row';
	on: boolean;
	onOpen: React.Dispatch<{ user: User; trigger: HTMLElement }>;
};

// One user in the grid or list. Memoised, so opening, closing or typing in
// the modal only redraws the card whose state changed and the slide starts
// on the next frame.
const UserItem = memo(function UserItemView({ user: u, tenantName, variant, on, onOpen }: UserItemProps) {
	if (variant === 'phone') {
		return (
			<ButtonBase
				onClick={(e) => onOpen({ user: u, trigger: e.currentTarget })}
				sx={{ width: '100%', minHeight: 76, px: 1.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, textAlign: 'left', bgcolor: '#fff', border: `1px solid ${ui.line}`, ...hoverSx(false, 'left') }}
			>
				<UserAvatar user={u} size={44} />
				<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
					<Box component='span' sx={{ fontSize: 19, lineHeight: '24px', fontWeight: 700, ...nameSx(u), ...ellipsis }}>{nameText(u)}</Box>
					<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{tenantName}</Box>
					<Tags user={u} size={11} nowrap />
				</Box>
				<ChevronRightOutlinedIcon sx={{ color: ui.slateDot, flexShrink: 0 }} />
			</ButtonBase>
		);
	}

	if (variant === 'row') {
		return (
			<ButtonBase
				aria-pressed={on}
				onClick={(e) => onOpen({ user: u, trigger: e.currentTarget })}
				sx={{ width: '100%', minHeight: 56, px: 2, display: 'grid', gridTemplateColumns: listColumns, gap: 2, alignItems: 'center', textAlign: 'left', bgcolor: '#fff', border: 0, ...hoverSx(on, 'left') }}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
					<UserAvatar user={u} size={34} />
					<Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
						<Box component='span' sx={{ fontSize: 14, lineHeight: '18px', fontWeight: 600, ...nameSx(u, ui.navy), ...ellipsis }}>{nameText(u)}</Box>
						<Box component='span' sx={{ fontSize: 12, lineHeight: '16px', color: ui.muted, ...emailSx(u), ...ellipsis }}>{emailText(u)}</Box>
					</Box>
				</Box>
				<Box component='span' sx={{ fontSize: 14, color: ui.body, ...ellipsis }}>{tenantName}</Box>
				<Tags user={u} nowrap />
				<Box component='span' sx={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 12, color: ui.body, ...ellipsis }}>{str(u.ssoId) || '—'}</Box>
				<ChevronRightOutlinedIcon sx={{ fontSize: 20, color: ui.slateDot }} />
			</ButtonBase>
		);
	}

	return (
		<ButtonBase
			aria-pressed={on}
			onClick={(e) => onOpen({ user: u, trigger: e.currentTarget })}
			sx={{ flexGrow: 1, minWidth: 0, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1.5, textAlign: 'left', bgcolor: '#fff', border: `1px solid ${ui.line}`, ...hoverSx(on, 'bottom') }}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
				<UserAvatar user={u} size={48} />
				<Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
					<Box component='span' sx={{ fontSize: 19, lineHeight: '24px', fontWeight: 700, ...nameSx(u), ...ellipsis }}>{nameText(u)}</Box>
					<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...emailSx(u), ...ellipsis }}>{emailText(u)}</Box>
				</Box>
			</Box>
			<Box sx={{ pt: 1.5, borderTop: `1px solid ${ui.lineSoft}`, display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', columnGap: 1, rowGap: '6px', fontSize: 13, lineHeight: '18px' }}>
				<Box component='span' sx={{ color: ui.muted }}>{tenantLabel()}</Box>
				<Box component='span' sx={{ color: ui.text, fontWeight: 500, ...ellipsis }}>{tenantName}</Box>
				<Box component='span' sx={{ color: ui.muted }}>{copy.ssoId}</Box>
				<Box component='span' sx={{ color: ui.body, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 12, ...ellipsis }}>{str(u.ssoId) || '—'}</Box>
			</Box>
			<Box sx={{ flexGrow: 1 }} />
			<Tags user={u} />
		</ButtonBase>
	);
});

const UserTable = () => {
	const dispatch = useAppDispatch();
	const { tenantAdmin, tenantOwner, superAdmin, email: myEmail } = useAppSelector((state) => state.management);
	const isAdmin = tenantAdmin || tenantOwner || superAdmin;

	const [ tenants, setTenants ] = useState<Tenant[]>([]);
	const [ data, setData ] = useState<User[]>([]);
	const [ isLoading, setIsLoading ] = useState(true);

	const getTenantName = (id: unknown): string => {
		const t = tenants.find((x) => x.id == asNumber(id));

		return t && t.name ? t.name : `${tenantLabel()} - ${undefinedLabel()}`;
	};

	const fetchUsers = () => Promise.all([
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) setTenants(tdata.data ?? []);
		}),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('users')).then((tdata: any) => {
			if (tdata != undefined) setData(tdata.data ?? []);
		}),
	]).finally(() => setIsLoading(false));

	useEffect(() => {
		fetchUsers();
	}, []);

	// ----- Filters -----
	const phone = useMediaQuery('(max-width: 599.95px)');
	const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
	const [ access, setAccess ] = useState<AccessFilter>('all');
	const [ search, setSearch ] = useState('');
	const [ tenantFilter, setTenantFilter ] = useState('all');
	const [ sortKey, setSortKey ] = useState<SortKey>('name-asc');
	const [ limit, setLimit ] = useState(PAGE);
	const [ view, setView ] = useState<ViewKey>(() => {
		try {
			return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards';
		} catch {
			return 'cards';
		}
	});
	const [ tab, setTab ] = useState<TabKey>(() => {
		try {
			return localStorage.getItem(TAB_KEY) === 'stats' ? 'stats' : 'people';
		} catch {
			return 'people';
		}
	});
	const pickTab = (t: TabKey) => {
		setTab(t);
		try {
			localStorage.setItem(TAB_KEY, t);
		} catch {
			// private window: the choice just isn't remembered
		}
	};
	const pickView = (v: ViewKey) => {
		setView(v);
		try {
			localStorage.setItem(VIEW_KEY, v);
		} catch {
			// private window: the choice just isn't remembered
		}
	};

	const isMember = (u: User) => !u.tenantOwner && !u.tenantAdmin;
	const counts = {
		all: data.length,
		owners: data.filter((u) => u.tenantOwner).length,
		admins: data.filter((u) => u.tenantAdmin).length,
		members: data.filter(isMember).length,
	};
	const visibleUsers = useMemo(() => {
		const q = search.trim().toLowerCase();
		const list = data
			.filter((u) => access === 'all' || (access === 'owners' ? u.tenantOwner : access === 'admins' ? u.tenantAdmin : isMember(u)))
			.filter((u) => tenantFilter === 'all' || String(u.tenantId) === tenantFilter)
			.filter((u) => !q || `${str(u.name)} ${str(u.email)} ${str(u.ssoId)}`.toLowerCase().includes(q));
		// People without a name sort by email, and hidden ones go last.
		const sortName = (u: User) => (str(u.name) || str(u.email) || '￿').toLowerCase();

		return [ ...list ].sort((a, b) => {
			if (sortKey === 'newest') return asNumber(b.id) - asNumber(a.id);
			if (sortKey === 'oldest') return asNumber(a.id) - asNumber(b.id);
			const byName = sortName(a).localeCompare(sortName(b));

			return sortKey === 'name-desc' ? -byName : byName;
		});
	}, [ data, access, tenantFilter, search, sortKey ]);
	const filtersOn = access !== 'all' || tenantFilter !== 'all' || search.trim() !== '';
	const clearFilters = () => {
		setAccess('all');
		setTenantFilter('all');
		setSearch('');
		setLimit(PAGE);
	};

	// ----- Details panel -----
	// selectedId stays set while the modal slides out, so it never goes blank.
	const [ selectedId, setSelectedId ] = useState<number | null>(null);
	const [ panelOpen, setPanelOpen ] = useState(false);
	const selected = data.find((u) => asNumber(u.id) === selectedId) ?? null;
	const [ draftName, setDraftName ] = useState('');
	const [ draftAvatar, setDraftAvatar ] = useState('');
	const [ saving, setSaving ] = useState(false);
	const [ savedAt, setSavedAt ] = useState(0);
	const lastTrigger = useRef<HTMLElement | null>(null);

	// Stable, so the memoised cards don't redraw when the modal state changes.
	const openUser = useCallback(({ user: u, trigger }: { user: User; trigger: HTMLElement }) => {
		lastTrigger.current = trigger;
		setSelectedId(asNumber(u.id));
		setPanelOpen(true);
		setDraftName(str(u.name));
		setDraftAvatar(str(u.avatar));
		setSavedAt(0);
	}, []);
	// The Dialog hands focus back to the card that opened it.
	const closePanel = () => setPanelOpen(false);

	const isSelf = Boolean(selected && myEmail && str(selected.email) === myEmail);
	const canEdit = isAdmin || isSelf;
	const dirty = Boolean(selected && (draftName !== str(selected.name) || draftAvatar !== str(selected.avatar)));
	const canApply = canEdit && dirty && draftName.trim() !== '' && !saving;

	const resetDraft = () => {
		if (!selected) return;
		setDraftName(str(selected.name));
		setDraftAvatar(str(selected.avatar));
	};
	const save = () => {
		if (!selected || !canApply) return;
		setSaving(true);
		dispatch(patchData(asNumber(selected.id), { name: draftName.trim(), avatar: draftAvatar.trim() }, 'users'))
			.then(() => fetchUsers())
			.then(() => setSavedAt(Date.now()))
			.finally(() => setSaving(false));
	};

	// ----- Pieces -----
	const segmented = <K extends string>(label: string, value: K, options: Array<[K, React.ReactNode, string?]>, onPick: React.Dispatch<K>, fill = false) => (
		<Box role='group' aria-label={label} sx={{ display: 'flex', flexShrink: 0, border: `1px solid ${ui.line}`, bgcolor: '#fff', width: fill ? { xs: '100%', sm: 'auto' } : 'auto' }}>
			{options.map(([ key, content, aria ], i) => {
				const on = value === key;

				return (
					<ButtonBase
						key={key}
						aria-pressed={on}
						aria-label={aria}
						onClick={() => onPick(key)}
						sx={{
							flex: fill ? { xs: 1, sm: 'none' } : 'none',
							height: { xs: 42, sm: 38 },
							px: 1.75,
							gap: 0.75,
							borderLeft: i ? `1px solid ${ui.line}` : 0,
							bgcolor: on ? ui.navy : '#fff',
							color: on ? '#fff' : ui.body,
							fontSize: 14,
							fontWeight: on ? 600 : 400,
							whiteSpace: 'nowrap',
							'&:hover': { bgcolor: on ? ui.navy : ui.grey },
							'&.Mui-focusVisible': focusRing,
						}}
					>
						{content}
					</ButtonBase>
				);
			})}
		</Box>
	);

	const shown = visibleUsers.slice(0, limit);
	// Motion (2026-10-18): cards rise in on first show, and cards or rows
	// slide to their new places when a filter or sort changes.
	const intro = useIntro(shown.length > 0);
	const listRef = useRef<HTMLDivElement>(null);

	useFlip(listRef, `${view === 'list' && !phone ? 'l' : 'c'}:${shown.map((u) => u.id)
		.join(',')}`);
	const justSaved = useJustSaved(savedAt);
	const listMode = view === 'list' && !phone;

	const results = isLoading && data.length === 0 ? (
		<Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(250px, 1fr))' }, gap: { xs: 1, sm: 2 } }}>
			{[ 0, 1, 2, 3, 4, 5, 6, 7 ].map((i) => <Skeleton key={i} variant='rectangular' height={phone ? 76 : 210} sx={{ borderRadius: 0 }} />)}
		</Box>
	) : visibleUsers.length === 0 ? (
		<Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, bgcolor: '#fff', border: `1px solid ${ui.line}` }}>
			<Typography sx={{ color: ui.muted }}>{copy.noUsers}</Typography>
			{filtersOn && <Button variant='outlined' onClick={clearFilters} sx={{ borderRadius: 0 }}>{copy.clearFilters}</Button>}
		</Box>
	) : listMode ? (
		<Box sx={{ bgcolor: '#fff', border: `1px solid ${ui.line}`, overflowX: 'auto' }}>
			<Box sx={{ minWidth: 760 }}>
				<Box aria-hidden sx={{ height: 40, px: 2, display: 'grid', gridTemplateColumns: listColumns, gap: 2, alignItems: 'center', bgcolor: '#f8fafc', borderBottom: `1px solid ${ui.line}`, ...sectionLabelSx }}>
					<span>{copy.user}</span><span>{tenantLabel()}</span><span>{copy.access}</span><span>{copy.ssoId}</span><span />
				</Box>
				<Box component='ul' aria-label={usersLabel()} sx={{ listStyle: 'none', m: 0, p: 0 }}>
					{shown.map((u) => (
						<Box component='li' key={u.id} data-flip={`l${u.id}`} sx={{ borderBottom: `1px solid ${ui.lineSoft}`, '&:last-of-type': { borderBottom: 0 } }}><UserItem user={u} tenantName={getTenantName(u.tenantId)} variant='row' on={panelOpen && asNumber(u.id) === selectedId} onOpen={openUser} /></Box>
					))}
				</Box>
			</Box>
		</Box>
	) : (
		<Box
			component='ul'
			aria-label={usersLabel()}
			sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(250px, 1fr))' }, gap: { xs: 1, sm: 2 } }}
		>
			{shown.map((u, index) => (
				<Box component='li' key={u.id} data-flip={`c${u.id}`} sx={{ minWidth: 0, display: 'flex', ...staggerSx(index, intro) }}><UserItem user={u} tenantName={getTenantName(u.tenantId)} variant={phone ? 'phone' : 'card'} on={panelOpen && asNumber(u.id) === selectedId} onOpen={openUser} /></Box>
			))}
		</Box>
	);

	const readOnlyRow = (label: string, value: string, opts: { mono?: boolean; italic?: boolean } = {}) => (
		<Box sx={{ minHeight: 40, display: 'flex', alignItems: 'center', gap: 1.5, borderTop: `1px solid ${ui.lineSoft}`, fontSize: 14 }}>
			<Box component='span' sx={{ width: 76, flexShrink: 0, color: ui.muted }}>{label}</Box>
			<Box component='span' sx={{ flexGrow: 1, minWidth: 0, color: ui.text, overflowWrap: 'anywhere', fontStyle: opts.italic ? 'italic' : 'normal', ...(opts.mono ? { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 13 } : {}) }}>{value}</Box>
			<LockOutlinedIcon aria-hidden sx={{ fontSize: 16, color: ui.slateDot }} />
		</Box>
	);

	const panelTitleId = 'user-panel-title';
	const panel = selected && (
		<Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderTop: `4px solid ${ui.orange}` }}>
			<Box sx={{ flexShrink: 0, minHeight: 56, px: { xs: 2, sm: 2.5 }, pr: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${ui.lineSoft}` }}>
				<Typography id={panelTitleId} component='h2' sx={{ flexGrow: 1, m: 0, fontSize: 16, lineHeight: '24px', fontWeight: 600, color: ui.navy }}>
					{copy.user}
				</Typography>
				<IconButton onClick={closePanel} aria-label={closeLabel()} sx={{ width: 44, height: 44, borderRadius: 0, color: ui.navy }}>
					<CloseOutlinedIcon />
				</IconButton>
			</Box>

			<Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', px: { xs: 2, sm: 2.5 }, py: 2.25, display: 'flex', flexDirection: 'column', gap: 2.75 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
					<UserAvatar user={{ ...selected, avatar: draftAvatar, name: draftName || str(selected.name) }} size={64} />
					<Box sx={{ minWidth: 0 }}>
						<Box sx={{ fontSize: 20, lineHeight: '28px', fontWeight: 700, overflowWrap: 'anywhere', ...nameSx(selected) }}>{nameText(selected)}</Box>
						<Box sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{copy.userNo(asNumber(selected.id))}</Box>
					</Box>
				</Box>

				<Box component='section' aria-label={copy.fromSignIn}>
					<Typography component='h3' sx={{ ...sectionLabelSx, mb: 0.75 }}>{copy.fromSignIn}</Typography>
					{readOnlyRow(copy.email, emailText(selected), { italic: !str(selected.email) })}
					{readOnlyRow(tenantLabel(), getTenantName(selected.tenantId))}
					<Box sx={{ borderBottom: `1px solid ${ui.lineSoft}` }}>{readOnlyRow(copy.ssoId, str(selected.ssoId) || '—', { mono: true })}</Box>
				</Box>

				<Box component='section' aria-label={copy.profile} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Typography component='h3' sx={sectionLabelSx}>{copy.profile}</Typography>
					<TextField
						label={nameFieldLabel()}
						required
						fullWidth
						value={draftName}
						onChange={(e) => { setDraftName(e.target.value); setSavedAt(0); }}
						disabled={!canEdit}
						error={canEdit && dirty && draftName.trim() === ''}
						slotProps={{ input: { sx: { borderRadius: 0 } } }}
					/>
					<TextField
						label={copy.avatar}
						type='url'
						fullWidth
						value={draftAvatar}
						placeholder='https://'
						onChange={(e) => { setDraftAvatar(e.target.value); setSavedAt(0); }}
						disabled={!canEdit}
						helperText={canEdit ? copy.avatarHelp : copy.readOnlyHelp}
						slotProps={{ input: { sx: { borderRadius: 0 } } }}
					/>
				</Box>

				<Box component='section' aria-label={copy.access} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
					<Typography component='h3' sx={sectionLabelSx}>{copy.access}</Typography>
					<Tags user={selected} size={13} />
					{roleNames(selected).length === 0 && (selected.tenantOwner || selected.tenantAdmin) && (
						<Box sx={{ fontSize: 13, color: ui.muted }}>{rolesLabel()}: —</Box>
					)}
					<Box sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{copy.accessHelp}</Box>
				</Box>
			</Box>

			<Box sx={{ flexShrink: 0, minHeight: 68, px: { xs: 2, sm: 2.5 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderTop: `1px solid ${ui.lineSoft}` }}>
				<Box role='status' aria-live='polite' sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 14, fontWeight: 600, color: ui.green }}>
					{savedAt > 0 && !dirty && <><CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />{copy.saved}</>}
				</Box>
				<Button variant='outlined' onClick={dirty ? resetDraft : closePanel} sx={{ borderRadius: 0, height: 44 }}>{dirty ? cancelLabel() : closeLabel()}</Button>
				<Button onClick={save} disabled={!canApply} sx={{ borderRadius: 0, height: 44, px: 2.75, bgcolor: ui.orange, color: ui.navy, fontWeight: 600, '&:hover': { bgcolor: ui.orangeHover }, '&.Mui-disabled': { bgcolor: ui.lineSoft, color: ui.muted }, ...(justSaved ? savedButtonSx : {}) }}>
					{justSaved ? <SavedTick label={copy.saved} /> : applyLabel()}
				</Button>
			</Box>
		</Box>
	);

	return <>
		<Box ref={listRef} component='section' aria-labelledby='mgmt-section-title' sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
			<Box sx={{ minWidth: 0 }}>
				<Typography id='mgmt-section-title' component='h2' sx={{ m: 0, fontSize: { xs: 24, md: 28 }, lineHeight: { xs: '32px', md: '36px' }, fontWeight: 700, color: ui.orangeText }}>
					{usersLabel()}
				</Typography>
				<Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 15, lineHeight: '22px', color: ui.muted }}>{copy.subtitle}</Typography>
			</Box>

			<Tabs
				value={tab}
				onChange={(_e, v: TabKey) => pickTab(v)}
				aria-label={copy.tabs}
				sx={{ minHeight: 48, borderBottom: `1px solid ${ui.line}`, '& .MuiTabs-indicator': { height: 3, bgcolor: ui.orange } }}
			>
				{([ [ 'people', copy.people ], [ 'stats', copy.statistics ] ] as Array<[TabKey, string]>).map(([ key, label ]) => (
					<Tab
						key={key}
						value={key}
						id={`users-tab-${key}`}
						aria-controls={`users-panel-${key}`}
						disableRipple
						label={key === 'people'
							? <Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{label}<Box component='span' sx={{ fontSize: 12, fontWeight: 600, color: ui.slate, bgcolor: ui.grey, px: '7px', py: '2px' }}>{data.length}</Box></Box>
							: label}
						sx={{ minHeight: 48, px: 2, textTransform: 'none', fontSize: 15, fontWeight: 500, color: ui.body, '&.Mui-selected': { color: ui.navy, fontWeight: 600 }, '&.Mui-focusVisible': { ...focusRing, outlineOffset: -2 } }}
					/>
				))}
			</Tabs>

			{tab === 'stats' ? (
				<Box role='tabpanel' id='users-panel-stats' aria-labelledby='users-tab-stats'>
					<UserStats users={data} tenants={tenants} loading={isLoading} />
				</Box>
			) : <Box role='tabpanel' id='users-panel-people' aria-labelledby='users-tab-people' sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
				<Box sx={{ p: { xs: 0, sm: 1.5 }, bgcolor: { xs: 'transparent', sm: '#fff' }, border: { xs: 0, sm: `1px solid ${ui.line}` }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
					<TextField
						value={search}
						onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }}
						placeholder={phone ? copy.searchShort : copy.search}
						size={phone ? 'medium' : 'small'}
						sx={{ width: { xs: '100%', sm: 300 } }}
						slotProps={{
							htmlInput: { 'aria-label': copy.searchShort, type: 'search' },
							input: { startAdornment: <InputAdornment position='start'><SearchOutlinedIcon sx={{ color: ui.muted }} /></InputAdornment>, sx: squareInput },
						}}
					/>
					{segmented<AccessFilter>(copy.access, access, [
						[ 'all', `${copy.all} ${counts.all}` ],
						[ 'owners', `${copy.owners} ${counts.owners}` ],
						[ 'admins', `${copy.admins} ${counts.admins}` ],
						...(phone ? [] : [ [ 'members', `${copy.members} ${counts.members}` ] as [AccessFilter, string] ]),
					], (k) => { setAccess(k); setLimit(PAGE); }, true)}
					<Box sx={{ display: 'flex', gap: 1.5, flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
						{tenants.length > 1 && (
							<TextField
								select
								size='small'
								value={tenantFilter}
								onChange={(e) => { setTenantFilter(e.target.value); setLimit(PAGE); }}
								slotProps={{ htmlInput: { 'aria-label': tenantLabel() }, input: { sx: squareInput } }}
								sx={{ flex: { xs: 1, sm: 'none' }, minWidth: 170 }}
							>
								<MenuItem value='all'>{copy.allTenants}</MenuItem>
								{tenants.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}
							</TextField>
						)}
						<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
						<TextField
							select
							size='small'
							value={sortKey}
							onChange={(e) => setSortKey(e.target.value as SortKey)}
							slotProps={{ htmlInput: { 'aria-label': copy.sort }, input: { sx: squareInput } }}
							sx={{ flex: { xs: 1, sm: 'none' }, minWidth: 150 }}
						>
							<MenuItem value='name-asc'>{copy.sortNameAsc}</MenuItem>
							<MenuItem value='name-desc'>{copy.sortNameDesc}</MenuItem>
							<MenuItem value='newest'>{copy.sortNewest}</MenuItem>
							<MenuItem value='oldest'>{copy.sortOldest}</MenuItem>
						</TextField>
						{!phone && segmented<ViewKey>(copy.view, view, [
							[ 'cards', <GridViewOutlinedIcon key='c' sx={{ fontSize: 20 }} />, copy.cards ],
							[ 'list', <ViewListOutlinedIcon key='l' sx={{ fontSize: 20 }} />, copy.list ],
						], pickView)}
					</Box>
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
					<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
						{results}
						{visibleUsers.length > 0 && (
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', fontSize: 13, color: ui.muted }}>
								<span>{copy.showing(shown.length, visibleUsers.length)}</span>
								{visibleUsers.length > limit && (
									<Button variant='outlined' onClick={() => setLimit((n) => n + PAGE)} sx={{ borderRadius: 0, height: 44, px: 3 }}>{copy.showMore}</Button>
								)}
							</Box>
						)}
					</Box>
				</Box>
			</Box>}
		</Box>

		<Dialog
			open={panelOpen && selected !== null}
			onClose={closePanel}
			fullScreen={phone}
			fullWidth
			maxWidth={false}
			slots={{ transition: SlideDown }}
			transitionDuration={reduceMotion ? 0 : modalDuration}
			slotProps={{
				transition: { easing: modalEasing },
				paper: { 'aria-labelledby': panelTitleId, sx: { width: phone ? '100%' : 520, maxWidth: '100%', m: phone ? 0 : 2, maxHeight: phone ? '100%' : 'calc(100% - 32px)', borderRadius: 0, overflow: 'hidden' } },
			}}
		>
			{panel}
		</Dialog>
	</>;
};

export default UserTable;
