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
import ButtonBase from '@mui/material/ButtonBase';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
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
import KeyboardDoubleArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftOutlined';
import KeyboardDoubleArrowRightOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowRightOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import TenantTable from '../../components/managementservice/tenants/Tenant';
import RoomTable from '../../components/managementservice/rooms/Room';
import GroupTable from '../../components/managementservice/groups/Groups';
import UserTable from '../../components/managementservice/users/Users';
import RoleTable from '../../components/managementservice/role/Role';
import { getData, getUserData, startMGMTListeners, stopMGMTListeners } from '../../store/actions/managementActions';
import { useAppDispatch, useAppSelector, useNotifier } from '../../store/hooks';
import TenantAdminTable from '../../components/managementservice/tenants/TenantAdmin';
import TenantOwnerTable from '../../components/managementservice/tenants/TenantOwner';
import { checkJWT, logout } from '../../store/actions/permissionsActions';
import { setLocale } from '../../store/actions/localeActions';
import { managamentActions } from '../../store/slices/managementSlice';
import SignIn from '../../components/settingsdialog/managementsettings/ManagementAdminLoginSettings';
import GroupRoleTable from '../../components/managementservice/groups/GroupRole';
import GroupUserTable from '../../components/managementservice/groups/GroupUser';
import RuleTable from '../../components/managementservice/rules/Rule';
import { defaultSettingsLabel, defaultsLabel, groupRolesLabel, groupsLabel, groupUsersLabel, logoutLabel, meetingsLabel, rolesLabel, roomSettingsLabel, roomsLabel, rulesLabel, selectLanguageLabel, tenantSettingsLabel, tenantsLabel, usersLabel } from '../../components/translated/translatedComponents';
import DefaultTable from '../../components/managementservice/defaults/Defaults';
import MeetingsTable from '../../components/managementservice/meetings/Meetings';
import { localeList } from '../../utils/intlManager';
import { ThemeProvider, alpha, createTheme, keyframes } from '@mui/material/styles';
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
	// Neutral shadows for the sign-in card and its admin mockup (plan §7.4).
	signInCard: `0 24px 48px ${alpha(mgmtNeutral.ink, 0.12)}`,
	signInMock: `0 1px 2px ${alpha(mgmtNeutral.ink, 0.04)}, 0 20px 40px ${alpha(mgmtNeutral.ink, 0.08)}`,
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
	sidebarWidth: 264,
	railWidth: 72,
	mobileDrawerWidth: 'min(300px, 85vw)',
	headerHeight: 64,
	headerHeightCompact: 56,
	navItemHeight: 44,
	navItemHeightCompact: 40,
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
					
					[`.MuiDialog-root ${addItemSlot}`]: {
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
		superAdmin: 'Super admin',
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
	signInSubtitle: 'Sign in with your institution account.',
	or: 'or',
	heroEyebrow: 'Bangladesh Research and Education Network (BdREN)',
	heroTitle: 'Manage your institution\'s eduKotha',
	heroSubtitle: 'Rooms, people and settings for your online classes and meetings, in one place.',
	mockLabel: 'Animated preview of the eduKotha admin console: opening Rooms and adding a room',
	mockToast: 'Room created',
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

const navItemSx = {
	position: 'relative',
	minHeight: mgmtLayout.navItemHeight,
	borderRadius: `${mgmtShape.itemRadius}px`,
	px: 1.5,
	gap: 1.5,
	color: mgmtNeutral.text,
	transition: mgmtTransition,
	'& .MuiListItemIcon-root': { minWidth: 0, color: 'inherit' },
	'& .MuiSvgIcon-root': { fontSize: 20 },
	'& .MuiListItemText-root': { my: 0 },
	'& .MuiListItemText-primary': { fontSize: 14, lineHeight: '20px', fontWeight: 400 },
	'&:hover': { backgroundColor: mgmtNeutral.hover, color: mgmtNeutral.ink },
	'&.Mui-focusVisible': { ...focusRing(), backgroundColor: mgmtNeutral.hover },
	'&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible': {
		backgroundColor: mgmtNeutral.hover,
		color: mgmtNeutral.ink,
	},
	'&.Mui-selected .MuiListItemIcon-root': { color: mgmtBrand.blue },
	'&.Mui-selected .MuiListItemText-primary': { fontWeight: 600 },
	'&.Mui-selected::before': {
		content: '""',
		position: 'absolute',
		left: -8,
		top: '50%',
		width: 4,
		height: 24,
		marginTop: '-12px',
		borderRadius: '0 4px 4px 0',
		backgroundColor: mgmtBrand.orange,
	},
	[shortScreen]: { minHeight: mgmtLayout.navItemHeightCompact },
	[reducedMotion]: { transition: 'none' },
} as const;

const groupLabelSx = {
	...mgmtType.groupLabel,
	display: 'block',
	px: 1.5,
	py: 0.75,
	color: mgmtNeutral.label,
	[shortScreen]: { py: 0.5 },
} as const;

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
const chevronDown = 'M6 9l6 6 6-6';

const roleChipSx = {
	alignSelf: 'flex-start',
	fontSize: 12,
	lineHeight: '16px',
	fontWeight: 600,
	color: mgmtBrand.navy,
	bgcolor: mgmtBrand.orangeLight,
	border: `1px solid ${mgmtBrand.orange}`,
	px: 1.25,
	py: '2px',
	borderRadius: `${mgmtShape.pill}px`,
	whiteSpace: 'nowrap',
} as const;

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

const signInCardSx = {
	width: 'min(420px, 100%)',
	boxSizing: 'border-box',
	p: { xs: '24px 20px', md: '36px 36px 32px' },
	bgcolor: mgmtNeutral.panel,
	border: `1px solid ${mgmtNeutral.line}`,
	borderRadius: `${mgmtShape.cardRadius}px`,
	boxShadow: mgmtShadow.signInCard,
	'& .MuiContainer-root': { p: 0, maxWidth: 'none' },
	'& .MuiContainer-root > .MuiBox-root': { mt: 0, alignItems: 'stretch', gap: { xs: 2, md: 2.5 } },
	'& h2': {
		m: 0,
		fontSize: { xs: 19, md: 22 },
		lineHeight: { xs: '26px', md: '30px' },
		fontWeight: 600,
		color: mgmtNeutral.ink,
		'&::after': {
			content: JSON.stringify(copy.signInSubtitle),
			display: 'block',
			mt: 0.75,
			fontSize: 14,
			lineHeight: '20px',
			fontWeight: 400,
			color: mgmtNeutral.muted,
		},
	},
	'& h2 + .MuiBox-root': {
		display: 'flex',
		flexDirection: 'column',
		gap: { xs: 2, md: 2.5 },
		'&::after': {
			content: JSON.stringify(copy.or),
			display: 'block',
			textAlign: 'center',
			fontSize: 12,
			lineHeight: '16px',
			color: mgmtNeutral.label,
			background: `linear-gradient(${mgmtNeutral.line}, ${mgmtNeutral.line}) left center / calc(50% - 20px) 1px no-repeat, linear-gradient(${mgmtNeutral.line}, ${mgmtNeutral.line}) right center / calc(50% - 20px) 1px no-repeat`,
		},
	},
	'& h2 + .MuiBox-root > .MuiButton-root': {
		...orangeButton,
		width: '100%',
		height: 48,
		fontSize: 15,
		'& .MuiGrid-container': {
			display: 'flex',
			flexDirection: 'row',
			flexWrap: 'nowrap',
			alignItems: 'center',
			justifyContent: 'center',
			gap: '10px',
			m: 0,
			width: 'auto',
		},
		'& .MuiGrid-container > *': { width: 'auto', maxWidth: 'none', flex: '0 0 auto', p: 0, m: 0 },
		'& img': { display: 'block', maxHeight: 24 },
		'& .MuiSvgIcon-root': { display: 'block', fontSize: 20 },
	},
	'& h2 + .MuiBox-root + .MuiButton-root': {
		alignSelf: 'center',
		height: { xs: 44, md: 40 },
		px: 1.5,
		'&::after': { ...maskIcon(chevronDown, 16), marginRight: 0, marginLeft: '6px', transition: 'transform 150ms ease' },
		'&:has(+ form)::after': { transform: 'rotate(180deg)' },
		[reducedMotion]: { '&::after': { transition: 'none' } },
	},
	'& form': {
		mt: 0,
		display: 'flex',
		flexDirection: 'column',
		gap: { xs: 2, md: 2.5 },
		'& .MuiFormControl-root': { m: 0 },
	},
	'& form button[type="submit"]': {
		m: 0,
		height: { xs: 48, md: 44 },
		fontSize: 15,
		bgcolor: mgmtBrand.navy,
		color: mgmtBrand.white,
		'&:hover': { bgcolor: mgmtBrand.navyLight },
	},
	[shortScreen]: {
		p: '28px 32px 24px',
		'& .MuiContainer-root > .MuiBox-root, & h2 + .MuiBox-root, & form': { gap: 2 },
	},
} as const;

const mockCursor = keyframes`
	0%, 8% { left: 73%; top: 80%; transform: none; }
	16% { left: calc(6% + 10px); top: 92px; transform: none; }
	17.5% { left: calc(6% + 10px); top: 92px; transform: scale(0.82); }
	19%, 24% { left: calc(6% + 10px); top: 92px; transform: none; }
	38% { left: calc(24% + 40px); top: 110px; transform: none; }
	40.5% { left: calc(24% + 40px); top: 110px; transform: scale(0.82); }
	42%, 48% { left: calc(24% + 40px); top: 110px; transform: none; }
	62%, 100% { left: 73%; top: 80%; transform: none; }
`;

const mockSwitch = (from: string, to: string) => keyframes`
	0%, 17% { background-color: ${from}; }
	18%, 96% { background-color: ${to}; }
	100% { background-color: ${from}; }
`;
const mockNavOn = {
	fill: mockSwitch('transparent', mgmtNeutral.hover),
	bar: mockSwitch('transparent', mgmtBrand.orange),
	dot: mockSwitch('#cbd5e1', mgmtBrand.blue),
	line: mockSwitch(mgmtNeutral.line, mgmtNeutral.text),
};
const mockNavOff = {
	fill: mockSwitch(mgmtNeutral.hover, 'transparent'),
	bar: mockSwitch(mgmtBrand.orange, 'transparent'),
	dot: mockSwitch(mgmtBrand.blue, '#cbd5e1'),
	line: mockSwitch(mgmtNeutral.text, mgmtNeutral.line),
};

const mockRow = keyframes`
	0%, 19% { visibility: hidden; clip-path: inset(0 100% 0 0); }
	19.01% { visibility: visible; clip-path: inset(0 100% 0 0); }
	24%, 96% { visibility: visible; clip-path: inset(0 0 0 0); }
	96.01%, 100% { visibility: hidden; clip-path: inset(0 0 0 0); }
`;
const mockPress = keyframes`
	0%, 40% { transform: none; background-color: ${mgmtBrand.orange}; }
	41% { transform: scale(0.9); background-color: ${mgmtBrand.orangeDark}; }
	43%, 100% { transform: none; background-color: ${mgmtBrand.orange}; }
`;
const mockNewRow = keyframes`
	0%, 42% { visibility: hidden; height: 0; border-bottom-width: 0; background-color: ${mgmtBrand.orangeLight}; }
	42.01% { visibility: visible; height: 0; border-bottom-width: 0; }
	48% { height: 28px; border-bottom-width: 1px; background-color: ${mgmtBrand.orangeLight}; }
	76% { background-color: ${mgmtBrand.orangeLight}; }
	86%, 96% { visibility: visible; height: 28px; border-bottom-width: 1px; background-color: ${mgmtBrand.white}; }
	96.01%, 100% { visibility: hidden; height: 0; border-bottom-width: 0; }
`;
const mockToastIn = keyframes`
	0%, 48% { visibility: hidden; transform: translateY(40px); }
	48.01% { visibility: visible; transform: translateY(40px); }
	52%, 74% { visibility: visible; transform: none; }
	79% { visibility: visible; transform: translateY(40px); }
	79.01%, 100% { visibility: hidden; transform: translateY(40px); }
`;
const mockLoop = (name: string, delay = 0) => `${name} 10s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s infinite`;

const mockNavRows = [ 0.62, 0.8, 0.55, 0.7, 0.5, 0.66, 0.58 ];
const mockRooms = [
	{ name: 'cse-lecture-101', role: 'Normal' },
	{ name: 'eee-lab-review', role: 'Normal' },
	{ name: 'bdren-board', role: 'Moderator' },
	{ name: 'phd-defence', role: 'Normal' },
];
const mockGrid = { display: 'grid', gridTemplateColumns: '12% 38% 1fr 22%', alignItems: 'center', px: 1 } as const;

const AdminMock = () => (
	<Box
		role='img'
		aria-label={copy.mockLabel}
		sx={{
			position: 'relative',
			width: '100%',
			maxWidth: 600,
			aspectRatio: '16 / 10',
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'column',
			bgcolor: mgmtNeutral.panel,
			border: `1px solid ${mgmtNeutral.line}`,
			borderRadius: '20px',
			boxShadow: mgmtShadow.signInMock,
			overflow: 'hidden',
			[shortScreen]: { maxWidth: 480 },
			[reducedMotion]: { '& *': { animation: 'none !important' }, '& .mock-cursor, & .mock-toast': { display: 'none' } },
		}}
	>
		<Box aria-hidden sx={{ height: 28, flexShrink: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, borderBottom: `1px solid ${mgmtNeutral.line}` }}>
			{[ 0, 1, 2 ].map((dot) => <Box key={dot} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: mgmtNeutral.line }} />)}
			<Box sx={{ ml: 1, px: 1.25, py: 0.25, borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtNeutral.hover, color: mgmtNeutral.muted, fontSize: 11, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
				{`${window.location.host}/mgmt-admin`}
			</Box>
		</Box>
		<Box aria-hidden sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
			{/* Mini sidebar, white like the real one: a logo bar, nav rows, a user row. */}
			<Box sx={{ width: '24%', flexShrink: 0, boxSizing: 'border-box', bgcolor: mgmtNeutral.panel, borderRight: `1px solid ${mgmtNeutral.line}`, p: 1.25, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
				<Box sx={{ height: 14, width: '70%', borderRadius: '4px', bgcolor: mgmtNeutral.line, mb: 0.75 }} />
				{mockNavRows.map((w, i) => {
					const active = i === 1;
					const anim = i === 0 ? mockNavOff : active ? mockNavOn : null;

					return (
						<Box key={i} sx={{ position: 'relative', height: 16, borderRadius: '5px', display: 'flex', alignItems: 'center', gap: 0.75, px: 0.75, bgcolor: active ? mgmtNeutral.hover : 'transparent', animation: anim ? mockLoop(anim.fill) : 'none' }}>
							<Box sx={{ position: 'absolute', left: -10, top: 3, width: 3, height: 10, borderRadius: '0 2px 2px 0', bgcolor: active ? mgmtBrand.orange : 'transparent', animation: anim ? mockLoop(anim.bar) : 'none' }} />
							<Box sx={{ width: 7, height: 7, borderRadius: '2px', flexShrink: 0, bgcolor: active ? mgmtBrand.blue : '#cbd5e1', animation: anim ? mockLoop(anim.dot) : 'none' }} />
							<Box sx={{ height: 4, width: `${w * 100}%`, borderRadius: `${mgmtShape.pill}px`, bgcolor: active ? mgmtNeutral.text : mgmtNeutral.line, animation: anim ? mockLoop(anim.line) : 'none' }} />
						</Box>
					);
				})}
				<Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 0.75 }}>
					<Box sx={{ width: 14, height: 14, flexShrink: 0, borderRadius: '50%', bgcolor: mgmtBrand.blueDark }} />
					<Box sx={{ height: 4, flex: 1, borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtNeutral.line }} />
				</Box>
			</Box>
			{/* Header and the Rooms section. */}
			<Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', bgcolor: mgmtBrand.surface }}>
				<Box sx={{ height: 30, flexShrink: 0, boxSizing: 'border-box', bgcolor: mgmtBrand.white, borderBottom: `1px solid ${mgmtBrand.border}`, display: 'flex', alignItems: 'center', px: 1.5, gap: 1 }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
						<Box sx={{ height: 3, width: 44, borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtBrand.border }} />
						<Box sx={{ fontSize: 10, fontWeight: 700, lineHeight: 1, color: mgmtBrand.navy }}>{roomsLabel()}</Box>
					</Box>
					<Box sx={{ height: 12, width: 44, boxSizing: 'border-box', borderRadius: `${mgmtShape.pill}px`, border: `1px solid ${mgmtBrand.border}` }} />
					<Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: mgmtBrand.blueDark }} />
				</Box>
				<Box sx={{ flex: 1, minHeight: 0, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Box sx={{ width: 20, height: 20, borderRadius: '6px', bgcolor: mgmtBrand.blueLight, display: 'grid', placeItems: 'center' }}>
							<MeetingRoomOutlinedIcon sx={{ fontSize: 12, color: mgmtBrand.blue }} />
						</Box>
						<Box>
							<Box sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2, color: mgmtBrand.navy }}>{roomSettingsLabel()}</Box>
							<Box sx={{ mt: '3px', height: 3, width: 96, borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtBrand.border }} />
						</Box>
					</Box>
					<Box sx={{ flex: 1, minHeight: 0, bgcolor: mgmtBrand.white, borderRadius: '8px', border: `1px solid ${mgmtBrand.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
						<Box sx={{ height: 26, flexShrink: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 0.75, px: 1, borderBottom: `1px solid ${mgmtBrand.border}` }}>
							<Box sx={{ px: 0.75, height: 14, borderRadius: '4px', bgcolor: mgmtBrand.orange, color: mgmtBrand.navy, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', animation: mockLoop(mockPress) }}>+ Add item</Box>
							<Box sx={{ flex: 1 }} />
							{[ 0, 1, 2 ].map((i) => <Box key={i} sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: alpha(mgmtBrand.navy, 0.35) }} />)}
						</Box>
						<Box sx={{ ...mockGrid, height: 18, flexShrink: 0, bgcolor: mgmtBrand.surface, borderBottom: `1px solid ${mgmtBrand.border}`, fontSize: 8, fontWeight: 700, color: mgmtBrand.navy }}>
							<span>#</span><span>Name</span><span>Description</span><span>Role</span>
						</Box>
						{/* The room the cursor adds: closed (height 0) in the still frame. */}
						<Box sx={{ ...mockGrid, height: 0, flexShrink: 0, boxSizing: 'border-box', overflow: 'hidden', visibility: 'hidden', borderBottom: `0 solid ${mgmtBrand.border}`, bgcolor: mgmtBrand.orangeLight, animation: mockLoop(mockNewRow) }}>
							<Box sx={{ fontSize: 8, color: mgmtBrand.textSecondary }}>{mockRooms.length + 1}</Box>
							<Box sx={{ fontSize: 9, fontWeight: 600, color: mgmtBrand.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pr: 0.5 }}>ict-workshop</Box>
							<Box sx={{ height: 4, width: '68%', borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtBrand.border }} />
							<Box sx={{ justifySelf: 'start', px: 0.5, py: '1px', borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtBrand.blueLight, color: mgmtBrand.blueDark, fontSize: 7, fontWeight: 600 }}>Normal</Box>
						</Box>
						{mockRooms.map((r, i) => (
							<Box key={r.name} sx={{ ...mockGrid, height: 28, flexShrink: 0, boxSizing: 'border-box', borderBottom: `1px solid ${mgmtBrand.border}`, animation: mockLoop(mockRow, i * 0.12) }}>
								<Box sx={{ fontSize: 8, color: mgmtBrand.textSecondary }}>{i + 1}</Box>
								<Box sx={{ fontSize: 9, fontWeight: 500, color: mgmtBrand.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pr: 0.5 }}>{r.name}</Box>
								<Box sx={{ height: 4, width: `${[ 80, 64, 72, 56 ][i]}%`, borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtBrand.border }} />
								<Box sx={{ justifySelf: 'start', px: 0.5, py: '1px', borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtBrand.blueLight, color: mgmtBrand.blueDark, fontSize: 7, fontWeight: 600 }}>{r.role}</Box>
							</Box>
						))}
					</Box>
				</Box>
			</Box>
		</Box>
		<Box className='mock-toast' aria-hidden sx={{ position: 'absolute', right: 14, bottom: 14, height: 26, display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtBrand.successDark, color: mgmtBrand.white, fontSize: 10, fontWeight: 600, boxShadow: `0 8px 20px ${alpha(mgmtNeutral.ink, 0.18)}`, visibility: 'hidden', animation: mockLoop(mockToastIn) }}>
			<CheckOutlinedIcon sx={{ fontSize: 12 }} />
			{copy.mockToast}
		</Box>
		<Box component='svg' className='mock-cursor' aria-hidden viewBox='0 0 24 24' sx={{ position: 'absolute', left: '73%', top: '80%', width: 18, height: 18, transformOrigin: '2px 2px', pointerEvents: 'none', filter: `drop-shadow(0 2px 3px ${alpha(mgmtNeutral.ink, 0.3)})`, animation: mockLoop(mockCursor) }}>
			<path d='M3 2l7.5 19 2.6-7.9L21 10.5z' fill={mgmtNeutral.ink} stroke={mgmtBrand.white} strokeWidth='1.5' strokeLinejoin='round' />
		</Box>
	</Box>
);

const dashboardCardSx = {
	width: '100%',
	minHeight: 96,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-start',
	gap: 2,
	p: 2.5,
	textAlign: 'left',
	bgcolor: mgmtBrand.white,
	border: `1px solid ${mgmtBrand.border}`,
	borderRadius: `${mgmtShape.cardRadius}px`,
	boxShadow: mgmtShadow.card,
	transition: `${mgmtTransition}, border-color 150ms ease`,
	'& .card-arrow': { color: mgmtBrand.borderStrong, transition: 'color 150ms ease' },
	'&:hover, &.Mui-focusVisible': {
		borderColor: mgmtBrand.blue,
		boxShadow: mgmtShadow.cardHover,
		'& .card-arrow': { color: mgmtBrand.orange },
	},
	'&.Mui-focusVisible': focusRing(),
	[shortScreen]: { minHeight: 80, py: 2 },
	[reducedMotion]: { transition: 'none', '& .card-arrow': { transition: 'none' } },
} as const;

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
	const roleLabel = superAdmin ? copy.roles.superAdmin
		: tenantOwner ? copy.roles.tenantOwner
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
		<Box aria-hidden sx={{ display: 'flex', flexDirection: 'column', alignItems: rail ? 'center' : 'stretch', gap: 1, px: rail ? 0 : 0.5, pt: 1 }}>
			{[ 0, 1, 2, 3, 4, 5 ].map((i) => (
				<Skeleton key={i} variant='rounded' animation={pulse} width={rail ? 48 : undefined} height={40} sx={{ ...sidebarSkeleton, borderRadius: `${mgmtShape.itemRadius}px` }} />
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
	
	// The first screen after sign-in (plan §4.2): a greeting and one card per
	// section the user may open, grouped like the sidebar.
	const dashboard = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, md: 3.5 }, [shortScreen]: { gap: 2.5 } }}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 1 }}>
					<Typography component='h2' sx={{ m: 0, fontSize: { xs: 22, md: 28 }, lineHeight: { xs: '30px', md: '36px' }, fontWeight: 600, color: mgmtBrand.navy, minWidth: 0, overflowWrap: 'anywhere' }}>
						{displayName ? `${copy.welcome}, ${displayName}` : copy.welcome}
					</Typography>
					{roleLabel && <Box component='span' sx={roleChipSx}>{roleLabel}</Box>}
				</Box>
				<Typography sx={{ fontSize: 15, lineHeight: '22px', color: mgmtBrand.textSecondary }}>
					{copy.dashboardIntro}
				</Typography>
			</Box>
			{!rightsKnown && (
				<Box aria-hidden sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(max(280px, calc((100% - 32px) / 3)), 1fr))' }, gap: 2 }}>
					{[ 0, 1, 2, 3, 4, 5 ].map((i) => (
						<Skeleton key={i} variant='rounded' animation={pulse} height={96} sx={{ borderRadius: `${mgmtShape.cardRadius}px` }} />
					))}
				</Box>
			)}
			{(rightsKnown ? navGroups : []).filter((g) => g.id !== 'overview').map((g) => (
				<Box component='section' key={g.id} aria-labelledby={`mgmt-cards-${g.id}`} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
					<Typography id={`mgmt-cards-${g.id}`} component='h3' sx={{ m: 0, fontSize: 13, lineHeight: '18px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: mgmtBrand.textSecondary }}>
						{g.label}
					</Typography>
					<Box
						component='ul'
						sx={{
							listStyle: 'none',
							m: 0,
							p: 0,
							display: 'grid',
							// As many 280px+ columns as fit, never more than 3: 1 on
							// phones, 2 on small tablets, 3 from a 1024px tablet up.
							gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(auto-fill, minmax(max(280px, calc((100% - 32px) / 3)), 1fr))' },
							gap: 2,
						}}
					>
						{g.items.map((item) => (
							<li key={item.key}>
								<ButtonBase onClick={() => selectSection(item.key)} sx={dashboardCardSx}>
									<Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: `${mgmtShape.itemRadius}px`, bgcolor: mgmtBrand.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
										<item.icon sx={{ color: mgmtBrand.blue, fontSize: 22 }} />
									</Box>
									<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
										<Box component='span' sx={{ fontSize: 16, lineHeight: '24px', fontWeight: 600, color: mgmtBrand.navy }}>{item.label}</Box>
										<Box component='span' sx={{ ...mgmtType.body, color: mgmtBrand.textSecondary }}>{copy.descriptions[item.key]}</Box>
									</Box>
									<ArrowForwardOutlinedIcon className='card-arrow' sx={{ fontSize: 20, flexShrink: 0 }} />
								</ButtonBase>
							</li>
						))}
					</Box>
				</Box>
			))}
		</Box>
	);

	// Function to render the selected component in the placeholder. The
	// tables mount in the same order as before; only the frame is new.
	const renderComponent = () => {
		switch (selectedComponent) {
			case 'login':
				return <SignIn />;
			case 'default':
				return section('default', defaultSettingsLabel(), <DefaultTable />);
			case 'tenant':
				return section('tenant', tenantSettingsLabel(), <>
					<TenantTable />
					<TenantOwnerTable />
					<TenantAdminTable />
				</>);
			case 'room':
				return section('room', roomSettingsLabel(), <RoomTable />);
			case 'user':
				return section('user', usersLabel(), <UserTable />);
			case 'group':
				return section('group', groupsLabel(), <>
					<GroupTable />
					<Typography component='h3' sx={{ ...subheadingSx, mb: -1 }}>{groupRolesLabel()}</Typography>
					<GroupRoleTable />
					<Typography component='h3' sx={{ ...subheadingSx, mb: -1 }}>{groupUsersLabel()}</Typography>
					<GroupUserTable />
				</>);
			case 'role':
				return section('role', rolesLabel(), <RoleTable />);
			case 'meetings':
				return section('meetings', meetingsLabel(), <MeetingsTable />);
			case 'rule':
				return section('rule', rulesLabel(), <RuleTable />);
			default:
				return dashboard;
		}
	};

	const avatarNode = (size: number, ring = false) => (
		<Avatar
			src={avatar || undefined}
			alt=''
			sx={{
				width: size,
				height: size,
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

	// The full sidebar: permanent from 1200px, and inside the temporary drawer
	// below that (plan §3.2, white per §7.3).
	const renderSidebar = (inDrawer: boolean) => (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', color: mgmtNeutral.text }}>
			<Box
				sx={{
					height: mgmtLayout.headerHeight,
					flexShrink: 0,
					display: 'flex',
					alignItems: 'center',
					gap: 1,
					pl: 2.5,
					pr: 1,
					borderBottom: `1px solid ${mgmtNeutral.line}`,
					[shortScreen]: { height: mgmtLayout.headerHeightCompact },
				}}
			>
				<BrandMark />
				{!inDrawer && (
					<Tooltip title={copy.collapseSidebar} placement='right'>
						<IconButton
							ref={collapseButtonRef}
							aria-label={copy.collapseSidebar}
							aria-controls='mgmt-nav'
							aria-expanded
							onClick={toggleNav}
							sx={{ ml: 'auto', width: 36, height: 36, borderRadius: `${mgmtShape.radius}px`, color: mgmtNeutral.label, '&:hover': { backgroundColor: mgmtNeutral.hover, color: mgmtNeutral.ink }, '&.Mui-focusVisible': focusRing() }}
						>
							<KeyboardDoubleArrowLeftOutlinedIcon sx={{ fontSize: 20 }} />
						</IconButton>
					</Tooltip>
				)}
				{inDrawer && (
					<IconButton
						aria-label={copy.closeMenu}
						onClick={() => setMobileOpen(false)}
						sx={{ ml: 'auto', width: 44, height: 44, color: mgmtNeutral.text, '&:hover': { backgroundColor: mgmtNeutral.hover }, '&.Mui-focusVisible': focusRing() }}
					>
						<CloseOutlinedIcon fontSize='small' />
					</IconButton>
				)}
			</Box>

			{signedIn && (
				<Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', px: 1, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.75, [shortScreen]: { py: 1, gap: 1 } }}>
					{!rightsKnown && navSkeleton(false)}
					{(rightsKnown ? navGroups : []).map((g) => (
					// A labelled group holding a real list: div > label + ul > li >
						// button (axe "list": a ul may only contain li).
						<Box key={g.id} role='group' aria-labelledby={`mgmt-nav-${g.id}${inDrawer ? '-d' : ''}`}>
							<Typography id={`mgmt-nav-${g.id}${inDrawer ? '-d' : ''}`} component='div' sx={groupLabelSx}>
								{g.label}
							</Typography>
							<List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
								{g.items.map((item) => {
									const selected = item.key === selectedComponent;

									return (
										<li key={item.key || 'dashboard'}>
											<ListItemButton
												selected={selected}
												aria-current={selected ? 'page' : undefined}
												onClick={() => selectSection(item.key)}
												sx={{ ...navItemSx, ...(inDrawer ? { '& .MuiListItemText-primary': { fontSize: { xs: 15, md: 14 } } } : {}) }}
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
						gap: 0.5,
						// Short laptops: Logout moves beside the user card, so the
						// whole nav fits a 1366×768 screen without scrolling.
						[shortScreen]: { flexDirection: 'row', alignItems: 'center', py: 1 },
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, minWidth: 0, flexGrow: 1 }}>
						{avatarNode(40)}
						<Box sx={{ minWidth: 0, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
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
								<Typography noWrap sx={{ fontSize: 12, lineHeight: '16px', color: mgmtNeutral.muted }}>
									{email}
								</Typography>
							)}
						</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
						<ButtonBase
							onClick={handleLogout}
							aria-label={logoutLabel()}
							sx={{
								flexGrow: 1,
								justifyContent: 'flex-start',
								height: { xs: 44, md: 40 },
								gap: 1.5,
								px: 1.5,
								borderRadius: `${mgmtShape.radius}px`,
								color: mgmtNeutral.text,
								fontSize: 14,
								transition: mgmtTransition,
								'&:hover': { backgroundColor: mgmtNeutral.hover, color: mgmtNeutral.ink },
								'&.Mui-focusVisible': focusRing(),
								[shortScreen]: { flexGrow: 0, width: 40, px: 0, justifyContent: 'center', '& .label': { display: 'none' } },
							}}
						>
							<LogoutOutlinedIcon sx={{ fontSize: 20 }} />
							<span className='label'>{logoutLabel()}</span>
						</ButtonBase>
						{inDrawer && (
							<ButtonBase
								onClick={(e) => setLanguageAnchor(e.currentTarget)}
								aria-label={selectLanguageLabel()}
								aria-haspopup='menu'
								sx={{
									display: { xs: 'inline-flex', md: 'none' },
									height: 44,
									gap: 0.75,
									px: 1.5,
									borderRadius: `${mgmtShape.pill}px`,
									border: `1px solid ${mgmtNeutral.line}`,
									bgcolor: mgmtNeutral.panel,
									color: mgmtNeutral.text,
									fontSize: 14,
									'&:hover': { backgroundColor: mgmtNeutral.hover },
									'&.Mui-focusVisible': focusRing(),
								}}
							>
								<LanguageOutlinedIcon sx={{ fontSize: 18, color: mgmtBrand.blue }} />
								{(localeList.find((l) => l.locale.includes(locale))?.locale[0] ?? 'en').toUpperCase()}
							</ButtonBase>
						)}
					</Box>
				</Box>
			) : null}
		</Box>
	);

	// Tablets (900–1199px), and desktops with the sidebar minimized: a 72px
	// icon rail with tooltips (plan §3.4). The groups have no labels, only
	// hairlines between them.
	const rail = (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', color: mgmtNeutral.text }}>
			<Box sx={{ width: '100%', height: mgmtLayout.headerHeight, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: { lg: `1px solid ${mgmtNeutral.line}` }, [shortScreen]: { height: mgmtLayout.headerHeightCompact } }}>
				<Tooltip title={copy.home} placement='right'>
					<Box
						component={Link}
						to='/'
						aria-label={copy.home}
						sx={{ width: 40, height: 40, borderRadius: `${mgmtShape.radius}px`, boxSizing: 'border-box', bgcolor: mgmtNeutral.panel, border: `1px solid ${mgmtNeutral.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', '&:focus-visible': focusRing() }}
					>
						<Box component='img' src={edumeetConfig.theme.logo} alt='' sx={{ height: 24, width: 28, objectFit: 'cover', objectPosition: 'left center' }} />
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
						sx={{ width: 40, height: 40, borderRadius: `${mgmtShape.radius}px`, color: mgmtNeutral.label, '&:hover': { backgroundColor: mgmtNeutral.hover, color: mgmtNeutral.ink }, '&.Mui-focusVisible': focusRing() }}
					>
						<KeyboardDoubleArrowRightOutlinedIcon sx={{ fontSize: 20 }} />
					</IconButton>
				</Tooltip>
			</Box>
			{signedIn && (
				<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, py: 1, flexGrow: 1, minHeight: 0, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
					{!rightsKnown && <li>{navSkeleton(true)}</li>}
					{(rightsKnown ? navGroups : []).map((g, gi) => (
						<Box component='li' key={g.id} sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							{gi > 0 && <Divider sx={{ width: 40, my: 0.75, borderColor: mgmtNeutral.line }} />}
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
													sx={{
														...navItemSx,
														width: 48,
														px: 0,
														justifyContent: 'center',
														'& .MuiSvgIcon-root': { fontSize: 22 },
														'&.Mui-selected::before': { ...navItemSx['&.Mui-selected::before'], left: -12 },
													}}
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
				<Box sx={{ py: 1.5 }}>
					<Tooltip title={logoutLabel()} placement='right'>
						<IconButton
							onClick={handleLogout}
							aria-label={logoutLabel()}
							sx={{ width: 44, height: 44, borderRadius: `${mgmtShape.itemRadius}px`, color: mgmtNeutral.text, '&:hover': { backgroundColor: mgmtNeutral.hover, color: mgmtNeutral.ink }, '&.Mui-focusVisible': focusRing() }}
						>
							<LogoutOutlinedIcon sx={{ fontSize: 20 }} />
						</IconButton>
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
					{signedIn && (
						<Typography noWrap sx={{ display: { xs: 'block', md: 'none' }, ...mgmtType.caption, color: mgmtBrand.textSecondary, mb: 1.5 }}>
							{[ ...breadcrumb, pageTitle ].join(' › ')}
						</Typography>
					)}
					{loading ? contentSkeleton : renderComponent()}
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

	// Signed out (plan §4.3, §7.4–§7.4c): a full-screen hero on the neutral
	// ground with a dot grid. From 900px: the text and the animated admin
	// mockup in the left 7 columns, the sign-in card alone in the right 5;
	// nothing overlaps. Below 900px the mockup is hidden and the text sits
	// above the card. No logo and no "Admin" tag (user request).
	const signInScreen = (
		<Box
			component='section'
			aria-labelledby='mgmt-signin-title'
			sx={{
				minHeight: '100vh',
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				bgcolor: mgmtNeutral.bg,
				backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
				backgroundSize: '24px 24px',
				color: mgmtNeutral.ink,
				px: { xs: 2, sm: 3, lg: 4 },
				py: { xs: 4, md: 6 },
				[shortScreen]: { py: 3 },
			}}
		>
			<Box
				sx={{
					width: '100%',
					maxWidth: 1200,
					mx: 'auto',
					display: 'grid',
					gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(12, minmax(0, 1fr))' },
					columnGap: { md: 4, lg: 6 },
					rowGap: { xs: 3, sm: 4 },
					alignItems: 'center',
				}}
			>
				<Box sx={{ gridColumn: { md: '1 / span 7' }, display: 'flex', flexDirection: 'column', gap: 5, [shortScreen]: { gap: 3 } }}>
					<Box sx={{ maxWidth: { xs: 560, md: 580 }, mx: { xs: 'auto', md: 0 }, textAlign: { xs: 'center', md: 'left' } }}>
						<Typography sx={{ color: mgmtNeutral.muted, fontWeight: 500, fontSize: { xs: 13, md: 15 }, lineHeight: 1.5, mb: 2 }}>
							{copy.heroEyebrow}
						</Typography>
						<Typography
							id='mgmt-signin-title'
							component='h1'
							sx={{ m: 0, color: mgmtNeutral.ink, fontSize: 'clamp(1.75rem, 1.1rem + 2vw, 3rem)', lineHeight: 1.12, fontWeight: 700, letterSpacing: '-0.01em' }}
						>
							{copy.heroTitle}
						</Typography>
						<Box aria-hidden sx={{ width: 56, height: 4, borderRadius: `${mgmtShape.pill}px`, bgcolor: mgmtBrand.orange, my: { xs: 2, md: 3 }, mx: { xs: 'auto', md: 0 }, [shortScreen]: { my: 2 } }} />
						<Typography sx={{ m: 0, fontSize: { xs: 16, md: 18 }, lineHeight: 1.6, color: mgmtNeutral.text, maxWidth: 520, mx: { xs: 'auto', md: 0 } }}>
							{copy.heroSubtitle}
						</Typography>
					</Box>
					<Box sx={{ display: { xs: 'none', md: 'block' } }}>
						<AdminMock />
					</Box>
				</Box>

				<Box sx={{ gridColumn: { md: '8 / span 5' }, justifySelf: { xs: 'center', md: 'end' }, width: { xs: 'min(420px, 100%)', md: 'min(420px, 100%)' }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5, [shortScreen]: { gap: 2 } }}>
					<Box sx={{ ...signInCardSx, width: '100%' }}>
						<SignIn />
					</Box>
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
