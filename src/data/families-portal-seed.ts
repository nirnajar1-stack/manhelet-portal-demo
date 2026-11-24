/**
 * Living seed for פורטל המשפחות — fictional Alon family demo only.
 * Matches user mockup atmosphere (home / requests / companion / programs).
 */

import { withBase } from '@/lib/base-path'

export const familiesPortalProfile = {
  viewerFirstName: 'איתי',
  viewerFullName: 'איתי אלון',
  familyName: 'משפחת אלון',
  fileNumber: '7029',
  idHint: '•••-•••-482',
  status: 'פעיל' as const,
  members: ['איתי אלון', 'נועם אלון', 'יונתן אלון'],
  greetingTagline: 'אנחנו כאן איתכם, תמיד לצידכם',
}

export const familiesCompanion = {
  id: 'companion-nir',
  name: 'ניר כהן',
  title: 'מנהל תיק · מלווה אישי',
  initials: 'נ',
  phone: '050-8912345',
  email: 'nir.c@pmo.gov.il',
  hours: '08:30–18:00',
  emergencyNote: 'חירום 24/7',
  available: true,
  availableLabel: 'זמין לשיחה',
  certifiedLabel: 'מלווה מוסמך',
  supportAreas: [
    'סיוע כלכלי והטבות',
    'תיאום דיור ומעברים',
    'בריאות וליווי טיפולי',
    'תיאום מול משרדי ממשלה וביטחון',
  ],
}

export const familiesHotlines = [
  {
    id: 'hotline-8855',
    dial: '*8855',
    title: 'מוקד המנהלת',
    blurb: 'מענה אישי, לוגיסטיקה והבהרות',
    tone: 'danger' as const,
  },
  {
    id: 'hotline-1201',
    dial: '1201',
    title: 'מוקד תמיכה רגשית',
    blurb: 'הכוונה ותמיכה רגשית',
    tone: 'info' as const,
  },
]

export const familiesTransition = {
  title: 'הכנות למעבר הדיור הקרוב · מלון שפיים',
  stepIndex: 2,
  stepTotal: 4,
  steps: [
    'הערכת צרכים',
    'הקצאת יחידה',
    'אישור סופי וקליטה',
    'השתקעות שוטפת',
  ],
}

export type FamiliesRequestStatus =
  | 'in_progress'
  | 'done'
  | 'checking'
  | 'open'

export interface FamiliesRequestItem {
  id: string
  ref: string
  title: string
  status: FamiliesRequestStatus
  statusLabel: string
  summary: string
  updatedLabel?: string
  etaLabel?: string
  amountLabel?: string
  actionLabel?: string
  steps?: string[]
  stepIndex?: number
  icon?: 'rent' | 'desk' | 'bus' | 'winter' | 'health' | 'student'
}

export const familiesRequests: FamiliesRequestItem[] = [
  {
    id: 'freq-1',
    ref: 'BK-24091',
    title: 'הגדלת סיוע שכ״ד לדיור חלופי',
    status: 'in_progress',
    statusLabel: 'בטיפול פעיל',
    summary: 'עודכן תיק הבקשה במערכת. ממתינים לאישור סופי.',
    etaLabel: 'מענה משוער: עד 5 ימי עבודה',
    amountLabel: 'סכום משוער: 7,200 ₪',
    steps: ['הגשה', 'זכאות', 'אישור סופי', 'תשלום'],
    stepIndex: 2,
    icon: 'rent',
  },
  {
    id: 'freq-2',
    ref: 'BK-24102',
    title: 'התאמת שולחן וציוד ארגונומי לעבודה מרחוק',
    status: 'in_progress',
    statusLabel: 'בטיפול',
    summary: 'ניר הזמין ציוד דרך ספק המנהלת. צפוי אספקה השבוע.',
    updatedLabel: 'עודכן היום ב־09:40',
    actionLabel: 'הודעה לניר לגבי אספקה',
    icon: 'desk',
  },
  {
    id: 'freq-3',
    ref: 'BK-23988',
    title: 'כרטיסי תלמיד והסעות לילדים',
    status: 'done',
    statusLabel: 'הושלם בהצלחה',
    summary: 'אישור דיגיטלי מוכן להורדה.',
    updatedLabel: 'הושלם ב־18 בדצמבר',
    actionLabel: 'הורדת אישור דיגיטלי',
    icon: 'student',
  },
  {
    id: 'freq-4',
    ref: 'BK-23851',
    title: 'מענק טיפול מותאם',
    status: 'checking',
    statusLabel: 'בבדיקה מול קופת חולים',
    summary: 'אין צורך בפעולה נוספת מצדכם כרגע.',
    icon: 'health',
  },
  {
    id: 'freq-5',
    ref: 'BK-23720',
    title: 'מענק ארגון מיוחד לחודשי החורף',
    status: 'done',
    statusLabel: 'הושלם בהצלחה',
    summary: 'שולם סכום של 5,000 ₪ לחשבון המשפחה.',
    updatedLabel: 'הושלם ב־2 בדצמבר',
    amountLabel: '5,000 ₪',
    icon: 'winter',
  },
]

export const familiesDocuments = [
  { id: 'doc-1', title: 'אישור זכאות שכ״ד 2024', type: 'PDF' },
  { id: 'doc-2', title: 'אישור הסעות ילדים תשפ״ד', type: 'PDF' },
  { id: 'doc-3', title: 'טופס הצהרת משפחה חתום', type: 'PDF' },
]

export const familiesRightsShort = [
  {
    id: 'right-1',
    title: 'סבסוד חינוך לגיל הרך',
    status: 'pending' as const,
    statusLabel: 'טרם הוגש',
  },
  {
    id: 'right-2',
    title: 'ליווי בריאות הנפש',
    status: 'approved' as const,
    statusLabel: 'מאושר במלואו',
  },
]

export const familiesNextMeeting = {
  title: 'הפגישה הבאה שלנו',
  when: 'יום שני, 13 במאי · 10:00',
  where: 'מלון שפיים, חדר ישיבות 1',
  changeLabel: 'עדכון / שינוי מועד',
}

export const familiesMeetings = [
  {
    id: 'meet-1',
    title: 'פגישת מעקב אישית · תיק משפחה',
    statusLabel: 'בתיאום סופי',
    status: 'pending' as const,
    when: 'יום ה׳, 10:30',
    where: 'מרכז מנהלת החטופים / קישור וידאו',
  },
]

export interface FamiliesChatMessage {
  id: string
  from: 'companion' | 'family'
  author: string
  time: string
  body: string
}

export const familiesChatSeed: FamiliesChatMessage[] = [
  {
    id: 'msg-1',
    from: 'companion',
    author: 'ניר כהן',
    time: '09:15',
    body: 'בוקר טוב למשפחת אלון. עדכנתי במערכת את מסמכי הזכאות לדיור — אפשר לעיין בהם באזור המסמכים.',
  },
  {
    id: 'msg-2',
    from: 'family',
    author: 'איתי אלון',
    time: '09:42',
    body: 'תודה ניר. נשמח לתאם ליום חמישי בבוקר לגבי סיוע בטיפול.',
  },
  {
    id: 'msg-3',
    from: 'companion',
    author: 'ניר כהן',
    time: '10:05',
    body: 'מצוין. קבעתי ל־10:30 במרכז המנהלת — אשלח קישור וידאו גם לגיבוי.',
  },
]

export type FamiliesProgramFilter =
  | 'all'
  | 'kids'
  | 'family'
  | 'benefits'
  | 'registered'

export interface FamiliesProgramCard {
  id: string
  title: string
  summary: string
  filter: FamiliesProgramFilter[]
  kind: 'event' | 'community' | 'respite' | 'benefit'
  status: 'registered' | 'open' | 'pending' | 'eligible' | 'new'
  statusLabel: string
  dateLabel: string
  timeLabel?: string
  location: string
  imageTone: 'nature' | 'craft' | 'photo' | 'bridge' | 'sport' | 'community' | 'warmth'
  /** Path under public/, e.g. /families/nature.jpg */
  imageSrc: string
  /** Hebrew accessible description of the illustration */
  imageAlt: string
  registeredMembers?: string[]
  poll?: boolean
  ctaPrimary: string
  ctaSecondary?: string
}

/** Shared illustrative photo map (family-friendly, no real victims/PII). */
export const familiesImageAssets = {
  nature: {
    src: withBase('/families/nature.jpg'),
    alt: 'משפחה בטיול שביל חופי בשמש — גב אל המצלמה, נוף ים וצמחייה',
  },
  craft: {
    src: withBase('/families/craft.jpg'),
    alt: 'ידי הורה וילד מעצבים חימר על אובניים בסדנת קדרות',
  },
  photo: {
    src: withBase('/families/photo.jpg'),
    alt: 'בני נוער לומדים צילום בחוץ עם מצלמות, גב אל המצלמה',
  },
  bridge: {
    src: withBase('/families/bridge.jpg'),
    alt: 'גשר עץ מעל נחל ביער — אווירת הפוגה וטבע שקט',
  },
  sport: {
    src: withBase('/families/sport.jpg'),
    alt: 'ערכת ספורט ופנאי ביתית: מזרן, חבל, משקולות קלות ובקבוק מים',
  },
  community: {
    src: withBase('/families/community.jpg'),
    alt: 'מעגל שיחה קהילתי באולם מואר — מפגש תומך ומזמין',
  },
  warmth: {
    src: withBase('/families/warmth.jpg'),
    alt: 'סלון ביתי חם בשעת ערב — ספה, שמיכה, ספרי ילדים וכוס תה',
  },
} as const

export const familiesPrograms: FamiliesProgramCard[] = [
  {
    id: 'prog-photo',
    title: 'סדנת צילום יצירתי לנוער',
    summary: 'מפגש יצירתי עם מדריך מקצועי — חיזוק ביטוי וקהילה.',
    filter: ['all', 'kids', 'registered'],
    kind: 'event',
    status: 'registered',
    statusLabel: 'רשומים',
    dateLabel: 'יום ג׳, 21 במאי',
    timeLabel: '16:00–18:30',
    location: 'מרכז קהילתי שפיים',
    imageTone: 'photo',
    imageSrc: familiesImageAssets.photo.src,
    imageAlt: familiesImageAssets.photo.alt,
    registeredMembers: ['יונתן אלון', 'נועם אלון'],
    ctaPrimary: 'פרטי הרישום',
    ctaSecondary: 'שינוי משתתפים',
  },
  {
    id: 'prog-community',
    title: 'מפגש עם קהילת באר אורה',
    summary: 'מפגש קהילתי פתוח לשיתוף חוויות ותיאום צרכים משפחתיים.',
    filter: ['all', 'family'],
    kind: 'community',
    status: 'open',
    statusLabel: 'פתוח להרשמה',
    dateLabel: 'יום א׳, 26 במאי',
    timeLabel: '19:00',
    location: 'אולם קהילה · מרכז המנהלת',
    imageTone: 'community',
    imageSrc: familiesImageAssets.community.src,
    imageAlt: familiesImageAssets.community.alt,
    poll: true,
    ctaPrimary: 'מעוניינים',
    ctaSecondary: 'שוקלים',
  },
  {
    id: 'prog-respite',
    title: 'סוף שבוע הפוגה וטיול טבע',
    summary: 'הפוגה משפחתית קצרה עם ליווי — לינה, ארוחות ופעילות בטבע.',
    filter: ['all', 'family', 'registered'],
    kind: 'respite',
    status: 'pending',
    statusLabel: 'ממתין לאישור',
    dateLabel: 'ה׳–ש׳, 6–8 ביוני',
    location: 'גליל עליון',
    imageTone: 'bridge',
    imageSrc: familiesImageAssets.bridge.src,
    imageAlt: familiesImageAssets.bridge.alt,
    ctaPrimary: 'מעקב אחר הבקשה',
    ctaSecondary: 'פרטים',
  },
  {
    id: 'prog-sport',
    title: 'ערכת ספורט ופנאי לבית',
    summary: 'זכאות פעילה לערכת ציוד ספורט ביתי — בחירת כתובת למשלוח.',
    filter: ['all', 'benefits'],
    kind: 'benefit',
    status: 'eligible',
    statusLabel: 'זכאות פעילה',
    dateLabel: 'מימוש עד סוף יוני',
    location: 'משלוח לבית / מלון',
    imageTone: 'sport',
    imageSrc: familiesImageAssets.sport.src,
    imageAlt: familiesImageAssets.sport.alt,
    ctaPrimary: 'הזמנת ערכה ובחירת כתובת',
  },
  {
    id: 'prog-nature',
    title: 'סיור טבע למשפחות',
    summary: 'הליכה קלה בשמורה עם מדריך — מתאים גם לילדים.',
    filter: ['all', 'kids', 'family'],
    kind: 'event',
    status: 'new',
    statusLabel: 'אירוע חדש',
    dateLabel: 'יום ו׳, 17 במאי',
    timeLabel: '09:00–12:00',
    location: 'שמורת חוף השרון',
    imageTone: 'nature',
    imageSrc: familiesImageAssets.nature.src,
    imageAlt: familiesImageAssets.nature.alt,
    ctaPrimary: 'הרשמה חינם',
    ctaSecondary: 'פרטים',
  },
  {
    id: 'prog-pottery',
    title: 'סדנת קדרות משפחתית',
    summary: 'יצירה משותפת על אובניים — חוויה רגועה להורים וילדים.',
    filter: ['all', 'kids', 'family'],
    kind: 'event',
    status: 'open',
    statusLabel: 'מקומות פנויים',
    dateLabel: 'יום ד׳, 22 במאי',
    timeLabel: '16:30–18:00',
    location: 'מלון שפיים · חדר יצירה',
    imageTone: 'craft',
    imageSrc: familiesImageAssets.craft.src,
    imageAlt: familiesImageAssets.craft.alt,
    ctaPrimary: 'מעוניינים / פרטים',
    ctaSecondary: 'שמירת מקום',
  },
]

export const familiesProgramStats = {
  activeActivities: 2,
  activeBenefits: 1,
  newEvents: 1,
}

export const familiesFaq = [
  {
    id: 'faq-1',
    q: 'איך נרשמים לאירוע או תוכנית?',
    a: 'בחרו כרטיס אירוע, לחצו על הרשמה, ואשרו משתתפים מתוך בני המשפחה. המלווה יכול להשלים רישום גם בשמכם.',
  },
  {
    id: 'faq-2',
    q: 'מי זכאי להטבות?',
    a: 'זכאות נקבעת לפי תיק המשפחה במנהלת. סטטוס הזכאות מופיע על כל כרטיס הטבה.',
  },
  {
    id: 'faq-3',
    q: 'מה קורה אחרי הרשמה?',
    a: 'תקבלו אישור באזור האישי ובהודעה מהמלווה. ניתן לעדכן או לבטל עד המועד הנקוב בכרטיס.',
  },
]

export const familiesSyncBanner =
  'תיק המשפחה פעיל ומסונכרן עם צוות הליווי · עדכון אחרון הבוקר'
