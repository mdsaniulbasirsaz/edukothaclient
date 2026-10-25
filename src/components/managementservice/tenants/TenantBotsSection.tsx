import { useEffect, useState } from 'react';
import { Box, Button, ButtonBase, Dialog, IconButton, InputAdornment, MenuItem, TextField, Tooltip, Typography, useMediaQuery } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { BotPolicy, Tenant, TenantBotCredential, botPolicies } from '../../../utils/types';
import { useAppDispatch } from '../../../store/hooks';
import { createData, deleteData, getDataByTenantID, patchData } from '../../../store/actions/managementActions';
import { generateBotToken, hashBotToken, invalidRanges, parseRangeList, providerFormState } from '../../../utils/botCredentials';
import { ellipsis, focusRing, ui } from '../users/userUi';
import {
	allowedIpsInvalidLabel, allowedIpsLabel, allowedIpsTooltipLabel, botApiSecretKeepLabel, botApiSecretLabel, botApiUrlLabel, botApiUrlTooltipLabel,
	botCredentialLabelLabel, botJobTypeLabel, botJobTypeNoneLabel, botJobTypeRecorderLabel, botJobTypeStreamerLabel, botJobTypeTranscriberLabel,
	botPolicyOptionLabel, botProviderIncompleteLabel, botTokenCopiedLabel, botTokenCopyLabel, botTokenGenerateLabel, botTokenLabel, botTokenShownOnceLabel, closeLabel, neverLabel,
} from '../../translated/translatedComponents';
import { EmptyBox, SavedNote, SectionBody, SubHeading, ToggleRow, dangerOutlinedSx, fieldProps, monoInput, orangeButtonSx, outlinedBlueSx, rowsOf } from './tenantShared';
import { SavedTick, savedButtonSx, useJustSaved } from '../motion';

const copy = {
	policy: 'Bot policy',
	policyHelp: {
		disabled: 'No bots can join any room.',
		tokenOnly: 'A bot needs one of the tokens below, from an allowed address. It can then also enter locked and meetings-only rooms.',
		all: 'Bots without a token are let in too, like ordinary participants.',
	} as Record<BotPolicy, string>,
	tokens: 'Bot access tokens',
	newToken: 'New token',
	editToken: 'Bot access token',
	noTokens: 'No tokens yet. A token lets one recorder, streamer or transcriber in.',
	tokensUnused: 'Tokens are only used with "Only bots with an access token".',
	created: 'Created',
	lastUsed: 'Last used',
	on: 'On',
	off: 'Off',
	enabled: 'Token is on',
	enabledHelp: 'Turn it off to block this bot without deleting the token.',
	generateFirst: 'Press Generate, then copy the token. It is shown only once.',
	save: 'Save',
	cancel: 'Cancel',
	create: 'Create token',
	remove: 'Delete token',
	removeConfirm: 'Yes, delete',
	saved: 'Saved',
	foot: 'The policy saves with Save. Tokens save from their own window.',
} as const;

const formatTime = (value?: number | string | null): string => (value ? new Date(Number(value)).toLocaleString() : neverLabel());
const jobLabel = (j?: string | null) => (j === 'recorder' ? botJobTypeRecorderLabel() : j === 'streamer' ? botJobTypeStreamerLabel() : j === 'transcriber' ? botJobTypeTranscriberLabel() : '');

const TokenDialog = ({ tenantId, token: cred, open, onClose, onSaved }: { tenantId: number; token: TenantBotCredential | null; open: boolean; onClose: () => void; onSaved: () => void }) => {
	const dispatch = useAppDispatch();
	const phone = useMediaQuery('(max-width: 599.95px)');
	const isNew = !cred;
	const [ label, setLabel ] = useState('');
	const [ rangesText, setRangesText ] = useState('');
	const [ enabled, setEnabled ] = useState(true);
	const [ token, setToken ] = useState('');
	const [ tokenHash, setTokenHash ] = useState('');
	const [ copied, setCopied ] = useState(false);
	const [ jobType, setJobType ] = useState('');
	const [ apiUrl, setApiUrl ] = useState('');
	const [ apiSecret, setApiSecret ] = useState('');
	const [ hasApiSecret, setHasApiSecret ] = useState(false);
	const [ busy, setBusy ] = useState(false);
	const [ confirmRemove, setConfirmRemove ] = useState(false);

	useEffect(() => {
		if (!open) return;
		setLabel(cred?.label ?? '');
		setRangesText((cred?.allowedIps ?? []).join('\n'));
		setEnabled(cred ? Boolean(cred.enabled) : true);
		setToken('');
		setTokenHash('');
		setCopied(false);
		setJobType(cred?.jobType ?? '');
		setApiUrl(cred?.apiUrl ?? '');
		setApiSecret('');
		setHasApiSecret(Boolean(cred?.hasApiSecret));
		setConfirmRemove(false);
	}, [ open, cred ]);

	const ranges = parseRangeList(rangesText);
	const badRanges = invalidRanges(ranges);
	const { cleared: providerCleared, incomplete: providerIncomplete } = providerFormState({ jobType, apiUrl, apiSecret, hasApiSecret });
	const canApply = label.trim() !== '' && ranges.length > 0 && badRanges.length === 0 && (!isNew || tokenHash !== '') && !providerIncomplete && !busy;

	const generate = async () => {
		const fresh = generateBotToken();

		setToken(fresh);
		setTokenHash(await hashBotToken(fresh));
		setCopied(false);
	};
	const copyToken = async () => {
		await navigator.clipboard.writeText(token);
		setCopied(true);
	};
	const apply = async () => {
		if (!canApply) return;
		setBusy(true);
		try {
			// An empty key keeps the stored one, and an empty address clears the provider.
			const provider = apiUrl.trim() === '' ? { apiUrl: '' } : { jobType, apiUrl: apiUrl.trim(), ...(apiSecret ? { apiSecret } : {}) };

			if (isNew) await dispatch(createData({ tenantId, label: label.trim(), tokenHash, allowedIps: ranges, enabled, ...(apiUrl.trim() === '' ? {} : provider) }, 'tenantBotCredentials'));
			else await dispatch(patchData(Number(cred.id), { label: label.trim(), allowedIps: ranges, enabled, ...provider }, 'tenantBotCredentials'));
			onSaved();
			onClose();
		} finally {
			setBusy(false);
		}
	};
	const remove = async () => {
		if (!cred) return;
		if (!confirmRemove) {
			setConfirmRemove(true);

			return;
		}
		setBusy(true);
		try {
			await dispatch(deleteData(Number(cred.id), 'tenantBotCredentials'));
			onSaved();
			onClose();
		} finally {
			setBusy(false);
		}
	};

	const titleId = 'bot-token-title';

	return (
		<Dialog open={open} onClose={onClose} fullScreen={phone} fullWidth maxWidth={false} slotProps={{ paper: { 'aria-labelledby': titleId, sx: { width: phone ? '100%' : 640, maxWidth: '100%', m: phone ? 0 : 2, maxHeight: phone ? '100%' : 'calc(100% - 32px)', borderRadius: 0, borderTop: `4px solid ${ui.orange}`, display: 'flex', flexDirection: 'column' } } }}>
			<Box sx={{ flexShrink: 0, minHeight: 56, pl: 3, pr: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${ui.lineSoft}` }}>
				<Typography id={titleId} component='h2' sx={{ flexGrow: 1, m: 0, fontSize: 18, fontWeight: 700, color: ui.navy }}>{isNew ? copy.newToken : copy.editToken}</Typography>
				<IconButton onClick={onClose} aria-label={closeLabel()} sx={{ width: 44, height: 44, borderRadius: 0, color: ui.navy }}><CloseOutlinedIcon /></IconButton>
			</Box>
			<Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 1.75 }}>
				<TextField label={botCredentialLabelLabel()} required size='small' value={label} onChange={(e) => setLabel(e.target.value)} autoFocus {...fieldProps} />
				{isNew && <>
					<Box sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{botTokenShownOnceLabel()}</Box>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<TextField
							label={botTokenLabel()}
							size='small'
							fullWidth
							value={token}
							placeholder={copy.generateFirst}
							slotProps={{
								input: {
									readOnly: true,
									sx: { borderRadius: 0, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 13 },
									endAdornment: (
										<InputAdornment position='end'>
											<Tooltip title={copied ? botTokenCopiedLabel() : botTokenCopyLabel()}>
												<span><IconButton aria-label={botTokenCopyLabel()} onClick={copyToken} disabled={!token} edge='end' sx={{ borderRadius: 0 }}><ContentCopyIcon fontSize='small' /></IconButton></span>
											</Tooltip>
										</InputAdornment>
									),
								},
							}}
						/>
						<Button variant='outlined' onClick={generate} sx={{ ...outlinedBlueSx, flexShrink: 0 }}>{botTokenGenerateLabel()}</Button>
					</Box>
				</>}
				<TextField
					label={allowedIpsLabel()}
					required
					multiline
					minRows={2}
					maxRows={5}
					value={rangesText}
					onChange={(e) => setRangesText(e.target.value)}
					error={badRanges.length > 0}
					helperText={badRanges.length > 0 ? allowedIpsInvalidLabel(badRanges.join(', ')) : allowedIpsTooltipLabel().split('\n')[0]}
					{...monoInput}
				/>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 1.5 }}>
					<TextField select label={botJobTypeLabel()} size='small' value={jobType} onChange={(e) => setJobType(e.target.value)} {...fieldProps}>
						<MenuItem value=''>{botJobTypeNoneLabel()}</MenuItem>
						<MenuItem value='recorder'>{botJobTypeRecorderLabel()}</MenuItem>
						<MenuItem value='streamer'>{botJobTypeStreamerLabel()}</MenuItem>
						<MenuItem value='transcriber'>{botJobTypeTranscriberLabel()}</MenuItem>
					</TextField>
					<TextField label={botApiUrlLabel()} type='url' size='small' placeholder='https://' value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} helperText={botApiUrlTooltipLabel()} {...monoInput} />
				</Box>
				<TextField
					label={botApiSecretLabel()}
					type='password'
					autoComplete='new-password'
					size='small'
					value={apiSecret}
					onChange={(e) => setApiSecret(e.target.value)}
					error={providerIncomplete}
					helperText={providerIncomplete ? botProviderIncompleteLabel() : (hasApiSecret && !providerCleared ? botApiSecretKeepLabel() : ' ')}
					{...fieldProps}
				/>
				<ToggleRow title={copy.enabled} desc={copy.enabledHelp} checked={enabled} onChange={setEnabled} />
			</Box>
			<Box sx={{ flexShrink: 0, px: 3, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', borderTop: `1px solid ${ui.lineSoft}` }}>
				{!isNew && (confirmRemove
					? <Button variant='contained' onClick={remove} disabled={busy} sx={{ borderRadius: 0, height: 44, boxShadow: 'none', bgcolor: '#b42318', '&:hover': { bgcolor: '#8f1d14' } }}>{copy.removeConfirm}</Button>
					: <Button variant='outlined' startIcon={<DeleteOutlineOutlinedIcon />} onClick={remove} sx={{ ...dangerOutlinedSx, height: 44 }}>{copy.remove}</Button>)}
				<Box sx={{ flexGrow: 1 }} />
				<Button variant='outlined' onClick={onClose} sx={{ borderRadius: 0, height: 44 }}>{copy.cancel}</Button>
				<Button onClick={apply} disabled={!canApply} sx={orangeButtonSx}>{isNew ? copy.create : copy.save}</Button>
			</Box>
		</Dialog>
	);
};

const TenantBotsSection = ({ tenant, onTenantSaved }: { tenant: Tenant; onTenantSaved: () => Promise<unknown> }) => {
	const dispatch = useAppDispatch();
	const tenantId = Number(tenant.id);
	const savedPolicy: BotPolicy = (tenant.botPolicy as BotPolicy) ?? 'disabled';
	const [ policy, setPolicy ] = useState<BotPolicy>(savedPolicy);
	const [ tokens, setTokens ] = useState<TenantBotCredential[]>([]);
	const [ busy, setBusy ] = useState(false);
	const [ savedAt, setSavedAt ] = useState(0);
	const justSaved = useJustSaved(savedAt);
	const [ dialogOpen, setDialogOpen ] = useState(false);
	const [ editing, setEditing ] = useState<TenantBotCredential | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fetchTokens = () => dispatch(getDataByTenantID(tenantId, 'tenantBotCredentials')).then((t: any) => { if (t != undefined) setTokens(rowsOf<TenantBotCredential>(t)); });

	useEffect(() => {
		fetchTokens();
	}, [ tenantId ]);
	useEffect(() => {
		setPolicy(savedPolicy);
	}, [ savedPolicy ]);

	const dirty = policy !== savedPolicy;
	const save = async () => {
		setBusy(true);
		try {
			await dispatch(patchData(tenantId, { botPolicy: policy }, 'tenants'));
			await onTenantSaved();
			setSavedAt(Date.now());
		} finally {
			setBusy(false);
		}
	};

	return (
		<SectionBody
			status={savedAt && !dirty ? <SavedNote text={copy.saved} /> : copy.foot}
			footer={<>
				{dirty && <Button variant='outlined' onClick={() => setPolicy(savedPolicy)} sx={{ borderRadius: 0, height: 44 }}>{copy.cancel}</Button>}
				<Button onClick={save} disabled={!dirty || busy} sx={{ ...orangeButtonSx, ...(justSaved ? savedButtonSx : {}) }}>{justSaved ? <SavedTick label={copy.saved} /> : copy.save}</Button>
			</>}
		>
			<Box role='radiogroup' aria-label={copy.policy} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
				{botPolicies.map((p) => {
					const on = p === policy;

					return (
						<ButtonBase
							key={p}
							role='radio'
							aria-checked={on}
							onClick={() => { setPolicy(p); setSavedAt(0); }}
							sx={{ p: '12px 14px', border: `2px solid ${on ? ui.blueDark : ui.line}`, bgcolor: on ? '#f3f8fe' : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5, textAlign: 'left', '&:hover': { borderColor: on ? ui.blueDark : ui.slateDot }, '&.Mui-focusVisible': focusRing }}
						>
							<Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 15, fontWeight: 700, color: ui.navy }}>
								<Box component='span' aria-hidden sx={{ width: 14, height: 14, border: `2px solid ${on ? ui.blueDark : ui.slateDot}`, bgcolor: on ? ui.blueDark : '#fff', boxShadow: on ? 'inset 0 0 0 2px #fff' : 'none' }} />
								{botPolicyOptionLabel(p)}
							</Box>
							<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{copy.policyHelp[p]}</Box>
						</ButtonBase>
					);
				})}
			</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
				<Box sx={{ flexGrow: 1 }}>
					<SubHeading count={tokens.length}>{copy.tokens}</SubHeading>
					{policy !== 'tokenOnly' && tokens.length > 0 && <Box sx={{ fontSize: 13, color: ui.muted }}>{copy.tokensUnused}</Box>}
				</Box>
				<Button variant='outlined' startIcon={<AddOutlinedIcon />} onClick={() => { setEditing(null); setDialogOpen(true); }} sx={outlinedBlueSx}>{copy.newToken}</Button>
			</Box>
			{tokens.length === 0 ? <EmptyBox>{copy.noTokens}</EmptyBox> : (
				<Box component='ul' aria-label={copy.tokens} sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
					{tokens.map((t) => (
						<Box component='li' key={t.id}>
							<ButtonBase
								onClick={() => { setEditing(t); setDialogOpen(true); }}
								sx={{ width: '100%', minHeight: 64, px: 1.75, py: 1.25, border: `1px solid ${ui.line}`, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', md: 'minmax(0, 1.4fr) 110px minmax(0, 1.2fr) 190px 48px 20px' }, alignItems: 'center', columnGap: 1.5, rowGap: 0.5, textAlign: 'left', '&:hover': { bgcolor: ui.orangeLight, borderColor: ui.orange }, '&.Mui-focusVisible': focusRing }}
							>
								<Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
									<Box component='span' sx={{ fontSize: 15, fontWeight: 600, color: ui.navy, ...ellipsis }}>{t.label}</Box>
									<Box component='span' sx={{ fontSize: 12, color: ui.muted }}>{copy.created} {formatTime(t.createdAt)}</Box>
								</Box>
								<Box component='span' sx={{ display: { xs: 'none', md: 'inline' }, justifySelf: 'start', fontSize: 12, fontWeight: 600, color: ui.blueDark, bgcolor: jobLabel(t.jobType) ? ui.blueLight : 'transparent', px: 1, py: '3px' }}>{jobLabel(t.jobType) || '—'}</Box>
								<Box component='span' sx={{ display: { xs: 'none', md: 'block' }, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 12, color: ui.body, ...ellipsis }}>{(t.allowedIps ?? []).join(', ')}</Box>
								<Box component='span' sx={{ display: { xs: 'none', md: 'block' }, fontSize: 13, color: ui.muted, ...ellipsis }}>{copy.lastUsed} {formatTime(t.lastUsedAt)}</Box>
								<Box component='span' sx={{ fontSize: 13, fontWeight: 600, color: t.enabled ? ui.green : ui.muted }}>{t.enabled ? copy.on : copy.off}</Box>
								<ChevronRightOutlinedIcon sx={{ display: { xs: 'none', md: 'block' }, fontSize: 20, color: ui.slateDot }} />
							</ButtonBase>
						</Box>
					))}
				</Box>
			)}
			<TokenDialog tenantId={tenantId} token={editing} open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={fetchTokens} />
		</SectionBody>
	);
};

export default TenantBotsSection;
