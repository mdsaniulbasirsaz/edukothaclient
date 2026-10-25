import { useEffect, useState } from 'react';
import { Box, Button, IconButton, TextField } from '@mui/material';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { TenantFQDN } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getDataByTenantID, patchData } from '../../../store/actions/managementActions';
import { asNumber, ellipsis, ui } from '../users/userUi';
import { EmptyBox, SectionBody, fieldProps, monoInput, orangeButtonSx, rowsOf } from './tenantShared';

const copy = {
	address: 'Web address',
	addressHelp: 'For example meet.example.edu.bd, without https://',
	note: 'Note (optional)',
	add: 'Add',
	save: 'Save',
	cancel: 'Cancel',
	edit: (f: string) => `Edit the note for ${f}`,
	remove: (f: string) => `Remove ${f}`,
	empty: 'No web address yet. Add the address people open to reach this tenant.',
	invalid: 'Type a host name like meet.example.edu.bd',
	exists: 'This address is already in the list.',
	foot: 'Adding or removing an address saves right away.',
} as const;

// A host name: letters, digits and dashes in dot-separated parts.
const hostOk = (v: string) => /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(v);
const cleanHost = (v: string) => v.trim().replace(/^https?:\/\//i, '')
	.replace(/\/.*$/, '')
	.toLowerCase();

const TenantDomainsSection = ({ tenantId, onChanged }: { tenantId: number; onChanged: () => void }) => {
	const dispatch = useAppDispatch();
	const [ rows, setRows ] = useState<TenantFQDN[]>([]);
	const [ fqdn, setFqdn ] = useState('');
	const [ note, setNote ] = useState('');
	const [ busy, setBusy ] = useState(false);
	const [ editId, setEditId ] = useState<number | null>(null);
	const [ editNote, setEditNote ] = useState('');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fetchRows = () => dispatch(getDataByTenantID(tenantId, 'tenantFQDNs')).then((t: any) => { if (t != undefined) setRows(rowsOf<TenantFQDN>(t)); });

	useEffect(() => {
		fetchRows();
	}, [ tenantId ]);

	const host = cleanHost(fqdn);
	const exists = rows.some((r) => r.fqdn.toLowerCase() === host);
	const invalid = fqdn.trim() !== '' && !hostOk(host);
	const canAdd = host !== '' && !invalid && !exists && !busy;

	const add = async () => {
		if (!canAdd) return;
		setBusy(true);
		try {
			await dispatch(createData({ tenantId, fqdn: host, description: note.trim() }, 'tenantFQDNs'));
			setFqdn('');
			setNote('');
			await fetchRows();
			onChanged();
		} finally {
			setBusy(false);
		}
	};
	const remove = async (id: number) => {
		setBusy(true);
		try {
			await dispatch(deleteData(id, 'tenantFQDNs'));
			await fetchRows();
			onChanged();
		} finally {
			setBusy(false);
		}
	};
	const saveNote = async () => {
		if (editId === null) return;
		setBusy(true);
		try {
			await dispatch(patchData(editId, { description: editNote.trim() }, 'tenantFQDNs'));
			setEditId(null);
			await fetchRows();
		} finally {
			setBusy(false);
		}
	};

	return (
		<SectionBody status={copy.foot}>
			<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' }, maxWidth: 880 }}>
				<TextField
					label={copy.address}
					value={fqdn}
					onChange={(e) => setFqdn(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
					error={invalid || exists}
					helperText={invalid ? copy.invalid : exists ? copy.exists : copy.addressHelp}
					sx={{ width: { xs: '100%', md: 320 } }}
					{...monoInput}
				/>
				<TextField label={copy.note} value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} sx={{ flexGrow: 1, width: { xs: '100%', md: 'auto' } }} {...fieldProps} />
				<Button onClick={add} disabled={!canAdd} sx={{ ...orangeButtonSx, height: 56, width: { xs: '100%', md: 'auto' } }}>{copy.add}</Button>
			</Box>
			{rows.length === 0 ? <EmptyBox>{copy.empty}</EmptyBox> : (
				<Box component='ul' aria-label={copy.address} sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 880 }}>
					{rows.map((r) => (
						<Box component='li' key={r.id} sx={{ minHeight: 60, px: 1.75, py: 1.25, border: `1px solid ${ui.line}`, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
							<LanguageOutlinedIcon aria-hidden sx={{ color: ui.blueDark }} />
							<Box sx={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
								<Box component='span' sx={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 15, fontWeight: 600, color: ui.navy, overflowWrap: 'anywhere' }}>{r.fqdn}</Box>
								{editId === asNumber(r.id) ? (
									<Box sx={{ mt: 0.75, display: 'flex', gap: 1 }}>
										<TextField size='small' autoFocus value={editNote} onChange={(e) => setEditNote(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveNote(); if (e.key === 'Escape') { e.stopPropagation(); setEditId(null); } }} slotProps={{ htmlInput: { 'aria-label': copy.note }, input: { sx: { borderRadius: 0 } } }} sx={{ flexGrow: 1 }} />
										<Button variant='outlined' onClick={() => setEditId(null)} sx={{ borderRadius: 0 }}>{copy.cancel}</Button>
										<Button onClick={saveNote} disabled={busy} sx={{ ...orangeButtonSx, height: 40 }}>{copy.save}</Button>
									</Box>
								) : r.description ? <Box component='span' sx={{ fontSize: 13, color: ui.muted, ...ellipsis }}>{r.description}</Box> : null}
							</Box>
							{editId !== asNumber(r.id) && (
								<IconButton aria-label={copy.edit(r.fqdn)} onClick={() => { setEditId(asNumber(r.id)); setEditNote(r.description ?? ''); }} sx={{ width: 40, height: 40, borderRadius: 0, border: `1px solid ${ui.line}`, color: ui.body }}>
									<EditOutlinedIcon sx={{ fontSize: 20 }} />
								</IconButton>
							)}
							<IconButton aria-label={copy.remove(r.fqdn)} onClick={() => remove(asNumber(r.id))} disabled={busy} sx={{ width: 40, height: 40, borderRadius: 0, border: `1px solid ${ui.line}`, color: ui.body, '&:hover': { bgcolor: '#fdecec', color: '#b42318' } }}>
								<DeleteOutlineOutlinedIcon sx={{ fontSize: 20 }} />
							</IconButton>
						</Box>
					))}
				</Box>
			)}
		</SectionBody>
	);
};

export default TenantDomainsSection;
