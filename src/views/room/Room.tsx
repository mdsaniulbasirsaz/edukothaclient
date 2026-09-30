import { useEffect, useState } from 'react';
import fscreen from 'fscreen';
import { Box, PopoverProps } from '@mui/material';
import { ThemeProvider, alpha, createTheme, styled } from '@mui/material/styles';
import Settings from '../../components/settingsdialog/SettingsDialog';
import TopBar from '../../components/topbar/TopBar';
import FullscreenVideo from '../../components/fullscreenvideo/FullscreenVideo';
import WindowedVideo from '../../components/windowedvideo/WindowedVideo';
import AudioPeers from '../../components/audiopeers/AudioPeers';
import BackgroundSelectDialog from '../../components/backgroundselectdialog/BackgroundSelectDialog';
import LobbyDialog from '../../components/lobbydialog/LobbyDialog';
import FilesharingDialog from '../../components/filesharingdialog/FilesharingDialog';
import ExtraVideoDialog from '../../components/extravideodialog/ExtraVideoDialog';
import PermissionsDialog from '../../components/permissionsdialog/PermissionsDialog';
import Help from '../../components/helpdialog/HelpDialog';
import BotJobDialog from '../../components/botjobdialog/BotJobDialog';
import ConnectivityDialog from '../../components/connectivity/ConnectivityDialog';
import MainContent from '../../components/maincontent/MainContent';
import HelpButton from '../../components/controlbuttons/HelpButton';
import edumeetConfig from '../../utils/edumeetConfig';
import { useNotifier, useAppSelector, useAppDispatch } from '../../store/hooks';
import moment from 'moment';

import { roomActions } from '../../store/slices/roomSlice';

// Same values as `joinBrand` in Join.tsx, copied, not imported. Only the Room
// uses these; Join, Lobby and the landing page keep their own themes.
const roomBrand = {
	navy: '#042c6a',
	navyDeep: '#06214f',
	navyLight: '#0b3f8f',
	blue: '#1a81ec',
	blueDark: '#1668c4',
	blueLight: '#e8f2fd',
	orange: '#fe9b2a',
	orangeDark: '#e8851a',
	white: '#ffffff',
	error: '#d6333a',
	success: '#1f9d55',
	textSecondary: '#5b6b82',
	surfaceSubtle: '#f4f8fd',
	border: '#d6e2f2',
} as const;

// Contrast (WCAG 2.1 AA): white on blue is 3.9:1, so blue fills hold icons
// only and blue buttons with a text label use blueDark (5.5:1). White on
// orange is 2.1:1, so orange always carries navy text (6.3:1). White on
// error is 4.8:1, so red buttons can carry labels.
const roomSurface = {
	onNavyHover: alpha(roomBrand.white, 0.12),
	onNavyDisabled: alpha(roomBrand.white, 0.12),
	onNavyDisabledText: alpha(roomBrand.white, 0.4),
	glass: alpha(roomBrand.navy, 0.92),
	dialogBackdrop: alpha(roomBrand.navy, 0.5),
	panel: 'rgba(255, 255, 255, 0.96)',
} as const;

const roomShape = {
	radius: 12,
	dialogRadius: 20,
	pill: 999,
} as const;

const roomShadow = {
	topBar: `0 8px 24px ${alpha(roomBrand.navy, 0.3)}`,
	controlBar: `0 12px 32px ${alpha(roomBrand.navy, 0.35)}`,
	dialog: `0 24px 60px ${alpha(roomBrand.navy, 0.35)}`,
} as const;

const roomStage = `radial-gradient(120% 80% at 50% 0%, ${roomBrand.navyLight} 0%, ${roomBrand.navy} 45%, ${roomBrand.navyDeep} 100%)`;

const roomTransition = 'background-color 150ms ease, color 150ms ease, box-shadow 150ms ease';

const reducedMotion = '@media (prefers-reduced-motion: reduce)';

const focusRing = (color: string = roomBrand.blue, width = 2, offset = 2) => ({
	outline: `${width}px solid ${color}`,
	outlineOffset: offset,
});

// The control bar: the first child of MainContent's wrapper, which comes
// right after TopBar's <header>. Anchored this way so the Fab overlays on the
// tiles and in FullscreenVideo (also MediaControls) do not match.
const controlBarSelector = 'header + div > div:first-of-type:has(.MuiFab-root)';

// The control bar's menus open upwards from their anchor, but each button
// anchors somewhere else: Mic on an empty box under the button, Cam and Hand
// on the settings badge, More on the button itself. All of them overlapped
// the bar. This lifts such a menu to 8px above the bar, caps its height to
// the room above the bar, and wraps long device names so it fits a phone.
const controlBarMenuStyle = ({ anchorEl, anchorOrigin, transformOrigin }: PopoverProps) => {
	if (anchorOrigin?.vertical !== 'top' || transformOrigin?.vertical !== 'bottom') return {};

	const anchor = typeof anchorEl === 'function' ? anchorEl() : anchorEl;

	if (!(anchor instanceof Element)) return {};

	const bar = anchor.closest(controlBarSelector);

	if (!bar) return {};

	const barTop = bar.getBoundingClientRect().top;
	const lift = Math.max(0, anchor.getBoundingClientRect().top - barTop + 8);

	return {
		marginTop: -lift,
		maxWidth: 'min(360px, calc(100vw - 32px))',
		maxHeight: Math.max(120, barTop - 8 - 16),
		'& .MuiMenuItem-root': { whiteSpace: 'normal', overflowWrap: 'anywhere' },
	};
};

// Built from the same config as the app theme in index.tsx, so every custom
// key (logo, backgroundImage, appBarFloating …) an operator set is kept.
// Only the Room gets the brand palette; Join, Lobby and the landing page keep
// their own themes.
const roomTheme = createTheme(edumeetConfig.theme, {
	palette: {
		primary: { main: roomBrand.blue, dark: roomBrand.blueDark, light: roomBrand.blueLight, contrastText: roomBrand.white },
		secondary: { main: roomBrand.orange, dark: roomBrand.orangeDark, contrastText: roomBrand.navy },
		error: { main: roomBrand.error, contrastText: roomBrand.white },
		success: { main: roomBrand.success, contrastText: roomBrand.white },
		text: { primary: roomBrand.navy, secondary: roomBrand.textSecondary },
		divider: roomBrand.border,
	},
	shape: { borderRadius: roomShape.radius },
	roundedness: roomShape.radius,
	// Custom edumeet keys, read by TopBar, VideoBox, MainContent and the chat
	// and participant lists.
	appBarColor: roomSurface.glass,
	appBarTextColor: roomBrand.white,
	appBarIconColor: roomBrand.white,
	videoBackroundColor: roomBrand.navyDeep,
	activeSpeakerBorder: `2px solid ${roomBrand.blue}`,
	sideContainerBackgroundColor: roomSurface.panel,
	sideContentItemColor: roomBrand.surfaceSubtle,
	sideContentItemDarkColor: roomBrand.blueLight,
	components: {
		// TopBar's AppBar: the glass bar gets a soft navy shadow and a hairline
		// edge (an inset shadow, so the bar stays 40px) instead of MUI's grey
		// elevation. The logo is drawn for light backgrounds, so it sits on a
		// white plate that fits inside the bar.
		MuiAppBar: {
			styleOverrides: {
				root: {
					boxShadow: `${roomShadow.topBar}, inset 0 0 0 1px ${alpha(roomBrand.white, 0.08)}`,
					backdropFilter: 'blur(12px)',
					'& img[alt="Logo"]': {
						boxSizing: 'border-box',
						backgroundColor: roomBrand.white,
						borderRadius: 8,
						padding: '3px 8px',
					},
					'& .MuiIconButton-root:hover': { backgroundColor: roomSurface.onNavyHover },
				},
			},
		},
		// Every control button is a Fab through ControlButton, which passes
		// color='inherit' unless a state asks for 'primary' (People/Chat open)
		// or 'error' (Mic/Cam off). Idle buttons are navy with a white icon;
		// primary, secondary and error keep the palette colours MUI gives them.
		MuiFab: {
			styleOverrides: {
				root: {
					boxShadow: 'none',
					transition: roomTransition,
					'&:active': { boxShadow: 'none' },
					'&.Mui-focusVisible': focusRing(),
					'&.Mui-disabled': {
						backgroundColor: roomSurface.onNavyDisabled,
						color: roomSurface.onNavyDisabledText,
					},
					[reducedMotion]: { transition: 'none' },
					variants: [
						...([ 'inherit', 'default' ] as const).map((color) => ({
							props: { color },
							style: {
								backgroundColor: roomBrand.navy,
								color: roomBrand.white,
								'&:hover': { backgroundColor: roomBrand.navyLight },
							},
						})),
						{
							props: { color: 'primary' },
							style: { '&:hover': { backgroundColor: roomBrand.blueDark } },
						},
						{
							props: { color: 'secondary' },
							style: { '&:hover': { backgroundColor: roomBrand.orangeDark } },
						},
					],
				},
			},
		},
		// Icon colour comes from where the button sits (white in the top bar,
		// navy in panels and dialogs), so only the focus ring is shared.
		MuiIconButton: {
			styleOverrides: {
				root: {
					'&.Mui-focusVisible': focusRing(),
				},
			},
		},
		// Labels need 4.5:1: blue buttons use blueDark (5.5:1), orange ones
		// navy text (6.3:1), red ones white on error (4.8:1).
		MuiButton: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					fontWeight: 600,
					borderRadius: roomShape.pill,
					transition: roomTransition,
					'&.Mui-focusVisible': focusRing(),
					[reducedMotion]: { transition: 'none' },
					variants: [
						{
							props: { variant: 'contained' },
							style: { boxShadow: 'none', '&:hover, &:active': { boxShadow: 'none' } },
						},
						{
							props: { variant: 'contained', color: 'primary' },
							style: {
								backgroundColor: roomBrand.blueDark,
								'&:hover': { backgroundColor: roomBrand.navyLight },
							},
						},
						{
							props: { variant: 'contained', color: 'secondary' },
							style: {
								color: roomBrand.navy,
								'&:hover': { backgroundColor: roomBrand.orangeDark },
							},
						},
						{
							props: { variant: 'outlined', color: 'primary' },
							style: {
								color: roomBrand.navy,
								borderColor: alpha(roomBrand.navy, 0.4),
								'&:hover': { borderColor: roomBrand.navy, backgroundColor: roomBrand.blueLight },
							},
						},
						{
							props: { variant: 'text', color: 'primary' },
							style: { color: roomBrand.blueDark },
						},
					],
				},
			},
		},
		MuiChip: {
			styleOverrides: {
				root: { fontWeight: 500 },
			},
		},
		// Blue as small text (the selected Settings tab, a focused field's
		// label, links) is 3.9:1 on white, so text uses blueDark. Indicators,
		// switches and checkboxes only need 3:1 and keep the brand blue.
		MuiTab: {
			styleOverrides: {
				root: { '&.Mui-selected': { color: roomBrand.blueDark } },
			},
		},
		MuiFormLabel: {
			styleOverrides: {
				root: { '&.Mui-focused': { color: roomBrand.blueDark } },
			},
		},
		MuiLink: {
			styleOverrides: {
				root: { color: roomBrand.blueDark },
			},
		},
		// PulsingBadge paints every badge with palette.secondary (now orange),
		// while the text takes the contrastText of the badge's color='primary'
		// (white, 2.1:1). Navy text on orange passes (6.3:1). The navy edge
		// keeps the badge apart from the navy button under it.
		MuiBadge: {
			styleOverrides: {
				colorPrimary: {
					color: roomBrand.navy,
					border: `2px solid ${roomBrand.navy}`,
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: {
					backgroundColor: roomBrand.navy,
					color: roomBrand.white,
					borderRadius: 8,
					fontSize: 12,
				},
				arrow: { color: roomBrand.navy },
			},
		},
		// The room stays visible behind a navy dim instead of Join's full stage.
		MuiDialog: {
			styleOverrides: {
				paper: {
					borderRadius: roomShape.dialogRadius,
					boxShadow: roomShadow.dialog,
				},
				backdrop: { backgroundColor: roomSurface.dialogBackdrop },
			},
		},
		MuiDialogTitle: {
			styleOverrides: {
				root: { color: roomBrand.navy, fontWeight: 600 },
			},
		},
		// Menus (More, the Mic/Cam/Hand device menus) and popovers. TopBar's
		// phone popover keeps its transparent paper, which it sets with sx.
		MuiPopover: {
			styleOverrides: {
				paper: ({ ownerState }: { ownerState: PopoverProps }) => ({
					borderRadius: roomShape.radius,
					...controlBarMenuStyle(ownerState),
				}),
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: {
					color: roomBrand.navy,
					'&:hover': { backgroundColor: roomBrand.blueLight },
				},
			},
		},
	},
});

// StyledBackground in App.tsx paints the page from the outer theme, so the
// Room lays its own stage over it with the same layout. With a background
// image from the user, the room or the config, the stage stays transparent
// and the image shows through.
const RoomStage = styled(Box, {
	shouldForwardProp: (prop) => prop !== 'overimage',
})<{ overimage: number }>(({ theme, overimage }) => ({
	display: 'flex',
	width: '100%',
	height: '100%',
	background: overimage ? 'transparent' : roomStage,
	// The control bar pill.
	[`& > ${controlBarSelector}`]: {
		padding: theme.spacing(1),
		borderRadius: roomShape.pill,
		backgroundColor: roomSurface.glass,
		backdropFilter: 'blur(12px)',
		boxShadow: `${roomShadow.controlBar}, inset 0 0 0 1px ${alpha(roomBrand.white, 0.08)}`,
		maxWidth: 'calc(100vw - 16px)',
		[theme.breakpoints.down('sm')]: { gap: theme.spacing(1) },
		// Very narrow screens: 36px buttons, so all seven still fit at 320px.
		'@media (max-width: 379.95px)': {
			gap: theme.spacing(0.75),
			padding: theme.spacing(0.75),
			'& .MuiFab-root': { width: 36, height: 36, minHeight: 36 },
		},
		// Navy on the navy pill would hide the button shape, so idle buttons
		// here get a light tint instead.
		'& .MuiFab-colorInherit:not(.Mui-disabled)': {
			backgroundColor: roomSurface.onNavyHover,
			'&:hover': { backgroundColor: alpha(roomBrand.white, 0.2) },
		},
	},
	// The fixed "?" help button (keyboard shortcuts) sits bottom left, where it
	// runs into the control bar on narrow screens. Phones have no keyboard to
	// learn shortcuts for, so it is hidden there.
	'& > .MuiBox-root:has(> div > button > [data-testid="HelpIcon"])': {
		[theme.breakpoints.down('sm')]: { display: 'none' },
		'@media (hover: none) and (pointer: coarse)': { display: 'none' },
	},
}));

const Room = (): React.JSX.Element => {
	const headless = useAppSelector((state) => state.room.headless);
	const roomBackgroundImage = useAppSelector((state) => state.room.backgroundImage);
	const userBackgroundImage = useAppSelector((state) => state.me.selectedDestop?.imageUrl);
	const hasBackgroundImage = Boolean(userBackgroundImage || roomBackgroundImage || edumeetConfig.theme.backgroundImage);

	useNotifier();

	const [ isFullscreen, setFullscreen ] = useState(false);

	useEffect(() => {
		if (fscreen.fullscreenEnabled)
			fscreen.addEventListener('fullscreenchange', handleFullscreenChange);

		return () => {
			if (fscreen.fullscreenEnabled)
				fscreen.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	const handleToggleFullscreen = () => {
		if (fscreen.fullscreenElement)
			fscreen.exitFullscreen();
		else
			fscreen.requestFullscreen(document.documentElement);
	};

	const handleFullscreenChange = () => setFullscreen(fscreen.fullscreenElement !== null);

	const remainingTime = useAppSelector((state) => state.room.countdownTimer.remainingTime);
	const isStarted = useAppSelector((state) => state.room.countdownTimer.isStarted);
	const dispatch = useAppDispatch();

	useEffect(() => {

		if (isStarted) {

			const _countdownTimerRef = setInterval(() => {
				let remainingTimeUnix = moment(`1000-01-01 ${remainingTime}`).unix();

				remainingTimeUnix--;

				const remainingTimeString = moment.unix(remainingTimeUnix).format('HH:mm:ss');

				dispatch(roomActions.setCountdownTimerRemainingTime(remainingTimeString));

			}, 1000);
			
			return () => { clearInterval(_countdownTimerRef); };
		}

	}, [ isStarted, remainingTime, dispatch ]);

	const content = (
		<>
			<WindowedVideo />
			<AudioPeers />
			<TopBar
				fullscreenEnabled={fscreen.fullscreenEnabled}
				fullscreen={isFullscreen}
				onFullscreen={handleToggleFullscreen}
			/>
			<MainContent />
			<FullscreenVideo />
			<BackgroundSelectDialog />
			{ !headless && <LobbyDialog /> }
			<Settings />
			<Help />
			<FilesharingDialog />
			<ExtraVideoDialog />
			<PermissionsDialog />
			<ConnectivityDialog />
			{ !headless && <BotJobDialog /> }
			{ !headless && <HelpButton type='iconbutton' /> }
		</>
	);

	// Bots and recorders keep the original look, so recordings do not change.
	if (headless) return content;

	return (
		<ThemeProvider theme={roomTheme}>
			<RoomStage overimage={hasBackgroundImage ? 1 : 0}>
				{content}
			</RoomStage>
		</ThemeProvider>
	);
};

export default Room;
