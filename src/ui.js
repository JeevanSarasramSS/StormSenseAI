import React, { createContext, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export const T = {
  bg: '#0b1220', card: '#111c33', card2: '#0b1220', border: '#1e293b',
  text: '#ffffff', body: '#cbd5e1', sub: '#94a3b8', dim: '#64748b',
  accent: '#38bdf8', indigo: '#6366f1',
};

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export const tap = () => { try { Haptics.selectionAsync(); } catch (e) {} };

export const Card = ({ children, style }) => <View style={[u.card, style]}>{children}</View>;

export const H = ({ children, sub, right }) => (
  <View style={{ marginBottom: 12 }}>
    <View style={u.rowBetween}>
      <Text style={u.h}>{children}</Text>
      {right}
    </View>
    {sub ? <Text style={u.note}>{sub}</Text> : null}
  </View>
);

export const Chip = ({ label, active, onPress, color = T.indigo, small }) => (
  <TouchableOpacity
    onPress={() => { tap(); onPress && onPress(); }}
    style={[u.chip, small && { paddingHorizontal: 10, paddingVertical: 6 }, active && { backgroundColor: color, borderColor: color }]}
  >
    <Text style={[u.chipT, active && { color: '#fff' }]}>{label}</Text>
  </TouchableOpacity>
);

export const Pill = ({ level, big }) => {
  const { t } = useApp();
  return (
    <View style={[u.pill, { backgroundColor: level.color }, big && { paddingHorizontal: 14, paddingVertical: 6 }]}>
      <Text style={[u.pillT, big && { fontSize: 13 }]}>{t(`lvl.${level.key}`).toUpperCase()}</Text>
    </View>
  );
};

export const Stat = ({ k, v, color = T.text, center }) => (
  <View style={center && { alignItems: 'center' }}>
    <Text style={u.statK}>{k}</Text>
    <Text style={[u.statV, { color }]}>{v}</Text>
  </View>
);

export const Toggle = ({ on }) => (
  <View style={[u.toggle, on && { backgroundColor: '#22c55e' }]}>
    <View style={[u.knob, on && { alignSelf: 'flex-end' }]} />
  </View>
);

export function Stepper({ label, value, unit, onChange, step, min, max, fmt = (v) => v }) {
  const p = (value - min) / (max - min);
  const set = (v) => { tap(); onChange(Math.min(max, Math.max(min, +v.toFixed(2)))); };
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={u.rowBetween}>
        <Text style={u.label}>{label}</Text>
        <Text style={u.value}>{fmt(value)}{unit}</Text>
      </View>
      <View style={[u.row, { marginTop: 6 }]}>
        <TouchableOpacity style={u.btn} onPress={() => set(value - step)}><Text style={u.btnT}>−</Text></TouchableOpacity>
        <View style={u.track}>
          <LinearGradient colors={['#38bdf8', '#6366f1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[u.fill, { width: `${p * 100}%` }]} />
        </View>
        <TouchableOpacity style={u.btn} onPress={() => set(value + step)}><Text style={u.btnT}>+</Text></TouchableOpacity>
      </View>
    </View>
  );
}

export function GradientButton({ label, onPress, colors = ['#6366f1', '#38bdf8'], style }) {
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} activeOpacity={0.85} style={style}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={u.cta}>
        <Text style={u.ctaT}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// animated vertical bar
export function Bar({ label, val, max, color, sub, height = 150 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(a, { toValue: Math.min(1, val / max), useNativeDriver: false, friction: 7 }).start();
  }, [val, max]);
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[u.barVal, { color }]}>{val.toFixed(1)}</Text>
      <View style={[u.barBox, { height }]}>
        <Animated.View style={{ width: '100%', backgroundColor: color, borderRadius: 10, height: a.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </View>
      <Text style={u.barLbl}>{label}</Text>
      {sub ? <Text style={u.barSub}>{sub}</Text> : null}
    </View>
  );
}

// animated horizontal bar
export function HBar({ frac, color, height = 10 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: Math.max(0, Math.min(1, frac)), duration: 500, useNativeDriver: false }).start();
  }, [frac]);
  return (
    <View style={[u.hTrack, { height }]}>
      <Animated.View style={{ height: '100%', backgroundColor: color, borderRadius: height / 2, width: a.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

export const Footer = () => {
  const { t } = useApp();
  return <Text style={u.footer}>{t('footer')}</Text>;
};

export const u = StyleSheet.create({
  card: { backgroundColor: T.card, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: T.border },
  h: { color: T.text, fontSize: 17, fontWeight: '700' },
  note: { color: T.dim, fontSize: 12, marginTop: 3, lineHeight: 17 },
  label: { color: T.body, fontSize: 14 },
  value: { color: T.accent, fontSize: 15, fontWeight: '700' },
  body: { color: T.body, fontSize: 14, lineHeight: 20 },
  bold: { color: T.text, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', marginRight: 8, marginBottom: 8 },
  chipT: { color: T.sub, fontWeight: '700', fontSize: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillT: { color: '#0b1220', fontWeight: '800', fontSize: 11 },
  statK: { color: T.sub, fontSize: 11 },
  statV: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  toggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: '#334155', padding: 3, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  btn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  btnT: { color: '#fff', fontSize: 20, fontWeight: '700' },
  track: { flex: 1, height: 10, backgroundColor: '#1e293b', borderRadius: 5, marginHorizontal: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  cta: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaT: { color: '#fff', fontWeight: '800', fontSize: 16 },
  barBox: { width: 46, backgroundColor: '#1e293b', borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  barVal: { fontWeight: '800', marginBottom: 4 },
  barLbl: { color: '#e2e8f0', marginTop: 6, fontWeight: '600', fontSize: 13 },
  barSub: { color: T.dim, fontSize: 11 },
  hTrack: { flex: 1, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden' },
  inset: { backgroundColor: T.card2, borderRadius: 12, padding: 12 },
  footer: { color: '#475569', fontSize: 11, textAlign: 'center', marginTop: 4, marginBottom: 8, lineHeight: 16 },
  screenTitle: { color: T.text, fontSize: 26, fontWeight: '800' },
  kicker: { color: T.accent, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
});
