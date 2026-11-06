import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {router} from 'expo-router';
import {Icon, type IconName} from '../src/components/Icon';
import {useApp} from '../src/context';
import {themeOptions} from '../src/design/themes';
import {fontOptions,ensureFont,isFontId,fontPreview,FONT_PREFERENCE} from '../src/design/fonts';
import {usePlanner} from '../src/planner/context';
import {sections} from '../src/planner/seed';
import {Frame, T, usePlannerColors} from '../src/planner/ui';

function SettingsRow({label, icon, value, expanded, onPress}: {
  label: string;
  icon: IconName;
  value?: string;
  expanded?: boolean;
  onPress: () => void;
}) {
  const C = usePlannerColors();
  return <Pressable accessibilityRole="button" accessibilityState={{expanded}}
    onPress={onPress} style={({pressed}) => [styles.row, {opacity: pressed ? 0.7 : 1}]}>
    <View style={[styles.badge, {backgroundColor: C.lavender}]}>
      <Icon name={icon} size={18} color={C.purple}/>
    </View>
    <View style={styles.copy}>
      <T bold>{label}</T>
      {value && <T size={12} muted>{value}</T>}
    </View>
    <View style={{transform: [{rotate: expanded ? '90deg' : '0deg'}]}}>
      <Icon name="next" size={16} color={C.muted}/>
    </View>
  </Pressable>;
}

export default function Settings() {
  const [themesOpen, setThemesOpen] = useState(false);
  const [fontsOpen, setFontsOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const C = usePlannerColors();
  const {state, update} = usePlanner();
  const {state: app, repo, run, busy} = useApp();
  const currentTheme = app.settings.theme;
  const storedFont = app.uiPreferences?.[FONT_PREFERENCE];
  const currentFont = isFontId(storedFont) ? storedFont : 'inter';
  const visibleCount = sections.filter(section => state?.notificationSettings['visible.' + section.id] !== false).length;
  const card = [styles.card, {backgroundColor: C.paper, borderColor: C.line}];
  const divider = [styles.divider, {backgroundColor: C.line}];

  return <Frame title="Настройки">
    <T size={12} muted bold>Приложение</T>
    <View style={card}>
      <SettingsRow label="Тема оформления" icon="brush" expanded={themesOpen}
        value={themeOptions.find(option => option.id === currentTheme)?.label}
        onPress={() => setThemesOpen(open => !open)}/>
      {themesOpen && <View accessibilityRole="radiogroup" accessibilityLabel="Тема оформления"
        style={[styles.options, {borderTopColor: C.line}]}>
        {themeOptions.map(({id, label}) => {
          const checked = currentTheme === id;
          return <Pressable key={id} accessibilityRole="radio" accessibilityState={{checked, disabled: busy}}
            disabled={busy} style={[styles.option, {backgroundColor: checked ? C.lavender : 'transparent'}]}
            onPress={() => {
              if (checked) {
                setThemesOpen(false);
                return;
              }
              void run(() => repo.configure({theme: id})).then(() => setThemesOpen(false)).catch(() => {});
            }}>
            <T style={styles.copy} bold={checked}>{label}</T>
            {checked && <Icon name="check" color={C.purple} size={18}/>}
          </Pressable>;
        })}
      </View>}
      <View style={divider}/>
      <SettingsRow label="Шрифт приложения" icon="edit" expanded={fontsOpen}
        value={fontOptions.find(option => option.id === currentFont)?.label}
        onPress={() => {fontOptions.forEach(option => {void ensureFont(option.id);}); setFontsOpen(open => !open);}}/>
      {fontsOpen && <View accessibilityRole="radiogroup" accessibilityLabel="Шрифт приложения"
        style={[styles.options, {borderTopColor: C.line}]}>
        {fontOptions.map(option => {
          const checked = currentFont === option.id;
          return <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{checked, disabled: busy}} aria-checked={checked}
            disabled={busy} style={[styles.option, {backgroundColor: checked ? C.lavender : 'transparent', paddingVertical: 10}]}
            onPress={() => {
              if (checked) {setFontsOpen(false); return;}
              void run(() => repo.preference(FONT_PREFERENCE, option.id)).catch(() => {});
            }}>
            <View style={[styles.copy, {gap: 3}]}>
              <Text style={{fontFamily: option.family, fontSize: 15, fontWeight: checked ? '600' : '400', color: C.ink}}>{option.label}</Text>
              <Text style={{fontFamily: option.family, fontSize: 13, color: C.muted}} numberOfLines={1}>{fontPreview}</Text>
            </View>
            {checked && <Icon name="check" color={C.purple} size={18}/>}
          </Pressable>;
        })}
      </View>}
      <View style={divider}/>
      <SettingsRow label="Уведомления" icon="bell" onPress={() => router.push('/notifications')}/>
      <View style={divider}/>
      <SettingsRow label="Резервная копия" icon="package" onPress={() => router.push('/backup')}/>
    </View>

    <T size={12} muted bold>Главный экран</T>
    <View style={card}>
      <SettingsRow label="Разделы на главной" icon="grid" value={`Показано ${visibleCount} из ${sections.length}`}
        expanded={sectionsOpen} onPress={() => setSectionsOpen(open => !open)}/>
      {sectionsOpen && <View style={[styles.options, {borderTopColor: C.line}]}>
        {sections.map(section => {
          const key = 'visible.' + section.id;
          const checked = state?.notificationSettings[key] !== false;
          return <Pressable key={section.id} accessibilityRole="checkbox" accessibilityState={{checked}}
            style={styles.option} onPress={() => {
              void update(previous => ({
                ...previous,
                notificationSettings: {...previous.notificationSettings, [key]: previous.notificationSettings[key] === false},
              })).catch(() => {});
            }}>
            <T style={styles.copy}>{section.title.replace('\n', ' ')}</T>
            <Icon name={checked ? 'check' : 'plus'} size={18} color={checked ? C.purple : C.muted}/>
          </Pressable>;
        })}
        <T muted size={12} style={styles.help}>Скрытые разделы доступны через поиск и меню добавления.</T>
      </View>}
    </View>
  </Frame>;
}

const styles = StyleSheet.create({
  card: {borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, overflow: 'hidden'},
  row: {minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10},
  badge: {width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center'},
  copy: {flex: 1, minWidth: 0},
  divider: {height: StyleSheet.hairlineWidth, marginLeft: 60, marginRight: 14},
  options: {borderTopWidth: StyleSheet.hairlineWidth, padding: 8, gap: 2},
  option: {minHeight: 44, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10},
  help: {paddingHorizontal: 12, paddingVertical: 8},
});
