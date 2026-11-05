import {AccountData} from '../src/features/AccountData';
import React from 'react';import {AppShell} from '../src/components/AppShell';import {AccountForm} from '../src/features/AccountForm';import {useApp} from '../src/context';
export default function Account(){const {t}=useApp();return <AppShell title={t('account')}><AccountForm/><AccountData/></AppShell>;}
