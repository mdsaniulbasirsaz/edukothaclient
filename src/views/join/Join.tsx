import { useEffect, useState } from 'react';
import { Button, Box, CircularProgress, Link, Tooltip, Typography } from '@mui/material';
import { ThemeProvider, alpha, createTheme, styled, Theme } from '@mui/material/styles';
import TextInputField from '../../components/textinputfield/TextInputField';
import { useAppDispatch, useAppSelector, useNotifier } from '../../store/hooks';
import { joinLabel, yourNameLabel, imprintLabel, joinConsentLabel, privacyPolicyLabel, meetingTokenLabel, meetingTokenInvalidLabel, meetingTokenRequiredLabel, copyRoomLabel, copiedRoomLabel } from '../../components/translated/translatedComponents';
import { ArrowForward, Check, ContentCopy, KeyOutlined, Lock, PersonOutlined } from '@mui/icons-material';
import { intl } from '../../utils/intlManager';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import GenericDialog from '../../components/genericdialog/GenericDialog';
import { roomActions } from '../../store/slices/roomSlice';
import settingsSlice, { settingsActions } from '../../store/slices/settingsSlice';
import { botDisplayName, botJobIdFromUrl, botSessionFromUrl, botTokenFromUrl, botTypeFromUrl, HEADLESS_PRESET, headlessFromUrl, headlessJoinPlan, hrefWithoutBotToken, layoutSettingsActions } from '../../utils/headless';
import { JOIN_ERROR_KEY } from '../../store/middlewares/roomMiddleware';
import { connect } from '../../store/actions/roomActions';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import { ChooserDiv } from '../../components/devicechooser/DeviceChooser';
import { meActions } from '../../store/slices/meSlice';
import AudioOutputChooser from '../../components/devicechooser/AudioOutputChooser';
import { canSelectAudioOutput } from '../../store/selectors';
import edumeetConfig from '../../utils/edumeetConfig';
import { MAX_DISPLAY_NAME_LENGTH } from '../../utils/types';
import { meetingTokenFromUrl, normalizeMeetingToken, takeMeetingTokenRejection } from '../../utils/meetingToken';
import { notificationsActions } from '../../store/slices/notificationsSlice';

// EduKotha brand tokens for the Join page (plan/JoinPageUIPlan.md §1.2, §1.6).
// Same values as the landing page.
const joinBrand = {
	navy: '#042c6a',
	navyLight: '#0b3f8f',
	navyDeep: '#06214f',
	blue: '#1a81ec',
	blueDark: '#1668c4',
	blueLight: '#e8f2fd',
	orange: '#fe9b2a',
	orangeDark: '#e8851a',
	orangePressed: '#d9761a',
	orangeLight: '#fff3e5',
	orangeDisabled: '#fde2c0',
	orangeDisabledText: 'rgba(4,44,106,0.5)',
	textSecondary: '#5b6b82',
	surfaceSubtle: '#f4f8fd',
	border: '#d6e2f2',
	divider: '#e6eef8',
	textDisabled: '#7d8fa9',
	blueSoft: '#cfe3fb',
	white: '#ffffff',
	success: '#1f9d55',
	successLight: '#eaf7ef',
	successText: '#146c3a',
	error: '#c62828',
	errorLight: '#fdecec',
	errorBorder: '#f5c2c2',
	errorText: '#8e1b1b',
} as const;

const joinStage = `radial-gradient(900px 520px at 18% 12%, ${joinBrand.navyLight} 0%, ${alpha(joinBrand.navyLight, 0)} 70%), linear-gradient(160deg, ${joinBrand.navy} 0%, ${joinBrand.navyDeep} 100%)`;

// A background image from the room, the user or the config stays visible
// under a navy tint instead of being covered.
const joinStageOverImage = `linear-gradient(160deg, ${alpha(joinBrand.navy, 0.72)} 0%, ${alpha(joinBrand.navyDeep, 0.82)} 100%)`;

const focusRing = (color: string = joinBrand.blue, width = 3, offset = 2) => ({
	outline: `${width}px solid ${color}`,
	outlineOffset: offset,
});

// Short tablet and laptop screens (e.g. 1280×800, 1366×768, 800×600): the two-column
// card must fit without scrolling, so it drops the subtitle and the Devices
// heading and uses smaller margins.
const shortScreen = '@media (min-width: 600px) and (max-height: 820px)';

// Portrait tablets tall enough for the one-column Tablet artboard (768×1180).
// Shorter tablets keep two columns, so the card never scrolls.
const tabletTall = '@media (min-width: 600px) and (max-width: 899.95px) and (min-height: 1150px)';

// The 320px artboard uses a tighter phone rhythm than the 390px one.
const narrowPhone = '@media (max-width: 359.95px)';

// Motion is decoration only; with reduced motion it is switched off.
const noMotion = {
	'@media (prefers-reduced-motion: reduce)': {
		animation: 'none',
		transition: 'none',
	},
} as const;

// Built from the same config as the app theme in index.tsx, so every custom
// key is kept. Only the Join page gets the brand palette; Lobby, Room and the
// landing page keep their own themes.
const makeJoinTheme = (overImage: boolean) => createTheme(edumeetConfig.theme, {
	palette: {
		primary: { main: joinBrand.blue, dark: joinBrand.blueDark, light: joinBrand.blueLight, contrastText: joinBrand.white },
		secondary: { main: joinBrand.orange, dark: joinBrand.orangeDark, light: joinBrand.orangeLight, contrastText: joinBrand.navy },
		error: { main: joinBrand.error },
		success: { main: joinBrand.success },
		text: { primary: joinBrand.navy, secondary: joinBrand.textSecondary },
	},
	background: overImage ? joinStageOverImage : joinStage,
	precallTitleColor: joinBrand.navy,
	precallTitleTextColor: joinBrand.white,
	precallTitleIconColor: joinBrand.white,
	roundedness: 12,
	components: {
		// The dialog backdrop is the Join page's background. The card is wider
		// than MUI's md (900px), always leaves room around it so the page
		// never scrolls sideways, and goes full screen on phones.
		MuiDialog: {
			styleOverrides: {
				backdrop: { background: overImage ? joinStageOverImage : joinStage },
				container: { [tabletTall]: { alignItems: 'flex-start' } },
				paper: ({ theme }: { theme: Theme }) => ({
					borderRadius: 20,
					boxShadow: `0 24px 60px ${alpha(joinBrand.navy, 0.35)}`,
					'&.MuiDialog-paperWidthMd': { maxWidth: 'min(1080px, calc(100% - 64px))' },
					// Header: 64px, padded 0 16 0 24 (56px on phones), with no inner
					// padding on PrecallTitle, which GenericDialog pads a second time.
					'& .MuiDialogTitle-root': {
						height: 64,
						boxSizing: 'border-box',
						padding: '0 16px 0 24px',
						display: 'flex',
						alignItems: 'center',
						[theme.breakpoints.down('sm')]: { height: 56, padding: '0 6px 0 16px' },
						[narrowPhone]: { padding: '0 4px 0 12px' },
						[tabletTall]: { padding: '0 12px 0 20px' },
					},
					'& .MuiDialogTitle-root > .MuiBox-root, & .MuiDialogTitle-root .MuiGrid-container': { width: '100%' },
					'& .MuiDialogTitle-root .MuiGrid-container': { padding: 0, borderRadius: 0 },
					// The bottom strip (About us · Press Enter to join) is the actions row
					// right after the content; with the info footer under it, 4px below.
					'& .MuiDialogContent-root + .MuiDialogActions-root': {
						padding: '10px 24px',
						'&:has(+ .MuiDialogActions-root)': { paddingBottom: 4 },
						borderTop: `1px solid ${joinBrand.divider}`,
						[theme.breakpoints.down('sm')]: { display: 'none' },
						[theme.breakpoints.between('sm', 'md')]: { '&:has([data-strip=enter-only])': { display: 'none' } },
						[shortScreen]: { display: 'none' },
					},
					// GenericDialog always renders the actions row; hide it when empty.
					'& .MuiDialogActions-root:empty': { display: 'none' },
					// GenericDialog's info footer (infoTooltip*) is its second actions row:
					// a 13px link over a 12px description, as drawn.
					'& .MuiDialogActions-root + .MuiDialogActions-root': {
						padding: '4px 24px 16px',
						border: 0,
						'& .MuiGrid-container > *': { fontSize: 12, color: joinBrand.textSecondary },
						'& a': {
							fontSize: 13,
							fontWeight: 500,
							display: 'inline-flex',
							alignItems: 'center',
							gap: 6,
							'&::before': {
								content: '""',
								width: 16,
								height: 16,
								backgroundColor: 'currentColor',
								mask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2\' stroke-linecap=\'round\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'10\'/%3E%3Cpath d=\'M12 16v-4M12 8h.01\'/%3E%3C/svg%3E") center / contain no-repeat',
							},
						},
					},
					// Short screens: the footer becomes one quiet line (about 36px instead
					// of 70), the header is 56px and the margins shrink, so the card fits.
					[shortScreen]: {
						'& .MuiDialogActions-root + .MuiDialogActions-root': {
							padding: '8px 24px 12px',
							borderTop: `1px solid ${joinBrand.border}`,
							'& .MuiGrid-container': {
								display: 'flex',
								flexWrap: 'nowrap',
								alignItems: 'baseline',
								justifyContent: 'center',
								gap: 8,
								minWidth: 0,
							},
							'& .MuiGrid-container > *': {
								width: 'auto',
								flex: '0 1 auto',
								minWidth: 0,
								textAlign: 'left !important',
								fontSize: 12.5,
								color: joinBrand.textSecondary,
							},
							'& .MuiGrid-container > *:last-of-type': {
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							},
							'& a': { fontSize: 12.5, fontWeight: 500 },
						},
						margin: 12,
						maxHeight: 'calc(100% - 24px)',
						'&.MuiDialog-paperWidthMd': { maxWidth: 'min(1080px, calc(100% - 24px))' },
						'& .MuiDialogTitle-root': { height: 56 },
					},
					// The dialog's own Fade does the opacity; this adds a 12px rise.
					'@keyframes joinCardRise': {
						from: { transform: 'translateY(12px)' },
						to: { transform: 'none' },
					},
					animation: 'joinCardRise 240ms ease-out',
					...noMotion,
					[tabletTall]: {
						margin: '40px 0',
						'&.MuiDialog-paperWidthMd': { maxWidth: 640 },
					},
					[theme.breakpoints.down('sm')]: {
						margin: 0,
						width: '100%',
						maxWidth: '100%',
						height: '100%',
						maxHeight: '100%',
						borderRadius: 0,
						'&.MuiDialog-paperWidthMd': { maxWidth: '100%' },
					},
				}),
			},
		},
		// Nothing in the card is wider than its column, so a sideways
		// scrollbar would only ever come from a rounding error.
		MuiDialogContent: {
			styleOverrides: {
				root: { overflowX: 'hidden' },
			},
		},
		// A visible keyboard focus ring on every button, icon button and chip.
		MuiButtonBase: {
			styleOverrides: {
				root: { '&.Mui-focusVisible': focusRing() },
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					borderRadius: 12,
					'&:hover:not(.Mui-focused):not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: alpha(joinBrand.blue, 0.6) },
					'&.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(joinBrand.blue, 0.12)}` },
					'&.Mui-focused.Mui-error': { boxShadow: `0 0 0 4px ${alpha(joinBrand.error, 0.1)}` },
				},
				notchedOutline: { borderColor: joinBrand.border },
			},
		},
		MuiInputLabel: {
			styleOverrides: {
				root: { fontWeight: 500 },
			},
		},
		MuiInputAdornment: {
			styleOverrides: {
				root: { color: joinBrand.textSecondary, '& .MuiSvgIcon-root': { fontSize: 22 } },
			},
		},
		MuiSelect: {
			styleOverrides: {
				icon: { color: joinBrand.textSecondary },
			},
		},
		MuiMenu: {
			styleOverrides: {
				paper: {
					borderRadius: 12,
					border: `1px solid ${joinBrand.border}`,
					boxShadow: `0 12px 32px ${alpha(joinBrand.navy, 0.18)}`,
				},
			},
		},
		MuiTooltip: {
			styleOverrides: {
				tooltip: { backgroundColor: joinBrand.navy, color: joinBrand.white, fontSize: 12, fontWeight: 500, borderRadius: 8 },
				arrow: { color: joinBrand.navy },
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: {
					'&.Mui-selected, &.Mui-selected:hover': {
						backgroundColor: joinBrand.blueLight,
						color: joinBrand.navy,
					},
					// Drawn inside the item, so the menu edge does not clip it.
					'&.Mui-focusVisible': { outlineOffset: -3 },
				},
			},
		},
		// #1a81ec on white is 3.7:1, too low for small text, so text in
		// primary blue (links, focused labels) uses blueDark instead.
		MuiLink: {
			variants: [ { props: { color: 'primary' }, style: { color: joinBrand.blueDark } } ],
			styleOverrides: {
				root: { borderRadius: 2, '&:focus-visible': focusRing(joinBrand.blue, 2, 2) },
			},
		},
		MuiFormLabel: {
			styleOverrides: {
				root: { '&.Mui-focused': { color: joinBrand.blueDark } },
			},
		},
	},
});

const joinTheme = makeJoinTheme(false);
const joinThemeOverImage = makeJoinTheme(true);

// Join-only strings. English comes from defaultMessage until the ids are
// added to src/translations/*.json.
const joinHeadingLabel = (): string => intl.formatMessage({
	id: 'label.joinHeading',
	defaultMessage: 'Ready to join?'
});

const joinSubtitleLabel = (): string => intl.formatMessage({
	id: 'label.joinSubtitle',
	defaultMessage: 'Check your camera and mic before you go in.'
});

const joinRoomChipLabel = (): string => intl.formatMessage({
	id: 'label.joinRoomChip',
	defaultMessage: 'Room'
});

const joinDevicesLabel = (): string => intl.formatMessage({
	id: 'label.joinDevices',
	defaultMessage: 'Devices'
});

const joinCameraOffPreviewLabel = (): string => intl.formatMessage({
	id: 'label.joinCameraOffPreview',
	defaultMessage: 'Your camera is off'
});

const joinMicReadyLabel = (): string => intl.formatMessage({
	id: 'label.joinMicReady',
	defaultMessage: 'Mic ready'
});

const joinMicOffLabel = (): string => intl.formatMessage({
	id: 'label.joinMicOff',
	defaultMessage: 'Mic off'
});

const joinMicStartingLabel = (): string => intl.formatMessage({
	id: 'label.joinMicStarting',
	defaultMessage: 'Starting mic…'
});

const joinCameraReadyLabel = (): string => intl.formatMessage({
	id: 'label.joinCameraReady',
	defaultMessage: 'Camera ready'
});

const joinCameraOffLabel = (): string => intl.formatMessage({
	id: 'label.joinCameraOff',
	defaultMessage: 'Camera off'
});

const joinCameraStartingLabel = (): string => intl.formatMessage({
	id: 'label.joinCameraStarting',
	defaultMessage: 'Starting camera…'
});

const joinPreviewPrivateLabel = (): string => intl.formatMessage({
	id: 'label.joinPreviewPrivate',
	defaultMessage: 'Only you can see this preview'
});

const joinNameHelperLabel = (): string => intl.formatMessage({
	id: 'label.joinNameHelper',
	defaultMessage: 'This is how others will see you.'
});

const joinTurnOnLaterLabel = (): string => intl.formatMessage({
	id: 'label.joinTurnOnLater',
	defaultMessage: 'You can turn them on later in the room'
});

const joinPressEnterLabel = (): string => intl.formatMessage({
	id: 'label.joinPressEnter',
	defaultMessage: 'Press Enter to join'
});

const joinEnterNameLabel = (): string => intl.formatMessage({
	id: 'label.joinEnterName',
	defaultMessage: 'Enter your name to join.'
});

const joiningLabel = (): string => intl.formatMessage({
	id: 'label.joining',
	defaultMessage: 'Joining…'
});

// Screen-reader-only. Sizes are strings on purpose: in sx a number <= 1 is a
// fraction, so `width: 1` would mean 100% and make the card scroll.
const visuallyHiddenSx = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: 0,
	margin: '-1px',
	border: 0,
	overflow: 'hidden',
	clip: 'rect(0 0 0 0)',
	whiteSpace: 'nowrap',
} as const;

const JoinHeading = ({ compact }: { compact?: boolean }): React.JSX.Element => (
	<Box>
		<Typography
			component='h1'
			sx={{
				m: 0,
				fontSize: { xs: 24, md: 28 },
				lineHeight: { xs: '30px', md: '34px' },
				fontWeight: 700,
				color: joinBrand.navy,
				[narrowPhone]: { fontSize: 22, lineHeight: '28px' },
				[tabletTall]: { fontSize: 26, lineHeight: '32px' },
				[shortScreen]: { fontSize: 24, lineHeight: '30px' },
			}}
		>
			{ joinHeadingLabel() }
		</Typography>
		<Typography sx={{
			mt: { xs: 0.5, sm: 0.75 },
			fontSize: { xs: 14, sm: 15 },
			lineHeight: { xs: '20px', sm: '22px' },
			color: joinBrand.textSecondary,
			[shortScreen]: { display: 'none' },
			// The token field and its message need the room.
			...(compact && { display: 'none' }),
		}}>
			{ joinSubtitleLabel() }
		</Typography>
	</Box>
);

const RoomChip = ({ roomId, hideCopy }: { roomId: string; hideCopy?: boolean }): React.JSX.Element => {
	const [ copied, setCopied ] = useState(false);

	useEffect(() => {
		if (!copied) return;

		const timer = setTimeout(() => setCopied(false), 2000);

		return () => clearTimeout(timer);
	}, [ copied ]);

	// Origin and path only: the query can hold a meeting token or a display name.
	const handleCopy = () => {
		navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`)
			.then(() => setCopied(true))
			.catch(() => { /* clipboard blocked; nothing to show */ });
	};

	const copyText = copied ? copiedRoomLabel() : copyRoomLabel();

	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, [tabletTall]: { gridArea: 'room' } }}>
			<Box sx={{
				height: { xs: 44, md: 36 },
				flexGrow: { xs: 1, md: 0 },
				minWidth: 0,
				boxSizing: 'border-box',
				pl: 1.5,
				pr: { xs: 1.5, md: 1.75 },
				[tabletTall]: { height: 36, flexGrow: 0, pr: 1.75 },
				borderRadius: 999,
				bgcolor: joinBrand.blueLight,
				display: 'flex',
				alignItems: 'center',
				gap: 1.25,
			}}>
				<Box aria-hidden sx={{
					width: 8,
					height: 8,
					flexShrink: 0,
					borderRadius: 999,
					bgcolor: joinBrand.blue,
					'@keyframes joinRoomPulse': {
						'0%': { boxShadow: `0 0 0 0 ${alpha(joinBrand.blue, 0.55)}` },
						'70%': { boxShadow: `0 0 0 8px ${alpha(joinBrand.blue, 0)}` },
						'100%': { boxShadow: `0 0 0 0 ${alpha(joinBrand.blue, 0)}` },
					},
					animation: 'joinRoomPulse 2s infinite',
					...noMotion,
				}} />
				<Typography component='span' sx={{ fontSize: 13, fontWeight: 500, color: joinBrand.textSecondary }}>
					{ joinRoomChipLabel() }
				</Typography>
				<Typography component='span' sx={{
					fontFamily: '\'Roboto Mono\', ui-monospace, monospace',
					fontSize: 14,
					fontWeight: 500,
					color: joinBrand.navy,
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
				}}>
					{ roomId }
				</Typography>
			</Box>
			{/* Text pill from md up, icon button below. Hidden while joining. */}
			{ !hideCopy && <Button
				onClick={handleCopy}
				variant='outlined'
				aria-label={copyText}
				startIcon={copied ? <Check /> : <ContentCopy />}
				sx={{
					height: { xs: 44, md: 36 },
					minWidth: { xs: 44, md: 0 },
					flexShrink: 0,
					px: { xs: 0, md: 1.5 },
					borderRadius: 999,
					textTransform: 'none',
					letterSpacing: 0,
					fontSize: 13,
					fontWeight: 500,
					[tabletTall]: { height: 36, minWidth: 36, '& .MuiSvgIcon-root': { fontSize: 16 } },
					'& .MuiSvgIcon-root': { fontSize: { xs: 18, md: 16 } },
					bgcolor: copied ? joinBrand.successLight : joinBrand.white,
					color: copied ? joinBrand.successText : joinBrand.blueDark,
					borderColor: copied ? joinBrand.success : joinBrand.border,
					'& .MuiButton-startIcon': { m: { xs: 0, md: '0 6px 0 0' } },
					'&:hover': { borderColor: copied ? joinBrand.success : joinBrand.blue, bgcolor: copied ? joinBrand.successLight : joinBrand.surfaceSubtle },
				}}
			>
				<Box component='span' sx={{ display: { xs: 'none', md: 'inline' } }}>{ copyText }</Box>
			</Button> }
			<Box role='status' aria-live='polite' sx={visuallyHiddenSx}>
				{ copied ? copiedRoomLabel() : '' }
			</Box>
		</Box>
	);
};

const JoiningSpinner = (): React.JSX.Element => (
	<Box
		component='svg'
		viewBox='0 0 24 24'
		aria-hidden
		sx={{
			width: 20,
			height: 20,
			'@keyframes joinSpin': { to: { transform: 'rotate(360deg)' } },
			animation: 'joinSpin 0.9s linear infinite',
			...noMotion,
		}}
	>
		<path d='M12 3a9 9 0 1 0 9 9' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' />
	</Box>
);

type DeviceStatus = 'ready' | 'off' | 'starting';

const StatusChip = ({ status, label }: { status: DeviceStatus; label: string }): React.JSX.Element => (
	<Box sx={{
		height: 32,
		boxSizing: 'border-box',
		px: 1.5,
		borderRadius: 999,
		border: '1px solid',
		borderColor: status === 'off' ? joinBrand.errorBorder : joinBrand.border,
		bgcolor: status === 'off' ? joinBrand.errorLight : joinBrand.surfaceSubtle,
		color: status === 'off' ? joinBrand.errorText : status === 'starting' ? joinBrand.textSecondary : joinBrand.navy,
		display: 'flex',
		alignItems: 'center',
		gap: 1,
		fontSize: 13,
		fontWeight: 500,
		whiteSpace: 'nowrap',
		[narrowPhone]: { height: 30, px: 1.25, gap: 0.75, fontSize: 12.5 },
		transition: 'background-color 150ms, border-color 150ms, color 150ms',
		...noMotion,
	}}>
		{ status === 'starting' ?
			<CircularProgress size={12} thickness={6} sx={{ color: joinBrand.textSecondary }} /> :
			<Box aria-hidden sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: status === 'ready' ? joinBrand.success : joinBrand.error }} />
		}
		<span>{ label }</span>
	</Box>
);

const DeviceStatusChips = (): React.JSX.Element => {
	const micOn = useAppSelector((state) => Boolean(state.me.previewMicTrackId));
	const camOn = useAppSelector((state) => Boolean(state.me.previewWebcamTrackId));
	const audioInProgress = useAppSelector((state) => state.me.audioInProgress);
	const videoInProgress = useAppSelector((state) => state.me.videoInProgress);

	const mic: DeviceStatus = audioInProgress ? 'starting' : micOn ? 'ready' : 'off';
	const cam: DeviceStatus = videoInProgress ? 'starting' : camOn ? 'ready' : 'off';

	const micLabels = { ready: joinMicReadyLabel, off: joinMicOffLabel, starting: joinMicStartingLabel };
	const camLabels = { ready: joinCameraReadyLabel, off: joinCameraOffLabel, starting: joinCameraStartingLabel };

	return (
		<Box aria-live='polite' sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, [narrowPhone]: { gap: 0.75 } }}>
			<StatusChip status={mic} label={micLabels[mic]()} />
			<StatusChip status={cam} label={camLabels[cam]()} />
		</Box>
	);
};

// Drawn behind MediaPreview's VideoBox, whose own background is cleared, so
// the mic and camera buttons stay on top and clickable. A styled div, not a
// Box, so the `> .MuiBox-root` rules below never match it.
const CameraOffLayer = styled('div')({
	position: 'absolute',
	inset: 0,
	borderRadius: 16,
	background: 'url(/images/background.jpg) center / cover no-repeat',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: 12,
	pointerEvents: 'none',
	'@keyframes joinFadeIn': {
		from: { opacity: 0 },
		to: { opacity: 1 },
	},
	animation: 'joinFadeIn 200ms ease-out',
	...noMotion,
});

interface JoinPreviewProps {
	startAudio: boolean;
	startVideo: boolean;
	locked?: boolean;
}

const JoinPreview = ({ startAudio, startVideo, locked }: JoinPreviewProps): React.JSX.Element => {
	const camOn = useAppSelector((state) => Boolean(state.me.previewWebcamTrackId));

	return (
		<Box sx={{
			position: 'relative',
			// MediaPreview's VideoBox
			'& > .MuiBox-root': {
				m: 0,
				borderRadius: '16px',
				overflow: 'hidden',
				backgroundColor: 'transparent',
				backgroundImage: 'none',
				boxShadow: {
					xs: `0 0 0 2px ${alpha(joinBrand.blue, 0.35)}, 0 10px 24px ${alpha(joinBrand.navy, 0.25)}`,
					sm: `0 0 0 2px ${alpha(joinBrand.blue, 0.35)}, 0 14px 34px ${alpha(joinBrand.navy, camOn ? 0.28 : 0.18)}`,
				},
			},
			'& video': { borderRadius: '16px' },
			[narrowPhone]: {
				'& > .MuiBox-root, & video, & > div:first-of-type': { borderRadius: '14px' },
				'& > .MuiBox-root': { boxShadow: `0 0 0 2px ${alpha(joinBrand.blue, 0.35)}` },
			},
			[tabletTall]: { gridArea: 'preview' },
			// Mic and camera buttons
			'& .MuiFab-root': {
				width: 44,
				height: 44,
				boxShadow: { xs: 'none', sm: `0 4px 12px ${alpha(joinBrand.navy, 0.3)}` },
			},
			// While joining the preview controls are dimmed and inactive, as drawn.
			...(locked && { '& .MuiFab-root': { opacity: 0.6, pointerEvents: 'none' } }),
			'& .MuiFab-default': {
				backgroundColor: alpha(joinBrand.white, 0.92),
				color: joinBrand.navy,
				'&:hover': { backgroundColor: joinBrand.white },
			},
		}}>
			{ !camOn && (
				<CameraOffLayer>
					{/* The same avatar the room shows on a tile with no video
						(theme.videoAvatarImage, images/buddy.svg by default). It is a
						50% black silhouette, so it sits on white, not on navy. */}
					<Box aria-hidden sx={{
						width: { xs: 72, sm: 88, md: 112 },
						height: { xs: 72, sm: 88, md: 112 },
						borderRadius: 999,
						// bgcolor: joinBrand.white,
						backgroundImage: (theme) => `url(${theme.videoAvatarImage})`,
						backgroundPosition: 'center bottom',
						backgroundSize: '100%',
						backgroundRepeat: 'no-repeat',
						boxShadow: `0 0 0 4px ${alpha(joinBrand.orange, 0.7)}, 0 0 0 6px ${alpha(joinBrand.orange, 0.6)}, 0 8px 20px ${alpha(joinBrand.navy, 0.15)}`,
					}} />
					{/* White on the dark grey background image. */}
					<Typography sx={{ fontSize: 14, fontWeight: 500, color: joinBrand.white }}>
						{ joinCameraOffPreviewLabel() }
					</Typography>
				</CameraOffLayer>
			)}
			<MediaPreview startAudio={startAudio} startVideo={startVideo} stopAudio={false} stopVideo={false} updateSelection />
		</Box>
	);
};

// The choosers render their own ChooserDiv rows, and hide themselves when
// there is only one device. This panel only frames and spaces them.
const DevicesSection = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
	<Box sx={{
		bgcolor: joinBrand.surfaceSubtle,
		borderRadius: '16px',
		p: { xs: '14px', sm: 1.5, md: 2 },
		display: 'flex',
		flexDirection: 'column',
		gap: { xs: 2, sm: 1.5, md: 2 },
		[narrowPhone]: { p: '14px 12px' },
		[tabletTall]: { p: 2, gap: 2 },
		[shortScreen]: { p: 1, gap: 1 },
		// minWidth 0 lets a long device name ellipsize instead of widening the card.
		'& > div': { m: 0, minWidth: 0 },
		'& .MuiFormControl-root': { minWidth: 0 },
		'& .MuiOutlinedInput-root': { backgroundColor: joinBrand.white },
		// 48px device fields with 15px values and 11px labels (MUI: 56px, 16px, 12px).
		'& .MuiSelect-select': { fontSize: 15, lineHeight: '23px', minHeight: 0, py: '12.5px' },
		'& .MuiSelect-select.Mui-disabled': { color: joinBrand.textDisabled, WebkitTextFillColor: joinBrand.textDisabled },
		'& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': { transform: 'translate(14px, 12px) scale(1)' },
		'& .MuiInputLabel-shrink': { transform: 'translate(14px, -7px) scale(0.6875)' },
		'& .MuiOutlinedInput-notchedOutline legend': { fontSize: '0.6875em' },
		'& .MuiInputBase-adornedStart:has(.MuiButton-root)': { pl: '6px' },
		// Blur and virtual background are MUI text Buttons (64px wide, theme
		// blue); drawn as 36px round grey icons, light blue when blur is on.
		'& .MuiInputBase-root .MuiButton-root': {
			minWidth: 0,
			width: { xs: 44, sm: 36 },
			height: { xs: 44, sm: 36 },
			p: 0,
			borderRadius: 999,
			color: joinBrand.textSecondary,
			'& .MuiSvgIcon-root': { fontSize: 18 },
		},
		'& .MuiInputBase-root .MuiButton-root:has([data-testid=BlurOffIcon])': {
			bgcolor: joinBrand.blueLight,
			color: joinBrand.blueDark,
		},
	}}>
		<Typography sx={{ fontSize: 12, fontWeight: 700, lineHeight: 'normal', letterSpacing: 1, textTransform: 'uppercase', color: joinBrand.textSecondary, [shortScreen]: { display: 'none' } }}>
			{ joinDevicesLabel() }
		</Typography>
		{ children }
	</Box>
);

interface JoinProps {
	roomId: string;
}

const hasStoredJoinError = (): boolean => {
	try {
		return Boolean(sessionStorage.getItem(JOIN_ERROR_KEY));
	} catch {
		return false;
	}
};

const Join = ({ roomId }: JoinProps): React.JSX.Element | null => {
	useNotifier();
	const dispatch = useAppDispatch();

	const displayName = useAppSelector((state) => state.settings.displayName);
	const joinInProgress = useAppSelector((state) => state.room.joinInProgress);
	const mediaLoading = useAppSelector((state) => state.me.videoInProgress || state.me.audioInProgress);
	const audioMuted = useAppSelector((state) => state.me.audioMuted);
	const videoMuted = useAppSelector((state) => state.me.videoMuted);
	const showAudioOutputChooser = useAppSelector(canSelectAudioOutput);
	const meetingToken = useAppSelector((state) => state.me.meetingToken);
	const meetingTokenRejection = useAppSelector((state) => state.me.meetingTokenRejection);

	const headless = useAppSelector((state) => state.room.headless);
	const roomBackgroundImage = useAppSelector((state) => state.room.backgroundImage);
	const userBackgroundImage = useAppSelector((state) => state.me.selectedDestop?.imageUrl);
	// Same image App.tsx gives StyledBackground.
	const hasBackgroundImage = Boolean(userBackgroundImage || roomBackgroundImage || edumeetConfig.theme.backgroundImage);

	const handleDisplayNameChange = (value: string) => dispatch(settingsActions.setDisplayName(value.trim() ? value : value.trim()));

	const handleJoin = () => {
		dispatch(settingsActions.setDisplayName(displayName));
		dispatch(connect(roomId));
	};

	useEffect(() => {
		const dn = new URL(window.location.href).searchParams.get('displayName');

		if (dn) dispatch(settingsActions.setDisplayName(dn));

		const urlMeetingToken = meetingTokenFromUrl(window.location.href);

		if (urlMeetingToken) dispatch(meActions.setMeetingToken(urlMeetingToken));

		const rejection = takeMeetingTokenRejection();

		if (rejection) {
			if (rejection.meetingToken) dispatch(meActions.setMeetingToken(rejection.meetingToken));
			dispatch(meActions.setMeetingTokenRejection(rejection.reason));
			dispatch(notificationsActions.enqueueNotification({
				message: rejection.reason === 'invalid' ? meetingTokenInvalidLabel() : meetingTokenRequiredLabel(),
				options: { variant: 'error' }
			}));
		}

		// headless=0 undoes the preset a headless link saved earlier in this browser.
		if (headlessFromUrl(window.location.href) === false)
			layoutSettingsActions(settingsSlice.getInitialState()).forEach(dispatch);

		if (!headless) return;

		layoutSettingsActions(HEADLESS_PRESET).forEach(dispatch);
		dispatch(settingsActions.setDisplayName(botDisplayName(dn)));

		const botToken = botTokenFromUrl(window.location.href);

		if (botToken) {
			dispatch(meActions.setBotToken(botToken));
			// Out of the address bar, so it is in no screenshot and no history entry.
			window.history.replaceState(window.history.state, '', hrefWithoutBotToken(window.location.href));
		}

		dispatch(meActions.setBotType(botTypeFromUrl(window.location.href)));
		dispatch(meActions.setBotSession(botSessionFromUrl(window.location.href)));
		dispatch(meActions.setBotJobId(botJobIdFromUrl(window.location.href)));
		dispatch(meActions.setAudioMuted(true));
		dispatch(meActions.setVideoMuted(true));

		// App shows and clears this error after us; only look at it here.
		const plan = headlessJoinPlan({ rejection: rejection?.reason, joinErrorPending: hasStoredJoinError() });

		if (plan.reason) dispatch(roomActions.setLeaveReason(plan.reason));
		// Not handleJoin(): that re-saves the name this render started with and
		// would overwrite the one just taken from the URL.
		if (plan.autoJoin) dispatch(connect(roomId));
	}, []);

	const joinDisabled = !displayName || joinInProgress || mediaLoading;
	// The one-column Tablet layout does not fit the token field and its
	// message, so with it shown tall tablets keep two columns.
	const tabletStack = (styles: object) => (meetingTokenRejection ? {} : { [tabletTall]: styles });
	const micOn = useAppSelector((state) => Boolean(state.me.previewMicTrackId));
	const camOn = useAppSelector((state) => Boolean(state.me.previewWebcamTrackId));

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';
	const hasPrivacy = privacyUrl.trim() !== '';
	const hasImprint = imprintUrl.trim() !== '';

	if (headless) return null;

	return (
		<ThemeProvider theme={hasBackgroundImage ? joinThemeOverImage : joinTheme}>
			<GenericDialog
				// An enabled footer with no text would draw an empty strip.
				showFooter={Boolean(edumeetConfig.infoTooltipText || edumeetConfig.infoTooltipDesc)}
				precallTitleBackground={true}
				title={
					<Box sx={{
						// The default logo is dark and disappears on navy, so it sits on a white chip.
						// PrecallTitle sets the logo to 32px inline; the design uses 26px
						// (22px on phones, 20px at 320, 24px on tall tablets).
						'& img': {
							boxSizing: 'content-box',
							padding: { xs: '5px 8px', sm: '6px 10px' },
							backgroundColor: joinBrand.white,
							borderRadius: '8px',
							height: { xs: '22px !important', sm: '26px !important' },
							[narrowPhone]: { height: '20px !important' },
							[tabletTall]: { height: '24px !important' },
						},
						// 44px header buttons (MUI small icon buttons are 34px), a 20px login
						// icon and 15px medium label.
						'& .MuiIconButton-root': { width: 44, height: 44 },
						'& .MuiIconButton-root .MuiSvgIcon-root': { fontSize: 20 },
						'& span': { fontSize: 15, fontWeight: 500, ml: 0 },
						// The blue ring is too faint on navy, so header controls get a white one.
						'& .MuiIconButton-root.Mui-focusVisible': focusRing(joinBrand.white, 2, 2),
						'& .MuiIconButton-root:hover .MuiSvgIcon-root, & span:hover': { color: joinBrand.orange },
					}}>
						<PrecallTitle />
					</Box>
				}
				maxWidth='md'
				actions={
					<Box
						data-strip={hasImprint ? 'full' : 'enter-only'}
						sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, lineHeight: 'normal', color: joinBrand.textSecondary }}
					>
						<span>
							{hasImprint && (
								<Link href={imprintUrl} target="_blank" underline="none" sx={{ color: joinBrand.textSecondary, '&:hover': { color: joinBrand.navy } }}>
									{imprintLabel()}
								</Link>
							)}
						</span>
						<Box component='span' sx={{ display: { xs: 'none', md: joinInProgress ? 'none' : 'inline' } }}>{ joinPressEnterLabel() }</Box>
					</Box>
				}
				content={
					// Tablet and desktop: preview on the left, heading and form on the
					// right (equal columns on tablet, 7/5 on desktop). Stacking on a
					// tablet made the card about 1000px tall, so only phones stack.
					<Box sx={{
						display: 'grid',
						// Desktop: a 564px preview and a 416px form, 36px apart, 32px from
						// the card edges (DialogContent pads 16px, this adds the rest).
						gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) minmax(0, 1fr)', md: 'minmax(0, 564fr) minmax(0, 416fr)' },
						gridTemplateAreas: {
							xs: '"heading" "preview" "form"',
							sm: '"preview heading" "preview form"',
						},
						gridTemplateRows: { sm: 'auto 1fr' },
						columnGap: { sm: 3, md: '36px' },
						rowGap: { xs: 2, md: 2.25 },
						pt: { xs: '11px', sm: 1.5, md: '27px' },
						// Room for the Join button's shadow, which the scroll box would clip.
						pb: { sm: 2, md: '20px' },
						px: { sm: 0.5, md: 2 },
						[narrowPhone]: { mx: '-4px', pt: '9px', rowGap: '14px' },
						...tabletStack({
							gridTemplateColumns: 'minmax(0, 1fr) auto',
							gridTemplateAreas: '"heading heading" "preview preview" "status room" "form form" "join join"',
							gridTemplateRows: 'none',
							columnGap: 1.5,
							rowGap: 2.25,
							pt: '19px',
							pb: 1.5,
							px: 1,
						}),
						[shortScreen]: { pt: 0.5, pb: meetingTokenRejection ? 1 : 1.5 },
					}}>
						<Box sx={{ gridArea: 'heading' }}>
							<JoinHeading compact={Boolean(meetingTokenRejection)} />
						</Box>

						<Box sx={{ gridArea: 'preview', alignSelf: { sm: 'center' }, display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 1.75 }, [narrowPhone]: { gap: '14px' }, ...tabletStack({ display: 'contents' }) }}>
							<JoinPreview startAudio={!audioMuted} startVideo={!videoMuted} locked={joinInProgress} />
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, ...tabletStack({ gridArea: 'status' }) }}>
								<DeviceStatusChips />
								{/* Desktop only, as drawn. The preview is mirrored; this tells new
									users nobody else sees it yet. */}
								<Typography sx={{ display: { xs: 'none', md: joinInProgress ? 'none' : 'flex' }, alignItems: 'center', gap: 0.75, fontSize: 13, color: joinBrand.textSecondary }}>
									{ micOn || camOn ? <><Lock sx={{ fontSize: 16 }} />{ joinPreviewPrivateLabel() }</> : joinTurnOnLaterLabel() }
								</Typography>
							</Box>
						</Box>

						<Box sx={{
							gridArea: 'form',
							display: 'flex',
							flexDirection: 'column',
							gap: { xs: 2, sm: 1.75, md: meetingTokenRejection ? 2 : 2.25 },
							minWidth: 0,
							[narrowPhone]: { gap: '14px' },
							...tabletStack({ display: 'contents' }),
							// Short screens: 48px name field and 44px device fields; with the
							// token field as well, 44px and 40px.
							[shortScreen]: {
								gap: meetingTokenRejection ? 1 : 1.25,
								'& .MuiOutlinedInput-input:not(.MuiSelect-select)': { py: meetingTokenRejection ? '10.5px' : '12.5px' },
								'& .MuiSelect-select': { py: meetingTokenRejection ? '8.5px' : '10.5px' },
							},
						}}>
							<RoomChip roomId={roomId} hideCopy={joinInProgress} />

							{/* Locked while joining: faded, and inert so nothing in it can be focused or changed. */}
							<Box
								inert={joinInProgress}
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: { xs: 2, sm: 1.75, md: meetingTokenRejection ? 2 : 2.25 },
									[narrowPhone]: { gap: '14px' },
									...tabletStack({ gridArea: 'form', gap: 2.25 }),
									[shortScreen]: { gap: meetingTokenRejection ? 1 : 1.25 },
									opacity: joinInProgress ? 0.6 : 1,
									transition: 'opacity 150ms',
									...noMotion,
								}}
							>
								<Box>
									<ChooserDiv sx={{ m: 0 }}>
										<TextInputField
											label={yourNameLabel()}
											value={displayName}
											setValue={handleDisplayNameChange}
											onEnter={handleJoin}
											maxLength={MAX_DISPLAY_NAME_LENGTH}
											startAdornment={<PersonOutlined />}
											autoFocus
										/>
									</ChooserDiv>
									{/* Empty: why Join is disabled. Filled: the hint from the design,
										dropped on short screens to save height. */}
									<Typography sx={{
										mt: 0.75,
										pl: 1.75,
										fontSize: 12,
										lineHeight: 'normal',
										color: joinBrand.textSecondary,
										[narrowPhone]: { pl: 1.5 },
										...(displayName && { [shortScreen]: { display: 'none' } }),
										// Filled: hidden on phones, while joining and above the token field, as drawn.
										...(displayName && { display: { xs: 'none', sm: 'block' } }),
										...(displayName && (meetingTokenRejection || joinInProgress) && { display: 'none' }),
									}}>
										{ displayName ? joinNameHelperLabel() : joinEnterNameLabel() }
									</Typography>
								</Box>

								{ meetingTokenRejection && (
									// Drawn as an error: the token was missing or rejected.
									<Box sx={{
										'& .MuiOutlinedInput-notchedOutline, & .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: joinBrand.error, borderWidth: 2 },
										'& .MuiOutlinedInput-root.Mui-focused': { boxShadow: `0 0 0 4px ${alpha(joinBrand.error, 0.1)}` },
										'& .MuiInputLabel-root, & .MuiInputLabel-root.Mui-focused, & .MuiInputAdornment-root': { color: joinBrand.error },
									}}>
										<ChooserDiv sx={{ m: 0 }}>
											<TextInputField
												label={meetingTokenLabel()}
												value={meetingToken ?? ''}
												setValue={(value) => dispatch(meActions.setMeetingToken(normalizeMeetingToken(value)))}
												onEnter={handleJoin}
												startAdornment={<KeyOutlined />}
												autoFocus
											/>
										</ChooserDiv>
										<Typography sx={{ mt: 0.75, pl: 1.75, fontSize: 12, lineHeight: 'normal', color: joinBrand.error }}>
											{ meetingTokenRejection === 'invalid' ? meetingTokenInvalidLabel() : meetingTokenRequiredLabel() }
										</Typography>
									</Box>
								) }

								<DevicesSection>
									<AudioInputChooser />
									{ showAudioOutputChooser && <AudioOutputChooser /> }
									<VideoInputChooser withBlur withVideoBackground />
								</DevicesSection>
							</Box>

							{/* Sticky at the bottom of the scrolling content on phones. */}
							<Box sx={{
								position: { xs: 'sticky', sm: 'static' },
								bottom: 0,
								zIndex: 1,
								mx: { xs: -2, sm: 0 },
								px: { xs: 2, sm: 0 },
								pt: { xs: '28px', sm: 0 },
								pb: { xs: 1.5, sm: 0 },
								background: { xs: `linear-gradient(${alpha(joinBrand.white, 0)} 0%, ${joinBrand.white} 30%)`, sm: 'none' },
								display: 'flex',
								flexDirection: 'column',
								gap: 1.25,
								[narrowPhone]: { mx: '-12px', px: 1.5, pt: 3, pb: 1, gap: 1 },
								...tabletStack({ gridArea: 'join' }),
							}}>
								{/* A disabled button gets no pointer events, so the cursor and the
									tooltip live on this wrapper. */}
								<Tooltip title={!displayName && !joinInProgress ? joinEnterNameLabel() : ''} placement='top'>
									<Box sx={{ cursor: joinInProgress ? 'progress' : joinDisabled ? 'not-allowed' : undefined }}>
										<Button
											onClick={handleJoin}
											variant='contained'
											// secondary is orange with navy text (about 7:1).
											color='secondary'
											disabled={joinDisabled}
											aria-busy={joinInProgress}
											fullWidth
											startIcon={joinInProgress ? <JoiningSpinner /> : undefined}
											endIcon={joinInProgress ? undefined : <ArrowForward />}
											sx={{
												height: 52,
												borderRadius: '12px',
												fontSize: 17,
												fontWeight: 700,
												letterSpacing: '0.3px',
												// MUI uppercases buttons; the design says "Join".
												textTransform: 'none',
												boxShadow: `0 8px 20px ${alpha(joinBrand.orange, 0.35)}`,
												transition: 'background-color 150ms, box-shadow 150ms, transform 150ms',
												// 10px between the label and the 20px icons.
												'& .MuiButton-endIcon': { m: '0 0 0 10px', transition: 'transform 150ms' },
												'& .MuiButton-startIcon': { m: '0 10px 0 0' },
												'& .MuiButton-endIcon .MuiSvgIcon-root': { fontSize: 20 },
												'&:hover': {
													transform: 'translateY(-1px)',
													boxShadow: `0 10px 24px ${alpha(joinBrand.orange, 0.45)}`,
												},
												// Less room under the button on short screens, so a tighter shadow.
												[shortScreen]: { boxShadow: `0 6px 14px ${alpha(joinBrand.orange, 0.3)}`, ...(meetingTokenRejection && { height: 48 }) },
												'&:hover .MuiButton-endIcon': { transform: 'translateX(4px)' },
												'&:active': {
													backgroundColor: joinBrand.orangePressed,
													transform: 'none',
													boxShadow: 'none',
												},
												'&.Mui-focusVisible': {
													...focusRing(joinBrand.navy, 3, 2),
													boxShadow: `0 0 0 8px ${joinBrand.orangeLight}`,
												},
												// Joining keeps the orange, so it reads as busy rather than unavailable.
												'&.Mui-disabled': joinInProgress ? {
													backgroundColor: joinBrand.orange,
													color: joinBrand.navy,
													boxShadow: 'none',
												} : {
													backgroundColor: joinBrand.orangeDisabled,
													color: joinBrand.orangeDisabledText,
													boxShadow: 'none',
												},
												'@media (prefers-reduced-motion: reduce)': {
													transition: 'none',
													'&:hover, &:hover .MuiButton-endIcon': { transform: 'none' },
												},
											}}
										>
											{ joinInProgress ? joiningLabel() : joinLabel() }
										</Button>
									</Box>
								</Tooltip>
								<Box role='status' aria-live='polite' sx={visuallyHiddenSx}>
									{ joinInProgress ? joiningLabel() : '' }
								</Box>
								{/* The imprint sits in the bottom strip; where there is no strip
									(phones, short screens) it joins this line. */}
								{(hasPrivacy || hasImprint) && (
									<Typography sx={{
										fontSize: { xs: 12, sm: 12.5 },
										lineHeight: 'normal',
										color: joinBrand.textSecondary,
										textAlign: 'center',
										...(!hasPrivacy && { display: { xs: 'block', sm: 'none' }, [shortScreen]: { display: 'block' } }),
									}}>
										{hasPrivacy && (
											<>
												{joinConsentLabel()}{' '}
												<Link href={privacyUrl} target="_blank">
													{privacyPolicyLabel()}
												</Link>
											</>
										)}
										{hasImprint && (
											<Box component='span' sx={{ display: { xs: 'inline', sm: 'none' }, [shortScreen]: { display: 'inline' } }}>
												{hasPrivacy && ' · '}
												<Link href={imprintUrl} target="_blank" color="inherit" underline="hover">
													{imprintLabel()}
												</Link>
											</Box>
										)}
									</Typography>
								)}
							</Box>
						</Box>
					</Box>
				}
			/>
		</ThemeProvider>
	);
};

export default Join;
