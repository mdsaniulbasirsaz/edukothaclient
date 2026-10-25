import { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Box, Button, ButtonBase, Chip, Collapse, Dialog, InputAdornment, MenuItem, Skeleton, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { BotPolicy, Room, Tenant, TenantAdmins, TenantBotCredential, TenantFQDN, TenantInviteConfig, TenantOAuth, TenantOwners, User } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, getDataByTenantID, patchData } from '../../../store/actions/managementActions';
import { managamentActions } from '../../../store/slices/managementSlice';
import { notificationsActions } from '../../../store/slices/notificationsSlice';
import edumeetConfig from '../../../utils/edumeetConfig';
import { localeList } from '../../../utils/intlManager';
import { asNumber, ellipsis, focusRing, sectionLabelSx, squareInput, str, ui } from '../users/userUi';
import { botPolicyOptionLabel, cancelLabel, nameCannotBeEmptyLabel, selectAtLeastOneRegionLabel, tenantLocaleNoneLabel, tenantsLabel } from '../../translated/translatedComponents';
import { SavedNote, SectionBody, ToggleRow, dangerOutlinedSx, fieldProps, orangeButtonSx, rowsOf, sameId } from './tenantShared';
import TenantDomainsSection from './TenantDomainsSection';
import TenantSignInSection from './TenantSignInSection';
import TenantPeopleSection from './TenantPeopleSection';
import TenantInvitesSection from './TenantInvitesSection';
import TenantBotsSection from './TenantBotsSection';
import { SavedTick, liftOn, liftTransition, savedButtonSx, staggerSx, useFlip, useIntro, useJustSaved } from '../motion';

// Tenants screen (user brief 2026-10-17, canvas TenantsA + TenantsB): tenant
// cards with a setup checklist, and a settings PAGE per tenant (not a modal,
// there is too much for one) with a left menu: General, Web addresses,
// Sign-in, Owners & admins, Email invites, Bots. Phones show the menu as a
// list and one section per screen. A tenant admin with one tenant lands on
// its page straight away. The open tenant is kept in ?tenant= so Back works.
// Desktop can switch the list to a sortable table (2026-10-18).
export interface TenantProp {
	tenantId: number;
}

const copy = {
	subtitle: 'Each tenant is an organisation with its own web address, sign-in, people and settings.',
	addTenant: 'Add tenant',
	newTenant: 'New tenant',
	search: 'Name or web address',
	searchShort: 'Search tenants',
	all: 'All',
	ready: 'Ready',
	needsSetup: 'Needs setup',
	setupFilter: 'Setup',
	sort: 'Sort',
	sortNameAsc: 'Name A–Z',
	sortNameDesc: 'Name Z–A',
	sortUsers: 'Most users',
	noTenants: 'No tenants match your search.',
	clearFilters: 'Clear filters',
	users: 'users',
	rooms: 'rooms',
	owners: 'owners',
	admins: 'admins',
	setup: 'Setup',
	setupDone: (n: number, total: number) => `${n} of ${total} done`,
	setupShort: (n: number, total: number) => `${n} of ${total}`,
	setupComplete: 'Setup complete',
	setupBadge: (n: number, total: number) => `Setup: ${n} of ${total} done`,
	noDescription: 'No description',
	webAddress: 'Web address',
	signIn: 'Sign-in',
	people: 'People',
	invites: 'Email invites',
	bots: 'Bots',
	domains: (n: number) => (n === 0 ? 'No web address yet' : n === 1 ? '1 address' : `${n} addresses`),
	ssoSet: (n: number) => (n > 1 ? `${n} sign-in providers` : 'Single sign-on set up'),
	ssoNotSet: 'Single sign-on not set',
	ownersAdmins: (o: number, a: number) => (o === 0 ? 'No owner yet' : `${o} ${o === 1 ? 'owner' : 'owners'} · ${a} ${a === 1 ? 'admin' : 'admins'}`),
	on: 'On',
	off: 'Off',
	notSetUp: 'Not set up',
	allTenants: 'All tenants',
	tenantNo: (id: number) => `Tenant #${id}`,
	countsLine: (u: number, r: number) => `${u.toLocaleString()} ${u === 1 ? 'user' : 'users'} · ${r} ${r === 1 ? 'room' : 'rooms'}`,
	menu: 'Tenant settings',
	sec: {
		general: [ 'General', 'Name, email language and privacy for this tenant.' ],
		domains: [ 'Web addresses', 'People who open one of these addresses land in this tenant.' ],
		signin: [ 'Sign-in', 'Single sign-on (OpenID Connect / OAuth) for this tenant’s people.' ],
		people: [ 'Owners & admins', 'Owners manage everything here. Admins manage rooms, people and roles.' ],
		invites: [ 'Email invites', 'Send calendar invitations for meetings from your own mail server.' ],
		bots: [ 'Bots', 'Recorders, streamers and transcribers that join rooms as a headless browser.' ],
	} as Record<SecKey, [string, string]>,
	createFirst: 'Create the tenant first',
	general: {
		name: 'Name',
		description: 'Description',
		language: 'Language for emails',
		languageHelp: 'Recording notices and new meeting invitations use this language. Empty means English.',
		hide: 'Hide people’s details',
		hideHelp: 'Only admins see the names and email addresses of other people.',
		regions: 'Limit media servers to some regions',
		regionsHelp: 'Meetings only use media servers in the regions you pick.',
		allowedRegions: 'Allowed regions',
		save: 'Save',
		create: 'Create tenant',
		saved: 'Saved',
		foot: 'Nothing changes until you press Save.',
		required: 'Required',
	},
	deleteTenant: 'Delete tenant…',
	deleteOnly: 'Super admins only',
	deleteTitle: (n: string) => `Delete ${n}?`,
	deleteText: 'This removes the tenant and its settings. Rooms, people and roles of this tenant may stop working. This can’t be undone.',
	deleteConfirm: 'Delete tenant',
	picture: 'images/mgmt/tenant.png',
	view: 'View',
	cards: 'Cards',
	table: 'Table',
	name: 'Name',
	usersCol: 'Users',
	roomsCol: 'Rooms',
	ownersCol: 'Owners',
	adminsCol: 'Admins',
} as const;

type SecKey = 'general' | 'domains' | 'signin' | 'people' | 'invites' | 'bots';
const SECTIONS: SecKey[] = [ 'general', 'domains', 'signin', 'people', 'invites', 'bots' ];

type SetupFilter = 'all' | 'ready' | 'setup';
type SortKey = 'name-asc' | 'name-desc' | 'users';
type ViewKey = 'cards' | 'table';
type ColKey = 'name' | 'domains' | 'users' | 'rooms' | 'owners' | 'admins' | 'setup';
const VIEW_KEY = 'mgmt-tenants-view';

type Summary = { domains: string[]; sso: number; owners: number; admins: number; invites: boolean | null; tokens: number; users: number; rooms: number };
const emptySummary: Summary = { domains: [], sso: 0, owners: 0, admins: 0, invites: null, tokens: 0, users: 0, rooms: 0 };

// The checklist: four steps that need doing, plus the bot policy (always set).
const checksOf = (t: Tenant, s: Summary) => [
	{ key: 'domains' as SecKey, label: copy.webAddress, ok: s.domains.length > 0, value: copy.domains(s.domains.length) },
	{ key: 'signin' as SecKey, label: copy.signIn, ok: s.sso > 0, value: s.sso ? copy.ssoSet(s.sso) : copy.ssoNotSet },
	{ key: 'people' as SecKey, label: copy.people, ok: s.owners > 0, value: copy.ownersAdmins(s.owners, s.admins) },
	{ key: 'invites' as SecKey, label: copy.invites, ok: s.invites === true, value: s.invites === null ? copy.notSetUp : s.invites ? copy.on : copy.off },
	{ key: 'bots' as SecKey, label: copy.bots, ok: true, neutral: (t.botPolicy ?? 'disabled') === 'disabled', value: botPolicyOptionLabel((t.botPolicy as BotPolicy) ?? 'disabled') },
];
const doneOf = (t: Tenant, s: Summary) => checksOf(t, s).filter((c) => c.ok).length;

const Mark = ({ ok, neutral, size = 18 }: { ok: boolean; neutral?: boolean; size?: number }) => (
	<Box component='span' aria-hidden sx={{ width: size, height: size, flexShrink: 0, bgcolor: ok ? (neutral ? ui.slateDot : ui.green) : ui.orangeText, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.66, fontWeight: 700, lineHeight: 1 }}>
		{ok ? '✓' : '!'}
	</Box>
);

const TenantTable = () => {
	const dispatch = useAppDispatch();
	const { superAdmin } = useAppSelector((state) => state.management);
	const tenants: Tenant[] = useAppSelector((state) => state.management.tenants) ?? [];
	const phone = useMediaQuery('(max-width: 599.95px)');
	const wide = useMediaQuery('(min-width: 900px)');
	const [ searchParams, setSearchParams ] = useSearchParams();
	const knownRegions: string[] = edumeetConfig.knownRegions ?? [];

	const [ loaded, setLoaded ] = useState(false);
	const [ users, setUsers ] = useState<User[]>([]);
	const [ rooms, setRooms ] = useState<Room[]>([]);
	const [ owners, setOwners ] = useState<TenantOwners[]>([]);
	const [ admins, setAdmins ] = useState<TenantAdmins[]>([]);
	const [ perTenant, setPerTenant ] = useState<Record<number, Pick<Summary, 'domains' | 'sso' | 'invites' | 'tokens'>>>({});

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const fetchTenants = () => dispatch(getData('tenants')).then((t: any) => {
		if (t != undefined) dispatch(managamentActions.setTenants(rowsOf<Tenant>(t)));

		return t;
	});
	const fetchPeople = () => Promise.all([
		dispatch(getData('tenantOwners')).then((t: any) => { if (t != undefined) setOwners(rowsOf<TenantOwners>(t)); }),
		dispatch(getData('tenantAdmins')).then((t: any) => { if (t != undefined) setAdmins(rowsOf<TenantAdmins>(t)); }),
	]);
	// Domains, sign-in, invites and tokens are asked per tenant, as the
	// server scopes these services by tenant.
	const fetchTenantExtras = async (id: number) => {
		const [ fq, oa, inv, bots ] = await Promise.all([
			dispatch(getDataByTenantID(id, 'tenantFQDNs')),
			dispatch(getDataByTenantID(id, 'tenantOAuths')),
			dispatch(getData('tenantInviteConfigs', { tenantId: id })),
			dispatch(getDataByTenantID(id, 'tenantBotCredentials')),
		]) as any[];
		const cfg = rowsOf<TenantInviteConfig>(inv).find((c) => c.tenantId === undefined || sameId(c.tenantId, id));

		setPerTenant((p) => ({
			...p,
			[id]: {
				domains: rowsOf<TenantFQDN>(fq).map((d) => d.fqdn),
				sso: rowsOf<TenantOAuth>(oa).length,
				invites: cfg ? Boolean(cfg.enabled) : null,
				tokens: rowsOf<TenantBotCredential>(bots).length,
			},
		}));
	};

	useEffect(() => {
		Promise.all([
			fetchTenants().then((t: any) => Promise.all(rowsOf<Tenant>(t).map((x) => fetchTenantExtras(asNumber(x.id))))),
			fetchPeople(),
			dispatch(getData('users')).then((t: any) => { if (t != undefined) setUsers(rowsOf<User>(t)); }),
			dispatch(getData('rooms')).then((t: any) => { if (t != undefined) setRooms(rowsOf<Room>(t)); }),
		]).finally(() => setLoaded(true));
	}, []);
	/* eslint-enable @typescript-eslint/no-explicit-any */

	const summaryOf = (id: number): Summary => ({
		...emptySummary,
		...(perTenant[id] ?? {}),
		owners: owners.filter((o) => sameId(o.tenantId, id)).length,
		admins: admins.filter((a) => sameId(a.tenantId, id)).length,
		users: users.filter((u) => sameId(u.tenantId, id)).length,
		rooms: rooms.filter((r) => sameId(r.tenantId, id)).length,
	});

	// ----- Which tenant is open -----
	const param = searchParams.get('tenant');
	const soleTenant = !superAdmin && tenants.length === 1 ? asNumber(tenants[0].id) : null;
	const openId: number | 'new' | null = param === 'new' ? 'new' : param ? asNumber(param) : soleTenant;
	const openTenant = typeof openId === 'number' ? tenants.find((t) => sameId(t.id, openId)) ?? null : null;
	const goTo = (id: number | 'new' | null, replace = false) => {
		const next = new URLSearchParams(searchParams);

		if (id === null) next.delete('tenant');
		else next.set('tenant', String(id));
		setSearchParams(next, { replace });
		window.scrollTo({ top: 0 });
	};

	// ----- List filters -----
	const [ search, setSearch ] = useState('');
	const [ setupFilter, setSetupFilter ] = useState<SetupFilter>('all');
	const [ sortKey, setSortKey ] = useState<SortKey>('name-asc');

	const rows = useMemo(() => tenants.map((t) => {
		const s = summaryOf(asNumber(t.id));

		return { tenant: t, summary: s, done: doneOf(t, s) };
	}), [ tenants, perTenant, owners, admins, users, rooms ]);
	const counts = { all: rows.length, ready: rows.filter((r) => r.done === 5).length, setup: rows.filter((r) => r.done < 5).length };
	const visible = useMemo(() => {
		const q = search.trim().toLowerCase();

		return rows
			.filter((r) => setupFilter === 'all' || (setupFilter === 'ready' ? r.done === 5 : r.done < 5))
			.filter((r) => !q || `${r.tenant.name} ${str(r.tenant.description)} ${r.summary.domains.join(' ')}`.toLowerCase().includes(q))
			.sort((a, b) => {
				if (sortKey === 'users') return b.summary.users - a.summary.users || a.tenant.name.localeCompare(b.tenant.name);
				const byName = str(a.tenant.name).localeCompare(str(b.tenant.name));

				return sortKey === 'name-desc' ? -byName : byName;
			});
	}, [ rows, search, setupFilter, sortKey ]);
	const [ view, setView ] = useState<ViewKey>(() => {
		try {
			return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'cards';
		} catch {
			return 'cards';
		}
	});
	const pickView = (v: ViewKey) => {
		setView(v);
		try {
			localStorage.setItem(VIEW_KEY, v);
		} catch {
			// private window: the choice just isn't remembered
		}
	};
	const tableMode = view === 'table' && !phone;
	// Table headers sort on their own; the sort dropdown only drives the cards.
	const [ colSort, setColSort ] = useState<{ col: ColKey; dir: 1 | -1 }>({ col: 'name', dir: 1 });
	const sortBy = (col: ColKey) => setColSort((c) => ({ col, dir: c.col === col ? (c.dir === 1 ? -1 : 1) : 1 }));
	const tableRows = useMemo(() => {
		if (!tableMode) return visible;
		const { col, dir } = colSort;
		const num = (r: typeof rows[number]) => (col === 'setup' ? r.done : col === 'domains' ? r.summary.domains.length : col === 'name' ? 0 : r.summary[col]);

		return [ ...visible ].sort((a, b) => dir * (col === 'name' ? str(a.tenant.name).localeCompare(str(b.tenant.name)) : num(a) - num(b)) || str(a.tenant.name).localeCompare(str(b.tenant.name)));
	}, [ visible, tableMode, colSort ]);
	// Motion (2026-10-18): cards rise in on first show, and cards or rows
	// slide to their new places when a filter or sort changes.
	const intro = useIntro(visible.length > 0);
	const listRef = useRef<HTMLDivElement>(null);

	useFlip(listRef, `${openId === null ? 'list' : 'page'}:${tableMode ? 't' : 'c'}:${tableRows.map((r) => r.tenant.id)
		.join(',')}`);

	// ----- Settings page -----
	const [ sec, setSec ] = useState<SecKey | null>('general');

	useEffect(() => {
		// A new tenant page starts on General; phones start on the menu list.
		setSec(phone && openId !== 'new' ? null : 'general');
	}, [ openId ]);
	useEffect(() => {
		if (!phone && sec === null) setSec('general');
	}, [ phone ]);

	const refreshTenant = (id: number) => {
		fetchTenantExtras(id);
		fetchPeople();
	};

	// General section form
	const [ gName, setGName ] = useState('');
	const [ gDesc, setGDesc ] = useState('');
	const [ gLocale, setGLocale ] = useState('');
	const [ gHide, setGHide ] = useState(true);
	const [ gLimit, setGLimit ] = useState(false);
	const [ gRegions, setGRegions ] = useState<string[]>([]);
	const [ gBusy, setGBusy ] = useState(false);
	const [ gSavedAt, setGSavedAt ] = useState(0);
	const gJustSaved = useJustSaved(gSavedAt);

	const fillGeneral = (t: Tenant | null) => {
		setGName(str(t?.name));
		setGDesc(str(t?.description));
		setGLocale(str(t?.locale));
		setGHide(t ? Boolean(t.hideUserDetails) : true);
		setGLimit(Boolean(t?.allowedMediaNodeRegions && t.allowedMediaNodeRegions.length));
		setGRegions(t?.allowedMediaNodeRegions ?? []);
		setGSavedAt(0);
	};

	useEffect(() => {
		fillGeneral(openTenant);
	}, [ openId, openTenant?.name, openTenant?.description, openTenant?.locale, openTenant?.hideUserDetails, JSON.stringify(openTenant?.allowedMediaNodeRegions ?? []) ]);

	const isNew = openId === 'new';
	const regionsPayload = gLimit ? gRegions : [];
	const gDirty = isNew ? gName.trim() !== '' : Boolean(openTenant && (
		gName !== str(openTenant.name) || gDesc !== str(openTenant.description) || gLocale !== str(openTenant.locale)
		|| gHide !== Boolean(openTenant.hideUserDetails) || JSON.stringify(regionsPayload) !== JSON.stringify(openTenant.allowedMediaNodeRegions ?? [])
	));
	const gValid = gName.trim() !== '' && (!gLimit || gRegions.length > 0);
	const gCanSave = gDirty && gValid && !gBusy;

	const saveGeneral = async () => {
		if (!gCanSave) {
			if (gName.trim() === '') dispatch(notificationsActions.enqueueNotification({ message: nameCannotBeEmptyLabel(), options: { variant: 'warning' } }));

			return;
		}
		setGBusy(true);
		try {
			const payload = { name: gName.trim(), description: gDesc.trim(), hideUserDetails: gHide, allowedMediaNodeRegions: regionsPayload, locale: gLocale || null };

			if (isNew) {
				const created = await dispatch(createData({ ...payload, botPolicy: 'disabled' }, 'tenants')) as Tenant | undefined;

				if (created?.id) {
					await fetchTenants();
					await fetchTenantExtras(asNumber(created.id));
					goTo(asNumber(created.id), true);
				}
			} else if (openTenant) {
				await dispatch(patchData(asNumber(openTenant.id), payload, 'tenants'));
				await fetchTenants();
				setGSavedAt(Date.now());
			}
		} finally {
			setGBusy(false);
		}
	};

	// Delete (super admins)
	const [ deleteOpen, setDeleteOpen ] = useState(false);
	const [ deleting, setDeleting ] = useState(false);
	const removeTenant = async () => {
		if (!openTenant) return;
		setDeleting(true);
		try {
			await dispatch(deleteData(asNumber(openTenant.id), 'tenants'));
			setDeleteOpen(false);
			await fetchTenants();
			goTo(null, true);
		} finally {
			setDeleting(false);
		}
	};

	// ----- Pieces -----
	const header = (
		<Box sx={{ display: 'flex', alignItems: { xs: 'center', sm: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
			<Box sx={{ flexGrow: 1, minWidth: 0 }}>
				<Typography id='mgmt-section-title' component='h2' sx={{ m: 0, fontSize: { xs: 24, md: 28 }, lineHeight: { xs: '32px', md: '36px' }, fontWeight: 700, color: ui.orangeText }}>{tenantsLabel()}</Typography>
				<Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 15, lineHeight: '22px', color: ui.muted }}>{copy.subtitle}</Typography>
			</Box>
			{superAdmin && (
				<ButtonBase onClick={() => goTo('new')} sx={{ height: 44, gap: 1, pl: 1.75, pr: 2.5, bgcolor: ui.orange, color: ui.navy, fontSize: 15, fontWeight: 600, '&:hover': { bgcolor: ui.orangeHover }, '&.Mui-focusVisible': focusRing }}>
					<AddOutlinedIcon sx={{ fontSize: 20 }} />{copy.addTenant}
				</ButtonBase>
			)}
		</Box>
	);

	const filterBar = (
		<Box sx={{ p: { xs: 0, sm: 1.5 }, bgcolor: { xs: 'transparent', sm: '#fff' }, border: { xs: 0, sm: `1px solid ${ui.line}` }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
			<TextField
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder={phone ? copy.searchShort : copy.search}
				size={phone ? 'medium' : 'small'}
				sx={{ width: { xs: '100%', sm: 300 } }}
				slotProps={{ htmlInput: { 'aria-label': copy.searchShort, type: 'search' }, input: { startAdornment: <InputAdornment position='start'><SearchOutlinedIcon sx={{ color: ui.muted }} /></InputAdornment>, sx: squareInput } }}
			/>
			<Box role='group' aria-label={copy.setupFilter} sx={{ display: 'flex', flexShrink: 0, border: `1px solid ${ui.line}`, bgcolor: '#fff', width: { xs: '100%', sm: 'auto' } }}>
				{([ [ 'all', copy.all, counts.all ], [ 'ready', copy.ready, counts.ready ], [ 'setup', copy.needsSetup, counts.setup ] ] as Array<[SetupFilter, string, number]>).map(([ key, label, n ], i) => {
					const on = setupFilter === key;

					return (
						<ButtonBase key={key} aria-pressed={on} onClick={() => setSetupFilter(key)} sx={{ flex: { xs: 1, sm: 'none' }, height: { xs: 42, sm: 38 }, px: 1.75, borderLeft: i ? `1px solid ${ui.line}` : 0, bgcolor: on ? ui.navy : '#fff', color: on ? '#fff' : ui.body, fontSize: 14, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap', '&:hover': { bgcolor: on ? ui.navy : ui.grey }, '&.Mui-focusVisible': focusRing }}>
							{label} {n}
						</ButtonBase>
					);
				})}
			</Box>
			<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
			{!tableMode && <TextField select size='small' value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} slotProps={{ htmlInput: { 'aria-label': copy.sort }, input: { sx: squareInput } }} sx={{ minWidth: 150, width: { xs: '100%', sm: 'auto' } }}>
				<MenuItem value='name-asc'>{copy.sortNameAsc}</MenuItem>
				<MenuItem value='name-desc'>{copy.sortNameDesc}</MenuItem>
				<MenuItem value='users'>{copy.sortUsers}</MenuItem>
			</TextField>}
			{!phone && (
				<Box role='group' aria-label={copy.view} sx={{ display: 'flex', flexShrink: 0, border: `1px solid ${ui.line}`, bgcolor: '#fff' }}>
					{([ [ 'cards', <GridViewOutlinedIcon key='c' sx={{ fontSize: 20 }} />, copy.cards ], [ 'table', <TableRowsOutlinedIcon key='t' sx={{ fontSize: 20 }} />, copy.table ] ] as Array<[ViewKey, React.ReactNode, string]>).map(([ key, icon, label ], i) => {
						const on = view === key;

						return (
							<Tooltip key={key} title={label}>
								<ButtonBase aria-pressed={on} aria-label={label} onClick={() => pickView(key)} sx={{ height: 38, px: 1.5, borderLeft: i ? `1px solid ${ui.line}` : 0, bgcolor: on ? ui.navy : '#fff', color: on ? '#fff' : ui.body, '&:hover': { bgcolor: on ? ui.navy : ui.grey }, '&.Mui-focusVisible': focusRing }}>
									{icon}
								</ButtonBase>
							</Tooltip>
						);
					})}
				</Box>
			)}
		</Box>
	);

	const thSx = { ...sectionLabelSx, height: 40, px: 1.25, textAlign: 'left', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderBottom: `1px solid ${ui.line}` } as const;
	const tdSx = { px: 1.25, py: 1, fontSize: 14, lineHeight: '20px', color: ui.body, borderBottom: `1px solid ${ui.lineSoft}`, verticalAlign: 'middle', whiteSpace: 'nowrap' } as const;
	const numSx = { ...tdSx, fontVariantNumeric: 'tabular-nums' } as const;
	const colHeader = (col: ColKey, label: string, width?: number) => {
		const on = colSort.col === col;

		return (
			<Box component='th' scope='col' aria-sort={on ? (colSort.dir === 1 ? 'ascending' : 'descending') : undefined} sx={{ ...thSx, width }}>
				<ButtonBase onClick={() => sortBy(col)} sx={{ font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', color: on ? ui.navy : 'inherit', gap: '4px', height: 28, '&.Mui-focusVisible': focusRing }}>
					{label}
					{on ? (colSort.dir === 1 ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : <ArrowUpwardIcon sx={{ fontSize: 14, opacity: 0 }} />}
				</ButtonBase>
			</Box>
		);
	};
	const tenantTable = (
		<Box sx={{ bgcolor: '#fff', border: `1px solid ${ui.line}`, overflowX: 'auto' }}>
			<Box component='table' aria-label={tenantsLabel()} sx={{ width: '100%', minWidth: 860, borderCollapse: 'separate', borderSpacing: 0 }}>
				<thead>
					<tr>
						{colHeader('name', copy.name)}
						{colHeader('domains', copy.webAddress, 200)}
						{colHeader('users', copy.usersCol, 80)}
						{colHeader('rooms', copy.roomsCol, 80)}
						{colHeader('owners', copy.ownersCol, 80)}
						{colHeader('admins', copy.adminsCol, 80)}
						{colHeader('setup', copy.setup, 170)}
					</tr>
				</thead>
				<tbody>
					{tableRows.map((r) => {
						const t = r.tenant;
						const s = r.summary;
						const open = () => goTo(asNumber(t.id));

						return (
							<Box component='tr' key={t.id} data-flip={`t${t.id}`} onClick={open} sx={{ cursor: 'pointer', '&:hover td': { bgcolor: ui.orangeLight }, '&:last-of-type td': { borderBottom: 0 } }}>
								<Box component='td' sx={{ ...tdSx, maxWidth: 320 }}>
									<ButtonBase onClick={(e) => { e.stopPropagation(); open(); }} sx={{ display: 'block', maxWidth: '100%', textAlign: 'left', fontSize: 15, fontWeight: 700, color: ui.navy, ...ellipsis, '&.Mui-focusVisible': focusRing }}>
										{t.name}
									</ButtonBase>
									<Box sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{str(t.description) || copy.noDescription}</Box>
								</Box>
								<Box component='td' sx={{ ...tdSx, maxWidth: 220 }}>
									{s.domains.length === 0 ? (
										<Box component='span' sx={{ fontSize: 13, color: '#8a4b00' }}>{copy.domains(0)}</Box>
									) : (
										<Box sx={{ display: 'flex', gap: '4px', minWidth: 0 }}>
											<Box component='span' sx={{ minWidth: 0, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 12, lineHeight: '16px', color: ui.blueDark, bgcolor: ui.blueLight, px: '6px', py: '2px', ...ellipsis }}>{s.domains[0]}</Box>
											{s.domains.length > 1 && <Box component='span' sx={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: ui.slate, bgcolor: ui.grey, px: '6px', py: '2px' }}>+{s.domains.length - 1}</Box>}
										</Box>
									)}
								</Box>
								<Box component='td' sx={numSx}>{s.users.toLocaleString()}</Box>
								<Box component='td' sx={numSx}>{s.rooms.toLocaleString()}</Box>
								<Box component='td' sx={{ ...numSx, color: s.owners ? ui.body : '#8a4b00' }}>{s.owners}</Box>
								<Box component='td' sx={numSx}>{s.admins}</Box>
								<Box component='td' sx={tdSx}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Box sx={{ display: 'flex', gap: '3px' }}>
											{checksOf(t, s).map((c) => <Box key={c.key} title={`${c.label}: ${c.value}`} sx={{ display: 'flex' }}><Mark ok={c.ok} neutral={c.neutral} size={16} /></Box>)}
										</Box>
										<Box component='span' sx={{ fontSize: 13, fontWeight: 600, color: r.done === 5 ? ui.green : '#8a4b00' }}>{copy.setupShort(r.done, 5)}</Box>
									</Box>
								</Box>
							</Box>
						);
					})}
				</tbody>
			</Box>
		</Box>
	);

	const card = (r: typeof rows[number]) => {
		const t = r.tenant;
		const s = r.summary;
		const checks = checksOf(t, s);
		const active = { bgcolor: ui.orangeLight, borderColor: ui.orange, boxShadow: `inset 0 -4px 0 ${ui.orange}`, '& .tenant-media': { bgcolor: alpha(ui.orange, 0.16) } };

		return (
			<ButtonBase
				onClick={() => goTo(asNumber(t.id))}
				sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', textAlign: 'left', bgcolor: '#fff', border: `1px solid ${ui.line}`, transition: `background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, ${liftTransition}`, '&:hover, &.Mui-focusVisible': { ...active, ...liftOn(`inset 0 -4px 0 ${ui.orange}`) }, '&.Mui-focusVisible': { ...active, ...focusRing }, '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }}
			>
				<Box sx={{ p: '16px 18px 12px', display: 'flex', gap: 1.75, alignItems: 'flex-start', borderBottom: `1px solid ${ui.lineSoft}` }}>
					<Box className='tenant-media' sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: ui.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Box component='img' src={copy.picture} alt='' sx={{ width: 38, height: 38 }} />
					</Box>
					<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
						<Box component='span' sx={{ fontSize: 20, lineHeight: '26px', fontWeight: 700, color: ui.orangeText, ...ellipsis }}>{t.name}</Box>
						<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{str(t.description) || copy.noDescription}</Box>
						{s.domains.length > 0 && (
							<Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
								{s.domains.slice(0, 2).map((d) => <Box component='span' key={d} sx={{ maxWidth: '100%', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 12, lineHeight: '16px', color: ui.blueDark, bgcolor: ui.blueLight, px: '6px', py: '2px', ...ellipsis }}>{d}</Box>)}
								{s.domains.length > 2 && <Box component='span' sx={{ fontSize: 12, fontWeight: 600, color: ui.slate, bgcolor: ui.grey, px: '6px', py: '2px' }}>+{s.domains.length - 2}</Box>}
							</Box>
						)}
					</Box>
				</Box>
				<Box sx={{ px: '18px', py: 1.25, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1, borderBottom: `1px solid ${ui.lineSoft}` }}>
					{([ [ s.users, copy.users ], [ s.rooms, copy.rooms ], [ s.owners, copy.owners ], [ s.admins, copy.admins ] ] as Array<[number, string]>).map(([ n, label ]) => (
						<Box key={label} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
							<Box component='b' sx={{ fontSize: 18, lineHeight: '24px', color: ui.navy }}>{n.toLocaleString()}</Box>
							<Box component='span' sx={{ fontSize: 12, color: ui.muted }}>{label}</Box>
						</Box>
					))}
				</Box>
				<Box sx={{ px: '18px', pt: 1.25, pb: 1.75, display: 'flex', flexDirection: 'column', gap: '6px' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: ui.slate }}>
						<Box component='span' sx={{ flexGrow: 1 }}>{copy.setup}</Box>
						<Box component='span' sx={{ letterSpacing: 0, textTransform: 'none', color: r.done === 5 ? ui.green : '#8a4b00' }}>{copy.setupDone(r.done, 5)}</Box>
					</Box>
					{checks.map((c) => (
						<Box key={c.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, lineHeight: '18px' }}>
							<Mark ok={c.ok} neutral={c.neutral} />
							<Box component='span' sx={{ width: 96, flexShrink: 0, color: ui.muted }}>{c.label}</Box>
							<Box component='span' sx={{ flexGrow: 1, minWidth: 0, color: c.ok ? ui.text : '#8a4b00', ...ellipsis }}>{c.value}</Box>
						</Box>
					))}
				</Box>
			</ButtonBase>
		);
	};

	const listView = (
		<Box ref={listRef} component='section' aria-labelledby='mgmt-section-title' sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
			{header}
			{filterBar}
			{!loaded && tenants.length === 0 ? (tableMode ? (
				<Box aria-hidden sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
					{[ 0, 1, 2, 3, 4 ].map((i) => <Skeleton key={i} variant='rectangular' height={i ? 52 : 40} sx={{ borderRadius: 0 }} />)}
				</Box>
			) : (
				<Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(270px, 1fr))' }, gap: { xs: 1.25, sm: 2.5 } }}>
					{[ 0, 1, 2, 3 ].map((i) => <Skeleton key={i} variant='rectangular' height={300} sx={{ borderRadius: 0 }} />)}
				</Box>
			)) : visible.length === 0 ? (
				<Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, bgcolor: '#fff', border: `1px solid ${ui.line}` }}>
					<Typography sx={{ color: ui.muted }}>{copy.noTenants}</Typography>
					<Button variant='outlined' onClick={() => { setSearch(''); setSetupFilter('all'); }} sx={{ borderRadius: 0 }}>{copy.clearFilters}</Button>
				</Box>
			) : tableMode ? tenantTable : (
				<Box component='ul' aria-label={tenantsLabel()} sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(270px, 1fr))' }, gap: { xs: 1.25, sm: 2.5 } }}>
					{visible.map((r, index) => <Box component='li' key={r.tenant.id} data-flip={`c${r.tenant.id}`} sx={{ minWidth: 0, display: 'flex', ...staggerSx(index, intro) }}>{card(r)}</Box>)}
				</Box>
			)}
		</Box>
	);

	if (openId === null || (openId !== 'new' && !openTenant)) {
		// An unknown ?tenant= falls back to the list once the tenants are in.
		if (openId !== null && loaded && !openTenant) return listView;
		if (openId !== null && !loaded) return <Skeleton variant='rectangular' height={400} sx={{ borderRadius: 0 }} />;

		return listView;
	}

	// ----- Settings page -----
	const id = openTenant ? asNumber(openTenant.id) : 0;
	const summary = openTenant ? summaryOf(id) : emptySummary;
	const checks = openTenant ? checksOf(openTenant, summary) : [];
	const done = openTenant ? doneOf(openTenant, summary) : 0;
	const generalSub = [ gLocale ? (localeList.find((l) => l.file === gLocale)?.name ?? gLocale) : tenantLocaleNoneLabel(), gHide ? copy.general.hide.toLowerCase() : '' ].filter(Boolean).join(' · ');
	const subOf = (k: SecKey) => {
		if (isNew && k !== 'general') return { text: copy.createFirst, ok: true, neutral: true };
		if (k === 'general') return { text: generalSub, ok: true, neutral: false };
		const c = checks.find((x) => x.key === k);

		if (k === 'bots' && c) return { text: `${c.value}${summary.tokens ? ` · ${summary.tokens} ${summary.tokens === 1 ? 'token' : 'tokens'}` : ''}`, ok: true, neutral: c.neutral };

		return { text: c?.value ?? '', ok: Boolean(c?.ok), neutral: false };
	};

	const generalSection = (
		<SectionBody
			status={gSavedAt && !gDirty ? <SavedNote text={copy.general.saved} /> : copy.general.foot}
			footer={<>
				{gDirty && !isNew && <Button variant='outlined' onClick={() => fillGeneral(openTenant)} sx={{ borderRadius: 0, height: 44 }}>{cancelLabel()}</Button>}
				<Button onClick={saveGeneral} disabled={!gCanSave} sx={{ ...orangeButtonSx, ...(gJustSaved ? savedButtonSx : {}) }}>{gJustSaved ? <SavedTick label={copy.general.saved} /> : isNew ? copy.general.create : copy.general.save}</Button>
			</>}
		>
			<Box sx={{ maxWidth: 880, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
				<TextField label={copy.general.name} required autoFocus={isNew} value={gName} onChange={(e) => { setGName(e.target.value); setGSavedAt(0); }} error={gDirty && gName.trim() === ''} helperText={gDirty && gName.trim() === '' ? copy.general.required : undefined} {...fieldProps} />
				<TextField select label={copy.general.language} value={gLocale} onChange={(e) => { setGLocale(e.target.value); setGSavedAt(0); }} helperText={copy.general.languageHelp} {...fieldProps}>
					<MenuItem value=''>{tenantLocaleNoneLabel()}</MenuItem>
					{localeList.map((l) => <MenuItem key={l.file} value={l.file}>{l.name}</MenuItem>)}
					{gLocale && !localeList.some((l) => l.file === gLocale) && <MenuItem value={gLocale}>{gLocale}</MenuItem>}
				</TextField>
				<TextField label={copy.general.description} value={gDesc} onChange={(e) => { setGDesc(e.target.value); setGSavedAt(0); }} sx={{ gridColumn: { md: '1 / 3' } }} {...fieldProps} />
				<Box sx={{ gridColumn: { md: '1 / 3' }, borderTop: `1px solid ${ui.lineSoft}` }}>
					<ToggleRow title={copy.general.hide} desc={copy.general.hideHelp} checked={gHide} onChange={(v) => { setGHide(v); setGSavedAt(0); }} />
					{knownRegions.length > 0 && <>
						<ToggleRow title={copy.general.regions} desc={copy.general.regionsHelp} checked={gLimit} onChange={(v) => { setGLimit(v); if (!v) setGRegions([]); setGSavedAt(0); }} />
						<Collapse in={gLimit}>
							<Box sx={{ py: 1.5, borderBottom: `1px solid ${ui.lineSoft}` }}>
								<Autocomplete
									multiple
									options={knownRegions}
									value={gRegions}
									onChange={(_e, v) => { setGRegions(v); setGSavedAt(0); }}
									renderValue={(values, getTagProps) => values.map((opt, i) => {
										const { key, ...rest } = getTagProps({ index: i });

										return <Chip key={key} label={opt} size='small' sx={{ borderRadius: 0 }} {...rest} />;
									})}
									renderInput={(params) => (
										<TextField {...params} label={copy.general.allowedRegions} error={gLimit && gRegions.length === 0} helperText={gLimit && gRegions.length === 0 ? selectAtLeastOneRegionLabel() : ' '} slotProps={{ ...params.slotProps, input: { ...params.slotProps.input, sx: { borderRadius: 0 } } }} />
									)}
								/>
							</Box>
						</Collapse>
					</>}
				</Box>
			</Box>
		</SectionBody>
	);

	const sectionContent = (k: SecKey) => {
		if (k === 'general' || isNew) return generalSection;
		if (k === 'domains') return <TenantDomainsSection tenantId={id} onChanged={() => refreshTenant(id)} />;
		if (k === 'signin') return <TenantSignInSection tenantId={id} onChanged={() => refreshTenant(id)} />;
		if (k === 'people') return <TenantPeopleSection tenantId={id} onChanged={() => refreshTenant(id)} />;
		if (k === 'invites') return <TenantInvitesSection tenantId={id} onChanged={() => refreshTenant(id)} />;

		return openTenant ? <TenantBotsSection tenant={openTenant} onTenantSaved={fetchTenants} /> : null;
	};

	const menu = (
		<Box component='nav' aria-label={copy.menu} sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0, alignSelf: 'flex-start', bgcolor: '#fff', border: `1px solid ${ui.line}`, py: { xs: 0, md: 1 } }}>
			<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0 }}>
				{SECTIONS.map((k) => {
					const on = wide && sec === k;
					const sub = subOf(k);
					const disabled = isNew && k !== 'general';

					return (
						<Box component='li' key={k} sx={{ borderBottom: { xs: `1px solid ${ui.lineSoft}`, md: 0 } }}>
							<ButtonBase
								aria-current={on ? 'page' : undefined}
								disabled={disabled}
								onClick={() => setSec(k)}
								sx={{ width: '100%', minHeight: { xs: 64, md: 54 }, pl: 2, pr: 1.5, display: 'flex', alignItems: 'center', gap: 1.25, textAlign: 'left', borderLeft: `4px solid ${on ? ui.orange : 'transparent'}`, bgcolor: on ? ui.orangeLight : 'transparent', '&:hover': { bgcolor: on ? ui.orangeLight : ui.grey }, '&.Mui-focusVisible': { ...focusRing, outlineOffset: -2 }, '&.Mui-disabled': { opacity: 0.55 } }}
							>
								{!wide && <Mark ok={sub.ok} neutral={sub.neutral} size={20} />}
								<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
									<Box component='span' sx={{ fontSize: { xs: 16, md: 15 }, lineHeight: '20px', fontWeight: on ? 700 : 600, color: ui.navy }}>{copy.sec[k][0]}</Box>
									<Box component='span' sx={{ fontSize: 12, lineHeight: '16px', color: sub.ok ? ui.muted : '#8a4b00', ...ellipsis }}>{sub.text}</Box>
								</Box>
								{wide ? <Mark ok={sub.ok} neutral={sub.neutral} /> : <ChevronRightOutlinedIcon sx={{ color: ui.slateDot }} />}
							</ButtonBase>
						</Box>
					);
				})}
			</Box>
			{superAdmin && !isNew && (
				<Box sx={{ mx: 2, mt: 1, mb: 1, pt: 1.5, borderTop: { md: `1px solid ${ui.lineSoft}` } }}>
					<Button onClick={() => setDeleteOpen(true)} sx={{ px: 0, minWidth: 0, borderRadius: 0, textTransform: 'none', fontWeight: 600, color: '#b42318' }}>{copy.deleteTenant}</Button>
					<Box sx={{ fontSize: 12, lineHeight: '16px', color: ui.muted }}>{copy.deleteOnly}</Box>
				</Box>
			)}
		</Box>
	);

	const title = isNew ? (gName.trim() || copy.newTenant) : str(openTenant?.name);
	const showList = soleTenant === null;
	const panelKey = sec ?? 'general';
	const panel = (
		<Box component='section' aria-labelledby='tenant-sec-title' sx={{ flexGrow: 1, minWidth: 0, bgcolor: '#fff', border: `1px solid ${ui.line}`, borderTop: `4px solid ${ui.orange}`, display: 'flex', flexDirection: 'column' }}>
			<Box sx={{ flexShrink: 0, px: { xs: 2, sm: 3 }, pt: 2, pb: 1.5, borderBottom: `1px solid ${ui.lineSoft}` }}>
				<Typography id='tenant-sec-title' component='h3' sx={{ m: 0, fontSize: 19, lineHeight: '26px', fontWeight: 700, color: ui.navy }}>{copy.sec[panelKey][0]}</Typography>
				<Typography sx={{ mt: '2px', fontSize: 14, lineHeight: '20px', color: ui.muted }}>{copy.sec[panelKey][1]}</Typography>
			</Box>
			{sectionContent(panelKey)}
		</Box>
	);

	return <>
		<Box component='section' aria-labelledby='mgmt-section-title' sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			{(showList || (!wide && sec !== null)) && (
				<ButtonBase
					onClick={() => (!wide && sec !== null ? setSec(null) : goTo(null))}
					sx={{ alignSelf: 'flex-start', gap: 0.25, py: 0.5, fontSize: 14, fontWeight: 600, color: ui.blueDark, '&.Mui-focusVisible': focusRing }}
				>
					<ChevronLeftOutlinedIcon sx={{ fontSize: 20 }} />
					{!wide && sec !== null ? copy.menu : copy.allTenants}
				</ButtonBase>
			)}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
				<Box sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: ui.blueLight, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center' }}>
					<Box component='img' src={copy.picture} alt='' sx={{ width: 38, height: 38 }} />
				</Box>
				<Box sx={{ flexGrow: 1, minWidth: 0 }}>
					<Typography id='mgmt-section-title' component='h2' sx={{ m: 0, fontSize: { xs: 22, md: 26 }, lineHeight: { xs: '30px', md: '34px' }, fontWeight: 700, color: ui.orangeText, overflowWrap: 'anywhere' }}>{title}</Typography>
					<Typography sx={{ fontSize: 14, lineHeight: '20px', color: ui.muted }}>
						{isNew ? copy.newTenant : [ str(openTenant?.description), copy.tenantNo(id), copy.countsLine(summary.users, summary.rooms) ].filter(Boolean).join(' · ')}
					</Typography>
				</Box>
				{!isNew && (
					<Box component='span' sx={{ fontSize: 13, fontWeight: 600, px: 1.25, py: 0.75, ...(done === 5 ? { color: ui.green, bgcolor: '#e7f6ee', border: '1px solid #b7e1c8' } : { color: '#8a4b00', bgcolor: ui.orangeLight, border: '1px solid #f8c98d' }) }}>
						{done === 5 ? copy.setupComplete : copy.setupBadge(done, 5)}
					</Box>
				)}
			</Box>
			{wide ? (
				<Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
					{menu}
					{panel}
				</Box>
			) : sec === null ? menu : panel}
		</Box>

		<Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} slotProps={{ paper: { 'aria-labelledby': 'tenant-delete-title', sx: { borderRadius: 0, borderTop: '4px solid #b42318', maxWidth: 480 } } }}>
			<Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
				<Typography id='tenant-delete-title' component='h2' sx={{ m: 0, fontSize: 19, fontWeight: 700, color: '#8f1d14' }}>{copy.deleteTitle(str(openTenant?.name))}</Typography>
				<Typography sx={{ fontSize: 14, lineHeight: '20px', color: ui.body }}>{copy.deleteText}</Typography>
				<Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
					<Button variant='outlined' autoFocus onClick={() => setDeleteOpen(false)} sx={{ borderRadius: 0, height: 44 }}>{cancelLabel()}</Button>
					<Button variant='outlined' onClick={removeTenant} disabled={deleting} sx={{ ...dangerOutlinedSx, height: 44 }}>{copy.deleteConfirm}</Button>
				</Box>
			</Box>
		</Dialog>
	</>;
};

export default TenantTable;
