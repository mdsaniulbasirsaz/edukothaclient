import { Box, Switch, Typography } from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { asNumber, focusRing, ui } from '../users/userUi';

// Shared pieces for the tenant settings page (Tenant.tsx and its sections).

// Some services answer with a paginated { data: [] }, others with a bare array.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowsOf = <T, >(res: any): T[] => (Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []);
export const sameId = (a: unknown, b: unknown) => asNumber(a) === asNumber(b);

export const orangeButtonSx = { borderRadius: 0, height: 44, px: 2.5, bgcolor: ui.orange, color: ui.navy, fontWeight: 600, boxShadow: 'none', '&:hover': { bgcolor: ui.orangeHover, boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: ui.lineSoft, color: ui.muted } } as const;
export const outlinedBlueSx = { borderRadius: 0, height: 40, color: ui.blueDark, borderColor: ui.blueDark, fontWeight: 600, bgcolor: '#fff' } as const;
export const fieldProps = { slotProps: { input: { sx: { borderRadius: 0, bgcolor: '#fff' } } } } as const;
export const monoInput = { slotProps: { input: { sx: { borderRadius: 0, bgcolor: '#fff', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: 14 } } } } as const;
export const dangerOutlinedSx = { borderRadius: 0, color: '#b42318', borderColor: '#b42318', bgcolor: '#fff', '&:hover': { borderColor: '#8f1d14', bgcolor: '#fdecec' } } as const;
export const removeButtonSx = { borderRadius: 0, height: 36, minWidth: 0, color: ui.body, borderColor: ui.line, '&:hover': { bgcolor: '#fdecec', color: '#b42318', borderColor: '#f3c7c2' } } as const;

// The console's on/off switch (brief 2026-10-18): a 46×26 pill, grey when
// off and blue when on, a white knob that springs across with a blue check
// mark, a light-blue ring for keyboard focus only, and a faded, not-allowed
// look when disabled. MUI's Switch keeps the real checkbox (role="switch"),
// so props, events and labels stay as they were.
const switchColors = { off: '#D0D5DD', offHover: '#B8BFCB', on: '#0B5CFF', onHover: '#0047D6', ring: '#DCE7FF' } as const;
const switchCheck = 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22%3E%3Cpath d=%22M2.5 6.2 4.9 8.5 9.5 3.6%22 fill=%22none%22 stroke=%22%230B5CFF%22 stroke-width=%221.8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E")';

export const switchSx = {
	flexShrink: 0,
	width: 46,
	height: 26,
	p: 0,
	borderRadius: '13px',
	overflow: 'visible',
	'& .MuiSwitch-switchBase': {
		p: '3px',
		color: '#fff',
		transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
		'&:hover': { bgcolor: 'transparent' },
		'&.Mui-checked': { transform: 'translateX(20px)', color: '#fff', '&:hover': { bgcolor: 'transparent' } },
		'&.Mui-checked + .MuiSwitch-track': { bgcolor: switchColors.on, opacity: 1 },
		'&.Mui-checked .MuiSwitch-thumb::after': { opacity: 1 },
		'&.Mui-disabled': { color: '#fff' },
		'&.Mui-disabled + .MuiSwitch-track': { opacity: 1 },
		'& .MuiTouchRipple-root': { display: 'none' },
	},
	'& .MuiSwitch-thumb': {
		position: 'relative',
		width: 20,
		height: 20,
		borderRadius: '50%',
		bgcolor: '#fff',
		boxShadow: '0 1px 3px rgba(16, 24, 40, 0.18), 0 1px 2px rgba(16, 24, 40, 0.12)',
		'&::after': { content: '""', position: 'absolute', inset: 4, backgroundImage: switchCheck, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', opacity: 0, transition: 'opacity 160ms ease' },
	},
	'& .MuiSwitch-track': { borderRadius: '13px', opacity: 1, bgcolor: switchColors.off, transition: 'background-color 160ms ease' },
	'&:hover:not(:has(.Mui-disabled)) .MuiSwitch-track': { bgcolor: switchColors.offHover },
	'&:hover:not(:has(.Mui-disabled)) .Mui-checked + .MuiSwitch-track': { bgcolor: switchColors.onHover },
	'&:has(.Mui-focusVisible)': { boxShadow: `0 0 0 4px ${switchColors.ring}` },
	'&:has(.Mui-disabled)': { opacity: 0.5, cursor: 'not-allowed' },
	'@media (prefers-reduced-motion: reduce)': { '& .MuiSwitch-switchBase, & .MuiSwitch-thumb::after, & .MuiSwitch-track': { transition: 'none' } },
} as const;

export const ToggleRow = ({ title, desc, checked, onChange, disabled }: { title: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
	<Box component='label' sx={{ minHeight: 60, py: 1, display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${ui.lineSoft}`, cursor: disabled ? 'default' : 'pointer' }}>
		<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
			<Box component='span' sx={{ fontSize: 15, lineHeight: '20px', fontWeight: 600, color: ui.navy }}>{title}</Box>
			{desc && <Box component='span' sx={{ fontSize: 13, lineHeight: '18px', color: ui.muted }}>{desc}</Box>}
		</Box>
		<Switch checked={checked} onChange={(_e, v) => onChange(v)} disabled={disabled} slotProps={{ input: { 'aria-label': title } }} sx={switchSx} />
	</Box>
);

export const SavedNote = ({ text }: { text: string }) => (
	<Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 14, fontWeight: 600, color: ui.green }}>
		<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 18 }} />{text}
	</Box>
);

export const EmptyBox = ({ children }: { children: React.ReactNode }) => (
	<Box sx={{ p: 3, border: '1px dashed #b8c6da', textAlign: 'center', fontSize: 14, lineHeight: '20px', color: ui.muted }}>{children}</Box>
);

export const SubHeading = ({ children, count }: { children: React.ReactNode; count?: number }) => (
	<Typography component='h3' sx={{ m: 0, fontSize: 16, lineHeight: '22px', fontWeight: 700, color: ui.navy }}>
		{children}{count !== undefined && <Box component='span' sx={{ fontWeight: 500, color: ui.muted }}> · {count}</Box>}
	</Typography>
);

// The body and footer of one settings section. The footer holds a status
// line on the left and the section's buttons on the right.
export const SectionBody = ({ children, footer, status }: { children: React.ReactNode; footer?: React.ReactNode; status?: React.ReactNode }) => (
	<>
		<Box sx={{ flexGrow: 1, minHeight: 0, px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.25 }, display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</Box>
		<Box sx={{ flexShrink: 0, minHeight: 68, px: { xs: 2, sm: 3 }, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', borderTop: `1px solid ${ui.lineSoft}` }}>
			<Box role='status' aria-live='polite' sx={{ flexGrow: 1, minWidth: 0, fontSize: 13, lineHeight: '18px', color: ui.muted }}>{status}</Box>
			{footer}
		</Box>
	</>
);

export const focusSx = { '&.Mui-focusVisible': focusRing } as const;
