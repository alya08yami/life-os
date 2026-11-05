import React from 'react';import {PlannerScreen} from '../src/planner/Screen';import {FrozenDesign} from '../src/design/scope';
// «Покупки и желания» keeps its current look under every theme (see design/scope.tsx).
export default function Wishlist(){return <FrozenDesign><PlannerScreen section="shopping"/></FrozenDesign>;}
