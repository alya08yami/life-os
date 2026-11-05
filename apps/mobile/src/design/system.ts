/**
 * LIFE OS design system — single source of tokens for
 * Soft Future (look) · Soft Glass (surfaces) · Depth & Layers (elevation) · Soft Motion (timing) · Gesture Navigation (thresholds).
 *
 * Stage 1: tokens only. Nothing imports this file yet, so the current screens look exactly as before.
 * Later stages read these values instead of hard-coded numbers and colours.
 * Values are starting points from the brief and will be tuned against approved references.
 */
import type {ViewStyle} from 'react-native';

/* ───────────── Soft Future · colours ───────────── */
export const palette={
 graphite:'#35343D',
 slate:'#45424C',
 mauve:'#605761',
 dustyRose:'#A58494',
 softRose:'#C4A9B5',
 milk:'#F4F0F2',
 ink:'#29262D',
 inkMuted:'#6E6670',
 onDark:'#F4F0F2',
 onDarkMuted:'rgba(244,240,242,0.68)',
 danger:'#B5485F',
 positive:'#4E8A78',
 warning:'#B98A3E',
} as const;

/** One vertical background gradient for the whole app — never one per card. */
export const gradients={
 background:[palette.graphite,palette.slate,palette.mauve,palette.dustyRose,palette.softRose],
 backgroundStops:[0,0.28,0.55,0.82,1],
} as const;

/* ───────────── Soft Glass · surfaces ───────────── */
export type SurfaceLevel='background'|'glass'|'content'|'elevated';
export const surfaces:Record<Exclude<SurfaceLevel,'background'>,{fill:string;border:string;text:string;muted:string;blur:number}>={
 /** Category cards, calendar, small info panels — light transparency, thin outline. */
 glass:{fill:'rgba(244,240,242,0.14)',border:'rgba(255,255,255,0.22)',text:palette.onDark,muted:palette.onDarkMuted,blur:0},
 /** Lists, medication cards, text — dense, readable. */
 content:{fill:'rgba(244,240,242,0.92)',border:'rgba(255,255,255,0.6)',text:palette.ink,muted:palette.inkMuted,blur:0},
 /** Sheets, menus, modals — denser glass, local blur only here. */
 elevated:{fill:'rgba(250,247,248,0.94)',border:'rgba(255,255,255,0.75)',text:palette.ink,muted:palette.inkMuted,blur:18},
};
export const opacity={pressed:0.92,disabled:0.45,scrim:0.28,hint:0.6} as const;
/** Blur is used sparingly: only elevated panels and the bottom bar. */
export const blur={none:0,bar:14,elevated:18} as const;
export const borders={hairline:0.5,thin:1} as const;

/* ───────────── Geometry ───────────── */
export const radii={chip:10,control:14,row:16,card:20,sheet:28,round:999} as const;
export const spacing={xxs:2,xs:4,sm:8,md:12,lg:16,xl:20,xxl:28,section:36} as const;
export const touch={min:44} as const;

/* ───────────── Typography (keeps the existing Inter / Cormorant fonts) ───────────── */
export const typography={
 family:{body:'Inter',light:'Inter',display:'CormorantGaramond'},
 display:{size:30,weight:'300' as const,letterSpacing:-0.4},
 title:{size:21,weight:'500' as const,letterSpacing:-0.2},
 section:{size:16,weight:'500' as const,letterSpacing:0},
 body:{size:14,weight:'400' as const,letterSpacing:0},
 caption:{size:12,weight:'400' as const,letterSpacing:0.1},
 micro:{size:10.5,weight:'500' as const,letterSpacing:0.3},
} as const;

/* ───────────── Depth & Layers ───────────── */
export type Elevation=0|1|2|3|4;
/** 0 background · 1 surfaces · 2 interactive cards/rows · 3 sheets & menus · 4 modals. Soft, wide, low-contrast. */
const shadowTint='#1E1A22';
export const shadows:Record<Elevation,ViewStyle>={
 0:{},
 1:{shadowColor:shadowTint,shadowOpacity:0.06,shadowRadius:10,shadowOffset:{width:0,height:3},elevation:1},
 2:{shadowColor:shadowTint,shadowOpacity:0.09,shadowRadius:16,shadowOffset:{width:0,height:6},elevation:3},
 3:{shadowColor:shadowTint,shadowOpacity:0.14,shadowRadius:28,shadowOffset:{width:0,height:12},elevation:8},
 4:{shadowColor:shadowTint,shadowOpacity:0.18,shadowRadius:40,shadowOffset:{width:0,height:18},elevation:12},
};
export const zIndex={base:0,raised:2,bar:10,sheet:20,menu:30,modal:40,toast:50} as const;

/* ───────────── Soft Motion ───────────── */
/** Milliseconds, taken from the middle of the brief's ranges. */
export const motion={
 press:130,
 tab:220,
 menu:220,
 drawer:260,
 cardExpand:360,
 screen:420,
 listReflow:280,
 stagger:24,
} as const;
/** Cubic-bezier control points (usable with Animated.Easing.bezier and CSS). */
export const easing={
 standard:[0.2,0,0,1],
 enter:[0.05,0.7,0.1,1],
 exit:[0.3,0,0.8,0.15],
} as const;
/** Gentle springs — small damping ratio, no visible bounce. */
export const spring={
 soft:{tension:170,friction:24},
 snappy:{tension:260,friction:28},
 sheet:{tension:200,friction:30},
} as const;
/** Press / lift feedback scales (subtle). */
export const depthMotion={pressScale:0.975,liftScale:1.02,backdropScale:0.97} as const;

/* ───────────── Gesture Navigation ───────────── */
export const gestures={
 /** Movement before a horizontal gesture is recognised (protects vertical scroll). */
 slop:12,
 /** |dx| must exceed |dy| × ratio to count as horizontal. */
 horizontalRatio:1.6,
 /** Fraction of row width needed to commit a swipe action. */
 rowCommit:0.32,
 /** Fling velocity (px/ms) that commits even below the distance threshold. */
 flingVelocity:0.6,
 /** Distance to dismiss a bottom sheet by dragging down. */
 sheetDismiss:110,
 longPress:380,
 /** Keep clear of the OS back-swipe area at the screen edges. */
 edgeGuard:24,
} as const;

/** Duration to use when the user prefers reduced motion: instant state changes, no travel. */
export const reducedDuration=(ms:number,reduced:boolean)=>reduced?0:ms;
