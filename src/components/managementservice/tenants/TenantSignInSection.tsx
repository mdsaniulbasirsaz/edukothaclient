/* eslint-disable camelcase */
import { useEffect, useState } from 'react';
import { Box, Button, ButtonBase, Collapse, TextField } from '@mui/material';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { TenantOAuth } from '../../../utils/types';
import edumeetConfig from '../../../utils/edumeetConfig';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getDataByTenantID, patchData } from '../../../store/actions/managementActions';
import { notificationsActions } from '../../../store/slices/notificationsSlice';
import { asNumber, focusRing, ui } from '../users/userUi';
import { SavedNote, SectionBody, dangerOutlinedSx, fieldProps, monoInput, orangeButtonSx, outlinedBlueSx, rowsOf } from './tenantShared';
import { SavedTick, savedButtonSx, useJustSaved } from '../motion';

const copy = {
	connected: 'Single sign-on is set up.',
	connectedHelp: 'People of this tenant sign in with this provider.',
	notSet: 'Single sign-on is not set up yet.',
	notSetHelp: 'Paste your provider’s discovery URL and press "Fill in from URL", then add the client ID and secret.',
	provider: (n: number) => `Provider ${n}`,
	providers: 'Providers',
	addProvider: '+ Add another provider',
	wellKnown: 'Provider discovery URL (.well-known/openid-configuration)',
	fill: 'Fill in from URL',
	filled: (n: number) => `Filled in ${n} ${n === 1 ? 'address' : 'addresses'} from the provider.`,
	clientId: 'Client ID',
	secret: 'Client secret',
	keyNote: 'The client ID and secret are kept on the server and can’t be shown. To change them, remove this provider and add it again.',
	advancedShow: 'Show advanced settings',
	advancedHide: 'Hide advanced settings',
	authorize: 'Authorize URL',
	access: 'Access token URL',
	profile: 'Profile (userinfo) URL',
	redirect: 'Redirect URL',
	scope: 'Scope',
	delimiter: 'Scope delimiter',
	endSession: 'End session (logout) URL',
	nameParam: 'Name field in the profile',
	required: 'Required',
	save: 'Save',
	create: 'Set up sign-in',
	cancel: 'Cancel',
	remove: 'Remove this provider',
	removeConfirm: 'Yes, remove',
	saved: 'Saved',
	foot: 'Nothing changes until you press Save.',
} as const;

type Form = { key: string; secret: string; access_url: string; authorize_url: string; profile_url: string; redirect_uri: string; scope: string; scope_delimiter: string; end_session_endpoint: string; name_parameter: string };

const blankForm = (): Form => {
	const mgmtBase = (edumeetConfig.managementUrl ?? 'https://edumeet.example.com/mgmt').replace(/\/$/, '');

	return { key: '', secret: '', access_url: '', authorize_url: '', profile_url: '', redirect_uri: `${mgmtBase}/oauth/tenant/callback`, scope: 'openid profile email', scope_delimiter: ' ', end_session_endpoint: '', name_parameter: 'name' };
};
const formOf = (p: TenantOAuth & { end_session_endpoint?: string; name_parameter?: string }): Form => ({
	key: '',
	secret: '',
	access_url: p.access_url ?? '',
	authorize_url: p.authorize_url ?? '',
	profile_url: p.profile_url ?? '',
	redirect_uri: p.redirect_uri ?? '',
	scope: p.scope ?? '',
	scope_delimiter: p.scope_delimiter ?? '',
	end_session_endpoint: p.end_session_endpoint ?? '',
	name_parameter: p.name_parameter ?? '',
});

const TenantSignInSection = ({ tenantId, onChanged }: { tenantId: number; onChanged: () => void }) => {
	const dispatch = useAppDispatch();
	const [ providers, setProviders ] = useState<TenantOAuth[]>([]);
	const [ loaded, setLoaded ] = useState(false);
	// The provider being edited; 0 is a new one.
	const [ currentId, setCurrentId ] = useState(0);
	const [ form, setForm ] = useState<Form>(blankForm());
	const [ base, setBase ] = useState<Form>(blankForm());
	const [ wellKnown, setWellKnown ] = useState('');
	const [ filledNote, setFilledNote ] = useState('');
	const [ advanced, setAdvanced ] = useState(false);
	const [ busy, setBusy ] = useState(false);
	const [ savedAt, setSavedAt ] = useState(0);
	const justSaved = useJustSaved(savedAt);
	const [ confirmRemove, setConfirmRemove ] = useState(false);

	const pick = (p: TenantOAuth | null) => {
		const f = p ? formOf(p) : blankForm();

		setCurrentId(p ? asNumber(p.id) : 0);
		setForm(f);
		setBase(f);
		setWellKnown('');
		setFilledNote('');
		setConfirmRemove(false);
		setAdvanced(!p);
	};

	const fetchRows = async (selectId?: number) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const t: any = await dispatch(getDataByTenantID(tenantId, 'tenantOAuths'));

		if (t == undefined) return;
		const list = rowsOf<TenantOAuth>(t);

		setProviders(list);
		setLoaded(true);
		pick(list.find((p) => asNumber(p.id) === selectId) ?? list[0] ?? null);
	};

	useEffect(() => {
		fetchRows();
	}, [ tenantId ]);

	const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => { setForm((f) => ({ ...f, [k]: e.target.value })); setSavedAt(0); };
	const isNew = currentId === 0;
	const dirty = (Object.keys(form) as Array<keyof Form>).some((k) => form[k] !== base[k]);
	const missing = !form.authorize_url.trim() || !form.access_url.trim() || !form.profile_url.trim() || (isNew && !form.key.trim());
	const canSave = dirty && !missing && !busy;

	const fill = () => {
		fetch(wellKnown.trim()).then(async (response) => {
			if (!response.ok) {
				dispatch(notificationsActions.enqueueNotification({ message: response.statusText.toString() || `HTTP ${response.status}`, options: { variant: 'error' } }));

				return;
			}
			const json = await response.json();
			const next: Partial<Form> = {};

			if (json.token_endpoint != null) next.access_url = json.token_endpoint;
			if (json.authorization_endpoint != null) next.authorize_url = json.authorization_endpoint;
			if (json.userinfo_endpoint != null) next.profile_url = json.userinfo_endpoint;
			if (json.end_session_endpoint != null) next.end_session_endpoint = json.end_session_endpoint;
			setForm((f) => ({ ...f, ...next }));
			setFilledNote(copy.filled(Object.keys(next).length));
			setSavedAt(0);
		})
			.catch((error) => dispatch(notificationsActions.enqueueNotification({ message: error.toString(), options: { variant: 'error' } })));
	};

	const save = async () => {
		if (!canSave) return;
		setBusy(true);
		try {
			const urls = {
				tenantId,
				access_url: form.access_url.trim(),
				authorize_url: form.authorize_url.trim(),
				profile_url: form.profile_url.trim(),
				redirect_uri: form.redirect_uri.trim(),
				scope: form.scope,
				scope_delimiter: form.scope_delimiter,
				end_session_endpoint: form.end_session_endpoint.trim(),
				name_parameter: form.name_parameter.trim(),
			};

			if (isNew) {
				const created = await dispatch(createData({ key: form.key.trim(), secret: form.secret, ...urls }, 'tenantOAuths')) as TenantOAuth | undefined;

				if (created?.id) {
					await fetchRows(asNumber(created.id));
					setSavedAt(Date.now());
					onChanged();
				}
			} else {
				await dispatch(patchData(currentId, urls, 'tenantOAuths'));
				await fetchRows(currentId);
				setSavedAt(Date.now());
			}
		} finally {
			setBusy(false);
		}
	};

	const remove = async () => {
		if (isNew) return;
		if (!confirmRemove) {
			setConfirmRemove(true);

			return;
		}
		setBusy(true);
		try {
			await dispatch(deleteData(currentId, 'tenantOAuths'));
			await fetchRows();
			onChanged();
		} finally {
			setBusy(false);
		}
	};

	const field = (k: keyof Form, label: string, opts: { required?: boolean; mono?: boolean; type?: string } = {}) => (
		<TextField
			key={k}
			label={label}
			type={opts.type ?? 'text'}
			value={form[k]}
			onChange={set(k)}
			required={opts.required}
			error={Boolean(opts.required && dirty && !form[k].trim())}
			fullWidth
			size='small'
			{...(opts.mono ? monoInput : fieldProps)}
		/>
	);

	const status = !loaded ? null : providers.length ? (
		<Box sx={{ p: '12px 14px', bgcolor: '#e7f6ee', border: '1px solid #b7e1c8', fontSize: 14, lineHeight: '20px', color: '#0f5132' }}><b>{copy.connected}</b> {copy.connectedHelp}</Box>
	) : (
		<Box sx={{ p: '12px 14px', bgcolor: ui.orangeLight, border: '1px solid #f8c98d', fontSize: 14, lineHeight: '20px', color: '#8a4b00' }}><b>{copy.notSet}</b> {copy.notSetHelp}</Box>
	);

	return (
		<SectionBody
			status={savedAt && !dirty ? <SavedNote text={copy.saved} /> : copy.foot}
			footer={<>
				{!isNew && (confirmRemove
					? <><Button variant='outlined' onClick={() => setConfirmRemove(false)} sx={{ borderRadius: 0, height: 44 }}>{copy.cancel}</Button><Button variant='contained' onClick={remove} disabled={busy} sx={{ borderRadius: 0, height: 44, boxShadow: 'none', bgcolor: '#b42318', '&:hover': { bgcolor: '#8f1d14' } }}>{copy.removeConfirm}</Button></>
					: <Button variant='outlined' startIcon={<DeleteOutlineOutlinedIcon />} onClick={remove} disabled={busy} sx={{ ...dangerOutlinedSx, height: 44 }}>{copy.remove}</Button>)}
				{dirty && <Button variant='outlined' onClick={() => { setForm(base); setFilledNote(''); }} sx={{ borderRadius: 0, height: 44 }}>{copy.cancel}</Button>}
				<Button onClick={save} disabled={!canSave} sx={{ ...orangeButtonSx, ...(justSaved ? savedButtonSx : {}) }}>{justSaved ? <SavedTick label={copy.saved} /> : isNew ? copy.create : copy.save}</Button>
			</>}
		>
			<Box sx={{ maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
				{status}
				{providers.length > 1 || (providers.length > 0 && isNew) ? (
					<Box role='group' aria-label={copy.providers} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						{providers.map((p, i) => {
							const on = asNumber(p.id) === currentId;

							return <Button key={p.id} variant='outlined' aria-pressed={on} onClick={() => pick(p)} sx={{ borderRadius: 0, height: 36, textTransform: 'none', fontWeight: 600, color: on ? '#fff' : ui.navy, bgcolor: on ? ui.navy : '#fff', borderColor: on ? ui.navy : ui.line, '&:hover': { bgcolor: on ? ui.navy : ui.grey } }}>{copy.provider(i + 1)}</Button>;
						})}
					</Box>
				) : null}
				<Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
					<TextField label={copy.wellKnown} type='url' value={wellKnown} onChange={(e) => setWellKnown(e.target.value)} placeholder='https://…/.well-known/openid-configuration' fullWidth size='small' {...monoInput} />
					<Button variant='outlined' onClick={fill} disabled={wellKnown.trim().length < 10} sx={{ ...outlinedBlueSx, flexShrink: 0 }}>{copy.fill}</Button>
				</Box>
				{filledNote && <Box role='status' sx={{ mt: -0.75, fontSize: 13, color: ui.green, fontWeight: 600 }}>{filledNote}</Box>}
				{isNew ? (
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.75 }}>
						{field('key', copy.clientId, { required: true, mono: true })}
						{field('secret', copy.secret, { type: 'password' })}
					</Box>
				) : (
					<Box sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{copy.keyNote}</Box>
				)}
				<ButtonBase onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} sx={{ alignSelf: 'flex-start', gap: 0.5, py: 0.5, fontSize: 14, fontWeight: 600, color: ui.blueDark, '&.Mui-focusVisible': focusRing }}>
					<ExpandMoreOutlinedIcon sx={{ fontSize: 20, transform: advanced ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
					{advanced ? copy.advancedHide : copy.advancedShow}
					{missing && !advanced && <Box component='span' sx={{ ml: 1, fontWeight: 500, color: '#b42318' }}>· {copy.required}</Box>}
				</ButtonBase>
				<Collapse in={advanced} unmountOnExit>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
						{field('authorize_url', copy.authorize, { required: true, mono: true })}
						{field('access_url', copy.access, { required: true, mono: true })}
						{field('profile_url', copy.profile, { required: true, mono: true })}
						{field('redirect_uri', copy.redirect, { mono: true })}
						{field('scope', copy.scope, { mono: true })}
						{field('scope_delimiter', copy.delimiter, { mono: true })}
						{field('end_session_endpoint', copy.endSession, { mono: true })}
						{field('name_parameter', copy.nameParam, { mono: true })}
					</Box>
				</Collapse>
				{providers.length > 0 && !isNew && (
					<Button onClick={() => pick(null)} sx={{ alignSelf: 'flex-start', borderRadius: 0, textTransform: 'none', fontWeight: 600, color: ui.blueDark, px: 0 }}>{copy.addProvider}</Button>
				)}
			</Box>
		</SectionBody>
	);
};

export default TenantSignInSection;
