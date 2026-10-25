import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import ButtonBase from '@mui/material/ButtonBase';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import SvgIcon from '@mui/material/SvgIcon';
import { visuallyHidden } from '@mui/utils';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { SvgIconComponent } from '@mui/icons-material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import TenantTable from '../../components/managementservice/tenants/Tenant';
import RoomTable from '../../components/managementservice/rooms/Room';
import GroupTable from '../../components/managementservice/groups/Groups';
import UserTable from '../../components/managementservice/users/Users';
import RoleTable from '../../components/managementservice/role/Role';
import { getData, getDataByID, getUserData, startMGMTListeners, stopMGMTListeners } from '../../store/actions/managementActions';
import { sectionEnterSx } from '../../components/managementservice/motion';
import Overview from '../../components/managementservice/overview/Overview';
import { useAppDispatch, useAppSelector, useNotifier } from '../../store/hooks';
import { adminLogin, checkJWT, logout } from '../../store/actions/permissionsActions';
import { setLocale } from '../../store/actions/localeActions';
import { managamentActions } from '../../store/slices/managementSlice';
import SignIn from '../../components/settingsdialog/managementsettings/ManagementAdminLoginSettings';
import RuleTable from '../../components/managementservice/rules/Rule';
import { CustomLoginButton } from '../../components/controlbuttons/LoginButton';
import { emailAddressLabel, passwordLabel, signInLabel, defaultsLabel, groupsLabel, logoutLabel, meetingsLabel, rolesLabel, roomsLabel, rulesLabel, selectLanguageLabel, tenantsLabel, usersLabel } from '../../components/translated/translatedComponents';
import DefaultTable from '../../components/managementservice/defaults/Defaults';
import MeetingsTable from '../../components/managementservice/meetings/Meetings';
import { localeList } from '../../utils/intlManager';
import { ThemeProvider, alpha, createTheme } from '@mui/material/styles';
import edumeetConfig from '../../utils/edumeetConfig';

const mgmtBrand = {
	navy: '#042c6a',
	navyDeep: '#06214f',
	navyLight: '#0b3f8f',
	blue: '#1a81ec',
	blueDark: '#1668c4',
	blueLight: '#e8f2fd',
	orange: '#fe9b2a',
	orangeDark: '#e8851a',
	orangeLight: '#fff3e5',
	// The brand orange darkened for text: 3:1 or more on white, the page
	// grey and orangeLight, so it is only used at 20px bold and up.
	orangeText: '#c96a00',
	surface: '#f4f7fb',
	white: '#ffffff',
	text: '#0f1f3a',
	textSecondary: '#5b6b82',
	border: '#d6e2f2',
	borderStrong: '#7d8ea8',
	error: '#d6333a',
	success: '#1f9d55',
	successDark: '#177a45',
} as const;

// Neutral slate greys for the sign-in page and the sidebar, rail and drawer
// (plan §7.2). The sidebar is white.
const mgmtNeutral = {
	bg: '#f8fafc',
	panel: '#ffffff',
	hover: '#f1f5f9',
	line: '#e2e8f0',
	ink: '#0f172a',
	text: '#334155',
	muted: '#475569',
	label: '#64748b',
} as const;

const mgmtSurface = {
	onNavyText: alpha(mgmtBrand.white, 0.8),
	onNavyDivider: alpha(mgmtBrand.white, 0.12),
	rowHover: mgmtBrand.blueLight,
	rowSelected: alpha(mgmtBrand.blue, 0.12),
	dangerHover: alpha(mgmtBrand.error, 0.08),
	dialogBackdrop: alpha(mgmtBrand.navy, 0.5),
} as const;

const mgmtShape = {
	radius: 10,
	itemRadius: 12,
	cardRadius: 16,
	dialogRadius: 16,
	pill: 999,
} as const;

const mgmtShadow = {
	card: `0 1px 2px ${alpha(mgmtBrand.navy, 0.06)}, 0 4px 16px ${alpha(mgmtBrand.navy, 0.06)}`,
	cardHover: `0 2px 4px ${alpha(mgmtBrand.navy, 0.08)}, 0 8px 24px ${alpha(mgmtBrand.navy, 0.1)}`,
	header: `0 1px 0 ${mgmtBrand.border}`,
	dialog: `0 24px 60px ${alpha(mgmtBrand.navy, 0.3)}`,
	// Neutral shadow for the sign-in card.
	signInCard: `0 1px 2px ${alpha(mgmtNeutral.ink, 0.04)}, 0 24px 48px ${alpha(mgmtNeutral.ink, 0.08)}`,
} as const;

const mgmtType = {
	greeting: { fontSize: 28, lineHeight: '36px', fontWeight: 600 },
	pageTitle: { fontSize: 24, lineHeight: '32px', fontWeight: 600 },
	pageTitlePhone: { fontSize: 20, lineHeight: '28px' },
	headerTitle: { fontSize: 20, lineHeight: '28px', fontWeight: 600 },
	sectionTitle: { fontSize: 16, lineHeight: '24px', fontWeight: 600 },
	body: { fontSize: 14, lineHeight: '20px' },
	caption: { fontSize: 12, lineHeight: '16px' },
	groupLabel: { fontSize: 11, lineHeight: '16px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
} as const;

const mgmtLayout = {
	sidebarWidth: 248,
	railWidth: 64,
	mobileDrawerWidth: 'min(300px, 85vw)',
	headerHeight: 64,
	headerHeightCompact: 56,
	navItemHeight: 40,
	navItemHeightCompact: 36,
	contentMaxWidth: 1440,
	gutter: 24,
	gutterPhone: 16,
} as const;

const shortScreen = '@media (min-width: 900px) and (max-height: 700px)';
const reducedMotion = '@media (prefers-reduced-motion: reduce)';

const mgmtTransition = 'background-color 150ms ease, color 150ms ease, box-shadow 150ms ease';

const focusRing = (color: string = mgmtBrand.blue, width = 2, offset = 2) => ({
	outline: `${width}px solid ${color}`,
	outlineOffset: offset,
});

const desktopUp = '@media (min-width: 900px)';

const maskIcon = (path: string, size = 18) => ({
	content: '""',
	display: 'inline-block',
	flexShrink: 0,
	width: size,
	height: size,
	marginRight: '8px',
	backgroundColor: 'currentColor',
	mask: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='${path}'/%3E%3C/svg%3E") center / contain no-repeat`,
});

const plusIcon = 'M12 5v14M5 12h14';
const trashIcon = 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6';

const addItemSlot = 'div:has(+ .MuiPaper-root) > &';

const mrtPaper = '&:has(> .MuiTableContainer-root)';

const threeChecks = '> .MuiFormControlLabel-root ~ .MuiFormControlLabel-root ~ .MuiFormControlLabel-root';
const settingsDialog = `:has(${threeChecks})`;

const orangeButton = {
	backgroundColor: mgmtBrand.orange,
	color: mgmtBrand.navy,
	border: 0,
	padding: '0 18px',
	'&:hover': { backgroundColor: mgmtBrand.orangeDark, border: 0 },
	'&.Mui-disabled': { backgroundColor: '#e6ebf2', color: mgmtBrand.borderStrong },
};

const outlinedBlueButton = {
	backgroundColor: mgmtBrand.white,
	color: mgmtBrand.blueDark,
	border: `1px solid ${mgmtBrand.blue}`,
	padding: '0 17px',
	'&:hover': { backgroundColor: mgmtBrand.blueLight, border: `1px solid ${mgmtBrand.blue}` },
};

const mgmtTheme = createTheme(edumeetConfig.theme, {
	palette: {
		primary: { main: mgmtBrand.blue, dark: mgmtBrand.blueDark, light: mgmtBrand.blueLight, contrastText: mgmtBrand.white },
		secondary: { main: mgmtBrand.orange, dark: mgmtBrand.orangeDark, contrastText: mgmtBrand.navy },
		error: { main: mgmtBrand.error, contrastText: mgmtBrand.white },
		success: { main: mgmtBrand.successDark, light: mgmtBrand.success, contrastText: mgmtBrand.white },
		background: { default: mgmtBrand.white, paper: mgmtBrand.white },
		text: { primary: mgmtBrand.text, secondary: mgmtBrand.textSecondary },
		divider: mgmtBrand.border,
	},
	shape: { borderRadius: mgmtShape.radius },
	components: {
		
		MuiButton: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					fontWeight: 600,
					fontSize: 14,
					minHeight: 40,
					borderRadius: mgmtShape.radius,
					transition: mgmtTransition,
					'&.Mui-focusVisible': focusRing(),
					[reducedMotion]: { transition: 'none' },
					[addItemSlot]: {
						...orangeButton,
						padding: '0 16px 0 12px',
						'&::before': maskIcon(plusIcon),
					},
					
					[`.MuiDialog-root ${addItemSlot}, .MuiDrawer-root ${addItemSlot}`]: {
						...outlinedBlueButton,
						padding: '0 16px 0 12px',
					},
					variants: [
						{
							props: { variant: 'contained' },
							style: { boxShadow: 'none', '&:hover, &:active': { boxShadow: 'none' } },
						},
						{
							props: { variant: 'contained', color: 'primary' },
							style: {
								backgroundColor: mgmtBrand.blueDark,
								'&:hover': { backgroundColor: mgmtBrand.navyLight },
							},
						},
						{
							props: { variant: 'contained', color: 'secondary' },
							style: {
								color: mgmtBrand.navy,
								'&:hover': { backgroundColor: mgmtBrand.orangeDark },
							},
						},
						{
							props: { variant: 'outlined' },
							style: outlinedBlueButton,
						},
						{
							props: { variant: 'text' },
							style: {
								color: mgmtBrand.blueDark,
								'&:hover': { backgroundColor: mgmtBrand.blueLight },
							},
						},
						{
							props: { color: 'warning' },
							style: {
								color: mgmtBrand.error,
								'&:hover': { backgroundColor: mgmtSurface.dangerHover },
							},
						},
					],
				},
			},
		},
		MuiIconButton: {
			styleOverrides: {
				root: { '&.Mui-focusVisible': focusRing() },
			},
		},
		
		MuiPaper: {
			styleOverrides: {
				root: {
					[mrtPaper]: {
						backgroundImage: 'none',
						border: `1px solid ${mgmtBrand.border}`,
						borderRadius: mgmtShape.cardRadius,
						boxShadow: mgmtShadow.card,
						'& > .MuiBox-root:first-of-type': {
							minHeight: 72,
							borderBottom: `1px solid ${mgmtBrand.border}`,
							'& > .MuiBox-root': { padding: '16px 20px', alignItems: 'center' },
							'& .MuiIconButton-root': { color: mgmtBrand.navy, borderRadius: mgmtShape.radius },
						},
						'& > .MuiBox-root:last-of-type': {
							minHeight: 56,
							boxShadow: 'none',
							borderTop: `1px solid ${mgmtBrand.border}`,
						},
					},
				},
			},
		},
		MuiTableHead: {
			styleOverrides: {
				root: {
					'& .MuiTableRow-root': { backgroundColor: mgmtBrand.surface, boxShadow: 'none' },
				},
			},
		},
		MuiTableBody: {
			styleOverrides: {
				root: {
					'& .MuiTableRow-root': { cursor: 'pointer' },
					'& .MuiTableRow-root:hover td::after': { backgroundColor: mgmtSurface.rowHover },
				},
			},
		},
		MuiTableCell: {
			styleOverrides: {
				root: {
					borderBottomColor: mgmtBrand.border,
					fontSize: 14,
					'&.MuiTableCell-head': {
						color: mgmtBrand.navy,
						fontSize: 13,
						fontWeight: 600,
					},
					'& .MuiTableSortLabel-icon': { color: `${mgmtBrand.blue} !important` },
					
					'&:first-of-type': { width: '88px !important', minWidth: '88px !important', maxWidth: '88px !important' },
				},
			},
		},
		MuiTablePagination: {
			styleOverrides: {
				root: { color: mgmtBrand.textSecondary, fontSize: 13 },
			},
		},
		MuiDialog: {
			styleOverrides: {
				paper: {
					borderRadius: mgmtShape.dialogRadius,
					borderTop: `4px solid ${mgmtBrand.orange}`,
					boxShadow: mgmtShadow.dialog,
					maxWidth: 'calc(100% - 32px)',
					maxHeight: 'calc(100% - 64px)',
					[desktopUp]: {
						[`&:has(> .MuiDialogContent-root ${threeChecks})`]: {
							width: '100%',
							maxWidth: 680,
						},
					},
				},
				backdrop: { backgroundColor: mgmtSurface.dialogBackdrop },
			},
		},
		MuiDialogTitle: {
			styleOverrides: {
				root: {
					color: mgmtBrand.navy,
					fontSize: 20,
					lineHeight: '28px',
					fontWeight: 600,
					padding: '20px 24px 8px',
				},
			},
		},
		MuiDialogContentText: {
			styleOverrides: {
				root: { color: mgmtBrand.textSecondary, fontSize: 14, lineHeight: '20px' },
			},
		},
		MuiDialogContent: {
			styleOverrides: {
				root: {
					
					'& h4': {
						margin: '28px 0 8px',
						fontSize: 16,
						lineHeight: '24px',
						fontWeight: 600,
						color: mgmtBrand.navy,
					},
					'& hr': { display: 'none' },
					
					[desktopUp]: {
						[`&${settingsDialog}`]: {
							display: 'grid',
							gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
							columnGap: 16,
							alignContent: 'start',
							'& > *': { gridColumn: '1 / -1' },
							'& > .MuiFormControl-root, & > .MuiAutocomplete-root': { gridColumn: 'span 3' },
							'& > .MuiFormControlLabel-root': { gridColumn: 'span 2', marginRight: 0 },
							'& > .MuiFormControl-root + .MuiFormControlLabel-root, & > .MuiAutocomplete-root + .MuiFormControlLabel-root': {
								gridColumn: '1 / span 2',
							},
						},
					},
				},
			},
		},
		
		MuiDialogActions: {
			styleOverrides: {
				root: {
					padding: '16px 24px',
					gap: 8,
					borderTop: `1px solid ${mgmtBrand.border}`,
					'& > :not(style) ~ :not(style)': { marginLeft: 0 },
					'& > .MuiButton-colorWarning': {
						marginRight: 'auto',
						padding: '0 12px',
						'&::before': maskIcon(trashIcon),
					},
					'& > .MuiButton-text.MuiButton-colorPrimary': outlinedBlueButton,
					'& > .MuiButton-text.MuiButton-colorPrimary:last-child': orangeButton,
				},
			},
		},
		// Outlines need 3:1 (borderStrong, 3.3:1); a focused field gets a 2px blue
		// ring and a blueDark label (4.9:1 on white).
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					borderRadius: mgmtShape.radius,
					'& .MuiOutlinedInput-notchedOutline': { borderColor: mgmtBrand.borderStrong },
					'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: mgmtBrand.navy },
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: mgmtBrand.blue, borderWidth: 2 },
					'&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: mgmtBrand.error },
					'&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: mgmtBrand.border },
				},
			},
		},
		MuiFormLabel: {
			styleOverrides: {
				root: {
					color: mgmtBrand.textSecondary,
					'&.Mui-focused': { color: mgmtBrand.blueDark, fontWeight: 600 },
					'&.Mui-error': { color: mgmtBrand.error },
				},
			},
		},
		MuiCheckbox: {
			styleOverrides: {
				root: {
					color: mgmtBrand.borderStrong,
					'&.Mui-checked, &.MuiCheckbox-indeterminate': { color: mgmtBrand.blue },
					'&.Mui-focusVisible': focusRing(),
				},
			},
		},
		MuiFormControlLabel: {
			styleOverrides: {
				label: { fontSize: 14, color: mgmtBrand.text },
			},
		},
		MuiLink: {
			styleOverrides: {
				root: { color: mgmtBrand.blueDark },
			},
		},
		MuiChip: {
			styleOverrides: {
				root: {
					fontWeight: 500,
					backgroundColor: mgmtBrand.blueLight,
					color: mgmtBrand.blueDark,
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					backgroundColor: mgmtBrand.navy,
					color: mgmtBrand.white,
					borderRadius: 8,
					fontSize: 12,
					fontWeight: 500,
					boxShadow: mgmtShadow.dialog,
				},
				arrow: { color: mgmtBrand.navy },
			},
		},
		MuiPopover: {
			styleOverrides: {
				paper: { borderRadius: mgmtShape.itemRadius, boxShadow: mgmtShadow.cardHover },
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: {
					fontSize: 14,
					'&:hover': { backgroundColor: mgmtBrand.blueLight },
					'&.Mui-selected, &.Mui-selected:hover': { backgroundColor: mgmtSurface.rowSelected },
				},
			},
		},
	},
});

const copy = {
	admin: 'Admin',
	dashboard: 'Dashboard',
	signIn: 'Sign in',
	back: 'Back',
	navigation: 'Admin navigation',
	home: 'eduKotha home',
	openMenu: 'Open menu',
	closeMenu: 'Close menu',
	collapseSidebar: 'Collapse sidebar',
	expandSidebar: 'Expand sidebar',
	accountMenu: 'Account menu',
	groups: {
		overview: 'Overview',
		meetings: 'Meetings',
		people: 'People & access',
		tenant: 'Tenant',
	},
	roles: {
		tenantOwner: 'Tenant owner',
		tenantAdmin: 'Tenant admin',
	},
	descriptions: {
		room: 'Create rooms and set owners, roles and features.',
		meetings: 'Scheduled meetings and their invitations.',
		user: 'Find people and manage their accounts.',
		group: 'Put users together and give them roles at once.',
		role: 'Decide what each role is allowed to do.',
		tenant: 'Institutions, their owners and admins.',
		rule: 'Grant access or roles automatically.',
		default: 'Default values for new rooms.',
	} as Record<string, string>,
	clickRow: 'Click a row to edit it.',
	tapRow: 'Tap a row to edit it.',
	swipeHint: 'Swipe the table for more columns',
	welcome: 'Welcome back',
	dashboardIntro: 'Choose what you want to manage. You see only the areas your role allows.',
	signInTitle: 'Sign in to manage your institution',
	signInSubtitle: 'Rooms, people and settings for your eduKotha.',
	signInMethod: 'Sign-in method',
	tabInstitution: 'Institution',
	tabLocal: 'Local admin',
	institutionHint: 'Continue with your institution\'s single sign-on.',
	showPassword: 'Show password',
	hidePassword: 'Hide password',
	footerNote: 'Bangladesh Research and Education Network (BdREN)',
	skipToContent: 'Skip to content',
	loading: 'Loading',
	changingLanguage: 'Changing language',
} as const;

type NavGroupId = keyof typeof copy.groups;

type NavItem = {
	key: string;
	label: string;
	icon: SvgIconComponent;
	group: NavGroupId;
	visible: boolean;
};

const navGroupOrder: NavGroupId[] = [ 'overview', 'meetings', 'people', 'tenant' ];

// Sidebar design A (canvas "Admin Sidebar Redesign", 2026-10-25): square
// rows, sentence-case group labels, and the open section as a solid navy
// block with white text.
const navItemSx = {
	minHeight: mgmtLayout.navItemHeight,
	borderRadius: 0,
	px: 1.5,
	gap: 1.5,
	color: mgmtNeutral.text,
	transition: mgmtTransition,
	'& .MuiListItemIcon-root': { minWidth: 0, color: mgmtNeutral.label },
	'& .MuiSvgIcon-root': { fontSize: 20 },
	'& .MuiListItemText-root': { my: 0 },
	'& .MuiListItemText-primary': { fontSize: 14, lineHeight: '20px', fontWeight: 400 },
	'&:hover': { backgroundColor: mgmtNeutral.hover, color: mgmtNeutral.ink },
	'&:hover .MuiListItemIcon-root': { color: mgmtNeutral.ink },
	'&.Mui-focusVisible': { ...focusRing(mgmtBrand.blue, 2, -2), backgroundColor: mgmtNeutral.hover },
	'&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
		backgroundColor: mgmtBrand.navy,
		color: mgmtBrand.white,
	},
	'&.Mui-selected.Mui-focusVisible': { outlineColor: mgmtBrand.orange },
	'&.Mui-selected .MuiListItemIcon-root': { color: mgmtBrand.white },
	'&.Mui-selected .MuiListItemText-primary': { fontWeight: 500 },
	[shortScreen]: { minHeight: mgmtLayout.navItemHeightCompact },
	[reducedMotion]: { transition: 'none' },
} as const;

const groupLabelSx = {
	display: 'block',
	px: 1.5,
	pb: 0.75,
	fontSize: 12,
	lineHeight: '16px',
	fontWeight: 600,
	color: mgmtBrand.textSecondary,
	[shortScreen]: { pb: 0.5 },
} as const;

// Small square icon buttons in the sidebar and rail (collapse, logout).
const sidebarIconButtonSx = {
	width: 36,
	height: 36,
	flexShrink: 0,
	borderRadius: 0,
	color: mgmtNeutral.label,
	'&:hover': { backgroundColor: mgmtNeutral.hover, color: mgmtNeutral.ink },
	'&.Mui-focusVisible': focusRing(mgmtBrand.blue, 2, -2),
} as const;

// The collapse / expand glyph: a panel with an arrow pointing in or out.
const PanelIcon = ({ open }: { open: boolean }) => (
	<SvgIcon viewBox='0 0 24 24' sx={{ fontSize: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
		<path d={open ? 'M4 4h16v16H4zM9 4v16M16 10l-2 2 2 2' : 'M4 4h16v16H4zM9 4v16M14 10l2 2-2 2'} />
	</SvgIcon>
);

const BrandMark = ({ size = 'md', onNavy = false }: { size?: 'sm' | 'md'; onNavy?: boolean }) => (
	<Box sx={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? 1 : 1.25, minWidth: 0 }}>
		<Box
			component={Link}
			to='/'
			aria-label={copy.home}
			sx={{
				display: 'flex',
				alignItems: 'center',
				px: size === 'sm' ? 1 : 1.25,
				py: size === 'sm' ? 0.625 : 0.75,
				bgcolor: mgmtBrand.white,
				borderRadius: '8px',
				'&:focus-visible': focusRing(onNavy ? mgmtBrand.white : mgmtBrand.blue),
			}}
		>
			<Box
				component='img'
				src={edumeetConfig.theme.logo}
				alt=''
				sx={{ display: 'block', height: size === 'sm' ? 18 : 22, width: 'auto', maxWidth: 120 }}
			/>
		</Box>
		<Box
			component='span'
			sx={{
				fontSize: size === 'sm' ? 10 : 11,
				lineHeight: size === 'sm' ? '14px' : '16px',
				fontWeight: 700,
				letterSpacing: '0.08em',
				textTransform: 'uppercase',
				color: mgmtBrand.navy,
				bgcolor: mgmtBrand.orange,
				px: size === 'sm' ? 0.75 : 1,
				py: 0.25,
				borderRadius: `${mgmtShape.pill}px`,
			}}
		>
			{copy.admin}
		</Box>
	</Box>
);

const smUp = '@media (min-width: 600px)';

const subheadingSx = {
	m: 0,
	fontSize: 16,
	lineHeight: '24px',
	fontWeight: 600,
	color: mgmtBrand.navy,
} as const;

const sectionBodySx = {
	display: 'flex',
	flexDirection: 'column',
	gap: 3,
	'& hr': { display: 'none' },
	'& h4': { ...subheadingSx, mt: 1, mb: 1 },
	'& > div:has(+ .MuiPaper-root)': {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-start',
		marginBottom: '-12px',
		[smUp]: { position: 'relative', zIndex: 3, marginBottom: '-24px' },
	},
	'& > div:has(+ .MuiPaper-root) > .MuiButton-outlined': {
		[smUp]: { position: 'absolute', top: 'calc(100% + 16px)', left: 20 },
	},

	'& > div:has(> h4):has(+ .MuiPaper-root)': {
		[smUp]: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 1.5,
			height: 72,
			boxSizing: 'border-box',
			px: 2.5,
			marginBottom: '-96px',
			pointerEvents: 'none',
			'& > *': { pointerEvents: 'auto' },
		},
	},
	'& > div:has(> h4):has(+ .MuiPaper-root) > h4': {
		[smUp]: { m: 0, whiteSpace: 'nowrap' },
	},
	'& > div:has(> h4):has(+ .MuiPaper-root) > .MuiButton-outlined': {
		...outlinedBlueButton,
		minHeight: 36,
		height: 36,
		padding: '0 14px 0 10px',
		[smUp]: { position: 'static' },
	},
	
	'@container mgmt-section (min-width: 1100px)': {
		'&:has(> div > h4)': {
			display: 'grid',
			gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
			columnGap: 3,
			rowGap: 3,
			alignItems: 'start',
			'& > div:has(+ .MuiPaper-root)': { alignSelf: 'start', marginBottom: 0 },
			'& > div:not(:has(> h4)), & > div:not(:has(> h4)) + .MuiPaper-root': { gridRow: 1, gridColumn: '1 / -1' },
			'& > div:has(> h4), & > div:has(> h4) + .MuiPaper-root': { gridRow: 2, gridColumn: 1 },
			'& > div:has(> h4) ~ div:has(> h4), & > div:has(> h4) ~ div:has(> h4) + .MuiPaper-root': { gridRow: 2, gridColumn: 2 },
		},
	},
} as const;

type SectionProps = {
	icon: SvgIconComponent;
	title: string;
	description?: string;
	children: React.ReactNode;
};

const Section = ({ icon: Icon, title, description, children }: SectionProps) => (
	<Box component='section' aria-labelledby='mgmt-section-title' sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.5 }, container: 'mgmt-section / inline-size' }}>
		<Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
			<Box sx={{ width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, flexShrink: 0, borderRadius: `${mgmtShape.itemRadius}px`, bgcolor: mgmtBrand.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				<Icon sx={{ color: mgmtBrand.blue, fontSize: { xs: 20, md: 24 } }} />
			</Box>
			<Box sx={{ minWidth: 0 }}>
				<Typography id='mgmt-section-title' component='h2' sx={{ m: 0, ...mgmtType.pageTitle, fontSize: { xs: 20, md: 24 }, lineHeight: { xs: '28px', md: '32px' }, color: mgmtBrand.navy }}>
					{title}
				</Typography>
				{description && (
					<Typography sx={{ ...mgmtType.body, fontSize: { xs: 13, md: 14 }, color: mgmtBrand.textSecondary }}>
						{description}{' '}
						<Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}>{copy.clickRow}</Box>
						<Box component='span' sx={{ display: { xs: 'inline', md: 'none' } }}>{copy.tapRow}</Box>
					</Typography>
				)}
			</Box>
		</Box>
		<Box sx={sectionBodySx}>{children}</Box>
		<Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.75, ...mgmtType.caption, fontSize: 13, color: mgmtBrand.textSecondary }}>
			<ArrowForwardOutlinedIcon sx={{ fontSize: 16, color: mgmtBrand.blue }} />
			{copy.swipeHint}
		</Box>
	</Box>
);

// Signed-out card (user brief 2026-10-13): one centred card with a small
// logo, a short title and two tabs, "Institution" (tenant SSO) and
// "Local admin" (email + password). Built here rather than by restyling the
// shared SignIn so the markup can follow the design; it dispatches the same
// login() and adminLogin() actions.
type SignInTab = 'institution' | 'local';

const signInTabsSx = {
	minHeight: 44,
	p: '4px',
	borderRadius: `${mgmtShape.radius + 2}px`,
	bgcolor: mgmtNeutral.hover,
	border: `1px solid ${mgmtNeutral.line}`,
	'& .MuiTabs-indicator': { display: 'none' },
	'& .MuiTab-root': {
		flex: 1,
		minHeight: 36,
		minWidth: 0,
		px: 1.5,
		borderRadius: `${mgmtShape.radius}px`,
		textTransform: 'none',
		fontSize: 14,
		lineHeight: '20px',
		fontWeight: 500,
		color: mgmtNeutral.muted,
		transition: mgmtTransition,
		'&:hover': { color: mgmtNeutral.ink },
		'&.Mui-focusVisible': focusRing(mgmtBrand.blue, 2, -2),
		[reducedMotion]: { transition: 'none' },
	},
	'& .MuiTab-root.Mui-selected': {
		color: mgmtNeutral.ink,
		fontWeight: 600,
		bgcolor: mgmtNeutral.panel,
		boxShadow: `0 1px 2px ${alpha(mgmtNeutral.ink, 0.08)}, 0 1px 3px ${alpha(mgmtNeutral.ink, 0.06)}`,
	},
} as const;

const signInPrimarySx = {
	...orangeButton,
	width: '100%',
	height: 48,
	borderRadius: `${mgmtShape.radius}px`,
	fontSize: 15,
	fontWeight: 600,
	textTransform: 'none',
	boxShadow: 'none',
	'&:hover': { ...orangeButton['&:hover'], boxShadow: 'none' },
	'&.Mui-focusVisible': focusRing(),
} as const;

const signInFieldSx = {
	'& .MuiOutlinedInput-root': { borderRadius: `${mgmtShape.radius}px`, bgcolor: mgmtNeutral.panel },
	'& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
	'& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: mgmtNeutral.label },
} as const;

const SignInCard = () => {
	const dispatch = useAppDispatch();
	const [ tab, setTab ] = useState<SignInTab>('institution');
	const [ showPassword, setShowPassword ] = useState(false);

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');

		if (email && password) dispatch(adminLogin(email, password));
	};

	return (
		<Box
			sx={{
				width: 'min(440px, 100%)',
				boxSizing: 'border-box',
				p: { xs: '28px 20px 24px', sm: '40px 40px 36px' },
				bgcolor: mgmtNeutral.panel,
				border: `1px solid ${mgmtNeutral.line}`,
				borderRadius: `${mgmtShape.cardRadius + 4}px`,
				boxShadow: mgmtShadow.signInCard,
				display: 'flex',
				flexDirection: 'column',
				gap: 3,
				[shortScreen]: { p: '28px 36px 28px', gap: 2.5 },
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
				<Box
					component={Link}
					to='/'
					aria-label={copy.home}
					sx={{ display: 'inline-flex', mb: 3, borderRadius: '8px', '&:focus-visible': focusRing(), [shortScreen]: { mb: 2 } }}
				>
					<Box component='img' src={edumeetConfig.theme.logo} alt='' sx={{ display: 'block', height: 30, width: 'auto', maxWidth: 160 }} />
				</Box>
				<Typography
					id='mgmt-signin-title'
					component='h1'
					sx={{ m: 0, color: mgmtNeutral.ink, fontSize: { xs: 22, sm: 24 }, lineHeight: { xs: '30px', sm: '32px' }, fontWeight: 700, letterSpacing: '-0.01em' }}
				>
					{copy.signInTitle}
				</Typography>
				<Box aria-hidden sx={{ width: 40, height: 4, borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtBrand.orange, my: 1.5 }} />
				<Typography sx={{ m: 0, fontSize: 14, lineHeight: '20px', color: mgmtNeutral.muted }}>
					{copy.signInSubtitle}
				</Typography>
			</Box>

			<Tabs
				value={tab}
				onChange={(_e, value: SignInTab) => setTab(value)}
				aria-label={copy.signInMethod}
				variant='fullWidth'
				sx={signInTabsSx}
			>
				<Tab value='institution' label={copy.tabInstitution} id='mgmt-tab-institution' aria-controls='mgmt-panel-institution' disableRipple />
				<Tab value='local' label={copy.tabLocal} id='mgmt-tab-local' aria-controls='mgmt-panel-local' disableRipple />
			</Tabs>

			{tab === 'institution' ? (
				<Box role='tabpanel' id='mgmt-panel-institution' aria-labelledby='mgmt-tab-institution' sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Typography sx={{ m: 0, fontSize: 14, lineHeight: '20px', color: mgmtNeutral.text, textAlign: 'center' }}>
						{copy.institutionHint}
					</Typography>
					<Box
						sx={{
							'& .MuiButton-root': signInPrimarySx,
							'& .MuiGrid-container': { display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: '10px', m: 0, width: 'auto' },
							'& .MuiGrid-container > *': { width: 'auto', maxWidth: 'none', flex: '0 0 auto', p: 0, m: 0 },
							'& img': { display: 'block', maxHeight: 24 },
							'& .MuiSvgIcon-root': { display: 'block', fontSize: 20 },
						}}
					>
						<CustomLoginButton />
					</Box>
				</Box>
			) : (
				<Box role='tabpanel' id='mgmt-panel-local' aria-labelledby='mgmt-tab-local'>
					<Box
						component='form'
						onSubmit={handleSubmit}
						sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, [shortScreen]: { gap: 2 } }}
					>
						<TextField
							required
							fullWidth
							id='email'
							name='email'
							label={emailAddressLabel()}
							autoComplete='username'
							sx={signInFieldSx}
						/>
						<TextField
							required
							fullWidth
							id='password'
							name='password'
							label={passwordLabel()}
							type={showPassword ? 'text' : 'password'}
							autoComplete='current-password'
							sx={signInFieldSx}
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position='end'>
											<IconButton
												edge='end'
												onClick={() => setShowPassword((prev) => !prev)}
												aria-label={showPassword ? copy.hidePassword : copy.showPassword}
												sx={{ color: mgmtNeutral.label, '&.Mui-focusVisible': focusRing() }}
											>
												{showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />}
											</IconButton>
										</InputAdornment>
									),
								},
							}}
						/>
						<Button type='submit' variant='contained' disableElevation sx={signInPrimarySx}>
							{signInLabel()}
						</Button>
					</Box>
				</Box>
			)}
		</Box>
	);
};

const hasLiveToken = () => {
	try {
		const token = localStorage.getItem('feathers-jwt');

		if (!token) return false;
		const { exp } = jwtDecode<JwtPayload>(token);

		return Boolean(exp && exp > Date.now() / 1000);
	} catch {
		return false;
	}
};

const initialsOf = (name: string) => {
	const parts = name.replace(/@.*/, '')
		.split(/[\s._-]+/)
		.filter(Boolean);

	return (parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] ?? '?').slice(0, 2)).toUpperCase();
};

export default function ManagementUI(/* props: Props */) {
	useNotifier();
	const dispatch = useAppDispatch();

	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const { username, email, avatar, tenantAdmin, tenantOwner, superAdmin } = useAppSelector((state) => state.management);
	const locale = useAppSelector((state) => state.settings.locale) ?? 'en';
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);
	const canManageTenant = tenantOwner || tenantAdmin || superAdmin;

	const [ invitesEnabled, setInvitesEnabled ] = useState(false);
	const [ tenantId, setTenantId ] = useState<number | null>(null);
	const [ tenantName, setTenantName ] = useState('');
	const [ authChecking, setAuthChecking ] = useState(hasLiveToken);
	const [ mobileOpen, setMobileOpen ] = useState(false);
	const [ languageAnchor, setLanguageAnchor ] = useState<HTMLElement | null>(null);
	const [ accountAnchor, setAccountAnchor ] = useState<HTMLElement | null>(null);
	
	const desktop = useMediaQuery('(min-width: 1200px)');

	useEffect(() => {
		if (desktop) setMobileOpen(false);
	}, [ desktop ]);

	const [ navCollapsed, setNavCollapsed ] = useState(() => {
		try {
			return localStorage.getItem('mgmt-nav-collapsed') === '1';
		} catch {
			return false;
		}
	});
	const collapseButtonRef = useRef<HTMLButtonElement>(null);
	const expandButtonRef = useRef<HTMLButtonElement>(null);
	const toggledByUser = useRef(false);

	const toggleNav = () => {
		toggledByUser.current = true;
		setNavCollapsed((was) => {
			try {
				localStorage.setItem('mgmt-nav-collapsed', was ? '0' : '1');
			} catch {
				// Storage blocked: the choice just lasts for this visit.
			}

			return !was;
		});
	};

	useEffect(() => {
		if (!toggledByUser.current) return;
		toggledByUser.current = false;
		(navCollapsed ? expandButtonRef : collapseButtonRef).current?.focus();
	}, [ navCollapsed ]);

	const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
	
	const [ searchParams, setSearchParams ] = useSearchParams();
	const requested = searchParams.get('section') ?? '';

	const [ userChecked, setUserChecked ] = useState(false);
	const [ invitesChecked, setInvitesChecked ] = useState(false);
	
	const setSection = (key: string, replace = false) => {
		const next = new URLSearchParams(searchParams);
	
		if (key) next.set('section', key);
		else next.delete('section');
		// ?tenant= belongs to the Tenants page only.
		if (key !== requested) next.delete('tenant');
		setSearchParams(next, { replace });
	};

	const selectSection = (key: string) => {
		setMobileOpen(false);
		if (key !== requested) setSection(key);
		window.scrollTo({ top: 0 });
	};

	const handleLogout = () => {
		setAccountAnchor(null);
		dispatch(logout()).then(() => {
			window.location.reload();
		});
	};

	useEffect(() => {
		dispatch(startMGMTListeners());

		dispatch(checkJWT()).finally(() => setAuthChecking(false));

		return () => {
			dispatch(stopMGMTListeners());
		};
	}, []);

	useEffect(() => {
		if (!loggedIn) {
			setInvitesEnabled(false);
			setInvitesChecked(false);

			return;
		}
		dispatch(getData('tenantInviteConfigs'))
			.then((res: unknown) => {
				const list = (res && typeof res === 'object' && 'data' in res)
					? (res as { data: Array<{ enabled?: boolean }> }).data
					: [];
				const hasEnabled = Array.isArray(list) && list.some((c) => c.enabled);

				setInvitesEnabled(Boolean(hasEnabled));
			})
			.catch(() => setInvitesEnabled(false))
			.finally(() => setInvitesChecked(true));
	}, [ loggedIn, requested ]);

	useEffect(() => {
		setUserChecked(false);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		dispatch(getUserData()).then((tdata: any) => {
			if (tdata) {
				if (tdata.user.name!=null && tdata.user.name !='') {
					dispatch(managamentActions.setUsername(tdata.user.name));
				} else {
					dispatch(managamentActions.setUsername(tdata.user.email));
				}
				if (tdata.user.email)
					dispatch(managamentActions.setEmail(tdata.user.email));
				if (tdata.user.avatar)
					dispatch(managamentActions.setAvatar(tdata.user.avatar));
				setTenantId(typeof tdata.user.tenantId === 'number' ? tdata.user.tenantId : null);
				if (tdata.user.tenantAdmin)
					dispatch(managamentActions.setTenantAdmin(tdata.user.tenantAdmin));
				if (tdata.user.tenantOwner)
					dispatch(managamentActions.setTenantOwner(tdata.user.tenantOwner));
				if (tdata.user.roles) {
					dispatch(managamentActions.setSuperAdmin(tdata.user.roles.includes('super-admin')));
				} else {
					dispatch(managamentActions.setSuperAdmin(false));
				}
			}
		})
			.finally(() => setUserChecked(true));
	}, [ loggedIn ]);

	// The institution shown at the top of the sidebar. Only owners and admins
	// may read tenants, so nobody else asks (that would show an error toast).
	useEffect(() => {
		if (!loggedIn || !canManageTenant || tenantId == null) {
			setTenantName('');

			return;
		}
		let stale = false;

		dispatch(getDataByID(tenantId, 'tenants')).then((res: unknown) => {
			const list = (res && typeof res === 'object' && 'data' in res)
				? (res as { data: Array<{ name?: string }> }).data
				: [];

			if (!stale) setTenantName((Array.isArray(list) && list[0]?.name) || '');
		});

		return () => {
			stale = true;
		};
	}, [ loggedIn, canManageTenant, tenantId ]);

	// One list for the sidebar, the icon rail and the phone drawer. The gating
	// is the same as before: Tenants, Rules, Defaults and Groups need
	// canManageTenant; Meetings needs an enabled invite config.
	const navItems: NavItem[] = [
		{ key: '', label: copy.dashboard, icon: DashboardOutlinedIcon, group: 'overview', visible: true },
		{ key: 'room', label: roomsLabel(), icon: MeetingRoomOutlinedIcon, group: 'meetings', visible: true },
		{ key: 'meetings', label: meetingsLabel(), icon: EventOutlinedIcon, group: 'meetings', visible: invitesEnabled },
		{ key: 'user', label: usersLabel(), icon: PersonOutlineOutlinedIcon, group: 'people', visible: true },
		{ key: 'group', label: groupsLabel(), icon: GroupsOutlinedIcon, group: 'people', visible: canManageTenant },
		{ key: 'role', label: rolesLabel(), icon: AdminPanelSettingsOutlinedIcon, group: 'people', visible: true },
		{ key: 'tenant', label: tenantsLabel(), icon: ApartmentOutlinedIcon, group: 'tenant', visible: canManageTenant },
		{ key: 'rule', label: rulesLabel(), icon: RuleOutlinedIcon, group: 'tenant', visible: canManageTenant },
		{ key: 'default', label: defaultsLabel(), icon: TuneOutlinedIcon, group: 'tenant', visible: canManageTenant },
	];
	const navGroups = navGroupOrder
		.map((id) => ({ id, label: copy.groups[id], items: navItems.filter((i) => i.group === id && i.visible) }))
		.filter((g) => g.items.length > 0);
	// What the URL asks for, checked against the user's rights. While the
	// rights are still loading, a gated section shows a placeholder instead
	// of bouncing a real admin to the dashboard.
	const requestedItem = navItems.find((i) => i.key === requested);
	// Signed in, or probably about to be (a live token is being checked).
	const authPending = authChecking && !loggedIn;
	const signedIn = loggedIn || authPending;
	const rightsPending = authPending || (loggedIn && (!userChecked || (requested === 'meetings' && !invitesChecked)));
	const sectionPending = Boolean(requestedItem && !requestedItem.visible && rightsPending);
	const selectedComponent = requested === 'login' || requestedItem?.visible || sectionPending ? requested : '';
	const current = navItems.find((i) => i.key === selectedComponent);
	const pageTitle = !signedIn ? copy.signIn : (current?.label ?? copy.dashboard);
	// While the token is checked no table may mount: its data request would
	// 401 and sign the user out.
	const loading = localeInProgress || sectionPending || authPending;
	const rightsKnown = userChecked && !authPending;
	const breadcrumb = [ copy.admin, ...(current && current.group !== 'overview' ? [ copy.groups[current.group] ] : []) ];
	// No "Super admin" tag (user request); owners and admins keep theirs.
	const roleLabel = tenantOwner ? copy.roles.tenantOwner
		: tenantAdmin ? copy.roles.tenantAdmin : '';
	const displayName = username || email;
	// No name yet: MUI's default person icon instead of a "?".
	const initials = displayName ? initialsOf(displayName) : undefined;
	const languageName = localeList.find((l) => l.locale.includes(locale))?.name ?? localeList[0].name;
	
	// An unknown or forbidden ?section= falls back to the dashboard and the
	// address is corrected, without a new history entry.
	useEffect(() => {
		if (loggedIn && requested && !rightsPending && selectedComponent !== requested) setSection('', true);
	}, [ loggedIn, requested, rightsPending, selectedComponent ]);
	
	// "Rooms · eduKotha Admin" in the tab; the old title comes back on unmount.
	useEffect(() => {
		const before = document.title;
	
		return () => {
			document.title = before;
		};
	}, []);
	useEffect(() => {
		document.title = `${pageTitle} · ${edumeetConfig.title || 'eduKotha'} ${copy.admin}`;
	}, [ pageTitle ]);

	const iconOf = (key: string) => navItems.find((i) => i.key === key)?.icon ?? DashboardOutlinedIcon;
	const section = (key: string, title: string, children: React.ReactNode) => (
		<Section icon={iconOf(key)} title={title} description={copy.descriptions[key]}>
			{children}
		</Section>
	);

	// Placeholders while rights or a new language load (plan §5.1). On the
	// white sidebar they are the neutral hover grey.
	const sidebarSkeleton = { bgcolor: mgmtNeutral.hover } as const;
	const pulse = reduceMotion ? false : 'pulse';
	const navSkeleton = (rail: boolean) => (
		<Box aria-hidden sx={{ display: 'flex', flexDirection: 'column', alignItems: rail ? 'center' : 'stretch', gap: 1, pt: 1.5 }}>
			{[ 0, 1, 2, 3, 4, 5 ].map((i) => (
				<Skeleton key={i} variant='rounded' animation={pulse} width={rail ? 44 : undefined} height={rail ? 44 : 40} sx={{ ...sidebarSkeleton, borderRadius: 0 }} />
			))}
		</Box>
	);
	const contentSkeleton = (
		<Box role='status' aria-label={localeInProgress ? copy.changingLanguage : copy.loading} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				<Skeleton variant='rounded' animation={pulse} width={48} height={48} sx={{ borderRadius: `${mgmtShape.itemRadius}px` }} />
				<Box sx={{ flexGrow: 1 }}>
					<Skeleton animation={pulse} width='min(280px, 70%)' height={32} />
					<Skeleton animation={pulse} width='min(420px, 90%)' height={20} />
				</Box>
			</Box>
			<Skeleton variant='rounded' animation={pulse} height={320} sx={{ borderRadius: `${mgmtShape.cardRadius}px` }} />
		</Box>
	);
	
	// The first screen after sign-in: the Overview (user brief 2026-10-18),
	// with one card per section the user may open, in sidebar order.
	const overviewItems = navGroups.filter((g) => g.id !== 'overview')
		.flatMap((g) => g.items)
		.map((i) => ({ key: i.key, label: i.label, icon: i.icon, description: copy.descriptions[i.key] ?? '' }));
	const openNewRoom = () => {
		setMobileOpen(false);
		setSearchParams(new URLSearchParams({ section: 'room', new: '1' }));
		window.scrollTo({ top: 0 });
	};
	const dashboard = !rightsKnown ? (
		<Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
			{[ 0, 1, 2, 3, 4, 5 ].map((i) => <Skeleton key={i} variant='rectangular' animation={pulse} height={160} sx={{ borderRadius: 0 }} />)}
		</Box>
	) : (
		<Overview name={displayName} roleLabel={roleLabel} items={overviewItems} onOpen={selectSection} onNewRoom={overviewItems.some((i) => i.key === 'room') ? openNewRoom : undefined} />
	);

	// Function to render the selected component in the placeholder. The
	// tables mount in the same order as before; only the frame is new.
	const renderComponent = () => {
		switch (selectedComponent) {
			case 'login':
				return <SignIn />;
			case 'default':
				// Defaults draws its own tenant picker and settings page.
				return <DefaultTable />;
			case 'tenant':
				// Tenants draws its own cards and per-tenant settings page.
				return <TenantTable />;
			case 'room':
				// Rooms draws its own header (title + Add room) and side panel.
				return <RoomTable />;
			case 'user':
				// Users draws its own header, filters and details panel.
				return <UserTable />;
			case 'group':
				// Groups draws its own header, filters and group modal.
				return <GroupTable />;
			case 'role':
				// Roles draws its own header, filters, compare grid and modal.
				return <RoleTable />;
			case 'meetings':
				return section('meetings', meetingsLabel(), <MeetingsTable />);
			case 'rule':
				// Rules draws its own header, filters and rule modal.
				return <RuleTable />;
			default:
				return dashboard;
		}
	};

	const avatarNode = (size: number, ring = false, square = false) => (
		<Avatar
			src={avatar || undefined}
			alt=''
			variant={square ? 'square' : 'circular'}
			sx={{
				width: size,
				height: size,
				flexShrink: 0,
				fontSize: size >= 40 ? 15 : 13,
				fontWeight: 600,
				bgcolor: mgmtBrand.blueDark,
				color: mgmtBrand.white,
				...(ring ? { border: `2px solid ${mgmtSurface.onNavyText}` } : {}),
			}}
		>
			{initials}
		</Avatar>
	);

	const institutionInitials = tenantName ? initialsOf(tenantName) : '';

	// The full sidebar (design A): permanent from 1200px, and inside the
	// temporary drawer below that.
	const renderSidebar = (inDrawer: boolean) => (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: mgmtNeutral.text }}>
			<Box
				sx={{
					height: { xs: mgmtLayout.headerHeightCompact, md: mgmtLayout.headerHeight },
					flexShrink: 0,
					display: 'flex',
					alignItems: 'center',
					gap: 1.5,
					pl: { xs: 2, md: 2.5 },
					pr: { xs: 0.5, md: 1.5 },
					borderBottom: `1px solid ${mgmtNeutral.line}`,
					[shortScreen]: { height: mgmtLayout.headerHeightCompact },
				}}
			>
				<Box component={Link} to='/' aria-label={copy.home} sx={{ display: 'flex', '&:focus-visible': focusRing() }}>
					<Box component='img' src={edumeetConfig.theme.logo} alt='' sx={{ display: 'block', height: { xs: 20, md: 22 }, width: 'auto', maxWidth: 120 }} />
				</Box>
				<Box aria-hidden sx={{ width: '1px', height: 20, bgcolor: '#cbd5e1', flexShrink: 0 }} />
				<Box component='span' sx={{ fontSize: 13, lineHeight: '16px', fontWeight: 500, color: mgmtNeutral.muted }}>
					{copy.admin}
				</Box>
				{!inDrawer && (
					<Tooltip title={copy.collapseSidebar} placement='right'>
						<IconButton
							ref={collapseButtonRef}
							aria-label={copy.collapseSidebar}
							aria-controls='mgmt-nav'
							aria-expanded
							onClick={toggleNav}
							sx={{ ...sidebarIconButtonSx, ml: 'auto' }}
						>
							<PanelIcon open />
						</IconButton>
					</Tooltip>
				)}
				{inDrawer && (
					<IconButton
						aria-label={copy.closeMenu}
						onClick={() => setMobileOpen(false)}
						sx={{ ...sidebarIconButtonSx, ml: 'auto', width: 44, height: 44, color: mgmtNeutral.muted }}
					>
						<CloseOutlinedIcon sx={{ fontSize: 20 }} />
					</IconButton>
				)}
			</Box>

			{signedIn && tenantName && (
				<Box
					sx={{
						flexShrink: 0,
						m: '12px 12px 0',
						p: '10px 12px',
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
						border: `1px solid ${mgmtNeutral.line}`,
						bgcolor: mgmtNeutral.bg,
						[desktopUp]: { mt: 2 },
						[shortScreen]: { mt: 1.5, py: 0.75 },
					}}
				>
					<Box aria-hidden sx={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: mgmtBrand.navy, color: mgmtBrand.white, fontSize: 13, fontWeight: 600 }}>
						{institutionInitials}
					</Box>
					<Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
						<Typography noWrap sx={{ fontSize: { xs: 14, md: 13 }, lineHeight: '18px', fontWeight: 600, color: mgmtNeutral.ink }}>
							{tenantName}
						</Typography>
						{roleLabel && (
							<Typography noWrap sx={{ fontSize: 12, lineHeight: '16px', color: mgmtBrand.textSecondary }}>
								{roleLabel}
							</Typography>
						)}
					</Box>
				</Box>
			)}

			{signedIn && (
				<Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', px: 1.5, pt: 0.5, pb: 1.5, display: 'flex', flexDirection: 'column', [shortScreen]: { pb: 1 } }}>
					{!rightsKnown && navSkeleton(false)}
					{(rightsKnown ? navGroups : []).map((g) => (
						// A labelled group holding a real list: div > label + ul > li >
						// button (axe "list": a ul may only contain li).
						<Box key={g.id} role='group' aria-labelledby={`mgmt-nav-${g.id}${inDrawer ? '-d' : ''}`} sx={{ pt: 1.75, [shortScreen]: { pt: 1.25 } }}>
							<Typography id={`mgmt-nav-${g.id}${inDrawer ? '-d' : ''}`} component='div' sx={groupLabelSx}>
								{g.label}
							</Typography>
							<List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
								{g.items.map((item) => {
									const selected = item.key === selectedComponent;

									return (
										<li key={item.key || 'dashboard'}>
											<ListItemButton
												selected={selected}
												aria-current={selected ? 'page' : undefined}
												onClick={() => selectSection(item.key)}
												disableRipple
												sx={{
													...navItemSx,
													...(inDrawer ? {
														minHeight: { xs: 44, md: mgmtLayout.navItemHeight },
														gap: { xs: 1.75, md: 1.5 },
														'& .MuiListItemText-primary': { fontSize: { xs: 15, md: 14 } },
													} : {}),
												}}
											>
												<ListItemIcon><item.icon /></ListItemIcon>
												<ListItemText primary={item.label} />
											</ListItemButton>
										</li>
									);
								})}
							</List>
						</Box>
					))}
				</Box>
			)}

			{signedIn ? (
				<Box
					sx={{
						flexShrink: 0,
						mt: 'auto',
						p: 1.5,
						borderTop: `1px solid ${mgmtNeutral.line}`,
						display: 'flex',
						flexDirection: 'column',
						gap: 1.25,
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
						{avatarNode(36, false, true)}
						<Box sx={{ minWidth: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
							{!displayName && !rightsKnown && (
								<Box aria-hidden>
									<Skeleton animation={pulse} width='70%' height={20} sx={sidebarSkeleton} />
									<Skeleton animation={pulse} width='90%' height={16} sx={sidebarSkeleton} />
								</Box>
							)}
							<Typography noWrap sx={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: mgmtNeutral.ink }}>
								{displayName}
							</Typography>
							{email && email !== displayName && (
								<Typography noWrap sx={{ fontSize: 12, lineHeight: '16px', color: mgmtBrand.textSecondary }}>
									{email}
								</Typography>
							)}
						</Box>
						{!inDrawer && (
							<Tooltip title={logoutLabel()} placement='top'>
								<IconButton onClick={handleLogout} aria-label={logoutLabel()} sx={sidebarIconButtonSx}>
									<LogoutOutlinedIcon sx={{ fontSize: 20 }} />
								</IconButton>
							</Tooltip>
						)}
					</Box>
					{inDrawer && (
						<Box sx={{ display: 'flex', gap: 1 }}>
							<ButtonBase
								onClick={handleLogout}
								sx={{
									flexGrow: 1,
									height: 44,
									gap: 1.25,
									px: 1.75,
									justifyContent: 'flex-start',
									border: `1px solid ${mgmtNeutral.line}`,
									color: mgmtNeutral.text,
									fontSize: 14,
									fontWeight: 500,
									transition: mgmtTransition,
									'&:hover': { backgroundColor: mgmtNeutral.hover },
									'&.Mui-focusVisible': focusRing(mgmtBrand.blue, 2, -2),
								}}
							>
								<LogoutOutlinedIcon sx={{ fontSize: 18 }} />
								{logoutLabel()}
							</ButtonBase>
							<ButtonBase
								onClick={(e) => setLanguageAnchor(e.currentTarget)}
								aria-label={selectLanguageLabel()}
								aria-haspopup='menu'
								sx={{
									display: { xs: 'inline-flex', md: 'none' },
									height: 44,
									gap: 1,
									px: 1.75,
									border: `1px solid ${mgmtNeutral.line}`,
									color: mgmtNeutral.text,
									fontSize: 14,
									fontWeight: 500,
									'&:hover': { backgroundColor: mgmtNeutral.hover },
									'&.Mui-focusVisible': focusRing(mgmtBrand.blue, 2, -2),
								}}
							>
								<LanguageOutlinedIcon sx={{ fontSize: 18, color: mgmtBrand.blue }} />
								{(localeList.find((l) => l.locale.includes(locale))?.locale[0] ?? 'en').toUpperCase()}
							</ButtonBase>
						</Box>
					)}
				</Box>
			) : null}
		</Box>
	);

	// Tablets (900–1199px), and desktops with the sidebar minimized: a 64px
	// icon rail with tooltips. The groups have no labels, only short
	// hairlines between them.
	const railButtonSx = {
		...navItemSx,
		width: 44,
		minHeight: 44,
		height: 44,
		px: 0,
		justifyContent: 'center',
		'& .MuiSvgIcon-root': { fontSize: 20 },
	} as const;

	const rail = (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', color: mgmtNeutral.text }}>
			<Box sx={{ width: '100%', height: mgmtLayout.headerHeight, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${mgmtNeutral.line}`, [shortScreen]: { height: mgmtLayout.headerHeightCompact } }}>
				<Tooltip title={copy.home} placement='right'>
					<Box
						component={Link}
						to='/'
						aria-label={copy.home}
						sx={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', '&:focus-visible': focusRing() }}
					>
						<Box component='img' src={edumeetConfig.theme.logo} alt='' sx={{ height: 26, width: 30, objectFit: 'cover', objectPosition: 'left center' }} />
					</Box>
				</Tooltip>
			</Box>
			{/* Only a minimized desktop sidebar can be expanded here; on tablets the
			    header's menu button opens the full drawer instead. */}
			<Box sx={{ display: { md: 'none', lg: 'flex' }, pt: 1 }}>
				<Tooltip title={copy.expandSidebar} placement='right'>
					<IconButton
						ref={expandButtonRef}
						aria-label={copy.expandSidebar}
						aria-controls='mgmt-nav'
						aria-expanded={false}
						onClick={toggleNav}
						sx={{ ...sidebarIconButtonSx, width: 44, height: 44 }}
					>
						<PanelIcon open={false} />
					</IconButton>
				</Tooltip>
			</Box>
			{signedIn && (
				<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, py: 0.5, flexGrow: 1, minHeight: 0, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					{!rightsKnown && <li>{navSkeleton(true)}</li>}
					{(rightsKnown ? navGroups : []).map((g) => (
						<Box component='li' key={g.id} sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							<Divider aria-hidden sx={{ width: 28, my: 1, borderColor: mgmtNeutral.line }} />
							<Box component='ul' aria-label={g.label} sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
								{g.items.map((item) => {
									const selected = item.key === selectedComponent;

									return (
										<li key={item.key || 'dashboard'}>
											<Tooltip title={item.label} placement='right'>
												<ListItemButton
													selected={selected}
													aria-label={item.label}
													aria-current={selected ? 'page' : undefined}
													onClick={() => selectSection(item.key)}
													disableRipple
													sx={railButtonSx}
												>
													<ListItemIcon><item.icon /></ListItemIcon>
												</ListItemButton>
											</Tooltip>
										</li>
									);
								})}
							</Box>
						</Box>
					))}
				</Box>
			)}
			{signedIn && (
				<Box sx={{ width: '100%', py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, borderTop: `1px solid ${mgmtNeutral.line}` }}>
					<Tooltip title={logoutLabel()} placement='right'>
						<IconButton onClick={handleLogout} aria-label={logoutLabel()} sx={{ ...sidebarIconButtonSx, width: 44, height: 44 }}>
							<LogoutOutlinedIcon sx={{ fontSize: 20 }} />
						</IconButton>
					</Tooltip>
					<Tooltip title={displayName} placement='right'>
						{avatarNode(36, false, true)}
					</Tooltip>
				</Box>
			)}
		</Box>
	);
	
	// Plan §5.1: the page stays while a language loads, with a thin blue bar
	// at the top; the section below remounts when the new texts are in.
	const progressBar = localeInProgress && (
		<LinearProgress
			aria-label={copy.changingLanguage}
			sx={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				zIndex: (t) => t.zIndex.modal + 1,
				height: 3,
				bgcolor: mgmtBrand.blueLight,
				'& .MuiLinearProgress-bar': { bgcolor: mgmtBrand.blue },
			}}
		/>
	);
	
	const skipToContent = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		document.getElementById('mgmt-content')?.focus();
	};
	
	const shell = (
		<Box sx={{ display: 'flex', flex: 1, minHeight: '100vh', bgcolor: mgmtBrand.surface }}>
			<Box
				component='a'
				href='#mgmt-content'
				onClick={skipToContent}
				sx={{
					...visuallyHidden,
					'&:focus': {
						clip: 'auto',
						clipPath: 'none',
						width: 'auto',
						height: 'auto',
						margin: 0,
						overflow: 'visible',
						position: 'fixed',
						top: 12,
						left: 12,
						zIndex: (t) => t.zIndex.modal + 2,
						px: 2,
						py: 1.25,
						borderRadius: `${mgmtShape.radius}px`,
						bgcolor: mgmtBrand.orange,
						color: mgmtBrand.navy,
						fontWeight: 600,
						fontSize: 14,
						textDecoration: 'none',
						boxShadow: mgmtShadow.dialog,
						...focusRing(mgmtBrand.navy),
					},
				}}
			>
				{copy.skipToContent}
			</Box>
			<Box
				component='nav'
				id='mgmt-nav'
				aria-label={copy.navigation}
				sx={{
					display: { xs: 'none', md: 'block' },
					width: { md: mgmtLayout.railWidth, lg: navCollapsed ? mgmtLayout.railWidth : mgmtLayout.sidebarWidth },
					flexShrink: 0,
					position: 'sticky',
					top: 0,
					height: '100vh',
					overflow: 'hidden',
					bgcolor: mgmtNeutral.panel,
					borderRight: `1px solid ${mgmtNeutral.line}`,
					boxSizing: 'border-box',
					transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
					[reducedMotion]: { transition: 'none' },
				}}
			>
				<Box sx={{ display: { md: 'block', lg: navCollapsed ? 'block' : 'none' }, height: '100%' }}>{rail}</Box>
				<Box sx={{ display: { md: 'none', lg: navCollapsed ? 'none' : 'block' }, width: mgmtLayout.sidebarWidth - 1, height: '100%' }}>{renderSidebar(false)}</Box>
			</Box>

			<Drawer
				variant='temporary'
				open={mobileOpen}
				onClose={() => setMobileOpen(false)}
				ModalProps={{ keepMounted: true }}
				transitionDuration={reduceMotion ? 0 : undefined}
				slotProps={{
					paper: {
						id: 'mgmt-nav-drawer',
						component: 'nav',
						'aria-label': copy.navigation,
					} as object,
					backdrop: { sx: { backgroundColor: alpha(mgmtNeutral.ink, 0.45) } },
				}}
				sx={{
					display: { lg: 'none' },
					'& .MuiDrawer-paper': {
						boxSizing: 'border-box',
						width: { xs: mgmtLayout.mobileDrawerWidth, md: mgmtLayout.sidebarWidth },
						bgcolor: mgmtNeutral.panel,
						color: mgmtNeutral.text,
						border: 0,
						borderRight: `1px solid ${mgmtNeutral.line}`,
						boxShadow: `0 24px 60px ${alpha(mgmtNeutral.ink, 0.25)}`,
					},
				}}
			>
				{renderSidebar(true)}
			</Drawer>

			<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
				<Box
					component='header'
					sx={{
						position: 'sticky',
						top: 0,
						zIndex: (t) => t.zIndex.appBar,
						flexShrink: 0,
						height: { xs: mgmtLayout.headerHeightCompact, md: mgmtLayout.headerHeight },
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						px: { xs: 1, md: 3, lg: 4 },
						bgcolor: { xs: mgmtBrand.navy, md: mgmtBrand.white },
						borderBottom: { md: `1px solid ${mgmtBrand.border}` },
						[shortScreen]: { height: mgmtLayout.headerHeightCompact },
					}}
				>
					<IconButton
						aria-label={copy.openMenu}
						aria-controls='mgmt-nav-drawer'
						aria-expanded={mobileOpen}
						onClick={() => setMobileOpen(true)}
						sx={{
							display: { lg: 'none' },
							width: 44,
							height: 44,
							ml: { md: -1.5 },
							borderRadius: `${mgmtShape.radius}px`,
							color: { xs: mgmtBrand.white, md: mgmtBrand.navy },
							'&.Mui-focusVisible': { ...focusRing(), outlineColor: { xs: mgmtBrand.white, md: mgmtBrand.blue } },
						}}
					>
						<MenuOutlinedIcon />
					</IconButton>

					<Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, minWidth: 0 }}>
						<BrandMark size='sm' onNavy />
					</Box>

					{/* Back to the dashboard from any section (user request
					    2026-10-13); phones get it above the content instead. */}
					{signedIn && selectedComponent !== '' && (
						<>
							<ButtonBase
								onClick={() => selectSection('')}
								sx={{
									display: { xs: 'none', md: 'inline-flex' },
									flexShrink: 0,
									height: 40,
									gap: 1,
									pl: 1.25,
									pr: 1.75,
									border: `1px solid ${mgmtBrand.border}`,
									bgcolor: mgmtBrand.white,
									color: mgmtBrand.navy,
									fontSize: 14,
									fontWeight: 600,
									transition: mgmtTransition,
									'&:hover': { bgcolor: mgmtBrand.blueLight },
									'&.Mui-focusVisible': focusRing(),
								}}
							>
								<ArrowBackOutlinedIcon sx={{ fontSize: 18 }} />
								{copy.back}
							</ButtonBase>
							<Box aria-hidden sx={{ display: { xs: 'none', md: 'block' }, width: '1px', height: 32, flexShrink: 0, bgcolor: mgmtBrand.border }} />
						</>
					)}

					{/* One h1 on every screen: on phones it is only read out, the
					    brand mark and the content breadcrumb show instead. */}
					<Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, '@media (max-width: 899.95px)': visuallyHidden }}>
						<Typography noWrap sx={{ ...mgmtType.caption, color: mgmtBrand.textSecondary }}>
							{breadcrumb.join(' › ')}
						</Typography>
						<Typography component='h1' noWrap sx={{ m: 0, fontSize: 20, lineHeight: '28px', fontWeight: 600, color: mgmtBrand.navy }}>
							{pageTitle}
						</Typography>
					</Box>

					<ButtonBase
						onClick={(e) => setLanguageAnchor(e.currentTarget)}
						aria-label={selectLanguageLabel()}
						aria-haspopup='menu'
						aria-expanded={Boolean(languageAnchor)}
						disabled={localeInProgress}
						sx={{
							display: { xs: signedIn ? 'none' : 'inline-flex', md: 'inline-flex' },
							flexShrink: 0,
							height: { xs: 44, md: 44, lg: 40 },
							minWidth: 44,
							gap: 1,
							px: { xs: 1.25, md: 0, lg: 1.5 },
							pl: { lg: 1.25 },
							borderRadius: `${mgmtShape.pill}px`,
							border: { xs: `1px solid ${alpha(mgmtBrand.white, 0.2)}`, md: `1px solid ${mgmtBrand.border}` },
							bgcolor: { xs: 'transparent', md: mgmtBrand.white },
							color: { xs: mgmtBrand.white, md: mgmtBrand.navy },
							fontSize: 14,
							transition: mgmtTransition,
							'&:hover': { bgcolor: { xs: alpha(mgmtBrand.white, 0.08), md: mgmtBrand.blueLight } },
							'&.Mui-focusVisible': focusRing(),
							'& .lang-name, & .lang-caret': { display: { xs: 'none', lg: 'inline' } },
						}}
					>
						<LanguageOutlinedIcon sx={{ fontSize: 20, color: { xs: mgmtBrand.white, md: mgmtBrand.blue } }} />
						<span className='lang-name'>{languageName}</span>
						<ExpandMoreOutlinedIcon className='lang-caret' sx={{ fontSize: 18, color: mgmtBrand.textSecondary }} />
					</ButtonBase>

					{signedIn && (
						<IconButton
							aria-label={copy.accountMenu}
							aria-haspopup='menu'
							aria-expanded={Boolean(accountAnchor)}
							onClick={(e) => setAccountAnchor(e.currentTarget)}
							sx={{ p: 0, width: 44, height: 44, flexShrink: 0, '&.Mui-focusVisible': focusRing() }}
						>
							<Box sx={{ display: { xs: 'flex', md: 'none' } }}>{avatarNode(36, true)}</Box>
							<Box sx={{ display: { xs: 'none', md: 'flex' } }}>{avatarNode(44)}</Box>
						</IconButton>
					)}
				</Box>

				<Box
					component='main'
					id='mgmt-content'
					tabIndex={-1}
					aria-busy={loading || undefined}
					sx={{ flexGrow: 1, width: '100%', maxWidth: mgmtLayout.contentMaxWidth, mx: 'auto', p: { xs: 2, md: 3, lg: '28px 32px' }, '&:focus': { outline: 'none' } }}
				>
					{signedIn && selectedComponent !== '' && (
						<ButtonBase
							onClick={() => selectSection('')}
							sx={{ display: { xs: 'inline-flex', md: 'none' }, height: 44, gap: 1, pl: 1.25, pr: 1.75, mb: 1.5, border: `1px solid ${mgmtBrand.border}`, bgcolor: mgmtBrand.white, color: mgmtBrand.navy, fontSize: 15, fontWeight: 600, '&.Mui-focusVisible': focusRing() }}
						>
							<ArrowBackOutlinedIcon sx={{ fontSize: 18 }} />
							{copy.back}
						</ButtonBase>
					)}
					{signedIn && selectedComponent === '' && (
						<Typography noWrap sx={{ display: { xs: 'block', md: 'none' }, ...mgmtType.caption, color: mgmtBrand.textSecondary, mb: 1.5 }}>
							{[ ...breadcrumb, pageTitle ].join(' › ')}
						</Typography>
					)}
					{loading ? contentSkeleton : (
						// Each section fades and rises in when it opens (2026-10-18).
						<Box key={selectedComponent || 'dashboard'} sx={sectionEnterSx}>{renderComponent()}</Box>
					)}
				</Box>
			</Box>
		</Box>
	);

	const menus = (
		<>
			<Menu
				anchorEl={languageAnchor}
				open={Boolean(languageAnchor)}
				onClose={() => setLanguageAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				transitionDuration={reduceMotion ? 0 : 'auto'}
				slotProps={{ paper: { sx: { mt: 1, maxHeight: 'min(420px, calc(100vh - 96px))', minWidth: 200 } } }}
			>
				{localeList.map(({ name, locale: listLocale }) => {
					const active = listLocale.includes(locale);

					return (
						<MenuItem
							key={listLocale[0]}
							selected={active}
							onClick={() => {
								setLanguageAnchor(null);
								if (!active) dispatch(setLocale(listLocale[0]));
							}}
							sx={{ gap: 1.5, justifyContent: 'space-between', color: mgmtBrand.navy }}
						>
							{name}
							{active && <CheckOutlinedIcon sx={{ fontSize: 18, color: mgmtBrand.blue }} />}
						</MenuItem>
					);
				})}
			</Menu>

			<Menu
				anchorEl={accountAnchor}
				open={Boolean(accountAnchor)}
				onClose={() => setAccountAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				transitionDuration={reduceMotion ? 0 : 'auto'}
				slotProps={{ paper: { sx: { mt: 1, minWidth: 240, maxWidth: 'calc(100vw - 32px)' } } }}
			>
				<Box sx={{ px: 2, pt: 1, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
					<Typography noWrap sx={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: mgmtBrand.navy }}>{displayName}</Typography>
					{email && email !== displayName && (
						<Typography noWrap sx={{ ...mgmtType.caption, color: mgmtBrand.textSecondary }}>{email}</Typography>
					)}
					{roleLabel && (
						<Box component='span' sx={{ alignSelf: 'flex-start', mt: 0.5, fontSize: 12, lineHeight: '16px', fontWeight: 600, color: mgmtBrand.navy, bgcolor: mgmtBrand.orangeLight, border: `1px solid ${mgmtBrand.orange}`, px: 1.25, py: '2px', borderRadius: `${mgmtShape.pill}px` }}>
							{roleLabel}
						</Box>
					)}
				</Box>
				<Divider />
				<MenuItem onClick={handleLogout} sx={{ gap: 1.5, mt: 0.5, color: mgmtBrand.navy }}>
					<LogoutOutlinedIcon sx={{ fontSize: 20 }} />
					{logoutLabel()}
				</MenuItem>
			</Menu>
		</>
	);

	// Signed out: a plain neutral page with the language picker top right and
	// one centred sign-in card. The card is pinned near the top (not centred
	// vertically) so switching tabs only grows it downwards.
	const signInScreen = (
		<Box
			component='main'
			aria-labelledby='mgmt-signin-title'
			sx={{
				minHeight: '100vh',
				boxSizing: 'border-box',
				display: 'flex',
				flexDirection: 'column',
				bgcolor: mgmtNeutral.bg,
				color: mgmtNeutral.ink,
				px: { xs: 2, sm: 3 },
				pt: { xs: 2, sm: 3 },
				pb: 4,
			}}
		>
			<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
				<ButtonBase
					onClick={(e) => setLanguageAnchor(e.currentTarget)}
					aria-label={selectLanguageLabel()}
					aria-haspopup='menu'
					aria-expanded={Boolean(languageAnchor)}
					sx={{
						height: { xs: 44, md: 40 },
						gap: 1,
						pl: 1.25,
						pr: 1.5,
						borderRadius: `${mgmtShape.pill}px`,
						border: `1px solid ${mgmtNeutral.line}`,
						bgcolor: mgmtNeutral.panel,
						color: mgmtNeutral.text,
						fontSize: 14,
						transition: mgmtTransition,
						'&:hover': { bgcolor: mgmtNeutral.hover },
						'&.Mui-focusVisible': focusRing(),
					}}
				>
					<LanguageOutlinedIcon sx={{ fontSize: 18, color: mgmtBrand.blue }} />
					{languageName}
					<ExpandMoreOutlinedIcon sx={{ fontSize: 16, color: mgmtNeutral.label }} />
				</ButtonBase>
			</Box>
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 3,
					pt: { xs: 3, sm: 'clamp(16px, 8vh, 88px)' },
					[shortScreen]: { pt: 1, gap: 2 },
				}}
			>
				<SignInCard />
				<Typography sx={{ m: 0, fontSize: 12, lineHeight: '16px', color: mgmtNeutral.label, textAlign: 'center' }}>
					{copy.footerNote}
				</Typography>
			</Box>
		</Box>
	);
	
	return (
		<ThemeProvider theme={mgmtTheme}>
			<CssBaseline />
			{progressBar}
			{signedIn ? shell : signInScreen}
			{menus}
		</ThemeProvider>
	);
}
