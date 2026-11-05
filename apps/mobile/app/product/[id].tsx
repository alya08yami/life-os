import React from 'react';import {ProductDetailScreen} from '../../src/features/wishlist/ProductDetailScreen';import {FrozenDesign} from '../../src/design/scope';
// Part of «Покупки и желания»: frozen, keeps its current look under every theme.
export default function Product(){return <FrozenDesign><ProductDetailScreen/></FrozenDesign>;}
