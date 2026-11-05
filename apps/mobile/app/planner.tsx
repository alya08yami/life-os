import React from 'react';import {useLocalSearchParams} from 'expo-router';import {PlannerScreen} from '../src/planner/Screen';import {FrozenDesign} from '../src/design/scope';
// Adding or editing items of «Покупки и желания» stays in its current look (frozen); every other section follows the theme.
export default function Planner(){const {section}=useLocalSearchParams<{section?:string}>();const screen=<PlannerScreen/>;return section==='shopping'?<FrozenDesign>{screen}</FrozenDesign>:screen;}
