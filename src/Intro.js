import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tap, useApp } from './ui';
import { LANGS } from './i18n';

export default function Intro({ onDone }) {
  const { t, lang, setLang } = useApp();
  const logo = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const btn = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(text, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(btn, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(Animated.timing(ripple, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);

  const go = () => {
    tap();
    Animated.timing(out, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => onDone());
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: out, zIndex: 10 }]}>
      <LinearGradient colors={['#0b1220', '#1e1b4b', '#0e7490']} style={s.wrap}>
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 170 }}>
          <Animated.View style={[s.ripple, { opacity: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }), transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }] }]} />
          <Animated.View style={[s.logo, { transform: [{ scale: logo }] }]}>
            <Text style={{ fontSize: 56 }}>🌧️</Text>
          </Animated.View>
        </View>
        <Animated.View style={{ opacity: text, transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], alignItems: 'center' }}>
          <Text style={s.title}>StormSense AI</Text>
          <Text style={s.sub}>{t('intro.sub')}</Text>
          <Text style={s.tag}>{t('intro.tag')}</Text>
          <View style={s.badges}>
            {[['🌧️', 'f.rain'], ['💧', 'f.soil'], ['🏗️', 'f.concrete']].map(([i, k]) => (
              <View key={k} style={s.badge}><Text style={s.badgeT}>{i} {t(k)}</Text></View>
            ))}
          </View>
        </Animated.View>
        <Animated.View style={{ opacity: btn, width: '100%', alignItems: 'center' }}>
          <Text style={s.langLbl}>{t('intro.lang')}</Text>
          <View style={s.langRow}>
            {LANGS.map((l) => (
              <TouchableOpacity key={l.key} onPress={() => { tap(); setLang(l.key); }} style={[s.lang, lang === l.key && s.langOn]}>
                <Text style={[s.langT, lang === l.key && { color: '#0b1220' }]}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={go} activeOpacity={0.85} style={{ width: '80%' }}>
            <LinearGradient colors={['#f97316', '#ef4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
              <Text style={s.btnT}>{t('intro.start')}  →</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.foot}>21CEO306T · Environment Impact Assessment · Batch 5</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  ripple: { position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: '#38bdf8' },
  logo: { width: 130, height: 130, borderRadius: 65, backgroundColor: '#1e3a8a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#38bdf8' },
  title: { color: '#fff', fontSize: 38, fontWeight: '900', marginTop: 10, letterSpacing: 0.5 },
  sub: { color: '#7dd3fc', fontSize: 14, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  tag: { color: '#cbd5e1', fontSize: 15, textAlign: 'center', marginTop: 14, lineHeight: 22, paddingHorizontal: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 18, marginBottom: 22 },
  badge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, margin: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  badgeT: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },
  langLbl: { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
  langRow: { flexDirection: 'row', marginBottom: 18 },
  lang: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', marginHorizontal: 4 },
  langOn: { backgroundColor: '#fff', borderColor: '#fff' },
  langT: { color: '#e2e8f0', fontWeight: '700', fontSize: 13 },
  btn: { borderRadius: 18, paddingVertical: 17, alignItems: 'center' },
  btnT: { color: '#fff', fontWeight: '800', fontSize: 17 },
  foot: { color: '#64748b', fontSize: 11, marginTop: 16 },
});
