import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCtx, tap, u, T } from './src/ui';
import { assess, PPT_DEFAULTS } from './src/model';
import { makeT, LANGS } from './src/i18n';
import Home from './src/screens/Home';
import Simulate from './src/screens/Simulate';
import MapScreen from './src/screens/MapScreen';
import Compare from './src/screens/Compare';
import Solutions from './src/screens/Solutions';
import Report from './src/screens/Report';
import Intro from './src/Intro';

const TABS = [
  { key: 'home', icon: '🏠', Comp: Home },
  { key: 'sim', icon: '🌧️', Comp: Simulate },
  { key: 'map', icon: '🗺️', Comp: MapScreen },
  { key: 'compare', icon: '📊', Comp: Compare },
  { key: 'sol', icon: '🌱', Comp: Solutions },
  { key: 'report', icon: '📄', Comp: Report },
];

function Shell() {
  const insets = useSafeAreaInsets();
  const [tab, setTabState] = useState('home');
  const [intro, setIntro] = useState(true);
  const [lang, setLang] = useState('en');
  const [liveCity, setLiveCity] = useState(null);
  const [state, setState] = useState({
    ...PPT_DEFAULTS,
    scen: 'proposed',
    mit: { pave: false, garden: false, green: false },
  });
  const scrollRef = useRef(null);
  const fade = useRef(new Animated.Value(1)).current;

  const set = useCallback((patch) => setState((s) => ({ ...s, ...patch })), []);
  const a = useMemo(() => assess(state), [state]);
  const t = useMemo(() => makeT(lang), [lang]);
  const tabRef = useRef('home');
  const setTab = useCallback((k) => {
    if (k === tabRef.current) return;
    tabRef.current = k;
    fade.setValue(0);
    if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: false });
    setTabState(k);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, []);
  const cycleLang = () => {
    tap();
    const i = LANGS.findIndex((l) => l.key === lang);
    setLang(LANGS[(i + 1) % LANGS.length].key);
  };

  const ctx = useMemo(() => ({ state, set, a, tab, setTab, t, lang, setLang, liveCity, setLiveCity }), [state, a, tab, t, lang, liveCity]);
  const current = TABS.find((x) => x.key === tab);
  const Comp = current.Comp;
  const langShort = LANGS.find((l) => l.key === lang).short;

  return (
    <AppCtx.Provider value={ctx}>
      <LinearGradient colors={['#0b1220', '#0f1d3a', '#0b1220']} style={{ flex: 1 }}>
        <StatusBar style="light" />
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={u.kicker}>STORMSENSE AI · EIA</Text>
            <Text style={u.screenTitle} numberOfLines={1} adjustsFontSizeToFit>{t(`title.${tab}`)}</Text>
          </View>
          <TouchableOpacity onPress={cycleLang} style={s.langBtn} activeOpacity={0.8}>
            <Text style={s.langIcon}>🌐</Text>
            <Text style={s.langT}>{langShort}</Text>
          </TouchableOpacity>
          <View style={[s.levelDot, { backgroundColor: a.level.color }]}>
            <Text style={{ fontSize: 20 }}>🌧️</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
            <Comp />
          </Animated.View>
        </ScrollView>

        <View style={[s.tabbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TABS.map((x) => {
            const on = x.key === tab;
            return (
              <TouchableOpacity key={x.key} style={s.tab} onPress={() => { tap(); setTab(x.key); }} activeOpacity={0.7}>
                <View style={[s.iconWrap, on && s.iconOn]}>
                  <Text style={{ fontSize: 18 }}>{x.icon}</Text>
                </View>
                <Text style={[s.tabT, on && { color: '#fff' }]} numberOfLines={1}>{t(`tab.${x.key}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {intro && <Intro onDone={() => setIntro(false)} />}
      </LinearGradient>
    </AppCtx.Provider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 6 },
  langBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7, marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  langIcon: { fontSize: 13, marginRight: 4 },
  langT: { color: '#fff', fontWeight: '800', fontSize: 13 },
  levelDot: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0b1220' },
  tabbar: { flexDirection: 'row', backgroundColor: '#0a1020', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingHorizontal: 1 },
  iconWrap: { width: 42, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconOn: { backgroundColor: '#6366f1' },
  tabT: { color: T.dim, fontSize: 10, fontWeight: '700', marginTop: 2 },
});
