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
	InputAdornment,
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
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import AutorenewRounded from '@mui/icons-material/AutorenewRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import CallEndRounded from '@mui/icons-material/CallEndRounded';
import CallSplitRounded from '@mui/icons-material/CallSplitRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
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
import LiveTvRounded from '@mui/icons-material/LiveTvRounded';
import LockRounded from '@mui/icons-material/LockRounded';
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded';
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
import PlayCircleOutlineRounded from '@mui/icons-material/PlayCircleOutlineRounded';
import PanToolRounded from '@mui/icons-material/PanToolRounded';
import PodcastsRounded from '@mui/icons-material/PodcastsRounded';
import ScreenShareRounded from '@mui/icons-material/ScreenShareRounded';
import SchoolRounded from '@mui/icons-material/SchoolRounded';
import SubtitlesRounded from '@mui/icons-material/SubtitlesRounded';
import SupportAgentRounded from '@mui/icons-material/SupportAgentRounded';
import VideoCallRounded from '@mui/icons-material/VideoCallRounded';
import VideocamRounded from '@mui/icons-material/VideocamRounded';
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
	heroGradient: 'linear-gradient(135deg, #042c6a 0%, #0b3f8f 55%, #1a81ec 130%)',
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
		newName: 'New room name',
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
		errSpace: 'Room names can\'t have spaces. Try my-class.',
		errShort: 'Use at least 3 characters.',
		// placeholder until the transcriber languages and room size are confirmed (Q4)
		inClass: '32 in class',
		fromLink: 'We took the room name from your link.',
	},
	hero: {
		eyebrow: 'Bangladesh Research and Education Network (BdREN) · For all research institutes and organizations',
		title: 'Online meetings for every Institutions and Organization in Bangladesh',
		subtitle: 'Teach, meet and record securely in your browser. No time limits, on BdREN\'s own network.',
		tour: 'Watch a 1-minute tour',
		// trustNoInstall: 'No install needed',
		// trustEncryption: 'End-to-end encryption available',
		// trustRecording: 'Recording and transcription',
		mockLabel: 'eduKotha class in progress: a teacher shares slides while students take part by video and chat',
	},
	trustedBy: {
		eyebrow: 'Higher education in Bangladesh',
		titleStart: 'Built for ',
		titleHighlight: 'every university',
		titleEnd: ' in Bangladesh',
		subtitle: 'One secure platform for classes, meetings and research, on BdREN\'s national research and education network.',
		listLabel: 'Universities in Bangladesh',
	},
	productChips: {
		eyebrow: 'One platform',
		title: 'Everything a class needs, in one link',
		learnMore: 'Learn more',
		label: 'eduKotha features',
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
	footer: {
		label: 'Footer',
		service: 'A service of BdREN',
		about: 'A service of BdREN, the national research and education network.',
		follow: 'Follow',
		infoLink: 'Learn more',
		imprint: 'Imprint',
		privacy: 'Privacy policy',
		copyright: `© ${new Date().getFullYear()} BdREN. All rights reserved.`,
		backToTop: 'Back to top',
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

type Chip = { key: MockVariant; label: string; title: string; text: string; bullets: string[]; icon: SvgIconComponent; mockLabel: string; href?: string };

const CHIPS: Chip[] = [
	{ key: 'classes', label: 'Online classes', icon: SchoolRounded, title: 'Online classes', text: 'Teach live from your browser. Share slides, write on the whiteboard and talk with every student.', bullets: [ 'Slides and screen sharing', 'Hand raising and chat', 'Works on phones' ], mockLabel: 'A live lecture: the teacher\'s slides next to student video tiles' },
	{ key: 'meetings', label: 'Meetings', icon: GroupsRounded, title: 'Meetings', text: 'Meet colleagues in a secure room with a lobby and a room lock.', bullets: [ 'Waiting-room lobby', 'Room lock', 'One link to join' ], mockLabel: 'A meeting with six video tiles and two people waiting in the lobby' },
	{ key: 'webinars', label: 'Webinars', icon: PodcastsRounded, title: 'Webinars', text: 'Stream a lecture or event live to a larger audience.', bullets: [ 'Live streaming', 'Moderated questions', 'Recording' ], mockLabel: 'A live stream with a speaker and audience questions' },
	{ key: 'recording', label: 'Recording', icon: FiberManualRecordRounded, title: 'Recording', text: 'Record classes on the server, so nothing depends on one laptop.', bullets: [ 'Server-side recording', 'Start and stop from the room', 'Share the file later' ], mockLabel: 'A recording in progress next to a list of past recordings' },
	{ key: 'transcription', label: 'Transcription', icon: SubtitlesRounded, title: 'Transcription', text: 'Get a live transcript in the room\'s language.', bullets: [ 'Live captions', 'Searchable text', 'In the room\'s language' ], mockLabel: 'The live transcript panel next to two video tiles' },
	{ key: 'whiteboard', label: 'Whiteboard', icon: DrawRounded, title: 'Whiteboard', text: 'Draw, write and explain together on a shared board.', bullets: [ 'Pens and shapes', 'Everyone can draw', 'Export the board' ], mockLabel: 'A shared whiteboard with a diagram of the TCP handshake' },
	{ key: 'breakout', label: 'Breakout rooms', icon: CallSplitRounded, title: 'Breakout rooms', text: 'Split the class into groups and bring everyone back in one click.', bullets: [ 'Group work', 'Move people between rooms', 'Close all at once' ], mockLabel: 'Three breakout groups of four students each' },
	{ key: 'chat', label: 'Chat & files', icon: ForumRounded, title: 'Chat and files', text: 'Send messages and share files without leaving the class.', bullets: [ 'Room chat', 'File sharing', 'Private messages' ], mockLabel: 'The room chat with messages and a shared PDF file' },
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

const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
	{
		title: 'Product',
		links: [
			{ label: 'Online classes', href: '#products' },
			{ label: 'Meetings', href: '#products' },
			{ label: 'Recording', href: '#recording' },
			{ label: 'Transcription', href: '#recording' },
			{ label: 'Whiteboard', href: '#products' },
			{ label: 'Pricing', href: PRICING_URL },
		],
	},
	{
		title: 'Solutions',
		links: [
			{ label: 'Teachers', href: '#use-cases' },
			{ label: 'Students', href: '#use-cases' },
			{ label: 'Researchers', href: '#use-cases' },
			{ label: 'IT admins', href: '#use-cases' },
		],
	},
	{
		title: 'Resources',
		links: [
			{ label: 'Help centre' },
			{ label: 'Getting started' },
			{ label: 'System status', href: STATUS_URL },
			{ label: 'News', href: '#news' },
			{ label: 'Install the app' },
		],
	},
	{
		title: 'BdREN',
		links: [
			{ label: 'About BdREN', href: BDREN_URL },
			{ label: 'Contact', href: CONTACT_URL },
			{ label: 'Terms of use' },
		],
	},
];

const SOCIAL: { label: string; href: string }[] = []; // filled once BdREN confirms channels (Q8)

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

const Navbar = ({ solid, meetItems, showSignIn, loggedIn, accountItems, onSignIn, onSignOut, onStart, onJoin, drawerOpen, onOpenDrawer }: NavbarProps): React.JSX.Element => {
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
					boxShadow: solid ? `${shadow[1]}, inset 0 -1px 0 ${brand.border}` : 'none',
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

// ── Footer (§8) ──

const footerLinkSx: SxProps<Theme> = {
	color: brand.textOnDarkMuted,
	fontSize: 14,
	textDecoration: 'none',
	display: 'inline-flex',
	alignItems: 'center',
	minHeight: { xs: 44, md: 32 },
	'&:hover': { color: brand.white, textDecoration: 'underline' },
	...focusRing(true),
};

type FooterProps = {
	footerRef: React.Ref<HTMLElement>;
	imprintUrl: string;
	privacyUrl: string;
	info: { enabled: boolean; text: string; desc: string; link: string };
	onStart: () => void;
	onJoin: () => void;
};

const Footer = ({ footerRef, imprintUrl, privacyUrl, info, onStart, onJoin }: FooterProps): React.JSX.Element => {
	const phone = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
	const columns = FOOTER_COLUMNS
		.map((column) => ({
			...column,
			links: visibleLinks(column.title === 'BdREN' ? [
				...column.links,
				{ label: strings.footer.imprint, href: imprintUrl },
				{ label: strings.footer.privacy, href: privacyUrl },
			] : column.links),
		}))
		.filter((column) => column.links.length > 0);

	const linkList = (links: NavLink[]): React.JSX.Element => (
		<Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0 }}>
			{links.map((link) => (
				<li key={link.label}><Link href={link.href} sx={footerLinkSx}>{link.label}</Link></li>
			))}
		</Box>
	);

	return (
		<Box component='footer' ref={footerRef} sx={{ bgcolor: brand.navy, color: brand.white }}>
			<Container maxWidth={false} sx={{ maxWidth: layout.container, px: layout.gutter, pt: 8, pb: 6 }}>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)', lg: `2fr repeat(${columns.length}, 1fr)` }, gap: { xs: 4, md: 5 } }}>
					<Box sx={{ gridColumn: { md: '1 / -1', lg: 'auto' }, maxWidth: 400 }}>
						<Logo chip />
						<Typography sx={{ mt: 2, color: brand.textOnDarkMuted, fontSize: 14 }}>{strings.footer.about}</Typography>
						<Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
							<Button variant='contained' color='secondary' onClick={onStart} sx={{ boxShadow: 'none', ...focusRing(true) }}>{strings.common.start}</Button>
							<Button
								variant='outlined'
								onClick={onJoin}
								sx={{ color: brand.white, borderColor: 'rgba(255, 255, 255, 0.6)', '&:hover': { borderColor: brand.white, bgcolor: 'rgba(255, 255, 255, 0.08)' }, ...focusRing(true) }}
							>
								{strings.common.join}
							</Button>
						</Box>
						{info.enabled && info.text && (
							<Typography sx={{ mt: 3, fontSize: 14, color: brand.textOnDarkMuted, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
								<InfoOutlined aria-hidden sx={{ fontSize: 18, mt: '2px' }} />
								<span>
									<strong>{info.text}</strong>
									{info.desc && ` ${info.desc}`}
									{info.link && <> <Link href={info.link} sx={{ color: brand.blueOnNavy, ...focusRing(true) }}>{strings.footer.infoLink}</Link></>}
								</span>
							</Typography>
						)}
						{SOCIAL.length > 0 && (
							<Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
								<Typography sx={{ fontSize: 14, color: brand.textOnDarkMuted, mr: 1 }}>{strings.footer.follow}</Typography>
								{SOCIAL.map((item) => (
									<Link key={item.label} href={item.href} aria-label={item.label} sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(255, 255, 255, 0.12)', color: brand.white, display: 'grid', placeItems: 'center', ...focusRing(true) }}>
										<OpenInNewRounded aria-hidden sx={{ fontSize: 18 }} />
									</Link>
								))}
							</Box>
						)}
					</Box>

					<Box component='nav' aria-label={strings.footer.label} sx={{ display: 'contents' }}>
						{columns.map((column) => (phone ? (
							<Accordion
								key={column.title}
								disableGutters
								elevation={0}
								square
								sx={{ bgcolor: 'transparent', color: brand.white, borderBottom: '1px solid rgba(255, 255, 255, 0.12)', '&::before': { display: 'none' } }}
							>
								<AccordionSummary expandIcon={<ExpandMoreRounded sx={{ color: brand.white }} />} sx={{ px: 0, minHeight: 52, fontSize: 14, fontWeight: 500, ...focusRing(true) }}>
									{column.title}
								</AccordionSummary>
								<AccordionDetails sx={{ px: 0, pt: 0 }}>{linkList(column.links)}</AccordionDetails>
							</Accordion>
						) : (
							<Box key={column.title}>
								<Typography component='h2' sx={{ fontSize: 14, fontWeight: 500, mb: 1.5 }}>{column.title}</Typography>
								{linkList(column.links)}
							</Box>
						)))}
					</Box>
				</Box>
			</Container>

			<Box sx={{ bgcolor: brand.navy900 }}>
				<Container
					maxWidth={false}
					sx={{
						maxWidth: layout.container,
						px: layout.gutter,
						minHeight: 56,
						py: { xs: 2, md: 0 },
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 1,
						// Room for the phone sticky bar, which hides over the footer.
						pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', md: 0 },
					}}
				>
					<Typography sx={{ fontSize: 14, color: brand.textOnDarkMuted }}>{strings.footer.copyright}</Typography>
					<Link href='#top' sx={{ ...footerLinkSx, gap: 0.5 } as SxProps<Theme>}>
						{strings.footer.backToTop}
						<KeyboardArrowUpRounded aria-hidden sx={{ fontSize: 18 }} />
					</Link>
				</Container>
			</Box>
		</Box>
	);
};

// ── Hero picture (§7.1) ──

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

// A flat picture of a live eduKotha class, drawn with boxes (no image file, §16).
const HeroMock = ({ url }: { url: string }): React.JSX.Element => {
	const controls: { icon: SvgIconComponent; danger?: boolean; wide?: boolean }[] = [
		{ icon: MicRounded },
		{ icon: VideocamRounded },
		{ icon: ScreenShareRounded },
		{ icon: FiberManualRecordRounded, danger: true },
		{ icon: CallEndRounded, danger: true, wide: true },
	];

	return (
		<BrowserFrame url={url} label={strings.hero.mockLabel}>
			<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: brand.navy900, p: { xs: 1, sm: 1.5 }, gap: { xs: 1, sm: 1.5 } }}>
				<Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: { xs: 1, sm: 1.5 } }}>
					<Box sx={{ flex: 2.2, position: 'relative', borderRadius: radius.sm, bgcolor: brand.white, p: { xs: 1.25, sm: 2 }, display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 1 } }}>
						<Box sx={{ fontSize: { xs: 10, sm: 13 }, fontWeight: 700, color: brand.navy }}>CSE 101: Computer Networks</Box>
						<Box sx={{ height: 4, width: 32, borderRadius: radius.pill, bgcolor: brand.orange }} />
						{[ '92%', '78%', '85%', '60%' ].map((width) => (
							<Box key={width} sx={{ height: { xs: 5, sm: 7 }, width, borderRadius: radius.pill, bgcolor: brand.blueLight }} />
						))}
						<Box sx={{ mt: 'auto', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
							{[ 40, 64, 52, 80 ].map((height) => (
								<Box key={height} sx={{ width: '14%', height: `${height * 0.4}px`, borderRadius: '4px 4px 0 0', bgcolor: brand.blue, opacity: 0.25 + (height / 160) }} />
							))}
						</Box>
						<Box sx={{ position: 'absolute', right: 8, bottom: 8, p: 0.5, borderRadius: radius.sm, bgcolor: brand.navy700, display: 'flex', alignItems: 'center', gap: 0.75, pr: 1 }}>
							<MockAvatar initials='FA' color={brand.orange} size={22} />
							<Box sx={{ fontSize: 10, color: brand.white, display: { xs: 'none', sm: 'block' } }}>Dr. Ahmed</Box>
						</Box>
					</Box>
					<Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: { xs: 0.75, sm: 1 } }}>
						{MOCK_STUDENTS.map((student) => (
							<Box key={student.initials} sx={{ borderRadius: radius.sm, bgcolor: brand.navy700, display: 'grid', placeItems: 'center' }}>
								<MockAvatar initials={student.initials} color={student.color} />
							</Box>
						))}
					</Box>
					<Box sx={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: 0.75, borderRadius: radius.sm, bgcolor: brand.white, p: 1, [narrow]: { display: 'none' } }}>
						<Box sx={{ fontSize: 10, fontWeight: 700, color: brand.navy }}>Chat</Box>
						{MOCK_CHAT.map((message) => (
							<Box key={message.name} sx={{ borderRadius: '6px', bgcolor: brand.surfaceSubtle, px: 0.75, py: 0.5 }}>
								<Box sx={{ fontSize: 9, fontWeight: 700, color: brand.blueDark }}>{message.name}</Box>
								<Box sx={{ fontSize: 10, color: brand.navy, lineHeight: 1.3 }}>{message.text}</Box>
							</Box>
						))}
					</Box>
				</Box>
				<Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 0.75, sm: 1 } }}>
					{controls.map(({ icon: Icon, danger, wide }, index) => (
						<Box key={index} sx={{ height: { xs: 24, sm: 30 }, width: wide ? { xs: 36, sm: 44 } : { xs: 24, sm: 30 }, borderRadius: radius.pill, display: 'grid', placeItems: 'center', bgcolor: danger && wide ? '#d93b3b' : 'rgba(255, 255, 255, 0.14)', color: danger && !wide ? '#ff6b6b' : brand.white }}>
							<Icon sx={{ fontSize: { xs: 14, sm: 17 } }} />
						</Box>
					))}
				</Box>
			</Box>
		</BrowserFrame>
	);
};

const narrow = '@media (max-width: 479.95px)';

// Decorative chips that overlap the frame edges; hidden below 768 px (§7.1).
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
			borderRadius: radius.pill,
			bgcolor: brand.white,
			color: brand.navy,
			fontSize: 14,
			fontWeight: 500,
			boxShadow: shadow[2],
			whiteSpace: 'nowrap',
			...sx,
		} as SxProps<Theme>}
	>
		{children}
	</Box>
);

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
	randomizeOnBlank: boolean;
	qrCodeEnabled: boolean;
	privacyUrl: string;
	onToast: React.Dispatch<string>;
	rooms: Room[];
	preferMyRooms: boolean;
};

const QuickJoinDialog = ({ open, view, onViewChange, onClose, randomizeOnBlank, qrCodeEnabled, privacyUrl, onToast, rooms, preferMyRooms }: QuickJoinProps): React.JSX.Element => {
	const navigate = useNavigate();
	const phone = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
	const [ room, setRoom ] = useState(randomRoomName);
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

	// The Host view always starts with a fresh room.
	useEffect(() => {
		if (open && host) setRoom(randomRoomName());
	}, [ open, host ]);

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
					onBlur={() => {
						if (randomizeOnBlank && room.trim() === '') setRoom(randomRoomName());
					}}
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
							endAdornment: (
								<InputAdornment position='end'>
									<IconButton
										aria-label={strings.quickJoin.newName}
										edge='end'
										onClick={() => {
											setRoom(randomRoomName());
											inputRef.current?.focus();
										}}
										sx={{ width: 44, height: 44, color: brand.blueDark, ...focusRing() }}
									>
										<AutorenewRounded />
									</IconButton>
								</InputAdornment>
							),
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

type MockVariant = 'classes' | 'meetings' | 'webinars' | 'recording' | 'transcription' | 'whiteboard' | 'breakout' | 'chat' | 'admin';

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
		case 'webinars':
			return (
				<Stage>
					<Box sx={{ flex: 2, position: 'relative', borderRadius: radius.sm, bgcolor: brand.navy700, display: 'grid', placeItems: 'center' }}>
						<MockAvatar initials='FA' color={brand.orange} size={48} />
						<Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.75 }}>
							<Pill color={brand.white} bg='#d93b3b'>● LIVE</Pill>
							<Pill color={brand.white} bg='rgba(255, 255, 255, 0.16)'>1,240 watching</Pill>
						</Box>
					</Box>
					<Panel sx={{ flex: 1 }}>
						<Box sx={mockText(11, 700)}>Questions</Box>
						{[ 'Will slides be shared?', 'Is there a recording?', 'Next session date?' ].map((question, index) => (
							<Box key={question} sx={{ borderRadius: '6px', bgcolor: brand.surfaceSubtle, px: 0.75, py: 0.5, display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
								<Box sx={mockText(10)}>{question}</Box>
								<Box sx={mockText(9, 700, brand.blueDark)}>▲ {12 - (index * 4)}</Box>
							</Box>
						))}
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
		case 'whiteboard':
			return (
				<Stage light>
					<Panel sx={{ width: 36, flexShrink: 0, alignItems: 'center', p: 0.75 }}>
						{[ brand.navy, brand.blue, brand.orange, '#2e9d6b' ].map((color) => <Box key={color} sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color }} />)}
					</Panel>
					<Panel sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
						<Box sx={mockText(11, 700)}>TCP handshake</Box>
						{[ [ 'Client', '12%' ], [ 'Server', '64%' ] ].map(([ name, left ]) => (
							<Box key={name} sx={{ position: 'absolute', top: '28%', left, width: '22%', height: '14%', border: `2px solid ${brand.navy}`, borderRadius: '6px', display: 'grid', placeItems: 'center', ...mockText(10, 700) } as SxProps<Theme>}>{name}</Box>
						))}
						{[ [ 'SYN', '50%', brand.blue ], [ 'SYN-ACK', '63%', brand.orange ], [ 'ACK', '76%', '#2e9d6b' ] ].map(([ label, top, color ]) => (
							<Box key={label} sx={{ position: 'absolute', top, left: '23%', width: '41%', borderTop: `2px solid ${color}`, ...mockText(9, 700) } as SxProps<Theme>}>
								<Box sx={{ mt: -1.75, textAlign: 'center' }}>{label}</Box>
							</Box>
						))}
					</Panel>
				</Stage>
			);
		case 'breakout':
			return (
				<Stage light>
					<Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1 }}>
						{[ 1, 2, 3 ].map((group) => (
							<Panel key={group}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Box sx={mockText(11, 700)}>Group {group}</Box>
									<Box sx={mockText(10, 500, brand.textSecondary)}>4 people</Box>
								</Box>
								<Box sx={{ display: 'flex', gap: 0.5 }}>
									{MOCK_STUDENTS.map((student) => <MockAvatar key={student.initials} initials={student.initials} color={student.color} size={20} />)}
								</Box>
								<Box sx={{ mt: 'auto', ...mockText(9, 700, brand.blueDark) } as SxProps<Theme>}>Join room →</Box>
							</Panel>
						))}
						<Panel sx={{ justifyContent: 'center', alignItems: 'center', bgcolor: brand.navy }}>
							<Box sx={mockText(11, 700, brand.white)}>Close all rooms</Box>
							<Box sx={mockText(9, 400, brand.textOnDarkMuted)}>Everyone returns in 30 s</Box>
						</Panel>
					</Box>
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

const panelIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`;

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

// Two full-width, edge-faded rows of university logos that scroll forever by
// themselves (§7.2): the top row right to left, the bottom row left to right,
// at slightly different speeds. Each row is rendered twice for a seamless loop
// (the copy is hidden from assistive tech). Every logo gets the same box, so
// wordmarks and seals look even. It always runs by itself, also under reduced
// motion and with no pause button (owner's decision); hovering a row pauses it.
const LOGO_ROWS = [
	UNIVERSITY_LOGOS.filter((_logo, index) => index % 2 === 0),
	UNIVERSITY_LOGOS.filter((_logo, index) => index % 2 === 1),
];

const TrustedBy = (): React.JSX.Element => {
	const logoList = (logos: typeof UNIVERSITY_LOGOS, copy: boolean): React.JSX.Element => (
		<Box
			component='ul'
			aria-hidden={copy || undefined}
			sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: { xs: 4, md: 7 }, listStyle: 'none', m: 0, p: 0, pr: { xs: 4, md: 7 } }}
		>
			{logos.map((logo) => (
				<Box component='li' key={logo.name} sx={{ flexShrink: 0, width: { xs: 96, md: 128 }, height: { xs: 52, md: 68 }, display: 'flex' }}>
					<Box
						component='img'
						src={logo.src}
						alt={copy ? '' : logo.name}
						title={copy ? undefined : logo.name}
						loading='lazy'
						decoding='async'
						referrerPolicy='no-referrer'
						draggable={false}
						sx={{ display: 'block', width: '100%', height: '100%', minHeight: 0, objectFit: 'contain', transition: `transform ${motion.base}ms ${motion.ease}`, '&:hover': { transform: 'scale(1.08)' } }}
					/>
				</Box>
			))}
		</Box>
	);

	return (
		<Box component='section' id='trusted-by' aria-labelledby='trusted-by-title' sx={{ bgcolor: brand.white, py: { xs: 5, md: 7 }, overflow: 'hidden', scrollMarginTop: layout.navH }}>
			<Container maxWidth={false} sx={{ maxWidth: layout.container, px: layout.gutter }}>
				{/* Brand colors: navy text, blue highlight (large text, 3.9:1), orange accents
				    (orange is 2.1:1 on white, so it is never used for text). */}
				<Box data-reveal sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto', mb: { xs: 4, md: 5 } }}>
					<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 1, md: 1.25 }, mb: 1.5 }}>
						<Box aria-hidden sx={{ width: { xs: 16, md: 24 }, height: 3, flexShrink: 0, borderRadius: radius.pill, bgcolor: brand.orange }} />
						<Typography component='p' sx={{ fontSize: { xs: 11.5, md: 13 }, fontWeight: 700, letterSpacing: { xs: '0.06em', md: '0.1em' }, textTransform: 'uppercase', whiteSpace: 'nowrap', color: brand.navy }}>
							{strings.trustedBy.eyebrow}
						</Typography>
						<Box aria-hidden sx={{ width: { xs: 16, md: 24 }, height: 3, flexShrink: 0, borderRadius: radius.pill, bgcolor: brand.orange }} />
					</Box>
					<Typography variant='h2' id='trusted-by-title' sx={{ color: brand.navy, fontSize: 'clamp(1.625rem, 1.25rem + 1.5vw, 2.375rem)' }}>
						{strings.trustedBy.titleStart}
						<Box component='span' sx={{ color: brand.blue }}>{strings.trustedBy.titleHighlight}</Box>
						{strings.trustedBy.titleEnd}
					</Typography>
					<Box aria-hidden sx={{ width: 56, height: 4, borderRadius: radius.pill, bgcolor: brand.orange, mx: 'auto', my: 2 }} />
					<Typography sx={{ fontSize: { xs: 15, md: 17 }, color: brand.navy, opacity: 0.8 }}>
						{strings.trustedBy.subtitle}
					</Typography>
				</Box>
			</Container>

			<Box
				role='list'
				aria-label={strings.trustedBy.listLabel}
				sx={{
					display: 'grid',
					gap: { xs: 2.5, md: 3.5 },
					// Both edges fade to the page background.
					maskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)',
					WebkitMaskImage: 'linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)',
				}}
			>
				{LOGO_ROWS.map((logos, row) => (
					<Box key={row} role='listitem' sx={{ overflow: 'hidden', '&:hover .ek-marquee': { animationPlayState: 'paused' } }}>
						<Box
							className='ek-marquee'
							sx={{
								display: 'flex',
								width: 'max-content',
								// ≈ 35 px/s (top) and 30 px/s (bottom) on desktop.
								animation: `${marquee} ${logos.length * (row === 0 ? 5.5 : 6.5)}s linear infinite`,
								animationDirection: row === 0 ? 'normal' : 'reverse',
							}}
						>
							{logoList(logos, false)}
							{logoList(logos, true)}
						</Box>
					</Box>
				))}
			</Box>
		</Box>
	);
};

const ProductChips = ({ transcriptionEnabled }: { transcriptionEnabled: boolean }): React.JSX.Element => {
	const chips = CHIPS.filter((chip) => transcriptionEnabled || chip.key !== 'transcription');
	const [ selected, setSelected ] = useState(chips[0].key);
	const chip = chips.find((item) => item.key === selected) ?? chips[0];

	return (
		<SectionShell id='products' background={brand.white}>
			<SectionHeader id='products' eyebrow={strings.productChips.eyebrow} title={strings.productChips.title} />
			<Box
				role='tablist'
				aria-label={strings.productChips.label}
				sx={{
					display: 'flex',
					flexWrap: { xs: 'nowrap', lg: 'wrap' },
					gap: 1.25,
					overflowX: { xs: 'auto', lg: 'visible' },
					scrollSnapType: 'x mandatory',
					mx: { xs: -2, sm: -3, lg: 0 },
					px: { xs: 2, sm: 3, lg: 0 },
					py: 0.75,
					// A right-edge fade hints that more chips scroll in (§7.3).
					maskImage: { xs: 'linear-gradient(to right, #000 85%, transparent)', lg: 'none' },
					scrollbarWidth: 'none',
					'&::-webkit-scrollbar': { display: 'none' },
				}}
			>
				{chips.map(({ key, label, icon: Icon }) => {
					const active = key === selected;

					return (
						<Box
							key={key}
							component='button'
							type='button'
							role='tab'
							id={`ek-chip-${key}`}
							aria-selected={active}
							aria-controls='ek-chip-panel'
							tabIndex={active ? 0 : -1}
							onClick={() => setSelected(key)}
							onKeyDown={(event: React.KeyboardEvent) => rovingKeyDown(event, chips.map((item) => item.key), selected, setSelected, 'ek-chip')}
							sx={{
								flexShrink: 0,
								scrollSnapAlign: 'start',
								display: 'inline-flex',
								alignItems: 'center',
								gap: 1,
								height: 44,
								px: 2,
								borderRadius: radius.pill,
								border: `1px solid ${active ? brand.navy : brand.border}`,
								bgcolor: active ? brand.navy : brand.white,
								color: active ? brand.white : brand.navy,
								font: 'inherit',
								fontSize: 15,
								fontWeight: 500,
								cursor: 'pointer',
								transition: `background-color ${motion.base}ms ${motion.ease}, color ${motion.base}ms`,
								'&:hover': { bgcolor: active ? brand.navy : brand.blueLight },
								...focusRing(),
							} as SxProps<Theme>}
						>
							<Icon aria-hidden sx={{ fontSize: 22 }} />
							{label}
						</Box>
					);
				})}
			</Box>

			<Box
				role='tabpanel'
				id='ek-chip-panel'
				aria-labelledby={`ek-chip-${chip.key}`}
				key={chip.key}
				sx={{
					mt: { xs: 3, md: 4 },
					display: 'grid',
					gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 7fr) minmax(0, 5fr)' },
					gap: { xs: 3, lg: 6 },
					alignItems: 'center',
					animation: `${panelIn} ${motion.base}ms ${motion.ease}`,
					[reducedMotion]: { animation: 'none' },
				}}
			>
				<Box sx={{ maxWidth: { md: 640, lg: 'none' }, width: '100%', mx: { md: 'auto', lg: 0 } }}>
					<BrowserFrame url={`${window.location.host}/Video-Conferencing`} label={chip.mockLabel} elevation={2}>
						<ProductMock variant={chip.key} />
					</BrowserFrame>
				</Box>
				<Box sx={{ minHeight: { lg: 240 } }}>
					<Typography variant='h3' component='h3'>{chip.title}</Typography>
					<Typography sx={{ mt: 1.5, color: brand.textSecondary }}>{chip.text}</Typography>
					<Box component='ul' sx={{ listStyle: 'none', m: 0, mt: 2.5, p: 0, display: 'grid', gap: 1.25 }}>
						{chip.bullets.map((bullet) => <CheckItem key={bullet}>{bullet}</CheckItem>)}
					</Box>
					{chip.href && <Box sx={{ mt: 3 }}><ArrowLink href={chip.href}>{strings.productChips.learnMore}</ArrowLink></Box>}
				</Box>
			</Box>
		</SectionShell>
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
const NEWS_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500&display=swap';
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
	const [ footerVisible, setFooterVisible ] = useState(false);
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
	const footerRef = useRef<HTMLElement>(null);

	const config = {
		transcriptionEnabled: edumeetConfig.transcriptionEnabled,
		randomizeOnBlank: edumeetConfig.randomizeOnBlank,
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
	// hero CTAs leave the view and hides over the footer. No scroll listeners.
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
			watch(footerRef.current, setFooterVisible),
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
						solid={!atTop}
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
					<Box
						component='section'
						id='hero'
						aria-labelledby='hero-title'
						sx={{
							position: 'relative',
							overflow: 'hidden',
							background: brand.heroGradient,
							color: brand.white,
							display: 'flex',
							alignItems: 'center',
							// The transparent navbar sits on top of the hero, so the hero starts under it.
							mt: { xs: '-56px', md: '-64px' },
							pt: { xs: '96px', md: '128px', lg: '112px' },
							pb: { xs: 6, md: 8, lg: 6 },
							// At 1366 × 768 the utility bar, navbar and the whole hero fit (§5.3).
							minHeight: { lg: 'min(calc(100svh - 36px), 784px)' },
							'@media (max-height: 800px) and (min-width: 1024px)': { pt: '96px', pb: 4 },
						}}
					>
						<Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
							<Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
							<Box sx={{ position: 'absolute', width: { xs: 260, md: 480 }, height: { xs: 260, md: 480 }, top: { xs: -110, md: -160 }, right: { xs: -100, md: -120 }, borderRadius: '50%', bgcolor: brand.blue, opacity: 0.25, filter: 'blur(80px)' }} />
							<Box sx={{ position: 'absolute', width: 360, height: 360, bottom: -160, left: -120, borderRadius: '50%', bgcolor: brand.orange, opacity: 0.15, filter: 'blur(80px)', display: { xs: 'none', md: 'block' } }} />
						</Box>

						<Container maxWidth={false} sx={{ position: 'relative', maxWidth: layout.container, px: layout.gutter }}>
							<Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(12, minmax(0, 1fr))' }, columnGap: 3, rowGap: { xs: 5, md: 6 }, alignItems: 'center' }}>
								<Box sx={{ gridColumn: { lg: '1 / span 6' }, textAlign: { md: 'center', lg: 'left' }, maxWidth: { md: 720, lg: 'none' }, mx: { md: 'auto', lg: 0 } }}>
									<Typography sx={{ color: brand.blueOnNavy, fontWeight: 500, mb: 2 }}>{strings.hero.eyebrow}</Typography>
									<Typography variant='h1' id='hero-title'>{strings.hero.title}</Typography>
									<Box aria-hidden sx={{ width: 56, height: 4, borderRadius: radius.pill, bgcolor: brand.orange, my: 3, mx: { md: 'auto', lg: 0 } }} />
									<Typography
										sx={{
											fontSize: '1.125rem',
											color: brand.textOnDarkMuted,
											maxWidth: 560,
											mx: { md: 'auto', lg: 0 },
											display: '-webkit-box',
											WebkitBoxOrient: 'vertical',
											WebkitLineClamp: { xs: 3, md: 'none' },
											overflow: { xs: 'hidden', md: 'visible' },
										}}
									>
										{strings.hero.subtitle}
									</Typography>
									<Box
										ref={heroCtasRef}
										sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: { md: 'center', lg: 'flex-start' } }}
									>
										<Button
											variant='contained'
											color='secondary'
											size='large'
											endIcon={<ArrowForwardRounded />}
											onClick={startClass}
											onMouseEnter={prefetchApp}
											onFocus={prefetchApp}
											sx={{ boxShadow: shadow[2], '&:hover': { bgcolor: brand.orangeDark }, ...focusRing(true) }}
										>
											{strings.common.start}
										</Button>
										<Button
											variant='outlined'
											size='large'
											onClick={() => openQuickJoin('join')}
											sx={{ color: brand.white, borderColor: 'rgba(255, 255, 255, 0.6)', '&:hover': { borderColor: brand.white, bgcolor: 'rgba(255, 255, 255, 0.08)' }, ...focusRing(true) }}
										>
											{strings.common.join}
										</Button>
									</Box>
									{TOUR_URL && (
										<Link href={TOUR_URL} sx={{ mt: 2.5, display: 'inline-flex', alignItems: 'center', gap: 0.75, color: brand.blueOnNavy, fontWeight: 500, ...focusRing(true) }}>
											<PlayCircleOutlineRounded aria-hidden sx={{ fontSize: 20 }} />
											{strings.hero.tour}
										</Link>
									)}
								</Box>

								<Box sx={{ gridColumn: { lg: '7 / span 6' }, position: 'relative', width: '100%', maxWidth: { md: 560, lg: 620 }, mx: { md: 'auto', lg: 0 }, justifySelf: { lg: 'end' } }}>
									<Box aria-hidden sx={{ position: 'absolute', inset: '10%', borderRadius: '50%', bgcolor: brand.blue, opacity: 0.3, filter: 'blur(80px)' }} />
									<Box sx={{ position: 'relative' }}>
										<HeroMock url={`${window.location.host}/Video-Conferencing`} />
									</Box>
									<FloatingChip sx={{ top: -18, right: 32 }}>
										<GroupsRounded sx={{ fontSize: 18, color: brand.blueDark }} />
										{strings.quickJoin.inClass}
									</FloatingChip>
									<FloatingChip sx={{ bottom: 32, left: -16 }}>
										<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#d93b3b' }} />
										REC 00:42:10
									</FloatingChip>
								</Box>
							</Box>
						</Container>
					</Box>

					<TrustedBy />
					<ProductChips transcriptionEnabled={config.transcriptionEnabled} />
					<Spotlight transcriptionEnabled={config.transcriptionEnabled} />
					<UseCases onStart={startClass} onJoin={() => openQuickJoin('join')} />
					<News />
					<CtaBand onStart={startClass} onJoin={() => openQuickJoin('join')} />
				</Box>

				<Footer
					footerRef={footerRef}
					imprintUrl={config.imprintUrl}
					privacyUrl={config.privacyUrl}
					info={config.info}
					onStart={startClass}
					onJoin={() => openQuickJoin('join')}
				/>

				<StickyBar visible={!heroCtasVisible && !footerVisible && !keyboardOpen} onJoin={() => openQuickJoin('join')} onStart={startClass} />

				<InstallDialog open={installOpen} onClose={() => setInstallOpen(false)} />

				<QuickJoinDialog
					open={quickJoinView !== null}
					view={quickJoinView ?? lastView}
					onViewChange={changeQuickJoinView}
					onClose={closeQuickJoin}
					randomizeOnBlank={config.randomizeOnBlank}
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
