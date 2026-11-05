export const colors={
 light:{bg:'#F6F5F3',card:'rgba(247,245,242,0.82)',text:'#0B142B',muted:'#706E78',line:'rgba(134,123,173,0.20)',accent:'#E8E6FA',soft:'rgba(255,255,255,0.60)',white:'rgba(255,255,255,0.62)',danger:'#B54365',onAccent:'#171B79',positive:'#247D79'},
 minimal:{bg:'#f0dce3',card:'#ffffff',text:'#101014',muted:'#655e69',line:'#c4bac3',accent:'#ffffff',soft:'#ffffff',white:'#ffffff',danger:'#a73255',onAccent:'#151219',positive:'#247d79'},
 mist:{bg:'#ededff',card:'#ffffff',text:'#26275f',muted:'#605f85',line:'#deddf1',accent:'#dedfff',soft:'#f1efff',white:'#ffffff',danger:'#a73868',onAccent:'#343680',positive:'#247d79'},
 warm:{bg:'#f6f2ed',card:'#fcfaf7',text:'#242120',muted:'#756454',line:'#e5ddd4',accent:'#e5ddec',soft:'#f2eee9',white:'#fffdf9',danger:'#a4435b',onAccent:'#51405f',positive:'#427666'},
 // Soft Future: light content palette for regular screens; the home screen draws on the graphite → rose gradient (design/system.ts).
 soft:{bg:'#efe7eb',card:'rgba(250,247,248,0.92)',text:'#29262D',muted:'#6E6670',line:'rgba(41,38,45,0.12)',accent:'#e6dae1',soft:'#f6f1f4',white:'#ffffff',danger:'#B5485F',onAccent:'#4a3f48',positive:'#4E8A78'},
 dark:{bg:'#1B2037',card:'rgba(66,62,100,0.72)',text:'#F8F6FF',muted:'#C4BEDA',line:'rgba(199,186,240,0.22)',accent:'#A991FF',soft:'rgba(116,105,164,0.24)',white:'rgba(44,44,75,0.76)',danger:'#F5A4BC',onAccent:'#211B38',positive:'#8CDED3'}
} as const;
export const tokens={colors,font:{heading:'Inter',body:'Inter'},type:{page:30,section:24,card:15,body:14,control:13,caption:12},space:{xs:4,sm:8,md:12,lg:16,xl:24,xxl:32},radius:{control:22,card:26,sheet:32},icon:{small:18,medium:22},layout:{catalogMax:680,gutter:20,gap:12,touch:44}} as const;
