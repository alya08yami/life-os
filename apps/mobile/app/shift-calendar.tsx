import React,{useState} from 'react';
import {useLocalSearchParams} from 'expo-router';
import {useApp} from '../src/context';
import {ShiftCalendar} from '../src/planner/ShiftCalendar';
import {usePlanner} from '../src/planner/context';
import {calendarDefaults,upgradeDefaultShiftSchedule} from '@life-os/domain/shift-calendar';
import {useShiftPermission,previewShiftSound} from '../src/data/shift-notifications';
import {Frame,LoadingState} from '../src/planner/ui';

export default function ShiftCalendarRoute(){
 const {eventId,date}=useLocalSearchParams<{eventId?:string;date?:string}>();
 const {profileId}=useApp();
 const {state,update}=usePlanner();
 const [defaults]=useState(()=>calendarDefaults(profileId,Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'));
 const {warning,request}=useShiftPermission();
 if(!state)return <Frame title="Мой календарь"><LoadingState/></Frame>;
 return <ShiftCalendar key={eventId??(date?'day:'+date:'calendar')} data={upgradeDefaultShiftSchedule(state.shiftCalendar??defaults)} save={next=>update(current=>({...current,shiftCalendar:next}))}
  reminderWarning={warning} permission={request} preview={previewShiftSound}/>;
}
