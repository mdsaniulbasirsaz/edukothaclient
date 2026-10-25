import { useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, TextField } from '@mui/material';
import { TenantInviteConfig } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, getData, getInviteServerStatus, patchData, testInviteConfig } from '../../../store/actions/managementActions';
import { notificationsActions } from '../../../store/slices/notificationsSlice';
import { ui } from '../users/userUi';
import { imapHostLabel, imapPasswordLabel, imapPortLabel, imapUserLabel, inviteServerNotConfiguredLabel, organizerAddressLabel, organizerNameLabel, passwordUnchangedLabel, smtpHostLabel, smtpPasswordLabel, smtpPortLabel, smtpUserLabel, testConnectionLabel } from '../../translated/translatedComponents';
import { SavedNote, SectionBody, ToggleRow, fieldProps, orangeButtonSx, outlinedBlueSx, rowsOf } from './tenantShared';
import { SavedTick, savedButtonSx, useJustSaved } from '../motion';

const copy = {
	enable: 'Send meeting invitations by email',
	enableHelp: 'Uses your own mail server. Replies are read from the inbox below.',
	outgoing: 'Outgoing mail (SMTP)',
	inbox: 'Replies inbox (IMAP) · optional',
	tls: 'Encrypted (TLS)',
	testFirst: 'Save the settings first, then test them.',
	smtpOk: 'Outgoing mail works',
	imapOk: 'Inbox works',
	failed: (what: string, why?: string) => `${what} failed${why ? `: ${why}` : ''}`,
	smtp: 'Outgoing mail',
	imap: 'Inbox',
	passwordNeeded: 'The SMTP password is needed the first time.',
	save: 'Save',
	cancel: 'Cancel',
	saved: 'Saved',
	foot: 'Nothing changes until you press Save.',
	notSet: 'Email invites are not set up yet.',
} as const;

// When TLS flips, switch the port if it is still a standard default.
const swapPortIfDefault = (port: number, secure: boolean, implicit: number, startTls: number) => {
	if (secure && port === startTls) return implicit;
	if (!secure && port === implicit) return startTls;

	return port;
};

type Form = {
	enabled: boolean; organizerAddress: string; organizerName: string;
	smtpHost: string; smtpPort: number; smtpSecure: boolean; smtpUser: string; smtpPass: string;
	imapHost: string; imapPort: number; imapSecure: boolean; imapUser: string; imapPass: string;
};
const blank: Form = { enabled: true, organizerAddress: '', organizerName: '', smtpHost: '', smtpPort: 465, smtpSecure: true, smtpUser: '', smtpPass: '', imapHost: '', imapPort: 993, imapSecure: true, imapUser: '', imapPass: '' };

type TestResult = { smtp: { ok: boolean; error?: string }; imap?: { ok: boolean; error?: string } };

const TenantInvitesSection = ({ tenantId, onChanged }: { tenantId: number; onChanged: () => void }) => {
	const dispatch = useAppDispatch();
	const [ existingId, setExistingId ] = useState<number | null>(null);
	const [ form, setForm ] = useState<Form>(blank);
	const [ base, setBase ] = useState<Form>(blank);
	const [ serverConfigured, setServerConfigured ] = useState(true);
	const [ busy, setBusy ] = useState(false);
	const [ savedAt, setSavedAt ] = useState(0);
	const justSaved = useJustSaved(savedAt);
	const [ testing, setTesting ] = useState(false);
	const [ result, setResult ] = useState<TestResult | null>(null);

	const fetchConfig = async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const res: any = await dispatch(getData('tenantInviteConfigs', { tenantId }));
		const cfg = rowsOf<TenantInviteConfig>(res).find((c) => Number(c.tenantId ?? tenantId) === tenantId);
		const f: Form = cfg && cfg.id !== undefined ? {
			enabled: Boolean(cfg.enabled),
			organizerAddress: cfg.organizerAddress ?? '',
			organizerName: cfg.organizerName ?? '',
			smtpHost: cfg.smtpHost ?? '',
			smtpPort: cfg.smtpPort ?? 465,
			smtpSecure: cfg.smtpSecure ?? true,
			smtpUser: cfg.smtpUser ?? '',
			smtpPass: '',
			imapHost: cfg.imapHost ?? '',
			imapPort: cfg.imapPort ?? 993,
			imapSecure: cfg.imapSecure ?? true,
			imapUser: cfg.imapUser ?? '',
			imapPass: '',
		} : blank;

		setExistingId(cfg && cfg.id !== undefined ? cfg.id : null);
		setForm(f);
		setBase(f);
	};

	useEffect(() => {
		fetchConfig();
		setResult(null);
		dispatch(getInviteServerStatus()).then((s) => setServerConfigured(s.configured));
	}, [ tenantId ]);

	const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => ({ ...f, [k]: v })); setSavedAt(0); };
	const dirty = (Object.keys(form) as Array<keyof Form>).some((k) => form[k] !== base[k]);
	const canSave = dirty && form.organizerAddress.trim() !== '' && form.smtpHost.trim() !== '' && form.smtpUser.trim() !== '' && !busy;

	const save = async () => {
		if (!canSave) return;
		if (existingId === null && !form.smtpPass) {
			dispatch(notificationsActions.enqueueNotification({ message: copy.passwordNeeded, options: { variant: 'warning' } }));

			return;
		}
		setBusy(true);
		try {
			const hasImap = form.imapHost.trim() !== '';
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const payload: any = {
				enabled: form.enabled,
				organizerAddress: form.organizerAddress.trim(),
				organizerName: form.organizerName.trim() || undefined,
				smtpHost: form.smtpHost.trim(),
				smtpPort: form.smtpPort,
				smtpSecure: form.smtpSecure,
				smtpUser: form.smtpUser.trim(),
				imapHost: hasImap ? form.imapHost.trim() : undefined,
				imapPort: hasImap ? form.imapPort : undefined,
				imapSecure: hasImap ? form.imapSecure : undefined,
				imapUser: hasImap ? form.imapUser.trim() : undefined,
			};

			// Passwords only go out when someone typed one.
			if (form.smtpPass) payload.smtpPass = form.smtpPass;
			if (form.imapPass) payload.imapPass = form.imapPass;
			if (existingId === null) await dispatch(createData({ ...payload, tenantId }, 'tenantInviteConfigs'));
			else await dispatch(patchData(existingId, payload, 'tenantInviteConfigs'));
			await fetchConfig();
			setSavedAt(Date.now());
			setResult(null);
			onChanged();
		} finally {
			setBusy(false);
		}
	};

	const test = async () => {
		setTesting(true);
		setResult(null);
		try {
			setResult(await dispatch(testInviteConfig(tenantId)));
		} catch (err) {
			setResult({ smtp: { ok: false, error: (err as Error)?.message ?? String(err) } });
		} finally {
			setTesting(false);
		}
	};

	const off = !form.enabled;
	const portField = (k: 'smtpPort' | 'imapPort', label: string, disabled = false) => (
		<TextField label={label} type='number' size='small' value={form[k]} disabled={off || disabled} onChange={(e) => set(k, Number(e.target.value) || 0)} sx={{ width: 110, flexShrink: 0 }} {...fieldProps} />
	);
	const tls = (k: 'smtpSecure' | 'imapSecure', portK: 'smtpPort' | 'imapPort', implicit: number, startTls: number, disabled = false) => (
		<FormControlLabel
			disabled={off || disabled}
			control={<Checkbox checked={form[k]} onChange={(e) => {
				const v = e.target.checked; 

				setForm((f) => ({ ...f, [k]: v, [portK]: swapPortIfDefault(f[portK], v, implicit, startTls) })); setSavedAt(0); 
			}} sx={{ '& .MuiSvgIcon-root': { borderRadius: 0 } }} />}
			label={copy.tls}
			sx={{ m: 0, flexShrink: 0 }}
		/>
	);
	const box = (legend: string, children: React.ReactNode) => (
		<Box component='fieldset' sx={{ m: 0, p: '12px 14px 14px', border: `1px solid ${ui.line}`, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
			<Box component='legend' sx={{ px: 0.75, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: ui.slate }}>{legend}</Box>
			{children}
		</Box>
	);
	const noImap = form.imapHost.trim() === '';

	return (
		<SectionBody
			status={savedAt && !dirty ? <SavedNote text={copy.saved} /> : existingId === null ? copy.notSet : copy.foot}
			footer={<>
				{dirty && <Button variant='outlined' onClick={() => setForm(base)} sx={{ borderRadius: 0, height: 44 }}>{copy.cancel}</Button>}
				<Button onClick={save} disabled={!canSave} sx={{ ...orangeButtonSx, ...(justSaved ? savedButtonSx : {}) }}>{justSaved ? <SavedTick label={copy.saved} /> : copy.save}</Button>
			</>}
		>
			<Box sx={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
				{!serverConfigured && <Alert severity='warning' sx={{ borderRadius: 0 }}>{inviteServerNotConfiguredLabel()}</Alert>}
				<Box sx={{ mt: -1 }}><ToggleRow title={copy.enable} desc={copy.enableHelp} checked={form.enabled} onChange={(v) => set('enabled', v)} /></Box>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.75, opacity: off ? 0.6 : 1 }}>
					<TextField label={organizerNameLabel()} size='small' value={form.organizerName} disabled={off} onChange={(e) => set('organizerName', e.target.value)} {...fieldProps} />
					<TextField label={organizerAddressLabel()} type='email' required size='small' value={form.organizerAddress} disabled={off} onChange={(e) => set('organizerAddress', e.target.value)} {...fieldProps} />
					{box(copy.outgoing, <>
						<Box sx={{ display: 'flex', gap: 1 }}>
							<TextField label={smtpHostLabel()} required size='small' fullWidth value={form.smtpHost} disabled={off} onChange={(e) => set('smtpHost', e.target.value)} {...fieldProps} />
							{portField('smtpPort', smtpPortLabel())}
						</Box>
						<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
							<TextField label={smtpUserLabel()} required size='small' fullWidth value={form.smtpUser} disabled={off} onChange={(e) => set('smtpUser', e.target.value)} {...fieldProps} />
							{tls('smtpSecure', 'smtpPort', 465, 587)}
						</Box>
						<TextField label={smtpPasswordLabel()} type='password' autoComplete='new-password' size='small' value={form.smtpPass} disabled={off} placeholder={existingId ? passwordUnchangedLabel() : ''} onChange={(e) => set('smtpPass', e.target.value)} slotProps={{ inputLabel: existingId ? { shrink: true } : undefined, input: { sx: { borderRadius: 0, bgcolor: '#fff' } } }} />
					</>)}
					{box(copy.inbox, <>
						<Box sx={{ display: 'flex', gap: 1 }}>
							<TextField label={imapHostLabel()} size='small' fullWidth value={form.imapHost} disabled={off} onChange={(e) => set('imapHost', e.target.value)} {...fieldProps} />
							{portField('imapPort', imapPortLabel(), noImap)}
						</Box>
						<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
							<TextField label={imapUserLabel()} size='small' fullWidth value={form.imapUser} disabled={off || noImap} onChange={(e) => set('imapUser', e.target.value)} {...fieldProps} />
							{tls('imapSecure', 'imapPort', 993, 143, noImap)}
						</Box>
						<TextField label={imapPasswordLabel()} type='password' autoComplete='new-password' size='small' value={form.imapPass} disabled={off || noImap} placeholder={existingId ? passwordUnchangedLabel() : ''} onChange={(e) => set('imapPass', e.target.value)} slotProps={{ inputLabel: existingId ? { shrink: true } : undefined, input: { sx: { borderRadius: 0, bgcolor: '#fff' } } }} />
					</>)}
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
					<Button variant='outlined' onClick={test} disabled={testing || existingId === null || dirty} sx={outlinedBlueSx}>{testConnectionLabel()}</Button>
					<Box role='status' aria-live='polite' sx={{ fontSize: 13, lineHeight: '18px', fontWeight: 600, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
						{existingId === null || dirty ? <Box component='span' sx={{ color: ui.muted, fontWeight: 400 }}>{copy.testFirst}</Box> : null}
						{result && <Box component='span' sx={{ color: result.smtp.ok ? ui.green : '#b42318' }}>{result.smtp.ok ? `✓ ${copy.smtpOk}` : `✗ ${copy.failed(copy.smtp, result.smtp.error)}`}</Box>}
						{result?.imap && <Box component='span' sx={{ color: result.imap.ok ? ui.green : '#b42318' }}>{result.imap.ok ? `✓ ${copy.imapOk}` : `✗ ${copy.failed(copy.imap, result.imap.error)}`}</Box>}
					</Box>
				</Box>
			</Box>
		</SectionBody>
	);
};

export default TenantInvitesSection;
