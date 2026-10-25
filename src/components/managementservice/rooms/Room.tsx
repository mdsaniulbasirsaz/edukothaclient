import { SyntheticEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Box, Button, ButtonBase, Drawer, IconButton, InputAdornment, MenuItem, Skeleton, Switch, TextField, Autocomplete, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Roles, Room, RoomOwners, Tenant, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createRoomWithParams, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import RoomOwnerTable from './RoomOwner';
import RoomUserRoleTable from './roomUserRole';
import MeetingsTable from '../meetings/Meetings';
import { switchSx } from '../tenants/tenantShared';
import { CountUp, fadeInSx, glowSx, rowGlowSx, leaveMs, leaveSx, liftOn, liftTransition, prefersLessMotion, rowFlashSx, staggerSx, useFlip, useIntro } from '../motion';
import { applyLabel, breakoutsEnabledLabel, cancelLabel, chatEnabledLabel, closeLabel, endToEndEncryptionLabel, endToEndEncryptionTooltipLabel, meetingsOnlyLabel, meetingsOnlyTooltipLabel, defaultRoleLabel, deleteLabel, descLabel, filesharingEnabledLabel, hiddenEmailLabel, localRecordingEnabledLabel, lockRoomLabel, logoLabel, maxActiveVideosLabel, nameLabel, raiseHandEnabledLabel, reactionsEnabledLabel, roomBgLabel, roomsLabel, tenantLabel, undefinedLabel } from '../../translated/translatedComponents';

// Rooms screen (user brief 2026-10-13, canvas option B + C's side panel):
// square room cards (picture, status, orange name, description, tenant and
// role, feature tags, owners) with search, status, tenant and sort; editing
// happens in a side panel instead of a dialog; phones get a compact card
// list. Desktop can switch to a sortable table (2026-10-18) that shares the
// same filters and opens the same side panel. Colours follow the admin console (Management.tsx).
const ui = {
	navy: '#042c6a',
	blue: '#1a81ec',
	blueDark: '#1668c4',
	blueLight: '#e8f2fd',
	orange: '#fe9b2a',
	orangeLight: '#fff3e5',
	orangeText: '#c96a00',
	text: '#0f1f3a',
	muted: '#5b6b82',
	line: '#d6e2f2',
	lineSoft: '#e2e8f0',
	grey: '#f1f5f9',
	green: '#177a45',
	greenDot: '#1f9d55',
	slate: '#475569',
	slateDot: '#7d8ea8',
	error: '#d6333a',
} as const;

const copy = {
	subtitle: 'Create rooms and set owners, roles and features.',
	addRoom: 'Add room',
	newRoom: 'New room',
	all: 'All',
	open: 'Open',
	locked: 'Locked',
	status: 'Status',
	features: 'Features',
	general: 'General',
	search: 'Search rooms',
	showMore: 'Show more',
	allTenants: 'All tenants',
	sort: 'Sort',
	sortNameAsc: 'Name A–Z',
	sortNameDesc: 'Name Z–A',
	sortNewest: 'Newest first',
	sortOldest: 'Oldest first',
	noRooms: 'No rooms found',
	noRoomsHint: 'Try another search, or clear the filters.',
	noRoomsYet: 'No rooms yet',
	noRoomsYetHint: 'Add a room to get started.',
	clearFilters: 'Clear filters',
	view: 'View',
	cards: 'Cards',
	table: 'Table',
	name: 'Name',
	role: 'Default role',
	videos: 'Max videos',
	owners: 'Owners',
	created: 'Created',
	roomPicture: 'images/mgmt/room.png',
} as const;

// Short names for the feature tags; the side panel uses the full labels.
const featureTags: Array<{ key: keyof Room; label: string }> = [
	{ key: 'chatEnabled', label: 'Chat' },
	{ key: 'raiseHandEnabled', label: 'Raise hand' },
	{ key: 'reactionsEnabled', label: 'Reactions' },
	{ key: 'filesharingEnabled', label: 'File sharing' },
	{ key: 'localRecordingEnabled', label: 'Recording' },
	{ key: 'breakoutsEnabled', label: 'Breakout rooms' },
	{ key: 'endToEndEncryption', label: 'E2EE' },
	{ key: 'meetingsOnly', label: 'Meetings only' },
];
const enabledFeatures = (r: Room) => featureTags.filter((f) => r[f.key] === true).map((f) => f.label);

type StatusFilter = 'all' | 'open' | 'locked';
type SortKey = 'name-asc' | 'name-desc' | 'newest' | 'oldest';
const PAGE = 24;

type ViewKey = 'cards' | 'table';
type ColKey = 'name' | 'tenant' | 'status' | 'role' | 'videos' | 'created';
const VIEW_KEY = 'mgmt-rooms-view';
const createdOf = (r: Room) => Number(r.createdAt ?? 0) || Number(r.id ?? 0);
const formatDate = (r: Room) => {
	const t = Number(r.createdAt ?? 0);

	return t ? new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
};

const initialsOf = (email: string) => {
	const parts = email.replace(/@.*/, '')
		.split(/[\s._-]+/)
		.filter(Boolean);

	return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
};

const tagSx = { display: 'inline-block', fontSize: 12, lineHeight: '16px', color: ui.blueDark, bgcolor: ui.blueLight, px: '7px', py: '3px', whiteSpace: 'nowrap' } as const;
const moreTagSx = { ...tagSx, fontWeight: 600, color: ui.slate, bgcolor: ui.grey } as const;
const sectionLabelSx = { m: 0, fontSize: 12, lineHeight: '16px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: ui.slate } as const;

// The Open/Locked badge fades to its new text when a room is locked or
// unlocked (2026-10-18); it does not animate on first show.
const StatusText = ({ locked }: { locked: boolean }) => {
	const last = useRef(locked);
	const changes = useRef(0);

	if (last.current !== locked) {
		last.current = locked;
		changes.current += 1;
	}

	return (
		<Box component='span' key={changes.current} sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 13, fontWeight: 600, color: locked ? ui.slate : ui.green, whiteSpace: 'nowrap', ...(changes.current ? fadeInSx : {}) }}>
			<Box component='span' aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: locked ? ui.slateDot : ui.greenDot }} />
			{locked ? copy.locked : copy.open}
		</Box>
	);
};

const FeatureTags = ({ room, max = 3, wrap = true }: { room: Room; max?: number; wrap?: boolean }) => {
	const list = enabledFeatures(room);

	return (
		<Box sx={{ display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', gap: '4px' }}>
			{list.slice(0, max).map((t) => <Box component='span' key={t} sx={tagSx}>{t}</Box>)}
			{list.length > max && <Box component='span' sx={moreTagSx}>+{list.length - max}</Box>}
		</Box>
	);
};

export interface RoomProp {
	roomId: number;
}

const RoomTable = () => {
	const dispatch = useAppDispatch();

	type TenantOptionTypes = Array<Tenant>

	const [ tenants, setTenants ] = useState<TenantOptionTypes>([ { 'id': 0, 'name': '', 'description': '' } ]);

	type RoleTypes = Array<Roles>

	const [ roles, setRoles ] = useState<RoleTypes>([ { 'description': 'Test', 'id': 1, 'name': 'Test', 'tenantId': 1, 'permissions': [] } ]);

	const getTenantName = (id: string): string => {
		const t = tenants.find((type) => type.id == parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return `${tenantLabel()} - ${undefinedLabel()}`;
		}
	};

	const getRoleName = (id: string): string => {
		const t = roles.find((type) => type.id == parseInt(id));

		if (t && t.name) {
			return t.name;
		} else {
			return '-';
		}
	};

	type UserTypes = Array<User>

	const [ users, setUsers ] = useState<UserTypes>([ {
		'id': 0,
		'ssoId': '',
		'tenantId': 0,
		'email': '',
		'name': '',
		'avatar': '',
		'roles': [],
		'tenantAdmin': false,
		'tenantOwner': false
	} ]);

	const getUserEmail = (id: number): string => {
		const t = users.find((type) => type.id == id);

		if (t && t.email) {
			return t.email;
		} else {
			return `${id} - ${hiddenEmailLabel()}`;
		}
	};

	const [ data, setData ] = useState<Room[]>([]);
	// After a save the changed room glows; a new room scrolls into view; a
	// deleted one fades out first (2026-10-18).
	const [ changed, setChanged ] = useState<{ id: number; n: number } | null>(null);
	const [ leavingId, setLeavingId ] = useState<number | null>(null);
	const expectNew = useRef<Set<number | undefined> | null>(null);
	const showChanged = (roomId: number) => setChanged({ id: roomId, n: Date.now() });

	useEffect(() => {
		setLeavingId(null);
		if (!expectNew.current) return;
		const before = expectNew.current;
		const added = data.find((r) => !before.has(r.id));

		expectNew.current = null;
		if (added?.id !== undefined) showChanged(added.id);
	}, [ data ]);
	useEffect(() => {
		if (!changed) return;
		const t = window.setTimeout(() => setChanged(null), 1300);

		return () => window.clearTimeout(t);
	}, [ changed ]);

	// MRT caches accessorFn results per row and only rebuilds its rows when the
	// data array identity changes. The rows and the lookups above are fetched
	// concurrently, so hand it a fresh array when a lookup resolves after the
	// rows, otherwise the resolved names stay stuck on their placeholder.
	const tableData = useMemo(() => [ ...(data ?? []) ], [ data, tenants, roles, users ]);
	// True once the rooms request has answered, so a slow list never shows
	// the empty state (or its Add room button) for a moment.
	const [ roomsLoaded, setRoomsLoaded ] = useState(false);
	const [ id, setId ] = useState(0);
	const [ name, setName ] = useState('');
	const [ nameDisabled, setNameDisabled ] = useState(false);
	const [ description, setDescription ] = useState('');
	const [ tenantId, setTenantId ] = useState(0);
	const [ defaultRoleId, setDefaultRoletId ] = useState(0);

	const [ breakoutsEnabled, setBreakoutsEnabled ] = useState(false);

	const [ logo, setLogo ] = useState('');
	const [ background, setBackground ] = useState('');
	const [ maxActiveVideos, setMaxActiveVideos ] = useState(0);
	const [ locked, setLocked ] = useState(false);
	const [ chatEnabled, setChatEnabled ] = useState(false);
	const [ endToEndEncryption, setEndToEndEncryption ] = useState(false);
	// Tenant defaults, used to tell when E2EE is locked (mandated) for the selected tenant.
	const [ defaults, setDefaults ] = useState<Array<{ tenantId: number | string; endToEndEncryption?: boolean; endToEndEncryptionLock?: boolean }>>([]);
	const [ raiseHandEnabled, setRaiseHandEnabled ] = useState(false);
	const [ reactionsEnabled, setReactionsEnabled ] = useState(false);
	const [ filesharingEnabled, setFilesharingEnabled ] = useState(false);
	const [ localRecordingEnabled, setLocalRecordingEnabled ] = useState(false);
	const [ meetingsOnly, setMeetingsOnly ] = useState(false);

	const [ tenantIdOption, setTenantIdOption ] = useState<Tenant | undefined>();
	
	const [ defaultRoleIdOption, setDefaultRoleIdOption ] = useState<Roles | undefined>();

	const [ cantPatch ] = useState(false);
	const [ cantDelete ] = useState(false);

	// Gates the room-bound Meetings table the same way the left-menu Meetings entry is
	// gated (Management.tsx): a meeting only exists to drive an email invite, so it's
	// pointless when the tenant has no enabled invite config. Any authenticated user can
	// READ tenantInviteConfigs (find/get are open, scoped to the user's own tenant by the
	// query resolver; only writes are admin-gated), so this resolves correctly for room
	// owners too. Default hidden so a disabled tenant never flashes the table.
	const [ invitesEnabled, setInvitesEnabled ] = useState(false);

	async function fetchProduct() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('users')).then((tdata: any) => {
			if (tdata != undefined) {
				setUsers(tdata.data);
			}

		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenants')).then((tdata: any) => {
			if (tdata != undefined) {
				setTenants(tdata.data);
			}
    
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('roles')).then((tdata: any) => {
			if (tdata != undefined) {
				setRoles(tdata.data);
			}
    
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('rooms')).then((tdata: any) => {
			if (tdata != undefined) {
				setData(tdata.data);
			}
			setRoomsLoaded(true);

		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('defaults')).then((tdata: any) => {
			if (tdata != undefined) {
				setDefaults(tdata.data);
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getData('tenantInviteConfigs')).then((tdata: any) => {
			const list = tdata?.data;

			setInvitesEnabled(Array.isArray(list) && list.some((c: { enabled?: boolean }) => c.enabled));
		})
			.catch(() => setInvitesEnabled(false));
	}

	useEffect(() => {
		// By moving this function inside the effect, we can clearly see the values it uses.
		fetchProduct();
	}, []);

	const [ open, setOpen ] = React.useState(false);

	const handleClickOpen = () => {
		setId(0);
		setNameDisabled(false);
		setName('');
		setDescription('');

		// tenant selectable on add
		if (tenants.length > 0) {
			// always align with what Autocomplete shows: first tenant
			const firstTenant = tenants[0];
			const firstTenantId = Number(firstTenant.id);

			setTenantId(firstTenantId);
			setTenantIdOption(firstTenant);
		} else {
			setTenantId(0);
			setTenantIdOption(undefined);
		}

		setDefaultRoletId(0);
		setDefaultRoleIdOption(undefined);
		setLogo('');
		setBackground('');
		setMaxActiveVideos(12);
		setLocked(true);
		setChatEnabled(true);
		setRaiseHandEnabled(true);
		setReactionsEnabled(true);
		setFilesharingEnabled(true);
		setLocalRecordingEnabled(true);
		setBreakoutsEnabled(true);
		setEndToEndEncryption(false); // E2EE off by default for new rooms
		setMeetingsOnly(false);

		setOpen(true);
	};

	// The Overview's "New room" button lands here with ?new=1: open the add
	// panel once the tenants are in (it picks the first), then drop the flag.
	const [ searchParams, setSearchParams ] = useSearchParams();

	useEffect(() => {
		if (searchParams.get('new') !== '1' || !tenants.length || !tenants[0].id) return;
		handleClickOpen();
		const next = new URLSearchParams(searchParams);

		next.delete('new');
		setSearchParams(next, { replace: true });
	}, [ tenants, searchParams ]);

	const handleClickOpenNoreset = () => {
		setNameDisabled(true);
		setOpen(true);
	};

	const handleNameChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setName(event.target.value);
	};
	const handleDescriptionChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setDescription(event.target.value);
	};

	const handleTenantIdChange = (event: SyntheticEvent<Element, Event>, newValue: Tenant) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setTenantId(parseInt(newValue.id as unknown as string));
			} else {
				setTenantId(newValue.id);
			}
			setTenantIdOption(newValue);
		}
	};

	const handleDefaultRoleIdChange = (event: SyntheticEvent<Element, Event>, newValue: Roles) => {
		if (newValue) {
			if (typeof newValue.id != 'number') {
				setDefaultRoletId(parseInt(newValue.id));
			} else {
				setDefaultRoletId(newValue.id);
			}
			setDefaultRoleIdOption(newValue);
		}
	};

	const handleLogoChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setLogo(event.target.value);
	};
	const handleBackgroundChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setBackground(event.target.value);
	};
	const handleMaxActiveVideosChange = (event: { target: { value: string; }; }) => {
		setMaxActiveVideos(parseInt(event.target.value));
	};
	const handleLockedChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setLocked(event.target.checked);
	};
	const handleChatEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setChatEnabled(event.target.checked);
	};
	const handleEndToEndEncryptionChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setEndToEndEncryption(event.target.checked);
	};
	const handleMeetingsOnlyChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setMeetingsOnly(event.target.checked);
	};
	// When the selected tenant's default has E2EE locked, the room server forces the tenant value and
	// ignores any per-room value, so the per-room toggle is disabled (mandated) for everyone — a
	// super-admin changes the policy via the tenant default. (String compare: tenantId may be a bigint string.)
	const tenantE2eeDefault = defaults.find((d) => String(d.tenantId) === String(tenantId));
	const e2eeLocked = Boolean(tenantE2eeDefault?.endToEndEncryptionLock);
	const e2eeForcedValue = Boolean(tenantE2eeDefault?.endToEndEncryption);
	const handleRaiseHandEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setRaiseHandEnabled(event.target.checked);
	};
	const handleReactionsEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setReactionsEnabled(event.target.checked);
	};
	const handleFilesharingEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setFilesharingEnabled(event.target.checked);
	};
	const handleLocalRecordingEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setLocalRecordingEnabled(event.target.checked);
	};
	const handleBreakoutsEnabledChange = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => {
		setBreakoutsEnabled(event.target.checked);
	};
	const handleClose = () => {
		setOpen(false);
	};

	const delTenant = async () => {

		// add new data / mod data / error
		// eslint-disable-next-line no-alert
		if (id != 0 && confirm('Are you sure?')) {
			const gone = id;

			dispatch(deleteData(id, 'rooms')).then(() => {
				setOpen(false);
				// The card fades away, then the list closes the gap (2026-10-18).
				setLeavingId(gone);
				window.setTimeout(() => fetchProduct(), prefersLessMotion() ? 0 : leaveMs + 300);
			});
		}
	};

	const addTenant = async () => {

		// add new data / mod data / error
		if (name != '' && id == 0) {
			dispatch(createRoomWithParams({ 
				tenantId: tenantId,
				name: name,
				description: description,
				logo: logo,
				background: background,
				maxActiveVideos: maxActiveVideos,
				locked: locked,
				chatEnabled: chatEnabled,
				raiseHandEnabled: raiseHandEnabled,
				reactionsEnabled: reactionsEnabled,
				filesharingEnabled: filesharingEnabled,
				localRecordingEnabled: localRecordingEnabled,
				breakoutsEnabled: breakoutsEnabled,
				endToEndEncryption: endToEndEncryption,
				meetingsOnly: meetingsOnly
			})).then(() => {
				expectNew.current = new Set(data.map((r) => r.id));
				fetchProduct();
				setOpen(false);
			});

		} else if (name != '' && id != 0) {
			const obj : Room= {
				// tenantId: tenantId,
				description: description,
				logo: logo,
				background: background,
				maxActiveVideos: maxActiveVideos,
				locked: locked,
				chatEnabled: chatEnabled,
				raiseHandEnabled: raiseHandEnabled,
				reactionsEnabled: reactionsEnabled,
				filesharingEnabled: filesharingEnabled,
				localRecordingEnabled: localRecordingEnabled,
				breakoutsEnabled: breakoutsEnabled,
				endToEndEncryption: endToEndEncryption,
				meetingsOnly: meetingsOnly,
			};
			
			if (defaultRoleId) {
				obj.defaultRoleId=defaultRoleId;
			}
			const edited = id;

			dispatch(patchData(id, obj, 'rooms')).then(() => {
				fetchProduct();
				setOpen(false);
				showChanged(edited);
			});
		}

	};

	// Fills the side panel from a row. Reads row.original, so it no longer
	// depends on the column order.
	const openRoom = (room: Room) => {
		const asNumber = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v) : 0);
		const roleId = asNumber(room.defaultRoleId);
		const tId = asNumber(room.tenantId);

		setId(asNumber(room.id));
		setName(room.name ?? '');
		setDescription(room.description ?? '');
		setDefaultRoletId(roleId);
		setDefaultRoleIdOption(roles.find((x) => x.id == roleId));
		setTenantId(tId);
		const ttenant = tenants.find((x) => x.id == tId);

		if (ttenant) setTenantIdOption(ttenant);
		else if (!tId) setTenantIdOption(undefined);
		setLogo(typeof room.logo === 'string' ? room.logo : '');
		setBackground(typeof room.background === 'string' ? room.background : '');
		setMaxActiveVideos(typeof room.maxActiveVideos === 'number' ? room.maxActiveVideos : 0);
		setLocked(room.locked === true);
		setChatEnabled(room.chatEnabled === true);
		setRaiseHandEnabled(room.raiseHandEnabled === true);
		setReactionsEnabled(room.reactionsEnabled === true);
		setFilesharingEnabled(room.filesharingEnabled === true);
		setLocalRecordingEnabled(room.localRecordingEnabled === true);
		setBreakoutsEnabled(room.breakoutsEnabled === true);
		setEndToEndEncryption(room.endToEndEncryption === true);
		setMeetingsOnly(Boolean(room.meetingsOnly));

		handleClickOpenNoreset();
	};

	const phone = useMediaQuery('(max-width: 599.95px)');
	const [ statusFilter, setStatusFilter ] = useState<StatusFilter>('all');
	const [ search, setSearch ] = useState('');
	const [ tenantFilter, setTenantFilter ] = useState('all');
	const [ sortKey, setSortKey ] = useState<SortKey>('name-asc');
	const [ limit, setLimit ] = useState(PAGE);
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
	const counts = {
		all: tableData.length,
		open: tableData.filter((r) => !r.locked).length,
		locked: tableData.filter((r) => r.locked).length,
	};
	const filteredData = useMemo(
		() => (statusFilter === 'all' ? tableData : tableData.filter((r) => (statusFilter === 'locked') === Boolean(r.locked))),
		[ tableData, statusFilter ]
	);
	const visibleRooms = useMemo(() => {
		const q = search.trim().toLowerCase();
		const list = filteredData
			.filter((r) => tenantFilter === 'all' || String(r.tenantId) === tenantFilter)
			.filter((r) => !q || `${r.name ?? ''} ${r.description ?? ''}`.toLowerCase().includes(q));

		return [ ...list ].sort((a, b) => {
			if (sortKey === 'newest') return createdOf(b) - createdOf(a);
			if (sortKey === 'oldest') return createdOf(a) - createdOf(b);
			const byName = (a.name ?? '').localeCompare(b.name ?? '');

			return sortKey === 'name-desc' ? -byName : byName;
		});
	}, [ filteredData, search, tenantFilter, sortKey ]);
	const roleOf = (r: Room) => {
		const role = getRoleName(String(r.defaultRoleId ?? ''));

		return role !== '-' ? role : '';
	};
	const ownerEmails = (r: Room) => (r.owners ?? []).map((o: RoomOwners) => getUserEmail(o.userId));
	const shownRooms = useMemo(() => {
		if (!tableMode) return visibleRooms;
		const { col, dir } = colSort;
		const text = (r: Room) => {
			if (col === 'tenant') return getTenantName(String(r.tenantId ?? ''));
			if (col === 'role') return roleOf(r);

			return r.name ?? '';
		};

		return [ ...visibleRooms ].sort((a, b) => {
			if (col === 'status') return dir * (Number(Boolean(a.locked)) - Number(Boolean(b.locked)));
			if (col === 'videos') return dir * ((a.maxActiveVideos ?? 0) - (b.maxActiveVideos ?? 0));
			if (col === 'created') return dir * (createdOf(a) - createdOf(b));

			return dir * text(a).localeCompare(text(b));
		});
	}, [ visibleRooms, tableMode, colSort, tenants, roles ]);
	const sortBy = (col: ColKey) => setColSort((s) => ({ col, dir: s.col === col ? (s.dir === 1 ? -1 : 1) : 1 }));

	// Motion (2026-10-18): cards rise in on first show, and cards or rows
	// slide to their new places when a filter or sort changes.
	const intro = useIntro(visibleRooms.length > 0);
	const listRef = useRef<HTMLDivElement>(null);
	const reduceMotionPref = useMediaQuery('(prefers-reduced-motion: reduce)');
	const [ flipped, setFlipped ] = useState<{ label: string; n: number } | null>(null);
	const filtersOn = statusFilter !== 'all' || tenantFilter !== 'all' || search.trim() !== '';
	const clearFilters = () => {
		setStatusFilter('all');
		setTenantFilter('all');
		setSearch('');
		setLimit(PAGE);
	};

	// The sliding pill under All / Open / Locked follows the chosen button,
	// also while its count ticks and the button changes width.
	const pillGroupRef = useRef<HTMLDivElement>(null);
	const [ pill, setPill ] = useState({ left: 0, width: 0, ready: false });

	useLayoutEffect(() => {
		const group = pillGroupRef.current;

		if (!group) return;
		const measure = () => {
			const b = group.querySelector<HTMLElement>(`[data-status="${statusFilter}"]`);

			if (b) setPill((p) => (p.left === b.offsetLeft && p.width === b.offsetWidth ? p : { left: b.offsetLeft, width: b.offsetWidth, ready: p.width > 0 }));
		};

		measure();
		if (typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(measure);

		group.querySelectorAll('[data-status]').forEach((b) => ro.observe(b));

		return () => ro.disconnect();
	}, [ statusFilter, phone ]);

	// A new room that is past "Show more" is brought into the list, and the
	// glowing room scrolls into view.
	useEffect(() => {
		if (!changed) return;
		const at = visibleRooms.findIndex((r) => r.id === changed.id);

		if (at >= limit) setLimit(Math.ceil((at + 1) / PAGE) * PAGE);
	}, [ changed ]);
	// Scroll once the side panel has slid away and the list has grown.
	useEffect(() => {
		if (!changed) return;
		const t = window.setTimeout(() => {
			listRef.current?.querySelector(`[data-flip="${tableMode ? 't' : 'c'}${changed.id}"]`)
				?.scrollIntoView({ block: 'nearest', behavior: prefersLessMotion() ? 'auto' : 'smooth' });
		}, prefersLessMotion() ? 0 : 320);

		return () => window.clearTimeout(t);
	}, [ changed, limit ]);
	const markSx = (roomId: number | undefined, row = false) => (roomId === leavingId ? leaveSx : changed && roomId === changed.id ? (row ? rowGlowSx : glowSx) : {});

	useFlip(listRef, `${tableMode ? 't' : 'c'}:${shownRooms.slice(0, limit).map((r) => r.id)
		.join(',')}`);

	const viewToggle = (
		<Box role='group' aria-label={copy.view} sx={{ display: 'flex', flexShrink: 0, border: `1px solid ${ui.line}`, bgcolor: '#fff' }}>
			{([ [ 'cards', <GridViewOutlinedIcon key='c' sx={{ fontSize: 20 }} />, copy.cards ], [ 'table', <TableRowsOutlinedIcon key='t' sx={{ fontSize: 20 }} />, copy.table ] ] as Array<[ViewKey, React.ReactNode, string]>).map(([ key, icon, label ], i) => {
				const on = view === key;

				return (
					<Tooltip key={key} title={label}>
						<ButtonBase
							aria-pressed={on}
							aria-label={label}
							onClick={() => pickView(key)}
							sx={{
								height: 38,
								px: 1.5,
								borderLeft: i ? `1px solid ${ui.line}` : 0,
								bgcolor: on ? ui.navy : '#fff',
								color: on ? '#fff' : '#334155',
								'&:hover': { bgcolor: on ? ui.navy : ui.grey },
								'&.Mui-focusVisible': { outline: `2px solid ${ui.blue}`, outlineOffset: 2 },
							}}
						>
							{icon}
						</ButtonBase>
					</Tooltip>
				);
			})}
		</Box>
	);

	const thSx = { ...sectionLabelSx, height: 40, px: 1.5, textAlign: 'left', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderBottom: `1px solid ${ui.line}`, position: 'sticky', top: 0, zIndex: 1 } as const;
	const tdSx = { px: 1.5, py: 1, fontSize: 14, lineHeight: '20px', color: '#334155', borderBottom: `1px solid ${ui.lineSoft}`, verticalAlign: 'middle', whiteSpace: 'nowrap' } as const;
	const header = (col: ColKey | null, label: string, width?: number | string) => {
		const on = col !== null && colSort.col === col;

		return (
			<Box component='th' scope='col' aria-sort={on ? (colSort.dir === 1 ? 'ascending' : 'descending') : undefined} sx={{ ...thSx, width }}>
				{col ? (
					<ButtonBase
						onClick={() => sortBy(col)}
						sx={{ font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', color: on ? ui.navy : 'inherit', gap: '4px', height: 28, '&.Mui-focusVisible': { outline: `2px solid ${ui.blue}`, outlineOffset: 2 } }}
					>
						{label}
						{on ? (colSort.dir === 1 ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : <ArrowUpwardIcon sx={{ fontSize: 14, opacity: 0 }} />}
					</ButtonBase>
				) : label}
			</Box>
		);
	};

	const roomTable = (
		<Box sx={{ bgcolor: '#fff', border: `1px solid ${ui.line}`, overflowX: 'auto' }}>
			<Box component='table' aria-label={roomsLabel()} sx={{ width: '100%', minWidth: 980, borderCollapse: 'separate', borderSpacing: 0 }}>
				<thead>
					<tr>
						{header('name', copy.name)}
						{tenants.length > 1 && header('tenant', tenantLabel(), 150)}
						{header('status', copy.status, 100)}
						{header('role', copy.role, 140)}
						{header('videos', copy.videos, 110)}
						{header(null, copy.features, 230)}
						{header(null, copy.owners, 120)}
						{header('created', copy.created, 120)}
					</tr>
				</thead>
				<tbody>
					{shownRooms.slice(0, limit).map((r) => {
						const owners = ownerEmails(r);

						return (
							<Box
								component='tr'
								key={r.id}
								data-flip={`t${r.id}`}
								onClick={() => openRoom(r)}
								sx={{ cursor: 'pointer', '&:hover td': { bgcolor: ui.orangeLight }, '&:last-of-type td': { borderBottom: 0 }, ...markSx(r.id, true) }}
							>
								<Box component='td' sx={{ ...tdSx, maxWidth: 280 }}>
									<ButtonBase
										onClick={(e) => { e.stopPropagation(); openRoom(r); }}
										sx={{ display: 'block', maxWidth: '100%', textAlign: 'left', fontSize: 15, fontWeight: 700, color: ui.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', '&.Mui-focusVisible': { outline: `2px solid ${ui.blue}`, outlineOffset: 2 } }}
									>
										{r.name}
									</ButtonBase>
									{r.description && <Box sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</Box>}
								</Box>
								{tenants.length > 1 && <Box component='td' sx={{ ...tdSx, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTenantName(String(r.tenantId ?? ''))}</Box>}
								<Box component='td' sx={tdSx}><StatusText locked={Boolean(r.locked)} /></Box>
								<Box component='td' sx={tdSx}>{roleOf(r) || '—'}</Box>
								<Box component='td' sx={{ ...tdSx, fontVariantNumeric: 'tabular-nums' }}>{r.maxActiveVideos ?? 0}</Box>
								<Box component='td' sx={tdSx}><FeatureTags room={r} max={2} wrap={false} /></Box>
								<Box component='td' sx={tdSx}>
									<Box sx={{ display: 'flex', alignItems: 'center' }} title={owners.join(', ')}>
										{owners.slice(0, 3).map((e, i) => (
											<Avatar key={`${e}-${i}`} sx={{ width: 26, height: 26, mr: '-6px', border: '2px solid #fff', bgcolor: ui.navy, fontSize: 10, fontWeight: 600 }}>{initialsOf(e)}</Avatar>
										))}
										{owners.length > 3 && <Box component='span' sx={{ ml: 1.25, fontSize: 12, fontWeight: 600, color: ui.slate }}>+{owners.length - 3}</Box>}
										{owners.length === 0 && '—'}
									</Box>
								</Box>
								<Box component='td' sx={tdSx}>{formatDate(r)}</Box>
							</Box>
						);
					})}
				</tbody>
			</Box>
		</Box>
	);

	// All / Open / Locked: a navy pill slides to the chosen option and the
	// counts tick to new values (2026-10-18).
	const statusGroup = (
		<Box ref={pillGroupRef} role='group' aria-label={copy.status} sx={{ position: 'relative', display: 'flex', flexShrink: 0, border: `1px solid ${ui.line}`, bgcolor: '#fff', width: { xs: '100%', sm: 'auto' } }}>
			<Box aria-hidden sx={{ position: 'absolute', top: 0, bottom: 0, left: pill.left, width: pill.width, bgcolor: ui.navy, opacity: pill.width ? 1 : 0, transition: pill.ready ? 'left 220ms cubic-bezier(0.2, 0, 0, 1), width 220ms cubic-bezier(0.2, 0, 0, 1)' : 'none', '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }} />
			{([ [ 'all', copy.all ], [ 'open', copy.open ], [ 'locked', copy.locked ] ] as Array<[StatusFilter, string]>).map(([ key, label ], i) => {
				const on = statusFilter === key;

				return (
					<ButtonBase
						key={key}
						data-status={key}
						aria-pressed={on}
						onClick={() => setStatusFilter(key)}
						sx={{
							position: 'relative',
							flex: { xs: 1, sm: 'none' },
							height: { xs: 42, sm: 38 },
							px: 2,
							gap: '0.3em',
							borderLeft: i ? `1px solid ${ui.line}` : 0,
							bgcolor: 'transparent',
							color: on ? '#fff' : '#334155',
							fontSize: 14,
							fontWeight: on ? 600 : 400,
							fontVariantNumeric: 'tabular-nums',
							transition: 'color 150ms ease',
							'&:hover': { bgcolor: on ? 'transparent' : ui.grey },
							'&.Mui-focusVisible': { outline: `2px solid ${ui.blue}`, outlineOffset: 2 },
						}}
					>
						{label} <CountUp value={counts[key]} duration={500} />
					</ButtonBase>
				);
			})}
		</Box>
	);

	const switchRow = (label: string, checked: boolean, onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void, opts: { disabled?: boolean; tip?: string } = {}) => {
		const flashing = flipped?.label === label;
		const row = (
			<Box component='label' key={flashing ? flipped.n : undefined} sx={{ minHeight: 48, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${ui.grey}`, cursor: opts.disabled ? 'default' : 'pointer', ...(flashing ? rowFlashSx : {}) }}>
				<Box component='span' sx={{ flexGrow: 1, fontSize: 14, color: opts.disabled ? ui.muted : ui.text }}>{label}</Box>
				<Switch checked={checked} onChange={onChange && ((e) => { onChange(e); setFlipped({ label, n: Date.now() }); })} disabled={opts.disabled} sx={switchSx} />
			</Box>
		);

		return opts.tip ? <Tooltip title={opts.tip} placement='top-start'>{row}</Tooltip> : row;
	};

	const panelTitleId = 'room-panel-title';
	const editing = id !== 0;
	const tenantName = editing ? getTenantName(String(tenantId)) : '';

	return <>
		<Box ref={listRef} component='section' aria-labelledby='mgmt-section-title' sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
			<Box sx={{ display: 'flex', alignItems: { xs: 'center', sm: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
				<Box sx={{ flexGrow: 1, minWidth: 0 }}>
					<Typography id='mgmt-section-title' component='h2' sx={{ m: 0, fontSize: { xs: 24, md: 28 }, lineHeight: { xs: '32px', md: '36px' }, fontWeight: 700, color: ui.orangeText }}>
						{roomsLabel()}
					</Typography>
					<Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 15, lineHeight: '22px', color: ui.muted }}>{copy.subtitle}</Typography>
				</Box>
				<ButtonBase
					onClick={() => handleClickOpen()}
					sx={{ height: 44, gap: 1, pl: 1.75, pr: 2.5, bgcolor: ui.orange, color: ui.navy, fontSize: 15, fontWeight: 600, '&:hover': { bgcolor: '#e8851a' }, '&.Mui-focusVisible': { outline: `2px solid ${ui.blue}`, outlineOffset: 2 } }}
				>
					<AddOutlinedIcon sx={{ fontSize: 20 }} />
					{copy.addRoom}
				</ButtonBase>
			</Box>

			<Box sx={{ p: { xs: 0, sm: 1.5 }, bgcolor: { xs: 'transparent', sm: '#fff' }, border: { xs: 0, sm: `1px solid ${ui.line}` }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
				<TextField
					value={search}
					onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }}
					placeholder={copy.search}
					size={phone ? 'medium' : 'small'}
					sx={{ width: { xs: '100%', sm: 300 } }}
					slotProps={{
						htmlInput: { 'aria-label': copy.search, type: 'search' },
						input: { startAdornment: <InputAdornment position='start'><SearchOutlinedIcon sx={{ color: ui.muted }} /></InputAdornment>, sx: { borderRadius: 0, bgcolor: '#fff' } },
					}}
				/>
				{statusGroup}
				<Box sx={{ display: 'flex', gap: 1.5, flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
					{tenants.length > 1 && (
						<TextField
							select
							size='small'
							value={tenantFilter}
							onChange={(e) => { setTenantFilter(e.target.value); setLimit(PAGE); }}
							slotProps={{ htmlInput: { 'aria-label': tenantLabel() }, input: { sx: { borderRadius: 0, bgcolor: '#fff' } } }}
							sx={{ flex: { xs: 1, sm: 'none' }, minWidth: 170 }}
						>
							<MenuItem value='all'>{copy.allTenants}</MenuItem>
							{tenants.map((t) => (
								<MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>
							))}
						</TextField>
					)}
					<Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
					{!tableMode && <TextField
						select
						size='small'
						value={sortKey}
						onChange={(e) => setSortKey(e.target.value as SortKey)}
						slotProps={{ htmlInput: { 'aria-label': copy.sort }, input: { sx: { borderRadius: 0, bgcolor: '#fff' } } }}
						sx={{ flex: { xs: 1, sm: 'none' }, minWidth: 150 }}
					>
						<MenuItem value='name-asc'>{copy.sortNameAsc}</MenuItem>
						<MenuItem value='name-desc'>{copy.sortNameDesc}</MenuItem>
						<MenuItem value='newest'>{copy.sortNewest}</MenuItem>
						<MenuItem value='oldest'>{copy.sortOldest}</MenuItem>
					</TextField>}
					{!phone && viewToggle}
				</Box>
			</Box>

			<Box key={tableMode ? 'table' : 'cards'} sx={fadeInSx}>
				{!roomsLoaded && visibleRooms.length === 0 ? (tableMode ? (
					<Box aria-hidden sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
						{[ 0, 1, 2, 3, 4, 5, 6, 7 ].map((i) => <Skeleton key={i} variant='rectangular' height={i ? 52 : 40} sx={{ borderRadius: 0 }} />)}
					</Box>
				) : (
					<Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(260px, 1fr))' }, gap: { xs: 1.25, sm: 2.5 } }}>
						{[ 0, 1, 2, 3, 4, 5, 6, 7 ].map((i) => <Skeleton key={i} variant='rectangular' height={phone ? 96 : 300} sx={{ borderRadius: 0 }} />)}
					</Box>
				)) : tableMode ? (visibleRooms.length > 0 && roomTable) : (
					<Box
						component='ul'
						aria-label={roomsLabel()}
						sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(260px, 1fr))' }, gap: { xs: 1.25, sm: 2.5 } }}
					>
						{visibleRooms.slice(0, limit).map((r, index) => {
							const role = roleOf(r);
							const meta = `${getTenantName(String(r.tenantId ?? ''))}${role ? ` · ${role}` : ''}`;
							const owners = ownerEmails(r);
							const shownOwners = owners.slice(0, 4);

							return (
								<Box component='li' key={r.id} data-flip={`c${r.id}`} sx={{ minWidth: 0, display: 'flex', ...staggerSx(index, intro), ...markSx(r.id) }}>
									{phone ? (
										<ButtonBase
											onClick={() => openRoom(r)}
											sx={{ width: '100%', minHeight: 96, display: 'flex', alignItems: 'stretch', textAlign: 'left', bgcolor: '#fff', border: `1px solid ${ui.line}`, '&:hover, &.Mui-focusVisible': { bgcolor: ui.orangeLight, borderColor: ui.orange }, '&.Mui-focusVisible': { outline: `2px solid ${ui.blue}`, outlineOffset: 2 } }}
										>
											<Box sx={{ width: 76, flexShrink: 0, bgcolor: ui.blueLight, borderRight: `1px solid ${ui.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
												<Box component='img' src={copy.roomPicture} alt='' sx={{ width: 42, height: 42 }} />
											</Box>
											<Box sx={{ flexGrow: 1, minWidth: 0, p: '10px 12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<Box component='span' sx={{ flexGrow: 1, minWidth: 0, fontSize: 19, lineHeight: '24px', fontWeight: 700, color: ui.orangeText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</Box>
													<StatusText locked={Boolean(r.locked)} />
												</Box>
												{r.description && <Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</Box>}
												<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: '#334155' }}>{meta}</Box>
											</Box>
										</ButtonBase>
									) : (
										<ButtonBase
											onClick={() => openRoom(r)}
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
												'& .room-media': { transition: 'background-color 150ms ease' },
												'&:hover, &.Mui-focusVisible': {
													bgcolor: ui.orangeLight,
													borderColor: ui.orange,
													...liftOn(`inset 0 -4px 0 ${ui.orange}`),
													'& .room-media': { bgcolor: alpha(ui.orange, 0.16) },
												},
												'&.Mui-focusVisible': { outline: `2px solid ${ui.blue}`, outlineOffset: 2 },
												'@media (prefers-reduced-motion: reduce)': { transition: 'none', '& .room-media': { transition: 'none' } },
											}}
										>
											<Box className='room-media' sx={{ position: 'relative', height: 96, flexShrink: 0, bgcolor: ui.blueLight, borderBottom: `1px solid ${ui.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
												<Box component='img' src={copy.roomPicture} alt='' sx={{ width: 60, height: 60 }} />
												<Box sx={{ position: 'absolute', top: 10, right: 10, px: 1, py: '3px', bgcolor: '#fff' }}>
													<StatusText locked={Boolean(r.locked)} />
												</Box>
											</Box>
											<Box sx={{ flexGrow: 1, p: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
												<Box component='span' sx={{ fontSize: 20, lineHeight: '26px', fontWeight: 700, color: ui.orangeText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</Box>
												<Box component='span' sx={{ minHeight: 36, fontSize: 13, lineHeight: '18px', color: ui.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</Box>
												<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</Box>
												<Box sx={{ mt: '2px' }}><FeatureTags room={r} /></Box>
												<Box sx={{ flexGrow: 1 }} />
												<Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center' }} title={owners.join(', ')}>
													{shownOwners.map((e, i) => (
														<Avatar key={`${e}-${i}`} sx={{ width: 28, height: 28, mr: '-6px', border: '2px solid #fff', bgcolor: ui.navy, fontSize: 11, fontWeight: 600 }}>{initialsOf(e)}</Avatar>
													))}
													{owners.length > 4 && <Box component='span' sx={{ ml: 1.25, fontSize: 12, fontWeight: 600, color: ui.slate }}>+{owners.length - 4}</Box>}
												</Box>
											</Box>
										</ButtonBase>
									)}
								</Box>
							);
						})}
					</Box>
				)}
			</Box>
			{visibleRooms.length === 0 && roomsLoaded && (
				<Box role='status' sx={{ py: 5, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, textAlign: 'center', bgcolor: '#fff', border: `1px solid ${ui.line}`, ...fadeInSx }}>
					<Box sx={{ width: 88, height: 88, mb: 0.5, bgcolor: ui.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<Box component='img' src={copy.roomPicture} alt='' sx={{ width: 56, height: 56 }} />
					</Box>
					<Typography component='h3' sx={{ m: 0, fontSize: 18, lineHeight: '24px', fontWeight: 700, color: ui.navy }}>{tableData.length ? copy.noRooms : copy.noRoomsYet}</Typography>
					<Typography sx={{ fontSize: 14, lineHeight: '20px', color: ui.muted }}>{tableData.length ? copy.noRoomsHint : copy.noRoomsYetHint}</Typography>
					{tableData.length > 0 ? (filtersOn && 
						<Button variant='outlined' onClick={clearFilters} sx={{ mt: 1, borderRadius: 0, height: 40 }}>{copy.clearFilters}</Button>
					) : (
						<Button onClick={() => handleClickOpen()} startIcon={<AddOutlinedIcon />} sx={{ mt: 1, borderRadius: 0, height: 40, px: 2.25, bgcolor: ui.orange, color: ui.navy, fontWeight: 600, '&:hover': { bgcolor: '#e8851a' } }}>{copy.addRoom}</Button>
					)}
				</Box>
			)}
			{visibleRooms.length > limit && (
				<Button variant='outlined' onClick={() => setLimit((n) => n + PAGE)} sx={{ alignSelf: 'center', borderRadius: 0, height: 44, px: 3 }}>{copy.showMore}</Button>
			)}
		</Box>

		<Drawer
			anchor='right'
			open={open}
			onClose={handleClose}
			// Same feel as the Users window: 360ms in, 300ms out (2026-10-18).
			transitionDuration={reduceMotionPref ? 0 : { enter: 360, exit: 300 }}
			slotProps={{ transition: { easing: { enter: 'cubic-bezier(0.16, 1, 0.3, 1)', exit: 'cubic-bezier(0.4, 0, 1, 1)' } }, paper: { 'aria-labelledby': panelTitleId, sx: { width: { xs: '100%', sm: 600 }, maxWidth: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column' } } }}
		>
			<Box sx={{ flexShrink: 0, minHeight: 80, boxSizing: 'border-box', px: { xs: 2, sm: 3 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${ui.line}`, borderTop: `4px solid ${ui.orange}` }}>
				<Box sx={{ width: 52, height: 52, flexShrink: 0, bgcolor: ui.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Box component='img' src={copy.roomPicture} alt='' sx={{ width: 34, height: 34 }} />
				</Box>
				<Box sx={{ flexGrow: 1, minWidth: 0 }}>
					<Typography id={panelTitleId} component='h2' sx={{ m: 0, fontSize: 22, lineHeight: '28px', fontWeight: 700, color: ui.orangeText, overflowWrap: 'anywhere' }}>
						{editing ? name : copy.newRoom}
					</Typography>
					{editing && <Typography sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>#{id} · {tenantName}</Typography>}
				</Box>
				<IconButton onClick={handleClose} aria-label={closeLabel()} sx={{ width: 44, height: 44, color: ui.navy }}>
					<CloseOutlinedIcon />
				</IconButton>
			</Box>

			<Box
				sx={{
					flexGrow: 1,
					minHeight: 0,
					overflowY: 'auto',
					px: { xs: 2, sm: 3 },
					py: 2.5,
					display: 'flex',
					flexDirection: 'column',
					gap: 3,
					// The owner, role and meeting tables inside the panel.
					'& h4': { ...sectionLabelSx, m: '4px 0 8px' },
					'& hr': { display: 'none' },
					'& .MuiPaper-root': { borderRadius: '0 !important' },
				}}
			>
				<Box component='section' aria-label={copy.general} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
					<Typography component='h3' sx={sectionLabelSx}>{copy.general}</Typography>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
						<input type='hidden' name='id' value={id} />
						<TextField
							autoFocus={!editing}
							id='name'
							label={nameLabel()}
							type='text'
							required
							fullWidth
							onChange={handleNameChange}
							value={name}
							disabled={nameDisabled}
						/>
						{tenants.length > 1 ? (
							<Autocomplete
								options={tenants}
								getOptionLabel={(option) => option.name}
								fullWidth
								disableClearable
								onChange={handleTenantIdChange}
								value={tenantIdOption}
								readOnly={editing} // tenant not changeable on edit
								renderInput={(params) => <TextField {...params} label={tenantLabel()} />}
							/>
						) : <Box sx={{ display: { xs: 'none', sm: 'block' } }} />}
						<TextField
							id='description'
							label={descLabel()}
							type='text'
							required
							fullWidth
							onChange={handleDescriptionChange}
							value={description}
							sx={{ gridColumn: '1 / -1' }}
						/>
						<Autocomplete
							options={roles}
							getOptionLabel={(option) => option.name}
							fullWidth
							disableClearable
							onChange={handleDefaultRoleIdChange}
							value={defaultRoleIdOption}
							renderInput={(params) => <TextField {...params} label={defaultRoleLabel()} />}
						/>
						<TextField
							id='maxActiveVideos'
							label={maxActiveVideosLabel()}
							type='number'
							required
							fullWidth
							onChange={handleMaxActiveVideosChange}
							value={maxActiveVideos}
						/>
						<TextField
							id='logo'
							label={logoLabel()}
							type='text'
							fullWidth
							onChange={handleLogoChange}
							value={logo}
						/>
						<TextField
							id='background'
							label={roomBgLabel()}
							type='text'
							fullWidth
							onChange={handleBackgroundChange}
							value={background}
						/>
					</Box>
				</Box>

				<Box component='section' aria-label={copy.features} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
					<Typography component='h3' sx={sectionLabelSx}>{copy.features}</Typography>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, columnGap: 4 }}>
						{switchRow(lockRoomLabel(), locked, handleLockedChange)}
						{switchRow(chatEnabledLabel(), chatEnabled, handleChatEnabledChange)}
						{switchRow(raiseHandEnabledLabel(), raiseHandEnabled, handleRaiseHandEnabledChange)}
						{switchRow(reactionsEnabledLabel(), reactionsEnabled, handleReactionsEnabledChange)}
						{switchRow(filesharingEnabledLabel(), filesharingEnabled, handleFilesharingEnabledChange)}
						{switchRow(localRecordingEnabledLabel(), localRecordingEnabled, handleLocalRecordingEnabledChange)}
						{switchRow(breakoutsEnabledLabel(), breakoutsEnabled, handleBreakoutsEnabledChange)}
						{e2eeLocked ?
							switchRow(endToEndEncryptionLabel(), e2eeForcedValue, undefined, { disabled: true, tip: endToEndEncryptionTooltipLabel() }) :
							switchRow(endToEndEncryptionLabel(), endToEndEncryption, handleEndToEndEncryptionChange)}
						{switchRow(meetingsOnlyLabel(), meetingsOnly, handleMeetingsOnlyChange, { tip: meetingsOnlyTooltipLabel() })}
					</Box>
				</Box>

				{editing && <>
					<RoomOwnerTable roomId={id} />
					<RoomUserRoleTable roomId={id} />
					{invitesEnabled && <MeetingsTable roomId={id} tenantId={tenantId || undefined} />}
				</>}
			</Box>

			<Box sx={{ flexShrink: 0, minHeight: 68, boxSizing: 'border-box', px: { xs: 2, sm: 3 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderTop: `1px solid ${ui.line}`, bgcolor: '#fff' }}>
				{editing && (
					<Button onClick={delTenant} disabled={cantDelete} sx={{ color: ui.error, borderRadius: 0, '&:hover': { bgcolor: alpha(ui.error, 0.08) } }}>{deleteLabel()}</Button>
				)}
				<Box sx={{ flexGrow: 1 }} />
				<Button variant='outlined' onClick={handleClose} sx={{ borderRadius: 0 }}>{cancelLabel()}</Button>
				<Button onClick={addTenant} disabled={cantPatch || name === ''} sx={{ borderRadius: 0, px: 2.75, bgcolor: ui.orange, color: ui.navy, '&:hover': { bgcolor: '#e8851a' } }}>{applyLabel()}</Button>
			</Box>
		</Drawer>
	</>;
};

export default RoomTable;
