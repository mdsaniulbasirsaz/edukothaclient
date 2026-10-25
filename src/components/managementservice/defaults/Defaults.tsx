import { useEffect, useMemo, useState } from 'react';
import { Box, Button, ButtonBase, IconButton, InputAdornment, MenuItem, Skeleton, Switch, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Default, Roles, Tenant } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { managamentActions } from '../../../store/slices/managementSlice';
import { asNumber, focusRing, str, ui } from '../users/userUi';
import {
	cancelLabel, defaultSettingsLabel, tenantLabel, trackerHelperTextLabel,
} from '../../translated/translatedComponents';
import { EmptyBox, SavedNote, dangerOutlinedSx, fieldProps, monoInput, orangeButtonSx, rowsOf, sameId, switchSx } from '../tenants/tenantShared';
import { SavedTick, savedButtonSx, useJustSaved } from '../motion';

// Defaults screen (user request 2026-10-17, same look as Tenants): one settings
// record per tenant, shown as a page instead of a table + dialog. Pick a
// tenant, then edit Room limits, Rooms made on the fly (the "unmanaged" room
// switches, each with a super-admin lock) and Room look & files, with one Save.
// The record, its fields and who may change what are unchanged: the tenant-wide
// room limits and the locks are super admin only, and a locked switch can only
// be changed by a super admin.

type Flag = 'disableUnmanaged' | 'endToEndEncryption' | 'locked' | 'raiseHandEnabled' | 'reactionsEnabled' | 'localRecordingEnabled' | 'chatEnabled' | 'breakoutsEnabled' | 'filesharingEnabled';

// value field + lock field of each switch, as stored
const FLAGS: Array<{ key: Flag; value: string; lock: string; title: string; desc: () => string }> = [
	{ key: 'disableUnmanaged', value: 'disableUnmanaged', lock: 'disableUnmanagedLock', title: 'Turn off rooms made on the fly', desc: () => 'Only rooms an admin created can be used.' },
	{ key: 'endToEndEncryption', value: 'endToEndEncryption', lock: 'endToEndEncryptionLock', title: 'End-to-end encryption', desc: () => 'Media is encrypted end to end. Lock it to keep it on in every room.' },
	{ key: 'locked', value: 'lockedUnmanaged', lock: 'lockedLock', title: 'Start rooms locked', desc: () => 'The first signed-in person gets in; everyone else waits in the lobby.' },
	{ key: 'raiseHandEnabled', value: 'raiseHandEnabledUnmanaged', lock: 'raiseHandEnabledLock', title: 'Raise hand', desc: () => 'People can raise a hand to ask to speak.' },
	{ key: 'reactionsEnabled', value: 'reactionsEnabledUnmanaged', lock: 'reactionsEnabledLock', title: 'Reactions', desc: () => 'People can send quick emoji reactions.' },
	{ key: 'localRecordingEnabled', value: 'localRecordingEnabledUnmanaged', lock: 'localRecordingEnabledLock', title: 'Record on own device', desc: () => 'People can record the meeting on their own computer.' },
	{ key: 'chatEnabled', value: 'chatEnabledUnmanaged', lock: 'chatEnabledLock', title: 'Chat', desc: () => 'The room has a text chat.' },
	{ key: 'breakoutsEnabled', value: 'breakoutsEnabledUnmanaged', lock: 'breakoutsEnabledLock', title: 'Breakout rooms', desc: () => 'Moderators can split the meeting into small rooms.' },
	{ key: 'filesharingEnabled', value: 'filesharingEnabledUnmanaged', lock: 'filesharingEnabledLock', title: 'File sharing', desc: () => 'People can share files in the room.' },
];

const copy = {
	subtitle: 'Limits and starting settings for rooms in each tenant.',
	tenant: tenantLabel,
	noDefaults: (t: string) => `${t} has no defaults yet. Rooms use the server's settings until you create them.`,
	create: 'Create defaults',
	limits: 'Room limits',
	limitsHelp: 'How many rooms people can have in this tenant.',
	numberLimit: 'Rooms in the whole tenant',
	userLimit: 'Rooms one person can own',
	managerLimit: 'Rooms one manager can own',
	superOnly: 'Only a super admin can change this.',
	adhoc: 'Rooms made on the fly',
	adhocHelp: 'Rooms that people open just by going to a room name, without an admin creating them first ("unmanaged" rooms).',
	on: 'On',
	off: 'Off',
	lock: (t: string) => `Lock "${t}" so tenant admins can't change it`,
	unlock: (t: string) => `Unlock "${t}"`,
	lockedBySuper: 'Locked by a super admin',
	lockHelp: 'A locked switch can only be changed by a super admin.',
	look: 'Room look & files',
	lookHelp: 'What new rooms look like, and limits for shared files.',
	tracker: 'Tracker address',
	maxFile: 'Largest file people can share',
	background: 'Background image URL',
	logo: 'Logo image URL',
	defaultRole: 'Default role in new rooms',
	noRole: 'No default role',
	preview: 'Preview',
	save: 'Save',
	saved: 'Saved',
	foot: 'Nothing changes until you press Save.',
	deleteDefaults: 'Delete defaults',
	deleteConfirm: 'Yes, delete',
	deleteHelp: 'Rooms go back to the server settings.',
	switchFor: (t: string) => t,
} as const;

type Form = {
	numberLimit: number; userManagedRoomNumberLimit: number; managerManagedRoomNumberLimit: number; liveNumberLimit: number;
	tracker: string; maxFileSize: number; background: string; logo: string; defaultRoleId: number;
	flags: Record<string, boolean>;
};

const num = (v: unknown, fallback: number) => {
	const n = parseInt(String(v ?? ''));

	return Number.isNaN(n) ? fallback : n;
};
const formOf = (d: Default): Form => {
	const raw = d as unknown as Record<string, unknown>;
	const flags: Record<string, boolean> = {};

	FLAGS.forEach((f) => { flags[f.value] = Boolean(raw[f.value]); flags[f.lock] = Boolean(raw[f.lock]); });

	return {
		numberLimit: num(d.numberLimit, 100),
		userManagedRoomNumberLimit: num(d.userManagedRoomNumberLimit, 1000),
		managerManagedRoomNumberLimit: num(d.managerManagedRoomNumberLimit, 1000),
		liveNumberLimit: num(d.liveNumberLimit, 1000) || 1000,
		tracker: str(raw.tracker),
		maxFileSize: num(raw.maxFileSize, 100),
		background: str(raw.background),
		logo: str(raw.logo),
		defaultRoleId: num(raw.defaultRoleId, 0),
		flags,
	};
};
const sameForm = (a: Form, b: Form) => JSON.stringify(a) === JSON.stringify(b);

const DefaultTable = () => {
	const dispatch = useAppDispatch();
	const { superAdmin } = useAppSelector((state) => state.management);
	const tenants: Tenant[] = useAppSelector((state) => state.management.tenants) ?? [];
	const roles: Roles[] = useAppSelector((state) => state.management.roles) ?? [];
	const phone = useMediaQuery('(max-width: 599.95px)');

	const [ rows, setRows ] = useState<Default[]>([]);
	const [ loaded, setLoaded ] = useState(false);
	const [ tenantId, setTenantId ] = useState<number>(0);

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const fetchRows = () => dispatch(getData('defaults')).then((t: any) => { if (t != undefined) setRows(rowsOf<Default>(t)); });

	useEffect(() => {
		Promise.all([
			fetchRows(),
			dispatch(getData('tenants')).then((t: any) => { if (t != undefined) dispatch(managamentActions.setTenants(rowsOf<Tenant>(t))); }),
			dispatch(getData('roles')).then((t: any) => { if (t != undefined) dispatch(managamentActions.setRoles(rowsOf<Roles>(t))); }),
		]).finally(() => setLoaded(true));
	}, []);
	/* eslint-enable @typescript-eslint/no-explicit-any */

	// Start on the first tenant once they are in.
	useEffect(() => {
		if (!tenantId && tenants.length) setTenantId(asNumber(tenants[0].id));
	}, [ tenants ]);

	const record = rows.find((r) => sameId(r.tenantId, tenantId)) ?? null;
	const tenant = tenants.find((t) => sameId(t.id, tenantId)) ?? null;

	const [ form, setForm ] = useState<Form | null>(null);
	const [ base, setBase ] = useState<Form | null>(null);
	const [ busy, setBusy ] = useState(false);
	const [ savedAt, setSavedAt ] = useState(0);
	const justSaved = useJustSaved(savedAt);
	const [ confirmDelete, setConfirmDelete ] = useState(false);

	useEffect(() => {
		const f = record ? formOf(record) : null;

		setForm(f);
		setBase(f);
		setSavedAt(0);
		setConfirmDelete(false);
	}, [ record?.id, tenantId, loaded ]);

	const dirty = Boolean(form && base && !sameForm(form, base));
	const set = (patch: Partial<Form>) => { setForm((f) => (f ? { ...f, ...patch } : f)); setSavedAt(0); };
	const setFlag = (k: string, v: boolean) => { setForm((f) => (f ? { ...f, flags: { ...f.flags, [k]: v } } : f)); setSavedAt(0); };

	const tenantRoles = useMemo(() => roles.filter((r) => sameId(r.tenantId, tenantId) || (form && sameId(r.id, form.defaultRoleId))), [ roles, tenantId, form?.defaultRoleId ]);
	const numbersOk = Boolean(form && [ form.numberLimit, form.userManagedRoomNumberLimit, form.managerManagedRoomNumberLimit, form.maxFileSize ].every((n) => Number.isFinite(n) && n >= 0));
	const canSave = dirty && numbersOk && !busy;

	const create = async () => {
		if (!tenantId) return;
		setBusy(true);
		try {
			await dispatch(createData({ tenantId }, 'defaults'));
			await fetchRows();
		} finally {
			setBusy(false);
		}
	};
	const save = async () => {
		if (!form || !record || !canSave) return;
		setBusy(true);
		try {
			await dispatch(patchData(asNumber(record.id), {
				tenantId,
				numberLimit: form.numberLimit,
				liveNumberLimit: form.liveNumberLimit,
				userManagedRoomNumberLimit: form.userManagedRoomNumberLimit,
				managerManagedRoomNumberLimit: form.managerManagedRoomNumberLimit,
				...form.flags,
				tracker: form.tracker.trim(),
				maxFileSize: form.maxFileSize,
				background: form.background.trim(),
				logo: form.logo.trim(),
				defaultRoleId: form.defaultRoleId,
			}, 'defaults'));
			await fetchRows();
			setBase(form);
			setSavedAt(Date.now());
		} finally {
			setBusy(false);
		}
	};
	const remove = async () => {
		if (!record) return;
		if (!confirmDelete) {
			setConfirmDelete(true);

			return;
		}
		setBusy(true);
		try {
			await dispatch(deleteData(asNumber(record.id), 'defaults'));
			await fetchRows();
		} finally {
			setBusy(false);
			setConfirmDelete(false);
		}
	};

	// ----- Pieces -----
	const card = (title: string, help: string, children: React.ReactNode) => (
		<Box component='section' aria-label={title} sx={{ bgcolor: '#fff', border: `1px solid ${ui.line}`, minWidth: 0 }}>
			<Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1.5, borderBottom: `1px solid ${ui.lineSoft}` }}>
				<Typography component='h3' sx={{ m: 0, fontSize: 18, lineHeight: '24px', fontWeight: 700, color: ui.navy }}>{title}</Typography>
				<Typography sx={{ fontSize: 14, lineHeight: '20px', color: ui.muted }}>{help}</Typography>
			</Box>
			<Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>{children}</Box>
		</Box>
	);

	const numberField = (k: 'numberLimit' | 'userManagedRoomNumberLimit' | 'managerManagedRoomNumberLimit', label: string, superOnly: boolean) => {
		const locked = superOnly && !superAdmin;

		return (
			<TextField
				label={label}
				type='number'
				size='small'
				value={form ? form[k] : ''}
				disabled={locked}
				onChange={(e) => set({ [k]: parseInt(e.target.value) } as Partial<Form>)}
				error={Boolean(form && !(form[k] >= 0))}
				helperText={locked ? copy.superOnly : ' '}
				slotProps={{ htmlInput: { min: 0 }, input: { sx: { borderRadius: 0, bgcolor: '#fff' }, endAdornment: locked ? <InputAdornment position='end'><LockOutlinedIcon sx={{ fontSize: 18, color: ui.slateDot }} /></InputAdornment> : undefined } }}
			/>
		);
	};

	const flagRow = (f: typeof FLAGS[number]) => {
		if (!form) return null;
		const on = form.flags[f.value];
		const locked = form.flags[f.lock];
		const blocked = locked && !superAdmin;

		return (
			<Box component='li' key={f.key} sx={{ minHeight: 64, py: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', alignItems: 'center', columnGap: 1.5, borderBottom: `1px solid ${ui.lineSoft}` }}>
				<Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
					<Box component='span' sx={{ fontSize: 15, lineHeight: '20px', fontWeight: 600, color: ui.navy }}>{f.title}</Box>
					<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{f.desc()}</Box>
					{blocked && <Box component='span' sx={{ mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 12, fontWeight: 600, color: ui.slate }}><LockOutlinedIcon sx={{ fontSize: 14 }} />{copy.lockedBySuper}</Box>}
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Box component='span' aria-hidden sx={{ width: 26, textAlign: 'right', fontSize: 13, fontWeight: 600, color: on ? ui.blueDark : ui.muted }}>{on ? copy.on : copy.off}</Box>
					<Switch checked={on} disabled={blocked} onChange={(_e, v) => setFlag(f.value, v)} slotProps={{ input: { 'aria-label': copy.switchFor(f.title) } }} sx={switchSx} />
				</Box>
				{superAdmin ? (
					<Tooltip title={locked ? copy.unlock(f.title) : copy.lock(f.title)}>
						<IconButton aria-pressed={locked} aria-label={copy.lock(f.title)} onClick={() => setFlag(f.lock, !locked)} sx={{ width: 40, height: 40, borderRadius: 0, border: `1px solid ${locked ? ui.navy : ui.line}`, bgcolor: locked ? ui.navy : '#fff', color: locked ? '#fff' : ui.slate, '&:hover': { bgcolor: locked ? ui.navy : ui.grey }, '&.Mui-focusVisible': focusRing }}>
							{locked ? <LockOutlinedIcon sx={{ fontSize: 20 }} /> : <LockOpenOutlinedIcon sx={{ fontSize: 20 }} />}
						</IconButton>
					</Tooltip>
				) : <Box sx={{ width: 0 }} />}
			</Box>
		);
	};

	const imgPreview = (url: string, wide: boolean) => (url.trim() ? (
		<Box sx={{ mt: 0.75, width: wide ? 160 : 64, height: wide ? 90 : 64, border: `1px solid ${ui.line}`, bgcolor: ui.grey, backgroundImage: `url("${url.trim().replace(/"/g, '%22')}")`, backgroundSize: wide ? 'cover' : 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }} role='img' aria-label={copy.preview} />
	) : null);

	const tenantPicker = tenants.length > 1 && (
		phone || tenants.length > 6 ? (
			<TextField select label={copy.tenant()} size='small' value={tenantId || ''} onChange={(e) => setTenantId(asNumber(e.target.value))} sx={{ width: { xs: '100%', sm: 320 } }} {...fieldProps}>
				{tenants.map((t) => <MenuItem key={t.id} value={asNumber(t.id)}>{t.name}{rows.some((r) => sameId(r.tenantId, t.id)) ? '' : ' · no defaults'}</MenuItem>)}
			</TextField>
		) : (
			<Box role='group' aria-label={copy.tenant()} sx={{ display: 'flex', flexWrap: 'wrap', border: `1px solid ${ui.line}`, bgcolor: '#fff', alignSelf: 'flex-start' }}>
				{tenants.map((t, i) => {
					const on = sameId(t.id, tenantId);
					const has = rows.some((r) => sameId(r.tenantId, t.id));

					return (
						<ButtonBase key={t.id} aria-pressed={on} onClick={() => setTenantId(asNumber(t.id))} sx={{ height: 40, px: 2, gap: 0.75, borderLeft: i ? `1px solid ${ui.line}` : 0, bgcolor: on ? ui.navy : '#fff', color: on ? '#fff' : ui.body, fontSize: 14, fontWeight: on ? 600 : 400, '&:hover': { bgcolor: on ? ui.navy : ui.grey }, '&.Mui-focusVisible': focusRing }}>
							{t.name}
							{!has && <Box component='span' sx={{ fontSize: 12, color: on ? '#fbd38d' : ui.orangeText }}>●</Box>}
						</ButtonBase>
					);
				})}
			</Box>
		)
	);

	return (
		<Box component='section' aria-labelledby='mgmt-section-title' sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
			<Box sx={{ minWidth: 0 }}>
				<Typography id='mgmt-section-title' component='h2' sx={{ m: 0, fontSize: { xs: 24, md: 28 }, lineHeight: { xs: '32px', md: '36px' }, fontWeight: 700, color: ui.orangeText }}>{defaultSettingsLabel()}</Typography>
				<Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 15, lineHeight: '22px', color: ui.muted }}>{copy.subtitle}</Typography>
			</Box>

			{tenantPicker}

			{!loaded ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{[ 0, 1 ].map((i) => <Skeleton key={i} variant='rectangular' height={200} sx={{ borderRadius: 0 }} />)}</Box>
			) : !record || !form ? (
				<EmptyBox>
					<Box sx={{ mb: 1.5 }}>{copy.noDefaults(tenant?.name ?? '')}</Box>
					<Button startIcon={<AddOutlinedIcon />} onClick={create} disabled={busy || !tenantId} sx={orangeButtonSx}>{copy.create}</Button>
				</EmptyBox>
			) : <>
				{card(copy.limits, copy.limitsHelp, (
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
						{numberField('numberLimit', copy.numberLimit, true)}
						{numberField('userManagedRoomNumberLimit', copy.userLimit, false)}
						{numberField('managerManagedRoomNumberLimit', copy.managerLimit, true)}
					</Box>
				))}

				{card(copy.adhoc, copy.adhocHelp, <>
					<Box component='ul' aria-label={copy.adhoc} sx={{ listStyle: 'none', m: 0, p: 0, borderTop: `1px solid ${ui.lineSoft}`, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }, columnGap: 4 }}>
						{FLAGS.map(flagRow)}
					</Box>
					<Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 13, color: ui.muted }}><LockOutlinedIcon sx={{ fontSize: 16 }} />{copy.lockHelp}</Box>
				</>)}

				{card(copy.look, copy.lookHelp, (
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' }, gap: 2 }}>
						<TextField label={copy.tracker} size='small' value={form.tracker} placeholder='wss://tracker.example.edu.bd/path' onChange={(e) => set({ tracker: e.target.value })} helperText={form.tracker.trim() ? ' ' : trackerHelperTextLabel()} {...monoInput} />
						<TextField label={copy.maxFile} type='number' size='small' value={form.maxFileSize} onChange={(e) => set({ maxFileSize: parseInt(e.target.value) })} error={!(form.maxFileSize >= 0)} helperText=' ' slotProps={{ htmlInput: { min: 0 }, input: { sx: { borderRadius: 0, bgcolor: '#fff' }, endAdornment: <InputAdornment position='end'>MB</InputAdornment> } }} />
						<Box sx={{ minWidth: 0 }}>
							<TextField label={copy.background} type='url' size='small' fullWidth value={form.background} placeholder='https://' onChange={(e) => set({ background: e.target.value })} {...monoInput} />
							{imgPreview(form.background, true)}
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<TextField label={copy.logo} type='url' size='small' fullWidth value={form.logo} placeholder='https://' onChange={(e) => set({ logo: e.target.value })} {...monoInput} />
							{imgPreview(form.logo, false)}
						</Box>
						<TextField select label={copy.defaultRole} size='small' value={tenantRoles.some((r) => sameId(r.id, form.defaultRoleId)) ? form.defaultRoleId : 0} onChange={(e) => set({ defaultRoleId: asNumber(e.target.value) })} sx={{ gridColumn: { md: '1 / 2' } }} {...fieldProps}>
							<MenuItem value={0}>{copy.noRole}</MenuItem>
							{tenantRoles.map((r) => <MenuItem key={r.id} value={asNumber(r.id)}>{r.name}</MenuItem>)}
						</TextField>
					</Box>
				))}

				<Box sx={{ position: 'sticky', bottom: 0, zIndex: 2, px: { xs: 2, sm: 3 }, py: 1.25, bgcolor: '#fff', border: `1px solid ${ui.line}`, borderTop: `3px solid ${dirty ? ui.orange : ui.line}`, display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
					{confirmDelete
						? <><Button variant='outlined' onClick={() => setConfirmDelete(false)} sx={{ borderRadius: 0, height: 44 }}>{cancelLabel()}</Button><Button variant='contained' onClick={remove} disabled={busy} sx={{ borderRadius: 0, height: 44, boxShadow: 'none', bgcolor: '#b42318', '&:hover': { bgcolor: '#8f1d14' } }}>{copy.deleteConfirm}</Button><Box component='span' sx={{ fontSize: 13, color: ui.muted }}>{copy.deleteHelp}</Box></>
						: <Button variant='outlined' startIcon={<DeleteOutlineOutlinedIcon />} onClick={remove} disabled={busy} sx={{ ...dangerOutlinedSx, height: 44 }}>{copy.deleteDefaults}</Button>}
					<Box role='status' aria-live='polite' sx={{ flexGrow: 1, minWidth: 0, fontSize: 13, color: ui.muted, display: { xs: 'none', sm: 'block' } }}>
						{savedAt && !dirty ? <SavedNote text={copy.saved} /> : copy.foot}
					</Box>
					{dirty && <Button variant='outlined' onClick={() => setForm(base)} sx={{ borderRadius: 0, height: 44 }}>{cancelLabel()}</Button>}
					<Button onClick={save} disabled={!canSave} sx={{ ...orangeButtonSx, ...(justSaved ? savedButtonSx : {}) }}>{justSaved ? <SavedTick label={copy.saved} /> : copy.save}</Button>
				</Box>
			</>}
		</Box>
	);
};

export default DefaultTable;
