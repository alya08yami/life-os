export const shiftTypes=['FIRST_SHIFT','SECOND_SHIFT','RECOVERY_DAY','DAY_OFF'] as const;
export type ShiftType=typeof shiftTypes[number];
export const shiftLabels=['Первая смена','Вторая смена','Отсыпной','Выходной'];
/** Shift accents: warm amber for the first (day) shift, calm blue for the second (night) one. */
export const shiftColors=['#D9AE76','#7986A8','#111a32','#111a32'];
export const sounds=['default','soft','short','bright','silent'] as const;
export type SoundId=typeof sounds[number];
type Audit={id:string;ownerId:string;createdAt:string;updatedAt:string};
export type ShiftSchedule=Audit&{
 anchorDate:string;anchorShiftType:ShiftType;
 firstShiftStart:string;firstShiftEnd:string;secondShiftStart:string;secondShiftEnd:string;
};
export type CalendarEvent=Audit&{
 title:string;date:string;time:string;reminderEnabled:boolean;reminderOffsetMinutes:number;
 soundId:SoundId;vibrationEnabled:boolean;notificationId:string;
};
export type CycleRange=Audit&{startDate:string;endDate:string};
export type MigraineIntensity=1|2|3|4;
export type MigraineEntry=Audit&{date:string;intensity?:MigraineIntensity};
export type PersonalEntry=Audit&{date:string};
export type CalendarPreferences={
 ownerId:string;cycleLength?:number;showPersonalMarkers:boolean;defaultReminderOffsetMinutes:number;
 defaultSoundId:SoundId;defaultVibrationEnabled:boolean;timezone:string;
};
export type ShiftCalendarData={
 schedule:ShiftSchedule;events:CalendarEvent[];cycles:CycleRange[];
 migraines:MigraineEntry[];personal:PersonalEntry[];preferences:CalendarPreferences;
};
const dayMs=86400000;
const ordinal=(day:string)=>Date.parse(day+'T00:00:00Z')/dayMs;
export function addDays(day:string,days:number){
 return new Date((ordinal(day)+days)*dayMs).toISOString().slice(0,10);
}
export function validDay(day:string){
 return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(ordinal(day))&&addDays(day,0)===day;
}
export const validTime=(time:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(time);
export function shiftIndex(schedule:ShiftSchedule,day:string){
 const index=ordinal(day)-ordinal(schedule.anchorDate)+shiftTypes.indexOf(schedule.anchorShiftType);
 return ((index%4)+4)%4;
}
export function monthCells(month:string){
 const first=month+'-01';
 const offset=(new Date(ordinal(first)*dayMs).getUTCDay()+6)%7;
 const [year,number]=month.split('-').map(Number);
 const count=new Date(Date.UTC(year,number,0)).getUTCDate();
 return Array.from({length:Math.ceil((count+offset)/7)*7},(_,index)=>addDays(first,index-offset));
}
export const periodDays=5;
export const cycleLength=(value?:number)=>value!==undefined&&Number.isInteger(value)&&value>=24&&value<=34?value:28;

export function periodHistory(ranges: readonly CycleRange[]){
 const sorted=[...ranges].sort((a,b)=>b.startDate.localeCompare(a.startDate));
 return sorted.map((range,index)=>({
  range,
  periodLength:ordinal(range.endDate)-ordinal(range.startDate)+1,
  cycleLength:index>0?ordinal(sorted[index-1].startDate)-ordinal(range.startDate):undefined,
 }));
}

export function cycleForecast(data:ShiftCalendarData,date:string){
 const start=data.cycles.reduce((latest,range)=>range.startDate<=date&&range.startDate>latest?range.startDate:latest,'');
 if(!start)return undefined;
 const length=cycleLength(data.preferences.cycleLength);
 const elapsed=ordinal(date)-ordinal(start);
 const dayIndex=elapsed%length;
 if(elapsed>=length&&dayIndex<periodDays)return 'period';
 const ovulation=length-14;
 if(dayIndex===ovulation)return 'ovulation';
 if(dayIndex>=ovulation-5&&dayIndex<=ovulation+1)return 'fertile';
 return undefined;
}

export function upgradeDefaultShiftSchedule(data:ShiftCalendarData):ShiftCalendarData{
 const {schedule}=data;
 if(schedule.anchorDate!=='2026-10-01'||schedule.anchorShiftType!=='FIRST_SHIFT'||schedule.createdAt!==schedule.updatedAt)return data;
 return {...data,schedule:{...schedule,anchorDate:'2026-11-04',anchorShiftType:'SECOND_SHIFT'}};
}
export function calendarDay(data:ShiftCalendarData,date:string,today:string,selected:string){
 const shift=shiftIndex(data.schedule,date);
 const events=data.events.filter(event=>event.date===date).sort((a,b)=>a.time.localeCompare(b.time)||a.createdAt.localeCompare(b.createdAt));
 const migraine=data.migraines.some(item=>item.date===date);
 const personal=data.personal.some(item=>item.date===date);
 const cycle=data.cycles.find(item=>item.startDate<=date&&date<=item.endDate);
 const markers:Array<'migraine'|'personal'|'event'>=[];
 if(migraine)markers.push('migraine');
 if(personal&&data.preferences.showPersonalMarkers)markers.push('personal');
 if(events.length)markers.push('event');
 return {shift,color:shiftColors[shift],events,migraine,personal,cycle,forecast:cycle?undefined:cycleForecast(data,date),markers,eventLine:events.length>0,today:today===date,selected:selected===date};
}
export function workingHours(schedule:ShiftSchedule,shift:number){
 if(shift===0)return schedule.firstShiftStart+'–'+schedule.firstShiftEnd;
 if(shift===1)return schedule.secondShiftStart+'–'+schedule.secondShiftEnd;
 return '';
}
export function calendarDefaults(ownerId:string,timezone:string):ShiftCalendarData{
 const at=new Date().toISOString();
 return {
  schedule:{id:'shift-schedule',ownerId,createdAt:at,updatedAt:at,anchorDate:'2026-11-04',anchorShiftType:'SECOND_SHIFT',firstShiftStart:'08:00',firstShiftEnd:'20:00',secondShiftStart:'20:00',secondShiftEnd:'08:00'},
  events:[],cycles:[],migraines:[],personal:[],
  preferences:{ownerId,timezone,cycleLength:28,showPersonalMarkers:true,defaultReminderOffsetMinutes:30,defaultSoundId:'default',defaultVibrationEnabled:true},
 };
}
/** Splits a saved range when just one day is cleared. */
export function removeCycleDay(ranges:CycleRange[],day:string,newId:string,at:string){
 return ranges.flatMap(range=>{
  if(day<range.startDate||day>range.endDate)return [range];
  const pieces:CycleRange[]=[];
  if(range.startDate<day)pieces.push({...range,endDate:addDays(day,-1),updatedAt:at});
  if(day<range.endDate)pieces.push({...range,id:pieces.length?newId:range.id,startDate:addDays(day,1),updatedAt:at});
  return pieces;
 });
}
export type ReminderPlan={id:string;eventId:string;title:string;body:string;at:number;sound:SoundId;vibration:boolean;version:string};
function eventInstant(day:string,time:string,zone:string){
 const wall=Date.parse(day+'T'+time+':00Z');
 const format=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 const local=(instant:number)=>{
  const parts=Object.fromEntries(format.formatToParts(instant).map(part=>[part.type,part.value]));
  return Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
 };
 const approximate=wall-(local(wall)-wall);
 return approximate-(local(approximate)-wall);
}
export function reminderPlan(data:ShiftCalendarData,now=Date.now()):ReminderPlan[]{
 return data.events.flatMap(event=>{
  if(!event.reminderEnabled)return [];
  const at=eventInstant(event.date,event.time,data.preferences.timezone)-event.reminderOffsetMinutes*60000;
  if(!Number.isFinite(at)||at<=now)return [];
  const id=event.notificationId;
  const body=event.date.split('-').reverse().join('.')+' в '+event.time;
  const version=JSON.stringify([at,event.title,body,event.soundId,event.vibrationEnabled]);
  return [{id,eventId:event.id,title:event.title,body,at,sound:event.soundId,vibration:event.vibrationEnabled,version}];
 }).sort((a,b)=>a.at-b.at);
}
export function reconcileReminders(plan:ReminderPlan[],scheduled:{id:string;version:unknown}[]){
 return {
  cancel:scheduled.filter(old=>!plan.some(next=>next.id===old.id&&next.version===old.version)).map(old=>old.id),
  schedule:plan.filter(next=>!scheduled.some(old=>old.id===next.id&&old.version===next.version)),
 };
}
