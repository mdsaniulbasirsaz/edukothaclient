import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Box, IconButton, Link, Paper, Typography, MenuItem, Select, InputLabel, FormControl, Tab, Tabs, useMediaQuery } from '@mui/material';
import Grid from '@mui/material/Grid';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCodeIcon from '@mui/icons-material/QrCode';
import randomString from 'random-string';
import TextInputField from '../../components/textinputfield/TextInputField';
import { enterRoomLabel, myRoomsLabel, copyRoomLabel, copiedRoomLabel, joinLabel, roomNameLabel, imprintLabel, joinConsentLabel, privacyPolicyLabel } from '../../components/translated/translatedComponents';
import RecoverRecording from '../../components/recoverrecordingdialog/RecoverRecording';
import StyledBackground from '../../components/StyledBackground';
import PrecallTitle from '../../components/precalltitle/PrecallTitle';
import { QRCode } from 'react-qrcode-logo';
import edumeetConfig from '../../utils/edumeetConfig';
import { intl } from '../../utils/intlManager';
import { startListeners, stopListeners } from '../../store/actions/startActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getData } from '../../store/actions/managementActions';
import { Room } from '../../utils/types';

// EduKotha brand tokens (plan/RedesignLandingPage.md, Phase 1).
const brand = {
	navy: '#042c6a',
	navyLight: '#0b3f8f',
	blue: '#1a81ec',
	blueDark: '#1668c4',
	blueLight: '#e8f2fd',
	orange: '#fe9b2a',
	orangeDark: '#e8851a',
	orangeLight: '#fff3e5',
	orangeDisabled: '#fde2c0',
	textSecondary: '#5b6b82',
	surfaceSubtle: '#f4f8fd',
	border: '#d6e2f2',
	borderStrong: '#7d8fa9',
	footerText: 'rgba(255,255,255,0.85)',
} as const;

// Built from the same config as the app theme in index.tsx, so every custom
// key is kept. Only the landing page gets the brand palette; Join, Lobby and
// the room keep the app theme.
const landingTheme = createTheme(edumeetConfig.theme, {
	palette: {
		primary: { main: brand.blue, dark: brand.blueDark, light: brand.blueLight, contrastText: '#ffffff' },
		secondary: { main: brand.orange, dark: brand.orangeDark, light: brand.orangeLight, contrastText: brand.navy },
		text: { primary: brand.navy, secondary: brand.textSecondary },
	},
	background: `linear-gradient(135deg, ${brand.navy} 0%, ${brand.navyLight} 55%, ${brand.blue} 130%)`,
	precallTitleColor: 'transparent',
	precallTitleTextColor: '#ffffff',
	precallTitleIconColor: '#ffffff',
	roundedness: 12,
});

// Landing-only strings. English comes from defaultMessage until the ids are
// added to src/translations/*.json.
const landingHeadlineLabel = (): string => intl.formatMessage({
	id: 'label.landingHeadline',
	defaultMessage: 'Welcome to eduKotha'
});

const landingSubtitleLabel = (): string => intl.formatMessage({
	id: 'label.landingSubtitle',
	defaultMessage: 'Secure online classes and meetings'
});

const landingCardTitleLabel = (): string => intl.formatMessage({
	id: 'label.landingCardTitle',
	defaultMessage: 'Join a meeting'
});

const landingFeatureNoInstallLabel = (): string => intl.formatMessage({
	id: 'label.landingFeatureNoInstall',
	defaultMessage: 'No install needed'
});

const landingFeatureSecureLabel = (): string => intl.formatMessage({
	id: 'label.landingFeatureSecure',
	defaultMessage: 'Secure and encrypted'
});

const landingFeatureRecordLabel = (): string => intl.formatMessage({
	id: 'label.landingFeatureRecord',
	defaultMessage: 'Record and transcribe'
});

const roomNameHelperLabel = (): string => intl.formatMessage({
	id: 'label.roomNameHelper',
	defaultMessage: 'Share this name with others so they can join.'
});

const newRandomRoomLabel = (): string => intl.formatMessage({
	id: 'label.newRandomRoom',
	defaultMessage: 'Generate new room name'
});

const showQrLabel = (): string => intl.formatMessage({
	id: 'label.showQr',
	defaultMessage: 'Show QR code'
});

const hideQrLabel = (): string => intl.formatMessage({
	id: 'label.hideQr',
	defaultMessage: 'Hide QR code'
});

const copyQrLabel = (): string => intl.formatMessage({
	id: 'label.copyQr',
	defaultMessage: 'Copy QR code'
});

const qrSavedLabel = (): string => intl.formatMessage({
	id: 'label.qrSaved',
	defaultMessage: 'Saved'
});

// Shared interaction styles (plan §4.1).
const focusRing = (color: string = brand.blue, width = 3, offset = 2) => ({
	outline: `${width}px solid ${color}`,
	outlineOffset: offset,
});

const noMotion = {
	'@media (prefers-reduced-motion: reduce)': {
		transition: 'none',
		'& .MuiTouchRipple-root': { display: 'none' },
	},
};

// Outlined field styling for the room input and the My rooms select.
const outlinedFieldSx = {
	'& .MuiOutlinedInput-root': {
		borderRadius: '10px',
		transition: 'box-shadow 150ms',
		'& .MuiOutlinedInput-notchedOutline': { borderColor: brand.borderStrong },
		'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brand.blue },
		'&.Mui-focused': { boxShadow: '0 0 0 4px rgba(26,129,236,0.15)' },
		'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: brand.blue, borderWidth: 2 },
		'& legend': { fontWeight: 600 },
		...noMotion,
	},
	'& .MuiOutlinedInput-input': {
		paddingTop: '13px',
		paddingBottom: '13px',
		fontSize: 18,
		color: brand.navy,
	},
	'& .MuiInputLabel-root': { color: brand.navy, fontWeight: 600 },
	'& .MuiInputLabel-root.Mui-focused': { color: brand.blueDark },
};

const visuallyHiddenSx = {
	position: 'absolute',
	width: 1,
	height: 1,
	overflow: 'hidden',
	clip: 'rect(0 0 0 0)',
	whiteSpace: 'nowrap',
} as const;

// The hero sits beside the card only from lg up; below that the card would be
// too narrow for the link panel, so the layout stacks.
const splitBreakpoint = 'lg';

const DecorativeBlobs = (): React.JSX.Element => (
	<Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
		<Box sx={{
			position: 'absolute',
			width: { xs: 260, md: 480 },
			height: { xs: 260, md: 480 },
			top: { xs: -110, md: -180 },
			insetInlineEnd: { xs: -100, md: -140 },
			borderRadius: '50%',
			bgcolor: brand.blue,
			opacity: 0.25,
			filter: 'blur(80px)',
		}} />
		<Box sx={{
			position: 'absolute',
			width: 360,
			height: 360,
			bottom: -160,
			insetInlineStart: -120,
			borderRadius: '50%',
			bgcolor: brand.orange,
			opacity: 0.15,
			filter: 'blur(80px)',
			display: { xs: 'none', md: 'block' },
		}} />
	</Box>
);

const LandingTopBar = (): React.JSX.Element => (
	<Container
		maxWidth='lg'
		component='header'
		sx={{
			position: 'relative',
			zIndex: 1,
			py: { xs: 1, md: 2 },
			flexShrink: 0,
			// The default logo is dark and disappears on navy, so it sits on a white chip.
			'& img': {
				boxSizing: 'content-box',
				padding: '6px 10px',
				backgroundColor: '#ffffff',
				borderRadius: '8px',
			},
			'& .MuiIconButton-root:hover .MuiSvgIcon-root, & .MuiIconButton-root:focus-visible .MuiSvgIcon-root': {
				color: brand.orange,
			},
			'& .MuiIconButton-root.Mui-focusVisible': focusRing('#ffffff', 2, 2),
			'& span:hover': {
				color: brand.orange,
			},
		}}
	>
		<PrecallTitle />
	</Container>
);

const LandingHero = (): React.JSX.Element => {
	const features = [
		landingFeatureNoInstallLabel(),
		landingFeatureSecureLabel(),
		...(edumeetConfig.transcriptionEnabled ? [ landingFeatureRecordLabel() ] : []),
	];

	return (
		<Box sx={{
			display: 'flex',
			flexDirection: 'column',
			alignItems: { xs: 'flex-start', sm: 'center', [splitBreakpoint]: 'flex-start' },
			textAlign: { xs: 'start', sm: 'center', [splitBreakpoint]: 'start' },
			gap: { xs: 0.5, sm: 1.5, [splitBreakpoint]: 2.5 },
			color: '#ffffff',
			px: { xs: 0.5, sm: 0 },
			paddingInlineEnd: { [splitBreakpoint]: 6 },
		}}>
			<Typography component='h1' sx={{
				m: 0,
				fontSize: { xs: 28, sm: 36, [splitBreakpoint]: 40 },
				lineHeight: { xs: '36px', sm: '44px', [splitBreakpoint]: '48px' },
				fontWeight: 700,
				letterSpacing: '-0.4px',
			}}>
				{landingHeadlineLabel()}
			</Typography>
			<Typography sx={{
				m: 0,
				maxWidth: '100%',
				fontSize: { xs: 16, sm: 18 },
				lineHeight: { xs: '24px', sm: '28px' },
				color: 'rgba(255,255,255,0.8)',
				whiteSpace: { xs: 'nowrap', sm: 'normal' },
				overflow: 'hidden',
				textOverflow: 'ellipsis',
			}}>
				{landingSubtitleLabel()}
			</Typography>
			<Box aria-hidden sx={{
				display: { xs: 'none', sm: 'block' },
				width: 48,
				height: 4,
				mt: { sm: 0.5, [splitBreakpoint]: 0 },
				borderRadius: '2px',
				bgcolor: brand.orange,
			}} />
			<Box component='ul' sx={{
				display: { xs: 'none', [splitBreakpoint]: 'flex' },
				flexDirection: 'column',
				gap: 1.75,
				m: 0,
				mt: 1,
				p: 0,
				listStyle: 'none',
			}}>
				{features.map((feature) => (
					<Box component='li' key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: 16, lineHeight: '24px' }}>
						<Box aria-hidden sx={{
							width: 24,
							height: 24,
							borderRadius: '12px',
							bgcolor: brand.blue,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexShrink: 0,
						}}>
							<CheckIcon sx={{ fontSize: 16, color: '#ffffff' }} />
						</Box>
						{feature}
					</Box>
				))}
			</Box>
		</Box>
	);
};

interface RoomLinkPanelProps {
	roomUrl: string;
	roomId: string;
	copyFeedback: boolean;
	onCopy: () => void;
	qrCodeEnabled: boolean;
}

const RoomLinkPanel = ({ roomUrl, roomId, copyFeedback, onCopy, qrCodeEnabled }: RoomLinkPanelProps): React.JSX.Element => {
	// On phones the visitor is usually already on the device the QR code would
	// open, so it is collapsed behind a toggle.
	const isMobile = useMediaQuery(landingTheme.breakpoints.down('sm'), { noSsr: true });
	const [ showQr, setShowQr ] = useState(false);
	const hasRoom = roomId.trim() !== '';
	const qrVisible = qrCodeEnabled && (!isMobile || showQr);
	const qrRef = useRef<QRCode>(null);
	const [ qrFeedback, setQrFeedback ] = useState<'copied' | 'saved' | null>(null);

	const showQrFeedback = (kind: 'copied' | 'saved') => {
		setQrFeedback(kind);
		setTimeout(() => setQrFeedback(null), 2000);
	};

	// Copies the QR code as a PNG image. Where the browser can't put images on
	// the clipboard (plain http, older browsers, permission denied) it saves
	// the PNG instead.
	const handleCopyQr = () => {
		const canvas = document.getElementById('room-qr-canvas') as HTMLCanvasElement | null;

		if (!canvas) return;

		const saveInstead = () => {
			qrRef.current?.download('png', `${roomId.trim()}-qr`);
			showQrFeedback('saved');
		};

		if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
			saveInstead();

			return;
		}

		// Safari only keeps the user gesture if the ClipboardItem is created
		// synchronously, so it gets a promise for the PNG rather than the PNG.
		const png = new Promise<Blob>((resolve, reject) => {
			canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('QR export failed'))), 'image/png');
		});

		navigator.clipboard.write([ new ClipboardItem({ 'image/png': png }) ])
			.then(() => showQrFeedback('copied'), saveInstead);
	};

	return (
		<Box sx={{
			mt: { xs: 2, sm: 2.5 },
			p: { xs: 1.75, sm: 2 },
			bgcolor: brand.surfaceSubtle,
			border: `1px solid ${brand.border}`,
			borderRadius: '12px',
			display: 'flex',
			flexDirection: { xs: 'column', sm: 'row' },
			alignItems: { xs: 'stretch', sm: 'center' },
			gap: 2,
		}}>
			<Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
				<Typography sx={{
					fontFamily: '\'Roboto Mono\', ui-monospace, monospace',
					fontSize: 13,
					lineHeight: '20px',
					color: 'text.secondary',
					wordBreak: 'break-all',
				}}>
					{roomUrl}
				</Typography>
				<Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
					<Button
						variant='outlined'
						color='primary'
						onClick={onCopy}
						disabled={!hasRoom || copyFeedback}
						startIcon={copyFeedback ? <CheckIcon /> : <ContentCopyIcon />}
						sx={{
							minHeight: { xs: 44, sm: 40 },
							borderRadius: '10px',
							borderColor: brand.blue,
							color: brand.blueDark,
							fontWeight: 600,
							textTransform: 'none',
							'&:hover': { bgcolor: brand.blueLight, borderColor: brand.blue },
							'&.Mui-focusVisible': focusRing(),
							// "Copied!" is a success state, not an unavailable one, so it
							// drops MUI's disabled grey.
							...(copyFeedback && {
								'&.Mui-disabled': {
									bgcolor: brand.orangeLight,
									borderColor: brand.orange,
									color: brand.navy,
								},
							}),
							...noMotion,
						}}
					>
						{copyFeedback ? copiedRoomLabel() : copyRoomLabel()}
					</Button>
					{qrCodeEnabled && isMobile && (
						<Button
							variant='text'
							onClick={() => setShowQr((shown) => !shown)}
							disabled={!hasRoom}
							aria-expanded={showQr}
							aria-controls='room-qr'
							startIcon={<QrCodeIcon />}
							sx={{
								minHeight: 44,
								borderRadius: '10px',
								color: brand.blueDark,
								fontWeight: 600,
								textTransform: 'none',
								'&:hover': { bgcolor: brand.blueLight },
								'&.Mui-focusVisible': focusRing(),
								...noMotion,
							}}
						>
							{showQr ? hideQrLabel() : showQrLabel()}
						</Button>
					)}
				</Box>
			</Box>
			{qrVisible && (
				<Box
					id='room-qr'
					sx={{
						visibility: hasRoom ? 'visible' : 'hidden',
						flexShrink: 0,
						alignSelf: { xs: 'center', sm: 'auto' },
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'stretch',
						gap: 0.5,
					}}
				>
					<Box sx={{
						lineHeight: 0,
						bgcolor: '#ffffff',
						border: `1px solid ${brand.border}`,
						borderRadius: '8px',
						overflow: 'hidden',
					}}>
						<QRCode ref={qrRef} id='room-qr-canvas' value={roomUrl} size={120} quietZone={8} fgColor={brand.navy} bgColor='#ffffff' />
					</Box>
					<Button
						variant='text'
						onClick={handleCopyQr}
						disabled={qrFeedback !== null}
						startIcon={qrFeedback ? <CheckIcon /> : <ContentCopyIcon />}
						sx={{
							minHeight: { xs: 44, sm: 36 },
							px: 1,
							borderRadius: '8px',
							color: brand.blueDark,
							fontSize: 13,
							fontWeight: 600,
							textTransform: 'none',
							whiteSpace: 'nowrap',
							'& .MuiButton-startIcon': { mr: 0.75 },
							'& .MuiButton-startIcon > svg': { fontSize: 18 },
							'&:hover': { bgcolor: brand.blueLight },
							'&.Mui-focusVisible': focusRing(),
							...(qrFeedback && {
								'&.Mui-disabled': { bgcolor: brand.orangeLight, color: brand.navy },
							}),
							...noMotion,
						}}
					>
						{qrFeedback === 'copied' ? copiedRoomLabel() : qrFeedback === 'saved' ? qrSavedLabel() : copyQrLabel()}
					</Button>
				</Box>
			)}
			<Box role='status' aria-live='polite' sx={visuallyHiddenSx}>
				{qrFeedback === 'copied' ? copiedRoomLabel() : qrFeedback === 'saved' ? qrSavedLabel() : ''}
			</Box>
		</Box>
	);
};

const LandingFooter = ({ imprintUrl }: { imprintUrl: string }): React.JSX.Element => {
	const infoTooltipEnabled = edumeetConfig.infoTooltipEnabled;
	const infoTooltipText = edumeetConfig.infoTooltipText ?? '';
	const infoTooltipLink = edumeetConfig.infoTooltipLink ?? '';
	const infoTooltipDesc = edumeetConfig.infoTooltipDesc ?? '';

	const showImprint = imprintUrl.trim() !== '';
	const showInfoText = infoTooltipEnabled && infoTooltipText !== '';
	const showInfoDesc = infoTooltipEnabled && infoTooltipDesc !== '';

	const linkSx = {
		color: brand.footerText,
		borderRadius: '2px',
		'&:hover, &:focus-visible': { color: '#ffffff' },
		'&:focus-visible': focusRing('#ffffff', 2, 2),
	};

	return (
		<Box component='footer' sx={{
			position: 'relative',
			zIndex: 1,
			flexShrink: 0,
			minHeight: { xs: 56, md: 72 },
			px: 2,
			py: 2,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 0.5,
			fontSize: 12,
			lineHeight: '18px',
			color: brand.footerText,
			textAlign: 'center',
		}}>
			{(showImprint || showInfoText) && (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
					{showImprint && (
						<Link href={imprintUrl} target='_blank' rel='noopener noreferrer' underline='hover' sx={linkSx}>
							{imprintLabel()}
						</Link>
					)}
					{showImprint && showInfoText && <span aria-hidden>·</span>}
					{showInfoText && (infoTooltipLink !== '' ? (
						<Link href={infoTooltipLink} target='_blank' rel='noopener noreferrer' underline='hover' sx={linkSx}>
							{infoTooltipText}
						</Link>
					) : (
						<span>{infoTooltipText}</span>
					))}
				</Box>
			)}
			{showInfoDesc && (
				<Box component='p' sx={{ m: 0, maxWidth: 640 }}>
					{infoTooltipDesc}
				</Box>
			)}
		</Box>
	);
};

const LandingPage = (): React.JSX.Element | null => {
	const navigate = useNavigate();
	const randomizeOnBlank = edumeetConfig.randomizeOnBlank;
	const [ roomId, setRoomId ] = useState(randomizeOnBlank ? randomString({ length: 8 }).toLowerCase() : '');
	const [ rooms, setRooms ] = useState<Room[]>([]);
	const [ activeEntryTab, setActiveEntryTab ] = useState(0);
	const [ copyFeedback, setCopyFeedback ] = useState(false);
	const [ joining, setJoining ] = useState(false);

	const privacyUrl = edumeetConfig.privacyUrl ?? '';
	const imprintUrl = edumeetConfig.imprintUrl ?? '';
	const qrCodeEnabled = edumeetConfig.qrCodeEnabled;
	const myRoomsTabEnabled = edumeetConfig.myRoomsTabEnabled;

	const dispatch = useAppDispatch();
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);

	const roomUrl = `${window.location.protocol}//${window.location.hostname}/${roomId}`;

	// The room page is a lazy chunk. Loading it before navigating keeps this
	// page, with the spinner on Join, up until the room page can render,
	// instead of a blank screen. It also stops double clicks.
	const onClicked = () => {
		if (joining || !roomId) return;

		setJoining(true);

		import('../../App')
			.catch(() => undefined)
			.finally(() => navigate(`/${roomId}`));
	};

	const handleRoomSelect = (event: React.ChangeEvent<{ value: unknown }>) => {
		const selectedValue = event.target.value as string;

		setRoomId(selectedValue);
	};

	const handleTabChange = (_event: React.ChangeEvent<unknown>, value: number) => {
		if (value === 1 && myRoomsTabEnabled && loggedIn && rooms.length > 0) {
			const isRoomInList = rooms.some((room) => (room.name ?? '') === roomId);

			if (!isRoomInList && roomId.trim() !== '') {
				setRoomId('');
			}
		}

		if (value === 0 && randomizeOnBlank && roomId === '') {
			setRoomId(randomString({ length: 8 }).toLowerCase());
		}

		setActiveEntryTab(value);
	};

	const handleCopyClick = () => {
		navigator.clipboard.writeText(roomUrl).then(() => {
			setCopyFeedback(true);
			setTimeout(() => setCopyFeedback(false), 2000);
		});
	};

	useEffect(() => {
		if (!myRoomsTabEnabled) return;

		if (loggedIn && !randomizeOnBlank && rooms.length > 0) {
			setActiveEntryTab(1);
		}

		if (!loggedIn || rooms.length === 0) {
			setActiveEntryTab(0);
		}
	}, [ loggedIn, rooms ]);

	useEffect(() => {
		dispatch(startListeners());

		return () => {
			dispatch(stopListeners());
		};
	}, [ dispatch ]);

	useEffect(() => {
		if (!myRoomsTabEnabled || !loggedIn) {
			setRooms([]);

			return;
		}

		const fetchRooms = () => {
			dispatch(getData('rooms', { ownedOnly: true })).then((roomsData: unknown) => {
				if (roomsData && typeof roomsData === 'object' && 'data' in roomsData) {
					setRooms(roomsData.data as Room[]);
				}
			});
		};

		fetchRooms();

		const handleVisibilityChange = () => {
			if (!document.hidden) {
				fetchRooms();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [ loggedIn ]);

	if (localeInProgress) {
		return null;
	}

	const showMyRooms = myRoomsTabEnabled && loggedIn && rooms.length > 0;

	return (
		<ThemeProvider theme={landingTheme}>
			<StyledBackground sx={{ position: 'relative', flexDirection: 'column', overflowX: 'hidden', overflowY: 'auto' }}>
				<DecorativeBlobs />
				<RecoverRecording />
				<LandingTopBar />
				<Container
					component='main'
					maxWidth='lg'
					sx={{ position: 'relative', zIndex: 1, flex: '1 0 auto', display: 'flex', alignItems: 'center', py: { xs: 2, md: 4 } }}
				>
					<Grid container spacing={{ xs: 3, sm: 5, [splitBreakpoint]: 6 }} sx={{ width: '100%', alignItems: 'center' }}>
						<Grid size={{ xs: 12, [splitBreakpoint]: 7 }}>
							<LandingHero />
						</Grid>
						<Grid size={{ xs: 12, [splitBreakpoint]: 5 }}>
							<Paper
								component='section'
								elevation={0}
								aria-labelledby='entry-card-title'
								sx={{
									maxWidth: 480,
									mx: 'auto',
									p: { xs: 2.5, sm: 4 },
									borderRadius: { xs: '12px', sm: '16px' },
									boxShadow: '0 24px 48px rgba(4,44,106,0.25)',
									display: 'flex',
									flexDirection: 'column',
								}}
							>
								<Typography
									component='h2'
									id='entry-card-title'
									sx={{
										m: 0,
										mb: showMyRooms ? 2 : 3.5,
										fontSize: { xs: 20, sm: 22 },
										lineHeight: { xs: '26px', sm: '28px' },
										fontWeight: 700,
										color: 'text.primary',
									}}
								>
									{landingCardTitleLabel()}
								</Typography>
								{showMyRooms && (
									<Tabs
										value={activeEntryTab}
										onChange={handleTabChange}
										variant='fullWidth'
										sx={{
											mb: 1.5,
											borderBottom: `1px solid ${brand.border}`,
											'& .MuiTabs-indicator': { height: 3 },
											'& .MuiTab-root': { textTransform: 'none', fontSize: 15, color: 'text.secondary' },
											'& .MuiTab-root.Mui-selected': { color: 'text.primary', fontWeight: 600 },
											'& .MuiTab-root:hover': { bgcolor: brand.blueLight },
											// Inset, because the tab scroller clips anything outside it.
											'& .MuiTab-root.Mui-focusVisible': focusRing(brand.blue, 3, -3),
										}}
									>
										<Tab label={enterRoomLabel()} aria-label={enterRoomLabel()} />
										<Tab label={myRoomsLabel()} aria-label={myRoomsLabel()} />
									</Tabs>
								)}
								{activeEntryTab === 0 && (
									<Box sx={{ pt: showMyRooms ? 2 : 0, ...outlinedFieldSx }}>
										<TextInputField
											label={roomNameLabel()}
											value={roomId}
											setValue={setRoomId}
											onEnter={onClicked}
											randomizeOnBlank={randomizeOnBlank}
											autoFocus
											endAdornment={randomizeOnBlank ? (
												<IconButton
													aria-label={newRandomRoomLabel()}
													onClick={() => setRoomId(randomString({ length: 8 }).toLowerCase())}
													edge='end'
													sx={{ color: brand.blueDark, '&.Mui-focusVisible': focusRing(brand.blue, 3, 0) }}
												>
													<AutorenewIcon />
												</IconButton>
											) : undefined}
										/>
										<Typography sx={{ mt: 1, marginInlineStart: 0.25, fontSize: 14, lineHeight: '20px', color: 'text.secondary' }}>
											{roomNameHelperLabel()}
										</Typography>
									</Box>
								)}
								{activeEntryTab === 1 && showMyRooms && (
									<FormControl fullWidth margin='normal' sx={{ mb: 0, ...outlinedFieldSx }}>
										<InputLabel id='room-select-label'>{roomNameLabel()}</InputLabel>
										<Select
											labelId='room-select-label'
											id='room-select'
											value={roomId}
											label={roomNameLabel()}
											onChange={(event) => { handleRoomSelect(event as React.ChangeEvent<{ value: unknown }>); }}
											autoFocus
											style={{ textAlign: 'left' }}
											MenuProps={{
												slotProps: {
													paper: {
														sx: {
															'& .MuiMenuItem-root.Mui-selected, & .MuiMenuItem-root.Mui-selected:hover': {
																bgcolor: brand.blueLight,
																color: brand.navy,
															},
														},
													},
												},
											}}
										>
											{rooms.map((room) => (
												<MenuItem key={room.id} value={room.name ?? ''}>{room.name ?? ''}</MenuItem>
											))}
										</Select>
									</FormControl>
								)}
								<RoomLinkPanel
									roomUrl={roomUrl}
									roomId={roomId}
									copyFeedback={copyFeedback}
									onCopy={handleCopyClick}
									qrCodeEnabled={qrCodeEnabled}
								/>
								<Box role='status' aria-live='polite' sx={visuallyHiddenSx}>
									{copyFeedback ? copiedRoomLabel() : ''}
								</Box>
								{/* MUI turns off pointer events on a disabled button, so the
									not-allowed cursor lives on this wrapper. */}
								<Box sx={{ mt: { xs: 2.5, sm: 3 }, cursor: joining ? 'progress' : roomId ? undefined : 'not-allowed' }}>
									<Button
										onClick={onClicked}
										variant='contained'
										color='secondary'
										disabled={!roomId}
										loading={joining}
										loadingPosition='end'
										fullWidth
										disableElevation
										endIcon={<ArrowForwardIcon />}
										sx={{
											height: 52,
											borderRadius: '12px',
											fontSize: 16,
											fontWeight: 700,
											letterSpacing: '0.2px',
											textTransform: 'none',
											'&:hover': { bgcolor: brand.orangeDark },
											'&:active': {
												bgcolor: brand.orangeDark,
												boxShadow: 'inset 0 2px 0 rgba(4,44,106,0.18)',
												transform: 'translateY(1px)',
											},
											'&.Mui-focusVisible': focusRing(),
											'&.Mui-disabled': {
												bgcolor: brand.orangeDisabled,
												color: 'rgba(4,44,106,0.5)',
											},
											// Loading also sets Mui-disabled; keep the button orange and
											// readable so it looks busy, not unavailable.
											'&.MuiButton-loading': {
												bgcolor: brand.orange,
												color: brand.navy,
											},
											'& .MuiButton-loadingIndicator': { color: brand.navy },
											...noMotion,
										}}
									>
										{joinLabel()}
									</Button>
								</Box>
								{privacyUrl.trim() !== '' && (
									<Typography sx={{ mt: 1.75, textAlign: 'center', fontSize: 12, lineHeight: '18px', color: 'text.secondary' }}>
										{joinConsentLabel()}{' '}
										<Link
											href={privacyUrl}
											target='_blank'
											rel='noopener noreferrer'
											underline='always'
											sx={{ color: brand.blueDark, fontWeight: 500, borderRadius: '2px', '&:focus-visible': focusRing(brand.blue, 2, 2) }}
										>
											{privacyPolicyLabel()}
										</Link>
									</Typography>
								)}
							</Paper>
						</Grid>
					</Grid>
				</Container>
				<LandingFooter imprintUrl={imprintUrl} />
			</StyledBackground>
		</ThemeProvider>
	);
};

export default LandingPage;
