export const themeOptions=[
 {id:'light',label:'Светлая'},
 {id:'dark',label:'Тёмная'},
 {id:'minimal',label:'Минимал-типографика · Inter'},
 {id:'mist',label:'Сиреневый туман'},
 {id:'warm',label:'Тёплый минимализм'},
 {id:'soft',label:'Soft Future'},
] as const;

export const warmSurfaces={tile:'#f2eee9',icon:'#796653',panel:'#fcfaf7',selection:'#a393b5'};

export const calendarPeriodFill='#f6d0de';
export const mistCalendar={period:'#e8b7e7',event:'#6b70cf'};

export const minimalSurfaces={
 navigation:'#dce1ea',
 habit:'rgba(255,255,255,0.54)',
 calendarCard:'rgba(255,255,255,0.48)',
 event:'#aaa6af',
 today:'#aaa6af',
};

/** Soft Future on the home screen: glass on the graphite → rose gradient (values from design/system.ts). */
import {palette as softPalette,surfaces as softSurfacesBase} from './system';
export const softHome={
 text:softPalette.onDark,
 muted:softPalette.onDarkMuted,
 glass:softSurfacesBase.glass.fill,
 glassBorder:softSurfacesBase.glass.border,
 glassPressed:'rgba(244,240,242,0.2)',
 /** Event days must stand out: a dense milk cell with dark text. */
 event:softPalette.milk,
 eventInk:softPalette.ink,
 period:'rgba(196,169,181,0.5)',
 fertile:'rgba(244,240,242,0.08)',
 ovulation:'rgba(244,240,242,0.22)',
 navBar:'rgba(43,41,49,0.78)',
 navLine:'rgba(255,255,255,0.12)',
 navIndicator:'rgba(244,240,242,0.14)',
 plus:softPalette.milk,
 plusInk:softPalette.ink,
};
