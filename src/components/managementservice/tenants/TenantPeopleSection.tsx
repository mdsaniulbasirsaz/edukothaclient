import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Avatar, Box, Button, TextField } from '@mui/material';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import { TenantAdmins, TenantOwners, User } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getData } from '../../../store/actions/managementActions';
import { asNumber, ellipsis, initialsOf, str, ui } from '../users/userUi';
import { hiddenEmailLabel, hiddenNameLabel } from '../../translated/translatedComponents';
import { EmptyBox, SectionBody, SubHeading, orangeButtonSx, removeButtonSx, rowsOf, sameId } from './tenantShared';

const copy = {
	owners: 'Owners',
	admins: 'Admins',
	ownersHelp: 'Full control of this tenant, including sign-in, email and bots.',
	adminsHelp: 'Manage rooms, groups, roles and people.',
	addOwner: 'Add an owner',
	addAdmin: 'Add an admin',
	addPlaceholder: 'Type a name or email',
	add: 'Add',
	remove: 'Remove',
	removeFrom: (who: string, list: string) => `Remove ${who} from ${list}`,
	noOwners: 'No owner yet. Every tenant should have at least one.',
	noAdmins: 'No admins yet.',
	noMatch: 'No one matches.',
	everyone: 'Everyone in this tenant is already on this list.',
	foot: 'Adding or removing a person saves right away.',
	unknown: (id: number) => `User #${id}`,
} as const;

type Link = TenantOwners | TenantAdmins;
type Kind = 'tenantOwners' | 'tenantAdmins';

const userName = (u?: User) => str(u?.name) || str(u?.email) || hiddenNameLabel();

const TenantPeopleSection = ({ tenantId, onChanged }: { tenantId: number; onChanged: () => void }) => {
	const dispatch = useAppDispatch();
	const [ users, setUsers ] = useState<User[]>([]);
	const [ owners, setOwners ] = useState<Link[]>([]);
	const [ admins, setAdmins ] = useState<Link[]>([]);
	const [ busy, setBusy ] = useState(false);
	const [ pickOwner, setPickOwner ] = useState<User | null>(null);
	const [ pickAdmin, setPickAdmin ] = useState<User | null>(null);

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const fetchLinks = (kind: Kind) => dispatch(getData(kind)).then((t: any) => {
		if (t == undefined) return;
		const list = rowsOf<Link>(t).filter((l) => sameId(l.tenantId, tenantId));

		if (kind === 'tenantOwners') setOwners(list);
		else setAdmins(list);
	});

	useEffect(() => {
		dispatch(getData('users')).then((t: any) => { if (t != undefined) setUsers(rowsOf<User>(t)); });
		fetchLinks('tenantOwners');
		fetchLinks('tenantAdmins');
	}, [ tenantId ]);
	/* eslint-enable @typescript-eslint/no-explicit-any */

	const userById = useMemo(() => new Map(users.map((u) => [ asNumber(u.id), u ])), [ users ]);
	const tenantUsers = users
		.filter((u) => u.tenantId === undefined || u.tenantId === null || sameId(u.tenantId, tenantId))
		.sort((a, b) => userName(a).localeCompare(userName(b)));

	const add = async (kind: Kind, u: User | null) => {
		if (!u) return;
		setBusy(true);
		try {
			await dispatch(createData({ tenantId, userId: asNumber(u.id) }, kind));
			if (kind === 'tenantOwners') setPickOwner(null);
			else setPickAdmin(null);
			await fetchLinks(kind);
			onChanged();
		} finally {
			setBusy(false);
		}
	};
	const remove = async (kind: Kind, id: number) => {
		setBusy(true);
		try {
			await dispatch(deleteData(id, kind));
			await fetchLinks(kind);
			onChanged();
		} finally {
			setBusy(false);
		}
	};

	const column = (kind: Kind, title: string, help: string, addLabel: string, list: Link[], pick: User | null, setPick: (u: User | null) => void, empty: string, owner: boolean) => {
		const taken = new Set(list.map((l) => asNumber(l.userId)));
		const options = tenantUsers.filter((u) => !taken.has(asNumber(u.id)));
		const rows = list
			.map((l) => ({ link: l, user: userById.get(asNumber(l.userId)) }))
			.sort((a, b) => userName(a.user).localeCompare(userName(b.user)));

		return (
			<Box component='section' aria-label={title} sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
				<Box>
					<SubHeading count={list.length}>{title}</SubHeading>
					<Box sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{help}</Box>
				</Box>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Autocomplete
						fullWidth
						size='small'
						options={options}
						value={pick}
						onChange={(_e, v) => setPick(v)}
						getOptionLabel={(u) => userName(u)}
						isOptionEqualToValue={(a, b) => sameId(a.id, b.id)}
						filterOptions={(opts, state) => {
							const q = state.inputValue.trim().toLowerCase();

							return (q ? opts.filter((u) => `${str(u.name)} ${str(u.email)}`.toLowerCase().includes(q)) : opts).slice(0, 50);
						}}
						noOptionsText={options.length ? copy.noMatch : copy.everyone}
						renderOption={(props, u) => {
							const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: React.Key };

							return (
								<Box component='li' key={key} {...rest} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important' }}>
									<Box component='span' sx={{ fontSize: 14, fontWeight: 600, color: ui.navy }}>{userName(u)}</Box>
									<Box component='span' sx={{ fontSize: 12, color: ui.muted }}>{str(u.email) || hiddenEmailLabel()}</Box>
								</Box>
							);
						}}
						renderInput={(params) => (
							<TextField {...params} placeholder={copy.addPlaceholder} slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps.htmlInput, 'aria-label': addLabel }, input: { ...params.slotProps.input, sx: { borderRadius: 0, minHeight: 42 } } }} />
						)}
					/>
					<Button onClick={() => add(kind, pick)} disabled={!pick || busy} sx={{ ...orangeButtonSx, height: 42, flexShrink: 0 }}>{copy.add}</Button>
				</Box>
				{rows.length === 0 ? <EmptyBox>{empty}</EmptyBox> : (
					<Box component='ul' aria-label={title} sx={{ listStyle: 'none', m: 0, p: 0, borderTop: `1px solid ${ui.lineSoft}` }}>
						{rows.map(({ link, user }) => {
							const who = user ? userName(user) : copy.unknown(asNumber(link.userId));

							return (
								<Box component='li' key={link.id} sx={{ minHeight: 56, borderBottom: `1px solid ${ui.lineSoft}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
									<Avatar variant='square' src={str(user?.avatar) || undefined} alt='' sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: owner ? ui.navy : ui.blueLight, color: owner ? '#fff' : ui.blueDark }}>{initialsOf(str(user?.name), str(user?.email))}</Avatar>
									<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
										<Box component='span' sx={{ fontSize: 15, lineHeight: '20px', fontWeight: 600, color: ui.navy, ...ellipsis }}>{who}</Box>
										<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted, ...ellipsis }}>{str(user?.email) || hiddenEmailLabel()}</Box>
									</Box>
									<Button variant='outlined' size='small' startIcon={<RemoveOutlinedIcon />} disabled={busy} aria-label={copy.removeFrom(who, title.toLowerCase())} onClick={() => remove(kind, asNumber(link.id))} sx={{ ...removeButtonSx, flexShrink: 0 }}>{copy.remove}</Button>
								</Box>
							);
						})}
					</Box>
				)}
			</Box>
		);
	};

	return (
		<SectionBody status={copy.foot}>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }, gap: { xs: 3, lg: 3.5 } }}>
				{column('tenantOwners', copy.owners, copy.ownersHelp, copy.addOwner, owners, pickOwner, setPickOwner, copy.noOwners, true)}
				{column('tenantAdmins', copy.admins, copy.adminsHelp, copy.addAdmin, admins, pickAdmin, setPickAdmin, copy.noAdmins, false)}
			</Box>
		</SectionBody>
	);
};

export default TenantPeopleSection;
