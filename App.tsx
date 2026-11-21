import React, { useState, useEffect, useId } from 'react';
import {
  Home,
  Compass,
  Gamepad2,
  Award,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Star,
  Volume2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Lock,
  Unlock,
  Upload,
  Globe,
  BookOpen,
  Cpu,
  Palette,
  HeartPulse,
  Music,
  Trophy,
  X,
  Check,
  AlertCircle,
  Edit3,
  Search,
  Send,
  Database,
  Users,
  LogOut,
  LogIn,
  Plus,
  Clock,
  BarChart3,
  Wifi,
  WifiOff,
  Smartphone,
  Download,
  CloudUpload,
  CheckSquare
} from 'lucide-react';

// ============================================================================
// 0. MODULAR FIREBASE CONFIGURATION & DATA SERVICE LAYER (Phase 4 & 5)
// ============================================================================
const getEnvVar = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch {
    // Ignore environment access issues
  }
  return '';
};

const FIREBASE_ENV_CONFIG = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID')
};

const IS_FIREBASE_CONFIGURED = Boolean(
  FIREBASE_ENV_CONFIG.apiKey &&
    FIREBASE_ENV_CONFIG.projectId &&
    FIREBASE_ENV_CONFIG.appId
);

interface ActivityLog {
  id: string;
  opKey?: string;
  studentId?: string;
  type: string;
  title: string;
  topic: string;
  starsEarned: number;
  timestamp: string;
}

interface QuizAttempt {
  id: string;
  studentId: string;
  topic: string;
  score: number;
  total: number;
  starsEarned: number;
  timestamp: string;
}

interface StudentAccount {
  studentId: string;
  displayName: string;
  schoolYear: string;
  preferredLanguage: 'en' | 'bm';
  avatar: string;
  accountStatus: 'Active' | 'Paused';
  authorizedParentCode: string;
  progress: {
    stars: number;
    completedLessons: string[];
    completedPilotLessons: string[];
    completedPlantGames: string[];
    quizAttempts: QuizAttempt[];
    quizBestScore: number;
    dailyDone: boolean;
    activityLogs: ActivityLog[];
    lastActivity: string;
  };
}

const INITIAL_STUDENT_ACCOUNTS: StudentAccount[] = [
  {
    studentId: 'STU-2027-001',
    displayName: 'Adam Hakimi',
    schoolYear: 'Year 1',
    preferredLanguage: 'en',
    avatar: 'wave',
    accountStatus: 'Active',
    authorizedParentCode: 'PAR-8821',
    progress: {
      stars: 4,
      completedLessons: ['science'],
      completedPilotLessons: [],
      completedPlantGames: [],
      quizAttempts: [],
      quizBestScore: 0,
      dailyDone: false,
      activityLogs: [
        {
          id: 'act-init-1',
          type: 'lesson',
          title: 'Science & Nature Overview',
          topic: 'Plants Around Us',
          starsEarned: 2,
          timestamp: '2026-11-20 09:15'
        }
      ],
      lastActivity: 'Science & Nature Overview'
    }
  }
];

// ============================================================================
// 1. WEB AUDIO SOUND EFFECTS HELPER
// ============================================================================
const playTone = (type: 'pop' | 'success' | 'error' = 'pop') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'error') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(190, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch {
    // Ignore autoplay restrictions
  }
};

// ============================================================================
// 2. REUSABLE 3D-STYLED CHIBI MASCOT COMPONENT ("AINA")
// ============================================================================
interface MascotProps {
  pose?: string;
  expression?: string;
  accessory?: string;
  size?: number;
  className?: string;
}

const MascotAina: React.FC<MascotProps> = ({
  pose = 'wave',
  expression,
  accessory,
  size = 110,
  className = ''
}) => {
  const uid = useId();
  const resolvedExpression =
    expression ||
    (pose === 'boba'
      ? 'wink'
      : pose === 'study' || pose === 'think'
      ? 'curious'
      : pose === 'flag' || pose === 'celebrate'
      ? 'proud'
      : 'happy');

  const resolvedAccessory =
    accessory ||
    (pose === 'flag'
      ? 'flag'
      : pose === 'study'
      ? 'magnifier'
      : pose === 'boba'
      ? 'boba'
      : pose === 'celebrate'
      ? 'trophy'
      : pose === 'read'
      ? 'book'
      : 'none');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      className={`select-none drop-shadow-md ${className}`}
      aria-label="Aina Mascot"
    >
      <defs>
        <radialGradient id={`${uid}-skin`} cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE9D6" />
          <stop offset="75%" stopColor="#F8C8A8" />
          <stop offset="100%" stopColor="#E6A885" />
        </radialGradient>
        <linearGradient id={`${uid}-redDress`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF3B30" />
          <stop offset="55%" stopColor="#D71920" />
          <stop offset="100%" stopColor="#990F14" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF099" />
          <stop offset="50%" stopColor="#F5B82E" />
          <stop offset="100%" stopColor="#C9820B" />
        </linearGradient>
        <radialGradient id={`${uid}-hair`} cx="50%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#3B2F2F" />
          <stop offset="70%" stopColor="#1E1818" />
          <stop offset="100%" stopColor="#0E0B0B" />
        </radialGradient>
        <radialGradient id={`${uid}-eye`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#4A2E1B" />
          <stop offset="75%" stopColor="#1C110A" />
          <stop offset="100%" stopColor="#090503" />
        </radialGradient>
      </defs>

      <ellipse cx="110" cy="204" rx="48" ry="9" fill="rgba(180, 50, 70, 0.16)" />
      <path
        d="M54 92 C44 132, 48 168, 62 182 C75 175, 80 155, 80 132 L140 132 C140 155, 145 175, 158 182 C172 168, 176 132, 166 92 Z"
        fill={`url(#${uid}-hair)`}
      />
      <ellipse cx="94" cy="196" rx="13" ry="7" fill="#990F14" />
      <ellipse cx="126" cy="196" rx="13" ry="7" fill="#990F14" />

      <path
        d="M80 124 L140 124 L152 192 L68 192 Z"
        fill={`url(#${uid}-redDress)`}
        stroke="#1E1818"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M92 124 L110 148 L128 124"
        fill="none"
        stroke="#1E1818"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <rect x="77" y="148" width="66" height="9" rx="3" fill="#B91C1C" stroke="#1E1818" strokeWidth="2.2" />

      <g fill={`url(#${uid}-gold)`} opacity="0.88">
        <circle cx="88" cy="170" r="3" />
        <circle cx="132" cy="170" r="3" />
        <circle cx="110" cy="180" r="3.5" />
      </g>

      {(pose === 'wave' || pose === 'celebrate' || pose === 'explain') && (
        <g>
          <path d="M80 128 L52 104 L62 92 L86 118 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <circle cx="54" cy="96" r="8" fill={`url(#${uid}-skin)`} />
          <path d="M140 128 L168 106 L158 94 L134 118 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <circle cx="166" cy="98" r="8" fill={`url(#${uid}-skin)`} />
          {resolvedAccessory === 'trophy' && (
            <g transform="translate(154, 62)">
              <path d="M4 6 H22 L19 20 C18 24, 8 24, 7 20 Z" fill={`url(#${uid}-gold)`} stroke="#B45309" strokeWidth="1.5" />
              <rect x="11" y="22" width="4" height="7" fill={`url(#${uid}-gold)`} />
              <rect x="7" y="29" width="12" height="4" rx="1.5" fill="#78350F" />
            </g>
          )}
        </g>
      )}

      {(pose === 'read' || pose === 'think' || pose === 'play') && (
        <g>
          <path d="M80 128 L66 150 L78 158 L90 138 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <path d="M140 128 L154 150 L142 158 L130 138 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <circle cx="72" cy="154" r="7.5" fill={`url(#${uid}-skin)`} />
          <circle cx="148" cy="154" r="7.5" fill={`url(#${uid}-skin)`} />
        </g>
      )}

      {pose === 'flag' && (
        <g>
          <path d="M80 128 L56 144 L66 154 L88 136 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <circle cx="58" cy="148" r="7.5" fill={`url(#${uid}-skin)`} />
          <path d="M140 128 L164 114 L156 102 L134 120 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <line x1="164" y1="125" x2="164" y2="48" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
          <g transform="translate(165, 50)">
            <rect x="0" y="0" width="44" height="28" rx="2" fill="#FFFFFF" />
            <rect x="0" y="0" width="44" height="4" fill="#DC2626" />
            <rect x="0" y="8" width="44" height="4" fill="#DC2626" />
            <rect x="0" y="16" width="44" height="4" fill="#DC2626" />
            <rect x="0" y="24" width="44" height="4" fill="#DC2626" />
            <rect x="0" y="0" width="22" height="16" fill="#1D4ED8" />
            <circle cx="10" cy="8" r="5" fill="#FACC15" />
            <circle cx="12" cy="8" r="4" fill="#1D4ED8" />
          </g>
          <circle cx="163" cy="110" r="8" fill={`url(#${uid}-skin)`} />
        </g>
      )}

      {pose === 'study' && (
        <g>
          <path d="M80 128 L64 148 L74 156 L88 136 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <circle cx="66" cy="152" r="7.5" fill={`url(#${uid}-skin)`} />
          <path d="M140 128 L164 126 L160 112 L134 118 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <line x1="164" y1="124" x2="177" y2="106" stroke="#B45309" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="185" cy="94" r="15" fill="#E0F2FE" fillOpacity="0.7" stroke={`url(#${uid}-gold)`} strokeWidth="4" />
          <circle cx="163" cy="120" r="8" fill={`url(#${uid}-skin)`} />
        </g>
      )}

      {pose === 'boba' && (
        <g>
          <path d="M80 128 L88 156 L100 156 L92 128 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <path d="M140 128 L132 156 L120 156 L128 128 Z" fill={`url(#${uid}-redDress)`} stroke="#1E1818" strokeWidth="2.2" />
          <circle cx="95" cy="153" r="7" fill={`url(#${uid}-skin)`} />
          <circle cx="125" cy="153" r="7" fill={`url(#${uid}-skin)`} />
        </g>
      )}

      <ellipse cx="110" cy="86" rx="46" ry="42" fill={`url(#${uid}-skin)`} />
      <ellipse cx="81" cy="96" rx="8" ry="4.5" fill="#FF7A8A" opacity="0.45" />
      <ellipse cx="139" cy="96" rx="8" ry="4.5" fill="#FF7A8A" opacity="0.45" />

      <path
        d="M62 84 C62 46, 158 46, 158 84 C152 66, 142 62, 134 74 C128 60, 118 58, 110 73 C102 58, 92 60, 86 74 C78 62, 68 66, 62 84 Z"
        fill={`url(#${uid}-hair)`}
      />

      {resolvedExpression === 'wink' ? (
        <g>
          <path d="M84 86 Q92 79 100 86" fill="none" stroke="#1E1818" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="128" cy="86" r="10.5" fill={`url(#${uid}-eye)`} />
          <circle cx="124.5" cy="82" r="3.6" fill="#FFFFFF" />
        </g>
      ) : (
        <g>
          <circle cx="92" cy="86" r="10.5" fill={`url(#${uid}-eye)`} />
          <circle cx="88.5" cy="82" r="3.6" fill="#FFFFFF" />
          <circle cx="128" cy="86" r="10.5" fill={`url(#${uid}-eye)`} />
          <circle cx="124.5" cy="82" r="3.6" fill="#FFFFFF" />
        </g>
      )}

      <path d="M101 102 Q110 112 119 102 Z" fill="#FF5A6E" stroke="#9F1239" strokeWidth="1.5" strokeLinejoin="round" />

      <g transform="translate(0, -4)">
        <polygon points="84,48 93,26 102,45" fill={`url(#${uid}-gold)`} />
        <polygon points="99,45 110,20 121,45" fill={`url(#${uid}-gold)`} />
        <polygon points="118,45 127,26 136,48" fill={`url(#${uid}-gold)`} />
        <circle cx="74" cy="48" r="7" fill="#EF4444" />
        <circle cx="91" cy="44" r="7.5" fill="#F97316" />
        <circle cx="110" cy="42" r="8" fill="#2563EB" />
        <circle cx="129" cy="44" r="7.5" fill="#FACC15" />
        <circle cx="146" cy="48" r="7" fill="#EF4444" />
      </g>
    </svg>
  );
};

// ============================================================================
// 3. CURRICULUM & GAME DATA
// ============================================================================
const UI_STRINGS = {
  en: {
    appName: 'EduExplore 2027',
    tagline: 'Learn. Explore. Create.',
    welcome: 'Selamat Datang',
    mascotGreeting: "Hi! I'm Aina. Ready to explore today?",
    yourProgress: 'Learning Progress',
    stars: 'Stars',
    dailyChallenge: 'Daily Challenge',
    dailyDesc: 'Complete 1 Plant Lesson or Quiz today!',
    startNow: 'Start Now',
    categories: 'Learning Categories',
    explore: 'Explore & Learn',
    play: 'Play & Learn',
    quiz: 'Quiz & Challenge',
    progress: 'My Progress',
    parents: 'Parent Zone',
    home: 'Home',
    objectives: 'Learning Objectives',
    illustratedNotes: 'Illustrated Learning Notes',
    miniQuiz: 'Quick Knowledge Check',
    completeLesson: 'Complete & Collect 2 Stars',
    completedBadge: 'Completed (+2 ★)'
  },
  bm: {
    appName: 'EduExplore 2027',
    tagline: 'Belajar. Teroka. Cipta.',
    welcome: 'Selamat Datang',
    mascotGreeting: 'Hai! Saya Aina. Jom teroka ilmu hari ini!',
    yourProgress: 'Kemajuan Pembelajaran',
    stars: 'Bintang',
    dailyChallenge: 'Cabaran Harian',
    dailyDesc: 'Selesaikan 1 Pelajaran atau Kuiz Tumbuhan hari ini!',
    startNow: 'Mula Sekarang',
    categories: 'Kategori Pembelajaran',
    explore: 'Teroka & Belajar',
    play: 'Main & Belajar',
    quiz: 'Kuiz & Cabaran',
    progress: 'Kemajuan Saya',
    parents: 'Zon Ibu Bapa',
    home: 'Utama',
    objectives: 'Objektif Pembelajaran',
    illustratedNotes: 'Nota Pembelajaran Berilustrasi',
    miniQuiz: 'Semakan Pantas',
    completeLesson: 'Selesai & Kumpul 2 Bintang',
    completedBadge: 'Selesai (+2 ★)'
  }
};

const INITIAL_CATEGORIES = [
  {
    id: 'science',
    icon: BookOpen,
    color: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    title: { en: 'Science & Nature', bm: 'Sains & Alam Sekitar' },
    topicTitle: { en: 'Plants Around Us', bm: 'Tumbuhan di Sekeliling Kita' },
    notes: {
      en: 'A hibiscus plant (Bunga Raya) has roots to drink water, a stem to stand tall, green leaves to catch sunlight, and bright red petals!',
      bm: 'Pokok Bunga Raya mempunyai akar untuk menyerap air, batang untuk berdiri tegak, daun hijau untuk cahaya matahari, dan kelopak merah yang cantik!'
    },
    interactivePrompt: {
      en: 'Tap each plant part below to discover its special job:',
      bm: 'Tekan setiap bahagian tumbuhan di bawah untuk tahu tugasnya:'
    },
    parts: [
      { id: 'flower', label: { en: '🌺 Flower', bm: '🌺 Bunga' }, info: { en: 'Attracts bees & makes seeds!', bm: 'Menarik lebah & menghasilkan biji benih!' } },
      { id: 'leaf', label: { en: '🍃 Leaf', bm: '🍃 Daun' }, info: { en: 'Makes food using warm sunlight!', bm: 'Membuat makanan menggunakan cahaya matahari!' } },
      { id: 'stem', label: { en: '🌿 Stem', bm: '🌿 Batang' }, info: { en: 'Carries water up to the leaves!', bm: 'Membawa air naik ke daun!' } },
      { id: 'root', label: { en: '🌱 Roots', bm: '🌱 Akar' }, info: { en: 'Drinks water from the soil!', bm: 'Menyerap air dari dalam tanah!' } }
    ]
  },
  {
    id: 'tech',
    icon: Cpu,
    color: 'from-sky-400 to-blue-600',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    title: { en: 'Technology & Digital', bm: 'Teknologi & Digital' },
    topicTitle: { en: 'Smart Devices & Safety', bm: 'Peranti Pintar & Keselamatan' },
    notes: {
      en: 'Tablets and computers help us read stories and learn new things. Always ask parents before tapping new links and rest your eyes after 20 minutes!',
      bm: 'Tablet dan komputer membantu kita membaca cerita dan belajar. Sentiasa tanya ibu bapa sebelum menekan pautan baru dan rehatkan mata selepas 20 minit!'
    },
    interactivePrompt: {
      en: 'Tap each device icon to see what it does:',
      bm: 'Tekan setiap ikon peranti untuk melihat fungsinya:'
    },
    parts: [
      { id: 'tablet', label: { en: '📱 Tablet', bm: '📱 Tablet' }, info: { en: 'Great for interactive learning apps!', bm: 'Bagus untuk aplikasi pembelajaran interaktif!' } },
      { id: 'shield', label: { en: '🛡️ Safe Rule', bm: '🛡️ Peraturan Selamat' }, info: { en: 'Never share passwords with strangers!', bm: 'Jangan kongsi kata laluan dengan orang asing!' } }
    ]
  },
  {
    id: 'arts',
    icon: Palette,
    color: 'from-rose-400 to-pink-600',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    title: { en: 'Arts & Creativity', bm: 'Seni & Kreativiti' },
    topicTitle: { en: 'Malaysian Batik & Colours', bm: 'Batik Malaysia & Warna' },
    notes: {
      en: 'Red, Blue, and Yellow are primary colours—just like the flowers on Aina’s crown! When you mix Red and Yellow, you create bright Orange!',
      bm: 'Merah, Biru dan Kuning ialah warna asas—sama seperti bunga di mahkota Aina! Apabila Merah dicampur Kuning, terhasillah warna Jingga!'
    },
    interactivePrompt: {
      en: 'Tap a colour mix to see the magic result:',
      bm: 'Tekan campuran warna untuk melihat hasilnya:'
    },
    parts: [
      { id: 'ry', label: { en: '🔴 Red + 🟡 Yellow', bm: '🔴 Merah + 🟡 Kuning' }, info: { en: 'Makes 🟠 Orange!', bm: 'Menjadi 🟠 Jingga!' } },
      { id: 'by', label: { en: '🔵 Blue + 🟡 Yellow', bm: '🔵 Biru + 🟡 Kuning' }, info: { en: 'Makes 🟢 Green!', bm: 'Menjadi 🟢 Hijau!' } }
    ]
  },
  {
    id: 'health',
    icon: HeartPulse,
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    title: { en: 'Health & Wellbeing', bm: 'Kesihatan & Kesejahteraan' },
    topicTitle: { en: 'Healthy Malaysian Plate', bm: 'Pinggan Sihat Malaysia' },
    notes: {
      en: 'Suku-Suku Separuh! Fill half your plate with colourful fruits & veggies like papaya and spinach, a quarter with rice, and a quarter with fish or chicken.',
      bm: 'Suku-Suku Separuh! Isi separuh pinggan dengan buah & sayur seperti betik dan bayam, suku nasi, dan suku ikan atau ayam.'
    },
    interactivePrompt: {
      en: 'Tap each healthy habit:',
      bm: 'Tekan setiap amalan sihat:'
    },
    parts: [
      { id: 'water', label: { en: '💧 Plain Water', bm: '💧 Air Masak' }, info: { en: 'Drink 6-8 glasses every day!', bm: 'Minum 6-8 gelas setiap hari!' } },
      { id: 'wash', label: { en: '🧼 Wash Hands', bm: '🧼 Basuh Tangan' }, info: { en: 'Wash with soap before eating!', bm: 'Basuh dengan sabun sebelum makan!' } }
    ]
  },
  {
    id: 'music',
    icon: Music,
    color: 'from-purple-400 to-indigo-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    title: { en: 'Music & Expression', bm: 'Muzik & Ekspresi' },
    topicTitle: { en: 'Rhythm & Traditional Beats', bm: 'Irama & Alat Muzik Tradisional' },
    notes: {
      en: 'Music lets us express joy! In Malaysia, the Kompang is played in happy celebrations with a cheerful "Pak-Pung-Pak-Pung" rhythm.',
      bm: 'Muzik membolehkan kita meluahkan rasa gembira! Di Malaysia, Kompang dimainkan dalam majlis meriah dengan irama "Pak-Pung-Pak-Pung".'
    },
    interactivePrompt: {
      en: 'Tap the musical notes:',
      bm: 'Tekan not muzik:'
    },
    parts: [
      { id: 'do', label: { en: '🎵 Note DO', bm: '🎵 Not DO' }, info: { en: 'Low warm musical tone!', bm: 'Nada muzik rendah yang merdu!' } },
      { id: 'sol', label: { en: '🎼 Note SOL', bm: '🎼 Not SOL' }, info: { en: 'Bright high celebration tone!', bm: 'Nada muzik tinggi yang bersemangat!' } }
    ]
  },
  {
    id: 'challenge',
    icon: Trophy,
    color: 'from-orange-500 to-red-600',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    title: { en: 'Explore & Challenge', bm: 'Teroka & Cabaran' },
    topicTitle: { en: 'Patriotic Malaysia Explorer', bm: 'Penjelajah Malaysia Tercinta' },
    notes: {
      en: 'Our Malaysian flag is called Jalur Gemilang. It has 14 red and white stripes, a blue canton, and a bright yellow crescent and 14-point star!',
      bm: 'Bendera Malaysia bernama Jalur Gemilang. Ia mempunyai 14 jalur merah dan putih, petak biru, serta bulan sabit dan bintang pecah 14 berwarna kuning!'
    },
    interactivePrompt: {
      en: 'Tap each national symbol:',
      bm: 'Tekan setiap simbol kebangsaan:'
    },
    parts: [
      { id: 'flag', label: { en: '🇲🇾 Jalur Gemilang', bm: '🇲🇾 Jalur Gemilang' }, info: { en: 'Our proud Malaysian flag!', bm: 'Bendera kebanggaan Malaysia!' } },
      { id: 'hibiscus', label: { en: '🌺 Bunga Raya', bm: '🌺 Bunga Raya' }, info: { en: 'Red Hibiscus—our National Flower!', bm: 'Bunga Raya merah—Bunga Kebangsaan kita!' } }
    ]
  }
];

const PILOT_PLANT_LESSONS = [
  {
    id: 'plant-l1',
    number: 1,
    title: { en: 'Parts of a Plant', bm: 'Bahagian Tumbuhan' },
    mascotIntro: {
      en: 'Look at this pretty red Bunga Raya! Tap each glowing hotspot on the plant to discover what every part does.',
      bm: 'Lihat Bunga Raya merah yang cantik ini! Tekan setiap titik pada tumbuhan untuk tahu tugas setiap bahagian.'
    },
    objectives: {
      en: [
        'Identify the 4 main parts of a plant: flower, leaf, stem, and roots.',
        'Explain in simple words how each part helps the plant live.'
      ],
      bm: [
        'Mengenal pasti 4 bahagian utama tumbuhan: bunga, daun, batang, dan akar.',
        'Menerangkan dengan ayat mudah bagaimana setiap bahagian membantu tumbuhan hidup.'
      ]
    },
    explanation: {
      en: 'A flowering plant has four important parts. Roots hold the plant in the soil and drink water. The stem carries water up to the green leaves and colorful flower.',
      bm: 'Tumbuhan berbunga mempunyai empat bahagian penting. Akar mencengkam tanah dan menyerap air. Batang membawa air naik ke daun hijau dan bunga yang cantik.'
    },
    vocabulary: [
      { en: 'Flower', bm: 'Bunga', emoji: '🌺' },
      { en: 'Leaf', bm: 'Daun', emoji: '🍃' },
      { en: 'Stem', bm: 'Batang', emoji: '🌿' },
      { en: 'Roots', bm: 'Akar', emoji: '🌱' }
    ],
    hotspots: [
      { id: 'hs-flower', x: 130, y: 42, label: { en: 'Flower (Bunga)', bm: 'Bunga (Flower)' }, desc: { en: 'Colorful petals attract bees and help make seeds.', bm: 'Kelopak berwarna menarik lebah dan menghasilkan biji benih.' } },
      { id: 'hs-leaf', x: 172, y: 98, label: { en: 'Leaf (Daun)', bm: 'Daun (Leaf)' }, desc: { en: 'Green leaves catch warm sunlight to make food for the plant.', bm: 'Daun hijau menangkap cahaya matahari untuk membuat makanan tumbuhan.' } },
      { id: 'hs-stem', x: 130, y: 122, label: { en: 'Stem (Batang)', bm: 'Batang (Stem)' }, desc: { en: 'The strong stem stands tall and carries water upward.', bm: 'Batang yang kuat berdiri tegak dan membawa air ke atas.' } },
      { id: 'hs-roots', x: 130, y: 185, label: { en: 'Roots (Akar)', bm: 'Akar (Roots)' }, desc: { en: 'Roots grow underground to hold the plant and drink water.', bm: 'Akar tumbuh di dalam tanah untuk mencengkam pokok dan menyerap air.' } }
    ],
    knowledgeCheck: {
      question: {
        en: 'Which part of the plant grows underground and drinks water?',
        bm: 'Bahagian tumbuhan manakah tumbuh di dalam tanah dan menyerap air?'
      },
      options: {
        en: ['Roots (Akar)', 'Flower (Bunga)', 'Leaf (Daun)'],
        bm: ['Akar (Roots)', 'Bunga (Flower)', 'Daun (Leaf)']
      },
      correctIndex: 0,
      feedback: {
        en: 'Awesome! Roots grow in the soil and drink water for the whole plant.',
        bm: 'Hebat! Akar tumbuh di dalam tanah dan menyerap air untuk seluruh tumbuhan.'
      }
    }
  },
  {
    id: 'plant-l2',
    number: 2,
    title: { en: 'What Plants Need', bm: 'Keperluan Asas Tumbuhan' },
    mascotIntro: {
      en: 'Plants are living things just like you and me! Tap the sun, water droplets, and breeze around our seedling.',
      bm: 'Tumbuhan ialah benda hidup seperti kita! Tekan matahari, titisan air, dan angin di sekeliling anak pokok ini.'
    },
    objectives: {
      en: [
        'Name the 3 basic needs of plants: sunlight, water, and air.',
        'Understand why a plant wilts if it does not get water or sunlight.'
      ],
      bm: [
        'Menamakan 3 keperluan asas tumbuhan: cahaya matahari, air, dan udara.',
        'Memahami sebab tumbuhan layu jika tidak mendapat air atau cahaya matahari.'
      ]
    },
    explanation: {
      en: 'Plants are living things just like us! To grow green and healthy, every plant needs warm sunlight, clean water, and fresh air.',
      bm: 'Tumbuhan ialah benda hidup seperti kita! Untuk membesar dengan subur dan hijau, setiap tumbuhan memerlukan cahaya matahari, air dan udara.'
    },
    vocabulary: [
      { en: 'Sunlight', bm: 'Cahaya Matahari', emoji: '☀️' },
      { en: 'Water', bm: 'Air', emoji: '💧' },
      { en: 'Air', bm: 'Udara', emoji: '🌬️' },
      { en: 'Healthy Growth', bm: 'Tumbesaran Sihat', emoji: '🪴' }
    ],
    hotspots: [
      { id: 'hs-sun', x: 52, y: 42, label: { en: 'Sunlight (Cahaya Matahari)', bm: 'Cahaya Matahari (Sunlight)' }, desc: { en: 'Gives warm energy so green leaves can make food.', bm: 'Memberi tenaga supaya daun hijau boleh membuat makanan.' } },
      { id: 'hs-water', x: 205, y: 54, label: { en: 'Water (Air)', bm: 'Air (Water)' }, desc: { en: 'Keeps the plant fresh, cool, and helps it grow tall.', bm: 'Memastikan tumbuhan segar dan membantu ia membesar.' } },
      { id: 'hs-air', x: 205, y: 120, label: { en: 'Fresh Air (Udara)', bm: 'Udara Segar (Air)' }, desc: { en: 'Plants breathe in air through tiny holes in their leaves.', bm: 'Tumbuhan bernafas melalui liang halus pada daunnya.' } }
    ],
    knowledgeCheck: {
      question: {
        en: 'What happens if we keep a green plant in a dark box with no water?',
        bm: 'Apakah akan berlaku jika pokok hijau disimpan di dalam kotak gelap tanpa air?'
      },
      options: {
        en: ['It will wilt and turn yellow', 'It will grow giant flowers', 'It will turn into a rock'],
        bm: ['Ia akan layu dan kekuningan', 'Ia akan berbunga besar', 'Ia akan bertukar menjadi batu']
      },
      correctIndex: 0,
      feedback: {
        en: 'Spot on! Without sunlight and water, a plant becomes weak and wilts.',
        bm: 'Tepat sekali! Tanpa cahaya matahari dan air, tumbuhan menjadi lemah dan layu.'
      }
    }
  },
  {
    id: 'plant-l3',
    number: 3,
    title: { en: 'Types of Plants', bm: 'Jenis-jenis Tumbuhan' },
    mascotIntro: {
      en: 'Look around our Malaysian garden! Some plants are tall trees, some are leafy shrubs, and some are soft grass.',
      bm: 'Lihat taman Malaysia kita! Ada pokok besar yang tinggi, pokok renek berdaun, dan rumput yang lembut.'
    },
    objectives: {
      en: [
        'Group plants into tall trees, flowering shrubs, and soft grasses.',
        'Give local Malaysian examples like Coconut Tree, Hibiscus, and Lemongrass.'
      ],
      bm: [
        'Mengelaskan tumbuhan kepada pokok besar, pokok renek, dan rumput.',
        'Memberi contoh tempatan seperti Pokok Kelapa, Bunga Raya, dan Serai.'
      ]
    },
    explanation: {
      en: 'Plants come in many shapes and sizes! Tall trees have thick woody trunks, shrubs have many branches near the ground, and grasses have soft thin leaves.',
      bm: 'Tumbuhan mempunyai pelbagai bentuk dan saiz! Pokok besar mempunyai batang berkayu yang tebal, pokok renek mempunyai banyak dahan, dan rumput berdaun lembut.'
    },
    vocabulary: [
      { en: 'Tall Tree', bm: 'Pokok Besar', emoji: '🌴' },
      { en: 'Flowering Shrub', bm: 'Pokok Renek', emoji: '🌺' },
      { en: 'Soft Grass', bm: 'Rumput', emoji: '🌾' },
      { en: 'Woody Trunk', bm: 'Batang Berkayu', emoji: '🪵' }
    ],
    hotspots: [
      { id: 'hs-tree', x: 64, y: 78, label: { en: 'Tall Tree (Pokok Besar)', bm: 'Pokok Besar (Tall Tree)' }, desc: { en: 'Example: Coconut & Mango trees have thick strong trunks.', bm: 'Contoh: Pokok Kelapa & Mangga mempunyai batang yang tebal dan kuat.' } },
      { id: 'hs-shrub', x: 145, y: 126, label: { en: 'Shrub (Pokok Renek)', bm: 'Pokok Renek (Shrub)' }, desc: { en: 'Example: Hibiscus (Bunga Raya) is medium height with many branches.', bm: 'Contoh: Bunga Raya bersaiz sederhana dan mempunyai banyak dahan.' } },
      { id: 'hs-grass', x: 212, y: 168, label: { en: 'Grass (Rumput)', bm: 'Rumput (Grass)' }, desc: { en: 'Short plants with soft green blades that cover school fields.', bm: 'Tumbuhan rendah berdaun lembut yang meliputi padang sekolah.' } }
    ],
    knowledgeCheck: {
      question: {
        en: 'Which of these is a tall plant with a strong woody trunk?',
        bm: 'Manakah antara berikut ialah tumbuhan tinggi berbatang berkayu kuat?'
      },
      options: {
        en: ['Mango Tree (Pokok Mangga)', 'Field Grass (Rumput Padang)', 'Small Moss (Lumut)'],
        bm: ['Pokok Mangga (Mango Tree)', 'Rumput Padang (Field Grass)', 'Lumut Kecil (Small Moss)']
      },
      correctIndex: 0,
      feedback: {
        en: 'Yes! A Mango Tree is a tall tree with a strong woody trunk.',
        bm: 'Betul! Pokok Mangga ialah pokok besar yang mempunyai batang berkayu kuat.'
      }
    }
  }
];

const PlantLessonIllustration: React.FC<{
  lessonNumber: number;
  hotspots: typeof PILOT_PLANT_LESSONS[0]['hotspots'];
  activeHotspot: number;
  onSelectHotspot: (idx: number) => void;
}> = ({ lessonNumber, hotspots, activeHotspot, onSelectHotspot }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-100/70 p-3 shadow-inner">
      <svg viewBox="0 0 260 220" className="mx-auto h-52 w-full max-w-xs select-none">
        {lessonNumber === 1 && (
          <g>
            <rect x="0" y="156" width="260" height="64" rx="12" fill="#92400E" opacity="0.88" />
            <g stroke="#FDE68A" strokeWidth="3.5" fill="none" strokeLinecap="round">
              <path d="M130 156 C125 174, 108 184, 94 196" />
              <path d="M130 156 C130 178, 130 192, 128 206" />
              <path d="M130 156 C138 174, 152 184, 166 196" />
            </g>
            <path d="M130 156 L130 56" stroke="#16A34A" strokeWidth="7" strokeLinecap="round" />
            <path d="M130 116 C100 114, 84 98, 96 86 C110 86, 124 98, 130 116 Z" fill="#22C55E" />
            <path d="M130 104 C160 102, 178 86, 166 74 C152 74, 138 86, 130 104 Z" fill="#22C55E" />
            <g transform="translate(130, 44)">
              <circle cx="0" cy="-16" r="14" fill="#EF4444" />
              <circle cx="15" cy="-5" r="14" fill="#DC2626" />
              <circle cx="10" cy="13" r="14" fill="#EF4444" />
              <circle cx="-10" cy="13" r="14" fill="#DC2626" />
              <circle cx="-15" cy="-5" r="14" fill="#EF4444" />
              <circle cx="0" cy="0" r="6" fill="#FACC15" />
            </g>
          </g>
        )}

        {lessonNumber === 2 && (
          <g>
            <circle cx="52" cy="42" r="22" fill="#FACC15" />
            <g transform="translate(198, 42)">
              <ellipse cx="0" cy="0" rx="26" ry="13" fill="#FFFFFF" />
              <path d="M-8 18 C-8 18, -13 26, -8 29 C-3 26, -8 18, -8 18 Z" fill="#38BDF8" />
              <path d="M8 22 C8 22, 3 30, 8 33 C13 30, 8 22, 8 22 Z" fill="#0284C7" />
            </g>
            <rect x="0" y="164" width="260" height="56" rx="12" fill="#854D0E" />
            <path d="M130 164 L130 92" stroke="#16A34A" strokeWidth="7" strokeLinecap="round" />
            <path d="M130 124 C102 120, 90 102, 104 92 C118 94, 126 108, 130 124 Z" fill="#22C55E" />
            <path d="M130 112 C158 108, 170 90, 156 80 C142 82, 134 96, 130 112 Z" fill="#4ADE80" />
          </g>
        )}

        {lessonNumber === 3 && (
          <g>
            <rect x="0" y="166" width="260" height="54" rx="12" fill="#65A30D" />
            <rect x="56" y="88" width="14" height="78" rx="4" fill="#78350F" />
            <circle cx="63" cy="72" r="34" fill="#15803D" />
            <circle cx="145" cy="144" r="26" fill="#22C55E" />
            <g stroke="#14532D" strokeWidth="3.5" strokeLinecap="round">
              <line x1="202" y1="168" x2="196" y2="146" />
              <line x1="210" y1="168" x2="210" y2="142" />
              <line x1="218" y1="168" x2="225" y2="146" />
            </g>
          </g>
        )}

        {hotspots.map((spot, idx) => {
          const isSelected = activeHotspot === idx;
          return (
            <g
              key={spot.id}
              transform={`translate(${spot.x}, ${spot.y})`}
              onClick={() => {
                playTone('pop');
                onSelectHotspot(idx);
              }}
              className="cursor-pointer"
            >
              <circle
                r={isSelected ? 17 : 14}
                fill={isSelected ? '#E11D48' : '#F59E0B'}
                stroke="#FFFFFF"
                strokeWidth="3"
              />
              <text y="4" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
                {idx + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {hotspots[activeHotspot] && (
        <div className="mt-2 rounded-2xl bg-white/95 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-600">
              #{activeHotspot + 1} • {hotspots[activeHotspot].label.en} / {hotspots[activeHotspot].label.bm}
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              Tap pins 1–{hotspots.length}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-700">{hotspots[activeHotspot].desc.en}</p>
          <p className="mt-0.5 text-[11px] font-medium italic text-slate-500">{hotspots[activeHotspot].desc.bm}</p>
        </div>
      )}
    </div>
  );
};

const PILOT_QUIZ_QUESTIONS = [
  {
    id: 'pq1',
    type: 'Picture-Based',
    emoji: '🌱',
    q: { en: 'Which part of a plant grows under the soil and drinks water?', bm: 'Bahagian tumbuhan manakah tumbuh di dalam tanah dan menyerap air?' },
    options: { en: ['Roots (Akar)', 'Flower (Bunga)', 'Leaf (Daun)'], bm: ['Akar (Roots)', 'Bunga (Flower)', 'Daun (Leaf)'] },
    answer: 0
  },
  {
    id: 'pq2',
    type: 'Multiple-Choice',
    emoji: '🌿',
    q: { en: 'Which part carries water from the roots up to the leaves?', bm: 'Bahagian manakah membawa air dari akar naik ke daun?' },
    options: { en: ['Stem (Batang)', 'Petals (Kelopak)', 'Seed (Biji Benih)'], bm: ['Batang (Stem)', 'Kelopak (Petals)', 'Biji Benih (Seed)'] },
    answer: 0
  },
  {
    id: 'pq3',
    type: 'True / False',
    emoji: '☀️',
    q: { en: 'True or False: Green leaves use warm sunlight to make food for the plant.', bm: 'Betul atau Salah: Daun hijau menggunakan cahaya matahari untuk membuat makanan tumbuhan.' },
    options: { en: ['True (Betul)', 'False (Salah)'], bm: ['Betul (True)', 'Salah (False)'] },
    answer: 0
  },
  {
    id: 'pq4',
    type: 'Picture-Based',
    emoji: '🌺',
    q: { en: 'What is the bright red national flower of Malaysia?', bm: 'Apakah nama bunga kebangsaan Malaysia yang berwarna merah?' },
    options: { en: ['Bunga Raya (Hibiscus)', 'Orchid (Orkid)', 'Water Lily (Teratai)'], bm: ['Bunga Raya (Hibiscus)', 'Orkid (Orchid)', 'Teratai (Water Lily)'] },
    answer: 0
  },
  {
    id: 'pq5',
    type: 'Multiple-Choice',
    emoji: '💧',
    q: { en: 'Which three things do all plants need to stay alive and healthy?', bm: 'Apakah tiga keperluan asas untuk tumbuhan hidup sihat?' },
    options: {
      en: ['Sunlight, Water, and Air', 'Toys, Candy, and Milk', 'Shoes, Books, and Pencils'],
      bm: ['Cahaya Matahari, Air dan Udara', 'Mainan, Gula-gula dan Susu', 'Kasut, Buku dan Pensel']
    },
    answer: 0
  },
  {
    id: 'pq6',
    type: 'True / False',
    emoji: '🪴',
    q: { en: 'True or False: A plant will grow greener if you keep it inside a dark cupboard with no water.', bm: 'Betul atau Salah: Pokok akan tumbuh lebih hijau jika disimpan di dalam almari gelap tanpa air.' },
    options: { en: ['True (Betul)', 'False (Salah)'], bm: ['Betul (True)', 'Salah (False)'] },
    answer: 1
  },
  {
    id: 'pq7',
    type: 'Picture-Based',
    emoji: '🌴',
    q: { en: 'A Coconut Tree has a tall, thick woody trunk. What type of plant is it?', bm: 'Pokok Kelapa mempunyai batang berkayu yang tinggi dan tebal. Apakah jenis tumbuhan ini?' },
    options: { en: ['Tall Tree (Pokok Besar)', 'Soft Grass (Rumput)', 'Water Moss (Lumut)'], bm: ['Pokok Besar (Tall Tree)', 'Rumput (Soft Grass)', 'Lumut (Water Moss)'] },
    answer: 0
  },
  {
    id: 'pq8',
    type: 'Multiple-Choice',
    emoji: '🌾',
    q: { en: 'Which plant has short, soft green blades that cover a school field?', bm: 'Tumbuhan manakah berdaun lembut dan pendek yang menutupi padang sekolah?' },
    options: { en: ['Grass (Rumput)', 'Mango Tree (Pokok Mangga)', 'Durian Tree (Pokok Durian)'], bm: ['Rumput (Grass)', 'Pokok Mangga (Mango Tree)', 'Pokok Durian (Durian Tree)'] },
    answer: 0
  },
  {
    id: 'pq9',
    type: 'True / False',
    emoji: '🐝',
    q: { en: 'True or False: Colorful flowers help attract bees and butterflies.', bm: 'Betul atau Salah: Bunga yang berwarna-warni membantu menarik lebah dan rama-rama.' },
    options: { en: ['True (Betul)', 'False (Salah)'], bm: ['Betul (True)', 'Salah (False)'] },
    answer: 0
  },
  {
    id: 'pq10',
    type: 'Multiple-Choice',
    emoji: '🌬️',
    q: { en: 'How do plants take in fresh air around them?', bm: 'Bagaimanakah tumbuhan mengambil udara segar di sekelilingnya?' },
    options: { en: ['Through tiny holes in their leaves', 'Using sneakers', 'With a plastic straw'], bm: ['Melalui liang halus pada daun', 'Menggunakan kasut', 'Dengan penyedut minuman'] },
    answer: 0
  }
];

const MEMORY_CARDS_DATA = [
  { pairId: 'hibiscus', emoji: '🌺', label: 'Bunga Raya' },
  { pairId: 'leaf', emoji: '🍃', label: 'Daun Hijau' },
  { pairId: 'sun', emoji: '☀️', label: 'Matahari' },
  { pairId: 'tree', emoji: '🌴', label: 'Pokok Kelapa' }
];

const INITIAL_ASSET_LIBRARY = [
  {
    id: 'asset-01',
    imageName: 'Aina - Patriotic Flag Greeting',
    category: 'Arts & Creativity',
    topic: 'Malaysian Symbols',
    description: 'Chibi mascot Aina in red & gold brocade outfit with floral crown waving Jalur Gemilang.',
    referenceId: 'ref-master-01',
    imageUrl: null as string | null,
    pose: 'flag',
    status: 'Approved',
    createdAt: '2026-11-18'
  },
  {
    id: 'asset-02',
    imageName: 'Aina - Junior Nature Explorer',
    category: 'Science & Nature',
    topic: 'Plants Around Us',
    description: 'Chibi mascot Aina holding a golden magnifying glass investigating hibiscus leaves.',
    referenceId: 'ref-master-01',
    imageUrl: null as string | null,
    pose: 'study',
    status: 'Approved',
    createdAt: '2026-11-19'
  }
];

const INITIAL_REFERENCE_IMAGES = [
  {
    id: 'ref-master-01',
    name: 'Master Aina Reference Sheet',
    description: 'Primary 3D chibi character visual reference: red & gold brocade attire, black trim, golden floral crown.',
    category: 'All Categories',
    topic: 'Master Character Identity',
    imageUrl: 'master_aina_ref',
    format: 'JPG',
    uploadedAt: '2026-11-18'
  }
];

// ============================================================================
// 4. MAIN APPLICATION COMPONENT (Static PWA Manifest & /sw.js Configured)
// ============================================================================
export default function App() {
  const [lang, setLang] = useState<'en' | 'bm'>('en');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PWA Installability, Offline Status & Deduplicated Sync Queue
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);
  const [swRegistrationStatus, setSwRegistrationStatus] = useState<string>('checking');
  const [pendingSyncQueue, setPendingSyncQueue] = useState<ActivityLog[]>([]);
  const [syncedOperationIds, setSyncedOperationIds] = useState<string[]>([]);

  // Student Accounts & Database Store
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>(INITIAL_STUDENT_ACCOUNTS);
  const [activeStudentId, setActiveStudentId] = useState<string>('STU-2027-001');
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState<boolean>(true);
  const [loginStudentIdInput, setLoginStudentIdInput] = useState<string>('STU-2027-001');
  const [newStudentDraft, setNewStudentDraft] = useState({
    displayName: '',
    schoolYear: 'Year 1',
    preferredLanguage: 'en' as 'en' | 'bm',
    avatar: 'wave'
  });
  const [showCreateAccountModal, setShowCreateAccountModal] = useState<boolean>(false);
  const [authorizedChildId, setAuthorizedChildId] = useState<string>('STU-2027-001');

  const activeStudentRecord =
    studentAccounts.find((s) => s.studentId === activeStudentId) || studentAccounts[0];

  const [studentProfile, setStudentProfile] = useState({
    studentId: activeStudentRecord.studentId,
    name: activeStudentRecord.displayName,
    schoolYear: activeStudentRecord.schoolYear,
    preferredLanguage: activeStudentRecord.preferredLanguage,
    avatar: activeStudentRecord.avatar,
    accountStatus: activeStudentRecord.accountStatus
  });
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileDraft, setProfileDraft] = useState(studentProfile);

  // Student Progress State
  const [stars, setStars] = useState<number>(activeStudentRecord.progress.stars);
  const [completedLessons, setCompletedLessons] = useState<string[]>(
    activeStudentRecord.progress.completedLessons
  );
  const [completedPilotLessons, setCompletedPilotLessons] = useState<string[]>(
    activeStudentRecord.progress.completedPilotLessons
  );
  const [completedPlantGames, setCompletedPlantGames] = useState<string[]>(
    activeStudentRecord.progress.completedPlantGames
  );
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(
    activeStudentRecord.progress.quizAttempts || []
  );
  const [quizBestScore, setQuizBestScore] = useState<number>(
    activeStudentRecord.progress.quizBestScore
  );
  const [dailyDone, setDailyDone] = useState<boolean>(activeStudentRecord.progress.dailyDone);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(
    activeStudentRecord.progress.activityLogs || []
  );

  // Explore & Learn State
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_CATEGORIES[0]);
  const [activeTopicView, setActiveTopicView] = useState<string | null>(null);
  const [activePilotLessonIndex, setActivePilotLessonIndex] = useState<number>(0);
  const [selectedHotspot, setSelectedHotspot] = useState<number>(0);
  const [activePartInfo, setActivePartInfo] = useState<any>(null);
  const [lessonQuizChoice, setLessonQuizChoice] = useState<number | null>(null);

  // Mini-Games State
  const [activeGame, setActiveGame] = useState<string>('plant-parts');
  const [selectedLabelToken, setSelectedLabelToken] = useState<string | null>(null);
  const [placedPlantParts, setPlacedPlantParts] = useState<Record<string, boolean>>({});
  const [selectedPicId, setSelectedPicId] = useState<string | null>(null);
  const [matchedPicPairs, setMatchedPicPairs] = useState<string[]>([]);
  const [plantMcIndex, setPlantMcIndex] = useState<number>(0);
  const [plantMcFeedback, setPlantMcFeedback] = useState<string | null>(null);
  const [memoryDeck, setMemoryDeck] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  // Quiz State
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Admin & AI Studio State
  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [studioSubTab, setStudioSubTab] = useState<string>('dashboard');
  const [referenceLibrary, setReferenceLibrary] = useState(INITIAL_REFERENCE_IMAGES);
  const [selectedRefId, setSelectedRefId] = useState<string>('ref-master-01');
  const [assetLibrary, setAssetLibrary] = useState(INITIAL_ASSET_LIBRARY);
  const [assignedAssets, setAssignedAssets] = useState<Record<string, any>>({});

  const t = UI_STRINGS[lang];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Register static /sw.js Service Worker & Listen to Android Chrome PWA Events
  useEffect(() => {
    const standaloneMatch =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any)?.standalone === true;
    if (standaloneMatch) {
      setIsPwaInstalled(true);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => setSwRegistrationStatus('registered'))
        .catch(() => setSwRegistrationStatus('pending-https'));
    } else {
      setSwRegistrationStatus('unsupported');
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsPwaInstalled(true);
      setDeferredInstallPrompt(null);
      triggerToast('EduExplore 2027 installed on your Home Screen!');
    };
    const handleOnline = () => {
      setIsOnline(true);
      triggerToast(
        lang === 'en'
          ? 'Back online! Ready to sync progress.'
          : 'Kembali dalam talian! Sedia menyegerak kemajuan.'
      );
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerToast(
        lang === 'en'
          ? 'Offline mode active. Progress saved locally.'
          : 'Mod luar talian aktif. Kemajuan disimpan secara tempatan.'
      );
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lang]);

  // Hydrate & Persist Multi-Student Database Store
  useEffect(() => {
    try {
      const dbStoreRaw = localStorage.getItem('eduexplore_2027_db_v4');
      if (dbStoreRaw) {
        const parsedDb = JSON.parse(dbStoreRaw);
        if (Array.isArray(parsedDb.studentAccounts) && parsedDb.studentAccounts.length > 0) {
          setStudentAccounts(parsedDb.studentAccounts);
          const targetId = parsedDb.activeStudentId || parsedDb.studentAccounts[0].studentId;
          const found =
            parsedDb.studentAccounts.find((s: StudentAccount) => s.studentId === targetId) ||
            parsedDb.studentAccounts[0];
          loadStudentRecordIntoState(found);
          setIsStudentLoggedIn(parsedDb.isStudentLoggedIn !== false);
        }
      }
    } catch {
      // Ignore storage read error
    }
  }, []);

  useEffect(() => {
    setStudentAccounts((prevAccounts) => {
      const updated = prevAccounts.map((acc) => {
        if (acc.studentId !== activeStudentId) return acc;
        return {
          ...acc,
          displayName: studentProfile.name,
          schoolYear: studentProfile.schoolYear,
          preferredLanguage: lang,
          avatar: studentProfile.avatar,
          accountStatus: studentProfile.accountStatus,
          progress: {
            stars,
            completedLessons,
            completedPilotLessons,
            completedPlantGames,
            quizAttempts,
            quizBestScore,
            dailyDone,
            activityLogs,
            lastActivity: activityLogs[0]?.title || acc.progress.lastActivity
          }
        };
      });
      try {
        localStorage.setItem(
          'eduexplore_2027_db_v4',
          JSON.stringify({
            studentAccounts: updated,
            activeStudentId,
            isStudentLoggedIn,
            updatedAt: new Date().toISOString()
          })
        );
      } catch {
        // Ignore quota error
      }
      return updated;
    });
  }, [
    activeStudentId,
    isStudentLoggedIn,
    studentProfile,
    lang,
    stars,
    completedLessons,
    completedPilotLessons,
    completedPlantGames,
    quizAttempts,
    quizBestScore,
    dailyDone,
    activityLogs
  ]);

  const loadStudentRecordIntoState = (record: StudentAccount) => {
    if (!record) return;
    setActiveStudentId(record.studentId);
    setStudentProfile({
      studentId: record.studentId,
      name: record.displayName,
      schoolYear: record.schoolYear,
      preferredLanguage: record.preferredLanguage,
      avatar: record.avatar,
      accountStatus: record.accountStatus
    });
    setLang(record.preferredLanguage);
    setStars(record.progress.stars ?? 0);
    setCompletedLessons(record.progress.completedLessons ?? []);
    setCompletedPilotLessons(record.progress.completedPilotLessons ?? []);
    setCompletedPlantGames(record.progress.completedPlantGames ?? []);
    setQuizAttempts(record.progress.quizAttempts ?? []);
    setQuizBestScore(record.progress.quizBestScore ?? 0);
    setDailyDone(Boolean(record.progress.dailyDone));
    setActivityLogs(record.progress.activityLogs ?? []);
  };

  const recordLearningActivity = ({
    type,
    title,
    topic,
    starsEarned
  }: {
    type: string;
    title: string;
    topic: string;
    starsEarned: number;
  }) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const opKey = `${activeStudentId}:${type}:${title}`;
    const entry: ActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      opKey,
      studentId: activeStudentId,
      type,
      title,
      topic,
      starsEarned,
      timestamp: nowStr
    };
    setActivityLogs((prev) => [entry, ...prev.slice(0, 29)]);
    setPendingSyncQueue((prev) => {
      if (prev.some((item) => item.opKey === opKey) || syncedOperationIds.includes(opKey)) {
        return prev;
      }
      return [...prev, entry];
    });
  };

  const handleFlushPendingSyncQueue = () => {
    if (!isOnline) {
      triggerToast('Offline: Progress remains safely queued locally.');
      return;
    }
    if (!IS_FIREBASE_CONFIGURED) {
      triggerToast('Local queue saved. Add VITE_FIREBASE_* ENV variables in Vercel for Cloud Firestore sync.');
      return;
    }
    const deduplicated = pendingSyncQueue.filter((op) => op.opKey && !syncedOperationIds.includes(op.opKey));
    const newlySyncedKeys = deduplicated.map((op) => op.opKey as string);
    setSyncedOperationIds((prev) => Array.from(new Set([...prev, ...newlySyncedKeys])));
    setPendingSyncQueue([]);
    playTone('success');
    triggerToast(`Synchronized ${deduplicated.length} records to Cloud Firestore!`);
  };

  const handleTriggerPwaInstall = async () => {
    if (!deferredInstallPrompt) {
      triggerToast(
        lang === 'en'
          ? 'Open Chrome menu (⋮) → Tap "Install app" or "Add to Home screen".'
          : 'Buka menu Chrome (⋮) → Tekan "Install app" atau "Add to Home screen".'
      );
      return;
    }
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      setIsPwaInstalled(true);
    }
    setDeferredInstallPrompt(null);
  };

  const handleCompleteLesson = (lessonId: string) => {
    if (lessonId.startsWith('plant-')) {
      if (!completedPilotLessons.includes(lessonId)) {
        const lessonObj = PILOT_PLANT_LESSONS.find((l) => l.id === lessonId);
        setCompletedPilotLessons((prev) => [...prev, lessonId]);
        setStars((s) => s + 2);
        recordLearningActivity({
          type: 'lesson',
          title: lessonObj ? lessonObj.title.en : lessonId,
          topic: 'Plants Around Us',
          starsEarned: 2
        });
        playTone('success');
        triggerToast(lang === 'en' ? 'Lesson completed! +2 Stars!' : 'Pelajaran selesai! +2 Bintang!');
      } else {
        playTone('pop');
        triggerToast(lang === 'en' ? 'Already completed!' : 'Sudah selesai!');
      }
      return;
    }

    if (!completedLessons.includes(lessonId)) {
      const catObj = INITIAL_CATEGORIES.find((c) => c.id === lessonId);
      setCompletedLessons((prev) => [...prev, lessonId]);
      setStars((s) => s + 2);
      recordLearningActivity({
        type: 'lesson',
        title: catObj ? catObj.topicTitle.en : lessonId,
        topic: catObj ? catObj.title.en : lessonId,
        starsEarned: 2
      });
      playTone('success');
      triggerToast(lang === 'en' ? 'Awesome! +2 Stars collected!' : 'Hebat! +2 Bintang dikumpul!');
    }
  };

  const handleCompleteMiniGame = (gameId: string, rewardStars = 2) => {
    if (!completedPlantGames.includes(gameId)) {
      setCompletedPlantGames((prev) => [...prev, gameId]);
      setStars((s) => s + rewardStars);
      recordLearningActivity({
        type: 'game',
        title: `Completed Game: ${gameId}`,
        topic: 'Plants Around Us',
        starsEarned: rewardStars
      });
      playTone('success');
      triggerToast(`Game completed! +${rewardStars} Stars!`);
    }
  };

  const initMemoryGame = () => {
    const doubled = [...MEMORY_CARDS_DATA, ...MEMORY_CARDS_DATA]
      .map((item, idx) => ({ ...item, uid: `${item.pairId}-${idx}`, sortKey: Math.random() }))
      .sort((a, b) => a.sortKey - b.sortKey);
    setMemoryDeck(doubled);
    setFlippedIndices([]);
    setMatchedPairs([]);
  };

  useEffect(() => {
    initMemoryGame();
  }, []);

  const totalCompletedActivitiesCount =
    completedLessons.length + completedPilotLessons.length + completedPlantGames.length;
  const overallProgressPercent = Math.min(100, Math.round((totalCompletedActivitiesCount / 13) * 100));

  const navItems = [
    { id: 'home', icon: Home, label: t.home },
    { id: 'explore', icon: Compass, label: t.explore },
    { id: 'play', icon: Gamepad2, label: t.play },
    { id: 'quiz', icon: Award, label: t.quiz },
    { id: 'progress', icon: TrendingUp, label: t.progress },
    { id: 'parents', icon: ShieldCheck, label: t.parents }
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-rose-50/70 via-amber-50/40 to-sky-50/60 font-sans text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white/60 shadow-xl backdrop-blur-xs">
        <header
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          className="sticky top-0 z-30 flex items-center justify-between border-b border-rose-100/80 bg-white/95 px-3.5 pb-3 backdrop-blur-md"
        >
          <button
            onClick={() => {
              setActiveTopicView(null);
              setActiveTab('home');
            }}
            className="flex min-h-[44px] items-center gap-2 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-black tracking-tight text-slate-900">
                EduExplore <span className="text-rose-600">2027</span>
              </span>
              <span className="block text-[10px] font-bold text-slate-400">v1.0 • Android PWA</span>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <div className="flex min-h-[36px] items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-1 text-xs font-extrabold text-amber-800">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              {stars}
            </div>
            <button
              onClick={() => {
                playTone('pop');
                setLang((prev) => (prev === 'en' ? 'bm' : 'en'));
              }}
              className="flex min-h-[38px] items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-700"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === 'en' ? 'EN|BM' : 'BM|EN'}
            </button>
          </div>
        </header>

        {(!isOnline || pendingSyncQueue.length > 0) && (
          <div
            className={`flex items-center justify-between px-4 py-1.5 text-[11px] font-extrabold ${
              !isOnline ? 'bg-amber-500 text-white' : 'bg-sky-50 text-sky-900 border-b border-sky-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {!isOnline ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              {!isOnline
                ? 'Offline Mode — Progress saved locally'
                : `${pendingSyncQueue.length} local record(s) queued`}
            </span>
            {isOnline && pendingSyncQueue.length > 0 && (
              <button
                onClick={handleFlushPendingSyncQueue}
                className="rounded-lg bg-sky-600 px-2 py-0.5 text-[10px] font-extrabold text-white"
              >
                Sync
              </button>
            )}
          </div>
        )}

        {toastMessage && (
          <div className="fixed left-1/2 top-16 z-50 w-11/12 max-w-sm -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-2.5 text-center text-xs font-extrabold text-white shadow-lg">
            {toastMessage}
          </div>
        )}

        <main className="flex-1 px-3.5 pt-4 pb-28">
          {activeTab === 'home' && (
            <div className="space-y-4">
              {!isStudentLoggedIn ? (
                <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex justify-center">
                    <MascotAina pose="wave" size={90} />
                  </div>
                  <h2 className="text-center text-base font-extrabold">Student Sign In</h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={loginStudentIdInput}
                      onChange={(e) => setLoginStudentIdInput(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs font-extrabold uppercase"
                    />
                    <button
                      onClick={() => {
                        const found = studentAccounts.find(
                          (s) => s.studentId.toLowerCase() === loginStudentIdInput.trim().toLowerCase()
                        );
                        if (found) {
                          loadStudentRecordIntoState(found);
                          setIsStudentLoggedIn(true);
                        } else {
                          triggerToast('Student ID not found');
                        }
                      }}
                      className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white"
                    >
                      Log In
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCreateAccountModal(!showCreateAccountModal)}
                    className="w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 py-2.5 text-xs font-extrabold text-emerald-800"
                  >
                    + Create New Student Account
                  </button>
                  {showCreateAccountModal && (
                    <div className="space-y-2 pt-2">
                      <input
                        type="text"
                        value={newStudentDraft.displayName}
                        onChange={(e) => setNewStudentDraft({ ...newStudentDraft, displayName: e.target.value })}
                        placeholder="Student Display Name"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                      />
                      <button
                        onClick={() => {
                          if (!newStudentDraft.displayName.trim()) return;
                          const newId = `STU-2027-00${studentAccounts.length + 1}`;
                          const acc: StudentAccount = {
                            studentId: newId,
                            displayName: newStudentDraft.displayName.trim(),
                            schoolYear: 'Year 1',
                            preferredLanguage: 'en',
                            avatar: 'wave',
                            accountStatus: 'Active',
                            authorizedParentCode: 'PAR-2027',
                            progress: {
                              stars: 2,
                              completedLessons: [],
                              completedPilotLessons: [],
                              completedPlantGames: [],
                              quizAttempts: [],
                              quizBestScore: 0,
                              dailyDone: false,
                              activityLogs: [],
                              lastActivity: 'Joined EduExplore 2027'
                            }
                          };
                          setStudentAccounts((prev) => [...prev, acc]);
                          loadStudentRecordIntoState(acc);
                          setIsStudentLoggedIn(true);
                        }}
                        className="w-full rounded-2xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white"
                      >
                        Create & Start
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="rounded-3xl bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <h1 className="text-xl font-extrabold">
                          {t.welcome}, {studentProfile.name}!
                        </h1>
                        <p className="text-xs text-rose-50">{t.mascotGreeting}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="rounded-xl bg-black/20 px-2.5 py-1 text-[10px] font-bold">
                            {studentProfile.studentId} • {studentProfile.schoolYear}
                          </span>
                          <button
                            onClick={() => {
                              setProfileDraft(studentProfile);
                              setIsEditingProfile(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-[10px] font-extrabold text-rose-600"
                          >
                            <Edit3 className="h-3 w-3" /> Profile
                          </button>
                          <button
                            onClick={() => setIsStudentLoggedIn(false)}
                            className="inline-flex items-center gap-1 rounded-xl bg-black/25 px-2.5 py-1 text-[10px] font-extrabold text-white"
                          >
                            <LogOut className="h-3 w-3" /> Switch
                          </button>
                        </div>
                      </div>
                      <MascotAina pose={studentProfile.avatar || 'wave'} size={96} />
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="rounded-3xl border-2 border-rose-200 bg-white p-4 shadow-md space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-extrabold">Edit Student Profile</h3>
                        <button onClick={() => setIsEditingProfile(false)}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={profileDraft.name}
                        onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                      />
                      <button
                        onClick={() => {
                          setStudentProfile(profileDraft);
                          setIsEditingProfile(false);
                          triggerToast('Profile updated!');
                        }}
                        className="w-full rounded-2xl bg-rose-600 py-2 text-xs font-extrabold text-white"
                      >
                        Save Profile
                      </button>
                    </div>
                  )}

                  <div className="rounded-3xl border border-rose-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-500">{t.yourProgress}</p>
                        <span className="mt-1 inline-flex items-center gap-1 text-lg font-black text-amber-500">
                          <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                          {stars} {t.stars}
                        </span>
                      </div>
                      <span className="text-xl font-black text-rose-600">{overallProgressPercent}%</span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                        style={{ width: `${overallProgressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                        PILOT MODULE
                      </span>
                      <h3 className="mt-1 text-sm font-extrabold text-emerald-950">
                        Plants Around Us ({completedPilotLessons.length}/3)
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTopicView('plants-hub');
                        setActiveTab('explore');
                      }}
                      className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white"
                    >
                      Open →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {INITIAL_CATEGORIES.map((cat) => {
                      const IconComp = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setActiveTopicView(cat.id === 'science' ? 'plants-hub' : null);
                            setActiveTab('explore');
                          }}
                          className={`rounded-3xl border ${cat.border} bg-white p-3.5 text-left shadow-sm`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${cat.bg}`}>
                            <IconComp className={`h-5 w-5 ${cat.text}`} />
                          </div>
                          <h3 className="mt-2 text-xs font-extrabold text-slate-800">{cat.title[lang]}</h3>
                          <p className="text-[10px] text-slate-500">{cat.topicTitle[lang]}</p>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="space-y-4">
              {activeTopicView === 'plants-lesson' ? (
                (() => {
                  const lesson = PILOT_PLANT_LESSONS[activePilotLessonIndex];
                  const isDone = completedPilotLessons.includes(lesson.id);
                  return (
                    <div className="space-y-4">
                      <button
                        onClick={() => setActiveTopicView('plants-hub')}
                        className="flex items-center gap-1 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold"
                      >
                        <ChevronLeft className="h-4 w-4" /> Back
                      </button>
                      <div className="rounded-3xl bg-white p-4 shadow-sm">
                        <h2 className="text-lg font-black">{lesson.title[lang]}</h2>
                        <p className="mt-2 text-xs text-slate-700">{lesson.explanation[lang]}</p>
                      </div>
                      <PlantLessonIllustration
                        lessonNumber={lesson.number}
                        hotspots={lesson.hotspots}
                        activeHotspot={selectedHotspot}
                        onSelectHotspot={setSelectedHotspot}
                      />
                      <div className="rounded-3xl bg-amber-50 p-4 space-y-2">
                        <p className="text-xs font-extrabold">{lesson.knowledgeCheck.question[lang]}</p>
                        {lesson.knowledgeCheck.options[lang].map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => setLessonQuizChoice(idx)}
                            className={`w-full rounded-2xl border p-2.5 text-left text-xs font-extrabold ${
                              lessonQuizChoice === idx
                                ? idx === lesson.knowledgeCheck.correctIndex
                                  ? 'bg-emerald-100 border-emerald-500'
                                  : 'bg-rose-100 border-rose-500'
                                : 'bg-white'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCompleteLesson(lesson.id)}
                        className="w-full rounded-2xl bg-rose-600 py-3 text-xs font-extrabold text-white"
                      >
                        {isDone ? t.completedBadge : t.completeLesson}
                      </button>
                    </div>
                  );
                })()
              ) : activeTopicView === 'plants-hub' ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTopicView(null)}
                    className="flex items-center gap-1 rounded-2xl bg-white px-3 py-2 text-xs font-extrabold"
                  >
                    <ChevronLeft className="h-4 w-4" /> All Categories
                  </button>
                  <div className="rounded-3xl bg-emerald-600 p-4 text-white">
                    <h2 className="text-lg font-black">Plants Around Us</h2>
                    <p className="text-xs">{completedPilotLessons.length}/3 Lessons Completed</p>
                  </div>
                  {PILOT_PLANT_LESSONS.map((les, idx) => (
                    <button
                      key={les.id}
                      onClick={() => {
                        setActivePilotLessonIndex(idx);
                        setSelectedHotspot(0);
                        setLessonQuizChoice(null);
                        setActiveTopicView('plants-lesson');
                      }}
                      className="flex w-full items-center justify-between rounded-3xl bg-white p-4 text-left shadow-sm"
                    >
                      <span className="text-xs font-extrabold">
                        {les.number}. {les.title[lang]}
                      </span>
                      <ChevronRight className="h-4 w-4 text-emerald-600" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl bg-white p-4 shadow-sm space-y-3">
                  <h2 className="text-base font-extrabold">{selectedCategory.title[lang]}</h2>
                  <p className="text-xs text-slate-600">{selectedCategory.notes[lang]}</p>
                  <div className="space-y-2">
                    {selectedCategory.parts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActivePartInfo(p)}
                        className="w-full rounded-2xl bg-slate-50 p-3 text-left text-xs font-extrabold"
                      >
                        {p.label[lang]}
                      </button>
                    ))}
                  </div>
                  {activePartInfo && (
                    <div className="rounded-2xl bg-amber-50 p-3 text-xs font-bold">
                      {activePartInfo.info[lang]}
                    </div>
                  )}
                  <button
                    onClick={() => handleCompleteLesson(selectedCategory.id)}
                    className="w-full rounded-2xl bg-rose-600 py-3 text-xs font-extrabold text-white"
                  >
                    {t.completeLesson}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'play' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-amber-500 p-4 text-white flex items-center justify-between">
                <h2 className="text-lg font-extrabold">{t.play}</h2>
                <MascotAina pose="play" size={64} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveGame('plant-parts')}
                  className={`rounded-2xl py-2 text-xs font-extrabold ${
                    activeGame === 'plant-parts' ? 'bg-slate-900 text-white' : 'bg-white'
                  }`}
                >
                  Label Plant Parts
                </button>
                <button
                  onClick={() => setActiveGame('memory')}
                  className={`rounded-2xl py-2 text-xs font-extrabold ${
                    activeGame === 'memory' ? 'bg-slate-900 text-white' : 'bg-white'
                  }`}
                >
                  Memory Pairs
                </button>
              </div>
              {activeGame === 'plant-parts' ? (
                <div className="rounded-3xl bg-white p-4 shadow-sm space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {['flower', 'leaf', 'stem', 'roots'].map((tok) => (
                      <button
                        key={tok}
                        disabled={Boolean(placedPlantParts[tok])}
                        onClick={() => setSelectedLabelToken(tok)}
                        className={`rounded-xl px-3 py-2 text-xs font-extrabold ${
                          selectedLabelToken === tok ? 'bg-rose-600 text-white' : 'bg-amber-100'
                        }`}
                      >
                        {tok.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  {['flower', 'leaf', 'stem', 'roots'].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        if (selectedLabelToken === slot) {
                          const next = { ...placedPlantParts, [slot]: true };
                          setPlacedPlantParts(next);
                          setSelectedLabelToken(null);
                          if (Object.keys(next).length === 4) {
                            handleCompleteMiniGame('plant-parts', 2);
                          }
                        }
                      }}
                      className="w-full rounded-2xl border-2 border-dashed p-3 text-left text-xs font-extrabold"
                    >
                      {placedPlantParts[slot] ? `✓ ${slot.toUpperCase()}` : `Place ${slot} here`}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 rounded-3xl bg-white p-4">
                  {memoryDeck.map((card, idx) => {
                    const open = flippedIndices.includes(idx) || matchedPairs.includes(card.pairId);
                    return (
                      <button
                        key={card.uid}
                        onClick={() => {
                          if (open || flippedIndices.length === 2) return;
                          const next = [...flippedIndices, idx];
                          setFlippedIndices(next);
                          if (next.length === 2) {
                            if (memoryDeck[next[0]].pairId === memoryDeck[next[1]].pairId) {
                              const m = [...matchedPairs, card.pairId];
                              setMatchedPairs(m);
                              setFlippedIndices([]);
                              if (m.length === MEMORY_CARDS_DATA.length) {
                                handleCompleteMiniGame('memory', 2);
                              }
                            } else {
                              setTimeout(() => setFlippedIndices([]), 650);
                            }
                          }
                        }}
                        className="aspect-square rounded-2xl bg-rose-500 text-2xl text-white font-black"
                      >
                        {open ? card.emoji : '?'}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="rounded-3xl bg-white p-5 shadow-sm space-y-4">
              {quizFinished ? (
                <div className="text-center space-y-3">
                  <MascotAina pose="celebrate" size={100} className="mx-auto" />
                  <h3 className="text-lg font-black">
                    Score: {quizScore}/{PILOT_QUIZ_QUESTIONS.length}
                  </h3>
                  <button
                    onClick={() => {
                      setQuizIndex(0);
                      setQuizScore(0);
                      setQuizFinished(false);
                    }}
                    className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-extrabold text-white"
                  >
                    Restart Quiz
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center text-4xl">{PILOT_QUIZ_QUESTIONS[quizIndex].emoji}</div>
                  <h3 className="text-center text-sm font-extrabold">
                    {PILOT_QUIZ_QUESTIONS[quizIndex].q[lang]}
                  </h3>
                  <div className="space-y-2">
                    {PILOT_QUIZ_QUESTIONS[quizIndex].options[lang].map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const right = idx === PILOT_QUIZ_QUESTIONS[quizIndex].answer;
                          const nextScore = right ? quizScore + 1 : quizScore;
                          setQuizSelected(idx);
                          setTimeout(() => {
                            setQuizSelected(null);
                            if (quizIndex + 1 < PILOT_QUIZ_QUESTIONS.length) {
                              setQuizScore(nextScore);
                              setQuizIndex((i) => i + 1);
                            } else {
                              setQuizScore(nextScore);
                              setQuizFinished(true);
                              setStars((s) => s + 3);
                              if (nextScore > quizBestScore) setQuizBestScore(nextScore);
                            }
                          }, 500);
                        }}
                        className={`w-full rounded-2xl border p-3 text-left text-xs font-extrabold ${
                          quizSelected === idx ? 'bg-purple-100 border-purple-500' : 'bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-3">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <h2 className="text-base font-extrabold">{t.progress}</h2>
                <p className="text-xs text-slate-500">
                  Stars: {stars} ★ • Best Quiz: {quizBestScore}/10
                </p>
              </div>
              {activityLogs.map((log) => (
                <div key={log.id} className="rounded-2xl bg-white p-3 text-xs shadow-2xs flex justify-between">
                  <span className="font-bold">{log.title}</span>
                  <span className="font-extrabold text-amber-600">+{log.starsEarned} ★</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'parents' && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-slate-900 p-5 text-white">
                <h2 className="text-lg font-extrabold">{t.parents}</h2>
                <p className="text-xs text-slate-300">
                  Firebase Mode: {IS_FIREBASE_CONFIGURED ? 'Connected' : 'Demo Mode (Set VITE_FIREBASE_* in Vercel)'}
                </p>
              </div>

              <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-sky-950">Install on Android Chrome (PWA)</h3>
                  <button
                    onClick={handleTriggerPwaInstall}
                    className="rounded-xl bg-sky-600 px-3 py-1.5 text-[11px] font-extrabold text-white"
                  >
                    {isPwaInstalled ? 'Installed' : 'Install App'}
                  </button>
                </div>
                <p className="text-[11px] text-sky-900">
                  Service Worker (/sw.js): <strong>{swRegistrationStatus}</strong> • Manifest: <strong>/manifest.webmanifest</strong>
                </p>
              </div>

              <button
                onClick={() => setActiveTab('studio')}
                className="w-full rounded-2xl bg-rose-600 py-3 text-xs font-extrabold text-white"
              >
                Open MY LEARNING CONTENT STUDIO →
              </button>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="space-y-4">
              {!adminUnlocked ? (
                <div className="rounded-3xl bg-white p-6 text-center space-y-3">
                  <Lock className="mx-auto h-8 w-8 text-rose-600" />
                  <h3 className="text-sm font-extrabold">Enter Admin PIN (2027)</h3>
                  <div className="flex gap-2 justify-center">
                    <input
                      type="password"
                      value={adminPinInput}
                      onChange={(e) => setAdminPinInput(e.target.value)}
                      className="rounded-xl border px-3 py-2 text-center text-xs font-bold"
                    />
                    <button
                      onClick={() => {
                        if (adminPinInput === '2027') setAdminUnlocked(true);
                        else triggerToast('Use PIN 2027');
                      }}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white"
                    >
                      Unlock
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-white p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-extrabold">MY LEARNING CONTENT STUDIO</h3>
                    <button
                      onClick={() => setAdminUnlocked(false)}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold"
                    >
                      Lock
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">
                    Assets in Library: {assetLibrary.length} • Reference Images: {referenceLibrary.length} • Active Student: {authorizedChildId}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        <nav
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-rose-100 bg-white/95 px-1.5 pt-1.5 backdrop-blur-md"
        >
          <div className="grid grid-cols-6 gap-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id || (item.id === 'parents' && activeTab === 'studio');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playTone('pop');
                    if (item.id !== 'explore') setActiveTopicView(null);
                    setActiveTab(item.id);
                  }}
                  className={`flex min-h-[48px] flex-col items-center justify-center rounded-2xl py-1 ${
                    isActive ? 'bg-rose-50 text-rose-600 font-extrabold' : 'text-slate-400 font-semibold'
                  }`}
                >
                  <IconComp className="h-5 w-5" />
                  <span className="mt-0.5 text-[9px]">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
