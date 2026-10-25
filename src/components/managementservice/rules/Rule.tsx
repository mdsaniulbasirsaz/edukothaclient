import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Box, Button, ButtonBase, Dialog, IconButton, InputAdornment, MenuItem, Skeleton, Slide, TextField, Typography, useMediaQuery } from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Groups, Rule, Tenant } from '../../../utils/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createData, deleteData, getData, patchData } from '../../../store/actions/managementActions';
import { notificationsActions } from '../../../store/slices/notificationsSlice';
import { asNumber, ellipsis, focusRing, squareInput, str, ui } from '../users/userUi';
import {
	accessLabel, allowLabel, blockLabel, cancelLabel, closeLabel, containsLabel, doesNotContainLabel, doesNotEndWithLabel, doesNotEqualLabel, doesNotStartWithLabel,
	endswithLabel, equalsLabel, gainLabel, makeUserGroupMemberLabel, makeUserSuperAdminLabel, makeUserTenantAdminLabel, makeUserTenantOwnerLabel, matchesAnyoneLabel,
	nameCannotBeEmptyLabel, rulesHelpAdminsLabel, rulesHelpBlockLabel, rulesHelpClosesLabel, rulesHelpGrantAccessLabel, rulesHelpGrantKeepLabel, rulesHelpGrantLabel,
	rulesHelpKindsLabel, rulesHelpOpenLabel, rulesHelpStepsLabel, rulesHelpTitleLabel, rulesLabel, startswithLabel, tenantLabel, undefinedTenantLabel,
} from '../../translated/translatedComponents';
import { EmptyBox, SavedNote, dangerOutlinedSx, fieldProps, monoInput, orangeButtonSx, rowsOf, sameId } from '../tenants/tenantShared';
import { SavedTick, liftOn, liftTransition, savedButtonSx, staggerSx, useFlip, useIntro, useJustSaved } from '../motion';

// Rules screen (user request 2026-10-17, same look as Groups and Roles): each
// rule reads as one sentence on a square card ("Block people whose email ends
// with @gmail.com"), split into "Who can sign in" (access rules) and "What
// people get" (grant rules), with a per-tenant note saying whether sign-in is
// open or closed. Editing happens in a modal that slides down from the top,
// with a live preview of the sentence. The stored fields and their meaning are
// unchanged: type is block / allow / gain, method + negate is one condition,
// and accessId only holds a group id for a "groupUsers" grant.
const modalDuration = { enter: 360, exit: 300 } as const;
const modalEasing = { enter: 'cubic-bezier(0.16, 1, 0.3, 1)', exit: 'cubic-bezier(0.4, 0, 1, 1)' } as const;

const SlideDown = forwardRef(function SlideDownTransition(props: TransitionProps & { children: React.ReactElement }, ref: React.Ref<unknown>) {
	return <Slide direction='down' ref={ref} {...props} />;
});

// The only attributes an SSO login carries into the rule hooks (see
// OAuthTenantStrategy.getEntityData on the management server). The field stays
// free text so older rules keep their value, but nothing else ever matches.
const PARAMETERS: Array<[string, string]> = [ [ 'email', 'email' ], [ 'name', 'name' ], [ 'ssoId', 'SSO ID' ], [ 'tenantId', 'tenant ID' ] ];
const paramText = (p: string) => PARAMETERS.find(([ k ]) => k === p)?.[1] ?? p;

// method + negate shown as one phrase. The negated forms are no longer offered
// for new rules (two of them OR together and stop excluding anything), but stay
// here so an older rule keeps reading correctly.
const CONDITIONS = [
	{ id: 'anyone', method: 'anyone', negate: false, label: matchesAnyoneLabel },
	{ id: 'contains', method: 'contains', negate: false, label: containsLabel },
	{ id: 'notcontains', method: 'contains', negate: true, label: doesNotContainLabel },
	{ id: 'equals', method: 'equals', negate: false, label: equalsLabel },
	{ id: 'notequals', method: 'equals', negate: true, label: doesNotEqualLabel },
	{ id: 'startswith', method: 'startswith', negate: false, label: startswithLabel },
	{ id: 'notstartswith', method: 'startswith', negate: true, label: doesNotStartWithLabel },
	{ id: 'endswith', method: 'endswith', negate: false, label: endswithLabel },
	{ id: 'notendswith', method: 'endswith', negate: true, label: doesNotEndWithLabel },
];
const findCondition = (method: unknown, negate: unknown) => CONDITIONS.find((c) => c.method === method && c.negate === Boolean(negate));

const ACTIONS: Array<[string, () => string]> = [
	[ 'groupUsers', makeUserGroupMemberLabel ],
	[ 'tenantOwners', makeUserTenantOwnerLabel ],
	[ 'tenantAdmins', makeUserTenantAdminLabel ],
	[ 'superAdmin', makeUserSuperAdminLabel ],
];

type Kind = 'block' | 'allow' | 'gain';
const kindOf = (type: unknown): Kind => (type === 'gain' ? 'gain' : type === 'allow' ? 'allow' : 'block');
const kindStyle: Record<Kind, { fg: string; bg: string; bar: string; label: () => string }> = {
	block: { fg: '#8f1d14', bg: '#fdecec', bar: '#b42318', label: blockLabel },
	allow: { fg: '#0f5132', bg: '#e7f6ee', bar: ui.green, label: allowLabel },
	gain: { fg: ui.blueDark, bg: ui.blueLight, bar: ui.blueDark, label: gainLabel },
};

const copy = {
	subtitle: 'Decide who may sign in to a tenant, and what people get when they do.',
	help: 'How rules work',
	addRule: 'Add rule',
	newRule: 'New rule',
	search: 'Rule name or value',
	searchShort: 'Search rules',
	kind: 'Kind',
	all: 'All',
	access: 'Who can sign in',
	accessHelp: 'Allow rules let groups of people in; Block rules keep people out. The most specific matching rule wins.',
	grants: 'What people get',
	grantsHelp: 'Applied at every sign-in. Grants are only added, never taken away.',
	allTenants: 'All tenants',
	noRules: 'No rules match your search.',
	noAccess: 'No access rules. Anyone the sign-in provider offers can sign in.',
	noGrants: 'No grant rules yet.',
	clearFilters: 'Clear filters',
	open: (t: string) => `${t} is open: anyone can sign in unless a Block rule stops them.`,
	closed: (t: string) => `${t} is closed: only people an Allow rule lists can sign in.`,
	people: 'people whose',
	everyone: 'everyone no other rule mentions',
	unfinished: '(unfinished rule)',
	give: 'Give',
	membershipOf: (g: string) => `membership of ${g}`,
	tenantOwner: 'tenant owner rights',
	tenantAdmin: 'tenant admin rights',
	superAdmin: 'super admin rights',
	unknownGroup: 'a group that no longer exists',
	ruleNo: (id: number) => `Rule #${id}`,
	name: 'Rule name',
	nameHelp: 'Only you see this, e.g. "Staff email addresses".',
	whatKind: 'What should this rule do?',
	blockHelp: 'Keep matching people out.',
	allowHelp: 'Let matching people in.',
	gainHelp: 'Give matching people a group or a role.',
	who: 'Who does it apply to?',
	attribute: 'Their',
	condition: 'Condition',
	value: 'Value',
	attrHelp: 'Only email, name, SSO ID and tenant ID can match.',
	whatGive: 'What do they get?',
	action: 'Give them',
	group: 'Group',
	noGroups: 'This tenant has no groups yet. Make one on the Groups page.',
	preview: 'This rule says',
	required: 'Required',
	save: 'Save',
	create: 'Create rule',
	saved: 'Saved',
	foot: 'Nothing changes until you press Save.',
	deleteRule: 'Delete rule',
	deleteConfirm: 'Yes, delete',
	anyoneOnlyBlock: '"matches anyone" only works as a Block rule.',
} as const;

type Draft = { name: string; tenantId: number; type: Kind; parameter: string; method: string; negate: boolean; value: string; action: string; accessId: string };
const blankDraft = (tenantId: number): Draft => ({ name: '', tenantId, type: 'block', parameter: 'email', method: 'endswith', negate: false, value: '', action: '', accessId: '' });
const draftOf = (r: Rule): Draft => ({
	name: str(r.name),
	tenantId: r.tenantId == null ? 0 : asNumber(r.tenantId),
	type: kindOf(r.type),
	parameter: str(r.parameter),
	method: str(r.method),
	negate: Boolean(r.negate),
	value: str(r.value),
	action: str(r.action),
	accessId: r.accessId == null ? '' : String(r.accessId),
});

// The rule as a sentence: the pieces stay separate so the value can be styled.
const sentenceOf = (d: Pick<Draft, 'type' | 'parameter' | 'method' | 'negate' | 'value' | 'action' | 'accessId'>, groups: Groups[]) => {
	const cond = findCondition(d.method, d.negate);
	const verb = d.type === 'gain' ? copy.give : kindStyle[d.type].label();
	const whom = cond?.id === 'anyone' ? copy.everyone : !cond || !d.parameter ? copy.unfinished : `${copy.people} ${paramText(d.parameter)} ${cond.label()}`;
	const value = cond && cond.id !== 'anyone' && d.parameter ? d.value : '';
	let what = '';

	if (d.type === 'gain') {
		if (d.action === 'groupUsers') {
			const g = groups.find((x) => sameId(x.id, d.accessId));

			what = copy.membershipOf(g ? g.name : copy.unknownGroup);
		} else if (d.action === 'tenantOwners') what = copy.tenantOwner;
		else if (d.action === 'tenantAdmins') what = copy.tenantAdmin;
		else if (d.action === 'superAdmin') what = copy.superAdmin;
		else what = copy.unfinished;
	}

	return { verb, whom, value, what };
};

const Sentence = ({ s, size = 15 }: { s: ReturnType<typeof sentenceOf>; size?: number }) => (
	<Box component='span' sx={{ fontSize: size, lineHeight: 1.45, color: ui.text, overflowWrap: 'anywhere' }}>
		<Box component='b' sx={{ color: ui.navy }}>{s.verb}</Box>{' '}
		{s.what && <><Box component='b' sx={{ color: ui.navy }}>{s.what}</Box>{' to '}</>}
		{s.whom}
		{s.value && <>{' '}<Box component='span' sx={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: size - 1, fontWeight: 600, color: ui.blueDark, bgcolor: ui.blueLight, px: '5px', py: '1px' }}>{s.value}</Box></>}
	</Box>
);

const RuleTable = () => {
	const dispatch = useAppDispatch();
	const { superAdmin } = useAppSelector((state) => state.management);
	const phone = useMediaQuery('(max-width: 599.95px)');
	const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

	const [ rules, setRules ] = useState<Rule[]>([]);
	const [ tenants, setTenants ] = useState<Tenant[]>([]);
	const [ groups, setGroups ] = useState<Groups[]>([]);
	const [ loading, setLoading ] = useState(true);

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const fetchRules = () => dispatch(getData('rules')).then((t: any) => { if (t != undefined) setRules(rowsOf<Rule>(t)); });

	useEffect(() => {
		Promise.all([
			fetchRules(),
			dispatch(getData('tenants')).then((t: any) => { if (t != undefined) setTenants(rowsOf<Tenant>(t)); }),
			dispatch(getData('groups')).then((t: any) => { if (t != undefined) setGroups(rowsOf<Groups>(t)); }),
		]).finally(() => setLoading(false));
	}, []);
	/* eslint-enable @typescript-eslint/no-explicit-any */

	const tenantName = (id: unknown) => tenants.find((t) => sameId(t.id, id))?.name || undefinedTenantLabel();

	// ----- Filters -----
	const [ search, setSearch ] = useState('');
	const [ kindFilter, setKindFilter ] = useState<'all' | 'access' | 'gain'>('all');
	const [ tenantFilter, setTenantFilter ] = useState('all');

	const visible = useMemo(() => {
		const q = search.trim().toLowerCase();

		return rules
			.filter((r) => kindFilter === 'all' || (kindFilter === 'gain' ? kindOf(r.type) === 'gain' : kindOf(r.type) !== 'gain'))
			.filter((r) => tenantFilter === 'all' || sameId(r.tenantId, tenantFilter))
			.filter((r) => !q || `${str(r.name)} ${str(r.value)} ${str(r.parameter)}`.toLowerCase().includes(q))
			.sort((a, b) => str(a.name).localeCompare(str(b.name)));
	}, [ rules, search, kindFilter, tenantFilter ]);
	const accessRules = visible.filter((r) => kindOf(r.type) !== 'gain');
	const grantRules = visible.filter((r) => kindOf(r.type) === 'gain');
	const counts = { all: rules.length, access: rules.filter((r) => kindOf(r.type) !== 'gain').length, gain: rules.filter((r) => kindOf(r.type) === 'gain').length };
	const filtersOn = search.trim() !== '' || kindFilter !== 'all' || tenantFilter !== 'all';
	// Motion (2026-10-18): cards rise in on first show and slide to their
	// new places when a filter changes.
	const intro = useIntro(visible.length > 0);
	const listRef = useRef<HTMLDivElement>(null);

	useFlip(listRef, visible.map((r) => r.id).join(','));

	// Open or closed, per tenant shown: a "matches anyone" Block closes it.
	const shownTenants = tenantFilter === 'all' ? tenants : tenants.filter((t) => sameId(t.id, tenantFilter));
	const isClosed = (tid: unknown) => rules.some((r) => sameId(r.tenantId, tid) && kindOf(r.type) === 'block' && r.method === 'anyone');

	// ----- Modal -----
	const [ selectedId, setSelectedId ] = useState<number | null>(null);
	const [ open, setOpen ] = useState(false);
	const [ draft, setDraft ] = useState<Draft>(blankDraft(0));
	const [ base, setBase ] = useState<Draft>(blankDraft(0));
	const [ busy, setBusy ] = useState(false);
	const [ savedAt, setSavedAt ] = useState(0);
	const justSaved = useJustSaved(savedAt);
	const [ confirmDelete, setConfirmDelete ] = useState(false);
	const [ helpOpen, setHelpOpen ] = useState(false);
	const isNew = selectedId === 0;

	const openRule = (r: Rule) => {
		const d = draftOf(r);

		setSelectedId(asNumber(r.id));
		setDraft(d);
		setBase(d);
		setSavedAt(0);
		setConfirmDelete(false);
		setOpen(true);
	};
	const openNew = () => {
		// Preselect a tenant: a tenant admin only sees their own, and a rule
		// always belongs to one.
		const tid = tenantFilter !== 'all' ? asNumber(tenantFilter) : asNumber(tenants[0]?.id ?? 0);
		const d = blankDraft(tid);

		setSelectedId(0);
		setDraft(d);
		setBase(d);
		setSavedAt(0);
		setConfirmDelete(false);
		setOpen(true);
	};
	const set = (patch: Partial<Draft>) => { setDraft((d) => ({ ...d, ...patch })); setSavedAt(0); };

	const cond = findCondition(draft.method, draft.negate);
	const catchAll = draft.method === 'anyone';
	// Only the plain comparisons can be picked; whatever the rule already uses
	// stays, so looking at an older rule never rewrites it.
	const conditionOptions = CONDITIONS.filter((c) => c.id === findCondition(base.method, base.negate)?.id || c.id === cond?.id || (!c.negate && (c.method !== 'anyone' || draft.type === 'block')));
	const tenantGroups = groups.filter((g) => sameId(g.tenantId, draft.tenantId));
	const dirty = (Object.keys(draft) as Array<keyof Draft>).some((k) => draft[k] !== base[k]);
	const missing = {
		name: draft.name.trim() === '',
		tenant: !draft.tenantId,
		condition: !cond,
		parameter: !catchAll && draft.parameter.trim() === '',
		value: !catchAll && draft.value.trim() === '',
		action: draft.type === 'gain' && !draft.action,
		group: draft.type === 'gain' && draft.action === 'groupUsers' && !draft.accessId,
	};
	const valid = !Object.values(missing).some(Boolean);
	const canSave = dirty && valid && !busy;

	const pickKind = (k: Kind) => {
		// "matches anyone" only means something as a Block, so leaving Block clears it
		if (k !== 'block' && draft.method === 'anyone') set({ type: k, method: 'endswith', negate: false });
		else set({ type: k });
	};
	const pickCondition = (id: string) => {
		const c = CONDITIONS.find((x) => x.id === id);

		if (!c) return;
		// the catch-all tests nothing, so clear what it hides
		if (c.method === 'anyone') set({ method: c.method, negate: c.negate, parameter: '', value: '' });
		else set({ method: c.method, negate: c.negate, parameter: draft.parameter || 'email' });
	};
	const pickTenant = (tid: number) => {
		// the chosen group belongs to the tenant we moved away from
		const keepGroup = groups.some((g) => sameId(g.id, draft.accessId) && sameId(g.tenantId, tid));

		set({ tenantId: tid, accessId: keepGroup ? draft.accessId : '' });
	};

	const save = async () => {
		if (!canSave) {
			if (missing.name) dispatch(notificationsActions.enqueueNotification({ message: nameCannotBeEmptyLabel(), options: { variant: 'warning' } }));

			return;
		}
		setBusy(true);
		try {
			const payload = {
				name: draft.name.trim(),
				tenantId: draft.tenantId,
				parameter: catchAll ? '' : draft.parameter.trim(),
				method: draft.method,
				negate: draft.negate,
				value: catchAll ? '' : draft.value.trim(),
				action: draft.type === 'gain' ? draft.action : '',
				type: draft.type,
				accessId: draft.type === 'gain' && draft.action === 'groupUsers' ? draft.accessId : '',
			};

			if (isNew) {
				const created = await dispatch(createData(payload, 'rules')) as Rule | undefined;

				await fetchRules();
				if (created?.id) {
					setSelectedId(asNumber(created.id));
					setBase({ ...draft, ...payload, type: draft.type });
					setDraft({ ...draft, ...payload, type: draft.type });
					setSavedAt(Date.now());
				}
			} else if (selectedId) {
				await dispatch(patchData(selectedId, payload, 'rules'));
				await fetchRules();
				const next = { ...draft, ...payload, type: draft.type };

				setBase(next);
				setDraft(next);
				setSavedAt(Date.now());
			}
		} finally {
			setBusy(false);
		}
	};
	const remove = async () => {
		if (!selectedId) return;
		if (!confirmDelete) {
			setConfirmDelete(true);

			return;
		}
		setBusy(true);
		try {
			await dispatch(deleteData(selectedId, 'rules'));
			setOpen(false);
			await fetchRules();
		} finally {
			setBusy(false);
			setConfirmDelete(false);
		}
	};

	// ----- Pieces -----
	const ruleCard = (r: Rule) => {
		const k = kindOf(r.type);
		const st = kindStyle[k];
		const s = sentenceOf(draftOf(r), groups);
		const on = open && sameId(r.id, selectedId);

		return (
			<ButtonBase
				onClick={() => openRule(r)}
				aria-pressed={on}
				sx={{ width: '100%', minHeight: 96, p: '12px 14px 14px 16px', display: 'flex', alignItems: 'stretch', gap: 1.5, textAlign: 'left', bgcolor: on ? ui.orangeLight : '#fff', border: `1px solid ${on ? ui.orange : ui.line}`, boxShadow: `inset 4px 0 0 ${st.bar}`, transition: `background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, ${liftTransition}`, '&:hover': { bgcolor: ui.orangeLight, borderColor: ui.orange, ...liftOn(`inset 4px 0 0 ${st.bar}`) }, '&.Mui-focusVisible': focusRing, '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }}
			>
				<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
						<Box component='span' sx={{ flexShrink: 0, fontSize: 12, lineHeight: '16px', fontWeight: 700, color: st.fg, bgcolor: st.bg, px: 1, py: '3px' }}>{st.label()}</Box>
						<Box component='span' sx={{ flexGrow: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: ui.body, ...ellipsis }}>{str(r.name) || copy.ruleNo(asNumber(r.id))}</Box>
						{tenants.length > 1 && <Box component='span' sx={{ flexShrink: 0, maxWidth: '40%', fontSize: 12, color: ui.muted, ...ellipsis }}>{tenantName(r.tenantId)}</Box>}
					</Box>
					<Sentence s={s} />
				</Box>
				<ChevronRightOutlinedIcon sx={{ alignSelf: 'center', color: ui.slateDot, flexShrink: 0 }} />
			</ButtonBase>
		);
	};

	const grid = (list: Rule[]) => (
		<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(auto-fill, minmax(380px, 1fr))' }, gap: { xs: 1.25, sm: 1.75 } }}>
			{list.map((r, index) => <Box component='li' key={r.id} data-flip={r.id} sx={{ minWidth: 0, display: 'flex', ...staggerSx(index, intro) }}>{ruleCard(r)}</Box>)}
		</Box>
	);

	const group = (title: string, help: string, list: Rule[], empty: string, showStatus: boolean) => (
		<Box component='section' aria-label={title} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
			<Box>
				<Typography component='h3' sx={{ m: 0, fontSize: 18, lineHeight: '24px', fontWeight: 700, color: ui.navy }}>{title} <Box component='span' sx={{ fontWeight: 500, color: ui.muted }}>· {list.length}</Box></Typography>
				<Typography sx={{ fontSize: 14, lineHeight: '20px', color: ui.muted }}>{help}</Typography>
			</Box>
			{showStatus && shownTenants.length > 0 && (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
					{shownTenants.map((t) => {
						const closed = isClosed(t.id);

						return (
							<Box key={t.id} sx={{ px: 1.5, py: 1, fontSize: 14, lineHeight: '20px', ...(closed ? { bgcolor: ui.orangeLight, border: '1px solid #f8c98d', color: '#8a4b00' } : { bgcolor: '#e7f6ee', border: '1px solid #b7e1c8', color: '#0f5132' }) }}>
								{closed ? copy.closed(t.name) : copy.open(t.name)}
							</Box>
						);
					})}
				</Box>
			)}
			{list.length === 0 ? <EmptyBox>{filtersOn ? copy.noRules : empty}</EmptyBox> : grid(list)}
		</Box>
	);

	const kindCards: Array<[Kind, string]> = [ [ 'block', copy.blockHelp ], [ 'allow', copy.allowHelp ], [ 'gain', copy.gainHelp ] ];
	const preview = sentenceOf(draft, groups);
	const titleId = 'rule-panel-title';

	const modal = (
		<Box sx={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderTop: `4px solid ${ui.orange}` }}>
			<Box sx={{ flexShrink: 0, minHeight: 60, pl: { xs: 2, sm: 3 }, pr: 1, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${ui.lineSoft}` }}>
				<Box sx={{ flexGrow: 1, minWidth: 0 }}>
					<Typography id={titleId} component='h2' sx={{ m: 0, fontSize: 20, lineHeight: '28px', fontWeight: 700, color: ui.orangeText, overflowWrap: 'anywhere' }}>{isNew ? (draft.name.trim() || copy.newRule) : (draft.name.trim() || copy.ruleNo(asNumber(selectedId)))}</Typography>
					{!isNew && <Box sx={{ fontSize: 13, color: ui.muted }}>{tenantName(draft.tenantId)} · {copy.ruleNo(asNumber(selectedId))}</Box>}
				</Box>
				<Button onClick={() => setHelpOpen(true)} startIcon={<HelpOutlineOutlinedIcon />} sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600, color: ui.blueDark, display: { xs: 'none', sm: 'inline-flex' } }}>{copy.help}</Button>
				<IconButton onClick={() => setOpen(false)} aria-label={closeLabel()} sx={{ width: 44, height: 44, borderRadius: 0, color: ui.navy }}><CloseOutlinedIcon /></IconButton>
			</Box>

			<Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', px: { xs: 2, sm: 3 }, py: 2, display: 'flex', flexDirection: 'column', gap: 2.25, '@media (max-height: 800px)': { py: 1.5, gap: 1.75 } }}>
				<Box sx={{ p: '12px 14px', bgcolor: '#f8fafc', border: `1px solid ${ui.line}`, borderLeft: `4px solid ${kindStyle[draft.type].bar}` }}>
					<Box sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: ui.slate, mb: 0.5 }}>{copy.preview}</Box>
					<Box role='status' aria-live='polite'><Sentence s={preview} size={16} /></Box>
				</Box>

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: tenants.length > 1 ? '1fr 220px' : '1fr' }, gap: 1.5 }}>
					<TextField label={copy.name} required size='small' value={draft.name} autoFocus={isNew} onChange={(e) => set({ name: e.target.value })} error={dirty && missing.name} helperText={copy.nameHelp} {...fieldProps} />
					{tenants.length > 1 && (
						<TextField select label={tenantLabel()} required size='small' value={draft.tenantId || ''} onChange={(e) => pickTenant(asNumber(e.target.value))} {...fieldProps}>
							{tenants.map((t) => <MenuItem key={t.id} value={asNumber(t.id)}>{t.name}</MenuItem>)}
						</TextField>
					)}
				</Box>

				<Box component='fieldset' sx={{ m: 0, p: 0, border: 0, minWidth: 0 }}>
					<Box component='legend' sx={{ p: 0, mb: 1, fontSize: 14, fontWeight: 700, color: ui.navy }}>{copy.whatKind}</Box>
					<Box role='radiogroup' aria-label={copy.whatKind} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
						{kindCards.map(([ k, help ]) => {
							const on = draft.type === k;
							const st = kindStyle[k];

							return (
								<ButtonBase key={k} role='radio' aria-checked={on} onClick={() => pickKind(k)} sx={{ p: '10px 12px', border: `2px solid ${on ? st.bar : ui.line}`, bgcolor: on ? st.bg : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25, textAlign: 'left', '&:hover': { borderColor: on ? st.bar : ui.slateDot }, '&.Mui-focusVisible': focusRing }}>
									<Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 15, fontWeight: 700, color: on ? st.fg : ui.navy }}>
										<Box component='span' aria-hidden sx={{ width: 14, height: 14, border: `2px solid ${on ? st.bar : ui.slateDot}`, bgcolor: on ? st.bar : '#fff', boxShadow: on ? 'inset 0 0 0 2px #fff' : 'none' }} />
										{st.label()}
									</Box>
									<Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{help}</Box>
								</ButtonBase>
							);
						})}
					</Box>
				</Box>

				<Box component='fieldset' sx={{ m: 0, p: 0, border: 0, minWidth: 0 }}>
					<Box component='legend' sx={{ p: 0, mb: 1, fontSize: 14, fontWeight: 700, color: ui.navy }}>{copy.who}</Box>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: catchAll ? '1fr' : '160px 180px 1fr' }, gap: 1 }}>
						{!catchAll && (
							<Autocomplete
								freeSolo
								size='small'
								options={PARAMETERS.map(([ k ]) => k)}
								getOptionLabel={(o) => paramText(o)}
								inputValue={draft.parameter}
								onInputChange={(_e, v) => set({ parameter: v })}
								renderInput={(params) => <TextField {...params} label={copy.attribute} required error={dirty && missing.parameter} slotProps={{ ...params.slotProps, input: { ...params.slotProps.input, sx: { borderRadius: 0 } } }} />}
							/>
						)}
						<TextField select label={copy.condition} required size='small' value={cond?.id ?? ''} onChange={(e) => pickCondition(e.target.value)} error={dirty && missing.condition} {...fieldProps}>
							{conditionOptions.map((c) => <MenuItem key={c.id} value={c.id}>{c.label()}</MenuItem>)}
						</TextField>
						{!catchAll && (
							<TextField label={copy.value} required size='small' value={draft.value} onChange={(e) => set({ value: e.target.value })} error={dirty && missing.value} placeholder={draft.parameter === 'email' ? '@example.edu.bd' : ''} {...monoInput} />
						)}
					</Box>
					<Box sx={{ mt: 0.75, fontSize: 12, lineHeight: '16px', color: ui.muted }}>{draft.type !== 'block' && catchAll ? copy.anyoneOnlyBlock : copy.attrHelp}</Box>
				</Box>

				{draft.type === 'gain' && (
					<Box component='fieldset' sx={{ m: 0, p: 0, border: 0, minWidth: 0 }}>
						<Box component='legend' sx={{ p: 0, mb: 1, fontSize: 14, fontWeight: 700, color: ui.navy }}>{copy.whatGive}</Box>
						<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: draft.action === 'groupUsers' ? '1fr 1fr' : '1fr' }, gap: 1 }}>
							<TextField select label={copy.action} required size='small' value={draft.action} onChange={(e) => set({ action: e.target.value, accessId: e.target.value === 'groupUsers' ? draft.accessId : '' })} error={dirty && missing.action} {...fieldProps}>
								{ACTIONS.map(([ k, label ]) => <MenuItem key={k} value={k} disabled={k === 'superAdmin' && !superAdmin}>{label()}</MenuItem>)}
							</TextField>
							{draft.action === 'groupUsers' && (
								<TextField select label={copy.group} required size='small' value={tenantGroups.some((g) => sameId(g.id, draft.accessId)) ? draft.accessId : ''} onChange={(e) => set({ accessId: e.target.value })} error={dirty && missing.group} helperText={tenantGroups.length ? undefined : copy.noGroups} {...fieldProps}>
									{tenantGroups.map((g) => <MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>)}
								</TextField>
							)}
						</Box>
						<Box sx={{ mt: 0.75, fontSize: 12, lineHeight: '16px', color: ui.muted }}>{copy.grantsHelp}</Box>
					</Box>
				)}
			</Box>

			<Box sx={{ flexShrink: 0, minHeight: 68, px: { xs: 2, sm: 3 }, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', borderTop: `1px solid ${ui.lineSoft}` }}>
				{!isNew && (confirmDelete
					? <><Button variant='outlined' onClick={() => setConfirmDelete(false)} sx={{ borderRadius: 0, height: 44 }}>{cancelLabel()}</Button><Button variant='contained' onClick={remove} disabled={busy} sx={{ borderRadius: 0, height: 44, boxShadow: 'none', bgcolor: '#b42318', '&:hover': { bgcolor: '#8f1d14' } }}>{copy.deleteConfirm}</Button></>
					: <Button variant='outlined' startIcon={<DeleteOutlineOutlinedIcon />} onClick={remove} disabled={busy} sx={{ ...dangerOutlinedSx, height: 44 }}>{copy.deleteRule}</Button>)}
				<Box role='status' aria-live='polite' sx={{ flexGrow: 1, minWidth: 0, fontSize: 13, color: ui.muted, display: { xs: 'none', sm: 'block' } }}>
					{savedAt && !dirty ? <SavedNote text={copy.saved} /> : copy.foot}
				</Box>
				<Button variant='outlined' onClick={() => setOpen(false)} sx={{ borderRadius: 0, height: 44 }}>{dirty ? cancelLabel() : closeLabel()}</Button>
				<Button onClick={save} disabled={!canSave} sx={{ ...orangeButtonSx, ...(justSaved ? savedButtonSx : {}) }}>{justSaved ? <SavedTick label={copy.saved} /> : isNew ? copy.create : copy.save}</Button>
			</Box>
		</Box>
	);

	const helpText = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, fontSize: 14, lineHeight: '21px', color: ui.body }}>
			<Box>{rulesHelpKindsLabel()}</Box>
			<Typography component='h3' sx={{ m: 0, mt: 0.5, fontSize: 15, fontWeight: 700, color: ui.navy }}>{accessLabel()}</Typography>
			<Box>{rulesHelpStepsLabel()}</Box>
			<Box>{rulesHelpOpenLabel()}</Box>
			<Box>{rulesHelpClosesLabel()}</Box>
			<Box>{rulesHelpBlockLabel()}</Box>
			<Box sx={{ fontStyle: 'italic' }}>{rulesHelpAdminsLabel()}</Box>
			<Typography component='h3' sx={{ m: 0, mt: 0.5, fontSize: 15, fontWeight: 700, color: ui.navy }}>{gainLabel()}</Typography>
			<Box>{rulesHelpGrantLabel()}</Box>
			<Box>{rulesHelpGrantKeepLabel()}</Box>
			<Box>{rulesHelpGrantAccessLabel()}</Box>
		</Box>
	);

	return <>
		<Box ref={listRef} component='section' aria-labelledby='mgmt-section-title' sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 } }}>
			<Box sx={{ display: 'flex', alignItems: { xs: 'center', sm: 'flex-end' }, gap: 1.5, flexWrap: 'wrap' }}>
				<Box sx={{ flexGrow: 1, minWidth: 0 }}>
					<Typography id='mgmt-section-title' component='h2' sx={{ m: 0, fontSize: { xs: 24, md: 28 }, lineHeight: { xs: '32px', md: '36px' }, fontWeight: 700, color: ui.orangeText }}>{rulesLabel()}</Typography>
					<Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 15, lineHeight: '22px', color: ui.muted }}>{copy.subtitle}</Typography>
				</Box>
				<Button variant='outlined' startIcon={<HelpOutlineOutlinedIcon />} onClick={() => setHelpOpen(true)} sx={{ borderRadius: 0, height: 44, color: ui.navy, borderColor: ui.line, bgcolor: '#fff' }}>{copy.help}</Button>
				<ButtonBase onClick={openNew} sx={{ height: 44, gap: 1, pl: 1.75, pr: 2.5, bgcolor: ui.orange, color: ui.navy, fontSize: 15, fontWeight: 600, '&:hover': { bgcolor: ui.orangeHover }, '&.Mui-focusVisible': focusRing }}>
					<AddOutlinedIcon sx={{ fontSize: 20 }} />{copy.addRule}
				</ButtonBase>
			</Box>

			<Box sx={{ p: { xs: 0, sm: 1.5 }, bgcolor: { xs: 'transparent', sm: '#fff' }, border: { xs: 0, sm: `1px solid ${ui.line}` }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
				<TextField
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={phone ? copy.searchShort : copy.search}
					size={phone ? 'medium' : 'small'}
					sx={{ width: { xs: '100%', sm: 300 } }}
					slotProps={{ htmlInput: { 'aria-label': copy.searchShort, type: 'search' }, input: { startAdornment: <InputAdornment position='start'><SearchOutlinedIcon sx={{ color: ui.muted }} /></InputAdornment>, sx: squareInput } }}
				/>
				<Box role='group' aria-label={copy.kind} sx={{ display: 'flex', flexShrink: 0, border: `1px solid ${ui.line}`, bgcolor: '#fff', width: { xs: '100%', sm: 'auto' } }}>
					{([ [ 'all', copy.all, counts.all ], [ 'access', accessLabel(), counts.access ], [ 'gain', gainLabel(), counts.gain ] ] as Array<['all' | 'access' | 'gain', string, number]>).map(([ key, label, n ], i) => {
						const on = kindFilter === key;

						return (
							<ButtonBase key={key} aria-pressed={on} onClick={() => setKindFilter(key)} sx={{ flex: { xs: 1, sm: 'none' }, height: { xs: 42, sm: 38 }, px: 1.75, borderLeft: i ? `1px solid ${ui.line}` : 0, bgcolor: on ? ui.navy : '#fff', color: on ? '#fff' : ui.body, fontSize: 14, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap', '&:hover': { bgcolor: on ? ui.navy : ui.grey }, '&.Mui-focusVisible': focusRing }}>
								{label} {n}
							</ButtonBase>
						);
					})}
				</Box>
				{tenants.length > 1 && (
					<TextField select size='small' value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)} slotProps={{ htmlInput: { 'aria-label': tenantLabel() }, input: { sx: squareInput } }} sx={{ minWidth: 170, width: { xs: '100%', sm: 'auto' } }}>
						<MenuItem value='all'>{copy.allTenants}</MenuItem>
						{tenants.map((t) => <MenuItem key={t.id} value={String(t.id)}>{t.name}</MenuItem>)}
					</TextField>
				)}
				{filtersOn && <Button onClick={() => { setSearch(''); setKindFilter('all'); setTenantFilter('all'); }} sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600 }}>{copy.clearFilters}</Button>}
			</Box>

			{loading && rules.length === 0 ? (
				<Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.75 }}>
					{[ 0, 1, 2, 3 ].map((i) => <Skeleton key={i} variant='rectangular' height={96} sx={{ borderRadius: 0 }} />)}
				</Box>
			) : <>
				{kindFilter !== 'gain' && group(copy.access, copy.accessHelp, accessRules, copy.noAccess, true)}
				{kindFilter !== 'access' && group(copy.grants, copy.grantsHelp, grantRules, copy.noGrants, false)}
			</>}
		</Box>

		<Dialog
			open={open}
			onClose={() => setOpen(false)}
			fullScreen={phone}
			fullWidth
			maxWidth={false}
			slots={{ transition: SlideDown }}
			transitionDuration={reduceMotion ? 0 : modalDuration}
			slotProps={{
				transition: { easing: modalEasing },
				paper: { 'aria-labelledby': titleId, sx: { width: phone ? '100%' : 720, maxWidth: '100%', m: phone ? 0 : 2, maxHeight: phone ? '100%' : 'calc(100% - 32px)', borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } },
			}}
		>
			{modal}
		</Dialog>

		<Dialog open={helpOpen} onClose={() => setHelpOpen(false)} fullScreen={phone} slotProps={{ paper: { 'aria-labelledby': 'rules-help-title', sx: { borderRadius: 0, borderTop: `4px solid ${ui.blueDark}`, width: phone ? '100%' : 640, maxWidth: '100%', m: phone ? 0 : 2 } } }}>
			<Box sx={{ minHeight: 56, pl: 3, pr: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${ui.lineSoft}` }}>
				<Typography id='rules-help-title' component='h2' sx={{ flexGrow: 1, m: 0, fontSize: 18, fontWeight: 700, color: ui.navy }}>{rulesHelpTitleLabel()}</Typography>
				<IconButton onClick={() => setHelpOpen(false)} aria-label={closeLabel()} sx={{ width: 44, height: 44, borderRadius: 0, color: ui.navy }}><CloseOutlinedIcon /></IconButton>
			</Box>
			<Box sx={{ px: 3, py: 2, overflowY: 'auto' }}>{helpText}</Box>
		</Dialog>
	</>;
};

export default RuleTable;
