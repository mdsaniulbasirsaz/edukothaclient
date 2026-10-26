import { useEffect, useState } from 'react';
import { Button, Box, CircularProgress, IconButton, InputAdornment, Link, Menu, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import { ThemeProvider, alpha, createTheme, styled } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import { useAppDispatch, useAppSelector, useDeviceSelector, useNotifier } from '../../store/hooks';
import { joinLabel, yourNameLabel, imprintLabel, joinConsentLabel, privacyPolicyLabel, meetingTokenLabel, meetingTokenInvalidLabel, meetingTokenRequiredLabel, copyRoomLabel, copiedRoomLabel, backgroundBlurLabel, selectVideoBackgroundLabel, selectLanguageLabel, loginLabel, logoutLabel } from '../../components/translated/translatedComponents';
import { ArrowForward, BlurOff, BlurOn, Check, ContentCopy, HideImageOutlined, ImageOutlined, KeyOutlined, LanguageOutlined, Lock, LoginOutlined, LogoutOutlined, MicNoneOutlined, PersonOutlined, VideocamOutlined, VolumeUpOutlined } from '@mui/icons-material';
import { intl, localeList } from '../../utils/intlManager';
import MediaPreview from '../../components/mediapreview/MediaPreview';
import MicPreviewButton from '../../components/controlbuttons/MicPreviewButton';
import WebcamPreviewButton from '../../components/controlbuttons/WebcamPreviewButton';
import MeetingsButton from '../../components/controlbuttons/MeetingsButton';
import AudioInputChooser from '../../components/devicechooser/AudioInputChooser';
import VideoInputChooser from '../../components/devicechooser/VideoInputChooser';
import { roomActions } from '../../store/slices/roomSlice';
import settingsSlice, { settingsActions } from '../../store/slices/settingsSlice';
import { uiActions } from '../../store/slices/uiSlice';
import { botDisplayName, botJobIdFromUrl, botSessionFromUrl, botTokenFromUrl, botTypeFromUrl, HEADLESS_PRESET, headlessFromUrl, headlessJoinPlan, hrefWithoutBotToken, layoutSettingsActions } from '../../utils/headless';
import { JOIN_ERROR_KEY } from '../../store/middlewares/roomMiddleware';
import { connect } from '../../store/actions/roomActions';
import { updateVideoSettings } from '../../store/actions/mediaActions';
import { checkJWT, login, logout } from '../../store/actions/permissionsActions';
import { setLocale } from '../../store/actions/localeActions';
import { meActions } from '../../store/slices/meSlice';
import AudioOutputChooser from '../../components/devicechooser/AudioOutputChooser';
import { canSelectAudioOutput } from '../../store/selectors';
import edumeetConfig from '../../utils/edumeetConfig';
import { BackgroundType, MAX_DISPLAY_NAME_LENGTH } from '../../utils/types';
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
	pageBg: '#f4f7fb',
	line: '#e2e8f0',
	labelText: '#33445c',
} as const;

// Design A (canvas "Room Preview Redesign", 2026-10-25): a white card with a
// white header on a plain light-grey page.
const joinStage = joinBrand.pageBg;

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
	precallTitleColor: joinBrand.white,
	precallTitleTextColor: joinBrand.navy,
	precallTitleIconColor: joinBrand.navy,
	roundedness: 12,
	components: {
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

// The orange Join button. Joining keeps the orange, so it reads as busy
// rather than unavailable.
const joinButtonSx = (busy: boolean) => ({
	height: 54,
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
	[shortScreen]: { height: 50, boxShadow: `0 6px 14px ${alpha(joinBrand.orange, 0.3)}` },
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
	'&.Mui-disabled': busy ? {
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
});

// Name and token fields: label above (design A), 52px, 12px corners.
const inputSx = {
	'& .MuiOutlinedInput-root': { height: 52, borderRadius: '12px', bgcolor: joinBrand.white, fontSize: 16 },
	'& .MuiOutlinedInput-notchedOutline': { borderColor: joinBrand.textDisabled },
	'& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: joinBrand.error, borderWidth: 2 },
	'& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: 20 },
	[shortScreen]: { '& .MuiOutlinedInput-root': { height: 46 } },
} as const;

const JoinHeading = ({ compact }: { compact?: boolean }): React.JSX.Element => (
	<Box>
		<Typography
			component='h1'
			sx={{
				m: 0,
				fontSize: { xs: 24, md: 32 },
				lineHeight: { xs: '30px', md: '40px' },
				letterSpacing: { md: '-0.01em' },
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
		// Design A: one bordered box, "Room cse-341" on the left and a quiet
		// Copy link button on the right.
		<Box sx={{
			gridArea: 'room',
			display: 'flex',
			alignItems: 'center',
			gap: 1,
			minWidth: 0,
			minHeight: { xs: 48, md: 46 },
			boxSizing: 'border-box',
			p: '6px 6px 6px 14px',
			border: `1px solid ${joinBrand.border}`,
			borderRadius: '12px',
			bgcolor: joinBrand.surfaceSubtle,
			[shortScreen]: { minHeight: 40, py: '3px' },
		}}>
			<Typography component='span' sx={{ flexShrink: 0, fontSize: 12.5, fontWeight: 500, color: joinBrand.textSecondary }}>
				{ joinRoomChipLabel() }
			</Typography>
			<Typography component='span' sx={{
				minWidth: 0,
				fontFamily: '\'Roboto Mono\', ui-monospace, monospace',
				fontSize: 15,
				fontWeight: 700,
				color: joinBrand.navy,
				overflow: 'hidden',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap',
			}}>
				{ roomId }
			</Typography>
			{/* Text button from md up, icon button below. Hidden while joining. */}
			{ !hideCopy && <Button
				onClick={handleCopy}
				aria-label={copyText}
				startIcon={copied ? <Check /> : <ContentCopy />}
				sx={{
					ml: 'auto',
					height: { xs: 36, md: 34 },
					minWidth: { xs: 36, md: 0 },
					flexShrink: 0,
					px: { xs: 0, md: 1.25 },
					borderRadius: '8px',
					textTransform: 'none',
					letterSpacing: 0,
					fontSize: 13,
					fontWeight: 500,
					'& .MuiSvgIcon-root': { fontSize: 16 },
					color: copied ? joinBrand.successText : joinBrand.blueDark,
					bgcolor: copied ? joinBrand.successLight : 'transparent',
					'& .MuiButton-startIcon': { m: { xs: 0, md: '0 6px 0 0' } },
					'&:hover': { bgcolor: copied ? joinBrand.successLight : joinBrand.blueLight },
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
		height: 28,
		boxSizing: 'border-box',
		px: 1.25,
		borderRadius: 999,
		bgcolor: status === 'off' ? joinBrand.errorLight : status === 'starting' ? joinBrand.surfaceSubtle : joinBrand.successLight,
		color: status === 'off' ? joinBrand.errorText : status === 'starting' ? joinBrand.textSecondary : joinBrand.successText,
		display: 'flex',
		alignItems: 'center',
		gap: 0.75,
		fontSize: 13,
		fontWeight: 500,
		whiteSpace: 'nowrap',
		[narrowPhone]: { px: 1, fontSize: 12.5 },
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

// Round white buttons on the preview, like the mic and camera Fabs; light
// blue while the effect is on.
const effectButtonSx = (on: boolean) => ({
	width: { xs: 44, sm: 48 },
	height: { xs: 44, sm: 48 },
	bgcolor: on ? joinBrand.blueLight : alpha(joinBrand.white, 0.92),
	color: on ? joinBrand.blueDark : joinBrand.navy,
	boxShadow: { xs: 'none', sm: `0 4px 12px ${alpha(joinBrand.navy, 0.3)}` },
	'&:hover': { bgcolor: on ? joinBrand.blueSoft : joinBrand.white },
	'&.Mui-disabled': { bgcolor: alpha(joinBrand.white, 0.6), color: joinBrand.textDisabled },
	'& .MuiSvgIcon-root': { fontSize: 22 },
});

// The same actions as BlurButton and VideoBackgroundButton in the camera
// chooser, drawn on the preview as in design A.
const BlurPreviewButton = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const videoDevices = useDeviceSelector('videoinput');
	const videoInProgress = useAppSelector((state) => state.me.videoInProgress);
	const blurOn = useAppSelector((state) => state.me.videoBackgroundEffect?.type === BackgroundType.BLUR);
	const disabled = videoDevices.length === 0 || videoInProgress;

	return (
		<Tooltip title={disabled ? '' : backgroundBlurLabel()} placement='top' disableInteractive>
			<span>
				<IconButton
					aria-label={backgroundBlurLabel()}
					aria-pressed={blurOn}
					disabled={disabled}
					onClick={() => {
						dispatch(meActions.setVideoBackgroundEffect({ type: blurOn ? BackgroundType.NONE : BackgroundType.BLUR }));
						dispatch(updateVideoSettings());
					}}
					sx={effectButtonSx(blurOn)}
				>
					{ blurOn ? <BlurOff /> : <BlurOn /> }
				</IconButton>
			</span>
		</Tooltip>
	);
};

const BackgroundPreviewButton = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const videoDevices = useDeviceSelector('videoinput');
	const videoInProgress = useAppSelector((state) => state.me.videoInProgress);
	const imageOn = useAppSelector((state) => state.me.videoBackgroundEffect?.type === BackgroundType.IMAGE);
	const disabled = videoDevices.length === 0 || videoInProgress;

	return (
		<Tooltip title={disabled ? '' : selectVideoBackgroundLabel()} placement='top' disableInteractive>
			<span>
				<IconButton
					aria-label={selectVideoBackgroundLabel()}
					aria-pressed={imageOn}
					disabled={disabled}
					onClick={() => {
						if (imageOn) {
							dispatch(meActions.setVideoBackgroundEffectDisabled());
							dispatch(updateVideoSettings());
						} else {
							dispatch(uiActions.setUi({ videoBackgroundDialogOpen: true }));
						}
					}}
					sx={effectButtonSx(imageOn)}
				>
					{ imageOn ? <HideImageOutlined /> : <ImageOutlined /> }
				</IconButton>
			</span>
		</Tooltip>
	);
};

// Design A's full-width header: logo on the left; My meetings, language and
// Sign in on the right. Same pieces as PrecallTitle, laid out as drawn.
const headerButtonSx = {
	height: 40,
	minWidth: { xs: 44, sm: 0 },
	px: { xs: 1, sm: 1.5 },
	borderRadius: '10px',
	textTransform: 'none',
	letterSpacing: 0,
	fontSize: 14,
	fontWeight: 500,
	color: joinBrand.navy,
	'&:hover': { bgcolor: joinBrand.surfaceSubtle },
	'& .MuiButton-startIcon': { m: { xs: 0, sm: '0 8px 0 0' } },
	'& .MuiButton-startIcon .MuiSvgIcon-root': { fontSize: 18 },
	'& .label': { display: { xs: 'none', sm: 'inline' } },
} as const;

const JoinHeader = (): React.JSX.Element => {
	const dispatch = useAppDispatch();
	const logo = useAppSelector((state) => state.room.logo) || edumeetConfig.theme.logo;
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const locale = useAppSelector((state) => state.settings.locale) ?? 'en';
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);
	const [ languageAnchor, setLanguageAnchor ] = useState<HTMLElement | null>(null);

	useEffect(() => {
		dispatch(checkJWT());
	}, []);

	const languageName = localeList.find((l) => l.locale.includes(locale))?.name ?? localeList[0].name;

	return (
		<Box component='header' sx={{
			height: { xs: 56, sm: 64 },
			flexShrink: 0,
			display: 'flex',
			alignItems: 'center',
			gap: 0.5,
			pl: { xs: 2, sm: 4 },
			pr: { xs: 0.75, sm: 4 },
			bgcolor: joinBrand.white,
			borderBottom: `1px solid ${joinBrand.line}`,
			[shortScreen]: { height: 56 },
			'& .MuiIconButton-root': { width: 40, height: 40, borderRadius: '10px', color: joinBrand.navy },
			'& .MuiIconButton-root:hover': { bgcolor: joinBrand.surfaceSubtle },
		}}>
			{ logo ?
				<Box component='img' src={logo} alt={edumeetConfig.title} sx={{ display: 'block', height: { xs: 22, sm: 26 }, width: 'auto', maxWidth: 200 }} /> :
				<Typography sx={{ fontSize: 18, fontWeight: 700, color: joinBrand.navy }}>{ edumeetConfig.title }</Typography>
			}
			<Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
				<MeetingsButton type='iconbutton' toolTipLocation='bottom' />
				<Button
					onClick={(event) => setLanguageAnchor(event.currentTarget)}
					aria-label={selectLanguageLabel()}
					aria-haspopup='menu'
					aria-expanded={Boolean(languageAnchor)}
					disabled={localeInProgress}
					startIcon={<LanguageOutlined />}
					sx={headerButtonSx}
				>
					<span className='label'>{ languageName }</span>
				</Button>
				<Menu anchorEl={languageAnchor} open={Boolean(languageAnchor)} onClose={() => setLanguageAnchor(null)}>
					{ localeList.map(({ name, locale: listLocale }) => (
						<MenuItem
							key={listLocale[0]}
							selected={listLocale.includes(locale)}
							onClick={() => {
								setLanguageAnchor(null);
								dispatch(setLocale(listLocale[0]));
							}}
						>
							{ name }
						</MenuItem>
					)) }
				</Menu>
				{ loginEnabled && (
					<Button
						onClick={() => dispatch(loggedIn ? logout() : login())}
						aria-label={loggedIn ? logoutLabel() : loginLabel()}
						startIcon={loggedIn ? <LogoutOutlined /> : <LoginOutlined />}
						sx={headerButtonSx}
					>
						<span className='label'>{ loggedIn ? logoutLabel() : loginLabel() }</span>
					</Button>
				) }
			</Box>
		</Box>
	);
};

// How others will see you, as on a room tile. A styled span, not a Box, so
// the `> .MuiBox-root` preview rules never match it.
const PreviewNameTag = styled('span')(({ theme }) => ({
	position: 'absolute',
	top: 14,
	left: 14,
	zIndex: 2,
	maxWidth: 'calc(100% - 28px)',
	boxSizing: 'border-box',
	padding: '5px 10px',
	borderRadius: 8,
	backgroundColor: alpha('#0f1b2e', 0.7),
	color: joinBrand.white,
	fontSize: 13,
	fontWeight: 500,
	lineHeight: '18px',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	pointerEvents: 'none',
	[theme.breakpoints.down('sm')]: { top: 10, left: 10 },
}));

// A styled div, not a Box, for the same reason as PreviewNameTag.
const PreviewControls = styled('div')(({ theme }) => ({
	position: 'absolute',
	left: 0,
	right: 0,
	bottom: 16,
	zIndex: 2,
	display: 'flex',
	justifyContent: 'center',
	gap: 12,
	[theme.breakpoints.down('sm')]: { bottom: 12, gap: 10 },
}));

interface JoinPreviewProps {
	startAudio: boolean;
	startVideo: boolean;
	locked?: boolean;
	name?: string;
}

const JoinPreview = ({ startAudio, startVideo, locked, name }: JoinPreviewProps): React.JSX.Element => {
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
					xs: `0 10px 24px ${alpha(joinBrand.navy, 0.22)}`,
					sm: `0 14px 34px ${alpha(joinBrand.navy, 0.22)}`,
				},
			},
			'& video': { borderRadius: '16px' },
			[narrowPhone]: {
				'& > .MuiBox-root, & video, & > div:first-of-type': { borderRadius: '14px' },
				'& > .MuiBox-root': { boxShadow: `0 8px 20px ${alpha(joinBrand.navy, 0.2)}` },
			},
			[tabletTall]: { gridArea: 'preview' },
			'& .MuiFab-root': {
				width: { xs: 44, sm: 48 },
				height: { xs: 44, sm: 48 },
				boxShadow: { xs: 'none', sm: `0 4px 12px ${alpha(joinBrand.navy, 0.3)}` },
			},
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
			<MediaPreview startAudio={startAudio} startVideo={startVideo} stopAudio={false} stopVideo={false} updateSelection withControls={false} />
			{/* Design A: mic, camera, blur and background in one row along the
				bottom of the preview. MediaPreview's own column is switched off. */}
			<PreviewControls style={locked ? { opacity: 0.6, pointerEvents: 'none' } : undefined}>
				<MicPreviewButton onColor='default' offColor='error' disabledColor='default' />
				<WebcamPreviewButton onColor='default' offColor='error' disabledColor='default' />
				<BlurPreviewButton />
				<BackgroundPreviewButton />
			</PreviewControls>
			{/* Decoration only: the name field says the same to screen readers. */}
			{ name && <PreviewNameTag aria-hidden>{ name }</PreviewNameTag> }
		</Box>
	);
};

// One device row: an icon inside the left of the select (design A). The
// choosers hide themselves when there is only one device, and so does the
// row, so a lone icon is never left behind.
const DeviceRow = ({ icon: Icon, children }: { icon: SvgIconComponent; children: React.ReactNode }): React.JSX.Element => (
	<Box sx={{
		position: 'relative',
		display: 'none',
		'&:has(.MuiInputBase-root, .MuiButtonBase-root)': { display: 'block' },
		// A lone speaker-test button (one output device) keeps no icon beside it.
		'&:not(:has(.MuiInputBase-root)) > .row-icon': { display: 'none' },
	}}>
		<Icon className='row-icon' aria-hidden sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1, fontSize: 18, color: joinBrand.textSecondary, pointerEvents: 'none' }} />
		{ children }
	</Box>
);

// The choosers render their own ChooserDiv rows. Their floating labels stay
// for screen readers but are hidden on screen; the legend goes with them.
const DevicesSection = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
	<Box component='fieldset' sx={{
		m: 0,
		minWidth: 0,
		p: '14px',
		border: `1px solid ${joinBrand.line}`,
		borderRadius: '14px',
		display: 'flex',
		flexDirection: 'column',
		gap: 1.25,
		[shortScreen]: { p: '10px 12px 12px', gap: 1 },
		'& legend': { px: 0.75, fontSize: 13, fontWeight: 600, color: joinBrand.labelText },
		'& .MuiFormControl-root': { m: 0, minWidth: 0 },
		'& .MuiFormControl-root > .MuiInputLabel-root': { ...visuallyHiddenSx, transform: 'none' },
		'& .MuiOutlinedInput-notchedOutline': { top: 0, borderColor: joinBrand.border },
		'& .MuiOutlinedInput-notchedOutline legend': { display: 'none' },
		'& .MuiOutlinedInput-root': { height: 44, borderRadius: '10px', bgcolor: joinBrand.white, pl: 0 },
		'& .MuiSelect-select': { fontSize: 14, lineHeight: '20px', minHeight: 0, py: '12px', pl: '40px' },
		'& .MuiSelect-select.Mui-disabled': { color: joinBrand.textSecondary, WebkitTextFillColor: joinBrand.textSecondary },
		// The speaker test button (the output chooser's adornment) moves to the
		// right end, before the arrow, so the row icon owns the left.
		'& .MuiInputBase-root > :not(.MuiSelect-select):not(input):not(svg):not(fieldset)': { order: 2, mr: '28px' },
		'& .MuiInputBase-root .MuiButton-root': { minWidth: 0, width: 32, height: 32, p: 0, borderRadius: '8px', color: joinBrand.textSecondary, '& .MuiSvgIcon-root': { fontSize: 18 } },
		'& div:has(> .MuiFormControl-root)': { m: 0 },
	}}>
		<legend>{ joinDevicesLabel() }</legend>
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
	const micOn = useAppSelector((state) => Boolean(state.me.previewMicTrackId));
	const camOn = useAppSelector((state) => Boolean(state.me.previewWebcamTrackId));

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';
	const hasPrivacy = privacyUrl.trim() !== '';
	const hasImprint = imprintUrl.trim() !== '';

	if (headless) return null;

	const fieldLabelSx = { display: 'block', mb: 0.75, fontSize: 13, fontWeight: 500, lineHeight: '18px', color: joinBrand.labelText } as const;
	const hintSx = { mt: 0.75, fontSize: 12, lineHeight: '16px', color: joinBrand.textSecondary } as const;

	return (
		<ThemeProvider theme={hasBackgroundImage ? joinThemeOverImage : joinTheme}>
			{/* Design A (canvas "Room Preview Redesign"): a full-width white header
				and one white card on a light-grey page. A plain page, not a dialog:
				nothing sits behind it. */}
			<Box sx={{
				position: 'fixed',
				inset: 0,
				zIndex: 1,
				overflowY: 'auto',
				display: 'flex',
				flexDirection: 'column',
				// A room, user or config background image stays faintly visible.
				bgcolor: hasBackgroundImage ? alpha(joinBrand.pageBg, 0.88) : joinBrand.pageBg,
				color: joinBrand.navy,
			}}>
				<JoinHeader />

				<Box component='main' sx={{
					flexGrow: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: { sm: 'center' },
					gap: 2,
					p: { xs: 0, sm: 3 },
					[shortScreen]: { p: 1.5, gap: 1 },
				}}>
					<Box component='section' aria-labelledby='join-title' sx={{
						width: { xs: '100%', sm: 'min(1140px, 100%)' },
						boxSizing: 'border-box',
						p: { xs: '20px 16px 0', sm: 3, md: '36px' },
						bgcolor: joinBrand.white,
						border: { xs: 0, sm: `1px solid ${joinBrand.line}` },
						borderRadius: { xs: 0, sm: '20px' },
						boxShadow: { xs: 'none', sm: `0 1px 2px ${alpha(joinBrand.navy, 0.05)}, 0 16px 40px ${alpha(joinBrand.navy, 0.08)}` },
						display: 'grid',
						gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) minmax(0, 1fr)', md: 'minmax(0, 620fr) minmax(0, 420fr)' },
						gridTemplateAreas: {
							xs: '"heading" "room" "preview" "form"',
							sm: '"preview room" "preview heading" "preview form"',
						},
						gridTemplateRows: { sm: 'auto auto 1fr' },
						columnGap: { sm: 3, md: 5 },
						rowGap: { xs: 2, md: 2.25 },
						alignItems: 'start',
						[narrowPhone]: { px: 1.5 },
						[shortScreen]: { p: 3, rowGap: 1.5 },
						'@keyframes joinCardRise': {
							from: { opacity: 0, transform: 'translateY(12px)' },
							to: { opacity: 1, transform: 'none' },
						},
						animation: 'joinCardRise 240ms ease-out',
						...noMotion,
					}}>
						<RoomChip roomId={roomId} hideCopy={joinInProgress} />

						<Box sx={{ gridArea: 'heading' }}>
							<JoinHeading compact={Boolean(meetingTokenRejection)} />
						</Box>

						<Box sx={{ gridArea: 'preview', display: 'flex', flexDirection: 'column', gap: 1.75 }}>
							<JoinPreview startAudio={!audioMuted} startVideo={!videoMuted} locked={joinInProgress} name={displayName} />
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
								<DeviceStatusChips />
								<Typography sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.75, fontSize: 13, color: joinBrand.textSecondary }}>
									{ micOn || camOn ? <><Lock sx={{ fontSize: 15 }} />{ joinPreviewPrivateLabel() }</> : joinTurnOnLaterLabel() }
								</Typography>
							</Box>
						</Box>

						<Box sx={{ gridArea: 'form', display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 2.25 }, minWidth: 0, [shortScreen]: { gap: 1.5 } }}>
							{/* Locked while joining: faded, and inert so nothing in it can be focused or changed. */}
							<Box
								inert={joinInProgress}
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: { xs: 2, md: 2.25 },
									[shortScreen]: { gap: 1.5 },
									opacity: joinInProgress ? 0.6 : 1,
									transition: 'opacity 150ms',
									...noMotion,
								}}
							>
								<Box>
									<Typography component='label' htmlFor='join-name' sx={fieldLabelSx}>{ yourNameLabel() }</Typography>
									<TextField
										id='join-name'
										fullWidth
										autoFocus
										value={displayName}
										placeholder='e.g. Nadia Rahman'
										onChange={(event) => handleDisplayNameChange(event.target.value)}
										onFocus={(event) => event.target.select()}
										onKeyDown={(event) => {
											if (event.key === 'Enter' && !joinDisabled) handleJoin();
										}}
										slotProps={{
											input: { startAdornment: <InputAdornment position='start'><PersonOutlined /></InputAdornment> },
											htmlInput: { maxLength: MAX_DISPLAY_NAME_LENGTH, 'aria-describedby': 'join-name-hint' },
										}}
										sx={inputSx}
									/>
									<Typography id='join-name-hint' sx={{ ...hintSx, ...(displayName && { [shortScreen]: { display: 'none' } }) }}>
										{ displayName ? joinNameHelperLabel() : joinEnterNameLabel() }
									</Typography>
								</Box>

								{ meetingTokenRejection && (
									// Drawn as an error: the token was missing or rejected.
									<Box>
										<Typography component='label' htmlFor='join-token' sx={{ ...fieldLabelSx, color: joinBrand.error }}>{ meetingTokenLabel() }</Typography>
										<TextField
											id='join-token'
											fullWidth
											autoFocus
											error
											value={meetingToken ?? ''}
											onChange={(event) => dispatch(meActions.setMeetingToken(normalizeMeetingToken(event.target.value)))}
											onKeyDown={(event) => {
												if (event.key === 'Enter' && !joinDisabled) handleJoin();
											}}
											slotProps={{
												input: { startAdornment: <InputAdornment position='start'><KeyOutlined /></InputAdornment> },
												htmlInput: { 'aria-describedby': 'join-token-error' },
											}}
											sx={inputSx}
										/>
										<Typography id='join-token-error' sx={{ ...hintSx, color: joinBrand.error }}>
											{ meetingTokenRejection === 'invalid' ? meetingTokenInvalidLabel() : meetingTokenRequiredLabel() }
										</Typography>
									</Box>
								) }

								<DevicesSection>
									<DeviceRow icon={MicNoneOutlined}><AudioInputChooser /></DeviceRow>
									{ showAudioOutputChooser && <DeviceRow icon={VolumeUpOutlined}><AudioOutputChooser /></DeviceRow> }
									<DeviceRow icon={VideocamOutlined}><VideoInputChooser /></DeviceRow>
								</DevicesSection>
							</Box>

							{/* Sticky at the bottom of the page on phones. */}
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
								[narrowPhone]: { mx: -1.5, px: 1.5 },
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
											sx={joinButtonSx(Boolean(joinInProgress))}
										>
											{ joinInProgress ? joiningLabel() : joinLabel() }
										</Button>
									</Box>
								</Tooltip>
								<Box role='status' aria-live='polite' sx={visuallyHiddenSx}>
									{ joinInProgress ? joiningLabel() : '' }
								</Box>
								<Typography sx={{ fontSize: 12.5, lineHeight: '18px', color: joinBrand.textSecondary, textAlign: 'center' }}>
									{ hasPrivacy && (
										<>
											{ joinConsentLabel() }{' '}
											<Link href={privacyUrl} target='_blank'>{ privacyPolicyLabel() }</Link>
										</>
									) }
									{ hasImprint && (
										<>
											{ hasPrivacy && ' · ' }
											<Link href={imprintUrl} target='_blank' color='inherit' underline='hover'>{ imprintLabel() }</Link>
										</>
									) }
									<Box component='span' sx={{ display: { xs: 'none', md: joinInProgress ? 'none' : 'inline' } }}>
										{ (hasPrivacy || hasImprint) && ' · ' }{ joinPressEnterLabel() }
									</Box>
								</Typography>
							</Box>
						</Box>
					</Box>

					{ edumeetConfig.infoTooltipEnabled && edumeetConfig.infoTooltipText && (
						<Typography sx={{ maxWidth: 'min(1140px, 100%)', px: 2, pb: 2, fontSize: 12.5, textAlign: 'center', color: joinBrand.textSecondary }}>
							{ edumeetConfig.infoTooltipLink ?
								<Link href={edumeetConfig.infoTooltipLink} target='_blank' underline='none' sx={{ fontWeight: 500 }}>{ edumeetConfig.infoTooltipText }</Link> :
								edumeetConfig.infoTooltipText }
							{ edumeetConfig.infoTooltipDesc && <> · { edumeetConfig.infoTooltipDesc }</> }
						</Typography>
					) }
				</Box>
			</Box>
		</ThemeProvider>
	);
};

export default Join;
