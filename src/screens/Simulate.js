import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Animated, useWindowDimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, H, Chip, Pill, Stat, Stepper, GradientButton, HBar, Footer, u, T, tap, useApp } from '../ui';
import CityScene from '../CityScene';
import StormReplay from '../StormReplay';
import LiveWeather from '../LiveWeather';
import { RainfallChart } from '../charts';
import {
  SCENARIOS, RAIN_PRESETS, SOIL_PRESETS, DURATIONS, STEPS, MONTHLY_RAIN, HEAVY_DAYS, IMPERV_MEAN,
  r1, pct, fmtInt, zoneStats,
} from '../model';

const SOIL_KEYS = ['dry', 'normal', 'wet'];

export const durLabel = (t, d) => (d < 1 ? t('dur.30') : d === 1 ? t('dur.1') : t('dur.n', { n: d }));

function stepDetails(t, st, a) {
  const zs = zoneStats('proposed', st);
  return [
    t('an.d1', { e: Math.round(IMPERV_MEAN.existing * 100), p: Math.round(IMPERV_MEAN.proposed * 100) }),
    t('an.d2'),
    t('an.d3'),
    t('an.d4', { h: HEAVY_DAYS.reduce((x, y) => x + y, 0), m: Math.round(st.moist * 100), r: st.rain }),
    `R = C × I = ${a.cur.toFixed(2)} × ${st.rain} = ${r1(a.depth)} mm/h`,
    t('an.d6', { h: zs.HIGH, m: zs.MEDIUM, l: zs.LOW }),
    t('an.d7', { a: pct(a.P, a.E), b: Math.round(((a.P - a.M) / a.P) * 100) }),
    t('an.d8'),
  ];
}

function AnalysisModal({ visible, onClose, onMap }) {
  const { state, a, t } = useApp();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const prog = useRef(new Animated.Value(0)).current;
  const details = stepDetails(t, state, a);
  const names = t('steps');

  useEffect(() => {
    if (!visible) return;
    setI(0);
    prog.setValue(0);
    let k = 0;
    const timer = setInterval(() => {
      k += 1;
      setI(k);
      tap();
      Animated.timing(prog, { toValue: k / 8, duration: 400, useNativeDriver: false }).start();
      if (k >= 8) clearInterval(timer);
    }, 750);
    return () => clearInterval(timer);
  }, [visible]);

  const done = i >= 8;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalBg}>
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.grab} />
          <Text style={u.kicker}>{t('an.kicker')}</Text>
          <Text style={[u.h, { fontSize: 20, marginTop: 4 }]}>{done ? t('an.done') : t('an.running', { i: i + 1 })}</Text>
          <View style={s.progTrack}>
            <Animated.View style={[s.progFill, { width: prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
          </View>
          <ScrollView style={{ maxHeight: 420 }}>
            {STEPS.map((st, k) => {
              const isDone = k < i, cur = k === i && !done;
              return (
                <View key={k} style={[s.step, cur && { borderColor: '#facc15' }, isDone && { borderColor: '#14532d' }]}>
                  <View style={[s.stepNum, isDone && { backgroundColor: '#22c55e' }, cur && { backgroundColor: '#facc15' }]}>
                    <Text style={s.stepNumT}>{isDone ? '✓' : k + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.stepT, { opacity: isDone || cur ? 1 : 0.45 }]}>{st.icon}  {names[k]}</Text>
                    {isDone && <Text style={s.stepD}>{details[k]}</Text>}
                    {cur && <Text style={[s.stepD, { color: '#facc15' }]}>{t('an.processing')}</Text>}
                  </View>
                </View>
              );
            })}
          </ScrollView>
          {done && (
            <View style={[u.row, { marginTop: 12 }]}>
              <TouchableOpacity style={[s.sBtn, { flex: 1, marginRight: 8 }]} onPress={onClose}><Text style={s.sBtnT}>{t('an.see')}</Text></TouchableOpacity>
              <GradientButton label={`${t('an.map')} →`} onPress={onMap} style={{ flex: 1.3 }} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function Simulate() {
  const { state, set, a, setTab, t } = useApp();
  const { width } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(10);
  const runPct = Math.round(a.cur * 100);
  const months = t('months');

  return (
    <>
      <CityScene width={width - 32} scen={state.scen} rain={state.rain} depth={a.depth} runPct={runPct} mit={state.scen === 'proposed' ? state.mit : {}} />

      <LinearGradient colors={[a.level.color + '55', '#111c33']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={u.rowBetween}>
          <Text style={s.heroLbl}>{t('sim.est')} · {t(`scen.${state.scen}`)}{a.mitigated ? ` ${t('sim.plusSol')}` : ''}</Text>
          <Pill level={a.level} />
        </View>
        <View style={[u.row, { alignItems: 'flex-end', marginTop: 4 }]}>
          <Text style={s.heroNum}>{r1(a.depth).toFixed(1)}</Text>
          <Text style={s.heroUnit}> mm/h</Text>
        </View>
        <Text style={[u.body, { color: '#e2e8f0' }]}>{t(`lvlmsg.${a.level.key}`)}</Text>
        <Text style={s.calc}>R = C × I = {a.cur.toFixed(2)} × {state.rain} = {r1(a.depth).toFixed(1)} mm/h</Text>
        <View style={[u.rowBetween, { marginTop: 12 }]}>
          <Stat k={t('stat.runs')} v={`${runPct}%`} />
          <Stat k={t('stat.concrete')} v={`${Math.round(IMPERV_MEAN[state.scen] * 100)}%`} />
          <Stat k={t('stat.volume')} v={`${fmtInt(a.vol)} m³`} />
        </View>
      </LinearGradient>

      <GradientButton label={`⚡  ${t('sim.run')}`} onPress={() => setOpen(true)} style={{ marginBottom: 14 }} />

      <LiveWeather />

      <Card>
        <H sub={t('sim.cond.sub')}>{t('sim.cond.h')}</H>

        <Text style={u.label}>🏙️  {t('sim.layout')}</Text>
        <View style={[u.row, { marginTop: 8, marginBottom: 14 }]}>
          {Object.values(SCENARIOS).map((v) => (
            <TouchableOpacity key={v.key} onPress={() => { tap(); set({ scen: v.key }); }}
              style={[s.seg, state.scen === v.key && { borderColor: v.color, backgroundColor: v.color + '22' }]}>
              <Text style={{ fontSize: 22 }}>{v.icon}</Text>
              <Text style={[s.segT, state.scen === v.key && { color: v.color }]}>{t(`scen.${v.key}`)}</Text>
              <Text style={s.segS}>{t('concrete', { p: Math.round(IMPERV_MEAN[v.key] * 100) })} · C = {v.base}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={u.label}>🌧️  {t('sim.rainQ')}</Text>
        <View style={[u.wrap, { marginTop: 8 }]}>
          {RAIN_PRESETS.map((p) => <Chip key={p.label} label={`${p.icon} ${t(`rain.${p.label}`)}`} active={state.rain === p.v} onPress={() => set({ rain: p.v })} />)}
        </View>
        <Stepper label={t('sim.rainI')} value={state.rain} unit=" mm/h" step={5} min={5} max={120} onChange={(v) => set({ rain: v })} />

        <Text style={u.label}>💧  {t('sim.soilQ')}</Text>
        <View style={[u.wrap, { marginTop: 8 }]}>
          {SOIL_PRESETS.map((p, i) => <Chip key={p.label} label={t(`soil.${SOIL_KEYS[i]}`)} active={Math.abs(state.moist - p.v) < 0.001} onPress={() => set({ moist: p.v })} />)}
        </View>
        <Stepper label={t('sim.soil')} value={state.moist} unit="%" step={0.05} min={0} max={1} onChange={(v) => set({ moist: v })} fmt={(v) => Math.round(v * 100)} />

        <Text style={u.label}>⏱️  {t('sim.durQ')}</Text>
        <View style={[u.wrap, { marginTop: 8 }]}>
          {DURATIONS.map((d) => <Chip key={d} label={durLabel(t, d)} active={state.duration === d} onPress={() => set({ duration: d })} />)}
        </View>
      </Card>

      <Card>
        <H sub={t('sim.where.sub')}>{t('sim.where.h')}</H>
        <View style={[u.row, { marginBottom: 8 }]}>
          <Text style={[s.splitL, { width: 110 }]} numberOfLines={1}>🌱 {t('sim.soaks')}</Text>
          <HBar frac={1 - a.cur} color="#22c55e" height={16} />
          <Text style={s.splitV}>{100 - runPct}%</Text>
        </View>
        <View style={u.row}>
          <Text style={[s.splitL, { width: 110 }]} numberOfLines={1}>🌊 {t('sim.runsoff')}</Text>
          <HBar frac={a.cur} color="#38bdf8" height={16} />
          <Text style={s.splitV}>{runPct}%</Text>
        </View>
        <View style={[u.inset, { marginTop: 14, flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={{ fontSize: 34, marginRight: 12 }}>🏊</Text>
          <View style={{ flex: 1 }}>
            <Text style={u.body}>{t('sim.vol', { d: durLabel(t, state.duration), v: fmtInt(a.vol) })}</Text>
            <Text style={[u.body, { color: T.accent, fontWeight: '700' }]}>{t('sim.pools', { n: Math.max(1, Math.round(a.pools)) })}</Text>
          </View>
        </View>
      </Card>

      <StormReplay width={width - 66} />

      <Card>
        <H sub={t('sim.rec.sub')}>{t('sim.rec.h')}</H>
        <RainfallChart width={width - 66} selected={month} onSelect={(m) => { tap(); setMonth(m); }} />
        <View style={[u.inset, { marginTop: 8 }]}>
          <View style={u.rowBetween}>
            <Stat k={t('sim.month')} v={months[month]} />
            <Stat k={t('sim.total')} v={`${MONTHLY_RAIN[month]} mm`} />
            <Stat k={t('sim.heavyDays')} v={HEAVY_DAYS[month]} color={HEAVY_DAYS[month] >= 2 ? '#a5b4fc' : T.text} />
          </View>
        </View>
        <View style={[u.row, { marginTop: 10 }]}>
          <View style={[s.dot, { backgroundColor: '#6366f1' }]} /><Text style={s.leg}>{t('sim.monsoon')}</Text>
        </View>
        <View style={[u.row, { marginTop: 10 }]}>
          <Chip small label={t('sim.heavyBtn')} onPress={() => set({ rain: 50 })} />
        </View>
      </Card>

      <AnalysisModal visible={open} onClose={() => setOpen(false)} onMap={() => { setOpen(false); setTab('map'); }} />
      <Footer />
    </>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  heroLbl: { color: T.body, fontSize: 13, flex: 1, marginRight: 8 },
  heroNum: { color: '#fff', fontSize: 48, fontWeight: '800' },
  heroUnit: { color: T.body, fontSize: 16, marginBottom: 10 },
  calc: { color: T.accent, fontSize: 13, fontWeight: '700', marginTop: 6 },
  seg: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#334155', marginRight: 8, alignItems: 'center' },
  segT: { color: '#e2e8f0', fontWeight: '800', fontSize: 15, marginTop: 4, textAlign: 'center' },
  segS: { color: T.sub, fontSize: 11, marginTop: 2, textAlign: 'center' },
  splitL: { color: T.body, fontSize: 13 },
  splitV: { color: '#fff', fontWeight: '800', width: 44, textAlign: 'right' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  leg: { color: T.sub, fontSize: 12, flex: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(2,6,23,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: '#1e293b' },
  grab: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#334155', alignSelf: 'center', marginBottom: 12 },
  progTrack: { height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden', marginVertical: 14 },
  progFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 4 },
  step: { flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', marginBottom: 6, backgroundColor: '#111c33' },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNumT: { color: '#0b1220', fontWeight: '800', fontSize: 12 },
  stepT: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepD: { color: T.sub, fontSize: 12, marginTop: 3, lineHeight: 17 },
  sBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', backgroundColor: '#1e293b' },
  sBtnT: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
