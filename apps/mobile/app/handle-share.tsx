import React from 'react';import {AppShell} from '../src/components/AppShell';import {ShareReceiver} from '../src/features/ShareReceiver';import {useApp} from '../src/context';
export default function HandleShare(){const {t}=useApp();return <AppShell title={t('incoming')}><ShareReceiver/></AppShell>;}
