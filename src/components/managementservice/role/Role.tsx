import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, ButtonBase, Dialog, IconButton, InputAdornment, MenuItem, Skeleton, Slide, Switch, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { alpha } from '@mui/material/styles';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { GroupRoles, Groups, Permissions, RolePermissions, Roles, Room, Tenant } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, patchData, syncRolePermissions } from '../../../store/actions/managementActions';
import { notificationsActions } from '../../../store/slices/notificationsSlice';
import { asNumber, ellipsis, focusRing, squareInput, str, ui } from '../users/userUi';
import { switchSx } from '../tenants/tenantShared';
import { SavedTick, liftOn, liftTransition, savedButtonSx, staggerSx, useFlip, useIntro, useJustSaved } from '../motion';
import { cancelLabel, closeLabel, nameCannotBeEmptyLabel, permissionDescriptions, rolesLabel, tenantLabel, undefinedTenantLabel } from '../../translated/translatedComponents';

// Roles screen (user brief 2026-10-17, canvas options A + B + C): square role
// cards with a permission meter, a Compare grid (roles × permissions), and a
// modal that slides down from the top (like Users and Groups) with
// Permissions, Details and Where used tabs. Permissions get plain names and
// sit in four groups; the technical name shows on hover. A role that a room
// or group still uses cannot be deleted.
const modalDuration = { enter: 360, exit: 300 } as const;
const modalEasing = {
	enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
	exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

const SlideDown = forwardRef(function SlideDownTransition(
	props: TransitionProps & { children: React.ReactElement },
	ref: React.Ref<unknown>,
) {
	return <Slide direction='down' ref={ref} {...props} />;
});

const copy = {
	subtitle: 'A role is a set of permissions. Give it to people or groups in a room.',
	addRole: 'Add role',
	newRole: 'New role',
	all: 'All',
	inUse: 'In use',
	notUsed: 'Not used',
	usage: 'Usage',
	search: 'Role or permission name',
	searchShort: 'Search roles',
	allTenants: 'All tenants',
	sort: 'Sort',
	sortNameAsc: 'Name A–Z',
	sortNameDesc: 'Name Z–A',
	sortMost: 'Most permissions',
	sortNewest: 'Newest first',
	sortOldest: 'Oldest first',
	view: 'View',
	cards: 'Cards',
	compare: 'Compare',
	showMore: 'Show more',
	showing: (n: number, total: number) => `Showing ${n} of ${total}`,
	noRoles: 'No roles match your search.',
	noRolesYet: 'No roles yet. Add one to decide what people can do in a room.',
	clearFilters: 'Clear filters',
	ofTotal: (n: number, total: number) => `${n} of ${total} permissions`,
	notUsedAnywhere: 'Not used in any room',
	usedSummary: (rooms: number, groups: number, people: number) => [
		rooms ? `Default in ${rooms} ${rooms === 1 ? 'room' : 'rooms'}` : '',
		groups ? `${groups} group ${groups === 1 ? 'role' : 'roles'}` : '',
		people ? `${people} ${people === 1 ? 'person' : 'people'}` : '',
	].filter(Boolean).join(' · '),
	roleNo: (id: number) => `Role #${id}`,
	tabs: 'Role sections',
	permissions: 'Permissions',
	details: 'Details',
	whereUsed: 'Where used',
	startFrom: 'Start from:',
	onCount: (n: number, total: number) => `${n} of ${total} on`,
	turnAllOn: 'Turn all on',
	turnAllOff: 'Turn all off',
	name: 'Name',
	description: 'Description',
	required: 'Required',
	duplicate: 'Duplicate this role',
	copyOf: (n: string) => `Copy of ${n}`,
	deleteTitle: 'Delete this role',
	deleteHelpFree: 'Nobody gets this role in any room. It can be deleted.',
	deleteHelpUsed: (s: string) => `It is used: ${s}. Change those first.`,
	deleteRole: 'Delete role',
	deleteConfirm: 'Yes, delete',
	usedIntro: 'Where people get this role. Change it on the room or group.',
	roomDefault: 'Room default',
	groupRole: 'Group role',
	peopleRole: 'People',
	roomDefaultNote: 'Everyone who joins gets this role',
	groupNote: (g: string) => `Members of ${g} get this role in this room`,
	peopleNote: (n: number) => `${n} ${n === 1 ? 'person has' : 'people have'} this role in this room`,
	usedNone: 'This role is not used yet. Pick it as a room’s default role, or give it to a group on the Groups page.',
	createFirstUsed: 'Create the role first.',
	footEdit: 'Nothing changes until you press Save.',
	footUsed: 'Read only. Open a room or group to change it.',
	readOnly: 'Only tenant owners and admins can change roles.',
	save: 'Save',
	create: 'Create role',
	saved: 'Saved',
	unknownRoom: (id: number) => `Room #${id}`,
	unknownGroup: (id: number) => `Group #${id}`,
	compareIntro: 'Click a square to turn a permission on or off. Changed roles are highlighted until you save.',
	permission: 'Permission',
	compareFor: (perm: string, role: string) => `${perm} for ${role}`,
	noPending: 'No unsaved changes.',
	pending: (n: number) => `${n} ${n === 1 ? 'role' : 'roles'} changed. Save to apply.`,
	undoAll: 'Undo all',
	saveAll: 'Save changes',
	picture: 'images/mgmt/role.png',
} as const;

// Plain names for the permissions the server knows. Anything new still shows
// with its technical name in an "Other" group.
type PermInfo = { title: string; short: string };
const permInfo: Record<string, PermInfo> = {
	BYPASS_ROOM_LOCK: { title: 'Enter a locked room', short: 'Gets in even when the room is locked' },
	CHANGE_ROOM_LOCK: { title: 'Lock or unlock the room', short: 'Closes the room to new people' },
	PROMOTE_PEER: { title: 'Admit people from the lobby', short: 'Lets waiting people into the room' },
	SHARE_AUDIO: { title: 'Microphone', short: 'Speaks in the meeting' },
	SHARE_VIDEO: { title: 'Camera', short: 'Shows their webcam' },
	SHARE_SCREEN: { title: 'Screen', short: 'Shares a screen or window' },
	SHARE_EXTRA_VIDEO: { title: 'Extra video', short: 'Adds more cameras or video sources' },
	SHARE_FILE: { title: 'Files', short: 'Uploads files for everyone' },
	SEND_CHAT: { title: 'Send chat messages', short: 'Writes in the room chat' },
	MODERATE_CHAT: { title: 'Moderate chat', short: 'Clears the chat history' },
	MODERATE_FILES: { title: 'Moderate files', short: 'Removes shared files' },
	MODERATE_ROOM: { title: 'Moderate the room', short: 'Removes people, mutes all, stops video' },
	LOCAL_RECORD_ROOM: { title: 'Record on own device', short: 'Records the meeting locally' },
	CREATE_ROOM: { title: 'Create breakout rooms', short: 'Splits the meeting into small rooms' },
	CHANGE_ROOM: { title: 'Join or leave breakout rooms', short: 'Moves between breakout rooms' },
	MODIFY_ROLE: { title: 'Change other people’s roles', short: 'Not used yet' },
};

type CatKey = 'join' | 'share' | 'chat' | 'mod' | 'other';
const cats: Array<{ key: CatKey; short: string; label: string; dot: string; names: string[] }> = [
	{ key: 'join', short: 'Join', label: 'Join & lobby', dot: ui.blueDark, names: [ 'BYPASS_ROOM_LOCK', 'CHANGE_ROOM_LOCK', 'PROMOTE_PEER' ] },
	{ key: 'share', short: 'Share', label: 'Share', dot: ui.green, names: [ 'SHARE_AUDIO', 'SHARE_VIDEO', 'SHARE_SCREEN', 'SHARE_EXTRA_VIDEO', 'SHARE_FILE' ] },
	{ key: 'chat', short: 'Chat', label: 'Chat & files', dot: '#7c3aed', names: [ 'SEND_CHAT', 'MODERATE_CHAT', 'MODERATE_FILES' ] },
	{ key: 'mod', short: 'Moderate', label: 'Moderate', dot: ui.orangeText, names: [ 'MODERATE_ROOM', 'LOCAL_RECORD_ROOM', 'CREATE_ROOM', 'CHANGE_ROOM', 'MODIFY_ROLE' ] },
	{ key: 'other', short: 'Other', label: 'Other', dot: ui.slate, names: [] },
];
const catOf = (name: string): CatKey => cats.find((c) => c.names.includes(name))?.key ?? 'other';
const titleOf = (p: Permissions) => permInfo[p.name]?.title ?? p.name;
const shortOf = (p: Permissions) => permInfo[p.name]?.short ?? permissionDescriptions[p.name]?.() ?? str(p.description);
const longOf = (p: Permissions) => permissionDescriptions[p.name]?.() ?? str(p.description) ?? shortOf(p);

// "Start from" sets, by permission name.
const templates: Array<[string, string[] | 'all']> = [
	[ 'Listener', [ 'SEND_CHAT' ] ],
	[ 'Participant', [ 'SEND_CHAT', 'SHARE_AUDIO', 'SHARE_VIDEO', 'CHANGE_ROOM' ] ],
	[ 'Presenter', [ 'SEND_CHAT', 'SHARE_AUDIO', 'SHARE_VIDEO', 'SHARE_SCREEN', 'SHARE_EXTRA_VIDEO', 'SHARE_FILE', 'CHANGE_ROOM', 'BYPASS_ROOM_LOCK' ] ],
	[ 'Moderator', 'all' ],
];

type UsageFilter = 'all' | 'used' | 'unused';
type SortKey = 'name-asc' | 'name-desc' | 'most' | 'newest' | 'oldest';
type ViewKey = 'cards' | 'compare';
type TabKey = 'perms' | 'details' | 'used';
const PAGE = 24;
const VIEW_KEY = 'mgmt-roles-view';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowsOf = <T, >(res: any): T[] => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);
const sameId = (a: unknown, b: unknown) => asNumber(a) === asNumber(b);

type RoomWithRoles = Room & { userRoles?: Array<{ userId: number; roleId: number }> };

type Use = { kind: 'default' | 'group' | 'people'; roomId: number; groupId?: number; count?: number };
type RoleView = {
	role: Roles;
	tenantName: string;
	permIds: Set<number>;
	uses: Use[];
	rooms: number;
	groups: number;
	people: number;
};

const Meter = ({ n, total, width = '100%' }: { n: number; total: number; width?: number | string }) => (
	<Box aria-hidden sx={{ width, height: 6, bgcolor: ui.lineSoft, flexShrink: 0 }}>
		<Box sx={{ height: 6, width: `${total ? Math.round((n / total) * 100) : 0}%`, bgcolor: ui.blueDark, transition: 'width 300ms ease', '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }} />
	</Box>
);

type RoleItemProps = { view: RoleView; perms: Permissions[]; phone: boolean; on: boolean; onOpen: React.Dispatch<number> };

const RoleItem = memo(function RoleItemView({ view, perms, phone, on, onOpen }: RoleItemProps) {
	const r = view.role;
	const n = perms.filter((p) => view.permIds.has(asNumber(p.id))).length;
	const used = view.uses.length > 0;
	const usedText = used ? copy.usedSummary(view.rooms, view.groups, view.people) : copy.notUsedAnywhere;
	const active = { bgcolor: ui.orangeLight, borderColor: ui.orange, boxShadow: `inset 0 -4px 0 ${ui.orange}`, '& .role-media': { bgcolor: alpha(ui.orange, 0.16) } };

	if (phone) {
		return (
			<ButtonBase
				onClick={() => onOpen(asNumber(r.id))}
				sx={{ width: '100%', minHeight: 80, px: 1.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, textAlign: 'left', bgcolor: '#fff', border: `1px solid ${ui.line}`, '&:hover, &.Mui-focusVisible': { bgcolor: ui.orangeLight, borderColor: ui.orange }, '&.Mui-focusVisible': focusRing }}
			>
				<Box sx={{ width: 48, height: 48, flexShrink: 0, bgcolor: ui.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Box component='img' src={copy.picture} alt='' sx={{ width: 32, height: 32 }} />
				</Box>
				<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
					<Box component='span' sx={{ fontSize: 19, lineHeight: '24px', fontWeight: 700, color: ui.orangeText, ...ellipsis }}>{r.name}</Box>
					<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{view.tenantName}</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Meter n={n} total={perms.length} width={80} />
						<Box component='span' sx={{ fontSize: 12, fontWeight: 600, color: ui.navy }}>{n} of {perms.length}</Box>
					</Box>
				</Box>
				<ChevronRightOutlinedIcon sx={{ color: ui.slateDot, flexShrink: 0 }} />
			</ButtonBase>
		);
	}

	return (
		<ButtonBase
			aria-pressed={on}
			onClick={() => onOpen(asNumber(r.id))}
			sx={{
				flexGrow: 1,
				minWidth: 0,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'stretch',
				textAlign: 'left',
				bgcolor: '#fff',
				border: `1px solid ${ui.line}`,
				transition: `background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, ${liftTransition}`,
				'& .role-media': { transition: 'background-color 150ms ease' },
				...(on ? active : {}),
				'&:hover, &.Mui-focusVisible': { ...active, ...liftOn(`inset 0 -4px 0 ${ui.orange}`) },
				'&.Mui-focusVisible': { ...active, ...focusRing },
				'@media (prefers-reduced-motion: reduce)': { transition: 'none', '& .role-media': { transition: 'none' } },
			}}
		>
			<Box className='role-media' sx={{ position: 'relative', height: 80, flexShrink: 0, bgcolor: ui.blueLight, borderBottom: `1px solid ${ui.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Box component='img' src={copy.picture} alt='' sx={{ width: 50, height: 50 }} />
				<Box component='span' sx={{ position: 'absolute', top: 10, right: 10, maxWidth: 'calc(100% - 20px)', px: 1, py: '3px', bgcolor: '#fff', fontSize: 12, lineHeight: '16px', fontWeight: 600, color: ui.body, ...ellipsis }}>{view.tenantName}</Box>
			</Box>
			<Box sx={{ flexGrow: 1, p: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
				<Box component='span' sx={{ fontSize: 20, lineHeight: '26px', fontWeight: 700, color: ui.orangeText, ...ellipsis }}>{r.name}</Box>
				<Box component='span' sx={{ minHeight: 18, fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{str(r.description)}</Box>
				<Box sx={{ flexGrow: 1 }} />
				<Box component='span' sx={{ fontSize: 13, fontWeight: 600, color: ui.navy }}>{copy.ofTotal(n, perms.length)}</Box>
				<Meter n={n} total={perms.length} />
				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 1.25, rowGap: '4px', fontSize: 12, lineHeight: '16px', color: ui.body }}>
					{cats.map((c) => {
						const inCat = perms.filter((p) => catOf(p.name) === c.key);

						if (!inCat.length) return null;
						const k = inCat.filter((p) => view.permIds.has(asNumber(p.id))).length;

						return (
							<Box component='span' key={c.key} sx={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
								<Box component='span' aria-hidden sx={{ width: 8, height: 8, flexShrink: 0, bgcolor: c.dot }} />
								<Box component='span' title={c.label} sx={ellipsis}>{c.short}</Box>
								<Box component='b' sx={{ ml: 'auto', color: k ? ui.navy : ui.muted }}>{k}/{inCat.length}</Box>
							</Box>
						);
					})}
				</Box>
				<Box component='span' sx={{ mt: '2px', fontSize: 12, lineHeight: '16px', color: used ? ui.body : ui.muted, ...ellipsis }}>{usedText}</Box>
			</Box>
		</ButtonBase>
	);
});

const RoleTable = () => {
	const dispatch = useAppDispatch();
	const { tenantAdmin, tenantOwner, superAdmin } = useAppSelector((state) => state.management);
	const canEdit = Boolean(tenantAdmin || tenantOwner || superAdmin);
	const phone = useMediaQuery('(max-width: 599.95px)');
	const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

	const [ roles, setRoles ] = useState<Roles[]>([]);
	const [ permissions, setPermissions ] = useState<Permissions[]>([]);
	const [ links, setLinks ] = useState<RolePermissions[]>([]);
	const [ tenants, setTenants ] = useState<Tenant[]>([]);
	const [ rooms, setRooms ] = useState<RoomWithRoles[]>([]);
	const [ groups, setGroups ] = useState<Groups[]>([]);
	const [ groupRoles, setGroupRoles ] = useState<GroupRoles[]>([]);
	const [ isLoading, setIsLoading ] = useState(true);

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const fetchRoles = () => dispatch(getData('roles')).then((t: any) => { if (t != undefined) setRoles(rowsOf<Roles>(t)); });
	const fetchLinks = () => dispatch(getData('rolePermissions')).then((t: any) => { if (t != undefined) setLinks(rowsOf<RolePermissions>(t)); });

	useEffect(() => {
		Promise.all([
			fetchRoles(),
			fetchLinks(),
			dispatch(getData('permissions')).then((t: any) => { if (t != undefined) setPermissions(rowsOf<Permissions>(t)); }),
			dispatch(getData('tenants')).then((t: any) => { if (t != undefined) setTenants(rowsOf<Tenant>(t)); }),
			dispatch(getData('rooms')).then((t: any) => { if (t != undefined) setRooms(rowsOf<RoomWithRoles>(t)); }),
			dispatch(getData('groups')).then((t: any) => { if (t != undefined) setGroups(rowsOf<Groups>(t)); }),
			dispatch(getData('roomGroupRoles')).then((t: any) => { if (t != undefined) setGroupRoles(rowsOf<GroupRoles>(t)); }),
		]).finally(() => setIsLoading(false));
	}, []);
	/* eslint-enable @typescript-eslint/no-explicit-any */

	const tenantName = (id: unknown) => tenants.find((t) => sameId(t.id, id))?.name || undefinedTenantLabel();

	// Permissions in display order: by group, then as the groups list them.
	const perms = useMemo(() => {
		const order = (p: Permissions) => {
			const ci = cats.findIndex((c) => c.key === catOf(p.name));
			const pi = cats[ci].names.indexOf(p.name);

			return (ci * 100) + (pi < 0 ? 99 : pi);
		};

		return [ ...permissions ].sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
	}, [ permissions ]);
	const permByName = useMemo(() => new Map(perms.map((p) => [ p.name, p ])), [ perms ]);

	// A role's permissions: the rolePermissions rows when the server lists
	// them, else the role's own permissions array.
	const permIdsOf = (r: Roles): Set<number> => {
		const fromLinks = links.filter((l) => sameId(l.roleId, r.id)).map((l) => asNumber(l.permissionId));

		if (fromLinks.length || links.length) return new Set(fromLinks);

		return new Set((r.permissions ?? []).map((p) => asNumber(p.id)));
	};

	const views = useMemo<RoleView[]>(() => roles.map((r) => {
		const uses: Use[] = [];

		rooms.forEach((room) => {
			if (sameId(room.defaultRoleId, r.id)) uses.push({ kind: 'default', roomId: asNumber(room.id) });
			const people = new Set((room.userRoles ?? []).filter((u) => sameId(u.roleId, r.id)).map((u) => asNumber(u.userId))).size;

			if (people) uses.push({ kind: 'people', roomId: asNumber(room.id), count: people });
		});
		groupRoles.filter((g) => sameId(g.roleId, r.id)).forEach((g) => uses.push({ kind: 'group', roomId: asNumber(g.roomId), groupId: asNumber(g.groupId) }));

		return {
			role: r,
			tenantName: tenantName(r.tenantId),
			permIds: permIdsOf(r),
			uses,
			rooms: uses.filter((u) => u.kind === 'default').length,
			groups: uses.filter((u) => u.kind === 'group').length,
			people: uses.filter((u) => u.kind === 'people').reduce((n, u) => n + (u.count ?? 0), 0),
		};
	}), [ roles, links, rooms, groupRoles, tenants ]);

	// ----- Filters -----
	const [ search, setSearch ] = useState('');
	const [ usage, setUsage ] = useState<UsageFilter>('all');
	const [ tenantFilter, setTenantFilter ] = useState('all');
	const [ sortKey, setSortKey ] = useState<SortKey>('name-asc');
	const [ limit, setLimit ] = useState(PAGE);
	const [ view, setView ] = useState<ViewKey>(() => {
		try {
			return localStorage.getItem(VIEW_KEY) === 'compare' ? 'compare' : 'cards';
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
	const compareMode = view === 'compare' && !phone;

	const counts = {
		all: views.length,
		used: views.filter((v) => v.uses.length > 0).length,
		unused: views.filter((v) => v.uses.length === 0).length,
	};
	const visible = useMemo(() => {
		const q = search.trim().toLowerCase();
		// A search also finds roles by a permission's plain or technical name.
		const matches = (v: RoleView) => !q
			|| `${v.role.name} ${str(v.role.description)}`.toLowerCase().includes(q)
			|| perms.some((p) => v.permIds.has(asNumber(p.id)) && `${p.name} ${titleOf(p)}`.toLowerCase().includes(q));
		const list = views
			.filter((v) => usage === 'all' || (usage === 'used' ? v.uses.length > 0 : v.uses.length === 0))
			.filter((v) => tenantFilter === 'all' || String(v.role.tenantId) === tenantFilter)
			.filter(matches);

		return [ ...list ].sort((a, b) => {
			if (sortKey === 'newest') return asNumber(b.role.id) - asNumber(a.role.id);
			if (sortKey === 'oldest') return asNumber(a.role.id) - asNumber(b.role.id);
			if (sortKey === 'most') return b.permIds.size - a.permIds.size || a.role.name.localeCompare(b.role.name);
			const byName = str(a.role.name).localeCompare(str(b.role.name));

			return sortKey === 'name-desc' ? -byName : byName;
		});
	}, [ views, usage, tenantFilter, search, sortKey, perms ]);
	const filtersOn = usage !== 'all' || tenantFilter !== 'all' || search.trim() !== '';
	const clearFilters = () => {
		setUsage('all');
		setTenantFilter('all');
		setSearch('');
		setLimit(PAGE);
	};

	// ----- Saving a role's permissions -----
	const syncPerms = async (roleId: number, wanted: Set<number>, notify: boolean) => {
		const current = links.filter((l) => sameId(l.roleId, roleId));
		const currentIds = new Set(current.map((l) => asNumber(l.permissionId)));
		const add = [ ...wanted ].filter((id) => !currentIds.has(id));
		const remove = current.filter((l) => !wanted.has(asNumber(l.permissionId))).map((l) => asNumber(l.id));

		if (!add.length && !remove.length) return true;

		return dispatch(syncRolePermissions(roleId, add, remove, notify));
	};

	// ----- Modal -----
	// selectedId stays set while the modal slides out; 0 is a new role.
	const [ selectedId, setSelectedId ] = useState<number | null>(null);
	const [ modalOpen, setModalOpen ] = useState(false);
	const [ tab, setTab ] = useState<TabKey>('perms');
	const [ draftName, setDraftName ] = useState('');
	const [ draftDesc, setDraftDesc ] = useState('');
	const [ draftTenant, setDraftTenant ] = useState('');
	const [ draftPerms, setDraftPerms ] = useState<Set<number>>(new Set());
	const [ busy, setBusy ] = useState(false);
	const [ savedAt, setSavedAt ] = useState(0);
	const [ confirmDelete, setConfirmDelete ] = useState(false);

	const isNew = selectedId === 0;
	const selectedView = selectedId ? views.find((v) => sameId(v.role.id, selectedId)) ?? null : null;
	const selected = selectedView?.role ?? null;

	const fillDrafts = (v: RoleView | null, startTab: TabKey) => {
		setDraftName(str(v?.role.name));
		setDraftDesc(str(v?.role.description));
		setDraftTenant(v ? String(v.role.tenantId) : (tenantFilter !== 'all' ? tenantFilter : String(tenants[0]?.id ?? '')));
		setDraftPerms(new Set(v ? v.permIds : []));
		setTab(startTab);
		setSavedAt(0);
		setConfirmDelete(false);
	};

	const openRole = useCallback((id: number) => {
		setSelectedId(id);
		setModalOpen(true);
	}, []);

	useEffect(() => {
		if (modalOpen && selectedId) fillDrafts(views.find((v) => sameId(v.role.id, selectedId)) ?? null, 'perms');
	}, [ modalOpen, selectedId ]);

	const openNew = (from?: RoleView) => {
		setSelectedId(0);
		fillDrafts(null, from ? 'details' : 'perms');
		if (from) {
			setDraftName(copy.copyOf(from.role.name));
			setDraftDesc(str(from.role.description));
			setDraftTenant(String(from.role.tenantId));
			setDraftPerms(new Set(from.permIds));
		}
		setModalOpen(true);
	};
	const closeModal = () => setModalOpen(false);

	const sameSet = (a: Set<number>, b: Set<number>) => a.size === b.size && [ ...a ].every((x) => b.has(x));
	const detailsDirty = isNew || Boolean(selected && (draftName !== str(selected.name) || draftDesc !== str(selected.description) || draftTenant !== String(selected.tenantId)));
	const permsDirty = Boolean(selectedView && !sameSet(draftPerms, selectedView.permIds)) || (isNew && draftPerms.size > 0);
	const dirty = isNew ? draftName.trim() !== '' : detailsDirty || permsDirty;
	const canSave = canEdit && dirty && draftName.trim() !== '' && draftTenant !== '' && !busy;

	const save = async () => {
		if (!canSave) {
			if (draftName.trim() === '') dispatch(notificationsActions.enqueueNotification({ message: nameCannotBeEmptyLabel(), options: { variant: 'warning' } }));

			return;
		}
		setBusy(true);
		try {
			if (isNew) {
				const created = await dispatch(createData({ name: draftName.trim(), description: draftDesc.trim(), tenantId: asNumber(draftTenant) }, 'roles')) as Roles | undefined;

				if (created && created.id) {
					if (draftPerms.size) await dispatch(syncRolePermissions(asNumber(created.id), [ ...draftPerms ], [], false));
					await Promise.all([ fetchRoles(), fetchLinks() ]);
					setSelectedId(asNumber(created.id));
				}
			} else if (selected) {
				if (detailsDirty) await dispatch(patchData(asNumber(selected.id), { name: draftName.trim(), description: draftDesc.trim(), tenantId: asNumber(draftTenant) }, 'roles'));
				if (permsDirty) await syncPerms(asNumber(selected.id), draftPerms, !detailsDirty);
				await Promise.all([ fetchRoles(), fetchLinks() ]);
				setDraftName(draftName.trim());
				setDraftDesc(draftDesc.trim());
				setSavedAt(Date.now());
			}
		} finally {
			setBusy(false);
		}
	};

	const used = Boolean(selectedView && selectedView.uses.length > 0);
	const removeRole = async () => {
		if (!selected || used) return;
		if (!confirmDelete) {
			setConfirmDelete(true);

			return;
		}
		setBusy(true);
		try {
			await dispatch(deleteData(asNumber(selected.id), 'roles'));
			setModalOpen(false);
			await Promise.all([ fetchRoles(), fetchLinks() ]);
		} finally {
			setBusy(false);
			setConfirmDelete(false);
		}
	};

	const togglePerm = (id: number) => {
		setSavedAt(0);
		setDraftPerms((s) => {
			const next = new Set(s);

			if (next.has(id)) next.delete(id);
			else next.add(id);

			return next;
		});
	};
	const setMany = (ids: number[], on: boolean) => {
		setSavedAt(0);
		setDraftPerms((s) => {
			const next = new Set(s);

			ids.forEach((id) => (on ? next.add(id) : next.delete(id)));

			return next;
		});
	};
	const applyTemplate = (names: string[] | 'all') => {
		setSavedAt(0);
		setDraftPerms(new Set(names === 'all' ? perms.map((p) => asNumber(p.id)) : names.map((n) => permByName.get(n)).filter(Boolean)
			.map((p) => asNumber((p as Permissions).id))));
	};

	// ----- Compare grid -----
	const [ pending, setPending ] = useState<Record<number, Set<number>>>({});
	const pendingCount = Object.keys(pending).length;
	const permsInGrid = (v: RoleView) => pending[asNumber(v.role.id)] ?? v.permIds;
	const toggleCell = (v: RoleView, pid: number) => {
		const rid = asNumber(v.role.id);
		const next = new Set(permsInGrid(v));

		if (next.has(pid)) next.delete(pid);
		else next.add(pid);
		setPending((p) => {
			const copyP = { ...p };

			if (sameSet(next, v.permIds)) delete copyP[rid];
			else copyP[rid] = next;

			return copyP;
		});
	};
	const saveGrid = async () => {
		setBusy(true);
		try {
			const results = await Promise.all(Object.entries(pending).map(([ rid, set ]) => syncPerms(asNumber(rid), set, false)));

			await fetchLinks();
			setPending({});
			if (results.every(Boolean)) dispatch(notificationsActions.enqueueNotification({ message: copy.saved, options: { variant: 'success' } }));
		} finally {
			setBusy(false);
		}
	};

	// ----- Pieces -----
	const orangeButtonSx = { borderRadius: 0, height: 44, px: 2.5, bgcolor: ui.orange, color: ui.navy, fontWeight: 600, boxShadow: 'none', '&:hover': { bgcolor: ui.orangeHover, boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: ui.lineSoft, color: ui.muted } } as const;
	const fieldProps = { slotProps: { input: { sx: { borderRadius: 0 } } } } as const;

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
						sx={{ flex: fill ? { xs: 1, sm: 'none' } : 'none', height: { xs: 42, sm: 38 }, px: 1.75, gap: 0.75, borderLeft: i ? `1px solid ${ui.line}` : 0, bgcolor: on ? ui.navy : '#fff', color: on ? '#fff' : ui.body, fontSize: 14, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap', '&:hover': { bgcolor: on ? ui.navy : ui.grey }, '&.Mui-focusVisible': focusRing }}
					>
						{content}
					</ButtonBase>
				);
			})}
		</Box>
	);

	const shown = visible.slice(0, limit);
	// Motion (2026-10-18): cards rise in on first show and slide to their
	// new places when a filter or sort changes.
	const intro = useIntro(shown.length > 0);
	const listRef = useRef<HTMLDivElement>(null);

	useFlip(listRef, `${compareMode ? 'g' : 'c'}:${shown.map((v) => v.role.id)
		.join(',')}`);
	const justSaved = useJustSaved(savedAt);
	const gridCols = `minmax(220px, 280px) repeat(${Math.max(1, visible.length)}, minmax(104px, 1fr))`;

	const compareGrid = (
		<Box sx={{ bgcolor: '#fff', border: `1px solid ${ui.line}`, display: 'flex', flexDirection: 'column' }}>
			<Box sx={{ px: 2, py: 1.25, fontSize: 13, lineHeight: '18px', color: ui.muted, borderBottom: `1px solid ${ui.lineSoft}` }}>{canEdit ? copy.compareIntro : copy.readOnly}</Box>
			<Box sx={{ overflowX: 'auto' }}>
				<Box role='table' aria-label={copy.compare} sx={{ minWidth: 'fit-content' }}>
					<Box role='row' sx={{ display: 'grid', gridTemplateColumns: gridCols, bgcolor: '#f8fafc', borderBottom: `2px solid ${ui.line}` }}>
						<Box role='columnheader' sx={{ px: 2, pb: 1.25, display: 'flex', alignItems: 'flex-end', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: ui.slate }}>{copy.permission}</Box>
						{visible.map((v) => (
							<Box role='columnheader' key={v.role.id} sx={{ borderLeft: `1px solid ${ui.lineSoft}`, bgcolor: pending[asNumber(v.role.id)] ? ui.orangeLight : 'transparent' }}>
								<ButtonBase onClick={() => openRole(asNumber(v.role.id))} sx={{ width: '100%', minHeight: 60, px: 0.75, py: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '2px', '&:hover': { bgcolor: ui.grey }, '&.Mui-focusVisible': { ...focusRing, outlineOffset: -2 } }}>
									<Box component='span' sx={{ fontSize: 14, lineHeight: '18px', fontWeight: 700, color: ui.navy, textAlign: 'center', overflowWrap: 'anywhere' }}>{v.role.name}</Box>
									<Box component='span' sx={{ fontSize: 12, lineHeight: '16px', color: ui.muted }}>{permsInGrid(v).size} of {perms.length}</Box>
								</ButtonBase>
							</Box>
						))}
					</Box>
					{cats.map((c) => {
						const inCat = perms.filter((p) => catOf(p.name) === c.key);

						if (!inCat.length) return null;

						return (
							<Box key={c.key} role='rowgroup'>
								<Box role='row' sx={{ height: 28, px: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: ui.grey, borderBottom: `1px solid ${ui.lineSoft}` }}>
									<Box component='span' aria-hidden sx={{ width: 8, height: 8, bgcolor: c.dot }} />
									<Box role='rowheader' component='span' sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ui.body }}>{c.label}</Box>
								</Box>
								{inCat.map((p) => (
									<Box role='row' key={p.id} sx={{ display: 'grid', gridTemplateColumns: gridCols, minHeight: 32, borderBottom: '1px solid #eef2f7' }}>
										<Tooltip title={`${longOf(p)} (${p.name})`} placement='top-start'>
											<Box role='rowheader' component='span' sx={{ px: 2, display: 'flex', alignItems: 'center', fontSize: 14, color: ui.text, ...ellipsis }}>{titleOf(p)}</Box>
										</Tooltip>
										{visible.map((v, ci) => {
											const pid = asNumber(p.id);
											const on = permsInGrid(v).has(pid);

											return (
												<Box role='cell' key={v.role.id} sx={{ borderLeft: '1px solid #eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: ci % 2 ? '#fbfcfe' : 'transparent' }}>
													<ButtonBase
														role='switch'
														aria-checked={on}
														aria-label={copy.compareFor(titleOf(p), v.role.name)}
														disabled={!canEdit || busy}
														onClick={() => toggleCell(v, pid)}
														sx={{ width: 22, height: 22, border: `2px solid ${on ? ui.blueDark : ui.slateDot}`, bgcolor: on ? ui.blueDark : '#fff', color: '#fff', '&:hover': { borderColor: ui.navy }, '&.Mui-focusVisible': focusRing, '&.Mui-disabled': { opacity: on ? 0.85 : 0.6 } }}
													>
														{on && <CheckOutlinedIcon sx={{ fontSize: 16 }} />}
													</ButtonBase>
												</Box>
											);
										})}
									</Box>
								))}
							</Box>
						);
					})}
				</Box>
			</Box>
			{canEdit && (
				<Box sx={{ px: 2, py: 1.25, borderTop: `1px solid ${ui.lineSoft}`, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
					<Box role='status' aria-live='polite' sx={{ flexGrow: 1, fontSize: 13, color: ui.muted }}>{pendingCount ? copy.pending(pendingCount) : copy.noPending}</Box>
					<Button variant='outlined' onClick={() => setPending({})} disabled={!pendingCount || busy} sx={{ borderRadius: 0, height: 40 }}>{copy.undoAll}</Button>
					<Button onClick={saveGrid} disabled={!pendingCount || busy} sx={{ ...orangeButtonSx, height: 40 }}>{copy.saveAll}</Button>
				</Box>
			)}
		</Box>
	);

	const results = isLoading && views.length === 0 ? (
		<Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(260px, 1fr))' }, gap: { xs: 1.25, sm: 2.5 } }}>
			{[ 0, 1, 2, 3, 4, 5, 6, 7 ].map((i) => <Skeleton key={i} variant='rectangular' height={phone ? 80 : 290} sx={{ borderRadius: 0 }} />)}
		</Box>
	) : visible.length === 0 ? (
		<Box sx={{ py: 6, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, bgcolor: '#fff', border: `1px solid ${ui.line}`, textAlign: 'center' }}>
			<Typography sx={{ color: ui.muted }}>{views.length === 0 ? copy.noRolesYet : copy.noRoles}</Typography>
			{filtersOn && <Button variant='outlined' onClick={clearFilters} sx={{ borderRadius: 0 }}>{copy.clearFilters}</Button>}
		</Box>
	) : compareMode ? compareGrid : (
		<Box component='ul' aria-label={rolesLabel()} sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(260px, 1fr))' }, gap: { xs: 1.25, sm: 2.5 } }}>
			{shown.map((v, index) => (
				<Box component='li' key={v.role.id} data-flip={v.role.id} sx={{ minWidth: 0, display: 'flex', ...staggerSx(index, intro) }}>
					<RoleItem view={v} perms={perms} phone={phone} on={modalOpen && sameId(v.role.id, selectedId)} onOpen={openRole} />
				</Box>
			))}
		</Box>
	);

	// ----- Modal content -----
	const titleText = isNew ? (draftName.trim() || copy.newRole) : str(selected?.name);
	const usedText = selectedView ? copy.usedSummary(selectedView.rooms, selectedView.groups, selectedView.people) : '';

	const permRow = (p: Permissions) => {
		const pid = asNumber(p.id);
		const on = draftPerms.has(pid);

		return (
			<Box component='label' key={p.id} title={p.name} sx={{ minHeight: 42, px: 0.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #eef2f7', cursor: canEdit ? 'pointer' : 'default', '&:hover': { bgcolor: canEdit ? '#f8fafc' : 'transparent' } }}>
				<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
					<Box component='span' sx={{ fontSize: 14, lineHeight: '18px', fontWeight: 600, color: on ? ui.navy : ui.body }}>{titleOf(p)}</Box>
					<Box component='span' sx={{ fontSize: 12, lineHeight: '16px', color: ui.muted, ...ellipsis }}>{shortOf(p)}</Box>
				</Box>
				<Switch
					checked={on}
					onChange={() => togglePerm(pid)}
					disabled={!canEdit}
					slotProps={{ input: { 'aria-label': titleOf(p) } }}
					sx={switchSx}
				/>
			</Box>
		);
	};

	const catSection = (c: typeof cats[number]) => {
		const inCat = perms.filter((p) => catOf(p.name) === c.key);

		if (!inCat.length) return null;
		const ids = inCat.map((p) => asNumber(p.id));
		const k = ids.filter((id) => draftPerms.has(id)).length;
		const allOn = k === ids.length;

		return (
			<Box component='section' key={c.key} aria-label={c.label} sx={{ display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ minHeight: 36, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `2px solid ${c.dot}` }}>
					<Box component='span' aria-hidden sx={{ width: 10, height: 10, bgcolor: c.dot }} />
					<Typography component='h3' sx={{ m: 0, flexGrow: 1, fontSize: 13, lineHeight: '16px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ui.body }}>
						{c.label} <Box component='span' sx={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none', color: ui.muted }}>· {k} of {ids.length}</Box>
					</Typography>
					{canEdit && (
						<Button size='small' onClick={() => setMany(ids, !allOn)} sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600, color: ui.blueDark, minWidth: 0 }}>
							{allOn ? copy.turnAllOff : copy.turnAllOn}
						</Button>
					)}
				</Box>
				{inCat.map(permRow)}
			</Box>
		);
	};

	const visibleCats = cats.filter((c) => perms.some((p) => catOf(p.name) === c.key));
	// Two balanced columns on desktop: fill the left one with groups until it
	// holds about half of the permissions (8 + 8 for the standard set).
	const half = perms.length / 2;
	let leftCount = 0;
	const leftCats: typeof visibleCats = [];
	const rightCats: typeof visibleCats = [];

	visibleCats.forEach((c) => {
		const n = perms.filter((p) => catOf(p.name) === c.key).length;

		if (leftCount < half && leftCount + n <= half + 1) {
			leftCats.push(c);
			leftCount += n;
		} else rightCats.push(c);
	});

	const permsPanel = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
			{canEdit ? (
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
					<Box component='span' sx={{ fontSize: 13, fontWeight: 600, color: ui.body, mr: 0.5 }}>{copy.startFrom}</Box>
					{templates.map(([ label, names ]) => (
						<Button key={label} variant='outlined' size='small' onClick={() => applyTemplate(names)} sx={{ borderRadius: 0, height: 34, textTransform: 'none', fontWeight: 600, color: ui.navy, borderColor: ui.line, '&:hover': { borderColor: ui.orange, bgcolor: ui.orangeLight } }}>{label}</Button>
					))}
					<Box sx={{ flexGrow: 1 }} />
					<Box component='span' role='status' aria-live='polite' sx={{ fontSize: 13, color: ui.muted }}>{copy.onCount(draftPerms.size, perms.length)}</Box>
				</Box>
			) : (
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: ui.muted }}><LockOutlinedIcon sx={{ fontSize: 16 }} />{copy.readOnly}</Box>
			)}
			{phone ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>{visibleCats.map(catSection)}</Box>
			) : (
				<Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', columnGap: 3.5 }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>{leftCats.map(catSection)}</Box>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>{rightCats.map(catSection)}</Box>
				</Box>
			)}
		</Box>
	);

	const detailsPanel = (
		<Box sx={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 1 }}>
			<TextField
				label={copy.name}
				required
				fullWidth
				autoFocus={isNew}
				value={draftName}
				disabled={!canEdit}
				onChange={(e) => { setDraftName(e.target.value); setSavedAt(0); }}
				error={!isNew && detailsDirty && draftName.trim() === ''}
				helperText={!isNew && detailsDirty && draftName.trim() === '' ? copy.required : ' '}
				{...fieldProps}
			/>
			<TextField
				label={copy.description}
				fullWidth
				multiline
				minRows={2}
				maxRows={4}
				value={draftDesc}
				disabled={!canEdit}
				onChange={(e) => { setDraftDesc(e.target.value); setSavedAt(0); }}
				{...fieldProps}
			/>
			<TextField
				select
				label={tenantLabel()}
				fullWidth
				value={draftTenant}
				disabled={!canEdit}
				onChange={(e) => { setDraftTenant(e.target.value); setSavedAt(0); }}
				sx={{ mt: 1.25 }}
				{...fieldProps}
			>
				{tenants.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}
			</TextField>
			{!isNew && canEdit && selectedView && <>
				<Button variant='outlined' startIcon={<ContentCopyOutlinedIcon />} onClick={() => openNew(selectedView)} sx={{ alignSelf: 'flex-start', mt: 1.5, borderRadius: 0, height: 40, color: ui.navy, borderColor: ui.line }}>{copy.duplicate}</Button>
				<Box sx={{ mt: 1.5, p: '14px 16px', border: '1px solid #f3c7c2', bgcolor: '#fff8f7', display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
					<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
						<Box component='span' sx={{ fontSize: 14, fontWeight: 600, color: '#8f1d14' }}>{copy.deleteTitle}</Box>
						<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{used ? copy.deleteHelpUsed(usedText) : copy.deleteHelpFree}</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
						{confirmDelete && <Button variant='outlined' onClick={() => setConfirmDelete(false)} sx={{ borderRadius: 0, height: 40 }}>{cancelLabel()}</Button>}
						<Button
							variant={confirmDelete ? 'contained' : 'outlined'}
							onClick={removeRole}
							disabled={busy || used}
							startIcon={<DeleteOutlineOutlinedIcon />}
							sx={{ borderRadius: 0, height: 40, boxShadow: 'none', ...(confirmDelete ? { bgcolor: '#b42318', color: '#fff', '&:hover': { bgcolor: '#8f1d14', boxShadow: 'none' } } : { color: '#b42318', borderColor: '#b42318', bgcolor: '#fff', '&:hover': { borderColor: '#8f1d14', bgcolor: '#fdecec' } }) }}
						>
							{confirmDelete ? copy.deleteConfirm : copy.deleteRole}
						</Button>
					</Box>
				</Box>
			</>}
		</Box>
	);

	const roomName = (id: number) => rooms.find((r) => sameId(r.id, id))?.name || copy.unknownRoom(id);
	const groupName = (id?: number) => groups.find((g) => sameId(g.id, id))?.name || copy.unknownGroup(asNumber(id));
	const kindStyle = { default: [ ui.blueDark, ui.blueLight, copy.roomDefault ], group: [ ui.green, '#e7f6ee', copy.groupRole ], people: [ ui.slate, ui.grey, copy.peopleRole ] } as const;

	const usedPanel = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
			<Box sx={{ fontSize: 14, lineHeight: '20px', color: ui.body }}>{copy.usedIntro}</Box>
			{!selectedView || selectedView.uses.length === 0 ? (
				<Box sx={{ p: 3, border: '1px dashed #b8c6da', textAlign: 'center', fontSize: 14, color: ui.muted }}>{copy.usedNone}</Box>
			) : (
				<Box component='ul' aria-label={copy.whereUsed} sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
					{selectedView.uses.map((u, i) => {
						const [ fg, bg, label ] = kindStyle[u.kind];
						const title = u.kind === 'group' ? `${groupName(u.groupId)} → ${roomName(u.roomId)}` : roomName(u.roomId);
						const note = u.kind === 'default' ? copy.roomDefaultNote : u.kind === 'group' ? copy.groupNote(groupName(u.groupId)) : copy.peopleNote(u.count ?? 0);

						return (
							<Box component='li' key={i} sx={{ minHeight: 60, px: 1.75, py: 1.25, border: `1px solid ${ui.line}`, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
								<Box component='span' sx={{ width: 104, flexShrink: 0, textAlign: 'center', fontSize: 12, fontWeight: 600, color: fg, bgcolor: bg, px: 1, py: '3px' }}>{label}</Box>
								<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
									<Box component='span' sx={{ fontSize: 15, lineHeight: '20px', fontWeight: 600, color: ui.navy, overflowWrap: 'anywhere' }}>{title}</Box>
									<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{note}</Box>
								</Box>
							</Box>
						);
					})}
				</Box>
			)}
		</Box>
	);

	const tabDefs: Array<[TabKey, string, number | null]> = [
		[ 'perms', copy.permissions, draftPerms.size ],
		[ 'details', copy.details, null ],
		[ 'used', copy.whereUsed, selectedView ? selectedView.uses.length : null ],
	];
	const panelTitleId = 'role-panel-title';
	const showModal = modalOpen && (isNew || selected !== null);

	const modal = (isNew || selected) && (
		<Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderTop: `4px solid ${ui.orange}` }}>
			<Box sx={{ flexShrink: 0, pt: 2, pl: { xs: 2, sm: 3 }, pr: 1, display: 'flex', alignItems: 'flex-start', gap: 1.75, '@media (max-height: 800px)': { pt: 1.25 } }}>
				<Box sx={{ width: 52, height: 52, flexShrink: 0, bgcolor: ui.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Box component='img' src={copy.picture} alt='' sx={{ width: 36, height: 36 }} />
				</Box>
				<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
					<Typography id={panelTitleId} component='h2' sx={{ m: 0, fontSize: 22, lineHeight: '30px', fontWeight: 700, color: ui.orangeText, overflowWrap: 'anywhere' }}>{titleText}</Typography>
					<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>
						{isNew ? tenantName(draftTenant) : [ tenantName(selected?.tenantId), copy.roleNo(asNumber(selected?.id)), usedText ].filter(Boolean).join(' · ')}
					</Box>
				</Box>
				<IconButton onClick={closeModal} aria-label={closeLabel()} sx={{ width: 44, height: 44, borderRadius: 0, color: ui.navy }}>
					<CloseOutlinedIcon />
				</IconButton>
			</Box>

			<Tabs
				value={tab}
				onChange={(_e, v: TabKey) => setTab(v)}
				aria-label={copy.tabs}
				variant='scrollable'
				scrollButtons={false}
				sx={{ flexShrink: 0, mt: 1.25, '@media (max-height: 800px)': { mt: 0.5 }, px: { xs: 1, sm: 2 }, minHeight: 46, borderBottom: `1px solid ${ui.lineSoft}`, '& .MuiTabs-indicator': { height: 3, bgcolor: ui.orange } }}
			>
				{tabDefs.map(([ key, label, count ]) => (
					<Tab
						key={key}
						value={key}
						id={`role-tab-${key}`}
						aria-controls={`role-tabpanel-${key}`}
						disabled={isNew && key === 'used'}
						disableRipple
						label={
							<Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								{label}
								{count !== null && (
									<Box component='span' sx={{ minWidth: 22, px: '6px', fontSize: 12, lineHeight: '18px', fontWeight: 600, color: tab === key ? '#fff' : ui.body, bgcolor: tab === key ? ui.navy : '#eef2f7' }}>{count}</Box>
								)}
							</Box>
						}
						sx={{ minHeight: 46, px: 1.75, textTransform: 'none', fontSize: 15, fontWeight: 500, color: ui.slate, '&.Mui-selected': { color: ui.navy, fontWeight: 600 }, '&.Mui-focusVisible': { ...focusRing, outlineOffset: -2 } }}
					/>
				))}
			</Tabs>

			<Box
				role='tabpanel'
				id={`role-tabpanel-${tab}`}
				aria-labelledby={`role-tab-${tab}`}
				sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', px: { xs: 2, sm: 3 }, py: 2, '@media (max-height: 800px)': { py: 1.25 } }}
			>
				{tab === 'perms' ? permsPanel : tab === 'details' ? detailsPanel : usedPanel}
			</Box>

			<Box sx={{ flexShrink: 0, minHeight: 68, px: { xs: 2, sm: 3 }, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25, borderTop: `1px solid ${ui.lineSoft}` }}>
				<Box role='status' aria-live='polite' sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', fontSize: 13, lineHeight: '18px', color: ui.muted }}>
					{savedAt > 0 && !dirty
						? <Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 14, fontWeight: 600, color: ui.green }}><CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />{copy.saved}</Box>
						: <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>{!canEdit ? copy.readOnly : tab === 'used' ? copy.footUsed : copy.footEdit}</Box>}
				</Box>
				<Button variant='outlined' onClick={closeModal} sx={{ borderRadius: 0, height: 44, flexShrink: 0 }}>{dirty && canEdit ? cancelLabel() : closeLabel()}</Button>
				{canEdit && <Button onClick={save} disabled={!canSave} sx={{ ...orangeButtonSx, flexShrink: 0, ...(justSaved ? savedButtonSx : {}) }}>{justSaved ? <SavedTick label={copy.saved} /> : isNew ? copy.create : copy.save}</Button>}
			</Box>
		</Box>
	);

	return <>
		<Box ref={listRef} component='section' aria-labelledby='mgmt-section-title' sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
			<Box sx={{ display: 'flex', alignItems: { xs: 'center', sm: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
				<Box sx={{ flexGrow: 1, minWidth: 0 }}>
					<Typography id='mgmt-section-title' component='h2' sx={{ m: 0, fontSize: { xs: 24, md: 28 }, lineHeight: { xs: '32px', md: '36px' }, fontWeight: 700, color: ui.orangeText }}>
						{rolesLabel()}
					</Typography>
					<Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 15, lineHeight: '22px', color: ui.muted }}>{copy.subtitle}</Typography>
				</Box>
				{canEdit && (
					<ButtonBase
						onClick={() => openNew()}
						sx={{ height: 44, gap: 1, pl: 1.75, pr: 2.5, bgcolor: ui.orange, color: ui.navy, fontSize: 15, fontWeight: 600, '&:hover': { bgcolor: ui.orangeHover }, '&.Mui-focusVisible': focusRing }}
					>
						<AddOutlinedIcon sx={{ fontSize: 20 }} />
						{copy.addRole}
					</ButtonBase>
				)}
			</Box>

			<Box sx={{ p: { xs: 0, sm: 1.5 }, bgcolor: { xs: 'transparent', sm: '#fff' }, border: { xs: 0, sm: `1px solid ${ui.line}` }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
				<TextField
					value={search}
					onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }}
					placeholder={phone ? copy.searchShort : copy.search}
					size={phone ? 'medium' : 'small'}
					sx={{ width: { xs: '100%', sm: 240, xl: 300 } }}
					slotProps={{
						htmlInput: { 'aria-label': copy.searchShort, type: 'search' },
						input: { startAdornment: <InputAdornment position='start'><SearchOutlinedIcon sx={{ color: ui.muted }} /></InputAdornment>, sx: squareInput },
					}}
				/>
				{segmented<UsageFilter>(copy.usage, usage, [
					[ 'all', `${copy.all} ${counts.all}` ],
					[ 'used', `${copy.inUse} ${counts.used}` ],
					[ 'unused', `${copy.notUsed} ${counts.unused}` ],
				], (k) => { setUsage(k); setLimit(PAGE); }, true)}
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
						sx={{ flex: { xs: 1, sm: 'none' }, minWidth: 140 }}
					>
						<MenuItem value='name-asc'>{copy.sortNameAsc}</MenuItem>
						<MenuItem value='name-desc'>{copy.sortNameDesc}</MenuItem>
						<MenuItem value='most'>{copy.sortMost}</MenuItem>
						<MenuItem value='newest'>{copy.sortNewest}</MenuItem>
						<MenuItem value='oldest'>{copy.sortOldest}</MenuItem>
					</TextField>
					{!phone && segmented<ViewKey>(copy.view, view, [
						[ 'cards', <><GridViewOutlinedIcon sx={{ fontSize: 18 }} />{copy.cards}</> ],
						[ 'compare', <><TableChartOutlinedIcon sx={{ fontSize: 18 }} />{copy.compare}</> ],
					], pickView)}
				</Box>
			</Box>

			{results}
			{!compareMode && visible.length > 0 && (
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', fontSize: 13, color: ui.muted }}>
					<span>{copy.showing(shown.length, visible.length)}</span>
					{visible.length > limit && (
						<Button variant='outlined' onClick={() => setLimit((n) => n + PAGE)} sx={{ borderRadius: 0, height: 44, px: 3 }}>{copy.showMore}</Button>
					)}
				</Box>
			)}
		</Box>

		<Dialog
			open={showModal}
			onClose={closeModal}
			fullScreen={phone}
			fullWidth
			maxWidth={false}
			slots={{ transition: SlideDown }}
			transitionDuration={reduceMotion ? 0 : modalDuration}
			slotProps={{
				transition: { easing: modalEasing },
				paper: { 'aria-labelledby': panelTitleId, sx: { width: phone ? '100%' : 880, maxWidth: '100%', m: phone ? 0 : 2, height: phone ? '100%' : 'min(820px, calc(100% - 32px))', maxHeight: phone ? '100%' : 'calc(100% - 32px)', borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } },
			}}
		>
			{modal}
		</Dialog>
	</>;
};

export default RoleTable;
