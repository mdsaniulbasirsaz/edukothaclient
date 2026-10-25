import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Avatar, Box, Button, ButtonBase, Dialog, IconButton, InputAdornment, MenuItem, Skeleton, Slide, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { alpha } from '@mui/material/styles';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { GroupRoles, GroupUsers, Groups, Roles, Room, Tenant, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { notificationsActions } from '../../../store/slices/notificationsSlice';
import { asNumber, ellipsis, focusRing, initialsOf, sectionLabelSx, squareInput, str, ui } from '../users/userUi';
import { SavedTick, liftOn, liftTransition, savedButtonSx, staggerSx, useFlip, useIntro, useJustSaved } from '../motion';
import { cancelLabel, closeLabel, groupsLabel, hiddenEmailLabel, hiddenNameLabel, nameCannotBeEmptyLabel, tenantLabel, undefinedLabel } from '../../translated/translatedComponents';

// Groups screen (user brief 2026-10-17, canvas options A + B): square group
// cards like the Rooms page, and one modal that slides down from the top
// (like Users) with Details, Members and Room access tabs. It replaces the
// three old tables (groups, group users, group roles), so an admin no longer
// has to look a group up by name on another table. Members and room roles
// save as soon as they are added or removed; name, description and tenant
// save with the Save button. Desktop can switch to a sortable table
// (2026-10-18) that shares the filters and opens the same modal.
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
	subtitle: 'Put users together and give the whole group a role in a room.',
	addGroup: 'Add group',
	newGroup: 'New group',
	all: 'All',
	inRooms: 'In rooms',
	notUsed: 'Not used',
	usage: 'Usage',
	search: 'Search groups or a member',
	searchShort: 'Search groups',
	allTenants: 'All tenants',
	sort: 'Sort',
	sortNameAsc: 'Name A–Z',
	sortNameDesc: 'Name Z–A',
	sortNewest: 'Newest first',
	sortOldest: 'Oldest first',
	sortMembers: 'Most members',
	showMore: 'Show more',
	showing: (n: number, total: number) => `Showing ${n} of ${total}`,
	noGroups: 'No groups match your search.',
	noGroupsYet: 'No groups yet. Add one to give many people a room role at once.',
	clearFilters: 'Clear filters',
	members: (n: number) => (n === 1 ? '1 member' : `${n} members`),
	rooms: (n: number) => (n === 0 ? 'No rooms' : n === 1 ? '1 room' : `${n} rooms`),
	noMembers: 'No members yet',
	groupNo: (id: number) => `Group #${id}`,
	tabs: 'Group sections',
	details: 'Details',
	membersTab: 'Members',
	roomAccess: 'Room access',
	name: 'Name',
	description: 'Description',
	membersTile: 'members · manage',
	roomsTile: 'rooms with a role · manage',
	deleteTitle: 'Delete this group',
	deleteHelp: 'Members keep their accounts. They lose the roles this group gave them.',
	deleteGroup: 'Delete group',
	deleteConfirm: 'Yes, delete',
	addPeople: 'Add people: type a name or email',
	addPeopleShort: 'Add people to this group',
	add: 'Add',
	noPeopleLeft: 'Everyone in this tenant is already a member.',
	findMember: 'Find a member',
	membersCount: (n: number, shown: number) => (n === shown ? `${n} ${n === 1 ? 'member' : 'members'}` : `${n} members · showing ${shown}`),
	noMemberMatch: 'No member matches.',
	emptyMembers: 'This group has no members yet. Add people above.',
	remove: 'Remove',
	removeFrom: (who: string) => `Remove ${who} from the group`,
	accessIntro: (g: string) => `Everyone in ${g} gets this role when they join the room.`,
	chooseRoom: 'Room',
	chooseRole: 'Role',
	roleIn: (room: string) => `Role in ${room}`,
	removeRole: (room: string) => `Remove the role in ${room}`,
	duplicate: 'This group already has that role in that room.',
	emptyAccess: 'This group has no room roles yet. Pick a room and a role above.',
	createFirst: 'Create the group first, then add members and rooms.',
	footDetails: 'Name, description and tenant save when you press Save.',
	footMembers: 'Adding or removing a person saves right away.',
	footRooms: 'Adding, changing or removing a room role saves right away.',
	save: 'Save',
	create: 'Create group',
	done: 'Done',
	saved: 'Saved',
	required: 'Required',
	unknownRoom: (id: number) => `Room #${id}`,
	unknownRole: (id: number) => `Role #${id}`,
	unknownUser: (id: number) => `User #${id}`,
	picture: 'images/mgmt/group.png',
	view: 'View',
	cards: 'Cards',
	table: 'Table',
	membersCol: 'Members',
	roomsCol: 'Rooms',
	idCol: 'ID',
} as const;

type UsageFilter = 'all' | 'used' | 'unused';
type SortKey = 'name-asc' | 'name-desc' | 'newest' | 'oldest' | 'members';
type TabKey = 'details' | 'members' | 'rooms';
type ViewKey = 'cards' | 'table';
type ColKey = 'name' | 'tenant' | 'members' | 'rooms' | 'id';
const VIEW_KEY = 'mgmt-groups-view';
const PAGE = 24;
const MEMBER_PAGE = 6;

// Some services answer with a paginated { data: [] }, others with a bare array.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowsOf = <T, >(res: any): T[] => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);

const userName = (u: User | undefined) => str(u?.name) || str(u?.email) || hiddenNameLabel();
const sameId = (a: unknown, b: unknown) => asNumber(a) === asNumber(b);

type GroupView = {
	group: Groups;
	tenantName: string;
	memberIds: number[];
	faces: string[];
	roomCount: number;
};

const chipSx = (color: string, bg: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: 12, lineHeight: '16px', fontWeight: 500, color, bgcolor: bg, px: '8px', py: '4px', whiteSpace: 'nowrap' }) as const;

const Chips = ({ view, small = false }: { view: GroupView; small?: boolean }) => {
	const n = view.memberIds.length;
	const iconSx = { fontSize: small ? 13 : 15 };

	return (
		<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
			<Box component='span' sx={{ ...chipSx(ui.blueDark, ui.blueLight), ...(small ? { fontSize: 11, py: '2px', px: '6px' } : {}) }}>
				<GroupOutlinedIcon aria-hidden sx={iconSx} />{copy.members(n)}
			</Box>
			<Box component='span' sx={{ ...(view.roomCount ? chipSx(ui.green, '#e7f6ee') : chipSx(ui.slate, ui.grey)), ...(small ? { fontSize: 11, py: '2px', px: '6px' } : {}) }}>
				<MeetingRoomOutlinedIcon aria-hidden sx={iconSx} />{copy.rooms(view.roomCount)}
			</Box>
		</Box>
	);
};

type GroupItemProps = { view: GroupView; phone: boolean; on: boolean; onOpen: React.Dispatch<{ id: number; trigger: HTMLElement }> };

// One group card. Memoised, so the modal opening or typing in it does not
// redraw every card.
const GroupItem = memo(function GroupItemView({ view, phone, on, onOpen }: GroupItemProps) {
	const g = view.group;
	const n = view.memberIds.length;
	const open = (e: React.MouseEvent<HTMLElement>) => onOpen({ id: asNumber(g.id), trigger: e.currentTarget });
	const active = { bgcolor: ui.orangeLight, borderColor: ui.orange, boxShadow: `inset 0 -4px 0 ${ui.orange}`, '& .group-media': { bgcolor: alpha(ui.orange, 0.16) } };

	if (phone) {
		return (
			<ButtonBase
				onClick={open}
				sx={{ width: '100%', minHeight: 80, px: 1.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, textAlign: 'left', bgcolor: '#fff', border: `1px solid ${ui.line}`, '&:hover, &.Mui-focusVisible': { bgcolor: ui.orangeLight, borderColor: ui.orange }, '&.Mui-focusVisible': focusRing }}
			>
				<Box className='group-media' sx={{ width: 48, height: 48, flexShrink: 0, bgcolor: ui.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Box component='img' src={copy.picture} alt='' sx={{ width: 32, height: 32 }} />
				</Box>
				<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
					<Box component='span' sx={{ fontSize: 19, lineHeight: '24px', fontWeight: 700, color: ui.orangeText, ...ellipsis }}>{g.name}</Box>
					<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{view.tenantName}</Box>
					<Chips view={view} small />
				</Box>
				<ChevronRightOutlinedIcon sx={{ color: ui.slateDot, flexShrink: 0 }} />
			</ButtonBase>
		);
	}

	return (
		<ButtonBase
			aria-pressed={on}
			onClick={open}
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
				'& .group-media': { transition: 'background-color 150ms ease' },
				...(on ? active : {}),
				'&:hover, &.Mui-focusVisible': { ...active, ...liftOn(`inset 0 -4px 0 ${ui.orange}`) },
				'&.Mui-focusVisible': { ...active, ...focusRing },
				'@media (prefers-reduced-motion: reduce)': { transition: 'none', '& .group-media': { transition: 'none' } },
			}}
		>
			<Box className='group-media' sx={{ position: 'relative', height: 88, flexShrink: 0, bgcolor: ui.blueLight, borderBottom: `1px solid ${ui.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Box component='img' src={copy.picture} alt='' sx={{ width: 56, height: 56 }} />
				<Box component='span' sx={{ position: 'absolute', top: 10, right: 10, maxWidth: 'calc(100% - 20px)', px: 1, py: '3px', bgcolor: '#fff', fontSize: 12, lineHeight: '16px', fontWeight: 600, color: ui.body, ...ellipsis }}>{view.tenantName}</Box>
			</Box>
			<Box sx={{ flexGrow: 1, p: '14px 16px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
				<Box component='span' sx={{ fontSize: 20, lineHeight: '26px', fontWeight: 700, color: ui.orangeText, ...ellipsis }}>{g.name}</Box>
				<Box component='span' sx={{ minHeight: 36, fontSize: 13, lineHeight: '18px', color: ui.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>{str(g.description)}</Box>
				<Box sx={{ flexGrow: 1 }} />
				<Chips view={view} />
				<Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center' }}>
					{n === 0 ? (
						<Box component='span' sx={{ fontSize: 13, color: ui.muted, fontStyle: 'italic' }}>{copy.noMembers}</Box>
					) : <>
						{view.faces.map((f, i) => (
							<Avatar key={i} variant='square' sx={{ width: 28, height: 28, mr: '-6px', border: '2px solid #fff', bgcolor: ui.navy, fontSize: 11, fontWeight: 600 }}>{f}</Avatar>
						))}
						{n > view.faces.length && (
							<Avatar variant='square' sx={{ width: 28, height: 28, border: '2px solid #fff', bgcolor: ui.blueLight, color: ui.blueDark, fontSize: 11, fontWeight: 700 }}>+{n - view.faces.length}</Avatar>
						)}
					</>}
				</Box>
			</Box>
		</ButtonBase>
	);
});

const GroupTable = () => {
	const dispatch = useAppDispatch();
	const phone = useMediaQuery('(max-width: 599.95px)');
	const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

	const [ groups, setGroups ] = useState<Groups[]>([]);
	const [ tenants, setTenants ] = useState<Tenant[]>([]);
	const [ users, setUsers ] = useState<User[]>([]);
	const [ rooms, setRooms ] = useState<Room[]>([]);
	const [ roles, setRoles ] = useState<Roles[]>([]);
	const [ groupUsers, setGroupUsers ] = useState<GroupUsers[]>([]);
	const [ groupRoles, setGroupRoles ] = useState<GroupRoles[]>([]);
	const [ isLoading, setIsLoading ] = useState(true);

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const fetchGroups = () => dispatch(getData('groups')).then((t: any) => { if (t != undefined) setGroups(rowsOf<Groups>(t)); });
	const fetchMembers = () => dispatch(getData('groupUsers')).then((t: any) => { if (t != undefined) setGroupUsers(rowsOf<GroupUsers>(t)); });
	const fetchRoomRoles = () => dispatch(getData('roomGroupRoles')).then((t: any) => { if (t != undefined) setGroupRoles(rowsOf<GroupRoles>(t)); });

	useEffect(() => {
		Promise.all([
			fetchGroups(),
			fetchMembers(),
			fetchRoomRoles(),
			dispatch(getData('tenants')).then((t: any) => { if (t != undefined) setTenants(rowsOf<Tenant>(t)); }),
			dispatch(getData('users')).then((t: any) => { if (t != undefined) setUsers(rowsOf<User>(t)); }),
			dispatch(getData('rooms')).then((t: any) => { if (t != undefined) setRooms(rowsOf<Room>(t)); }),
			dispatch(getData('roles')).then((t: any) => { if (t != undefined) setRoles(rowsOf<Roles>(t)); }),
		]).finally(() => setIsLoading(false));
	}, []);
	/* eslint-enable @typescript-eslint/no-explicit-any */

	const tenantName = (id: unknown) => tenants.find((t) => sameId(t.id, id))?.name || `${tenantLabel()} - ${undefinedLabel()}`;
	const userById = useMemo(() => new Map(users.map((u) => [ asNumber(u.id), u ])), [ users ]);

	const views = useMemo<GroupView[]>(() => groups.map((g) => {
		const memberIds = groupUsers.filter((m) => sameId(m.groupId, g.id)).map((m) => asNumber(m.userId));
		const roomCount = new Set(groupRoles.filter((r) => sameId(r.groupId, g.id)).map((r) => asNumber(r.roomId))).size;
		const faces = memberIds.slice(0, 4).map((id) => {
			const u = userById.get(id);

			return initialsOf(str(u?.name), str(u?.email));
		});

		return { group: g, tenantName: tenantName(g.tenantId), memberIds, faces, roomCount };
	}), [ groups, groupUsers, groupRoles, userById, tenants ]);

	// ----- Filters -----
	const [ search, setSearch ] = useState('');
	const [ usage, setUsage ] = useState<UsageFilter>('all');
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
	const sortBy = (col: ColKey) => setColSort((c) => ({ col, dir: c.col === col ? (c.dir === 1 ? -1 : 1) : 1 }));

	const counts = {
		all: views.length,
		used: views.filter((v) => v.roomCount > 0).length,
		unused: views.filter((v) => v.roomCount === 0).length,
	};
	const visible = useMemo(() => {
		const q = search.trim().toLowerCase();
		// A search also finds groups by a member's name or email.
		const matches = (v: GroupView) => !q
			|| `${v.group.name} ${str(v.group.description)}`.toLowerCase().includes(q)
			|| v.memberIds.some((id) => {
				const u = userById.get(id);

				return `${str(u?.name)} ${str(u?.email)}`.toLowerCase().includes(q);
			});
		const list = views
			.filter((v) => usage === 'all' || (usage === 'used' ? v.roomCount > 0 : v.roomCount === 0))
			.filter((v) => tenantFilter === 'all' || String(v.group.tenantId) === tenantFilter)
			.filter(matches);

		return [ ...list ].sort((a, b) => {
			if (sortKey === 'newest') return asNumber(b.group.id) - asNumber(a.group.id);
			if (sortKey === 'oldest') return asNumber(a.group.id) - asNumber(b.group.id);
			if (sortKey === 'members') return b.memberIds.length - a.memberIds.length || a.group.name.localeCompare(b.group.name);
			const byName = str(a.group.name).localeCompare(str(b.group.name));

			return sortKey === 'name-desc' ? -byName : byName;
		});
	}, [ views, usage, tenantFilter, search, sortKey, userById ]);
	const rows = useMemo(() => {
		if (!tableMode) return visible;
		const { col, dir } = colSort;

		return [ ...visible ].sort((a, b) => {
			if (col === 'members') return dir * (a.memberIds.length - b.memberIds.length);
			if (col === 'rooms') return dir * (a.roomCount - b.roomCount);
			if (col === 'id') return dir * (asNumber(a.group.id) - asNumber(b.group.id));
			if (col === 'tenant') return dir * a.tenantName.localeCompare(b.tenantName);

			return dir * str(a.group.name).localeCompare(str(b.group.name));
		});
	}, [ visible, tableMode, colSort ]);
	const filtersOn = usage !== 'all' || tenantFilter !== 'all' || search.trim() !== '';
	const clearFilters = () => {
		setUsage('all');
		setTenantFilter('all');
		setSearch('');
		setLimit(PAGE);
	};

	// ----- Modal -----
	// selectedId stays set while the modal slides out, so it never goes blank.
	// 0 means a new group that is not created yet.
	const [ selectedId, setSelectedId ] = useState<number | null>(null);
	const [ modalOpen, setModalOpen ] = useState(false);
	const [ tab, setTab ] = useState<TabKey>('details');
	const [ draftName, setDraftName ] = useState('');
	const [ draftDesc, setDraftDesc ] = useState('');
	const [ draftTenant, setDraftTenant ] = useState('');
	const [ busy, setBusy ] = useState(false);
	const [ savedAt, setSavedAt ] = useState(0);
	const [ confirmDelete, setConfirmDelete ] = useState(false);
	const [ toAdd, setToAdd ] = useState<User[]>([]);
	const [ memberQuery, setMemberQuery ] = useState('');
	const [ memberLimit, setMemberLimit ] = useState(MEMBER_PAGE);
	const [ newRoom, setNewRoom ] = useState('');
	const [ newRole, setNewRole ] = useState('');
	
	const selected = selectedId ? groups.find((g) => sameId(g.id, selectedId)) ?? null : null;
	const isNew = selectedId === 0;

	const resetModalState = (g: Groups | null, startTab: TabKey) => {
		setDraftName(str(g?.name));
		setDraftDesc(str(g?.description));
		setDraftTenant(g ? String(g.tenantId) : (tenantFilter !== 'all' ? tenantFilter : String(tenants[0]?.id ?? '')));
		setTab(startTab);
		setSavedAt(0);
		setConfirmDelete(false);
		setToAdd([]);
		setMemberQuery('');
		setMemberLimit(MEMBER_PAGE);
		setNewRoom('');
		setNewRole('');
	};

	const openGroup = useCallback(({ id }: { id: number; trigger: HTMLElement }) => {
		setSelectedId(id);
		setModalOpen(true);
	}, []);

	// Fill the drafts when a card opens the modal (the card only passes an id
	// so it can stay memoised).
	useEffect(() => {
		if (modalOpen && selectedId) resetModalState(groups.find((g) => sameId(g.id, selectedId)) ?? null, 'members');
	}, [ modalOpen, selectedId ]);

	const openNew = () => {
		setSelectedId(0);
		resetModalState(null, 'details');
		setModalOpen(true);
	};
	const closeModal = () => setModalOpen(false);

	const dirty = isNew
		? draftName.trim() !== ''
		: Boolean(selected && (draftName !== str(selected.name) || draftDesc !== str(selected.description) || draftTenant !== String(selected.tenantId)));
	const canSave = dirty && draftName.trim() !== '' && draftTenant !== '' && !busy;

	const saveDetails = async () => {
		if (!canSave) {
			if (draftName.trim() === '') dispatch(notificationsActions.enqueueNotification({ message: nameCannotBeEmptyLabel(), options: { variant: 'warning' } }));

			return;
		}
		setBusy(true);
		try {
			if (isNew) {
				// The API takes name and tenant on create; the description is
				// patched in afterwards.
				const created = await dispatch(createData({ name: draftName.trim(), tenantId: asNumber(draftTenant) }, 'groups')) as Groups | undefined;

				if (created && created.id) {
					if (draftDesc.trim()) await dispatch(patchData(asNumber(created.id), { description: draftDesc.trim() }, 'groups'));
					await fetchGroups();
					setSelectedId(asNumber(created.id));
					setTab('members');
				}
			} else if (selected) {
				await dispatch(patchData(asNumber(selected.id), { name: draftName.trim(), description: draftDesc.trim(), tenantId: asNumber(draftTenant) }, 'groups'));
				await fetchGroups();
				setSavedAt(Date.now());
			}
		} finally {
			setBusy(false);
		}
	};

	const removeGroup = async () => {
		if (!selected) return;
		if (!confirmDelete) {
			setConfirmDelete(true);

			return;
		}
		setBusy(true);
		try {
			await dispatch(deleteData(asNumber(selected.id), 'groups'));
			setModalOpen(false);
			await Promise.all([ fetchGroups(), fetchMembers(), fetchRoomRoles() ]);
		} finally {
			setBusy(false);
			setConfirmDelete(false);
		}
	};

	// ----- Members -----
	const groupTenant = selected ? selected.tenantId : asNumber(draftTenant);
	const memberLinks = selected ? groupUsers.filter((m) => sameId(m.groupId, selected.id)) : [];
	const memberIdSet = new Set(memberLinks.map((m) => asNumber(m.userId)));
	const candidates = users
		.filter((u) => !memberIdSet.has(asNumber(u.id)))
		.filter((u) => u.tenantId === undefined || u.tenantId === null || sameId(u.tenantId, groupTenant))
		.sort((a, b) => userName(a).localeCompare(userName(b)));
	const sortedMembers = memberLinks
		.map((m) => ({ link: m, user: userById.get(asNumber(m.userId)) }))
		.sort((a, b) => userName(a.user).localeCompare(userName(b.user)));
	const mq = memberQuery.trim().toLowerCase();
	const filteredMembers = mq ? sortedMembers.filter((m) => `${str(m.user?.name)} ${str(m.user?.email)}`.toLowerCase().includes(mq)) : sortedMembers;
	const shownMembers = filteredMembers.slice(0, memberLimit);

	const addMembers = async () => {
		if (!selected || toAdd.length === 0) return;
		setBusy(true);
		try {
			for (const u of toAdd) {
				await dispatch(createData({ groupId: asNumber(selected.id), userId: asNumber(u.id) }, 'groupUsers'));
			}
			setToAdd([]);
			await fetchMembers();
		} finally {
			setBusy(false);
		}
	};
	const removeMember = async (linkId: number) => {
		setBusy(true);
		try {
			await dispatch(deleteData(linkId, 'groupUsers'));
			await fetchMembers();
		} finally {
			setBusy(false);
		}
	};

	// ----- Room access -----
	const accessRows = selected ? groupRoles.filter((r) => sameId(r.groupId, selected.id)) : [];
	const tenantRooms = rooms.filter((r) => r.tenantId === undefined || r.tenantId === null || sameId(r.tenantId, groupTenant));
	const tenantRoles = (() => {
		const own = roles.filter((r) => r.tenantId === undefined || r.tenantId === null || sameId(r.tenantId, groupTenant));

		return own.length ? own : roles;
	})();
	const roomById = (id: unknown) => rooms.find((r) => sameId(r.id, id));
	const roleById = (id: unknown) => roles.find((r) => sameId(r.id, id));
	const duplicate = newRoom !== '' && newRole !== '' && accessRows.some((r) => String(r.roomId) === newRoom && String(r.roleId) === newRole);

	const addAccess = async () => {
		if (!selected || !newRoom || !newRole || duplicate) return;
		setBusy(true);
		try {
			await dispatch(createData({ groupId: asNumber(selected.id), roleId: asNumber(newRole), roomId: asNumber(newRoom) }, 'roomGroupRoles'));
			setNewRoom('');
			setNewRole('');
			await fetchRoomRoles();
		} finally {
			setBusy(false);
		}
	};
	const changeRole = async (row: GroupRoles, roleId: string) => {
		setBusy(true);
		try {
			await dispatch(patchData(asNumber(row.id), { groupId: asNumber(row.groupId), roleId: asNumber(roleId), roomId: asNumber(row.roomId) }, 'roomGroupRoles'));
			await fetchRoomRoles();
		} finally {
			setBusy(false);
		}
	};
	const removeAccess = async (id: number) => {
		setBusy(true);
		try {
			await dispatch(deleteData(id, 'roomGroupRoles'));
			await fetchRoomRoles();
		} finally {
			setBusy(false);
		}
	};

	// ----- Pieces -----
	const orangeButtonSx = { borderRadius: 0, height: 44, px: 2.5, bgcolor: ui.orange, color: ui.navy, fontWeight: 600, boxShadow: 'none', '&:hover': { bgcolor: ui.orangeHover, boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: ui.lineSoft, color: ui.muted } } as const;
	const fieldProps = { slotProps: { input: { sx: { borderRadius: 0 } } } } as const;

	const shown = rows.slice(0, limit);
	// Motion (2026-10-18): cards rise in on first show, and cards or rows
	// slide to their new places when a filter or sort changes.
	const intro = useIntro(shown.length > 0);
	const listRef = useRef<HTMLDivElement>(null);

	useFlip(listRef, `${tableMode ? 't' : 'c'}:${shown.map((v) => v.group.id)
		.join(',')}`);
	const justSaved = useJustSaved(savedAt);

	const thSx = { ...sectionLabelSx, height: 40, px: 1.5, textAlign: 'left', whiteSpace: 'nowrap', bgcolor: '#f8fafc', borderBottom: `1px solid ${ui.line}` } as const;
	const tdSx = { px: 1.5, py: 1, fontSize: 14, lineHeight: '20px', color: ui.body, borderBottom: `1px solid ${ui.lineSoft}`, verticalAlign: 'middle', whiteSpace: 'nowrap' } as const;
	const header = (col: ColKey, label: string, width?: number) => {
		const on = colSort.col === col;

		return (
			<Box component='th' scope='col' aria-sort={on ? (colSort.dir === 1 ? 'ascending' : 'descending') : undefined} sx={{ ...thSx, width }}>
				<ButtonBase
					onClick={() => sortBy(col)}
					sx={{ font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', color: on ? ui.navy : 'inherit', gap: '4px', height: 28, '&.Mui-focusVisible': focusRing }}
				>
					{label}
					{on ? (colSort.dir === 1 ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : <ArrowUpwardIcon sx={{ fontSize: 14, opacity: 0 }} />}
				</ButtonBase>
			</Box>
		);
	};
	const groupTable = (
		<Box sx={{ bgcolor: '#fff', border: `1px solid ${ui.line}`, overflowX: 'auto' }}>
			<Box component='table' aria-label={groupsLabel()} sx={{ width: '100%', minWidth: 820, borderCollapse: 'separate', borderSpacing: 0 }}>
				<thead>
					<tr>
						{header('id', copy.idCol, 72)}
						{header('name', copy.name)}
						{tenants.length > 1 && header('tenant', tenantLabel(), 180)}
						{header('members', copy.membersCol, 220)}
						{header('rooms', copy.roomsCol, 120)}
					</tr>
				</thead>
				<tbody>
					{shown.map((v) => {
						const g = v.group;
						const n = v.memberIds.length;
						const open = (e: React.MouseEvent<HTMLElement>) => openGroup({ id: asNumber(g.id), trigger: e.currentTarget });
						const on = modalOpen && sameId(g.id, selectedId);

						return (
							<Box
								component='tr'
								key={g.id}
								data-flip={`t${g.id}`}
								onClick={open}
								sx={{ cursor: 'pointer', '& td': on ? { bgcolor: ui.orangeLight } : {}, '&:hover td': { bgcolor: ui.orangeLight }, '&:last-of-type td': { borderBottom: 0 } }}
							>
								<Box component='td' sx={{ ...tdSx, color: ui.muted, fontVariantNumeric: 'tabular-nums' }}>{g.id}</Box>
								<Box component='td' sx={{ ...tdSx, maxWidth: 360 }}>
									<ButtonBase
										onClick={(e) => { e.stopPropagation(); open(e); }}
										sx={{ display: 'block', maxWidth: '100%', textAlign: 'left', fontSize: 15, fontWeight: 700, color: ui.navy, ...ellipsis, '&.Mui-focusVisible': focusRing }}
									>
										{g.name}
									</ButtonBase>
									{str(g.description) && <Box sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{str(g.description)}</Box>}
								</Box>
								{tenants.length > 1 && <Box component='td' sx={{ ...tdSx, maxWidth: 200, ...ellipsis }}>{v.tenantName}</Box>}
								<Box component='td' sx={tdSx}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<Box component='span' sx={{ minWidth: 24, fontVariantNumeric: 'tabular-nums' }}>{n}</Box>
										<Box aria-hidden sx={{ display: 'flex' }}>
											{v.faces.slice(0, 3).map((f, i) => (
												<Avatar key={i} variant='square' sx={{ width: 26, height: 26, mr: '-6px', border: '2px solid #fff', bgcolor: ui.navy, fontSize: 10, fontWeight: 600 }}>{f}</Avatar>
											))}
											{n > 3 && <Avatar variant='square' sx={{ width: 26, height: 26, border: '2px solid #fff', bgcolor: ui.blueLight, color: ui.blueDark, fontSize: 10, fontWeight: 700 }}>+{n - 3}</Avatar>}
										</Box>
									</Box>
								</Box>
								<Box component='td' sx={tdSx}>
									<Box component='span' sx={v.roomCount ? chipSx(ui.green, '#e7f6ee') : chipSx(ui.slate, ui.grey)}>{copy.rooms(v.roomCount)}</Box>
								</Box>
							</Box>
						);
					})}
				</tbody>
			</Box>
		</Box>
	);

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
							sx={{ height: 38, px: 1.5, borderLeft: i ? `1px solid ${ui.line}` : 0, bgcolor: on ? ui.navy : '#fff', color: on ? '#fff' : ui.body, '&:hover': { bgcolor: on ? ui.navy : ui.grey }, '&.Mui-focusVisible': focusRing }}
						>
							{icon}
						</ButtonBase>
					</Tooltip>
				);
			})}
		</Box>
	);
	const results = isLoading && views.length === 0 ? (tableMode ? (
		<Box aria-hidden sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
			{[ 0, 1, 2, 3, 4, 5, 6, 7 ].map((i) => <Skeleton key={i} variant='rectangular' height={i ? 52 : 40} sx={{ borderRadius: 0 }} />)}
		</Box>
	) : (
		<Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(260px, 1fr))' }, gap: { xs: 1.25, sm: 2.5 } }}>
			{[ 0, 1, 2, 3, 4, 5, 6, 7 ].map((i) => <Skeleton key={i} variant='rectangular' height={phone ? 80 : 280} sx={{ borderRadius: 0 }} />)}
		</Box>
	)) : visible.length === 0 ? (
		<Box sx={{ py: 6, px: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, bgcolor: '#fff', border: `1px solid ${ui.line}`, textAlign: 'center' }}>
			<Typography sx={{ color: ui.muted }}>{views.length === 0 ? copy.noGroupsYet : copy.noGroups}</Typography>
			{filtersOn && <Button variant='outlined' onClick={clearFilters} sx={{ borderRadius: 0 }}>{copy.clearFilters}</Button>}
		</Box>
	) : tableMode ? groupTable : (
		<Box component='ul' aria-label={groupsLabel()} sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(260px, 1fr))' }, gap: { xs: 1.25, sm: 2.5 } }}>
			{shown.map((v, index) => (
				<Box component='li' key={v.group.id} data-flip={`c${v.group.id}`} sx={{ minWidth: 0, display: 'flex', ...staggerSx(index, intro) }}>
					<GroupItem view={v} phone={phone} on={modalOpen && sameId(v.group.id, selectedId)} onOpen={openGroup} />
				</Box>
			))}
		</Box>
	);

	const memberCount = memberLinks.length;
	const roomCount = new Set(accessRows.map((r) => asNumber(r.roomId))).size;
	const titleText = isNew ? (draftName.trim() || copy.newGroup) : str(selected?.name);

	const tile = (count: number, label: string, to: TabKey) => (
		<ButtonBase
			onClick={() => setTab(to)}
			disabled={isNew}
			sx={{ p: '14px 16px', border: `1px solid ${ui.line}`, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', textAlign: 'left', '&:hover': { borderColor: ui.orange, bgcolor: ui.orangeLight }, '&.Mui-focusVisible': focusRing, '&.Mui-disabled': { opacity: 0.6 } }}
		>
			<Box component='span' sx={{ fontSize: 24, lineHeight: '32px', fontWeight: 700, color: ui.navy }}>{count}</Box>
			<Box component='span' sx={{ fontSize: 14, color: ui.body }}>{label} →</Box>
		</ButtonBase>
	);

	const detailsPanel = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
			<TextField
				label={copy.name}
				required
				fullWidth
				autoFocus={isNew}
				value={draftName}
				onChange={(e) => { setDraftName(e.target.value); setSavedAt(0); }}
				error={!isNew && dirty && draftName.trim() === ''}
				helperText={!isNew && dirty && draftName.trim() === '' ? copy.required : ' '}
				onKeyDown={(e) => { if (e.key === 'Enter') saveDetails(); }}
				{...fieldProps}
			/>
			<TextField
				label={copy.description}
				fullWidth
				multiline
				minRows={2}
				maxRows={4}
				value={draftDesc}
				onChange={(e) => { setDraftDesc(e.target.value); setSavedAt(0); }}
				sx={{ mt: -1.5 }}
				{...fieldProps}
			/>
			<TextField
				select
				label={tenantLabel()}
				fullWidth
				value={draftTenant}
				onChange={(e) => { setDraftTenant(e.target.value); setSavedAt(0); }}
				{...fieldProps}
			>
				{tenants.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}
			</TextField>
			{isNew ? (
				<Box sx={{ fontSize: 14, lineHeight: '20px', color: ui.muted }}>{copy.createFirst}</Box>
			) : <>
				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
					{tile(memberCount, copy.membersTile, 'members')}
					{tile(roomCount, copy.roomsTile, 'rooms')}
				</Box>
				<Box sx={{ p: '14px 16px', border: '1px solid #f3c7c2', bgcolor: '#fff8f7', display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
					<Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
						<Box component='span' sx={{ fontSize: 14, fontWeight: 600, color: '#8f1d14' }}>{copy.deleteTitle}</Box>
						<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{copy.deleteHelp}</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
						{confirmDelete && <Button variant='outlined' onClick={() => setConfirmDelete(false)} sx={{ borderRadius: 0, height: 40 }}>{cancelLabel()}</Button>}
						<Button
							variant={confirmDelete ? 'contained' : 'outlined'}
							onClick={removeGroup}
							disabled={busy}
							startIcon={<DeleteOutlineOutlinedIcon />}
							sx={{ borderRadius: 0, height: 40, boxShadow: 'none', ...(confirmDelete ? { bgcolor: '#b42318', color: '#fff', '&:hover': { bgcolor: '#8f1d14', boxShadow: 'none' } } : { color: '#b42318', borderColor: '#b42318', bgcolor: '#fff', '&:hover': { borderColor: '#8f1d14', bgcolor: '#fdecec' } }) }}
						>
							{confirmDelete ? copy.deleteConfirm : copy.deleteGroup}
						</Button>
					</Box>
				</Box>
			</>}
		</Box>
	);

	const membersPanel = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
			<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' } }}>
				<Autocomplete
					multiple
					fullWidth
					options={candidates}
					value={toAdd}
					onChange={(_e, v) => setToAdd(v)}
					getOptionLabel={(u) => userName(u)}
					isOptionEqualToValue={(a, b) => sameId(a.id, b.id)}
					filterOptions={(opts, state) => {
						const q = state.inputValue.trim().toLowerCase();

						return (q ? opts.filter((u) => `${str(u.name)} ${str(u.email)}`.toLowerCase().includes(q)) : opts).slice(0, 50);
					}}
					noOptionsText={candidates.length ? copy.noMemberMatch : copy.noPeopleLeft}
					renderOption={(props, u) => {
						const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: React.Key };

						return (
							<Box component='li' key={key} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
								<Avatar variant='square' src={str(u.avatar) || undefined} alt='' sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, bgcolor: ui.blueLight, color: ui.blueDark }}>{initialsOf(str(u.name), str(u.email))}</Avatar>
								<Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
									<Box component='span' sx={{ fontSize: 14, fontWeight: 600, color: ui.navy, ...ellipsis }}>{userName(u)}</Box>
									<Box component='span' sx={{ fontSize: 12, color: ui.muted, ...ellipsis }}>{str(u.email) || hiddenEmailLabel()}</Box>
								</Box>
							</Box>
						);
					}}
					slotProps={{ chip: { size: 'small', sx: { borderRadius: 0 } } }}
					renderInput={(params) => (
						<TextField
							{...params}
							placeholder={toAdd.length ? '' : copy.addPeople}
							slotProps={{
								...params.slotProps,
								htmlInput: { ...params.slotProps.htmlInput, 'aria-label': copy.addPeopleShort },
								input: {
									...params.slotProps.input,
									startAdornment: <>
										<InputAdornment position='start' sx={{ ml: 0.5 }}><PersonAddAltOutlinedIcon sx={{ color: ui.muted }} /></InputAdornment>
										{params.slotProps.input.startAdornment}
									</>,
									sx: { borderRadius: 0, minHeight: 44 },
								},
							}}
						/>
					)}
				/>
				<Button onClick={addMembers} disabled={toAdd.length === 0 || busy} sx={{ ...orangeButtonSx, flexShrink: 0, minHeight: 44, height: 'auto', alignSelf: { xs: 'stretch', sm: 'stretch' } }}>
					{toAdd.length > 1 ? `${copy.add} ${toAdd.length}` : copy.add}
				</Button>
			</Box>

			<Box sx={{ minHeight: 40, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
				<Box role='status' aria-live='polite' sx={{ flexGrow: 1, fontSize: 13, color: ui.muted }}>{copy.membersCount(filteredMembers.length, shownMembers.length)}</Box>
				{memberCount > MEMBER_PAGE && (
					<TextField
						size='small'
						value={memberQuery}
						onChange={(e) => { setMemberQuery(e.target.value); setMemberLimit(MEMBER_PAGE); }}
						placeholder={copy.findMember}
						sx={{ width: { xs: '100%', sm: 220 } }}
						slotProps={{
							htmlInput: { 'aria-label': copy.findMember, type: 'search' },
							input: { startAdornment: <InputAdornment position='start'><SearchOutlinedIcon sx={{ color: ui.muted, fontSize: 20 }} /></InputAdornment>, sx: squareInput },
						}}
					/>
				)}
			</Box>

			{memberCount === 0 ? (
				<Box sx={{ p: 3, border: '1px dashed #b8c6da', textAlign: 'center', fontSize: 14, color: ui.muted }}>{copy.emptyMembers}</Box>
			) : (
				<Box component='ul' aria-label={copy.membersTab} sx={{ listStyle: 'none', m: 0, p: 0, borderTop: `1px solid ${ui.lineSoft}` }}>
					{shownMembers.map(({ link, user }) => {
						const who = user ? userName(user) : copy.unknownUser(asNumber(link.userId));

						return (
							<Box component='li' key={link.id} sx={{ minHeight: 54, px: 0.5, borderBottom: `1px solid ${ui.lineSoft}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
								<Avatar variant='square' src={str(user?.avatar) || undefined} alt='' sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: ui.blueLight, color: ui.blueDark }}>{initialsOf(str(user?.name), str(user?.email))}</Avatar>
								<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
									<Box component='span' sx={{ fontSize: 15, lineHeight: '20px', fontWeight: 600, color: ui.navy, ...ellipsis }}>{who}</Box>
									<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{str(user?.email) || hiddenEmailLabel()}</Box>
								</Box>
								<Button
									variant='outlined'
									size='small'
									disabled={busy}
									onClick={() => removeMember(asNumber(link.id))}
									aria-label={copy.removeFrom(who)}
									startIcon={phone ? undefined : <RemoveOutlinedIcon />}
									sx={{ flexShrink: 0, borderRadius: 0, height: 36, minWidth: 0, color: ui.body, borderColor: ui.line, '&:hover': { bgcolor: '#fdecec', color: '#b42318', borderColor: '#f3c7c2' } }}
								>
									{phone ? <RemoveOutlinedIcon /> : copy.remove}
								</Button>
							</Box>
						);
					})}
				</Box>
			)}
			{filteredMembers.length > memberLimit && (
				<Button variant='outlined' onClick={() => setMemberLimit((n) => n + (MEMBER_PAGE * 2))} sx={{ alignSelf: 'center', borderRadius: 0, height: 40, px: 2.5 }}>{copy.showMore}</Button>
			)}
		</Box>
	);

	const roomsPanel = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
			<Box sx={{ fontSize: 14, lineHeight: '20px', color: ui.body }}>{copy.accessIntro(titleText)}</Box>
			<Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
				<TextField select label={copy.chooseRoom} value={newRoom} onChange={(e) => setNewRoom(e.target.value)} sx={{ flexGrow: 1, minWidth: 0 }} {...fieldProps}>
					{tenantRooms.map((r) => <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>)}
				</TextField>
				<TextField select label={copy.chooseRole} value={newRole} onChange={(e) => setNewRole(e.target.value)} sx={{ width: { xs: '100%', sm: 180 } }} {...fieldProps}>
					{tenantRoles.map((r) => <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>)}
				</TextField>
				<Button onClick={addAccess} disabled={!newRoom || !newRole || duplicate || busy} sx={{ ...orangeButtonSx, height: 56, flexShrink: 0 }}>{copy.add}</Button>
			</Box>
			{duplicate && <Box role='alert' sx={{ fontSize: 13, color: '#b42318' }}>{copy.duplicate}</Box>}
			{accessRows.length === 0 ? (
				<Box sx={{ p: 3, border: '1px dashed #b8c6da', textAlign: 'center', fontSize: 14, color: ui.muted }}>{copy.emptyAccess}</Box>
			) : (
				<Box component='ul' aria-label={copy.roomAccess} sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
					{accessRows.map((row) => {
						const room = roomById(row.roomId);
						const roomName = room?.name || copy.unknownRoom(asNumber(row.roomId));
						const roleKnown = Boolean(roleById(row.roleId));

						return (
							<Box component='li' key={row.id} sx={{ minHeight: 64, p: '10px 12px', border: `1px solid ${ui.line}`, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
								<Box sx={{ width: 40, height: 40, flexShrink: 0, bgcolor: ui.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<MeetingRoomOutlinedIcon aria-hidden sx={{ color: ui.blueDark, fontSize: 20 }} />
								</Box>
								<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
									<Box component='span' sx={{ fontSize: 15, lineHeight: '20px', fontWeight: 600, color: ui.navy, ...ellipsis }}>{roomName}</Box>
									{room?.description && <Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{room.description}</Box>}
								</Box>
								<TextField
									select
									size='small'
									value={roleKnown ? String(row.roleId) : ''}
									onChange={(e) => changeRole(row, e.target.value)}
									disabled={busy}
									slotProps={{ htmlInput: { 'aria-label': copy.roleIn(roomName) }, input: { sx: { borderRadius: 0, bgcolor: ui.blueLight, color: ui.blueDark, fontWeight: 600, fontSize: 14 } } }}
									sx={{ width: 150, flexShrink: 0 }}
								>
									{!roleKnown && <MenuItem value='' disabled>{copy.unknownRole(asNumber(row.roleId))}</MenuItem>}
									{tenantRoles.map((r) => <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>)}
								</TextField>
								<IconButton aria-label={copy.removeRole(roomName)} onClick={() => removeAccess(asNumber(row.id))} disabled={busy} sx={{ width: 40, height: 40, borderRadius: 0, border: `1px solid ${ui.line}`, color: ui.body, '&:hover': { bgcolor: '#fdecec', color: '#b42318' } }}>
									<DeleteOutlineOutlinedIcon sx={{ fontSize: 20 }} />
								</IconButton>
							</Box>
						);
					})}
				</Box>
			)}
		</Box>
	);

	const tabDefs: Array<[TabKey, string, number | null]> = [
		[ 'details', copy.details, null ],
		[ 'members', copy.membersTab, memberCount ],
		[ 'rooms', copy.roomAccess, roomCount ],
	];
	const footNote = tab === 'details' ? copy.footDetails : tab === 'members' ? copy.footMembers : copy.footRooms;
	const panelTitleId = 'group-panel-title';
	const showModal = modalOpen && (isNew || selected !== null);

	const modal = (isNew || selected) && (
		<Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderTop: `4px solid ${ui.orange}` }}>
			<Box sx={{ flexShrink: 0, pt: 2, pl: { xs: 2, sm: 3 }, pr: 1, display: 'flex', alignItems: 'flex-start', gap: 1.75, '@media (max-height: 800px)': { pt: 1.5 } }}>
				<Box sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: ui.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<Box component='img' src={copy.picture} alt='' sx={{ width: 38, height: 38 }} />
				</Box>
				<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
					<Typography id={panelTitleId} component='h2' sx={{ m: 0, fontSize: 22, lineHeight: '30px', fontWeight: 700, color: ui.orangeText, overflowWrap: 'anywhere' }}>{titleText}</Typography>
					<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>
						{isNew ? tenantName(draftTenant) : `${tenantName(selected?.tenantId)} · ${copy.groupNo(asNumber(selected?.id))}`}
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
				sx={{ flexShrink: 0, mt: 1.75, '@media (max-height: 800px)': { mt: 1 }, px: { xs: 1, sm: 2 }, minHeight: 48, borderBottom: `1px solid ${ui.lineSoft}`, '& .MuiTabs-indicator': { height: 3, bgcolor: ui.orange } }}
			>
				{tabDefs.map(([ key, label, count ]) => (
					<Tab
						key={key}
						value={key}
						id={`group-tab-${key}`}
						aria-controls={`group-tabpanel-${key}`}
						disabled={isNew && key !== 'details'}
						disableRipple
						label={
							<Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								{label}
								{count !== null && !isNew && (
									<Box component='span' sx={{ minWidth: 22, px: '6px', fontSize: 12, lineHeight: '18px', fontWeight: 600, color: tab === key ? '#fff' : ui.body, bgcolor: tab === key ? ui.navy : '#eef2f7' }}>{count}</Box>
								)}
							</Box>
						}
						sx={{ minHeight: 48, px: 1.75, textTransform: 'none', fontSize: 15, fontWeight: 500, color: ui.slate, '&.Mui-selected': { color: ui.navy, fontWeight: 600 }, '&.Mui-focusVisible': { ...focusRing, outlineOffset: -2 } }}
					/>
				))}
			</Tabs>

			<Box
				role='tabpanel'
				id={`group-tabpanel-${tab}`}
				aria-labelledby={`group-tab-${tab}`}
				sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', px: { xs: 2, sm: 3 }, py: 2.5, '@media (max-height: 800px)': { py: 1.5 } }}
			>
				{tab === 'details' ? detailsPanel : tab === 'members' ? membersPanel : roomsPanel}
			</Box>

			<Box sx={{ flexShrink: 0, minHeight: 72, px: { xs: 2, sm: 3 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.25, borderTop: `1px solid ${ui.lineSoft}` }}>
				<Box role='status' aria-live='polite' sx={{ flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 13, lineHeight: '18px', color: ui.muted }}>
					{tab === 'details' && savedAt > 0 && !dirty
						? <Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 14, fontWeight: 600, color: ui.green }}><CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />{copy.saved}</Box>
						: <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>{footNote}</Box>}
				</Box>
				{tab === 'details' ? <>
					<Button variant='outlined' onClick={closeModal} sx={{ borderRadius: 0, height: 44, flexShrink: 0 }}>{dirty ? cancelLabel() : closeLabel()}</Button>
					<Button onClick={saveDetails} disabled={!canSave} sx={{ ...orangeButtonSx, flexShrink: 0, ...(justSaved ? savedButtonSx : {}) }}>{justSaved ? <SavedTick label={copy.saved} /> : isNew ? copy.create : copy.save}</Button>
				</> : (
					<Button onClick={closeModal} sx={{ borderRadius: 0, height: 44, px: 3, bgcolor: ui.navy, color: '#fff', fontWeight: 600, flexShrink: 0, '&:hover': { bgcolor: '#031f4b' } }}>{copy.done}</Button>
				)}
			</Box>
		</Box>
	);

	const usageGroup = (
		<Box role='group' aria-label={copy.usage} sx={{ display: 'flex', flexShrink: 0, border: `1px solid ${ui.line}`, bgcolor: '#fff', width: { xs: '100%', sm: 'auto' } }}>
			{([ [ 'all', copy.all, counts.all ], [ 'used', copy.inRooms, counts.used ], [ 'unused', copy.notUsed, counts.unused ] ] as Array<[UsageFilter, string, number]>).map(([ key, label, n ], i) => {
				const on = usage === key;

				return (
					<ButtonBase
						key={key}
						aria-pressed={on}
						onClick={() => { setUsage(key); setLimit(PAGE); }}
						sx={{ flex: { xs: 1, sm: 'none' }, height: { xs: 42, sm: 38 }, px: 1.75, borderLeft: i ? `1px solid ${ui.line}` : 0, bgcolor: on ? ui.navy : '#fff', color: on ? '#fff' : ui.body, fontSize: 14, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap', '&:hover': { bgcolor: on ? ui.navy : ui.grey }, '&.Mui-focusVisible': focusRing }}
					>
						{label} {n}
					</ButtonBase>
				);
			})}
		</Box>
	);

	return <>
		<Box ref={listRef} component='section' aria-labelledby='mgmt-section-title' sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
			<Box sx={{ display: 'flex', alignItems: { xs: 'center', sm: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
				<Box sx={{ flexGrow: 1, minWidth: 0 }}>
					<Typography id='mgmt-section-title' component='h2' sx={{ m: 0, fontSize: { xs: 24, md: 28 }, lineHeight: { xs: '32px', md: '36px' }, fontWeight: 700, color: ui.orangeText }}>
						{groupsLabel()}
					</Typography>
					<Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 15, lineHeight: '22px', color: ui.muted }}>{copy.subtitle}</Typography>
				</Box>
				<ButtonBase
					onClick={openNew}
					sx={{ height: 44, gap: 1, pl: 1.75, pr: 2.5, bgcolor: ui.orange, color: ui.navy, fontSize: 15, fontWeight: 600, '&:hover': { bgcolor: ui.orangeHover }, '&.Mui-focusVisible': focusRing }}
				>
					<AddOutlinedIcon sx={{ fontSize: 20 }} />
					{copy.addGroup}
				</ButtonBase>
			</Box>

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
				{usageGroup}
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
					{!tableMode && <TextField
						select
						size='small'
						value={sortKey}
						onChange={(e) => setSortKey(e.target.value as SortKey)}
						slotProps={{ htmlInput: { 'aria-label': copy.sort }, input: { sx: squareInput } }}
						sx={{ flex: { xs: 1, sm: 'none' }, minWidth: 150 }}
					>
						<MenuItem value='name-asc'>{copy.sortNameAsc}</MenuItem>
						<MenuItem value='name-desc'>{copy.sortNameDesc}</MenuItem>
						<MenuItem value='members'>{copy.sortMembers}</MenuItem>
						<MenuItem value='newest'>{copy.sortNewest}</MenuItem>
						<MenuItem value='oldest'>{copy.sortOldest}</MenuItem>
					</TextField>}
					{!phone && viewToggle}
				</Box>
			</Box>

			{results}
			{visible.length > 0 && (
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
				paper: { 'aria-labelledby': panelTitleId, sx: { width: phone ? '100%' : 680, maxWidth: '100%', m: phone ? 0 : 2, height: phone ? '100%' : 'min(800px, calc(100% - 32px))', maxHeight: phone ? '100%' : 'calc(100% - 32px)', borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } },
			}}
		>
			{modal}
		</Dialog>
	</>;
};

export default GroupTable;
