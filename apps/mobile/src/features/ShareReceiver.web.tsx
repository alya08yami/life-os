import React from 'react';import {Label} from '../ui';import {useApp} from '../context';
export function ShareReceiver(){const {t}=useApp();return <Label>{t('shareNativeBoundary')}</Label>;}
