// eduKotha homepage. The whole page lives in this one file (plan/HomePage.md §17.1).
// Block order: imports, tokens and theme, strings, content, helpers, page.
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	ClickAwayListener,
	Container,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Drawer,
	IconButton,
	Link,
	Menu,
	MenuItem,
	Slide,
	Snackbar,
	Tab,
	Tabs,
	TextField,
	Typography,
	useMediaQuery,
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import { ThemeProvider, createTheme, keyframes } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded';
import AccountBalanceRounded from '@mui/icons-material/AccountBalanceRounded';
import AppsRounded from '@mui/icons-material/AppsRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import BusinessCenterRounded from '@mui/icons-material/BusinessCenterRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import CallEndRounded from '@mui/icons-material/CallEndRounded';
import CallSplitRounded from '@mui/icons-material/CallSplitRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import CloudDoneRounded from '@mui/icons-material/CloudDoneRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import CropSquareRounded from '@mui/icons-material/CropSquareRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import DrawRounded from '@mui/icons-material/DrawRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import FiberManualRecordRounded from '@mui/icons-material/FiberManualRecordRounded';
import ForumRounded from '@mui/icons-material/ForumRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import HelpCenterRounded from '@mui/icons-material/HelpCenterRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import InstallDesktopRounded from '@mui/icons-material/InstallDesktopRounded';
import LinkRounded from '@mui/icons-material/LinkRounded';
import LiveTvRounded from '@mui/icons-material/LiveTvRounded';
import LocalHospitalRounded from '@mui/icons-material/LocalHospitalRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import LoginRounded from '@mui/icons-material/LoginRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import MeetingRoomRounded from '@mui/icons-material/MeetingRoomRounded';
import MenuBookRounded from '@mui/icons-material/MenuBookRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import MicRounded from '@mui/icons-material/MicRounded';
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded';
import NewspaperRounded from '@mui/icons-material/NewspaperRounded';
import NorthEastRounded from '@mui/icons-material/NorthEastRounded';
import OndemandVideoRounded from '@mui/icons-material/OndemandVideoRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import PlayCircleOutlineRounded from '@mui/icons-material/PlayCircleOutlineRounded';
import PanToolRounded from '@mui/icons-material/PanToolRounded';
import PauseRounded from '@mui/icons-material/PauseRounded';
import PodcastsRounded from '@mui/icons-material/PodcastsRounded';
import ScreenShareRounded from '@mui/icons-material/ScreenShareRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import SubtitlesRounded from '@mui/icons-material/SubtitlesRounded';
import SupportAgentRounded from '@mui/icons-material/SupportAgentRounded';
import TitleRounded from '@mui/icons-material/TitleRounded';
import TranslateRounded from '@mui/icons-material/TranslateRounded';
import VideoCallRounded from '@mui/icons-material/VideoCallRounded';
import VideocamRounded from '@mui/icons-material/VideocamRounded';
import VolunteerActivismRounded from '@mui/icons-material/VolunteerActivismRounded';
import RecoverRecording from '../components/recoverrecordingdialog/RecoverRecording';
import edumeetConfig from '../utils/edumeetConfig';
import { startListeners, stopListeners } from '../store/actions/startActions';
import { checkJWT, login, logout } from '../store/actions/permissionsActions';
import { getData } from '../store/actions/managementActions';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { Room } from '../utils/types';

const MeetingsDialog = lazy(() => import('../components/meetingsdialog/MeetingsDialog'));

// ── Tokens and theme (§13) ──

// Same values as `brand` in LandingPage.tsx and Join.tsx, copied, not imported.
const brand = {
	navy: '#042c6a',
	navy700: '#0b3f8f',
	navy900: '#021c46',
	blue: '#1a81ec',
	blueDark: '#1668c4',
	blueLight: '#e8f2fd',
	blueOnNavy: '#8cc2f7',
	orange: '#fe9b2a',
	orangeDark: '#e8851a',
	orangeLight: '#fff3e5',
	orangeDisabled: '#fde2c0',
	white: '#ffffff',
	textSecondary: '#5b6b82',
	textOnDarkMuted: 'rgba(255, 255, 255, 0.85)',
	error: '#b3261e',
	surfaceSubtle: '#f4f8fd',
	border: '#d6e2f2',
	borderStrong: '#7d8fa9',
	ctaGradient: 'linear-gradient(120deg, #042c6a 0%, #1668c4 100%)',
} as const;

const radius = { sm: '8px', md: '12px', lg: '20px', pill: '999px' } as const;

const shadow = {
	1: '0 1px 2px rgba(4, 44, 106, 0.06), 0 1px 3px rgba(4, 44, 106, 0.10)',
	2: '0 8px 24px rgba(4, 44, 106, 0.12)',
	3: '0 24px 48px rgba(2, 28, 70, 0.35)',
} as const;

const layout = {
	container: 1200,
	navH: { xs: 56, md: 64 },
	utilityH: 36,
	// Theme spacing units of 8 px: 48 / 64 / 96 px and 16 / 24 / 32 px.
	sectionY: { xs: 6, md: 8, lg: 12 },
	gutter: { xs: 2, sm: 3, lg: 4 },
} as const;

const motion = { ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fast: 150, base: 200, slow: 400, drawer: 240 } as const;

const zIndex = { nav: 100, menu: 110 } as const;

// 3 px ring, 2 px offset (§11): blue on light surfaces, light blue on navy.
const focusRing = (onDark = false): SxProps<Theme> => ({
	'&:focus-visible, &.Mui-focusVisible': {
		outline: `3px solid ${onDark ? brand.blueOnNavy : brand.blue}`,
		outlineOffset: '2px',
	},
});

const menuIn = keyframes`
	from { opacity: 0; transform: translateY(-8px); }
	to { opacity: 1; transform: translateY(0); }
`;

const reducedMotion = '@media (prefers-reduced-motion: reduce)';

// The brighter product palette of the feature tour (§7.3).
const tour = {
	blue: '#0B5CFF',
	blueHover: '#0040D0',
	blueOnDark: '#8DB0FF',
	ink: '#0B1530',
	body: '#4A5468',
	muted: '#5B6478',
	line: '#E3E7EF',
	soft: '#F4F7FD',
	white: '#FFFFFF',
	slideBar: '#DCE5F7',
	canvasDot: '#D3DAE8',
	window: '#0E1424',
	panel: '#151C30',
	control: '#1C2438',
	windowDot: '#3A4358',
	windowText: '#C9D2E6',
	windowLine: 'rgba(255, 255, 255, 0.06)',
	green: '#2EE59D',
	red: '#E5343A',
	amber: '#FFB547',
	purple: '#7C5CFF',
	pink: '#E8508F',
	stage: [
		'radial-gradient(120% 90% at 100% 0%, #5C8DFF 0%, transparent 55%)',
		'radial-gradient(90% 80% at 0% 100%, #00C2FF55 0%, transparent 60%)',
		'linear-gradient(150deg, #0B5CFF 0%, #0033B8 60%, #00105C 100%)',
	].join(', '),
	windowShadow: '0 30px 80px -20px rgba(0, 8, 60, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)',
	cardShadow: '0 18px 40px -12px rgba(0, 10, 60, 0.45)',
} as const;

const phoneWidth = '@media (max-width: 639.95px)';

// Built on the app's config theme, so custom keys used by shared dialogs
// (RecoverRecording) are kept. It wraps only <HomePage />. Breakpoints go in the
// first argument: createTheme builds up()/down() from it before merging the rest.
const homeTheme = createTheme({
	...edumeetConfig.theme,
	breakpoints: { values: { xs: 0, sm: 600, md: 768, lg: 1024, xl: 1280 } },
}, {
	palette: {
		primary: { main: brand.blueDark, dark: brand.navy700, light: brand.blueLight, contrastText: brand.white },
		secondary: { main: brand.orange, dark: brand.orangeDark, light: brand.orangeLight, contrastText: brand.navy },
		text: { primary: brand.navy, secondary: brand.textSecondary },
		error: { main: brand.error },
	},
	shape: { borderRadius: 12 },
	roundedness: 12,
	typography: {
		fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
		h1: { fontSize: 'clamp(2.25rem, 1.5rem + 3vw, 3.5rem)', fontWeight: 700, lineHeight: 1.1 },
		h2: { fontSize: 'clamp(1.75rem, 1.35rem + 1.6vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2 },
		h3: { fontSize: 'clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem)', fontWeight: 500, lineHeight: 1.3 },
		body1: { fontSize: '1rem', lineHeight: 1.6 },
		button: { textTransform: 'none', fontWeight: 500, fontSize: '1rem' },
	},
	components: {
		// Field outlines use border-strong (3.3:1); MUI's default is 1.7:1 (WCAG 1.4.11).
		MuiOutlinedInput: {
			styleOverrides: {
				notchedOutline: { borderColor: brand.borderStrong },
				root: { '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: brand.navy } },
			},
		},
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: radius.md,
					minHeight: 44,
					transition: `background-color ${motion.fast}ms ${motion.ease}, transform ${motion.fast}ms ${motion.ease}`,
					'&:active': { transform: 'translateY(1px)' },
				},
				sizeLarge: { minHeight: 52, paddingInline: 24 },
			},
		},
	},
});

// ── Strings (§14) ──

const strings = {
	meta: {
		title: 'EduKotha',
		description: 'eduKotha: online classes and meetings for universities and research institutes in Bangladesh, run by BdREN.',
	},
	account: {
		label: 'Your account',
		group: 'Your account',
		myMeetings: 'My meetings',
		myMeetingsDesc: 'Scheduled classes and meetings',
		myRooms: 'My rooms',
		myRoomsDesc: 'Rooms you own',
		signInHelper: 'Use your institution account',
	},
	common: {
		join: 'Join a meeting',
		start: 'Start a meeting',
		signIn: 'Sign in',
		signOut: 'Sign out',
		startShort: 'Start',
		joinShort: 'Join',
		skip: 'Skip to main content',
		home: 'eduKotha home',
		logoAlt: 'eduKotha',
		opensInSameTab: '(BdREN website)',
	},
	utility: {
		service: 'A service of Bangladesh Research and Education Network (BdREN)',
		support: 'Support',
		status: 'System status',
		contact: 'Contact',
	},
	nav: {
		label: 'Main',
		products: 'Products',
		resources: 'Resources',
		institutions: 'For institutions',
		institutionsShort: 'Institutions',
		pricing: 'Pricing',
		meet: 'Meet',
		openMenu: 'Open menu',
		closeMenu: 'Close menu',
		drawerLabel: 'Menu',
		meetGroup: 'Meet',
		productsSideBadge: 'New',
		productsSideTitle: 'Transcription',
		productsSideText: 'Turn every class into searchable text.',
		productsSideLink: 'See how it works',
	},
	meetMenu: {
		join: 'Join a meeting',
		joinDesc: 'Enter a room name or paste a link',
		host: 'Host a meeting',
		hostDesc: 'Get a new room and share its link',
		schedule: 'Schedule a meeting',
		scheduleDesc: 'Plan a class and invite people',
		download: 'Download app',
		downloadDesc: 'Install eduKotha on this device',
	},
	install: {
		title: 'Install eduKotha',
		intro: 'eduKotha works as an app on your device. Your browser decides how to install it:',
		chrome: 'Chrome or Edge on a computer: open the browser menu and choose Install eduKotha.',
		android: 'Android: open the browser menu and choose Add to Home screen.',
		ios: 'iPhone or iPad (Safari): tap Share, then Add to Home Screen.',
		close: 'Close',
	},
	quickJoin: {
		viewsLabel: 'Join or host',
		entryLabel: 'How to choose a room',
		enterRoom: 'Enter room name',
		myRooms: 'My rooms',
		pickRoom: 'Your room',
		tabJoin: 'Join',
		tabHost: 'Host',
		close: 'Close',
		join: 'Join',
		startNew: 'Start new class',
		linkLabel: 'Meeting link',
		linkCopied: 'Link copied',
		copyFailed: 'Couldn\'t copy the link. Select it and copy it by hand.',
		showQr: 'Show QR code',
		hideQr: 'Hide QR code',
		copyQr: 'Copy QR code',
		qrCopied: 'QR code copied',
		qrSaved: 'QR code saved as an image',
		consent: 'By joining you agree to the',
		privacy: 'Privacy Policy',
		errChars: 'Use only letters, numbers and hyphens.',
		errLong: 'Use at most 64 characters.',
		joinTitle: 'Join a meeting',
		hostTitle: 'Host a meeting',
		hostStart: 'Start meeting',
		roomName: 'Room name',
		helper: 'Share this name so others can join.',
		copy: 'Copy link',
		copied: 'Copied!',
		errSpace: 'Room names can\'t have spaces. Try team-meeting.',
		errShort: 'Use at least 3 characters.',
		fromLink: 'We took the room name from your link.',
	},
	hero: {
		eyebrow: 'By BdREN, Bangladesh\'s national research and education network',
		title: 'Video meetings for everyone in Bangladesh',
		subtitle: 'Meetings, webinars and classes in your browser. No time limits, no install, and your data stays in Bangladesh.',
		tour: 'Watch a 1-minute tour',
		joinLabel: 'Meeting name or link',
		join: 'Join',
		joinHelper: 'Paste a link or type the meeting name you were given.',
		joining: 'Opening the meeting. You\'ll check your camera and mic next.',
		fromLink: 'We took the meeting name from your link.',
		joinPhone: 'Join with a link or name',
		joinPhoneHelper: 'Join opens a sheet where you can paste your meeting link.',
		scenesLabel: 'Example meetings',
		pauseScenes: 'Pause example meetings',
		playScenes: 'Play example meetings',
		captionsChip: 'Live captions on',
	},
	trustedBy: {
		eyebrow: 'Trusted across Bangladesh',
		titleStart: 'Built for ',
		titleHighlight: 'every organization',
		titleEnd: ' in Bangladesh',
		subtitle: 'One secure platform for meetings, webinars and classes, on BdREN\'s national network.',
		listLabel: 'Organizations using eduKotha',
		sectorListLabel: 'organizations using eduKotha',
		filterLabel: 'Filter by sector',
		all: 'All',
		pause: 'Pause scrolling logos',
		play: 'Play scrolling logos',
		showAll: 'Show all organizations',
		showFewer: 'Show fewer',
		consent: 'Showing organizations that agreed to appear.',
		tellUs: 'Using eduKotha at your organization? Tell us →',
		forLabel: 'For',
		forListLabel: 'Who eduKotha is for',
	},
	howItWorks: {
		eyebrow: 'How it works',
		titleStart: 'Your first meeting in ',
		titleHighlight: 'three steps',
		step: 'Step',
		// Per D9: confirm who needs an account before launch.
		accountNote: 'Anyone can join with a link, no account needed. Sign in to schedule meetings and keep your rooms.',
	},
	features: {
		eyebrow: 'One platform',
		titleStart: 'Everything a class needs, ',
		titleHighlight: 'in one link',
		intro: 'Teach, meet and collaborate from any browser. Students join in a click, with nothing to install.',
		learnMore: 'Learn more',
		learnMoreAbout: 'about',
		label: 'eduKotha features',
		start: 'Start for free',
		demo: 'Book a demo',
	},
	spotlight: {
		badge: 'New',
		title: 'Never miss a word of the lecture',
		body: 'Record classes, stream them live and get a transcript in the room\'s language. Students can search, review and catch up.',
		bodyNoTranscript: 'Record classes and stream them live, so students can review and catch up.',
		cta: 'See how it works',
		mockLabel: 'The live transcript panel in an eduKotha room, next to the teacher\'s video',
		mockLabelNoTranscript: 'A recording in progress in an eduKotha room, next to the list of past recordings',
	},
	useCases: {
		eyebrow: 'Made for education',
		title: 'Built for how your campus works',
		label: 'Who it is for',
	},
	news: {
		eyebrow: 'What\'s new',
		title: 'Making news, making impact',
		viewAll: 'View all news',
	},
	ctaBand: {
		title: 'Ready for your next class?',
		body: 'Start a room in seconds. Share one link with your students.',
		help: 'Need help getting your institution on board?',
		helpLink: 'Contact BdREN',
	},
} as const;

// ── Content (§6–§8) ──
// Links without an `href` have no page yet and are not rendered (no href="#").
// Items with a homepage section link to its anchor until their own page exists (Q5).
// Entries marked `// placeholder` wait for BdREN approval (§18).

type NavLink = { label: string; href?: string; desc?: string; icon?: SvgIconComponent };
type MenuColumn = { title: string; items: NavLink[] };

const BDREN_URL = 'https://www.bdren.net.bd';
const TOUR_URL = '';
const PRICING_URL = '';
const SUPPORT_URL = '';
const STATUS_URL = '';
const CONTACT_URL = '';
const INSTITUTIONS_URL = '#use-cases';
const SPOTLIGHT_URL = '';
const NEWS_URL = '';

const UTILITY_LINKS: NavLink[] = [
	{ label: strings.utility.support, href: SUPPORT_URL },
	{ label: strings.utility.status, href: STATUS_URL },
	{ label: strings.utility.contact, href: CONTACT_URL },
];

const PRODUCTS_MENU: MenuColumn[] = [
	{
		title: 'Teach and meet',
		items: [
			{ label: 'Online classes', desc: 'Live classes with slides, whiteboard and chat', href: '#products', icon: SchoolRounded },
			{ label: 'Meetings', desc: 'Secure rooms with a lobby and room lock', href: '#products', icon: GroupsRounded },
			{ label: 'Webinars and live streaming', desc: 'Reach a larger audience live', href: '#products', icon: PodcastsRounded },
			{ label: 'Breakout rooms', desc: 'Split a class into groups', href: '#products', icon: CallSplitRounded },
		],
	},
	{
		title: 'Capture and share',
		items: [
			{ label: 'Recording', desc: 'Server-side recording of every class', href: '#recording', icon: FiberManualRecordRounded },
			{ label: 'Live transcription', desc: 'Text in the room\'s language', href: '#recording', icon: SubtitlesRounded },
			{ label: 'Whiteboard', desc: 'Draw and explain together', href: '#products', icon: DrawRounded },
			{ label: 'Chat and file sharing', desc: 'Messages and files in the room', href: '#products', icon: ForumRounded },
		],
	},
];

const PRODUCTS_SIDE_HREF = '#recording';

const RESOURCES_MENU: MenuColumn[] = [
	{
		title: 'Learn',
		items: [
			{ label: 'Getting started guide', desc: 'Your first class in five minutes', icon: MenuBookRounded },
			{ label: 'Teaching with eduKotha', desc: 'Video tutorials', icon: OndemandVideoRounded },
			{ label: 'News and updates', desc: 'What is new in eduKotha', href: '#news', icon: NewspaperRounded },
			{ label: 'Install as an app', desc: 'Add eduKotha to your device', icon: InstallDesktopRounded },
		],
	},
	{
		title: 'Help',
		items: [
			{ label: 'Help centre', desc: 'Answers to common questions', icon: HelpCenterRounded },
			{ label: 'Test your camera and microphone', desc: 'Check your setup before class', icon: VideocamRounded },
			{ label: 'System status', desc: 'Is everything working?', href: STATUS_URL, icon: MonitorHeartRounded },
			{ label: 'Contact support', desc: 'Talk to the BdREN team', href: SUPPORT_URL, icon: SupportAgentRounded },
		],
	},
];

// Official logos from each university's Wikipedia infobox (public, then private,
// then international, in the order of Wikipedia's "List of universities in
// Bangladesh"), loaded from Wikimedia so no image files are added (§17.1).
// Needs BdREN's go-ahead before launch: showing a logo says that university uses eduKotha (Q2).
const UNIVERSITY_LOGOS: { name: string; src: string }[] = [
	{ name: 'University of Dhaka', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/c6/Dhaka_University_logo_outline.svg/120px-Dhaka_University_logo_outline.svg.png' },
	{ name: 'University of Rajshahi', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/%E0%A6%B0%E0%A6%BE%E0%A6%9C%E0%A6%B6%E0%A6%BE%E0%A6%B9%E0%A7%80_%E0%A6%AC%E0%A6%BF%E0%A6%B6%E0%A7%8D%E0%A6%AC%E0%A6%AC%E0%A6%BF%E0%A6%A6%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2%E0%A6%AF%E0%A6%BC%E0%A7%87%E0%A6%B0_%E0%A6%B2%E0%A7%8B%E0%A6%97%E0%A7%8B.svg/120px-%E0%A6%B0%E0%A6%BE%E0%A6%9C%E0%A6%B6%E0%A6%BE%E0%A6%B9%E0%A7%80_%E0%A6%AC%E0%A6%BF%E0%A6%B6%E0%A7%8D%E0%A6%AC%E0%A6%AC%E0%A6%BF%E0%A6%A6%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2%E0%A6%AF%E0%A6%BC%E0%A7%87%E0%A6%B0_%E0%A6%B2%E0%A7%8B%E0%A6%97%E0%A7%8B.svg.png' },
	{ name: 'University of Chittagong', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/86/University_of_Chittagong_logo.svg/120px-University_of_Chittagong_logo.svg.png' },
	{ name: 'Jahangirnagar University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a9/Jahangirnagar_University_Logo.svg/120px-Jahangirnagar_University_Logo.svg.png' },
	{ name: 'Islamic University, Bangladesh', src: 'https://upload.wikimedia.org/wikipedia/en/0/06/Flat_Logo_of_Islamic_University%2C_Bangladesh.jpg' },
	{ name: 'Khulna University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/13/Khulna_University_Logo.svg/120px-Khulna_University_Logo.svg.png' },
	{ name: 'Jagannath University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/47/Logo_of_Jagannath_University.svg/120px-Logo_of_Jagannath_University.svg.png' },
	{ name: 'Comilla University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/65/Logo_of_Comilla_University.png/120px-Logo_of_Comilla_University.png' },
	{ name: 'Jatiya Kabi Kazi Nazrul Islam University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/7d/Jatiya_Kabi_Kazi_Nazrul_Islam_University_Logo.png/120px-Jatiya_Kabi_Kazi_Nazrul_Islam_University_Logo.png' },
	{ name: 'Bangladesh University of Professionals', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/BUP_Stuff_Badge%2C_Bangladesh_Army.svg/120px-BUP_Stuff_Badge%2C_Bangladesh_Army.svg.png' },
	{ name: 'Begum Rokeya University, Rangpur', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/BRUR_Logo.svg/120px-BRUR_Logo.svg.png' },
	{ name: 'University of Barishal', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/3e/Barishal_University_logo.svg/120px-Barishal_University_logo.svg.png' },
	{ name: 'Rabindra University, Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Rabindra_University_Logo.svg/120px-Rabindra_University_Logo.svg.png' },
	{ name: 'Netrokona University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/e0/Netrokona_University_logo.png/120px-Netrokona_University_logo.png' },
	{ name: 'Thakurgaon University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/University_of_Thakurgaon.jpg/120px-University_of_Thakurgaon.jpg' },
	{ name: 'Naogaon University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Naogaon_University_logo.png/120px-Naogaon_University_logo.png' },
	{ name: 'Shahjalal University of Science and Technology', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d9/Shahjalal_University_of_Science_and_Technology_logo.png/120px-Shahjalal_University_of_Science_and_Technology_logo.png' },
	{ name: 'Hajee Mohammad Danesh Science & Technology University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/0c/HSTU_Logo.png/120px-HSTU_Logo.png' },
	{ name: 'Patuakhali Science and Technology University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/5/52/Patuakhali_Science_and_Technology_University_logo.png/120px-Patuakhali_Science_and_Technology_University_logo.png' },
	{ name: 'Noakhali Science and Technology University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/70/Logo_of_Noakhali_Science_and_Technology_University.gif/120px-Logo_of_Noakhali_Science_and_Technology_University.gif' },
	{ name: 'Jashore University of Science and Technology', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/Jashore_University_of_Science_and_Technology_Monogram.png/500px-Jashore_University_of_Science_and_Technology_Monogram.png' },
	{ name: 'Pabna University of Science and Technology', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/16/PUST_Logo.png/120px-PUST_Logo.png' },
	{ name: 'Gopalganj Science and Technology University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/67/GSTU_Logo.png/120px-GSTU_Logo.png' },
	{ name: 'Rangamati Science and Technology University', src: 'https://upload.wikimedia.org/wikipedia/en/e/ea/RMSTU_Logo.png' },
	{ name: 'Jamalpur Science and Technology University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/23/Jamalpur_Science_and_Technology_University_Logo.png/120px-Jamalpur_Science_and_Technology_University_Logo.png' },
	{ name: 'Sunamganj Science and Technology University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/SSTU_Logo.png/120px-SSTU_Logo.png' },
	{ name: 'Bangladesh University of Engineering and Technology', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/14/Bangladesh_University_of_Engineering_and_Technology_Wordmark_Logo.svg/500px-Bangladesh_University_of_Engineering_and_Technology_Wordmark_Logo.svg.png' },
	{ name: 'Military Institute of Science and Technology', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/0d/Military_Institute_of_Science_and_Technology_Logo.svg/500px-Military_Institute_of_Science_and_Technology_Logo.svg.png' },
	{ name: 'Chittagong University of Engineering & Technology', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/0e/CUET_Vector_Logo.svg/120px-CUET_Vector_Logo.svg.png' },
	{ name: 'Dhaka University of Engineering & Technology, Gazipur', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/CrestofDUET.png/120px-CrestofDUET.png' },
	{ name: 'Bangladesh Agricultural University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a2/Bangladesh_Agriculture_University_logo.svg/250px-Bangladesh_Agriculture_University_logo.svg.png' },
	{ name: 'Gazipur Agricultural University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/8b/Gazipur_Agricultural_University_Logo.png/120px-Gazipur_Agricultural_University_Logo.png' },
	{ name: 'Sher-e-Bangla Agricultural University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d5/Sher-e-Bangla_Agricultural_University_Logo.png/120px-Sher-e-Bangla_Agricultural_University_Logo.png' },
	{ name: 'Sylhet Agricultural University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/3d/StAU_logo_main.jpeg/120px-StAU_logo_main.jpeg' },
	{ name: 'Khulna Agricultural University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/db/Khulna_Agricultural_University_logo.svg/120px-Khulna_Agricultural_University_logo.svg.png' },
	{ name: 'Habiganj Agricultural University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Habiganj_Agricultural_University_logo.png/120px-Habiganj_Agricultural_University_logo.png' },
	{ name: 'Rajshahi Medical University', src: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Rajshahi_Medical_University_logo.png' },
	{ name: 'Sylhet Medical University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/20/Logo_of_Sylhet_Medical_University.png/120px-Logo_of_Sylhet_Medical_University.png' },
	{ name: 'Khulna Medical University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d0/Khulna_Medical_University_logo.png/120px-Khulna_Medical_University_logo.png' },
	{ name: 'Chittagong Veterinary and Animal Sciences University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a3/Chittagong_Veterinary_and_Animal_Sciences_University_logo.jpg/120px-Chittagong_Veterinary_and_Animal_Sciences_University_logo.jpg' },
	{ name: 'Bangladesh University of Textiles', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f8/Bangladesh_University_of_Textiles_logo.svg/120px-Bangladesh_University_of_Textiles_logo.svg.png' },
	{ name: 'Bangladesh Maritime University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/e9/Logo_of_Bangladesh_Maritime_University.png/120px-Logo_of_Bangladesh_Maritime_University.png' },
	{ name: 'Aviation and Aerospace University, Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/3/39/Logo_of_Aviation_and_Aerospace_University%2C_Bangladesh.png/120px-Logo_of_Aviation_and_Aerospace_University%2C_Bangladesh.png' },
	{ name: 'National University, Bangladesh', src: 'https://upload.wikimedia.org/wikipedia/en/2/20/Bangladesh_National_University_Banner.gif' },
	{ name: 'Bangladesh Open University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/21/Seal_of_the_Bangladesh_Open_University_%28BOU%29.svg/250px-Seal_of_the_Bangladesh_Open_University_%28BOU%29.svg.png' },
	{ name: 'Dhaka Central University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/b/b3/Dhaka_Central_University_banner.svg/500px-Dhaka_Central_University_banner.svg.png' },
	{ name: 'International University of Business Agriculture and Technology', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/IUBAT2.png/120px-IUBAT2.png' },
	{ name: 'North South University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/9d/North_South_University_Logo.svg/500px-North_South_University_Logo.svg.png' },
	{ name: 'Independent University, Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/%E0%A6%87%E0%A6%A8%E0%A7%8D%E0%A6%A1%E0%A6%BF%E0%A6%AA%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%A1%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%9F_%E0%A6%AC%E0%A6%BF%E0%A6%B6%E0%A7%8D%E0%A6%AC%E0%A6%AC%E0%A6%BF%E0%A6%A6%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2%E0%A6%AF%E0%A6%BC%2C_%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE%E0%A6%A6%E0%A7%87%E0%A6%B6_%E0%A6%B2%E0%A7%8B%E0%A6%97%E0%A7%8B.svg/250px-%E0%A6%87%E0%A6%A8%E0%A7%8D%E0%A6%A1%E0%A6%BF%E0%A6%AA%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%A1%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%9F_%E0%A6%AC%E0%A6%BF%E0%A6%B6%E0%A7%8D%E0%A6%AC%E0%A6%AC%E0%A6%BF%E0%A6%A6%E0%A7%8D%E0%A6%AF%E0%A6%BE%E0%A6%B2%E0%A6%AF%E0%A6%BC%2C_%E0%A6%AC%E0%A6%BE%E0%A6%82%E0%A6%B2%E0%A6%BE%E0%A6%A6%E0%A7%87%E0%A6%B6_%E0%A6%B2%E0%A7%8B%E0%A6%97%E0%A7%8B.svg.png' },
	{ name: 'American International University-Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/8/8c/American_International_University-Bangladesh_Monogram.svg/120px-American_International_University-Bangladesh_Monogram.svg.png' },
	{ name: 'Dhaka International University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Emblem_of_DIU.png/120px-Emblem_of_DIU.png' },
	{ name: 'Asian University of Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/fc/Asian_University_of_Bangladesh_Logo.jpg/120px-Asian_University_of_Bangladesh_Logo.jpg' },
	{ name: 'East West University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/16/East-west-university-LogoSVG.svg/250px-East-west-university-LogoSVG.svg.png' },
	{ name: 'People\'s University of Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/9/94/People%27s_University_of_Bangladesh_logo.jpg/120px-People%27s_University_of_Bangladesh_logo.jpg' },
	{ name: 'Queens University (Bangladesh)', src: 'https://upload.wikimedia.org/wikipedia/en/4/41/Queens_University_%28Bangladesh%29_%28logo%29.jpg' },
	{ name: 'University of Asia Pacific', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/d/d7/University_of_Asia_Pacific_%28Bangladesh%29_logo.png/250px-University_of_Asia_Pacific_%28Bangladesh%29_logo.png' },
	{ name: 'Bangladesh University', src: 'https://upload.wikimedia.org/wikipedia/en/7/72/BU_logo_banner.png' },
	{ name: 'BRAC University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/40/BRAC_University_monogram.svg/120px-BRAC_University_monogram.svg.png' },
	{ name: 'Premier University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/7/78/Logo_of_Premier_University_%28PU%29.png/250px-Logo_of_Premier_University_%28PU%29.png' },
	{ name: 'Sylhet International University', src: 'https://upload.wikimedia.org/wikipedia/en/2/2f/SIU_Logo_Emrul.jpeg' },
	{ name: 'University of Development Alternative', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f0/UODA.png/120px-UODA.png' },
	{ name: 'City University (Bangladesh)', src: 'https://upload.wikimedia.org/wikipedia/en/f/ff/City_University_%28Bangladesh%29_logo.png' },
	{ name: 'Daffodil International University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/1f/Daffodil_International_University_%28logo%29.jpg/500px-Daffodil_International_University_%28logo%29.jpg' },
	{ name: 'Green University of Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/ed/Green_University_of_Bangladesh_logo.svg/330px-Green_University_of_Bangladesh_logo.svg.png' },
	{ name: 'Leading University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/02/Leading_University_Logo.png/120px-Leading_University_Logo.png' },
	{ name: 'Prime University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/1d/Prime_University.png/120px-Prime_University.png' },
	{ name: 'Southeast University (Bangladesh)', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f2/Southeast_University_%28Bangladesh%29_%28logo%29.png/120px-Southeast_University_%28Bangladesh%29_%28logo%29.png' },
	{ name: 'Stamford University Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/64/Stamford_University_Bangladesh_Logo.svg/330px-Stamford_University_Bangladesh_Logo.svg.png' },
	{ name: 'State University of Bangladesh', src: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Updated_SUB_Logo.jpg' },
	{ name: 'Eastern University (Bangladesh)', src: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Eastern_University_Bangladesh.png' },
	{ name: 'Metropolitan University, Sylhet', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/MU_Logo.svg/500px-MU_Logo.svg.png' },
	{ name: 'Primeasia University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Primeasia_University.png/960px-Primeasia_University.png' },
	{ name: 'United International University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/6e/United_International_University_Logo.svg/500px-United_International_University_Logo.svg.png' },
	{ name: 'University of Information Technology and Sciences', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/1c/UITS_banner_logo.png/330px-UITS_banner_logo.png' },
	{ name: 'University of South Asia, Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4b/University_of_South_Asia%2C_Bangladesh.jpg/120px-University_of_South_Asia%2C_Bangladesh.jpg' },
	{ name: 'Presidency University (Bangladesh)', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/0/04/Presidency_University%2C_Bangladesh_Logo.svg/120px-Presidency_University%2C_Bangladesh_Logo.svg.png' },
	{ name: 'Uttara University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/6/61/Logo_of_Uttara_University.svg/330px-Logo_of_Uttara_University.svg.png' },
	{ name: 'Victoria University of Bangladesh', src: 'https://upload.wikimedia.org/wikipedia/en/4/4a/Victoria_University_of_Bangladesh_%28logo%29.png' },
	{ name: 'World University of Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/c/ca/World_University_of_Bangladesh_logo.jpg/250px-World_University_of_Bangladesh_logo.jpg' },
	{ name: 'Bangladesh Islami University', src: 'https://upload.wikimedia.org/wikipedia/en/1/15/Bangladesh_Islami_University_%28crest%29.png' },
	{ name: 'East Delta University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/East_Delta_University_logo.png/250px-East_Delta_University_logo.png' },
	{ name: 'Britannia University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Britannia_University_Logo.png/250px-Britannia_University_Logo.png' },
	{ name: 'BGMEA University of Fashion & Technology', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/ef/BGMEA_University_of_Fashion_%26_Technology_logo.png/120px-BGMEA_University_of_Fashion_%26_Technology_logo.png' },
	{ name: 'North East University Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/21/NEUB_Logo_Emrul.jpg/120px-NEUB_Logo_Emrul.jpg' },
	{ name: 'Port City International University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Port_City_International_University_Logo.png/120px-Port_City_International_University_Logo.png' },
	{ name: 'Varendra University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Iconlogo.jpg/120px-Iconlogo.jpg' },
	{ name: 'North Bengal International University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/4/4e/NBIU_logo.png/120px-NBIU_logo.png' },
	{ name: 'Notre Dame University Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/af/Notre_Dame_University_Bangladesh_Monogram.svg/120px-Notre_Dame_University_Bangladesh_Monogram.svg.png' },
	{ name: 'Global University Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/1/1e/Global_University_Bangladesh.png/120px-Global_University_Bangladesh.png' },
	{ name: 'Bandarban University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/f/f6/Bandarban_University.jpeg/120px-Bandarban_University.jpeg' },
	{ name: 'Grameen University', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/e/e6/Grameen_University_logo.png/330px-Grameen_University_logo.png' },
	{ name: 'University of Science and Technology Chittagong', src: 'https://upload.wikimedia.org/wikipedia/en/d/d8/USTC_full_logo.png' },
	{ name: 'Ahsanullah University of Science and Technology', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/ac/Ahsanullah_University_of_Science_and_Technology_Logo.svg/120px-Ahsanullah_University_of_Science_and_Technology_Logo.svg.png' },
	{ name: 'Atish Dipankar University of Science and Technology', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/25/Logo_of_Atish_Dipankar_University_of_Science_and_Technology.jpeg/120px-Logo_of_Atish_Dipankar_University_of_Science_and_Technology.jpeg' },
	{ name: 'Rajshahi Science & Technology University', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/RSTU_logo.jpg/120px-RSTU_logo.jpg' },
	{ name: 'Bangladesh Army International University of Science & Technology', src: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Cropped-BAIUST-logo-1.png' },
	{ name: 'Bangladesh Army University of Science & Technology, Khulna', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Bangladesh_Army_University_of_Science_and_Technology_Khulna_Monogram.svg/120px-Bangladesh_Army_University_of_Science_and_Technology_Khulna_Monogram.svg.png' },
	{ name: 'CCN University of Science & Technology', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/CCN_University_Science_%26_Technology_Logo.png/120px-CCN_University_Science_%26_Technology_Logo.png' },
	{ name: 'University of Liberal Arts Bangladesh', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/a/a9/Logo_Signature_of_the_University_of_Liberal_Arts_Bangladesh_%28vector%29.svg/330px-Logo_Signature_of_the_University_of_Liberal_Arts_Bangladesh_%28vector%29.svg.png' },
	{ name: 'Bangladesh Army University of Engineering & Technology', src: 'https://thumb.wikimedia.org/wikipedia/en/thumb/2/21/BAUET_logo.jpg/120px-BAUET_logo.jpg' },
	{ name: 'Tagore University of Creative Arts', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/TUCA_Logo.png/960px-TUCA_Logo.png' },
	{ name: 'Islamic University of Technology', src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/IUT-alt-logo.png/250px-IUT-alt-logo.png' },
	{ name: 'Asian University for Women', src: 'https://upload.wikimedia.org/wikipedia/en/4/48/Logo_Asian_University_for_Women.png' },
];

// "Trusted across Bangladesh" (UpdateHomePageDesignplan.md §4.3), as designed on
// the canvas: a sector filter over logo cards. A card shows the logo when it has
// `src`, otherwise the sector icon and the name.
type SectorKey = 'government' | 'education' | 'healthcare' | 'business' | 'ngos';
type Organization = { name: string; sector: SectorKey; src?: string };

const SECTORS: { key: SectorKey; label: string; icon: SvgIconComponent }[] = [
	{ key: 'government', label: 'Government', icon: AccountBalanceRounded },
	{ key: 'education', label: 'Education', icon: SchoolRounded },
	{ key: 'healthcare', label: 'Healthcare', icon: LocalHospitalRounded },
	{ key: 'business', label: 'Business', icon: BusinessCenterRounded },
	{ key: 'ngos', label: 'NGOs', icon: VolunteerActivismRounded },
];

// placeholder: replace each name with the organization and its logo (`src`) once BdREN confirms it (D4).
const PLACEHOLDER_ORGANIZATIONS: Record<Exclude<SectorKey, 'education'>, string[]> = {
	government: [ '[Ministry logo]', '[Directorate logo]', '[Division office logo]', '[District office logo]', '[Public agency logo]', '[Regulator logo]' ],
	healthcare: [ '[Hospital logo]', '[Medical university logo]', '[Clinic network logo]', '[Health institute logo]', '[Diagnostic centre logo]', '[Nursing college logo]' ],
	business: [ '[Bank logo]', '[Telecom logo]', '[Garment company logo]', '[Software company logo]', '[Startup logo]', '[Consultancy logo]' ],
	ngos: [ '[Development NGO logo]', '[Microfinance logo]', '[Health NGO logo]', '[Education NGO logo]', '[Relief organization logo]', '[Foundation logo]' ],
};

const ORGANIZATIONS: Organization[] = [
	...UNIVERSITY_LOGOS.map((logo): Organization => ({ ...logo, sector: 'education' })),
	...(Object.entries(PLACEHOLDER_ORGANIZATIONS) as [SectorKey, string[]][]).flatMap(([ sector, names ]) => names.map((name): Organization => ({ name, sector }))),
];

// Numbers band, shown instead of the logos while ORGANIZATIONS is empty. Only
// confirmed figures go here (placeholders in the design: member institutions,
// meetings this month, share of meetings hosted in Bangladesh).
const TRUST_STATS: { value: string; label: string }[] = [];

type FeatureKey = 'classes' | 'meetings' | 'webinars' | 'recording' | 'transcription' | 'whiteboard' | 'breakout' | 'chat';

// The "One platform" feature tour (§7.3). `link` points to the homepage section
// that covers the feature until it has its own page; without one, no link is shown.
// `label` describes the feature's picture for screen readers.
type Feature = { key: FeatureKey; icon: SvgIconComponent; title: string; description: string; link?: string; label: string };

const FEATURES: Feature[] = [
	{ key: 'classes', icon: SchoolRounded, title: 'Online classes', description: 'Teach live from your browser. Share slides, run polls, and call on any student when they raise a hand.', link: '#use-cases', label: 'A live lecture: the teacher\'s slides next to three student video tiles, with three hands raised' },
	{ key: 'meetings', icon: GroupsRounded, title: 'Meetings', description: 'HD video meetings for faculty and staff, with screen sharing and calendar invites built in.', link: '#use-cases', label: 'A faculty meeting with a grid of video tiles and seven more people' },
	{ key: 'webinars', icon: PodcastsRounded, title: 'Webinars', description: 'Host open days and guest lectures for thousands, with moderated Q&A and registration.', link: '#recording', label: 'A live webinar: a large speaker tile next to audience questions with upvotes' },
	{ key: 'recording', icon: FiberManualRecordRounded, title: 'Recording', description: 'Every session is saved to the cloud automatically, so students can rewatch anytime.', link: '#recording', label: 'A saved lecture recording, paused at 21 minutes of 50' },
	{ key: 'transcription', icon: SubtitlesRounded, title: 'Live transcription', description: 'Accurate captions while you speak and a searchable transcript afterwards.', link: '#recording', label: 'Live captions over the teacher\'s video, next to a transcript with timestamps' },
	{ key: 'whiteboard', icon: DrawRounded, title: 'Whiteboard', description: 'An infinite canvas the whole class can draw on together, in real time.', link: '#use-cases', label: 'A shared whiteboard with a client and server handshake diagram and two students drawing' },
	{ key: 'breakout', icon: CallSplitRounded, title: 'Breakout rooms', description: 'Split the class into small groups in one click and bring everyone back on a timer.', link: '#use-cases', label: 'Four breakout rooms with their groups, eight minutes left' },
	{ key: 'chat', icon: ForumRounded, title: 'Chat & files', description: 'Share notes, links and files with the class, and keep it all after the session ends.', link: '#use-cases', label: 'The class chat with messages and a shared PDF file' },
];

const SPOTLIGHT_ROWS: { label: string; icon: SvgIconComponent; transcription?: boolean }[] = [
	{ label: 'Server-side recording', icon: FiberManualRecordRounded },
	// Names no languages until the transcriber's list is confirmed (Q4).
	{ label: 'Live transcription in the room\'s language', icon: SubtitlesRounded, transcription: true },
	{ label: 'Live streaming to a larger audience', icon: LiveTvRounded },
];

type UseCase = { key: string; tab: string; title: string; intro: string; bullets: string[]; cta: string; action: 'start' | 'join' | 'contact'; mock: MockVariant; room: string; mockLabel: string };

const USE_CASES: UseCase[] = [
	{ key: 'teachers', tab: 'Teachers', title: 'Run a live class from your browser', intro: 'Share slides, write on the whiteboard and keep every student involved, without installing anything.', bullets: [ 'Share slides and whiteboard', 'Breakout rooms for group work', 'Record and share the lecture' ], cta: strings.common.start, action: 'start', mock: 'classes', room: 'Video-Conferencing', mockLabel: 'A live lecture with slides and student video tiles' },
	{ key: 'students', tab: 'Students', title: 'Join from any phone or laptop', intro: 'Open the link your teacher sends. It works in the browser on phones, tablets and laptops.', bullets: [ 'One link, no install', 'Works on slow connections', 'Catch up with recordings' ], cta: strings.common.join, action: 'join', mock: 'chat', room: 'Video-Conferencing', mockLabel: 'The room chat with messages and a shared PDF file' },
	{ key: 'researchers', tab: 'Researchers', title: 'Collaborate across institutions', intro: 'Meet colleagues from other universities in secure rooms, with a lobby for guests.', bullets: [ 'Secure rooms with lobby', 'End-to-end encryption available', 'File sharing and chat' ], cta: 'Start a meeting', action: 'start', mock: 'meetings', room: 'phd-seminar', mockLabel: 'A meeting with six video tiles and two guests waiting in the lobby' },
	{ key: 'it', tab: 'IT administrators', title: 'Run it on BdREN\'s network', intro: 'eduKotha is hosted by BdREN, so classes and data stay on the national research and education network.', bullets: [ 'Institution sign-in', 'Room and user management', 'Data stays in Bangladesh' ], cta: 'Contact BdREN', action: 'contact', mock: 'admin', room: 'Video-Conferencing', mockLabel: 'The room management list with owners and participant counts' },
];

// placeholder: dates, descriptions and the "200+" figure need BdREN's confirmation.
// `art` gives a card the tall layout with an illustration; cards link to BdREN until they have a page.
const NEWS: { category: string; date: string; title: string; desc: string; art?: 'transcript' | 'workshop'; href?: string }[] = [
	{ category: 'Product update', date: '[Date]', title: 'Live transcription now available in eduKotha rooms', desc: 'Turn on transcription in any room and follow the class as live text in the room\'s language.', art: 'transcript' },
	{ category: 'Training', date: '[Date]', title: 'Online teaching workshop for member institutions', desc: 'Hands-on sessions for teachers on running engaging live classes with eduKotha.', art: 'workshop' },
	{ category: 'Event', date: '[Date]', title: 'BdREN at the annual research and education meeting', desc: 'Meet the team and see what is coming next for eduKotha.' },
	{ category: 'Network', date: '[Date]', title: 'BdREN connects 200+ member institutions', desc: 'Universities and research institutes on one national network.' },
];

// ── Helpers ──

const ADJECTIVES = [ 'bright', 'calm', 'clever', 'gentle', 'golden', 'green', 'happy', 'quiet', 'rapid', 'silver', 'sunny', 'swift', 'wise', 'bold', 'fresh', 'kind' ];
const NOUNS = [ 'river', 'lotus', 'delta', 'forest', 'meadow', 'harbor', 'island', 'garden', 'valley', 'breeze', 'comet', 'maple', 'orbit', 'pebble', 'tiger', 'willow' ];

const pick = <T, >(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** A readable random room name: adjective-noun-NN, e.g. bright-river-42. */
const randomRoomName = (): string =>
	`${pick(ADJECTIVES)}-${pick(NOUNS)}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;

/** Returns the room name from a pasted meeting link, or null when the text is not a link. */
const roomFromPastedUrl = (value: string): string | null => {
	try {
		const url = new URL(value.trim());
		const segment = url.pathname.split('/').filter(Boolean)
			.pop();

		return segment ? decodeURIComponent(segment).toLowerCase() : null;
	} catch {
		return null;
	}
};

/** Full link to a room on this deployment. */
const roomUrl = (room: string): string => `${window.location.origin}/${room}`;

// Letters, digits and hyphens (§6.7); dots and underscores are also accepted so
// links to rooms created elsewhere keep working.
const ROOM_PATTERN = /^[a-z0-9._-]+$/;

/** Friendly validation hint, or null when the name is fine or still empty. */
const validateRoomName = (room: string): string | null => {
	if (room === '') return null;
	if (/\s/.test(room)) return strings.quickJoin.errSpace;
	if (!ROOM_PATTERN.test(room)) return strings.quickJoin.errChars;
	if (room.length < 3) return strings.quickJoin.errShort;
	if (room.length > 64) return strings.quickJoin.errLong;

	return null;
};

/** Starts loading the meeting app chunk; used on intent (dialog open, hover, focus). */
const prefetchApp = (): void => {
	import('../App').catch(() => undefined);
};

const visibleLinks = (links: NavLink[]): NavLink[] => links.filter((link) => Boolean(link.href));

/** Drops links without a page, then columns left empty. */
const visibleColumns = (columns: MenuColumn[]): MenuColumn[] =>
	columns.map((column) => ({ ...column, items: visibleLinks(column.items) })).filter((column) => column.items.length > 0);

// ── Small UI pieces ──

// ── Header (§6) ──

type MeetItem = { key: string; label: string; desc: string; icon: SvgIconComponent; divider?: boolean; onSelect: () => void };
type MegaKey = 'products' | 'resources';

const IconTile = ({ icon: Icon, size = 40 }: { icon: SvgIconComponent; size?: number }): React.JSX.Element => (
	<Box
		aria-hidden
		sx={{ width: size, height: size, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: radius.sm, bgcolor: brand.blueLight, color: brand.blueDark }}
	>
		<Icon sx={{ fontSize: size * 0.55 }} />
	</Box>
);

// The default logo is dark, so on navy it sits on a white chip (Q1).
const Logo = ({ chip }: { chip: boolean }): React.JSX.Element => (
	<Link
		href='/'
		aria-label={strings.common.home}
		sx={{
			display: 'inline-flex',
			flexShrink: 0,
			px: 1.25,
			py: 1,
			borderRadius: radius.sm,
			bgcolor: chip ? brand.white : 'transparent',
			transition: `background-color ${motion.base}ms ${motion.ease}`,
			...focusRing(chip),
		}}
	>
		<img src={edumeetConfig.theme.logo} alt={strings.common.logoAlt} height={28} />
	</Link>
);

const UtilityBar = (): React.JSX.Element => {
	const links = visibleLinks(UTILITY_LINKS);

	return (
		<Box sx={{ display: { xs: 'none', md: 'block' }, bgcolor: brand.navy900, color: brand.textOnDarkMuted, fontSize: 13 }}>
			<Container maxWidth={false} sx={{ maxWidth: layout.container, px: layout.gutter, height: layout.utilityH, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<Link
					href={BDREN_URL}
					sx={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', '&:hover': { color: brand.white, textDecoration: 'underline' }, ...focusRing(true) }}
				>
					{strings.utility.service}
					<OpenInNewRounded aria-hidden sx={{ fontSize: 14 }} />
					<Box component='span' sx={visuallyHidden}>{strings.common.opensInSameTab}</Box>
				</Link>
				<Box sx={{ display: 'flex', gap: 3 }}>
					{links.map((link, index) => (
						<Link
							key={link.label}
							href={link.href}
							sx={{
								color: 'inherit',
								textDecoration: 'none',
								'&:hover': { color: brand.white, textDecoration: 'underline' },
								// Contact is the first to go on tablets (§12).
								display: index === links.length - 1 && link.label === strings.utility.contact ? { md: 'none', lg: 'inline' } : 'inline',
								...focusRing(true),
							}}
						>
							{link.label}
						</Link>
					))}
				</Box>
			</Container>
		</Box>
	);
};

const visuallyHidden = {
	position: 'absolute',
	width: 1,
	height: 1,
	overflow: 'hidden',
	clip: 'rect(0 0 0 0)',
	whiteSpace: 'nowrap',
} as const;

const MegaItemLink = ({ item, onNavigate }: { item: NavLink; onNavigate: () => void }): React.JSX.Element => (
	<Link
		href={item.href}
		onClick={onNavigate}
		sx={{
			display: 'flex',
			gap: 1.5,
			alignItems: 'flex-start',
			p: 1.25,
			borderRadius: radius.sm,
			textDecoration: 'none',
			color: brand.navy,
			'&:hover': { bgcolor: brand.surfaceSubtle },
			'&:hover .ek-mega-title': { color: brand.blueDark },
			...focusRing(),
		}}
	>
		{item.icon && <IconTile icon={item.icon} />}
		<Box>
			<Typography className='ek-mega-title' sx={{ fontSize: 16, fontWeight: 500, lineHeight: 1.3 }}>{item.label}</Typography>
			{item.desc && <Typography sx={{ fontSize: 14, color: brand.textSecondary, lineHeight: 1.4 }}>{item.desc}</Typography>}
		</Box>
	</Link>
);

const MegaPanel = ({ id, labelledBy, columns, withSide, onNavigate }: {
	id: string;
	labelledBy: string;
	columns: MenuColumn[];
	withSide: boolean;
	onNavigate: () => void;
}): React.JSX.Element => (
	<Box
		id={id}
		role='region'
		aria-labelledby={labelledBy}
		sx={{
			position: 'absolute',
			top: '100%',
			left: 0,
			right: 0,
			zIndex: zIndex.menu,
			bgcolor: brand.white,
			color: brand.navy,
			borderRadius: `0 0 ${radius.lg} ${radius.lg}`,
			boxShadow: shadow[2],
			p: 3,
			display: 'grid',
			gridTemplateColumns: `repeat(${columns.length}, 1fr)${withSide ? ' 280px' : ''}`,
			gap: 3,
			animation: `${menuIn} 180ms ${motion.ease}`,
			[reducedMotion]: { animation: 'none' },
		}}
	>
		{columns.map((column) => (
			<Box key={column.title}>
				<Typography sx={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: brand.textSecondary, px: 1.25, mb: 1 }}>
					{column.title}
				</Typography>
				<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0 }}>
					{column.items.map((item) => (
						<li key={item.label}><MegaItemLink item={item} onNavigate={onNavigate} /></li>
					))}
				</Box>
			</Box>
		))}
		{withSide && (
			<Box sx={{ bgcolor: brand.navy, color: brand.white, borderRadius: radius.md, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
				<Box component='span' sx={{ alignSelf: 'flex-start', px: 1.25, py: 0.25, borderRadius: radius.pill, bgcolor: brand.orangeLight, color: brand.navy, fontSize: 12, fontWeight: 500 }}>
					{strings.nav.productsSideBadge}
				</Box>
				<Typography sx={{ fontSize: 20, fontWeight: 500 }}>{strings.nav.productsSideTitle}</Typography>
				<Typography sx={{ color: brand.textOnDarkMuted, fontSize: 14 }}>{strings.nav.productsSideText}</Typography>
				<Link
					href={PRODUCTS_SIDE_HREF}
					onClick={onNavigate}
					sx={{ mt: 'auto', color: brand.blueOnNavy, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 0.5, ...focusRing(true) }}
				>
					{strings.nav.productsSideLink}
					<ArrowForwardRounded aria-hidden sx={{ fontSize: 18 }} />
				</Link>
			</Box>
		)}
	</Box>
);

const MeetMenu = ({ items, solid }: { items: MeetItem[]; solid: boolean }): React.JSX.Element => {
	const [ anchor, setAnchor ] = useState<HTMLElement | null>(null);
	const open = Boolean(anchor);

	const select = (item: MeetItem): void => {
		setAnchor(null);
		item.onSelect();
	};

	return (
		<>
			<Button
				id='ek-meet-button'
				variant='outlined'
				aria-haspopup='menu'
				aria-expanded={open}
				aria-controls={open ? 'ek-meet-menu' : undefined}
				onClick={(event) => setAnchor(event.currentTarget)}
				onKeyDown={(event) => {
					if (event.key === 'ArrowDown') {
						event.preventDefault();
						setAnchor(event.currentTarget);
					}
				}}
				endIcon={<ExpandMoreRounded sx={{ transition: `transform ${motion.base}ms ${motion.ease}`, transform: open ? 'rotate(180deg)' : 'none' }} />}
				sx={{
					minHeight: 36,
					height: 36,
					fontSize: 15,
					color: open ? brand.navy : solid ? brand.blueDark : brand.white,
					borderColor: solid || open ? brand.blueDark : 'rgba(255, 255, 255, 0.6)',
					bgcolor: open ? brand.blueLight : 'transparent',
					'&:hover': { borderColor: solid ? brand.blueDark : brand.white, bgcolor: solid || open ? brand.blueLight : 'rgba(255, 255, 255, 0.08)' },
					...focusRing(!solid),
				}}
			>
				{strings.nav.meet}
			</Button>
			<Menu
				id='ek-meet-menu'
				anchorEl={anchor}
				open={open}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{
					list: { 'aria-labelledby': 'ek-meet-button', sx: { p: 1 } },
					paper: { sx: { width: 320, mt: 1, borderRadius: radius.md, boxShadow: shadow[2] } },
				}}
			>
				{items.flatMap((item) => [
					...(item.divider ? [ <Divider key={`${item.key}-divider`} sx={{ my: 1, borderColor: brand.border }} /> ] : []),
					<MenuItem
						key={item.key}
						onClick={() => select(item)}
						sx={{ minHeight: 56, gap: 1.5, borderRadius: radius.sm, alignItems: 'center', '&:hover, &.Mui-focusVisible': { bgcolor: brand.surfaceSubtle } }}
					>
						<IconTile icon={item.icon} />
						<Box>
							<Typography sx={{ fontSize: 15, fontWeight: 500, color: brand.navy, lineHeight: 1.3 }}>{item.label}</Typography>
							<Typography sx={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.4, whiteSpace: 'normal' }}>{item.desc}</Typography>
						</Box>
					</MenuItem>,
				])}
			</Menu>
		</>
	);
};

// Signed in: an avatar button with My meetings, My rooms and Sign out (§6.2).
const AccountMenu = ({ items, onSignOut, solid }: { items: MeetItem[]; onSignOut: () => void; solid: boolean }): React.JSX.Element => {
	const [ anchor, setAnchor ] = useState<HTMLElement | null>(null);
	const open = Boolean(anchor);
	const all: MeetItem[] = [ ...items, { key: 'sign-out', label: strings.common.signOut, desc: '', icon: LogoutRounded, divider: items.length > 0, onSelect: onSignOut } ];

	return (
		<>
			<IconButton
				id='ek-account-button'
				aria-label={strings.account.label}
				aria-haspopup='menu'
				aria-expanded={open}
				aria-controls={open ? 'ek-account-menu' : undefined}
				onClick={(event) => setAnchor(event.currentTarget)}
				sx={{ width: 44, height: 44, color: solid ? brand.blueDark : brand.white, ...focusRing(!solid) }}
			>
				<AccountCircleRounded sx={{ fontSize: 30 }} />
			</IconButton>
			<Menu
				id='ek-account-menu'
				anchorEl={anchor}
				open={open}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{
					list: { 'aria-labelledby': 'ek-account-button', sx: { p: 1 } },
					paper: { sx: { width: 280, mt: 1, borderRadius: radius.md, boxShadow: shadow[2] } },
				}}
			>
				{all.flatMap((item) => [
					...(item.divider ? [ <Divider key={`${item.key}-divider`} sx={{ my: 1, borderColor: brand.border }} /> ] : []),
					<MenuItem
						key={item.key}
						onClick={() => {
							setAnchor(null);
							item.onSelect();
						}}
						sx={{ minHeight: 48, gap: 1.5, borderRadius: radius.sm, '&:hover, &.Mui-focusVisible': { bgcolor: brand.surfaceSubtle } }}
					>
						<IconTile icon={item.icon} size={36} />
						<Box>
							<Typography sx={{ fontSize: 15, fontWeight: 500, color: brand.navy, lineHeight: 1.3 }}>{item.label}</Typography>
							{item.desc && <Typography sx={{ fontSize: 13, color: brand.textSecondary, lineHeight: 1.4, whiteSpace: 'normal' }}>{item.desc}</Typography>}
						</Box>
					</MenuItem>,
				])}
			</Menu>
		</>
	);
};

const navItemSx = (solid: boolean, active: boolean): SxProps<Theme> => ({
	position: 'relative',
	minHeight: 44,
	px: { lg: 1.25, xl: 2 },
	fontSize: 15,
	fontWeight: 500,
	color: solid ? brand.navy : brand.white,
	borderRadius: radius.sm,
	textDecoration: 'none',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 0.25,
	whiteSpace: 'nowrap',
	'&:hover': { bgcolor: solid ? brand.surfaceSubtle : 'rgba(255, 255, 255, 0.08)' },
	// Active: 3 px orange underline 8 px below the label (§6.2).
	'&::after': {
		content: '""',
		position: 'absolute',
		left: 12,
		right: 12,
		bottom: 2,
		height: 3,
		borderRadius: radius.pill,
		bgcolor: brand.orange,
		opacity: active ? 1 : 0,
		transition: `opacity ${motion.base}ms ${motion.ease}`,
	},
	...focusRing(!solid),
});

type NavbarProps = {
	solid: boolean;
	raised: boolean;
	meetItems: MeetItem[];
	showSignIn: boolean;
	loggedIn: boolean;
	accountItems: MeetItem[];
	onSignIn: () => void;
	onSignOut: () => void;
	onStart: () => void;
	onJoin: () => void;
	drawerOpen: boolean;
	onOpenDrawer: () => void;
};

const Navbar = ({ solid, raised, meetItems, showSignIn, loggedIn, accountItems, onSignIn, onSignOut, onStart, onJoin, drawerOpen, onOpenDrawer }: NavbarProps): React.JSX.Element => {
	const [ openMenu, setOpenMenu ] = useState<MegaKey | null>(null);
	const hoverTimer = useRef<number>(undefined);
	const buttonRefs = useRef<Record<MegaKey, HTMLButtonElement | null>>({ products: null, resources: null });
	const products = visibleColumns(PRODUCTS_MENU);
	const resources = visibleColumns(RESOURCES_MENU);
	const menus: { key: MegaKey; label: string; columns: MenuColumn[]; withSide: boolean }[] = [
		{ key: 'products' as const, label: strings.nav.products, columns: products, withSide: true },
		{ key: 'resources' as const, label: strings.nav.resources, columns: resources, withSide: false },
	].filter((menu) => menu.columns.length > 0);

	const clearTimer = (): void => window.clearTimeout(hoverTimer.current);
	const openAfterIntent = (key: MegaKey): void => {
		clearTimer();
		hoverTimer.current = window.setTimeout(() => setOpenMenu(key), 150);
	};
	const closeAfterIntent = (): void => {
		clearTimer();
		hoverTimer.current = window.setTimeout(() => setOpenMenu(null), 150);
	};
	const close = (): void => {
		clearTimer();
		setOpenMenu(null);
	};

	useEffect(() => clearTimer, []);

	const current = menus.find((menu) => menu.key === openMenu);
	const onDark = !solid && !drawerOpen;

	return (
		<ClickAwayListener onClickAway={close}>
			<Box
				component='nav'
				aria-label={strings.nav.label}
				onKeyDown={(event) => {
					if (event.key === 'Escape' && openMenu) {
						const key = openMenu;

						close();
						buttonRefs.current[key]?.focus();
					}
				}}
				onBlur={(event) => {
					if (openMenu && !event.currentTarget.contains(event.relatedTarget as Node | null)) close();
				}}
				sx={{
					position: 'sticky',
					top: 0,
					zIndex: zIndex.nav,
					bgcolor: solid ? brand.white : 'transparent',
					color: solid ? brand.navy : brand.white,
					// The bottom rule is an inset shadow, so the navbar stays exactly 64 / 56 px.
					// It sits on the white hero, so it keeps the rule at the top and lifts once scrolled.
					boxShadow: solid ? `${raised ? `${shadow[1]}, ` : ''}inset 0 -1px 0 ${brand.border}` : 'none',
					transition: `background-color ${motion.base}ms ${motion.ease}, color ${motion.base}ms ${motion.ease}, box-shadow ${motion.base}ms ${motion.ease}`,
					[reducedMotion]: { transition: 'none' },
				}}
			>
				<Container maxWidth={false} sx={{ maxWidth: layout.container, px: layout.gutter }}>
					<Box sx={{ position: 'relative', height: layout.navH, display: 'flex', alignItems: 'center', gap: { lg: 2.5, xl: 4 } }}>
						<Logo chip={!solid} />

						<Box component='ul' sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: { lg: 0.5, xl: 1 }, listStyle: 'none', m: 0, p: 0, flex: 1 }}>
							{menus.map((menu) => (
								<li
									key={menu.key}
									onMouseEnter={() => openAfterIntent(menu.key)}
									onMouseLeave={closeAfterIntent}
								>
									<Box
										component='button'
										type='button'
										ref={(node: HTMLButtonElement | null) => {
											buttonRefs.current[menu.key] = node;
										}}
										id={`ek-${menu.key}-button`}
										aria-expanded={openMenu === menu.key}
										aria-controls={`ek-${menu.key}-panel`}
										onClick={() => {
											clearTimer();
											setOpenMenu(openMenu === menu.key ? null : menu.key);
										}}
										sx={{ ...navItemSx(solid, openMenu === menu.key), border: 0, bgcolor: 'transparent', font: 'inherit', cursor: 'pointer' } as SxProps<Theme>}
									>
										{menu.label}
										<ExpandMoreRounded aria-hidden sx={{ fontSize: 20, transition: `transform ${motion.base}ms ${motion.ease}`, transform: openMenu === menu.key ? 'rotate(180deg)' : 'none' }} />
									</Box>
								</li>
							))}
							<li>
								<Link href={INSTITUTIONS_URL} sx={navItemSx(solid, false)}>
									<Box component='span' sx={{ display: { lg: 'none', xl: 'inline' } }}>{strings.nav.institutions}</Box>
									<Box component='span' sx={{ display: { lg: 'inline', xl: 'none' } }}>{strings.nav.institutionsShort}</Box>
								</Link>
							</li>
							{PRICING_URL && (
								<li><Link href={PRICING_URL} sx={navItemSx(solid, false)}>{strings.nav.pricing}</Link></li>
							)}
						</Box>

						<Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: { xs: 1, lg: 1.5 } }}>
							<Box sx={{ display: { xs: 'none', lg: 'flex' } }}>
								<MeetMenu items={meetItems} solid={solid} />
							</Box>
							{showSignIn && loggedIn && (
								<Box sx={{ display: { xs: 'none', lg: 'flex' } }}>
									<AccountMenu items={accountItems} onSignOut={onSignOut} solid={solid} />
								</Box>
							)}
							{showSignIn && !loggedIn && (
								<Box
									component='button'
									type='button'
									onClick={onSignIn}
									sx={{ ...navItemSx(solid, false), display: { xs: 'none', lg: 'inline-flex' }, border: 0, bgcolor: 'transparent', font: 'inherit', cursor: 'pointer' } as SxProps<Theme>}
								>
									{strings.common.signIn}
								</Box>
							)}
							{/* Below 1024 px: compact Join (and Start on tablets) next to the hamburger (§6.4, §12). */}
							<Button
								variant='contained'
								color='secondary'
								onClick={onJoin}
								sx={{ display: { xs: 'inline-flex', lg: 'none' }, minHeight: 44, height: 44, fontSize: 15, boxShadow: 'none', ...focusRing(onDark) }}
							>
								{strings.common.joinShort}
							</Button>
							<Button
								variant='contained'
								color='secondary'
								onClick={onStart}
								endIcon={<ArrowForwardRounded />}
								sx={{ display: { xs: 'none', md: 'inline-flex' }, minHeight: { md: 44, lg: 36 }, height: { md: 44, lg: 36 }, fontSize: 15, boxShadow: 'none', whiteSpace: 'nowrap', ...focusRing(onDark) }}
							>
								<Box component='span' sx={{ display: { md: 'inline', lg: 'none', xl: 'inline' } }}>{strings.common.start}</Box>
								<Box component='span' sx={{ display: { md: 'none', lg: 'inline', xl: 'none' } }}>{strings.common.startShort}</Box>
							</Button>
							<IconButton
								aria-label={strings.nav.openMenu}
								aria-expanded={drawerOpen}
								aria-controls='ek-drawer'
								onClick={onOpenDrawer}
								sx={{ display: { xs: 'inline-flex', lg: 'none' }, width: 44, height: 44, color: 'inherit', ...focusRing(onDark) }}
							>
								<MenuRounded />
							</IconButton>
						</Box>

						{current && (
							<Box
								onMouseEnter={clearTimer}
								onMouseLeave={closeAfterIntent}
								sx={{ display: { xs: 'none', lg: 'block' } }}
							>
								<MegaPanel
									id={`ek-${current.key}-panel`}
									labelledBy={`ek-${current.key}-button`}
									columns={current.columns}
									withSide={current.withSide}
									onNavigate={close}
								/>
							</Box>
						)}
					</Box>
				</Container>
			</Box>
		</ClickAwayListener>
	);
};

const drawerLinkSx: SxProps<Theme> = {
	display: 'flex',
	alignItems: 'center',
	gap: 1.5,
	minHeight: 48,
	px: 1,
	borderRadius: radius.sm,
	color: brand.navy,
	fontSize: 16,
	fontWeight: 500,
	textDecoration: 'none',
	'&:hover': { bgcolor: brand.surfaceSubtle },
	...focusRing(),
};

type NavDrawerProps = {
	open: boolean;
	onClose: () => void;
	meetItems: MeetItem[];
	accountItems: MeetItem[];
	showSignIn: boolean;
	loggedIn: boolean;
	onSignIn: () => void;
	onSignOut: () => void;
	onStart: () => void;
};

const NavDrawer = ({ open, onClose, meetItems, accountItems, showSignIn, loggedIn, onSignIn, onSignOut, onStart }: NavDrawerProps): React.JSX.Element => {
	const [ expanded, setExpanded ] = useState<MegaKey | false>(false);
	const menus = [
		{ key: 'products' as const, label: strings.nav.products, items: visibleColumns(PRODUCTS_MENU).flatMap((column) => column.items) },
		{ key: 'resources' as const, label: strings.nav.resources, items: visibleColumns(RESOURCES_MENU).flatMap((column) => column.items) },
	].filter((menu) => menu.items.length > 0);
	const plainLinks = visibleLinks([
		{ label: strings.nav.institutions, href: INSTITUTIONS_URL },
		{ label: strings.nav.pricing, href: PRICING_URL },
		...UTILITY_LINKS,
	]);

	const run = (action: () => void) => (): void => {
		onClose();
		action();
	};

	return (
		<Drawer
			id='ek-drawer'
			anchor='right'
			open={open}
			onClose={onClose}
			transitionDuration={motion.drawer}
			slotProps={{
				paper: { role: 'dialog', 'aria-modal': true, 'aria-label': strings.nav.drawerLabel, sx: { width: 'min(100vw, 400px)', color: brand.navy } },
				backdrop: { sx: { bgcolor: 'rgba(4, 44, 106, 0.6)' } },
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, height: layout.navH, borderBottom: `1px solid ${brand.border}`, flexShrink: 0 }}>
				<Logo chip={false} />
				<IconButton aria-label={strings.nav.closeMenu} onClick={onClose} sx={{ width: 44, height: 44, color: brand.navy, ...focusRing() }}>
					<CloseRounded />
				</IconButton>
			</Box>

			<Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
				{[
					...(showSignIn && loggedIn && accountItems.length > 0 ? [ { title: strings.account.group, items: accountItems } ] : []),
					{ title: strings.nav.meetGroup, items: meetItems },
				].map((group) => (
					<React.Fragment key={group.title}>
						<Typography sx={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: brand.textSecondary, px: 1, mb: 0.5 }}>
							{group.title}
						</Typography>
						<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, mb: 2 }}>
							{group.items.map((item) => (
								<li key={item.key}>
									<Box component='button' type='button' onClick={run(item.onSelect)} sx={{ ...drawerLinkSx, width: '100%', border: 0, bgcolor: 'transparent', font: 'inherit', cursor: 'pointer', textAlign: 'left' } as SxProps<Theme>}>
										<IconTile icon={item.icon} size={36} />
										{item.label}
									</Box>
								</li>
							))}
						</Box>
					</React.Fragment>
				))}

				<Divider sx={{ borderColor: brand.border }} />

				{menus.map((menu) => (
					<Accordion
						key={menu.key}
						disableGutters
						elevation={0}
						square
						expanded={expanded === menu.key}
						onChange={(_event, isExpanded) => setExpanded(isExpanded ? menu.key : false)}
						sx={{ bgcolor: 'transparent', color: brand.navy, borderBottom: `1px solid ${brand.border}`, '&::before': { display: 'none' } }}
					>
						<AccordionSummary expandIcon={<ExpandMoreRounded sx={{ color: brand.navy }} />} sx={{ px: 1, minHeight: 52, fontWeight: 500, ...focusRing() }}>
							{menu.label}
						</AccordionSummary>
						<AccordionDetails sx={{ px: 0, pt: 0 }}>
							<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0 }}>
								{menu.items.map((item) => (
									<li key={item.label}>
										<Link href={item.href} onClick={onClose} sx={{ ...drawerLinkSx, fontWeight: 400, pl: 2 } as SxProps<Theme>}>{item.label}</Link>
									</li>
								))}
							</Box>
						</AccordionDetails>
					</Accordion>
				))}

				<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, mt: 1 }}>
					{plainLinks.map((link) => (
						<li key={link.label}>
							<Link href={link.href} onClick={onClose} sx={drawerLinkSx}>{link.label}</Link>
						</li>
					))}
				</Box>
			</Box>

			<Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, borderTop: `1px solid ${brand.border}`, pb: 'calc(16px + env(safe-area-inset-bottom))' }}>
				{showSignIn && (
					<Box>
						<Button variant='outlined' fullWidth onClick={run(loggedIn ? onSignOut : onSignIn)} sx={{ color: brand.blueDark, borderColor: brand.blueDark, ...focusRing() }}>
							{loggedIn ? strings.common.signOut : strings.common.signIn}
						</Button>
						{!loggedIn && <Typography sx={{ mt: 0.75, fontSize: 13, color: brand.textSecondary, textAlign: 'center' }}>{strings.account.signInHelper}</Typography>}
					</Box>
				)}
				<Button variant='contained' color='secondary' fullWidth endIcon={<ArrowForwardRounded />} onClick={run(onStart)} sx={{ boxShadow: 'none', ...focusRing() }}>
					{strings.common.start}
				</Button>
			</Box>
		</Drawer>
	);
};

const StickyBar = ({ visible, onJoin, onStart }: { visible: boolean; onJoin: () => void; onStart: () => void }): React.JSX.Element => (
	<Box
		aria-hidden={!visible}
		sx={{
			display: { xs: 'flex', md: 'none' },
			position: 'fixed',
			left: 0,
			right: 0,
			bottom: 0,
			zIndex: zIndex.nav,
			gap: 1.5,
			px: 2,
			pt: 1.5,
			pb: 'calc(12px + env(safe-area-inset-bottom))',
			bgcolor: brand.white,
			borderTop: `1px solid ${brand.border}`,
			boxShadow: shadow[2],
			transform: visible ? 'none' : 'translateY(100%)',
			visibility: visible ? 'visible' : 'hidden',
			transition: `transform ${motion.base}ms ${motion.ease}, visibility ${motion.base}ms`,
			[reducedMotion]: { transition: 'none' },
		}}
	>
		<Button variant='contained' color='primary' fullWidth onClick={onJoin} tabIndex={visible ? 0 : -1} sx={{ boxShadow: 'none', ...focusRing() }}>
			{strings.common.join}
		</Button>
		<Button variant='contained' color='secondary' fullWidth onClick={onStart} tabIndex={visible ? 0 : -1} sx={{ boxShadow: 'none', ...focusRing() }}>
			{strings.common.start}
		</Button>
	</Box>
);

const InstallDialog = ({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element => (
	<Dialog open={open} onClose={onClose} aria-labelledby='ek-install-title' slotProps={{ paper: { sx: { borderRadius: radius.lg, maxWidth: 480 } } }}>
		<DialogTitle id='ek-install-title' sx={{ color: brand.navy, fontWeight: 700 }}>{strings.install.title}</DialogTitle>
		<DialogContent>
			<Typography sx={{ color: brand.textSecondary, mb: 1.5 }}>{strings.install.intro}</Typography>
			<Box component='ul' sx={{ m: 0, pl: 2.5, color: brand.navy, '& li': { mb: 1 } }}>
				<li>{strings.install.chrome}</li>
				<li>{strings.install.android}</li>
				<li>{strings.install.ios}</li>
			</Box>
		</DialogContent>
		<DialogActions sx={{ px: 3, pb: 2.5 }}>
			<Button variant='contained' color='primary' onClick={onClose} sx={{ boxShadow: 'none', ...focusRing() }}>{strings.install.close}</Button>
		</DialogActions>
	</Dialog>
);

// ── Product mocks ──

// Frame for the JSX product mocks: a light browser bar with three dots and a short URL.
const BrowserFrame = ({ url, label, children, elevation = 3, ratio = '16 / 10' }: {
	url: string;
	label: string;
	children: React.ReactNode;
	elevation?: 2 | 3;
	ratio?: string | { xs: string; md: string };
}): React.JSX.Element => (
	<Box
		role='img'
		aria-label={label}
		sx={{ width: '100%', aspectRatio: ratio, display: 'flex', flexDirection: 'column', bgcolor: brand.white, borderRadius: radius.lg, boxShadow: shadow[elevation], border: elevation === 2 ? `1px solid ${brand.border}` : 'none', overflow: 'hidden' }}
	>
		<Box aria-hidden sx={{ height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, borderBottom: `1px solid ${brand.border}` }}>
			{[ 0, 1, 2 ].map((dot) => <Box key={dot} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: brand.border }} />)}
			<Box sx={{ ml: 1, px: 1.25, py: 0.25, borderRadius: radius.pill, bgcolor: brand.surfaceSubtle, color: brand.textSecondary, fontSize: 11, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
				{url}
			</Box>
		</Box>
		<Box aria-hidden sx={{ flex: 1, minHeight: 0, display: 'flex' }}>{children}</Box>
	</Box>
);

// Avatar colors dark enough for white initials (4.5:1); orange takes navy initials.
const MOCK_STUDENTS = [
	{ initials: 'NA', color: '#1668c4' },
	{ initials: 'RK', color: '#fe9b2a' },
	{ initials: 'SH', color: '#1d7a50' },
	{ initials: 'TM', color: '#6d42c7' },
];

const MOCK_CHAT = [
	{ name: 'Nadia', text: 'Is this on the exam?' },
	{ name: 'Rafi', text: 'Slide 12, please' },
	{ name: 'Dr. Ahmed', text: 'Yes, TCP handshake.' },
];

const MockAvatar = ({ initials, color, size = 28 }: { initials: string; color: string; size?: number }): React.JSX.Element => (
	<Box sx={{ width: size, height: size, borderRadius: '50%', bgcolor: color, color: color === brand.orange ? brand.navy : brand.white, display: 'grid', placeItems: 'center', fontSize: size * 0.38, fontWeight: 700 }}>
		{initials}
	</Box>
);

// ── Hero meeting scenes (UpdateHomePageDesignplan.md §4.2) ──
// Four meetings drawn with boxes, so every visitor sees their own kind: a team
// meeting (first, and the only one under reduced motion), an official briefing,
// a class and a webinar. They crossfade every 5 s; the visitor can pause or pick one.

type HeroSceneKey = 'team' | 'briefing' | 'class' | 'webinar';
type HeroScene = { key: HeroSceneKey; label: string; room: string; chip: string; chipDot: string; status: string; secure?: boolean; mockLabel: string };

const HERO_SCENE_MS = 5000;

const HERO_SCENES: HeroScene[] = [
	{ key: 'team', label: 'Team meeting', room: 'team-weekly', chip: '8 in meeting', chipDot: '#1d9e6a', status: 'REC', mockLabel: 'A team meeting: Farhana presents Q3 targets while four colleagues watch and chat' },
	{ key: 'briefing', label: 'Official briefing', room: 'district-briefing', chip: 'Room locked', chipDot: brand.orange, status: 'ENCRYPTED', secure: true, mockLabel: 'An official briefing with one speaker, a row of participants and three people waiting in the lobby' },
	{ key: 'class', label: 'Class', room: 'cse-341', chip: '3 hands raised', chipDot: brand.orange, status: 'REC', mockLabel: 'An online class: a lecture slide next to three student video tiles, with three hands raised' },
	{ key: 'webinar', label: 'Webinar', room: 'open-webinar', chip: 'Live now', chipDot: '#d93b3b', status: 'LIVE', mockLabel: 'A live webinar: the host on video next to audience questions with upvotes' },
];

const HERO_TEAM = [
	{ initials: 'RK', color: '#1668c4', name: 'Rahim', speaking: true },
	{ initials: 'NS', color: '#6d42c7', name: 'Nusrat' },
	{ initials: 'TM', color: '#1d7a50', name: 'Tanvir' },
	{ initials: 'MR', color: '#0f766e', name: 'Mitu' },
];

const HERO_BRIEFING_STRIP = [
	{ initials: 'SA', color: '#1668c4' },
	{ initials: 'JB', color: '#6d42c7' },
	{ initials: 'RN', color: '#1d7a50' },
	{ initials: 'MI', color: '#0f766e' },
];

const HERO_LOBBY = [ 'Imran H.', 'Sadia K.', 'Arif M.' ];

const HERO_STUDENTS = [
	{ initials: 'NA', color: '#1668c4', name: 'Nadia', speaking: true },
	{ initials: 'RK', color: '#6d42c7', name: 'Rahim' },
	{ initials: 'SH', color: '#1d7a50', name: 'Sadia' },
];

const HERO_QUESTIONS = [
	{ name: 'Arif', text: 'Will the slides be shared?', votes: 12 },
	{ name: 'Mim', text: 'Is there a recording afterwards?', votes: 8 },
	{ name: 'Tanvir', text: 'How do we register for part 2?', votes: 5 },
];

const narrow = '@media (max-width: 479.95px)';

const HeroTile = ({ initials, color, name, speaking, size = 28, flex }: { initials: string; color: string; name?: string; speaking?: boolean; size?: number; flex?: number }): React.JSX.Element => (
	<Box sx={{ position: 'relative', flex, minWidth: 0, minHeight: 0, borderRadius: radius.sm, bgcolor: brand.navy700, display: 'grid', placeItems: 'center', boxShadow: speaking ? `inset 0 0 0 2px ${tour.green}` : 'none' }}>
		<MockAvatar initials={initials} color={color} size={size} />
		{name && (
			<Box sx={{ position: 'absolute', left: 5, bottom: 4, maxWidth: 'calc(100% - 10px)', px: '5px', py: '1px', borderRadius: '4px', bgcolor: 'rgba(0, 0, 0, 0.35)', color: brand.white, fontSize: 9, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
				{name}
			</Box>
		)}
	</Box>
);

// A shared slide with a bar chart, used by the team meeting and the class.
const HeroSlide = ({ kicker, title, bars, children }: { kicker: string; title: string; bars: number[]; children?: React.ReactNode }): React.JSX.Element => (
	<Box sx={{ flex: 2.2, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', gap: 0.75, p: { xs: 1.25, sm: 1.5 }, borderRadius: radius.sm, bgcolor: brand.white }}>
		<Box sx={mockText(9, 500, brand.blueDark)}>{kicker}</Box>
		<Box sx={{ ...mockText(14, 700), [narrow]: { fontSize: 11 } } as SxProps<Theme>}>{title}</Box>
		<Box sx={{ width: 28, height: 3, borderRadius: radius.pill, bgcolor: brand.orange }} />
		<Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end', gap: '9%', px: '6%', borderBottom: `2px solid ${brand.border}` }}>
			{bars.map((height, index) => (
				<Box key={index} sx={{ flex: 1, height: `${height}%`, borderRadius: '4px 4px 0 0', bgcolor: height === Math.max(...bars) ? brand.blue : '#c9dcf5' }} />
			))}
		</Box>
		{children}
	</Box>
);

const HeroSceneBody = ({ scene }: { scene: HeroSceneKey }): React.JSX.Element => {
	switch (scene) {
		case 'briefing':
			return (
				<>
					<Box sx={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
						<Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
							<HeroTile initials='KH' color={brand.orange} name='Kamal H. · Speaking' speaking size={52} flex={1} />
						</Box>
						<Box sx={{ height: 44, flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 0.75, [narrow]: { height: 32 } }}>
							{HERO_BRIEFING_STRIP.map((person) => <HeroTile key={person.initials} {...person} size={20} />)}
							<Box sx={{ borderRadius: radius.sm, bgcolor: '#1c2f5e', color: tour.windowText, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>+9</Box>
						</Box>
					</Box>
					<Panel sx={{ width: '38%', flexShrink: 0, [narrow]: { width: '46%' } }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
							<Box sx={mockText(10, 700)}>Lobby</Box>
							<Pill color={brand.navy} bg={brand.orangeLight}>3 waiting</Pill>
						</Box>
						{HERO_LOBBY.map((name) => (
							<Box key={name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
								<Box sx={mockText(9)}>{name}</Box>
								<Box sx={{ px: 0.75, borderRadius: radius.pill, bgcolor: brand.blueDark, ...mockText(8, 700, brand.white) } as SxProps<Theme>}>Admit</Box>
							</Box>
						))}
						<Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 0.5, ...mockText(9, 500, brand.textSecondary) } as SxProps<Theme>}>
							<LockRounded sx={{ fontSize: 12 }} />
							Room locked
						</Box>
					</Panel>
				</>
			);
		case 'class':
			return (
				<>
					<HeroSlide kicker='CSE 341 · WEEK 6' title='Lecture 12: Transport layer' bars={[ 38, 58, 90, 50 ]}>
						<Pill color={brand.navy} bg={brand.orangeLight}><PanToolRounded sx={{ fontSize: 10 }} />3 hands raised</Pill>
					</HeroSlide>
					<Box sx={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateRows: 'repeat(3, minmax(0, 1fr))', gap: 0.75 }}>
						{HERO_STUDENTS.map((person) => <HeroTile key={person.initials} {...person} size={26} />)}
					</Box>
				</>
			);
		case 'webinar':
			return (
				<>
					<Box sx={{ flex: 1.5, minWidth: 0, position: 'relative', display: 'flex' }}>
						<HeroTile initials='SR' color='#0f766e' name='Shirin R. · Host' speaking size={56} flex={1} />
						<Box sx={{ position: 'absolute', left: 8, top: 8 }}>
							<Pill color={brand.white} bg='#d93b3b'>● LIVE</Pill>
						</Box>
					</Box>
					<Panel sx={{ width: '38%', flexShrink: 0, [narrow]: { width: '46%' } }}>
						<Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 0.5 }}>
							<Box sx={mockText(10, 700)}>Q&A</Box>
							<Box sx={mockText(8, 400, brand.textSecondary)}>Top questions</Box>
						</Box>
						{HERO_QUESTIONS.map((question) => (
							<Box key={question.name} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, px: 0.75, py: 0.5, borderRadius: '6px', bgcolor: brand.surfaceSubtle, [narrow]: { '&:nth-of-type(n+4)': { display: 'none' } } }}>
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Box sx={mockText(8, 700, brand.blueDark)}>{question.name}</Box>
									<Box sx={mockText(9)}>{question.text}</Box>
								</Box>
								<Box sx={{ flexShrink: 0, px: 0.5, borderRadius: '4px', bgcolor: brand.blueLight, ...mockText(8, 700, brand.blueDark) } as SxProps<Theme>}>▲ {question.votes}</Box>
							</Box>
						))}
					</Panel>
				</>
			);
		case 'team':
		default:
			return (
				<>
					<HeroSlide kicker='OPERATIONS · WEEK 41' title='Q3 targets by region' bars={[ 42, 64, 88, 52, 70 ]}>
						<Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', alignItems: 'center', gap: '5px', p: '3px 8px 3px 3px', borderRadius: radius.pill, bgcolor: brand.navy700, color: brand.white, fontSize: 9, [narrow]: { display: 'none' } }}>
							<MockAvatar initials='FA' color={brand.orange} size={18} />
							Farhana is presenting
						</Box>
					</HeroSlide>
					<Box sx={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
						{HERO_TEAM.map((person) => <HeroTile key={person.initials} {...person} />)}
					</Box>
					<Panel sx={{ flex: 1.1, [narrow]: { display: 'none' } }}>
						<Box sx={mockText(10, 700)}>Chat</Box>
						<Box sx={{ borderRadius: '6px', bgcolor: brand.surfaceSubtle, px: 0.75, py: 0.5 }}>
							<Box sx={mockText(8, 700, brand.blueDark)}>Rahim</Box>
							<Box sx={mockText(9)}>Can you share the deck after?</Box>
						</Box>
						<Box sx={{ alignSelf: 'flex-end', borderRadius: '6px', bgcolor: brand.blueLight, px: 0.75, py: 0.5 }}>
							<Box sx={mockText(8, 700, brand.blueDark)}>Farhana</Box>
							<Box sx={mockText(9)}>Yes, sending it now.</Box>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, borderRadius: '6px', border: `1px solid ${brand.border}`, px: 0.75, py: 0.5, minWidth: 0 }}>
							<Box sx={{ px: '3px', borderRadius: '3px', bgcolor: '#d93b3b', ...mockText(7, 700, brand.white) } as SxProps<Theme>}>PDF</Box>
							<Box sx={{ ...mockText(9, 500), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as SxProps<Theme>}>Q3-targets.pdf</Box>
						</Box>
					</Panel>
				</>
			);
	}
};

const HERO_CONTROLS: { icon: SvgIconComponent; record?: boolean }[] = [
	{ icon: MicRounded },
	{ icon: VideocamRounded },
	{ icon: ScreenShareRounded },
	{ icon: SubtitlesRounded },
	{ icon: FiberManualRecordRounded, record: true },
];

// The app window: a title bar with the room name and a status pill, the scene, and the controls.
const HeroSceneFrame = ({ scene }: { scene: HeroScene }): React.JSX.Element => (
	<Box sx={{ width: '100%', aspectRatio: '16 / 10', display: 'flex', flexDirection: 'column', bgcolor: brand.white, borderRadius: '16px', overflow: 'hidden', boxShadow: `0 0 0 1px ${brand.border}, 0 24px 48px rgba(4, 44, 106, 0.16)` }}>
		<Box sx={{ height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, borderBottom: `1px solid ${brand.border}` }}>
			{[ 0, 1, 2 ].map((dot) => <Box key={dot} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: brand.border }} />)}
			<Box sx={{ ml: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.25, borderRadius: radius.pill, bgcolor: brand.surfaceSubtle, color: brand.textSecondary, fontSize: 11, fontFamily: '\'Roboto Mono\', ui-monospace, monospace' }}>
				<LockRounded sx={{ fontSize: 11 }} />
				<Box component='span' sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{scene.room}</Box>
			</Box>
			<Box sx={{ ml: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', px: 1, py: 0.25, borderRadius: radius.pill, bgcolor: scene.secure ? '#e3f4ea' : '#fdecec', color: scene.secure ? '#1d6b45' : brand.error, fontSize: 10, fontWeight: 700, letterSpacing: '0.02em' }}>
				<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
				{scene.status}
			</Box>
		</Box>
		<Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 1.25 }, p: { xs: 1, sm: 1.25 }, bgcolor: brand.navy900 }}>
			<Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 1 }}>
				<HeroSceneBody scene={scene.key} />
			</Box>
			<Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'center', gap: 0.75 }}>
				{HERO_CONTROLS.map(({ icon: Icon, record }, index) => (
					<Box key={index} sx={{ width: { xs: 24, sm: 28 }, height: { xs: 24, sm: 28 }, borderRadius: radius.pill, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255, 255, 255, 0.14)', color: record ? '#ff6b6b' : brand.white }}>
						<Icon sx={{ fontSize: { xs: 13, sm: 15 } }} />
					</Box>
				))}
				<Box sx={{ width: { xs: 34, sm: 42 }, height: { xs: 24, sm: 28 }, borderRadius: radius.pill, display: 'grid', placeItems: 'center', bgcolor: '#d93b3b', color: brand.white }}>
					<CallEndRounded sx={{ fontSize: { xs: 14, sm: 16 } }} />
				</Box>
			</Box>
		</Box>
	</Box>
);

// Decorative chips that overlap the frame edges; hidden below 768 px.
const FloatingChip = ({ children, sx }: { children: React.ReactNode; sx: SxProps<Theme> }): React.JSX.Element => (
	<Box
		aria-hidden
		sx={{
			position: 'absolute',
			display: { xs: 'none', md: 'inline-flex' },
			alignItems: 'center',
			gap: 1,
			px: 1.75,
			py: 1,
			borderRadius: radius.sm,
			bgcolor: brand.white,
			border: `1px solid ${brand.border}`,
			color: brand.navy,
			fontSize: 14,
			fontWeight: 500,
			boxShadow: '0 8px 24px rgba(4, 44, 106, 0.12)',
			whiteSpace: 'nowrap',
			...sx,
		} as SxProps<Theme>}
	>
		{children}
	</Box>
);

const sceneButtonSx = (active: boolean): SxProps<Theme> => ({
	height: 36,
	px: 1.75,
	border: 0,
	borderRadius: radius.sm,
	bgcolor: active ? brand.navy : 'transparent',
	color: active ? brand.white : brand.navy,
	font: 'inherit',
	fontSize: 14,
	fontWeight: 500,
	cursor: 'pointer',
	whiteSpace: 'nowrap',
	transition: `background-color ${motion.base}ms ${motion.ease}`,
	'&:hover': { bgcolor: active ? brand.navy : brand.blueLight },
	...focusRing(),
});

const HeroScenes = ({ captions }: { captions: boolean }): React.JSX.Element => {
	const [ index, setIndex ] = useState(0);
	const [ paused, setPaused ] = useState(false);
	const reduceMotion = useMediaQuery(reducedMotion);
	const current = HERO_SCENES[index];

	// Rotates while the tab is visible; stops for reduced motion or once the visitor pauses or picks a scene.
	useEffect(() => {
		if (paused || reduceMotion) return;

		const timer = window.setInterval(() => {
			if (!document.hidden) setIndex((value) => (value + 1) % HERO_SCENES.length);
		}, HERO_SCENE_MS);

		return () => window.clearInterval(timer);
	}, [ paused, reduceMotion ]);

	const choose = (next: number): void => {
		setIndex(next);
		setPaused(true);
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.25 }}>
			<Box sx={{ position: 'relative', width: '100%' }}>
				<Box aria-hidden sx={{ position: 'absolute', inset: '6%', borderRadius: '50%', bgcolor: brand.blue, opacity: 0.16, filter: 'blur(70px)' }} />
				{/* All scenes share one grid cell and crossfade, so the frame never changes height. */}
				<Box sx={{ position: 'relative', display: 'grid' }}>
					{HERO_SCENES.map((scene, sceneIndex) => {
						const active = sceneIndex === index;

						return (
							<Box
								key={scene.key}
								role={active ? 'img' : undefined}
								aria-label={active ? scene.mockLabel : undefined}
								aria-hidden={active ? undefined : true}
								sx={{
									gridArea: '1 / 1',
									opacity: active ? 1 : 0,
									visibility: active ? 'visible' : 'hidden',
									transition: `opacity 450ms ease, visibility 0s linear ${active ? 0 : 450}ms`,
									[reducedMotion]: { transition: 'none' },
								}}
							>
								<HeroSceneFrame scene={scene} />
							</Box>
						);
					})}
				</Box>
				<FloatingChip sx={{ top: -18, right: 28 }}>
					<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: current.chipDot }} />
					{current.chip}
				</FloatingChip>
				{captions && (
					<FloatingChip sx={{ bottom: 52, left: -22 }}>
						<Box sx={{ px: '5px', py: '1px', borderRadius: '4px', bgcolor: brand.navy, color: brand.white, fontSize: 10, fontWeight: 700 }}>CC</Box>
						{strings.hero.captionsChip}
					</FloatingChip>
				)}
			</Box>

			<Box role='group' aria-label={strings.hero.scenesLabel} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 0.5, borderRadius: radius.md, bgcolor: brand.surfaceSubtle, border: `1px solid ${brand.border}`, maxWidth: '100%' }}>
				<IconButton
					onClick={() => setPaused(!paused)}
					aria-label={paused ? strings.hero.playScenes : strings.hero.pauseScenes}
					sx={{ width: 36, height: 36, borderRadius: radius.sm, bgcolor: brand.blueLight, color: brand.navy, '&:hover': { bgcolor: brand.border }, ...focusRing() }}
				>
					{paused ? <PlayArrowRounded sx={{ fontSize: 18 }} /> : <PauseRounded sx={{ fontSize: 18 }} />}
				</IconButton>
				{/* Labels from 600 px; dots on phones, each still named for screen readers. */}
				<Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5 }}>
					{HERO_SCENES.map((scene, sceneIndex) => (
						<Box key={scene.key} component='button' type='button' aria-pressed={sceneIndex === index} onClick={() => choose(sceneIndex)} sx={sceneButtonSx(sceneIndex === index)}>
							{scene.label}
						</Box>
					))}
				</Box>
				<Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.25, pr: 0.5 }}>
					{HERO_SCENES.map((scene, sceneIndex) => (
						<Box
							key={scene.key}
							component='button'
							type='button'
							aria-label={scene.label}
							aria-pressed={sceneIndex === index}
							onClick={() => choose(sceneIndex)}
							sx={{ width: 32, height: 36, p: 0, border: 0, bgcolor: 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer', borderRadius: radius.sm, ...focusRing() } as SxProps<Theme>}
						>
							<Box sx={{ width: sceneIndex === index ? 22 : 8, height: 8, borderRadius: radius.pill, bgcolor: sceneIndex === index ? brand.navy : brand.borderStrong, transition: `width ${motion.base}ms ${motion.ease}` }} />
						</Box>
					))}
				</Box>
			</Box>
		</Box>
	);
};

// ── Hero actions (UpdateHomePageDesignplan.md §4.1) ──
// Start a meeting next to an inline join field, so a participant joins without
// opening a dialog. Below 600 px the field becomes a button that opens the Join sheet.
const HeroActions = ({ ctasRef, onStart, onOpenJoin }: { ctasRef: React.Ref<HTMLDivElement>; onStart: () => void; onOpenJoin: () => void }): React.JSX.Element => {
	const navigate = useNavigate();
	const [ room, setRoom ] = useState('');
	const [ notice, setNotice ] = useState<string | null>(null);
	const [ joining, setJoining ] = useState(false);
	const error = validateRoomName(room);

	const join = (): void => {
		if (joining || !room || error) return;

		setJoining(true);
		// Load the room page before navigating, so the spinner stays until it can render.
		import('../App')
			.catch(() => undefined)
			.finally(() => navigate(`/${room}`));
	};

	const onPaste = (event: React.ClipboardEvent<HTMLInputElement>): void => {
		const fromLink = roomFromPastedUrl(event.clipboardData.getData('text'));

		if (!fromLink) return;

		event.preventDefault();
		setRoom(fromLink);
		setNotice(strings.hero.fromLink);
	};

	const hint = joining ? strings.hero.joining : error ?? notice ?? strings.hero.joinHelper;

	return (
		<Box sx={{ width: '100%' }}>
			<Box ref={ctasRef} sx={{ mt: { xs: 3.5, md: 4.5 }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch', gap: 1.5 }}>
				<Button
					variant='contained'
					color='secondary'
					size='large'
					endIcon={<ArrowForwardRounded />}
					onClick={onStart}
					onMouseEnter={prefetchApp}
					onFocus={prefetchApp}
					sx={{ flexShrink: 0, minHeight: { xs: 52, sm: 56 }, fontSize: 17, boxShadow: '0 8px 20px rgba(254, 155, 42, 0.28)', '&:hover': { bgcolor: brand.orangeDark, boxShadow: 'none' }, ...focusRing() }}
				>
					{strings.common.start}
				</Button>

				<Box
					sx={{
						flex: 1,
						minWidth: 0,
						height: 56,
						boxSizing: 'border-box',
						display: { xs: 'none', sm: 'flex' },
						alignItems: 'center',
						gap: 0.75,
						p: '5px 5px 5px 14px',
						border: `1.5px solid ${error ? brand.error : brand.borderStrong}`,
						borderRadius: radius.md,
						bgcolor: brand.white,
						transition: `border-color ${motion.fast}ms ${motion.ease}, box-shadow ${motion.fast}ms ${motion.ease}`,
						'&:focus-within': { borderColor: error ? brand.error : brand.blue, boxShadow: `0 0 0 3px ${error ? 'rgba(179, 38, 30, 0.15)' : 'rgba(26, 129, 236, 0.25)'}` },
					}}
				>
					<LinkRounded aria-hidden sx={{ fontSize: 20, color: brand.textSecondary, flexShrink: 0 }} />
					<Box component='label' htmlFor='ek-hero-room' sx={visuallyHidden}>{strings.hero.joinLabel}</Box>
					<Box
						component='input'
						id='ek-hero-room'
						type='text'
						value={room}
						placeholder={strings.hero.joinLabel}
						autoComplete='off'
						autoCapitalize='none'
						autoCorrect='off'
						spellCheck={false}
						maxLength={128}
						aria-describedby='ek-hero-hint'
						aria-invalid={Boolean(error)}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
							setRoom(event.target.value.toLowerCase());
							setNotice(null);
						}}
						onPaste={onPaste}
						onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
							if (event.key === 'Enter') join();
						}}
						onFocus={prefetchApp}
						sx={{
							flex: 1,
							minWidth: 0,
							height: '100%',
							p: 0,
							border: 0,
							outline: 0,
							bgcolor: 'transparent',
							color: brand.navy,
							font: 'inherit',
							fontFamily: '\'Roboto Mono\', ui-monospace, monospace',
							fontSize: 15,
							fontWeight: 500,
							'&::placeholder': { color: brand.borderStrong, fontFamily: 'Roboto, system-ui, sans-serif', fontWeight: 400, opacity: 1 },
						}}
					/>
					<Button
						variant='contained'
						disableElevation
						loading={joining}
						disabled={!room || Boolean(error)}
						onClick={join}
						onMouseEnter={prefetchApp}
						sx={{ flexShrink: 0, minHeight: 44, height: 44, px: 2.5, borderRadius: radius.sm, bgcolor: brand.navy, color: brand.white, '&:hover': { bgcolor: brand.navy700 }, '&.Mui-disabled': { bgcolor: brand.border, color: brand.textSecondary }, ...focusRing() }}
					>
						{strings.hero.join}
					</Button>
				</Box>

				<Button
					variant='outlined'
					size='large'
					startIcon={<LinkRounded />}
					onClick={onOpenJoin}
					sx={{ display: { xs: 'inline-flex', sm: 'none' }, minHeight: 52, fontSize: 17, color: brand.blueDark, borderColor: brand.blueDark, borderWidth: 1.5, '&:hover': { borderColor: brand.blueDark, bgcolor: brand.blueLight }, ...focusRing() }}
				>
					{strings.hero.joinPhone}
				</Button>
			</Box>

			<Typography
				id='ek-hero-hint'
				aria-live='polite'
				sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5, mt: 1.25, minHeight: 20, fontSize: 14, lineHeight: '20px', color: error ? brand.error : brand.textSecondary }}
			>
				{error && <ErrorOutlineRounded aria-hidden sx={{ fontSize: 16 }} />}
				{hint}
			</Typography>
			<Typography sx={{ display: { xs: 'block', sm: 'none' }, mt: 1.25, fontSize: 13, color: brand.textSecondary, textAlign: 'center' }}>
				{strings.hero.joinPhoneHelper}
			</Typography>
		</Box>
	);
};

// ── Quick Join (§6.7) ──

type QuickJoinView = 'join' | 'host';

// Phones get a bottom sheet that slides up.
const SlideUp = React.forwardRef((props: TransitionProps & { children: React.ReactElement }, ref: React.Ref<unknown>) => (
	<Slide direction='up' ref={ref} {...props} />
));

const LazyQRCode = lazy(() => import('react-qrcode-logo').then((module) => ({ default: module.QRCode })));

const secondaryButtonSx: SxProps<Theme> = {
	flex: 1,
	minHeight: 44,
	color: brand.blueDark,
	borderColor: brand.blueDark,
	whiteSpace: 'nowrap',
	'&:hover': { borderColor: brand.blueDark, bgcolor: brand.blueLight },
	...focusRing(),
};

type QuickJoinProps = {
	open: boolean;
	view: QuickJoinView;
	onViewChange: React.Dispatch<QuickJoinView>;
	onClose: () => void;
	qrCodeEnabled: boolean;
	privacyUrl: string;
	onToast: React.Dispatch<string>;
	rooms: Room[];
	preferMyRooms: boolean;
};

const QuickJoinDialog = ({ open, view, onViewChange, onClose, qrCodeEnabled, privacyUrl, onToast, rooms, preferMyRooms }: QuickJoinProps): React.JSX.Element => {
	const navigate = useNavigate();
	const phone = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
	// Starts empty: the user types or pastes the room name (no random fill-in).
	const [ room, setRoom ] = useState('');
	const [ notice, setNotice ] = useState<string | null>(null);
	const [ announcement, setAnnouncement ] = useState('');
	const [ joining, setJoining ] = useState(false);
	const [ copied, setCopied ] = useState(false);
	const [ showQr, setShowQr ] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const timers = useRef<number[]>([]);

	const [ entry, setEntry ] = useState<'enter' | 'rooms'>('enter');
	const roomNames = rooms.map((item) => item.name ?? '').filter(Boolean);
	const host = view === 'host';
	// "Enter room name | My rooms" for signed-in room owners, Join view only (§6.7).
	const showMyRooms = !host && roomNames.length > 0;
	const pickingRoom = showMyRooms && entry === 'rooms';
	const error = validateRoomName(room);
	const url = roomUrl(room);
	const qrVisible = qrCodeEnabled && room !== '' && !error && (!phone || showQr || host);

	const later = (callback: () => void, ms: number): void => {
		timers.current.push(window.setTimeout(callback, ms));
	};

	useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

	// Opening the dialog starts loading the meeting app (§6.7, Join row).
	useEffect(() => {
		if (open) prefetchApp();
	}, [ open ]);

	// Account menu → My rooms opens the dialog on the room list.
	useEffect(() => {
		if (open && preferMyRooms && showMyRooms) chooseEntry('rooms');
	}, [ open, preferMyRooms, showMyRooms ]);

	const chooseEntry = (next: 'enter' | 'rooms'): void => {
		setEntry(next);
		if (next === 'rooms' && !roomNames.includes(room)) setRoom(roomNames[0]);
	};

	const announce = (message: string): void => {
		setAnnouncement(message);
		later(() => setAnnouncement(''), 1000);
	};

	const join = (name: string): void => {
		if (joining || validateRoomName(name) || !name) return;

		setJoining(true);
		// Load the room page before navigating, so the spinner stays until it can render.
		import('../App')
			.catch(() => undefined)
			.finally(() => navigate(`/${name}`));
	};

	const copyLink = (): void => {
		navigator.clipboard.writeText(url).then(() => {
			setCopied(true);
			announce(strings.quickJoin.linkCopied);
			later(() => setCopied(false), 2000);
		}, () => onToast(strings.quickJoin.copyFailed));
	};

	// Copies the QR code as a PNG; where images can't go on the clipboard it saves the PNG instead.
	const copyQr = (): void => {
		const canvas = document.getElementById('ek-qr-canvas') as HTMLCanvasElement | null;

		if (!canvas) return;

		const saveInstead = (): void => {
			const link = document.createElement('a');

			link.href = canvas.toDataURL('image/png');
			link.download = `${room}-qr.png`;
			link.click();
			onToast(strings.quickJoin.qrSaved);
		};

		if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
			saveInstead();

			return;
		}

		// Safari keeps the user gesture only if the ClipboardItem is created synchronously.
		const png = new Promise<Blob>((resolve, reject) => {
			canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('QR export failed'))), 'image/png');
		});

		navigator.clipboard.write([ new ClipboardItem({ 'image/png': png }) ])
			.then(() => onToast(strings.quickJoin.qrCopied), saveInstead);
	};

	const onPaste = (event: React.ClipboardEvent<HTMLInputElement>): void => {
		const fromLink = roomFromPastedUrl(event.clipboardData.getData('text'));

		if (!fromLink) return;

		event.preventDefault();
		setRoom(fromLink);
		setNotice(strings.quickJoin.fromLink);
		announce(strings.quickJoin.fromLink);
		later(() => setNotice(null), 3000);
	};

	const hint = error ?? notice ?? strings.quickJoin.helper;
	const title = host ? strings.quickJoin.hostTitle : strings.quickJoin.joinTitle;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			aria-labelledby='ek-qj-title'
			fullWidth
			slots={phone ? { transition: SlideUp } : undefined}
			slotProps={{
				backdrop: { sx: { bgcolor: 'rgba(4, 44, 106, 0.6)' } },
				paper: {
					sx: phone ? {
						m: 0,
						width: '100%',
						maxWidth: '100%',
						maxHeight: '90svh',
						alignSelf: 'flex-end',
						borderRadius: `${radius.lg} ${radius.lg} 0 0`,
						p: 2.5,
						pt: 1.5,
						pb: 'calc(20px + env(safe-area-inset-bottom))',
					} : {
						maxWidth: 480,
						borderRadius: radius.lg,
						boxShadow: shadow[3],
						p: 3.5,
						overflow: 'visible',
					},
				},
			}}
		>
			{phone && <Box aria-hidden sx={{ width: 36, height: 4, borderRadius: radius.pill, bgcolor: brand.border, mx: 'auto', mb: 1.5 }} />}

			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
				<Tabs
					value={view}
					onChange={(_event, value: QuickJoinView) => onViewChange(value)}
					aria-label={strings.quickJoin.viewsLabel}
					slotProps={{ indicator: { sx: { display: 'none' } } }}
					sx={{ minHeight: 40, p: 0.5, borderRadius: radius.pill, bgcolor: brand.surfaceSubtle }}
				>
					{([ 'join', 'host' ] as const).map((key) => (
						<Tab
							key={key}
							value={key}
							label={key === 'join' ? strings.quickJoin.tabJoin : strings.quickJoin.tabHost}
							disableFocusRipple
							sx={{
								minHeight: 32,
								minWidth: 72,
								px: 2,
								py: 0.5,
								borderRadius: radius.pill,
								textTransform: 'none',
								fontSize: 15,
								fontWeight: 500,
								color: brand.navy,
								'&.Mui-selected': { bgcolor: brand.navy, color: brand.white },
								...focusRing(),
							}}
						/>
					))}
				</Tabs>
				<IconButton aria-label={strings.quickJoin.close} onClick={onClose} sx={{ width: 44, height: 44, color: brand.navy, mr: -1, ...focusRing() }}>
					<CloseRounded />
				</IconButton>
			</Box>

			<Typography component='h3' id='ek-qj-title' sx={{ fontSize: 22, fontWeight: 700, color: brand.navy, mb: 2 }}>{title}</Typography>

			{showMyRooms && (
				<Tabs
					value={entry}
					onChange={(_event, value: 'enter' | 'rooms') => chooseEntry(value)}
					aria-label={strings.quickJoin.entryLabel}
					variant='fullWidth'
					sx={{ mb: 2, minHeight: 40, borderBottom: `1px solid ${brand.border}`, '& .MuiTabs-indicator': { bgcolor: brand.blueDark, height: 3 } }}
				>
					<Tab value='enter' label={strings.quickJoin.enterRoom} disableFocusRipple sx={{ minHeight: 40, textTransform: 'none', fontSize: 15, fontWeight: 500, color: brand.textSecondary, '&.Mui-selected': { color: brand.navy }, ...focusRing() }} />
					<Tab value='rooms' label={strings.quickJoin.myRooms} disableFocusRipple sx={{ minHeight: 40, textTransform: 'none', fontSize: 15, fontWeight: 500, color: brand.textSecondary, '&.Mui-selected': { color: brand.navy }, ...focusRing() }} />
				</Tabs>
			)}

			{pickingRoom ? (
				<TextField
					select
					fullWidth
					autoFocus
					label={strings.quickJoin.pickRoom}
					value={roomNames.includes(room) ? room : roomNames[0]}
					onChange={(event) => setRoom(event.target.value)}
					slotProps={{
						htmlInput: { 'aria-describedby': 'ek-qj-hint' },
						input: { sx: { height: 52, fontFamily: '\'Roboto Mono\', ui-monospace, monospace', borderRadius: radius.md } },
						select: {
							MenuProps: {
								slotProps: { paper: { sx: { '& .MuiMenuItem-root.Mui-selected, & .MuiMenuItem-root.Mui-selected:hover': { bgcolor: brand.blueLight, color: brand.navy } } } },
							},
						},
					}}
				>
					{roomNames.map((name) => <MenuItem key={name} value={name} sx={{ fontFamily: '\'Roboto Mono\', ui-monospace, monospace' }}>{name}</MenuItem>)}
				</TextField>
			) : (
				<TextField
					inputRef={inputRef}
					autoFocus
					fullWidth
					label={strings.quickJoin.roomName}
					value={room}
					error={Boolean(error)}
					onChange={(event) => setRoom(event.target.value.toLowerCase())}
					onPaste={onPaste}
					onKeyDown={(event) => {
						if (event.key === 'Enter') join(room);
					}}
					onFocus={prefetchApp}
					slotProps={{
						htmlInput: {
							'aria-describedby': 'ek-qj-hint',
							'aria-invalid': Boolean(error),
							autoCapitalize: 'none',
							autoCorrect: 'off',
							spellCheck: false,
							maxLength: 128,
						},
						input: {
							sx: { height: 52, fontFamily: '\'Roboto Mono\', ui-monospace, monospace', borderRadius: radius.md },
						},
					}}
				/>
			)}
			<Typography
				id='ek-qj-hint'
				sx={{ mt: 0.75, minHeight: 20, fontSize: 14, lineHeight: '20px', color: error ? brand.error : brand.textSecondary, display: 'flex', alignItems: 'center', gap: 0.5 }}
			>
				{error && <ErrorOutlineRounded aria-hidden sx={{ fontSize: 16 }} />}
				{hint}
			</Typography>

			<Button
				fullWidth
				variant='contained'
				color='secondary'
				size='large'
				loading={joining}
				loadingPosition='end'
				disabled={Boolean(error) || room === ''}
				endIcon={<ArrowForwardRounded />}
				onClick={() => join(room)}
				onMouseEnter={prefetchApp}
				aria-busy={joining}
				sx={{
					mt: 2,
					boxShadow: 'none',
					'&:hover': { bgcolor: brand.orangeDark, boxShadow: 'none' },
					'&:active': { transform: 'translateY(1px)', boxShadow: 'inset 0 2px 4px rgba(4, 44, 106, 0.2)' },
					'&.Mui-disabled': { bgcolor: brand.orangeDisabled, color: 'rgba(4, 44, 106, 0.5)' },
					...focusRing(),
				}}
			>
				{host ? strings.quickJoin.hostStart : strings.quickJoin.join}
			</Button>

			<Box sx={{ mt: 1.5, display: 'flex', gap: 1.5 }}>
				{!host && (
					<Button variant='outlined' onClick={() => join(randomRoomName())} disabled={joining} sx={secondaryButtonSx}>
						{strings.quickJoin.startNew}
					</Button>
				)}
				<Button
					variant='outlined'
					onClick={copyLink}
					disabled={Boolean(error) || room === ''}
					startIcon={copied ? <CheckRounded /> : <ContentCopyRounded />}
					sx={{
						...secondaryButtonSx,
						...(copied ? { bgcolor: brand.orangeLight, borderColor: brand.orangeLight, color: brand.navy, '&:hover': { bgcolor: brand.orangeLight, borderColor: brand.orangeLight } } : {}),
						'& .MuiButton-startIcon': { transition: `transform ${motion.fast}ms ${motion.ease}`, transform: copied ? 'scale(1)' : 'scale(0.96)' },
					} as SxProps<Theme>}
				>
					{copied ? strings.quickJoin.copied : strings.quickJoin.copy}
				</Button>
			</Box>

			<Divider sx={{ my: 2, borderColor: brand.border }} />

			<Box sx={{ p: 1.75, borderRadius: radius.md, bgcolor: brand.surfaceSubtle, border: `1px solid ${brand.border}`, display: 'flex', alignItems: 'center', gap: 2 }}>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography sx={{ fontSize: 12, color: brand.textSecondary, mb: 0.25 }}>{strings.quickJoin.linkLabel}</Typography>
					<Typography title={url} sx={{ fontFamily: '\'Roboto Mono\', ui-monospace, monospace', fontSize: 14, color: brand.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
						{url.replace(/^https?:\/\//, '')}
					</Typography>
					{qrCodeEnabled && phone && !host && (
						<Link component='button' type='button' onClick={() => setShowQr(!showQr)} sx={{ mt: 0.5, fontSize: 14, color: brand.blueDark, ...focusRing() }}>
							{showQr ? strings.quickJoin.hideQr : strings.quickJoin.showQr}
						</Link>
					)}
					{qrVisible && (
						<Link component='button' type='button' onClick={copyQr} sx={{ mt: 0.5, display: 'block', fontSize: 14, color: brand.blueDark, ...focusRing() }}>
							{strings.quickJoin.copyQr}
						</Link>
					)}
				</Box>
				{qrVisible && (
					<Box sx={{ width: 96, height: 96, flexShrink: 0, borderRadius: radius.sm, overflow: 'hidden', bgcolor: brand.white, '& canvas': { display: 'block', width: '96px !important', height: '96px !important' } }}>
						<Suspense>
							<LazyQRCode id='ek-qr-canvas' value={url} size={192} quietZone={12} fgColor={brand.navy} bgColor={brand.white} />
						</Suspense>
					</Box>
				)}
			</Box>

			{privacyUrl && (
				<Typography sx={{ mt: 1.5, fontSize: 13, color: brand.textSecondary }}>
					{strings.quickJoin.consent}{' '}
					<Link href={privacyUrl} target='_blank' rel='noopener' sx={{ color: brand.blueDark, ...focusRing() }}>{strings.quickJoin.privacy}</Link>
				</Typography>
			)}

			<Box aria-live='polite' sx={visuallyHidden}>{announcement}</Box>
		</Dialog>
	);
};

// ── Feature mocks (§7.3–§7.5) ──

type MockVariant = 'classes' | 'meetings' | 'recording' | 'transcription' | 'chat' | 'admin';

const mockText = (size: number, weight = 400, color: string = brand.navy): SxProps<Theme> => ({ fontSize: size, fontWeight: weight, color, lineHeight: 1.35 });

const Stage = ({ children, light }: { children: React.ReactNode; light?: boolean }): React.JSX.Element => (
	<Box sx={{ flex: 1, minWidth: 0, display: 'flex', gap: 1.25, p: 1.5, bgcolor: light ? brand.surfaceSubtle : brand.navy900 }}>{children}</Box>
);

const Panel = ({ children, sx }: { children: React.ReactNode; sx?: SxProps<Theme> }): React.JSX.Element => (
	<Box sx={{ borderRadius: radius.sm, bgcolor: brand.white, p: 1.25, display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0, ...sx } as SxProps<Theme>}>{children}</Box>
);

const VideoTile = ({ initials, color, label }: { initials: string; color: string; label?: string }): React.JSX.Element => (
	<Box sx={{ position: 'relative', borderRadius: radius.sm, bgcolor: brand.navy700, display: 'grid', placeItems: 'center', minHeight: 0 }}>
		<MockAvatar initials={initials} color={color} />
		{label && <Box sx={{ position: 'absolute', left: 6, bottom: 4, ...mockText(9, 500, brand.white) } as SxProps<Theme>}>{label}</Box>}
	</Box>
);

const Pill = ({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }): React.JSX.Element => (
	<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, alignSelf: 'flex-start', px: 1, py: 0.25, borderRadius: radius.pill, bgcolor: bg, color, fontSize: 10, fontWeight: 700 }}>{children}</Box>
);

const TRANSCRIPT_LINES = [
	{ time: '00:41:52', speaker: 'Dr. Ahmed', text: 'The client sends SYN to open the connection.' },
	{ time: '00:42:01', speaker: 'Dr. Ahmed', text: 'The server answers with SYN-ACK.' },
	{ time: '00:42:05', speaker: 'Nadia', text: 'And then the client sends ACK?' },
	{ time: '00:42:10', speaker: 'Dr. Ahmed', text: 'Exactly. That is the three-way handshake.' },
];

const TranscriptPanel = (): React.JSX.Element => (
	<Panel sx={{ flex: 1, gap: 1, p: 1.75 }}>
		<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
			<Box sx={mockText(12, 700)}>Transcript</Box>
			<Pill color={brand.white} bg='#d93b3b'>● REC</Pill>
		</Box>
		{TRANSCRIPT_LINES.map((line) => (
			<Box key={line.time} sx={{ display: 'flex', gap: 1 }}>
				<Box sx={{ ...mockText(10, 500, brand.textSecondary), fontVariantNumeric: 'tabular-nums', flexShrink: 0 } as SxProps<Theme>}>{line.time}</Box>
				<Box sx={{ minWidth: 0 }}>
					<Box sx={mockText(10, 700, brand.blueDark)}>{line.speaker}</Box>
					<Box sx={mockText(11)}>{line.text}</Box>
				</Box>
			</Box>
		))}
	</Panel>
);

const ProductMock = ({ variant }: { variant: MockVariant }): React.JSX.Element => {
	switch (variant) {
		case 'meetings':
			return (
				<Stage>
					<Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '1fr 1fr', gap: 1 }}>
						{[ ...MOCK_STUDENTS, { initials: 'FA', color: brand.orange }, { initials: 'MR', color: '#0f766e' } ].map((person) => <VideoTile key={person.initials} {...person} />)}
					</Box>
					<Panel sx={{ width: '30%', flexShrink: 0 }}>
						<Box sx={mockText(11, 700)}>Lobby</Box>
						<Pill color={brand.navy} bg={brand.orangeLight}>2 waiting</Pill>
						{[ 'Imran H.', 'Sadia K.' ].map((name) => (
							<Box key={name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
								<Box sx={mockText(10)}>{name}</Box>
								<Box sx={{ px: 0.75, borderRadius: radius.pill, bgcolor: brand.blueDark, ...mockText(9, 700, brand.white) } as SxProps<Theme>}>Admit</Box>
							</Box>
						))}
						<Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 0.5, ...mockText(10, 500, brand.textSecondary) } as SxProps<Theme>}><LockRounded sx={{ fontSize: 12 }} />Room locked</Box>
					</Panel>
				</Stage>
			);
		case 'recording':
			return (
				<Stage>
					<Box sx={{ flex: 1.2, position: 'relative', borderRadius: radius.sm, bgcolor: brand.navy700, display: 'grid', placeItems: 'center' }}>
						<MockAvatar initials='FA' color={brand.orange} size={44} />
						<Box sx={{ position: 'absolute', top: 8, left: 8 }}><Pill color={brand.white} bg='#d93b3b'>● REC 00:42:10</Pill></Box>
					</Box>
					<Panel sx={{ flex: 1 }}>
						<Box sx={mockText(11, 700)}>Recordings</Box>
						{[ [ 'CSE 101 · Lecture 12', '1:28:40' ], [ 'CSE 101 · Lecture 11', '1:31:05' ], [ 'Lab briefing', '0:22:17' ] ].map(([ name, length ]) => (
							<Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, borderRadius: '6px', bgcolor: brand.surfaceSubtle, px: 0.75, py: 0.5 }}>
								<Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: brand.blueLight, display: 'grid', placeItems: 'center', color: brand.blueDark }}><FiberManualRecordRounded sx={{ fontSize: 10 }} /></Box>
								<Box sx={{ flex: 1, minWidth: 0, ...mockText(10) } as SxProps<Theme>}>{name}</Box>
								<Box sx={{ ...mockText(9, 500, brand.textSecondary), fontVariantNumeric: 'tabular-nums' } as SxProps<Theme>}>{length}</Box>
							</Box>
						))}
					</Panel>
				</Stage>
			);
		case 'transcription':
			return (
				<Stage>
					<Box sx={{ flex: 0.8, display: 'grid', gridTemplateRows: '1fr 1fr', gap: 1 }}>
						<VideoTile initials='FA' color={brand.orange} label='Dr. Ahmed' />
						<VideoTile initials='NA' color={MOCK_STUDENTS[0].color} label='Nadia' />
					</Box>
					<TranscriptPanel />
				</Stage>
			);
		case 'chat':
			return (
				<Stage light>
					<Panel sx={{ flex: 1, gap: 1 }}>
						<Box sx={mockText(11, 700)}>Chat</Box>
						{MOCK_CHAT.map((message, index) => (
							<Box key={message.name} sx={{ alignSelf: index === 2 ? 'flex-end' : 'flex-start', maxWidth: '75%', borderRadius: '8px', bgcolor: index === 2 ? brand.blueLight : brand.surfaceSubtle, px: 1, py: 0.5 }}>
								<Box sx={mockText(9, 700, brand.blueDark)}>{message.name}</Box>
								<Box sx={mockText(11)}>{message.text}</Box>
							</Box>
						))}
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, borderRadius: '8px', border: `1px solid ${brand.border}`, px: 1, py: 0.75, alignSelf: 'flex-start' }}>
							<Box sx={{ px: 0.5, borderRadius: '4px', bgcolor: '#d93b3b', ...mockText(8, 700, brand.white) } as SxProps<Theme>}>PDF</Box>
							<Box sx={mockText(10, 500)}>Lecture-12-slides.pdf</Box>
							<Box sx={mockText(9, 400, brand.textSecondary)}>2.4 MB</Box>
						</Box>
						<Box sx={{ mt: 'auto', borderRadius: radius.pill, border: `1px solid ${brand.border}`, px: 1.25, py: 0.5, ...mockText(10, 400, brand.textSecondary) } as SxProps<Theme>}>Write a message…</Box>
					</Panel>
				</Stage>
			);
		case 'admin':
			return (
				<Stage light>
					<Panel sx={{ flex: 1 }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
							<Box sx={mockText(11, 700)}>Rooms</Box>
							<Pill color={brand.white} bg={brand.blueDark}>+ New room</Pill>
						</Box>
						{[ [ 'Video-Conferencing', 'Dr. Ahmed', '32' ], [ 'eee-lab', 'M. Rahman', '18' ], [ 'senate', 'Registrar', '9' ], [ 'phd-seminar', 'S. Karim', '14' ] ].map(([ name, owner, people ], index) => (
							<Box key={name} sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.5fr', gap: 1, py: 0.5, borderTop: index ? `1px solid ${brand.border}` : 'none' }}>
								<Box sx={{ ...mockText(10, 500), fontFamily: '\'Roboto Mono\', ui-monospace, monospace' } as SxProps<Theme>}>{name}</Box>
								<Box sx={mockText(10, 400, brand.textSecondary)}>{owner}</Box>
								<Box sx={{ ...mockText(10, 700, brand.blueDark), textAlign: 'right' } as SxProps<Theme>}>{people}</Box>
							</Box>
						))}
					</Panel>
				</Stage>
			);
		case 'classes':
		default:
			return (
				<Stage>
					<Panel sx={{ flex: 2.4, p: 1.75, gap: 1 }}>
						<Box sx={mockText(12, 700)}>Lecture 12: Transport layer</Box>
						<Box sx={{ height: 4, width: 32, borderRadius: radius.pill, bgcolor: brand.orange }} />
						{[ '90%', '72%', '84%' ].map((width) => <Box key={width} sx={{ height: 7, width, borderRadius: radius.pill, bgcolor: brand.blueLight }} />)}
						<Box sx={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-end', gap: '6%', px: '4%', borderBottom: `2px solid ${brand.border}` }}>
							{[ 35, 60, 45, 80, 65 ].map((height) => (
								<Box key={height} sx={{ flex: 1, height: `${height}%`, borderRadius: '4px 4px 0 0', bgcolor: brand.blue, opacity: 0.3 + (height / 150) }} />
							))}
						</Box>
						<Pill color={brand.navy} bg={brand.orangeLight}><PanToolRounded sx={{ fontSize: 11 }} />3 hands raised</Pill>
					</Panel>
					<Box sx={{ flex: 1, display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 1 }}>
						{MOCK_STUDENTS.slice(0, 3).map((student) => <VideoTile key={student.initials} {...student} />)}
					</Box>
				</Stage>
			);
	}
};

// ── Sections (§7.2–§7.10) ──

const SectionShell = ({ id, background, dark, py = layout.sectionY, children, labelledBy }: {
	id: string;
	background: string;
	dark?: boolean;
	py?: number | Partial<Record<'xs' | 'md' | 'lg', number>>;
	children: React.ReactNode;
	labelledBy?: string;
}): React.JSX.Element => (
	<Box
		component='section'
		id={id}
		aria-labelledby={labelledBy ?? `${id}-title`}
		sx={{ position: 'relative', overflow: 'hidden', background, color: dark ? brand.white : brand.navy, py, scrollMarginTop: layout.navH }}
	>
		<Container maxWidth={false} sx={{ position: 'relative', maxWidth: layout.container, px: layout.gutter }}>{children}</Container>
	</Box>
);

const SectionHeader = ({ id, eyebrow, title, intro, dark, center }: {
	id: string;
	eyebrow?: string;
	title: string;
	intro?: string;
	dark?: boolean;
	center?: boolean;
}): React.JSX.Element => (
	<Box data-reveal sx={{ maxWidth: 720, mx: center ? 'auto' : 0, textAlign: center ? 'center' : 'left', mb: { xs: 4, md: 6 } }}>
		{eyebrow && (
			<Typography sx={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? brand.blueOnNavy : brand.blueDark, mb: 1 }}>
				{eyebrow}
			</Typography>
		)}
		<Typography variant='h2' id={`${id}-title`}>{title}</Typography>
		{intro && <Typography sx={{ mt: 2, fontSize: '1.125rem', color: dark ? brand.textOnDarkMuted : brand.textSecondary }}>{intro}</Typography>}
	</Box>
);

const CheckItem = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
	<Box component='li' sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, color: brand.navy }}>
		<CheckCircleRounded aria-hidden sx={{ fontSize: 20, mt: '2px', color: brand.blueDark }} />
		<span>{children}</span>
	</Box>
);

const ArrowLink = ({ href, children, onDark }: { href: string; children: React.ReactNode; onDark?: boolean }): React.JSX.Element => (
	<Link href={href} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 500, color: onDark ? brand.blueOnNavy : brand.blueDark, ...focusRing(onDark) }}>
		{children}
		<ArrowForwardRounded aria-hidden sx={{ fontSize: 18 }} />
	</Link>
);

// Arrow keys, Home and End for a row of tabs with automatic activation (§11).
const rovingKeyDown = <K extends string, >(event: React.KeyboardEvent, keys: K[], current: K, select: React.Dispatch<K>, idPrefix: string): void => {
	const index = keys.indexOf(current);
	const next = {
		ArrowRight: (index + 1) % keys.length,
		ArrowLeft: (index - 1 + keys.length) % keys.length,
		Home: 0,
		End: keys.length - 1,
	}[event.key];

	if (next === undefined) return;

	event.preventDefault();
	select(keys[next]);
	document.getElementById(`${idPrefix}-${keys[next]}`)?.focus();
};

const outlinedBlueSx: SxProps<Theme> = {
	color: brand.blueDark,
	borderColor: brand.blueDark,
	'&:hover': { borderColor: brand.blueDark, bgcolor: brand.blueLight },
	...focusRing(),
};

const marquee = keyframes`
	from { transform: translateX(0); }
	to { transform: translateX(-50%); }
`;

// Logos for "All": one sector after another in turn, so the row mixes sectors.
const mixBySector = (organizations: Organization[]): Organization[] => {
	const bySector = SECTORS.map((sector) => organizations.filter((organization) => organization.sector === sector.key));
	const longest = Math.max(0, ...bySector.map((list) => list.length));

	return Array.from({ length: longest }, (_value, index) => bySector.map((list) => list[index]))
		.flat()
		.filter(Boolean);
};

const LOGO_LIMIT = { phone: 8, desktop: 12 } as const;
const STAT_ACCENTS = [ brand.orange, brand.blue, brand.navy ];
const SECTOR_ICONS = Object.fromEntries(SECTORS.map((sector) => [ sector.key, sector.icon ])) as Record<SectorKey, SvgIconComponent>;

// One card: the logo, or the sector icon with the name (the canvas design).
const LogoCard = ({ organization, copy }: { organization: Organization; copy?: boolean }): React.JSX.Element => {
	const Icon = SECTOR_ICONS[organization.sector];

	return (
		<Box sx={{ width: '100%', height: { xs: 72, md: 76 }, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 1, md: 1.25 }, px: { xs: 1.25, md: 1.75 }, border: '1px solid #e3ebf6', borderRadius: radius.md, bgcolor: brand.white }}>
			{organization.src ? (
				<Box
					component='img'
					src={organization.src}
					alt={copy ? '' : organization.name}
					title={copy ? undefined : organization.name}
					loading='lazy'
					decoding='async'
					referrerPolicy='no-referrer'
					draggable={false}
					sx={{ display: 'block', maxWidth: '100%', height: { xs: 44, md: 48 }, objectFit: 'contain' }}
				/>
			) : (
				<>
					<Icon aria-hidden sx={{ fontSize: { xs: 22, md: 24 }, color: brand.borderStrong, flexShrink: 0 }} />
					<Box component='span' sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 500, lineHeight: 1.3, color: brand.textSecondary }}>{organization.name}</Box>
				</>
			)}
		</Box>
	);
};

const chipSx = (active: boolean): SxProps<Theme> => ({
	flexShrink: 0,
	height: 44,
	px: 2,
	display: 'inline-flex',
	alignItems: 'center',
	gap: 1,
	border: `1px solid ${active ? brand.navy : brand.border}`,
	borderRadius: radius.pill,
	bgcolor: active ? brand.navy : brand.white,
	color: active ? brand.white : brand.navy,
	font: 'inherit',
	fontSize: 15,
	fontWeight: 500,
	cursor: 'pointer',
	whiteSpace: 'nowrap',
	transition: `background-color ${motion.base}ms ${motion.ease}`,
	'&:hover': { bgcolor: active ? brand.navy : brand.blueLight },
	...focusRing(),
});

const TrustedBy = (): React.JSX.Element => {
	const [ sector, setSector ] = useState<SectorKey | 'all'>('all');
	const [ paused, setPaused ] = useState(false);
	const [ expanded, setExpanded ] = useState(false);
	const all = sector === 'all';
	const shown = all ? mixBySector(ORGANIZATIONS) : ORGANIZATIONS.filter((organization) => organization.sector === sector);
	const sectorLabel = SECTORS.find((item) => item.key === sector)?.label;
	const chips = [ { key: 'all' as const, label: strings.trustedBy.all, icon: AppsRounded }, ...SECTORS ];

	const choose = (next: SectorKey | 'all'): void => {
		setSector(next);
		setExpanded(false);
	};

	const grid = (limit: number, columns: Record<string, string>, display: Record<string, string>): React.JSX.Element => (
		<>
			<Box
				component='ul'
				aria-label={sectorLabel ? `${sectorLabel} ${strings.trustedBy.sectorListLabel}` : strings.trustedBy.listLabel}
				sx={{ display, gridTemplateColumns: columns, gap: { xs: 1.5, md: 2 }, listStyle: 'none', m: 0, p: 0 }}
			>
				{(expanded ? shown : shown.slice(0, limit)).map((organization) => (
					<Box component='li' key={organization.name}><LogoCard organization={organization} /></Box>
				))}
			</Box>
			{shown.length > limit && (
				<Box sx={{ display, mt: { xs: 2.5, md: 3 }, justifyContent: 'center' }}>
					<Button
						variant='outlined'
						onClick={() => setExpanded(!expanded)}
						sx={{ minHeight: 48, px: 3, width: { xs: '100%', md: 'auto' }, color: brand.blueDark, borderColor: brand.blueDark, borderWidth: 1.5, bgcolor: brand.white, '&:hover': { borderColor: brand.blueDark, bgcolor: brand.blueLight }, ...focusRing() }}
					>
						{expanded ? strings.trustedBy.showFewer : strings.trustedBy.showAll}
					</Button>
				</Box>
			)}
		</>
	);

	return (
		<Box component='section' id='trusted-by' aria-labelledby='trusted-by-title' sx={{ bgcolor: brand.surfaceSubtle, pt: { xs: 7, md: 10 }, pb: { xs: 6, md: 9 }, overflow: 'hidden', scrollMarginTop: layout.navH }}>
			<Container maxWidth={false} sx={{ maxWidth: layout.container, px: layout.gutter }}>
				{/* Navy text, dark-blue highlight, orange accents (orange is 2.1:1 on white, so never text). */}
				<Box data-reveal sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto' }}>
					<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 1, md: 1.25 }, mb: { xs: 1.5, md: 1.75 } }}>
						<Box aria-hidden sx={{ width: { xs: 16, md: 24 }, height: 3, flexShrink: 0, borderRadius: radius.pill, bgcolor: brand.orange }} />
						<Typography component='p' sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 700, letterSpacing: { xs: '0.08em', md: '0.1em' }, textTransform: 'uppercase', whiteSpace: 'nowrap', color: brand.blueDark }}>
							{strings.trustedBy.eyebrow}
						</Typography>
						<Box aria-hidden sx={{ width: { xs: 16, md: 24 }, height: 3, flexShrink: 0, borderRadius: radius.pill, bgcolor: brand.orange }} />
					</Box>
					<Typography variant='h2' id='trusted-by-title' sx={{ color: brand.navy, fontSize: { xs: 28, md: 40 }, lineHeight: { xs: 1.2, md: 1.15 }, letterSpacing: { xs: '-0.01em', md: '-0.02em' } }}>
						{strings.trustedBy.titleStart}
						<Box component='span' sx={{ color: brand.blueDark }}>{strings.trustedBy.titleHighlight}</Box>
						{strings.trustedBy.titleEnd}
					</Typography>
					<Typography sx={{ mt: { xs: 1.5, md: 2 }, fontSize: { xs: 15, md: 17 }, lineHeight: 1.55, color: brand.textSecondary }}>
						{strings.trustedBy.subtitle}
					</Typography>
				</Box>
			</Container>

			{ORGANIZATIONS.length > 0 ? (
				<>
					{/* Sector filter; on wide screens "All" adds the marquee's pause button after a divider.
					    Phones scroll the chips sideways, with a fade on the right edge. */}
					<Box sx={{ position: 'relative', mt: { xs: 3, md: 4 } }}>
						<Box sx={{ display: 'flex', justifyContent: { md: 'center' }, alignItems: 'center', gap: 1, px: layout.gutter, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
							<Box role='group' aria-label={strings.trustedBy.filterLabel} sx={{ display: 'flex', gap: 1 }}>
								{chips.map((item) => {
									const Icon = item.icon;
									const active = item.key === sector;

									return (
										<Box key={item.key} component='button' type='button' aria-pressed={active} onClick={() => choose(item.key)} sx={chipSx(active)}>
											<Icon aria-hidden sx={{ display: { xs: 'none', md: 'block' }, fontSize: 18, color: active ? brand.white : brand.blueDark }} />
											{item.label}
										</Box>
									);
								})}
							</Box>
							{all && (
								<Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
									<Box aria-hidden sx={{ width: '1px', height: 28, mx: 0.5, bgcolor: brand.border }} />
									<IconButton
										onClick={() => setPaused(!paused)}
										aria-label={paused ? strings.trustedBy.play : strings.trustedBy.pause}
										sx={{ width: 44, height: 44, border: `1px solid ${brand.border}`, bgcolor: brand.white, color: brand.navy, '&:hover': { bgcolor: brand.blueLight }, ...focusRing() }}
									>
										{paused ? <PlayArrowRounded sx={{ fontSize: 20 }} /> : <PauseRounded sx={{ fontSize: 20 }} />}
									</IconButton>
								</Box>
							)}
						</Box>
						<Box aria-hidden sx={{ display: { md: 'none' }, position: 'absolute', top: 0, right: 0, bottom: 0, width: 48, pointerEvents: 'none', background: `linear-gradient(to right, rgba(244, 248, 253, 0), ${brand.surfaceSubtle})` }} />
					</Box>

					{/* Wide screens, "All": one slow row that loops (the copy is hidden from
					    assistive tech). Hover or the pause button stops it; under reduced
					    motion it stands still and scrolls sideways by hand. */}
					{all && (
						<Box
							sx={{
								display: { xs: 'none', md: 'block' },
								mt: 4.5,
								overflow: 'hidden',
								maskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)',
								WebkitMaskImage: 'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)',
								'&:hover .ek-marquee': { animationPlayState: 'paused' },
								[reducedMotion]: { overflowX: 'auto' },
							}}
						>
							<Box
								component='ul'
								className='ek-marquee'
								aria-label={strings.trustedBy.listLabel}
								sx={{
									display: 'flex',
									width: 'max-content',
									listStyle: 'none',
									m: 0,
									p: 0,
									// ≈ 31 px/s, as on the canvas.
									animation: `${marquee} ${shown.length * 7}s linear infinite`,
									animationPlayState: paused ? 'paused' : 'running',
									[reducedMotion]: { animation: 'none' },
								}}
							>
								{[ false, true ].flatMap((copy) => shown.map((organization) => (
									<Box component='li' key={`${organization.name}${copy ? '-copy' : ''}`} aria-hidden={copy || undefined} sx={{ flexShrink: 0, width: 216, pr: 2.5, boxSizing: 'border-box' }}>
										<LogoCard organization={organization} copy={copy} />
									</Box>
								)))}
							</Box>
						</Box>
					)}

					<Container maxWidth={false} sx={{ maxWidth: layout.container, px: layout.gutter }}>
						{/* Phones: a still two-column grid. */}
						<Box sx={{ display: { md: 'none' }, mt: 3 }}>{grid(LOGO_LIMIT.phone, { xs: 'repeat(2, minmax(0, 1fr))' }, { xs: 'grid', md: 'none' })}</Box>
						{/* Wide screens, one sector: a still grid of that sector's logos. */}
						{!all && <Box sx={{ display: { xs: 'none', md: 'block' }, mt: 4.5 }}>{grid(LOGO_LIMIT.desktop, { md: 'repeat(4, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' }, { xs: 'none', md: 'grid' })}</Box>}
					</Container>
				</>
			) : (
				<Container maxWidth={false} sx={{ maxWidth: layout.container, px: layout.gutter }}>
					{TRUST_STATS.length > 0 && (
						<Box component='dl' sx={{ m: 0, mt: { xs: 4, md: 5 }, mx: 'auto', maxWidth: 1080, display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: `repeat(${Math.min(TRUST_STATS.length, 3)}, minmax(0, 1fr))` }, gap: 3 }}>
							{TRUST_STATS.map((stat, index) => (
								<Box key={stat.label} data-reveal sx={{ '--ek-reveal-index': index, display: 'flex', flexDirection: 'column-reverse', gap: 0.75, p: '28px 28px 24px', border: '1px solid #e3ebf6', borderTop: `4px solid ${STAT_ACCENTS[index % STAT_ACCENTS.length]}`, borderRadius: '16px', bgcolor: brand.white }}>
									<Box component='dt' sx={{ fontSize: 15, lineHeight: 1.45, color: brand.textSecondary }}>{stat.label}</Box>
									<Box component='dd' sx={{ m: 0, fontSize: { xs: 36, md: 44 }, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.02em', color: brand.navy }}>{stat.value}</Box>
								</Box>
							))}
						</Box>
					)}
					<Box sx={{ mt: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5 }}>
						<Typography component='span' sx={{ fontSize: 14, fontWeight: 500, color: brand.textSecondary }}>{strings.trustedBy.forLabel}</Typography>
						<Box component='ul' aria-label={strings.trustedBy.forListLabel} sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
							{SECTORS.map(({ key, label, icon: Icon }) => (
								<Box component='li' key={key} sx={{ height: 36, display: 'flex', alignItems: 'center', gap: 0.75, px: 1.75, borderRadius: radius.pill, bgcolor: brand.blueLight, fontSize: 14, fontWeight: 500 }}>
									<Icon aria-hidden sx={{ fontSize: 16, color: brand.blueDark }} />
									{label}
								</Box>
							))}
						</Box>
					</Box>
				</Container>
			)}

			<Typography sx={{ mt: { xs: 2.5, md: 4 }, px: layout.gutter, fontSize: { xs: 13, md: 14 }, lineHeight: 1.5, color: brand.textSecondary, textAlign: 'center' }}>
				{strings.trustedBy.consent}
				<Box component='br' sx={{ display: { md: 'none' } }} />
				{' '}
				<Link href={CONTACT_URL || BDREN_URL} sx={{ color: brand.blueDark, fontWeight: 500, ...focusRing() }}>{strings.trustedBy.tellUs}</Link>
			</Typography>
		</Box>
	);
};

// ── How it works (UpdateHomePageDesignplan.md §4.4) ──
// Three numbered cards, each with a small picture drawn with boxes.

const HOW_CARD_BORDER = '#e3ebf6';

// A made-up 9 × 9 pattern that reads as a QR code; it is not scannable.
const HOW_QR = [
	'111111101',
	'100000100',
	'101110101',
	'101110010',
	'101110111',
	'100000100',
	'111111101',
	'000100010',
	'101011011',
].flatMap((row) => row.split('').map((bit) => bit === '1'));

const HowStartArt = (): React.JSX.Element => (
	<Box sx={{ width: { xs: 220, md: 248 }, borderRadius: { xs: '10px', md: radius.md }, bgcolor: brand.white, boxShadow: '0 8px 24px rgba(4, 44, 106, 0.10)', overflow: 'hidden' }}>
		<Box sx={{ height: { xs: 18, md: 22 }, display: 'flex', alignItems: 'center', gap: 0.5, px: { xs: 1, md: 1.25 }, borderBottom: `1px solid ${HOW_CARD_BORDER}` }}>
			{[ 0, 1, 2 ].map((dot) => <Box key={dot} sx={{ width: { xs: 5, md: 6 }, height: { xs: 5, md: 6 }, borderRadius: '50%', bgcolor: brand.border }} />)}
		</Box>
		<Box sx={{ p: { xs: '14px 14px 16px', md: '18px 16px 20px' }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: { xs: '7px', md: 1 } }}>
			<Box sx={{ width: '70%', height: { xs: 6, md: 7 }, borderRadius: radius.pill, bgcolor: brand.navy }} />
			<Box sx={{ width: '50%', height: 5, borderRadius: radius.pill, bgcolor: brand.border }} />
			<Box sx={{ position: 'relative', mt: 0.75, height: { xs: 30, md: 34 }, px: { xs: 1.5, md: 1.75 }, borderRadius: radius.sm, bgcolor: brand.orange, color: brand.navy, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: { xs: 11, md: 12 }, fontWeight: 500 }}>
				{strings.common.start}
				<ArrowForwardRounded sx={{ fontSize: { xs: 12, md: 14 } }} />
				<Box component='svg' viewBox='0 0 24 24' sx={{ position: 'absolute', right: { xs: -14, md: -16 }, bottom: { xs: -12, md: -14 }, width: { xs: 20, md: 22 }, height: { xs: 20, md: 22 } }}>
					<path d='M5 3l14 7-6 1.6L10.5 18z' fill={brand.navy} stroke={brand.white} strokeWidth={1.5} strokeLinejoin='round' />
				</Box>
			</Box>
		</Box>
	</Box>
);

const HowShareArt = (): React.JSX.Element => (
	<Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.75, md: 2.25 } }}>
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: '7px', md: 1 } }}>
			<Box sx={{ height: { xs: 30, md: 34 }, display: 'flex', alignItems: 'center', gap: 0.75, pl: { xs: 1, md: 1.25 }, pr: 0.75, border: `1px solid ${brand.border}`, borderRadius: radius.sm, bgcolor: brand.white }}>
				<LinkRounded sx={{ fontSize: { xs: 12, md: 14 }, color: brand.textSecondary }} />
				<Box component='span' sx={{ fontFamily: '\'Roboto Mono\', ui-monospace, monospace', fontSize: { xs: 10, md: 11 }, fontWeight: 500 }}>/team-weekly</Box>
				<Box component='span' sx={{ ml: 0.5, height: { xs: 20, md: 22 }, px: 1, borderRadius: '6px', bgcolor: brand.orangeLight, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: { xs: 9, md: 10 }, fontWeight: 700 }}>
					<CheckRounded sx={{ fontSize: 11, display: { xs: 'none', md: 'block' } }} />
					Copied
				</Box>
			</Box>
			<Box sx={{ alignSelf: 'flex-start', maxWidth: { xs: 150, md: 168 }, px: { xs: 1, md: 1.25 }, py: { xs: 0.75, md: 1 }, borderRadius: '10px 10px 10px 4px', bgcolor: brand.white, border: `1px solid ${HOW_CARD_BORDER}`, fontSize: { xs: 10, md: 11 }, lineHeight: 1.35 }}>
				<Box sx={{ fontSize: { xs: 8, md: 9 }, fontWeight: 700, color: brand.blueDark }}>You</Box>
				Join our meeting at 10:00: …/team-weekly
			</Box>
		</Box>
		<Box sx={{ p: { xs: 0.75, md: 1 }, borderRadius: { xs: radius.sm, md: '10px' }, bgcolor: brand.white, boxShadow: '0 8px 24px rgba(4, 44, 106, 0.10)' }}>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(9, 7px)', md: 'repeat(9, 8px)' }, gridAutoRows: { xs: '7px', md: '8px' } }}>
				{HOW_QR.map((filled, index) => <Box key={index} sx={{ bgcolor: filled ? brand.navy : 'transparent' }} />)}
			</Box>
		</Box>
	</Box>
);

const HOW_PEOPLE = [
	{ initials: 'FA', color: brand.orange, speaking: true },
	{ initials: 'RK', color: '#1668c4' },
	{ initials: 'NS', color: '#6d42c7' },
	{ initials: 'TM', color: '#1d7a50' },
];

const HowMeetArt = (): React.JSX.Element => (
	<Box sx={{ width: { xs: 220, md: 248 }, p: { xs: '7px', md: 1 }, borderRadius: { xs: '10px', md: radius.md }, bgcolor: brand.navy900, boxShadow: '0 8px 24px rgba(4, 44, 106, 0.18)', display: 'flex', flexDirection: 'column', gap: { xs: '5px', md: 0.75 } }}>
		<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
			<Box component='span' sx={{ fontFamily: '\'Roboto Mono\', ui-monospace, monospace', fontSize: { xs: 8, md: 9 }, color: tour.windowText }}>team-weekly</Box>
			<Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.75, py: '1px', borderRadius: radius.pill, bgcolor: '#d93b3b', color: brand.white, fontSize: { xs: 7, md: 8 }, fontWeight: 700 }}>
				<Box component='span' sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: brand.white }} />
				REC
			</Box>
		</Box>
		<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: { xs: 0.5, md: '5px' } }}>
			{HOW_PEOPLE.map((person) => (
				<Box key={person.initials} sx={{ height: { xs: 32, md: 40 }, borderRadius: { xs: '5px', md: '6px' }, bgcolor: brand.navy700, display: 'grid', placeItems: 'center', boxShadow: person.speaking ? `inset 0 0 0 2px ${tour.green}` : 'none' }}>
					<MockAvatar initials={person.initials} color={person.color} size={20} />
				</Box>
			))}
		</Box>
		<Box sx={{ px: 1, py: 0.5, borderRadius: { xs: '5px', md: '6px' }, bgcolor: 'rgba(0, 0, 0, 0.55)', color: brand.white, fontSize: { xs: 8, md: 9 }, lineHeight: 1.35, textAlign: 'center' }}>
			…so let&apos;s review the Q3 numbers first.
		</Box>
	</Box>
);

const HOW_STEPS: { title: string; body: string; Art: () => React.JSX.Element }[] = [
	{ title: 'Start a meeting', body: 'One click, in your browser. Nothing to install.', Art: HowStartArt },
	{ title: 'Share the link', body: 'Send it by WhatsApp or email, or show the QR code on screen.', Art: HowShareArt },
	{ title: 'Meet and record', body: 'Share your screen, chat, record and turn on live captions.', Art: HowMeetArt },
];

const HowItWorks = ({ onStart }: { onStart: () => void }): React.JSX.Element => (
	<Box component='section' id='how-it-works' aria-labelledby='how-it-works-title' sx={{ bgcolor: brand.white, pt: { xs: 7, md: 11 }, pb: { xs: 6, md: 10 }, scrollMarginTop: layout.navH }}>
		<Container maxWidth={false} sx={{ maxWidth: layout.container, px: layout.gutter }}>
			<Box data-reveal sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto' }}>
				<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 1, md: 1.25 }, mb: { xs: 1.5, md: 1.75 } }}>
					<Box aria-hidden sx={{ width: { xs: 16, md: 24 }, height: 3, flexShrink: 0, borderRadius: radius.pill, bgcolor: brand.orange }} />
					<Typography component='p' sx={{ fontSize: { xs: 12, md: 13 }, fontWeight: 700, letterSpacing: { xs: '0.08em', md: '0.1em' }, textTransform: 'uppercase', whiteSpace: 'nowrap', color: brand.blueDark }}>
						{strings.howItWorks.eyebrow}
					</Typography>
					<Box aria-hidden sx={{ width: { xs: 16, md: 24 }, height: 3, flexShrink: 0, borderRadius: radius.pill, bgcolor: brand.orange }} />
				</Box>
				<Typography variant='h2' id='how-it-works-title' sx={{ color: brand.navy, fontSize: { xs: 28, md: 40 }, lineHeight: { xs: 1.2, md: 1.15 }, letterSpacing: { xs: '-0.01em', md: '-0.02em' } }}>
					{strings.howItWorks.titleStart}
					<Box component='span' sx={{ color: brand.blueDark }}>{strings.howItWorks.titleHighlight}</Box>
				</Typography>
			</Box>

			<Box component='ol' sx={{ m: 0, mt: { xs: 3.5, md: 6 }, p: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2, md: 3 }, maxWidth: { sm: 560, lg: 'none' }, mx: { sm: 'auto' } }}>
				{HOW_STEPS.map(({ title, body, Art }, index) => (
					<Box
						component='li'
						key={title}
						data-reveal
						sx={{ '--ek-reveal-index': index, display: 'flex', flexDirection: 'column', border: `1px solid ${HOW_CARD_BORDER}`, borderRadius: { xs: '16px', md: radius.lg }, bgcolor: brand.white, boxShadow: '0 1px 2px rgba(4, 44, 106, 0.04)', overflow: 'hidden' }}
					>
						<Box aria-hidden sx={{ height: { xs: 140, md: 168 }, bgcolor: brand.surfaceSubtle, borderBottom: `1px solid ${HOW_CARD_BORDER}`, display: 'grid', placeItems: 'center' }}>
							<Art />
						</Box>
						<Box sx={{ p: { xs: '18px 20px 20px', md: '24px 28px 28px' }, display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1.25 } }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, md: 1.5 } }}>
								<Box component='span' aria-hidden sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 }, flexShrink: 0, borderRadius: '50%', bgcolor: brand.navy, color: brand.white, display: 'grid', placeItems: 'center', fontSize: { xs: 14, md: 15 }, fontWeight: 700 }}>
									{index + 1}
								</Box>
								<Typography component='h3' sx={{ m: 0, fontSize: { xs: 19, md: 21 }, lineHeight: 1.25, fontWeight: 700, color: brand.navy }}>
									<Box component='span' sx={visuallyHidden}>{`${strings.howItWorks.step} ${index + 1}: `}</Box>
									{title}
								</Typography>
							</Box>
							<Typography sx={{ fontSize: { xs: 15, md: 16 }, lineHeight: { xs: 1.55, md: 1.6 }, color: brand.textSecondary }}>{body}</Typography>
						</Box>
					</Box>
				))}
			</Box>

			<Box sx={{ mt: { xs: 3, md: 4.5 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'center', gap: { xs: 2, md: 3 }, maxWidth: { sm: 560, md: 'none' }, mx: { sm: 'auto' } }}>
				<Typography sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, gap: 1, fontSize: { xs: 14, md: 15 }, lineHeight: 1.5, color: brand.textSecondary }}>
					<InfoOutlined aria-hidden sx={{ fontSize: 18, color: brand.blueDark, flexShrink: 0, mt: { xs: '1px', md: 0 } }} />
					{strings.howItWorks.accountNote}
				</Typography>
				<Button
					variant='outlined'
					endIcon={<ArrowForwardRounded />}
					onClick={onStart}
					onMouseEnter={prefetchApp}
					onFocus={prefetchApp}
					sx={{ flexShrink: 0, minHeight: { xs: 52, md: 48 }, px: 2.5, fontSize: { xs: 16, md: 15 }, color: brand.blueDark, borderColor: brand.blueDark, borderWidth: 1.5, bgcolor: brand.white, '&:hover': { borderColor: brand.blueDark, bgcolor: brand.blueLight }, ...focusRing() }}
				>
					{strings.common.start}
				</Button>
			</Box>
		</Container>
	</Box>
);

// ── Feature tour (§7.3) ──
// A list of features on the left that advances by itself, and a blue "stage" on
// the right that shows each feature as a small app window drawn with boxes.

// Dark video-tile backgrounds, each in its own tint.
const tileTint = {
	slate: 'linear-gradient(140deg, #2B3658 0%, #161D35 100%)',
	violet: 'linear-gradient(140deg, #3B2D66 0%, #1A1533 100%)',
	teal: 'linear-gradient(140deg, #134552 0%, #0C1D2A 100%)',
	navy: 'linear-gradient(140deg, #1C3C78 0%, #0F1A3A 100%)',
	rust: 'linear-gradient(140deg, #52302A 0%, #1F1517 100%)',
	moss: 'linear-gradient(140deg, #22463A 0%, #0F1F1B 100%)',
} as const;

const TOUR_CYCLE_MS = 6000;

const tourFill = keyframes`
	from { transform: scaleY(0); }
	to { transform: scaleY(1); }
`;

const tourBob = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-6px); }
`;

const tourBlink = keyframes`
	50% { opacity: 0.25; }
`;

type TourColor = 'blue' | 'green' | 'red' | 'amber' | 'purple';
type TourStatus = { text: string; color: 'red' | 'green' | 'amber'; solid?: boolean; blink?: boolean };
type TourCard = { icon: SvgIconComponent; color: TourColor; title: string; subtitle: string; corner: 'tr' | 'bl' };
type TourPerson = { name: string; initials: string; tint: keyof typeof tileTint };

const REC_STATUS: TourStatus = { text: 'REC 12:04', color: 'red', blink: true };
const TOUR_CONTROLS = [ MicRounded, VideocamRounded, ScreenShareRounded, PanToolRounded ];
// Cards stick out 24 px past the window, inside the stage padding: top right below
// the slide title, bottom left over the empty start of the control bar. Where the
// window is narrow, the controls reach that corner, so the card drops below them.
const narrowWindow = '@media (min-width: 640px) and (max-width: 767.95px), (min-width: 1024px) and (max-width: 1279.95px)';
const CARD_CORNERS = { tr: { top: 108, right: -24 }, bl: { bottom: -20, left: -24, [narrowWindow]: { bottom: -44 } } } as const;

const TOUR_PEOPLE: Record<string, TourPerson> = {
	ahmed: { name: 'Dr. Ahmed', initials: 'FA', tint: 'navy' },
	nadia: { name: 'Nadia', initials: 'NA', tint: 'violet' },
	rahim: { name: 'Rahim', initials: 'RK', tint: 'teal' },
	sadia: { name: 'Sadia', initials: 'SH', tint: 'rust' },
	tanvir: { name: 'Tanvir', initials: 'TM', tint: 'moss' },
	mitu: { name: 'Mitu', initials: 'MR', tint: 'slate' },
};

const WEBINAR_QUESTIONS = [
	{ name: 'Arif', text: 'How do I apply for the CSE programme?', votes: 48 },
	{ name: 'Mim', text: 'Will the slides be shared?', votes: 31 },
	{ name: 'Tanvir', text: 'Are there scholarships?', votes: 19 },
];

const TOUR_TRANSCRIPT = [
	{ time: '41:52', speaker: 'Dr. Ahmed', text: 'The client sends SYN to open the connection.' },
	{ time: '42:01', speaker: 'Dr. Ahmed', text: 'The server answers with SYN-ACK.' },
	{ time: '42:05', speaker: 'Nadia', text: 'And then the client sends ACK?' },
	{ time: '42:10', speaker: 'Dr. Ahmed', text: 'Exactly, the connection is open.' },
];

const BREAKOUT_ROOMS = [
	{ name: 'Room 1 · Sockets', people: [ 'NA', 'RK', 'SH', 'TM' ] },
	{ name: 'Room 2 · Routing', people: [ 'MR', 'IH', 'AS', 'JK', 'LB' ] },
	{ name: 'Room 3 · DNS', people: [ 'FR', 'MH', 'SK', 'NB' ] },
	{ name: 'Room 4 · HTTP/3', people: [ 'TA', 'RP', 'ZI' ] },
];
const AVATAR_COLORS: TourColor[] = [ 'blue', 'purple', 'amber', 'green' ];

const TOUR_CHAT = [
	{ name: 'Nadia', text: 'Could you share today\'s slides?' },
	{ text: 'Here they are, with the lab sheet.', own: true },
];

const StatusPill = ({ status }: { status: TourStatus }): React.JSX.Element => (
	<Box
		component='span'
		sx={{
			justifySelf: 'end',
			display: 'inline-flex',
			alignItems: 'center',
			gap: '6px',
			height: 22,
			px: '8px',
			borderRadius: radius.pill,
			bgcolor: status.solid ? tour[status.color] : `color-mix(in srgb, ${tour[status.color]} 16%, transparent)`,
			color: status.solid ? tour.white : tour[status.color],
			fontSize: 11,
			fontWeight: 700,
			letterSpacing: '0.02em',
			whiteSpace: 'nowrap',
		}}
	>
		<Box
			component='span'
			sx={{
				width: 6,
				height: 6,
				borderRadius: '50%',
				bgcolor: 'currentColor',
				animation: status.blink ? `${tourBlink} 1.2s steps(2, jump-none) infinite` : 'none',
				[reducedMotion]: { animation: 'none' },
			}}
		/>
		{status.text}
	</Box>
);

// The dark app window every scene sits in: title bar, content, control bar.
const AppWindow = ({ title, status = REC_STATUS, children }: { title: string; status?: TourStatus; children: React.ReactNode }): React.JSX.Element => (
	<Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', bgcolor: tour.window, borderRadius: '16px', boxShadow: tour.windowShadow, overflow: 'hidden' }}>
		<Box sx={{ height: 40, flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr minmax(0, auto) 1fr', alignItems: 'center', gap: 1, px: '14px', borderBottom: `1px solid ${tour.windowLine}` }}>
			<Box sx={{ display: 'flex', gap: '6px' }}>
				{[ 0, 1, 2 ].map((dot) => <Box key={dot} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: tour.windowDot }} />)}
			</Box>
			<Box sx={{ minWidth: 0, fontSize: 12, fontWeight: 500, color: tour.windowText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</Box>
			<StatusPill status={status} />
		</Box>
		<Box sx={{ height: 300, display: 'flex', gap: '10px', p: '12px', minWidth: 0, [phoneWidth]: { height: 230, gap: '8px', p: '10px' } }}>{children}</Box>
		<Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', py: '12px', borderTop: `1px solid ${tour.windowLine}` }}>
			{TOUR_CONTROLS.map((Icon, index) => (
				<Box key={index} sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: tour.control, color: tour.windowText, display: 'grid', placeItems: 'center' }}>
					<Icon sx={{ fontSize: 17 }} />
				</Box>
			))}
			<Box sx={{ height: 34, ml: '6px', px: '14px', borderRadius: '10px', bgcolor: tour.red, color: tour.white, display: 'inline-flex', alignItems: 'center', fontSize: 12, fontWeight: 600 }}>Leave</Box>
		</Box>
	</Box>
);

const FloatCard = ({ card }: { card: TourCard }): React.JSX.Element => {
	const Icon = card.icon;

	return (
		<Box
			sx={{
				position: 'absolute',
				...CARD_CORNERS[card.corner],
				display: 'flex',
				alignItems: 'center',
				gap: '10px',
				p: '12px 14px',
				borderRadius: '14px',
				bgcolor: tour.white,
				boxShadow: tour.cardShadow,
				whiteSpace: 'nowrap',
				animation: `${tourBob} 5s ease-in-out infinite`,
				animationDelay: card.corner === 'bl' ? '-2.5s' : '0s',
				[reducedMotion]: { animation: 'none' },
				[phoneWidth]: { display: 'none' },
			}}
		>
			<Box sx={{ width: 32, height: 32, flexShrink: 0, borderRadius: '9px', bgcolor: tour[card.color], color: tour.white, display: 'grid', placeItems: 'center' }}>
				<Icon sx={{ fontSize: 18 }} />
			</Box>
			<Box>
				<Box sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: tour.ink }}>{card.title}</Box>
				<Box sx={{ fontSize: 12, lineHeight: 1.35, color: tour.body }}>{card.subtitle}</Box>
			</Box>
		</Box>
	);
};

const TourTile = ({ person, speaking, flex }: { person: TourPerson; speaking?: boolean; flex?: number }): React.JSX.Element => (
	<Box sx={{ position: 'relative', flex, minWidth: 0, minHeight: 0, borderRadius: '10px', background: tileTint[person.tint], boxShadow: speaking ? `inset 0 0 0 2px ${tour.green}` : 'none', display: 'grid', placeItems: 'center' }}>
		<Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.14)', color: tour.white, display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 600, [phoneWidth]: { width: 34, height: 34, fontSize: 12 } }}>
			{person.initials}
		</Box>
		<Box sx={{ position: 'absolute', left: 6, bottom: 6, maxWidth: 'calc(100% - 12px)', px: '6px', py: '2px', borderRadius: '6px', bgcolor: 'rgba(0, 0, 0, 0.35)', color: tour.white, fontSize: 10, fontWeight: 500, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
			{person.name}
		</Box>
	</Box>
);

// The lecture slide shared by the classes and recording scenes.
const TourSlide = ({ children }: { children?: React.ReactNode }): React.JSX.Element => (
	<Box sx={{ position: 'relative', flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '6px', p: '16px', borderRadius: '10px', bgcolor: tour.white, overflow: 'hidden', [phoneWidth]: { p: '10px', gap: '4px' } }}>
		<Box sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', color: tour.blue }}>CSE 341 · Week 6</Box>
		<Box sx={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.01em', color: tour.ink, [phoneWidth]: { fontSize: 12 } }}>Lecture 12: Transport layer</Box>
		{[ '86%', '62%' ].map((width) => <Box key={width} sx={{ height: 6, width, borderRadius: radius.pill, bgcolor: tour.soft }} />)}
		<Box sx={{ flex: 1, minHeight: 0, mt: '6px', display: 'flex', alignItems: 'flex-end', gap: '8%', px: '6%', borderBottom: `2px solid ${tour.line}` }}>
			{[ 38, 56, 92, 48, 66 ].map((height, index) => (
				<Box key={height} sx={{ flex: 1, height: `${height}%`, borderRadius: '5px 5px 0 0', bgcolor: index === 2 ? tour.blue : tour.slideBar }} />
			))}
		</Box>
		{children}
	</Box>
);

const ClassesScene = (): React.JSX.Element => (
	<>
		<Box sx={{ width: '30%', flexShrink: 0, display: 'grid', gridTemplateRows: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
			<TourTile person={TOUR_PEOPLE.nadia} speaking />
			<TourTile person={TOUR_PEOPLE.rahim} />
			<TourTile person={TOUR_PEOPLE.sadia} />
		</Box>
		<TourSlide />
	</>
);

const MeetingsScene = (): React.JSX.Element => (
	<Box sx={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
		{[ 'ahmed', 'nadia', 'rahim', 'sadia', 'tanvir' ].map((key) => <TourTile key={key} person={TOUR_PEOPLE[key]} speaking={key === 'ahmed'} />)}
		<Box sx={{ borderRadius: '10px', bgcolor: tour.control, color: tour.windowText, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 600 }}>+7 more</Box>
	</Box>
);

const WebinarsScene = (): React.JSX.Element => (
	<>
		<TourTile person={TOUR_PEOPLE.ahmed} speaking flex={1.6} />
		<Box sx={{ width: '38%', flexShrink: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px', p: '12px', borderRadius: '10px', bgcolor: tour.panel, overflow: 'hidden', [phoneWidth]: { width: '58%', p: '8px', gap: '6px' } }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
				<Box sx={{ fontSize: 12, fontWeight: 700, color: tour.white }}>Q&amp;A</Box>
				<Box sx={{ fontSize: 10, color: tour.windowText, whiteSpace: 'nowrap' }}>Top questions</Box>
			</Box>
			{WEBINAR_QUESTIONS.map((question) => (
				<Box key={question.name} sx={{ display: 'flex', alignItems: 'flex-start', gap: '8px', p: '8px', borderRadius: '8px', bgcolor: tour.control, [phoneWidth]: { p: '6px', '&:nth-of-type(n+4)': { display: 'none' } } }}>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Box sx={{ fontSize: 10, fontWeight: 600, color: tour.windowText }}>{question.name}</Box>
						<Box sx={{ fontSize: 11, lineHeight: 1.35, color: tour.white, [phoneWidth]: { fontSize: 10 } }}>{question.text}</Box>
					</Box>
					<Box sx={{ flexShrink: 0, px: '6px', py: '2px', borderRadius: '6px', bgcolor: `color-mix(in srgb, ${tour.blue} 22%, transparent)`, color: tour.blueOnDark, fontSize: 10, fontWeight: 700 }}>▲ {question.votes}</Box>
				</Box>
			))}
		</Box>
	</>
);

const RecordingScene = (): React.JSX.Element => (
	<Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
		<TourSlide>
			<Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: 'rgba(11, 21, 48, 0.35)' }}>
				<Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: tour.blue, color: tour.white, display: 'grid', placeItems: 'center', boxShadow: '0 10px 30px -6px rgba(11, 92, 255, 0.7)' }}>
					<PlayArrowRounded sx={{ fontSize: 32 }} />
				</Box>
			</Box>
		</TourSlide>
		<Box sx={{ flexShrink: 0 }}>
			<Box sx={{ position: 'relative', height: 4, borderRadius: radius.pill, bgcolor: tour.control }}>
				<Box sx={{ width: '42%', height: '100%', borderRadius: radius.pill, bgcolor: tour.blue }} />
				<Box sx={{ position: 'absolute', left: '42%', top: '50%', width: 12, height: 12, borderRadius: '50%', bgcolor: tour.white, transform: 'translate(-50%, -50%)' }} />
			</Box>
			<Box sx={{ mt: '10px', display: 'flex', justifyContent: 'space-between', gap: 1, fontSize: 11, color: tour.windowText, whiteSpace: 'nowrap' }}>
				<Box component='span' sx={{ fontVariantNumeric: 'tabular-nums' }}>21:16 / 50:30</Box>
				<Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
					<CloudDoneRounded sx={{ fontSize: 14, color: tour.green }} />
					Saved to cloud · HD
				</Box>
			</Box>
		</Box>
	</Box>
);

const TranscriptionScene = (): React.JSX.Element => (
	<>
		<Box sx={{ position: 'relative', flex: 1.1, minWidth: 0, display: 'flex' }}>
			<TourTile person={TOUR_PEOPLE.ahmed} speaking flex={1} />
			<Box sx={{ position: 'absolute', left: 10, right: 10, bottom: 32, p: '8px 10px', borderRadius: '8px', bgcolor: 'rgba(0, 0, 0, 0.62)', color: tour.white, fontSize: 12, lineHeight: 1.4, textAlign: 'center', [phoneWidth]: { fontSize: 10, p: '6px' } }}>
				…then the client sends ACK, and the connection is open.
			</Box>
		</Box>
		<Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px', p: '12px', borderRadius: '10px', bgcolor: tour.white, overflow: 'hidden', [phoneWidth]: { p: '8px', gap: '6px' } }}>
			<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<Box sx={{ fontSize: 12, fontWeight: 700, color: tour.ink }}>Transcript</Box>
				<SearchRounded sx={{ fontSize: 16, color: tour.muted }} />
			</Box>
			{TOUR_TRANSCRIPT.map((line) => (
				<Box key={line.time} sx={{ display: 'flex', gap: '8px', [phoneWidth]: { '&:nth-of-type(n+5)': { display: 'none' } } }}>
					<Box sx={{ flexShrink: 0, fontSize: 10, fontWeight: 500, lineHeight: 1.5, color: tour.muted, fontVariantNumeric: 'tabular-nums' }}>{line.time}</Box>
					<Box sx={{ minWidth: 0 }}>
						<Box sx={{ fontSize: 10, fontWeight: 700, color: tour.blue }}>{line.speaker}</Box>
						<Box sx={{ fontSize: 11, lineHeight: 1.35, color: tour.ink, [phoneWidth]: { fontSize: 10 } }}>{line.text}</Box>
					</Box>
				</Box>
			))}
		</Box>
	</>
);

const TourCursor = ({ name, color, left, top }: { name: string; color: string; left: string; top: string }): React.JSX.Element => (
	<Box sx={{ position: 'absolute', left, top, display: 'flex', alignItems: 'flex-start' }}>
		<Box component='svg' viewBox='0 0 16 16' sx={{ width: 16, height: 16, fill: color }}>
			<path d='M2 1 L14 8 L8.5 9.5 L6 15 Z' />
		</Box>
		<Box sx={{ mt: '12px', ml: '-2px', px: '6px', py: '2px', borderRadius: '6px', bgcolor: color, color: tour.white, fontSize: 10, fontWeight: 600 }}>{name}</Box>
	</Box>
);

const WHITEBOARD_TOOLS = [ DrawRounded, CropSquareRounded, TitleRounded ];

const WhiteboardScene = (): React.JSX.Element => (
	<Box sx={{ position: 'relative', flex: 1, minWidth: 0, borderRadius: '10px', bgcolor: tour.white, backgroundImage: `radial-gradient(${tour.canvasDot} 1px, transparent 1.4px)`, backgroundSize: '16px 16px', overflow: 'hidden' }}>
		<Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', p: '4px', borderRadius: '10px', bgcolor: tour.white, border: `1px solid ${tour.line}`, boxShadow: '0 2px 8px rgba(11, 21, 48, 0.10)' }}>
			{WHITEBOARD_TOOLS.map((Icon, index) => (
				<Box key={index} sx={{ width: 24, height: 24, borderRadius: '7px', display: 'grid', placeItems: 'center', bgcolor: index === 0 ? tour.blue : 'transparent', color: index === 0 ? tour.white : tour.muted }}>
					<Icon sx={{ fontSize: 15 }} />
				</Box>
			))}
			{[ tour.pink, tour.purple ].map((color) => <Box key={color} sx={{ width: 12, height: 12, my: '3px', borderRadius: '50%', bgcolor: color }} />)}
		</Box>
		<Box component='svg' viewBox='0 0 400 240' preserveAspectRatio='xMidYMid meet' sx={{ position: 'absolute', top: 8, bottom: 8, left: 48, right: 8, width: 'calc(100% - 56px)', height: 'calc(100% - 16px)' }}>
			<defs>
				<marker id='ft-arrow' viewBox='0 0 10 10' refX='9' refY='5' markerWidth='7' markerHeight='7' orient='auto-start-reverse'>
					<path d='M0 0 L10 5 L0 10 z' fill={tour.ink} />
				</marker>
			</defs>
			{[ [ 40, 'Client' ], [ 264, 'Server' ] ].map(([ x, label ]) => (
				<g key={label}>
					<rect x={x} y={14} width={96} height={34} rx={8} fill={tour.soft} stroke={tour.ink} strokeWidth={2} />
					<text x={Number(x) + 48} y={36} textAnchor='middle' fontSize={14} fontWeight={700} fill={tour.ink}>{label}</text>
					<line x1={Number(x) + 48} y1={48} x2={Number(x) + 48} y2={230} stroke={tour.canvasDot} strokeWidth={2} strokeDasharray='4 4' />
				</g>
			))}
			{[ [ 88, 74, 310, 102, 'SYN' ], [ 312, 124, 90, 152, 'SYN-ACK' ], [ 88, 174, 310, 202, 'ACK' ] ].map(([ x1, y1, x2, y2, label ]) => (
				<g key={label}>
					<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tour.ink} strokeWidth={2} markerEnd='url(#ft-arrow)' />
					<text x={200} y={((Number(y1) + Number(y2)) / 2) - 8} textAnchor='middle' fontSize={12} fontWeight={700} fill={tour.ink}>{label}</text>
				</g>
			))}
			<path d='M146 128 C 146 108, 256 106, 258 126 C 260 146, 158 150, 140 132' fill='none' stroke={tour.pink} strokeWidth={3} strokeLinecap='round' />
			<path d='M330 198 l 9 11 l 20 -26' fill='none' stroke={tour.purple} strokeWidth={3} strokeLinecap='round' strokeLinejoin='round' />
		</Box>
		<TourCursor name='Sadia' color={tour.pink} left='64%' top='52%' />
		<TourCursor name='Rahim' color={tour.purple} left='76%' top='80%' />
	</Box>
);

const BreakoutScene = (): React.JSX.Element => (
	<Box sx={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
		{BREAKOUT_ROOMS.map((room) => (
			<Box key={room.name} sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: '12px', borderRadius: '10px', bgcolor: tour.panel, border: `1px solid ${tour.windowLine}`, [phoneWidth]: { p: '8px' } }}>
				<Box sx={{ minWidth: 0 }}>
					<Box sx={{ fontSize: 12, fontWeight: 700, color: tour.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', [phoneWidth]: { fontSize: 11 } }}>{room.name}</Box>
					<Box sx={{ mt: '2px', fontSize: 10, color: tour.windowText }}>{room.people.length} people</Box>
				</Box>
				<Box sx={{ display: 'flex' }}>
					{room.people.slice(0, 3).map((initials, index) => (
						<Box key={initials} sx={{ width: 28, height: 28, ml: index ? '-8px' : 0, borderRadius: '50%', border: `2px solid ${tour.panel}`, bgcolor: tour[AVATAR_COLORS[index]], color: tour.white, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, [phoneWidth]: { width: 24, height: 24, fontSize: 9 } }}>
							{initials}
						</Box>
					))}
					{room.people.length > 3 && (
						<Box sx={{ width: 28, height: 28, ml: '-8px', borderRadius: '50%', border: `2px solid ${tour.panel}`, bgcolor: tour.control, color: tour.windowText, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, [phoneWidth]: { width: 24, height: 24, fontSize: 9 } }}>
							+{room.people.length - 3}
						</Box>
					)}
				</Box>
			</Box>
		))}
	</Box>
);

const chatBubbleSx = (own?: boolean): SxProps<Theme> => ({
	alignSelf: own ? 'flex-end' : 'flex-start',
	maxWidth: '72%',
	px: '10px',
	py: '7px',
	borderRadius: own ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
	bgcolor: own ? tour.blue : tour.control,
	color: tour.white,
	fontSize: 12,
	lineHeight: 1.4,
	[phoneWidth]: { fontSize: 11 },
});

const ChatScene = (): React.JSX.Element => (
	<Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
		<Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px', overflow: 'hidden' }}>
			{TOUR_CHAT.map((message) => (
				<Box key={message.text} sx={chatBubbleSx(message.own)}>
					{message.name && <Box sx={{ fontSize: 10, fontWeight: 600, color: tour.windowText }}>{message.name}</Box>}
					{message.text}
				</Box>
			))}
			<Box sx={{ alignSelf: 'flex-end', maxWidth: '100%', display: 'flex', alignItems: 'center', gap: '10px', p: '8px 10px', borderRadius: '12px', bgcolor: tour.panel, border: `1px solid ${tour.windowLine}` }}>
				<Box sx={{ width: 30, height: 30, flexShrink: 0, borderRadius: '7px', bgcolor: tour.red, color: tour.white, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 800 }}>PDF</Box>
				<Box sx={{ minWidth: 0 }}>
					<Box sx={{ fontSize: 12, fontWeight: 600, color: tour.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Lecture-12-slides.pdf</Box>
					<Box sx={{ fontSize: 10, color: tour.windowText }}>2.4 MB</Box>
				</Box>
				<DownloadRounded sx={{ fontSize: 18, color: tour.windowText }} />
			</Box>
			<Box sx={{ ...chatBubbleSx(), [phoneWidth]: { display: 'none' } } as SxProps<Theme>}>
				<Box sx={{ fontSize: 10, fontWeight: 600, color: tour.windowText }}>Rahim</Box>
				Thanks, got it!
			</Box>
		</Box>
		<Box sx={{ flexShrink: 0, height: 36, display: 'flex', alignItems: 'center', gap: 1, pl: '14px', pr: '5px', borderRadius: radius.pill, bgcolor: tour.panel, border: `1px solid ${tour.windowLine}` }}>
			<Box sx={{ flex: 1, minWidth: 0, fontSize: 12, color: tour.windowText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Message the class…</Box>
			<Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: tour.blue, color: tour.white, display: 'grid', placeItems: 'center' }}>
				<SendRounded sx={{ fontSize: 14 }} />
			</Box>
		</Box>
	</Box>
);

const TOUR_SCENES: Record<FeatureKey, { title: string; status?: TourStatus; cards?: TourCard[]; Body: () => React.JSX.Element }> = {
	classes: {
		title: 'CSE 341 · Computer Networks',
		Body: ClassesScene,
		cards: [
			{ icon: BarChartRounded, color: 'blue', title: 'Poll closed', subtitle: '82% answered', corner: 'tr' },
			{ icon: PanToolRounded, color: 'amber', title: '3 hands raised', subtitle: 'Nadia, Rahim and Sadia', corner: 'bl' },
		],
	},
	meetings: {
		title: 'Faculty meeting',
		Body: MeetingsScene,
		cards: [ { icon: GroupsRounded, color: 'blue', title: '12 in meeting', subtitle: 'Started 09:30', corner: 'bl' } ],
	},
	webinars: {
		title: 'Open day 2026',
		status: { text: 'LIVE', color: 'red', solid: true },
		Body: WebinarsScene,
		cards: [ { icon: PodcastsRounded, color: 'purple', title: '1,240 attendees', subtitle: 'Up to 10,000', corner: 'bl' } ],
	},
	recording: {
		title: 'Lecture 12 · Recording',
		Body: RecordingScene,
		cards: [ { icon: FiberManualRecordRounded, color: 'red', title: 'Auto-recorded', subtitle: 'Every session, in HD', corner: 'tr' } ],
	},
	transcription: {
		title: 'CSE 341 · Live captions',
		Body: TranscriptionScene,
		cards: [ { icon: TranslateRounded, color: 'green', title: 'English · বাংলা', subtitle: 'Searchable notes', corner: 'bl' } ],
	},
	whiteboard: {
		title: 'Whiteboard · TCP handshake',
		status: { text: '3 editing', color: 'green' },
		Body: WhiteboardScene,
	},
	breakout: {
		title: 'Breakout rooms',
		status: { text: '08:42 left', color: 'amber' },
		Body: BreakoutScene,
	},
	chat: {
		title: 'CSE 341 · Chat',
		Body: ChatScene,
	},
};

// One scene on the stage; all of them share a grid cell and crossfade.
const TourScene = ({ feature, active }: { feature: Feature; active: boolean }): React.JSX.Element => {
	const { title, status, cards, Body } = TOUR_SCENES[feature.key];

	return (
		<Box
			role={active ? 'img' : undefined}
			aria-label={active ? feature.label : undefined}
			aria-hidden={active ? undefined : true}
			sx={{
				gridArea: '1 / 1',
				position: 'relative',
				opacity: active ? 1 : 0,
				transform: active ? 'none' : 'translateY(16px) scale(.98)',
				visibility: active ? 'visible' : 'hidden',
				// Hidden only after the fade-out, so the outgoing scene stays visible while it fades.
				transition: `opacity 450ms ease, transform 450ms ease, visibility 0s linear ${active ? 0 : 450}ms`,
				[reducedMotion]: { transition: 'none' },
			}}
		>
			<AppWindow title={title} status={status}><Body /></AppWindow>
			{cards?.map((card) => <FloatCard key={card.title} card={card} />)}
		</Box>
	);
};

const tourButtonSx: SxProps<Theme> = {
	height: 48,
	minHeight: 48,
	px: '24px',
	borderRadius: radius.pill,
	fontFamily: 'inherit',
	fontSize: 15,
	fontWeight: 600,
	boxShadow: 'none',
	transition: `background-color ${motion.fast}ms ${motion.ease}, color ${motion.fast}ms ${motion.ease}`,
	...focusRing(),
};

const FeatureTour = ({ transcriptionEnabled, onStart }: { transcriptionEnabled: boolean; onStart: () => void }): React.JSX.Element => {
	const features = FEATURES.filter((feature) => transcriptionEnabled || feature.key !== 'transcription');
	const [ active, setActive ] = useState(0);
	// Bumped on every pick, so picking the active feature again restarts its timer.
	const [ pickCount, setPickCount ] = useState(0);
	const [ hovered, setHovered ] = useState(false);
	const [ keyboardInside, setKeyboardInside ] = useState(false);
	const reduceMotion = useMediaQuery(reducedMotion);
	// Pausing for keyboard focus too lets keyboard users read at their own pace (WCAG 2.2.2).
	const paused = hovered || keyboardInside;

	useNewsFonts();

	const select = (index: number): void => {
		setActive(index);
		setPickCount((value) => value + 1);
	};

	const onTabKeyDown = (event: React.KeyboardEvent, index: number): void => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			select(index);

			return;
		}

		const next = {
			ArrowDown: (index + 1) % features.length,
			ArrowUp: (index - 1 + features.length) % features.length,
			Home: 0,
			End: features.length - 1,
		}[event.key];

		if (next === undefined) return;

		event.preventDefault();
		select(next);
		document.getElementById(`ft-tab-${features[next].key}`)?.focus();
	};

	return (
		<Box
			component='section'
			id='products'
			aria-labelledby='products-title'
			onPointerEnter={(event: React.PointerEvent) => setHovered(event.pointerType === 'mouse')}
			onPointerLeave={() => setHovered(false)}
			onFocus={(event: React.FocusEvent) => setKeyboardInside((event.target as HTMLElement).matches(':focus-visible'))}
			onBlur={(event: React.FocusEvent) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setKeyboardInside(false);
			}}
			sx={{ bgcolor: tour.white, color: tour.ink, fontFamily: newsSans, py: '96px', px: '24px', scrollMarginTop: layout.navH, [phoneWidth]: { py: '64px', px: '16px' } }}
		>
			<Box sx={{ maxWidth: 1240, mx: 'auto' }}>
				<Box data-reveal sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'flex-end' }, gap: { xs: '20px', lg: '48px' }, mb: '56px', [phoneWidth]: { mb: '40px' } }}>
					<Box sx={{ maxWidth: 720 }}>
						<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '8px', mb: '16px', fontSize: 14, fontWeight: 600, color: tour.blue, '&::before': { content: '""', width: 8, height: 8, borderRadius: '50%', bgcolor: tour.blue } }}>
							{strings.features.eyebrow}
						</Box>
						<Box component='h2' id='products-title' sx={{ m: 0, fontSize: 'clamp(34px, 4.6vw, 56px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.035em' }}>
							{strings.features.titleStart}
							<Box component='span' sx={{ color: tour.blue }}>{strings.features.titleHighlight}</Box>
						</Box>
					</Box>
					<Box component='p' sx={{ m: 0, maxWidth: 380, fontSize: 18, lineHeight: 1.6, color: tour.body }}>{strings.features.intro}</Box>
				</Box>

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '400px minmax(0, 1fr)' }, gap: { xs: '40px', lg: '56px' }, alignItems: 'start' }}>
					<Box>
						{/* The tabs and their panels interleave, so the tablist owns its tabs through aria-owns. */}
						<Box role='tablist' aria-label={strings.features.label} aria-orientation='vertical' aria-owns={features.map((feature) => `ft-tab-${feature.key}`).join(' ')} />
						{features.map((feature, index) => {
							const isActive = index === active;
							const Icon = feature.icon;

							return (
								<Box key={feature.key} sx={{ position: 'relative', p: '20px 0 20px 24px', borderTop: `1px solid ${tour.line}`, '&:last-of-type': { borderBottom: `1px solid ${tour.line}` } }}>
									{isActive && (
										<Box aria-hidden sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, bgcolor: tour.line, overflow: 'hidden' }}>
											<Box
												key={pickCount}
												onAnimationEnd={() => !reduceMotion && setActive((current) => (current + 1) % features.length)}
												sx={{
													height: '100%',
													bgcolor: tour.blue,
													transformOrigin: 'top',
													animation: `${tourFill} ${TOUR_CYCLE_MS}ms linear forwards`,
													animationPlayState: paused ? 'paused' : 'running',
													[reducedMotion]: { animation: 'none' },
												}}
											/>
										</Box>
									)}
									<Box
										role='tab'
										id={`ft-tab-${feature.key}`}
										tabIndex={0}
										aria-selected={isActive}
										aria-controls={`ft-panel-${feature.key}`}
										onClick={() => select(index)}
										onKeyDown={(event: React.KeyboardEvent) => onTabKeyDown(event, index)}
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: '14px',
											cursor: 'pointer',
											borderRadius: radius.sm,
											'&:hover .ft-title': { color: tour.ink },
											'&:focus-visible': { outline: `3px solid ${tour.blue}`, outlineOffset: '4px' },
										}}
									>
										<Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: isActive ? tour.blue : tour.soft, color: isActive ? tour.white : tour.muted, transition: `background-color ${motion.base}ms, color ${motion.base}ms` }}>
											<Icon aria-hidden sx={{ fontSize: 22 }} />
										</Box>
										<Box component='span' className='ft-title' sx={{ fontSize: 18, fontWeight: 600, color: isActive ? tour.ink : tour.muted, transition: `color ${motion.base}ms` }}>
											{feature.title}
										</Box>
									</Box>
									<Box
										role='tabpanel'
										id={`ft-panel-${feature.key}`}
										aria-labelledby={`ft-tab-${feature.key}`}
										inert={!isActive}
										sx={{ display: 'grid', gridTemplateRows: isActive ? '1fr' : '0fr', transition: 'grid-template-rows 350ms ease', [reducedMotion]: { transition: 'none' } }}
									>
										<Box sx={{ minHeight: 0, overflow: 'hidden' }}>
											<Box sx={{ pl: '54px', pt: '12px' }}>
												<Box component='p' sx={{ m: 0, fontSize: 15, lineHeight: 1.65, color: tour.body }}>{feature.description}</Box>
												{feature.link && (
													<Link
														href={feature.link}
														underline='none'
														sx={{ mt: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: tour.blue, transition: `gap ${motion.base}ms ${motion.ease}`, '&:hover': { gap: '10px' }, [reducedMotion]: { transition: 'none' }, ...focusRing() }}
													>
														{strings.features.learnMore}
														<Box component='span' sx={visuallyHidden}>{` ${strings.features.learnMoreAbout} ${feature.title}`}</Box>
														<span aria-hidden>→</span>
													</Link>
												)}
											</Box>
										</Box>
									</Box>
								</Box>
							);
						})}
						<Box sx={{ mt: '32px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
							<Button
								variant='contained'
								disableElevation
								onClick={onStart}
								onMouseEnter={prefetchApp}
								sx={{ ...tourButtonSx, bgcolor: tour.blue, color: tour.white, '&:hover': { bgcolor: tour.blueHover } } as SxProps<Theme>}
							>
								{strings.features.start}
							</Button>
							<Button
								variant='outlined'
								href={CONTACT_URL || BDREN_URL}
								sx={{ ...tourButtonSx, border: `1.5px solid ${tour.ink}`, color: tour.ink, '&:hover': { border: `1.5px solid ${tour.ink}`, bgcolor: tour.ink, color: tour.white } } as SxProps<Theme>}
							>
								{strings.features.demo}
							</Button>
						</Box>
					</Box>

					<Box
						sx={{
							order: { xs: -1, lg: 0 },
							position: { lg: 'sticky' },
							top: { lg: 88 },
							display: 'grid',
							placeItems: 'center',
							minHeight: 560,
							p: '48px 40px',
							borderRadius: '28px',
							overflow: 'hidden',
							background: tour.stage,
							isolation: 'isolate',
							// Dot grid that fades out toward the bottom.
							'&::before': {
								content: '""',
								position: 'absolute',
								inset: 0,
								zIndex: -1,
								backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1.5px)',
								backgroundSize: '22px 22px',
								maskImage: 'linear-gradient(to bottom, #000 0%, transparent 85%)',
								pointerEvents: 'none',
							},
							[phoneWidth]: { minHeight: 420, p: '24px 16px', borderRadius: '20px' },
						}}
					>
						<Box sx={{ width: '100%', maxWidth: 640, display: 'grid' }}>
							{features.map((feature, index) => <TourScene key={feature.key} feature={feature} active={index === active} />)}
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

const Spotlight = ({ transcriptionEnabled }: { transcriptionEnabled: boolean }): React.JSX.Element => {
	const rows = SPOTLIGHT_ROWS.filter((row) => transcriptionEnabled || !row.transcription);

	return (
		<SectionShell id='recording' background={brand.surfaceSubtle}>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)', xl: 'minmax(0, 7fr) minmax(0, 5fr)' }, gap: { xs: 4, lg: 6 }, alignItems: 'center' }}>
				<Box sx={{ position: 'relative', order: { xs: 2, lg: 1 }, maxWidth: { md: 640, lg: 'none' }, width: '100%', mx: { md: 'auto', lg: 0 } }}>
					<Box aria-hidden sx={{ position: 'absolute', inset: '-10%', borderRadius: '50%', bgcolor: brand.blue, opacity: 0.18, filter: 'blur(80px)' }} />
					<Box sx={{ position: 'relative' }}>
						<BrowserFrame url={`${window.location.host}/Video-Conferencing`} label={transcriptionEnabled ? strings.spotlight.mockLabel : strings.spotlight.mockLabelNoTranscript} elevation={2}>
							<ProductMock variant={transcriptionEnabled ? 'transcription' : 'recording'} />
						</BrowserFrame>
					</Box>
				</Box>
				<Box sx={{ order: { xs: 1, lg: 2 } }}>
					<Box component='span' sx={{ display: 'inline-block', mb: 2, px: 1.5, py: 0.25, borderRadius: radius.pill, bgcolor: brand.orangeLight, color: brand.navy, fontSize: 12, fontWeight: 700 }}>
						{strings.spotlight.badge}
					</Box>
					<Typography variant='h2' id='recording-title'>{strings.spotlight.title}</Typography>
					<Typography sx={{ mt: 2, fontSize: '1.125rem', color: brand.textSecondary }}>
						{transcriptionEnabled ? strings.spotlight.body : strings.spotlight.bodyNoTranscript}
					</Typography>
					<Box component='ul' sx={{ listStyle: 'none', m: 0, mt: 3, p: 0, display: 'grid', gap: 2 }}>
						{rows.map((row) => (
							<Box component='li' key={row.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 500 }}>
								<IconTile icon={row.icon} />
								{row.label}
							</Box>
						))}
					</Box>
					{SPOTLIGHT_URL && (
						<Button variant='outlined' href={SPOTLIGHT_URL} sx={{ mt: 4, ...outlinedBlueSx } as SxProps<Theme>}>{strings.spotlight.cta}</Button>
					)}
				</Box>
			</Box>
		</SectionShell>
	);
};

const UseCases = ({ onStart, onJoin }: { onStart: () => void; onJoin: () => void }): React.JSX.Element => {
	const [ selected, setSelected ] = useState(USE_CASES[0].key);
	const keys = USE_CASES.map((useCase) => useCase.key);

	return (
		<SectionShell id='use-cases' background={brand.white}>
			<SectionHeader id='use-cases' eyebrow={strings.useCases.eyebrow} title={strings.useCases.title} />
			<Box
				role='tablist'
				aria-label={strings.useCases.label}
				sx={{ display: 'inline-flex', maxWidth: '100%', gap: 0.5, p: 0.5, borderRadius: radius.pill, bgcolor: brand.surfaceSubtle, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
			>
				{USE_CASES.map((useCase) => {
					const active = useCase.key === selected;

					return (
						<Box
							key={useCase.key}
							component='button'
							type='button'
							role='tab'
							id={`ek-use-${useCase.key}`}
							aria-selected={active}
							aria-controls={`ek-use-panel-${useCase.key}`}
							tabIndex={active ? 0 : -1}
							onClick={() => setSelected(useCase.key)}
							onKeyDown={(event: React.KeyboardEvent) => rovingKeyDown(event, keys, selected, setSelected, 'ek-use')}
							sx={{
								flexShrink: 0,
								height: 44,
								px: 2.5,
								border: 0,
								borderRadius: radius.pill,
								bgcolor: active ? brand.navy : 'transparent',
								color: active ? brand.white : brand.navy,
								font: 'inherit',
								fontSize: 15,
								fontWeight: 500,
								cursor: 'pointer',
								whiteSpace: 'nowrap',
								transition: `background-color ${motion.base}ms ${motion.ease}`,
								'&:hover': { bgcolor: active ? brand.navy : brand.blueLight },
								...focusRing(),
							} as SxProps<Theme>}
						>
							{useCase.tab}
						</Box>
					);
				})}
			</Box>

			{/* Every panel sits in the same grid cell, so the height is always the tallest panel's (§7.5). */}
			<Box sx={{ mt: { xs: 3, md: 4 }, display: 'grid' }}>
				{USE_CASES.map((useCase) => {
					const active = useCase.key === selected;

					return (
						<Box
							key={useCase.key}
							role='tabpanel'
							id={`ek-use-panel-${useCase.key}`}
							aria-labelledby={`ek-use-${useCase.key}`}
							hidden={false}
							aria-hidden={!active}
							inert={!active}
							sx={{
								gridArea: '1 / 1',
								visibility: active ? 'visible' : 'hidden',
								opacity: active ? 1 : 0,
								transition: `opacity ${motion.base}ms ${motion.ease}`,
								[reducedMotion]: { transition: 'none' },
								display: 'grid',
								gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(0, 1fr)' },
								gap: { xs: 3, md: 5, lg: 8 },
								alignItems: 'center',
							}}
						>
							<Box>
								<Typography variant='h3' component='h3'>{useCase.title}</Typography>
								<Typography sx={{ mt: 1.5, color: brand.textSecondary }}>{useCase.intro}</Typography>
								<Box component='ul' sx={{ listStyle: 'none', m: 0, mt: 2.5, p: 0, display: 'grid', gap: 1.25 }}>
									{useCase.bullets.map((bullet) => <CheckItem key={bullet}>{bullet}</CheckItem>)}
								</Box>
								<Box sx={{ mt: 3.5 }}>
									{useCase.action === 'contact' ? (
										<Button variant='outlined' href={CONTACT_URL || BDREN_URL} sx={outlinedBlueSx}>{useCase.cta}</Button>
									) : (
										<Button
											variant='contained'
											color={useCase.action === 'start' ? 'secondary' : 'primary'}
											endIcon={<ArrowForwardRounded />}
											onClick={useCase.action === 'start' ? onStart : onJoin}
											onMouseEnter={prefetchApp}
											sx={{ boxShadow: 'none', ...focusRing() }}
										>
											{useCase.cta}
										</Button>
									)}
								</Box>
							</Box>
							<BrowserFrame url={`${window.location.host}/${useCase.room}`} label={useCase.mockLabel} elevation={2} ratio={{ xs: '16 / 10', md: '4 / 3' }}>
								<ProductMock variant={useCase.mock} />
							</BrowserFrame>
						</Box>
					);
				})}
			</Box>
		</SectionShell>
	);
};

// "Making news, making impact" bento grid (§7.9). One gradient surface per card,
// the whole card is one link, tall cards carry an illustration that bleeds to the
// bottom edge. Colors are CSS variables on the section so the theme is easy to change.
const NEWS_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700;800&display=swap';
const newsSerif = '"Fraunces", Georgia, "Times New Roman", serif';
const newsSans = '"Inter", Roboto, system-ui, -apple-system, "Segoe UI", sans-serif';

// Loads the two web fonts once, only for this section; the fallbacks keep the layout if it fails.
const useNewsFonts = (): void => {
	useEffect(() => {
		if (document.querySelector(`link[href="${NEWS_FONTS_URL}"]`)) return;

		const preconnect = document.createElement('link');
		const stylesheet = document.createElement('link');

		preconnect.rel = 'preconnect';
		preconnect.href = 'https://fonts.gstatic.com';
		preconnect.crossOrigin = '';
		stylesheet.rel = 'stylesheet';
		stylesheet.href = NEWS_FONTS_URL;
		document.head.append(preconnect, stylesheet);
	}, []);
};

// Frosted-glass panel used as a decorative overlay on the tall cards.
const glassSx: SxProps<Theme> = {
	position: 'absolute',
	borderRadius: '12px',
	// 15 % white glass over a light navy tint, so white text stays readable over busy art.
	background: 'linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.15)), rgba(10, 26, 107, 0.45)',
	border: '1px solid rgba(255, 255, 255, 0.25)',
	backdropFilter: 'blur(12px)',
	WebkitBackdropFilter: 'blur(12px)',
	color: brand.white,
	fontFamily: newsSans,
	boxShadow: '0 12px 32px rgba(6, 18, 79, 0.35)',
};

// Card 1: a laptop in a live class with a floating transcript panel.
const TranscriptArt = (): React.JSX.Element => (
	<Box aria-hidden sx={{ position: 'relative', height: 190, mt: 'auto', mx: -4, mb: -4 }}>
		{/* Video tiles on the left sit under the glass panel, so its white text stays readable. */}
		<Box sx={{ position: 'absolute', left: '14%', right: '8%', bottom: 18, height: 132, borderRadius: '12px 12px 0 0', border: '6px solid #1d2a5c', borderBottom: 0, bgcolor: '#0d1740', p: 1, display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 0.75 }}>
			<Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 0.75 }}>
				{MOCK_STUDENTS.slice(0, 2).map((student) => (
					<Box key={student.initials} sx={{ borderRadius: '6px', bgcolor: '#1b2f7a', display: 'grid', placeItems: 'center' }}>
						<MockAvatar initials={student.initials} color={student.color} size={22} />
					</Box>
				))}
			</Box>
			<Box sx={{ borderRadius: '6px', bgcolor: 'rgba(255, 255, 255, 0.92)', p: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
				<Box sx={{ height: 5, width: '60%', borderRadius: 4, bgcolor: brand.navy }} />
				<Box sx={{ height: 3, width: 20, borderRadius: 4, bgcolor: brand.orange }} />
				{[ '90%', '75%', '82%' ].map((width) => <Box key={width} sx={{ height: 4, width, borderRadius: 4, bgcolor: brand.blueLight }} />)}
			</Box>
		</Box>
		<Box sx={{ position: 'absolute', left: '8%', right: '8%', bottom: 0, height: 18, borderRadius: '4px 4px 0 0', background: 'linear-gradient(#2b3a73, #1d2a5c)' }} />
		<Box sx={{ ...glassSx, left: 20, top: 0, width: 184, p: 1.5 } as SxProps<Theme>}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 11, fontWeight: 500, mb: 0.75 }}>
				<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ff6b6b', boxShadow: '0 0 0 3px rgba(255, 107, 107, 0.3)' }} />
				Live transcript
			</Box>
			<Box sx={{ fontSize: 11, lineHeight: 1.4 }}><strong>Dr. Ahmed</strong> The client sends SYN to open the connection.</Box>
		</Box>
	</Box>
);

// Card 2: a graduation cap with a frosted workshop panel.
const WorkshopArt = (): React.JSX.Element => (
	<Box aria-hidden sx={{ position: 'relative', height: 190, mt: 'auto', mx: -4, mb: -4 }}>
		<SchoolRounded sx={{ position: 'absolute', left: -14, bottom: -34, fontSize: 210, color: 'rgba(255, 255, 255, 0.16)' }} />
		<Box sx={{ ...glassSx, right: 28, top: 8, width: 200, p: 1.5 } as SxProps<Theme>}>
			<Box sx={{ fontSize: 11, fontWeight: 500, opacity: 0.9 }}>Workshop</Box>
			<Box sx={{ fontSize: 13, fontWeight: 500, mt: 0.25 }}>Teaching online, well</Box>
			<Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
				{MOCK_STUDENTS.map((student, index) => (
					<Box key={student.initials} sx={{ ml: index ? -0.75 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.6)' }}>
						<MockAvatar initials={student.initials} color={student.color} size={22} />
					</Box>
				))}
				<Box sx={{ ml: 1, fontSize: 11, opacity: 0.9 }}>+44 joined</Box>
			</Box>
		</Box>
		<Box sx={{ ...glassSx, left: 110, bottom: 28, px: 1.25, py: 0.75, fontSize: 11, fontWeight: 500 } as SxProps<Theme>}>3 live sessions</Box>
	</Box>
);

const NEWS_ART: Record<string, () => React.JSX.Element> = { transcript: TranscriptArt, workshop: WorkshopArt };

const News = (): React.JSX.Element => {
	useNewsFonts();

	return (
		<Box
			component='section'
			id='news'
			aria-labelledby='news-title'
			sx={{
				'--news-blue': '#0B5CFF',
				'--news-deep': '#0A1A6B',
				'--news-deepest': '#06124F',
				'--news-ink': '#0A1033',
				'--news-glow': 'rgba(11, 92, 255, 0.25)',
				bgcolor: brand.white,
				py: layout.sectionY,
				px: layout.gutter,
				scrollMarginTop: layout.navH,
			}}
		>
			<Box data-reveal sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
				<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'var(--news-blue)', fontFamily: newsSans, fontSize: 14, fontWeight: 500, mb: 1.5 }}>
					<Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'var(--news-blue)', boxShadow: '0 0 0 4px rgba(11, 92, 255, 0.15), 0 0 12px rgba(11, 92, 255, 0.8)' }} />
					{strings.news.eyebrow}
				</Box>
				<Typography
					variant='h2'
					id='news-title'
					sx={{ fontFamily: newsSerif, fontWeight: 500, fontSize: 'clamp(2rem, 1.4rem + 2.4vw, 3rem)', lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--news-ink)' }}
				>
					{strings.news.title}
				</Typography>
			</Box>

			<Box
				sx={{
					maxWidth: 1120,
					mx: 'auto',
					display: 'grid',
					gap: '20px',
					gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
					gridAutoRows: { md: 'minmax(190px, auto)' },
					gridAutoFlow: { md: 'dense' },
				}}
			>
				{NEWS.map((item, index) => {
					const Art = item.art ? NEWS_ART[item.art] : undefined;
					const tall = Boolean(Art);
					const titleId = `news-${index}-title`;

					return (
						<Box
							component='article'
							key={item.title}
							data-reveal
							sx={{
								'--ek-reveal-index': index % 3,
								gridRow: tall ? { md: 'span 2' } : undefined,
								minHeight: tall ? { xs: 440, lg: 400 } : undefined,
								display: 'flex',
							}}
						>
							<Box
								component='a'
								href={item.href ?? (NEWS_URL || BDREN_URL)}
								aria-labelledby={titleId}
								aria-describedby={`news-${index}-desc`}
								sx={{
									position: 'relative',
									flex: 1,
									display: 'flex',
									flexDirection: 'column',
									overflow: 'hidden',
									p: 4,
									borderRadius: '20px',
									color: brand.white,
									textDecoration: 'none',
									background: 'linear-gradient(180deg, var(--news-blue) 0%, var(--news-deep) 60%, var(--news-deepest) 100%)',
									boxShadow: '0 1px 2px rgba(6, 18, 79, 0.2)',
									transition: `transform ${motion.base}ms ease, box-shadow ${motion.base}ms ease, filter ${motion.base}ms ease`,
									'&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 40px var(--news-glow)', filter: 'brightness(1.08) saturate(1.05)' },
									'&:hover .ek-news-arrow': { transform: 'scale(1.1) rotate(45deg)' },
									'&:focus-visible': { outline: '3px solid var(--news-blue)', outlineOffset: '3px' },
									[reducedMotion]: { transition: 'none', '&:hover': { transform: 'none' }, '&:hover .ek-news-arrow': { transform: 'none' } },
								}}
							>
								<Box component='span' sx={{ alignSelf: 'flex-start', px: 1.25, py: 0.5, borderRadius: radius.pill, bgcolor: 'rgba(255, 255, 255, 0.15)', fontFamily: newsSans, fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>
									{item.category}
								</Box>
								<Typography component='h3' id={titleId} sx={{ mt: 2, fontFamily: newsSerif, fontWeight: 500, fontSize: { xs: 20, md: 22 }, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
									{item.title}
								</Typography>
								<Typography id={`news-${index}-desc`} sx={{ mt: 1.5, fontFamily: newsSans, fontSize: { xs: 15, md: 16 }, lineHeight: 1.55, opacity: 0.9 }}>
									{item.desc}
								</Typography>
								<Typography component='span' sx={{ mt: 1.25, pr: 7, fontFamily: newsSans, fontSize: 13, opacity: 0.7 }}>{item.date}</Typography>
								{Art && <Art />}
								<Box
									className='ek-news-arrow'
									aria-hidden
									sx={{ position: 'absolute', right: 20, bottom: 20, width: 40, height: 40, borderRadius: '50%', bgcolor: brand.white, color: 'var(--news-ink)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(6, 18, 79, 0.3)', transition: `transform ${motion.base}ms ease` }}
								>
									<NorthEastRounded sx={{ fontSize: 14 }} />
								</Box>
							</Box>
						</Box>
					);
				})}
			</Box>

			{NEWS_URL && (
				<Box sx={{ mt: 5, textAlign: 'center' }}><ArrowLink href={NEWS_URL}>{strings.news.viewAll}</ArrowLink></Box>
			)}
		</Box>
	);
};

const CtaBand = ({ onStart, onJoin }: { onStart: () => void; onJoin: () => void }): React.JSX.Element => (
	<SectionShell id='cta' background={brand.white}>
		<Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: radius.lg, background: brand.ctaGradient, color: brand.white, p: { xs: 4, md: 8 }, textAlign: { md: 'center' } }}>
			<Box aria-hidden sx={{ position: 'absolute', width: 320, height: 320, top: -140, right: -80, borderRadius: '50%', bgcolor: brand.blue, opacity: 0.35, filter: 'blur(80px)' }} />
			<Box aria-hidden sx={{ position: 'absolute', width: 260, height: 260, bottom: -140, left: -60, borderRadius: '50%', bgcolor: brand.orange, opacity: 0.2, filter: 'blur(80px)' }} />
			<Box sx={{ position: 'relative' }}>
				<Typography variant='h2' id='cta-title'>{strings.ctaBand.title}</Typography>
				{/* Full white: the gradient's light end is too bright for 85 % white (4.4:1). */}
				<Typography sx={{ mt: 2, fontSize: '1.125rem', color: brand.white }}>{strings.ctaBand.body}</Typography>
				<Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: { md: 'center' } }}>
					<Button variant='contained' color='secondary' size='large' endIcon={<ArrowForwardRounded />} onClick={onStart} onMouseEnter={prefetchApp} sx={{ boxShadow: 'none', '&:hover': { bgcolor: brand.orangeDark }, ...focusRing(true) }}>
						{strings.common.start}
					</Button>
					<Button variant='outlined' size='large' onClick={onJoin} sx={{ color: brand.white, borderColor: 'rgba(255, 255, 255, 0.6)', '&:hover': { borderColor: brand.white, bgcolor: 'rgba(255, 255, 255, 0.08)' }, ...focusRing(true) }}>
						{strings.common.join}
					</Button>
				</Box>
				<Typography sx={{ mt: 3, fontSize: 14, color: brand.white }}>
					{strings.ctaBand.help}{' '}
					<Link href={CONTACT_URL || BDREN_URL} sx={{ color: brand.white, fontWeight: 500, textDecorationColor: 'currentColor', display: 'inline-flex', alignItems: 'center', gap: 0.5, ...focusRing(true) }}>
						{strings.ctaBand.helpLink}
						<ArrowForwardRounded aria-hidden sx={{ fontSize: 18 }} />
					</Link>
				</Typography>
			</Box>
		</Box>
	</SectionShell>
);

// ── Page ──

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

const HomePage = (): React.JSX.Element | null => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const localeInProgress = useAppSelector((state) => state.room.localeInProgress);
	const loginEnabled = useAppSelector((state) => state.permissions.loginEnabled);
	const loggedIn = useAppSelector((state) => state.permissions.loggedIn);
	const standalone = useMediaQuery('(display-mode: standalone)');

	const [ drawerOpen, setDrawerOpen ] = useState(false);
	const [ meetingsOpen, setMeetingsOpen ] = useState(false);
	const [ installOpen, setInstallOpen ] = useState(false);
	const [ installEvent, setInstallEvent ] = useState<BeforeInstallPromptEvent | null>(null);
	const [ atTop, setAtTop ] = useState(true);
	const [ heroCtasVisible, setHeroCtasVisible ] = useState(true);
	const [ ctaBandVisible, setCtaBandVisible ] = useState(false);
	const [ keyboardOpen, setKeyboardOpen ] = useState(false);
	const [ toast, setToast ] = useState<string | null>(null);
	const [ rooms, setRooms ] = useState<Room[]>([]);
	const starting = useRef(false);
	const scheduleAfterLogin = useRef(false);

	// The Quick Join dialog lives in the URL (#join / #host), so it can be linked
	// to and the Back button closes it (§6.7).
	const quickJoinView: QuickJoinView | null = location.hash === '#join' || location.hash === '#host' ? location.hash.slice(1) as QuickJoinView : null;
	const [ lastView, setLastView ] = useState<QuickJoinView>(quickJoinView ?? 'join');

	useEffect(() => {
		if (quickJoinView) setLastView(quickJoinView);
	}, [ quickJoinView ]);

	const topSentinelRef = useRef<HTMLDivElement>(null);
	const heroCtasRef = useRef<HTMLDivElement>(null);

	const config = {
		transcriptionEnabled: edumeetConfig.transcriptionEnabled,
		qrCodeEnabled: edumeetConfig.qrCodeEnabled,
		myRoomsTabEnabled: edumeetConfig.myRoomsTabEnabled,
		myMeetingsTabEnabled: edumeetConfig.myMeetingsTabEnabled,
		privacyUrl: edumeetConfig.privacyUrl ?? '',
		imprintUrl: edumeetConfig.imprintUrl ?? '',
		info: {
			enabled: edumeetConfig.infoTooltipEnabled,
			text: edumeetConfig.infoTooltipText ?? '',
			desc: edumeetConfig.infoTooltipDesc ?? '',
			link: edumeetConfig.infoTooltipLink ?? '',
		},
	};

	useEffect(() => {
		dispatch(startListeners());
		dispatch(checkJWT());

		return () => {
			dispatch(stopListeners());
		};
	}, [ dispatch ]);

	useEffect(() => {
		const previousTitle = document.title;
		// index.html still carries the old edumeet description; the homepage replaces it while open.
		const description = document.querySelector('meta[name="description"]');
		const previousDescription = description?.getAttribute('content');

		document.title = strings.meta.title;
		description?.setAttribute('content', strings.meta.description);

		return () => {
			document.title = previousTitle;
			if (previousDescription !== null && previousDescription !== undefined) description?.setAttribute('content', previousDescription);
		};
	}, []);

	// Owned rooms for the Join view and the account menu: fetched on sign-in, when
	// the dialog opens and when the tab becomes visible again (as LandingPage.tsx).
	const quickJoinOpen = quickJoinView !== null;
	const canListRooms = config.myRoomsTabEnabled && loggedIn;

	useEffect(() => {
		if (!canListRooms) {
			setRooms([]);

			return;
		}

		const fetchRooms = (): void => {
			dispatch(getData('rooms', { ownedOnly: true })).then((data: unknown) => {
				if (data && typeof data === 'object' && 'data' in data) setRooms((data as { data: Room[] }).data);
			});
		};
		const onVisible = (): void => {
			if (!document.hidden) fetchRooms();
		};

		fetchRooms();
		document.addEventListener('visibilitychange', onVisible);

		return () => document.removeEventListener('visibilitychange', onVisible);
	}, [ canListRooms, quickJoinOpen, dispatch ]);

	// Schedule while signed out: sign in first (a new tab), then open the scheduler.
	useEffect(() => {
		if (loggedIn && scheduleAfterLogin.current) {
			scheduleAfterLogin.current = false;
			setMeetingsOpen(true);
		}
	}, [ loggedIn ]);

	// One-time reveal of section headers and cards as they scroll in (§10). Uses a
	// data attribute, not a class, so React re-renders never undo it.
	useEffect(() => {
		if (localeInProgress) return;

		const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])'));

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
			elements.forEach((element) => element.setAttribute('data-revealed', ''));

			return;
		}

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;

				entry.target.setAttribute('data-revealed', '');
				observer.unobserve(entry.target);
			});
		}, { rootMargin: '0px 0px -8% 0px' });

		elements.forEach((element) => observer.observe(element));

		return () => observer.disconnect();
	}, [ localeInProgress ]);

	// Download app: keep the browser's install prompt for when the user asks for it.
	useEffect(() => {
		const onPrompt = (event: Event): void => {
			event.preventDefault();
			setInstallEvent(event as BeforeInstallPromptEvent);
		};
		const onInstalled = (): void => setInstallEvent(null);

		window.addEventListener('beforeinstallprompt', onPrompt);
		window.addEventListener('appinstalled', onInstalled);

		return () => {
			window.removeEventListener('beforeinstallprompt', onPrompt);
			window.removeEventListener('appinstalled', onInstalled);
		};
	}, []);

	// Navbar turns solid after 16 px of scroll; the phone sticky bar shows once the
	// hero CTAs leave the view and hides over the closing CTA band, which has the same
	// buttons. No scroll listeners.
	useEffect(() => {
		if (localeInProgress) return;

		const watch = (element: Element | null, onChange: React.Dispatch<React.SetStateAction<boolean>>): IntersectionObserver | null => {
			if (!element) return null;

			const observer = new IntersectionObserver(([ entry ]) => onChange(entry.isIntersecting));

			observer.observe(element);

			return observer;
		};
		const observers = [
			watch(topSentinelRef.current, setAtTop),
			watch(heroCtasRef.current, setHeroCtasVisible),
			watch(document.getElementById('cta'), setCtaBandVisible),
		];

		return () => observers.forEach((observer) => observer?.disconnect());
	}, [ localeInProgress ]);

	// An on-screen keyboard shrinks the visual viewport; hide the sticky bar then.
	useEffect(() => {
		const viewport = window.visualViewport;

		if (!viewport) return;

		const onResize = (): void => setKeyboardOpen(viewport.height < window.innerHeight - 150);

		viewport.addEventListener('resize', onResize);

		return () => viewport.removeEventListener('resize', onResize);
	}, []);

	// Start a class: a fresh readable room, straight to the room page. The room
	// chunk loads first so there is no blank screen; the ref stops double clicks.
	const startClass = useCallback((): void => {
		if (starting.current) return;

		starting.current = true;
		import('../App')
			.catch(() => undefined)
			.finally(() => navigate(`/${randomRoomName()}`));
	}, [ navigate ]);

	const openQuickJoin = useCallback((view: QuickJoinView, myRooms = false): void => {
		navigate({ hash: view }, { state: { quickJoin: true, myRooms } });
	}, [ navigate ]);

	const changeQuickJoinView = (view: QuickJoinView): void => {
		navigate({ hash: view }, { replace: true, state: location.state });
	};

	// Back when we opened it (so Forward reopens it); a replace when the page was opened on #join.
	const closeQuickJoin = (): void => {
		if ((location.state as { quickJoin?: boolean } | null)?.quickJoin) navigate(-1);
		else navigate({ hash: '' }, { replace: true });
	};

	const schedule = (): void => {
		if (loggedIn) {
			setMeetingsOpen(true);
		} else {
			scheduleAfterLogin.current = true;
			dispatch(login());
		}
	};

	const download = (): void => {
		if (installEvent) {
			installEvent.prompt();
			setInstallEvent(null);
		} else {
			setInstallOpen(true);
		}
	};

	if (localeInProgress) return null;

	const meetItems: MeetItem[] = [
		{ key: 'join', label: strings.meetMenu.join, desc: strings.meetMenu.joinDesc, icon: LoginRounded, onSelect: () => openQuickJoin('join') },
		{ key: 'host', label: strings.meetMenu.host, desc: strings.meetMenu.hostDesc, icon: VideoCallRounded, onSelect: () => openQuickJoin('host') },
		...(loginEnabled && config.myMeetingsTabEnabled ? [
			{ key: 'schedule', label: strings.meetMenu.schedule, desc: strings.meetMenu.scheduleDesc, icon: CalendarMonthRounded, onSelect: schedule },
		] : []),
		...(!standalone ? [
			{ key: 'download', label: strings.meetMenu.download, desc: strings.meetMenu.downloadDesc, icon: DownloadRounded, divider: true, onSelect: download },
		] : []),
	];

	const accountItems: MeetItem[] = [
		...(config.myMeetingsTabEnabled ? [
			{ key: 'my-meetings', label: strings.account.myMeetings, desc: strings.account.myMeetingsDesc, icon: CalendarMonthRounded, onSelect: () => setMeetingsOpen(true) },
		] : []),
		...(rooms.length > 0 ? [
			{ key: 'my-rooms', label: strings.account.myRooms, desc: strings.account.myRoomsDesc, icon: MeetingRoomRounded, onSelect: () => openQuickJoin('join', true) },
		] : []),
	];

	const signIn = (): void => {
		dispatch(login());
	};
	const signOut = (): void => {
		dispatch(logout());
	};

	return (
		<ThemeProvider theme={homeTheme}>
			<Box
				id='top'
				sx={{
					position: 'relative',
					minHeight: '100svh',
					height: '100%',
					overflowX: 'hidden',
					overflowY: 'auto',
					bgcolor: brand.white,
					color: brand.navy,
					// Reveal (§10): `translate`, not `transform`, so card hover lifts still work.
					'& [data-reveal]': {
						opacity: 0,
						translate: '0 16px',
						transition: `opacity ${motion.slow}ms ${motion.ease}, translate ${motion.slow}ms ${motion.ease}, transform ${motion.base}ms ${motion.ease}, box-shadow ${motion.base}ms ${motion.ease}, border-color ${motion.base}ms`,
						transitionDelay: 'calc(var(--ek-reveal-index, 0) * 60ms), calc(var(--ek-reveal-index, 0) * 60ms), 0ms, 0ms, 0ms',
					},
					'& [data-reveal][data-revealed]': { opacity: 1, translate: '0 0' },
					[reducedMotion]: { '& [data-reveal]': { opacity: 1, translate: 'none', transition: 'none' } },
				}}
			>
				<Box ref={topSentinelRef} aria-hidden sx={{ position: 'absolute', top: 0, left: 0, width: 1, height: 16, pointerEvents: 'none' }} />
				<Link
					href='#main'
					sx={{
						position: 'absolute',
						left: 16,
						top: -48,
						zIndex: 1000,
						px: 2,
						py: 1,
						bgcolor: brand.orange,
						color: brand.navy,
						fontWeight: 500,
						borderRadius: radius.sm,
						textDecoration: 'none',
						'&:focus': { top: 16 },
					}}
				>
					{strings.common.skip}
				</Link>

				<RecoverRecording />

				<Box component='header' sx={{ display: 'contents' }}>
					<UtilityBar />
					<Navbar
						solid
						raised={!atTop}
						meetItems={meetItems}
						showSignIn={loginEnabled}
						loggedIn={loggedIn}
						accountItems={accountItems}
						onSignIn={signIn}
						onSignOut={signOut}
						onStart={startClass}
						onJoin={() => openQuickJoin('join')}
						drawerOpen={drawerOpen}
						onOpenDrawer={() => setDrawerOpen(true)}
					/>
				</Box>

				<NavDrawer
					open={drawerOpen}
					onClose={() => setDrawerOpen(false)}
					meetItems={meetItems}
					accountItems={accountItems}
					showSignIn={loginEnabled}
					loggedIn={loggedIn}
					onSignIn={signIn}
					onSignOut={signOut}
					onStart={startClass}
				/>

				<Box component='main' id='main' tabIndex={-1} sx={{ outline: 'none' }}>
					{/* Hero (UpdateHomePageDesignplan.md §4.1): white, under the solid navbar. */}
					<Box
						component='section'
						id='hero'
						aria-labelledby='hero-title'
						sx={{
							position: 'relative',
							overflow: 'hidden',
							bgcolor: brand.white,
							color: brand.navy,
							display: 'flex',
							alignItems: 'center',
							pt: { xs: 5, md: 8, lg: 6 },
							pb: { xs: 6, md: 8, lg: 6 },
							// At 1366 × 768 the utility bar, navbar and the whole hero fit (§5.3).
							minHeight: { lg: 'min(calc(100svh - 100px), 720px)' },
						}}
					>
						<Container maxWidth={false} sx={{ position: 'relative', maxWidth: layout.container, px: layout.gutter }}>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1.05fr)' }, columnGap: 8, rowGap: { xs: 5, md: 7 }, alignItems: 'center' }}>
								<Box sx={{ width: '100%', maxWidth: { md: 640, lg: 'none' }, mx: { md: 'auto', lg: 0 } }}>
									<Typography sx={{ color: brand.blueDark, fontSize: 15, fontWeight: 500, mb: 2 }}>{strings.hero.eyebrow}</Typography>
									<Typography variant='h1' id='hero-title' sx={{ color: brand.navy, letterSpacing: '-0.02em', lineHeight: 1.08 }}>{strings.hero.title}</Typography>
									<Box aria-hidden sx={{ width: 56, height: 4, borderRadius: radius.pill, bgcolor: brand.orange, my: 3 }} />
									<Typography sx={{ fontSize: { xs: '1.0625rem', md: '1.1875rem' }, lineHeight: 1.55, color: brand.textSecondary, maxWidth: 540 }}>
										{strings.hero.subtitle}
									</Typography>
									<HeroActions ctasRef={heroCtasRef} onStart={startClass} onOpenJoin={() => openQuickJoin('join')} />
									{TOUR_URL && (
										<Link href={TOUR_URL} sx={{ mt: 2, display: 'inline-flex', alignItems: 'center', gap: 0.75, color: brand.blueDark, fontWeight: 500, ...focusRing() }}>
											<PlayCircleOutlineRounded aria-hidden sx={{ fontSize: 20 }} />
											{strings.hero.tour}
										</Link>
									)}
								</Box>

								<Box sx={{ width: '100%', maxWidth: { md: 600, lg: 'none' }, mx: { md: 'auto', lg: 0 } }}>
									<HeroScenes captions={config.transcriptionEnabled} />
								</Box>
							</Box>
						</Container>
					</Box>

					<TrustedBy />
					<HowItWorks onStart={startClass} />
					<FeatureTour transcriptionEnabled={config.transcriptionEnabled} onStart={startClass} />
					<Spotlight transcriptionEnabled={config.transcriptionEnabled} />
					<UseCases onStart={startClass} onJoin={() => openQuickJoin('join')} />
					<News />
					<CtaBand onStart={startClass} onJoin={() => openQuickJoin('join')} />
				</Box>

				<StickyBar visible={!heroCtasVisible && !ctaBandVisible && !keyboardOpen} onJoin={() => openQuickJoin('join')} onStart={startClass} />

				<InstallDialog open={installOpen} onClose={() => setInstallOpen(false)} />

				<QuickJoinDialog
					open={quickJoinView !== null}
					view={quickJoinView ?? lastView}
					onViewChange={changeQuickJoinView}
					onClose={closeQuickJoin}
					qrCodeEnabled={config.qrCodeEnabled}
					privacyUrl={config.privacyUrl}
					onToast={setToast}
					rooms={rooms}
					preferMyRooms={Boolean((location.state as { myRooms?: boolean } | null)?.myRooms)}
				/>

				<Snackbar
					open={toast !== null}
					message={toast}
					autoHideDuration={4000}
					onClose={() => setToast(null)}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
					slotProps={{ content: { role: 'status', sx: { bgcolor: brand.navy, color: brand.white } } }}
					sx={{ bottom: { xs: 88, md: 24 } }}
				/>

				{meetingsOpen && (
					<Suspense>
						<MeetingsDialog open={meetingsOpen} onClose={() => setMeetingsOpen(false)} />
					</Suspense>
				)}
			</Box>
		</ThemeProvider>
	);
};

export default HomePage;
