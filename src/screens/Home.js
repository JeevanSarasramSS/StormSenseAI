import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, H, GradientButton, Footer, u, T, tap, useApp } from '../ui';

const FACTORS = [
  { icon: '🌧️', k: 'rain' },
  { icon: '💧', k: 'soil' },
  { icon: '🏗️', k: 'concrete' },
];
const OBJ = [
  { icon: '🌧️', tab: 'sim' }, { icon: '💧', tab: 'sim' }, { icon: '🏗️', tab: 'map' }, { icon: '📐', tab: 'sim' },
  { icon: '🧭', tab: 'map' }, { icon: '⚖️', tab: 'compare' }, { icon: '🌱', tab: 'sol' }, { icon: '📄', tab: 'report' },
];

export default function Home() {
  const { setTab, t } = useApp();
  const objectives = t('objectives');
  const takeaways = t('takeaways');
  return (
    <>
      <LinearGradient colors={['#312e81', '#0e7490']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <Text style={u.kicker}>{t('home.kicker')}</Text>
        <Text style={s.heroTitle}>{t('home.q')}</Text>
        <Text style={s.heroBody}>{t('home.intro')}</Text>
        <GradientButton label={`${t('home.cta')}  →`} onPress={() => setTab('sim')} colors={['#f97316', '#ef4444']} style={{ marginTop: 16 }} />
      </LinearGradient>

      <Card>
        <H sub={t('home.what.sub')}>{t('home.what.h')}</H>
        <Text style={u.body}>{t('home.what.body')}</Text>
        <View style={[u.row, { marginTop: 12 }]}>
          <View style={[s.compare, { borderColor: '#22c55e' }]}>
            <Text style={s.cmpIcon}>🌳</Text>
            <Text style={s.cmpT}>{t('home.green')}</Text>
            <Text style={s.cmpD}>{t('home.green.d')}</Text>
          </View>
          <Text style={{ color: T.dim, marginHorizontal: 8 }}>{t('home.vs')}</Text>
          <View style={[s.compare, { borderColor: '#ef4444' }]}>
            <Text style={s.cmpIcon}>🏢</Text>
            <Text style={s.cmpT}>{t('home.city')}</Text>
            <Text style={s.cmpD}>{t('home.city.d')}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <H sub={t('home.factors.sub')}>{t('home.factors.h')}</H>
        {FACTORS.map((f) => (
          <View key={f.k} style={s.factor}>
            <Text style={{ fontSize: 26 }}>{f.icon}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.fT}>{t(`f.${f.k}`)}</Text>
              <Text style={s.fD}>{t(`f.${f.k}.d`)}</Text>
              <Text style={s.fE}>{t(`f.${f.k}.e`)}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <H sub={t('home.formula.sub')}>{t('home.formula.h')}</H>
        <View style={s.formula}>
          <Text style={s.fBig}>R = C × I</Text>
        </View>
        {['R', 'C', 'I'].map((k) => (
          <View key={k} style={[u.row, { marginVertical: 4 }]}>
            <View style={s.sym}><Text style={s.symT}>{k}</Text></View>
            <Text style={[u.body, { flex: 1 }]}><Text style={u.bold}>{t(`sym.${k}`)}</Text> — {t(`sym.${k}.d`)}</Text>
          </View>
        ))}
        <View style={[u.inset, { marginTop: 10 }]}>
          <Text style={u.body}>{t('home.ex1')}</Text>
          <Text style={[u.body, { color: '#34d399', fontWeight: '700' }]}>{t('home.ex2')}</Text>
        </View>
      </Card>

      <Card>
        <H sub={t('home.obj.sub')}>{t('home.obj.h')}</H>
        <View style={[u.wrap, { justifyContent: 'space-between' }]}>
          {OBJ.map((o, i) => (
            <TouchableOpacity key={i} style={s.obj} onPress={() => { tap(); setTab(o.tab); }}>
              <Text style={{ fontSize: 20 }}>{o.icon}</Text>
              <Text style={s.objN}>{i + 1}</Text>
              <Text style={s.objT}>{objectives[i]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card>
        <H sub={t('home.take.sub')}>{t('home.take.h')}</H>
        {takeaways.map((x, i) => (
          <View key={i} style={[u.row, { alignItems: 'flex-start', marginVertical: 5 }]}>
            <Text style={s.num}>0{i + 1}</Text>
            <Text style={[u.body, { flex: 1 }]}>{x}</Text>
          </View>
        ))}
      </Card>
      <Footer />
    </>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: 22, padding: 20, marginBottom: 14 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 8, lineHeight: 32 },
  heroBody: { color: '#e0f2fe', fontSize: 14, marginTop: 8, lineHeight: 21 },
  compare: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 12, alignItems: 'center', backgroundColor: '#0b1220' },
  cmpIcon: { fontSize: 30 },
  cmpT: { color: '#fff', fontWeight: '700', marginTop: 4, textAlign: 'center' },
  cmpD: { color: T.sub, fontSize: 12, textAlign: 'center' },
  factor: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0b1220', borderRadius: 14, padding: 12, marginBottom: 8 },
  fT: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fD: { color: T.sub, fontSize: 12 },
  fE: { color: T.accent, fontSize: 12, marginTop: 2, fontWeight: '600' },
  formula: { backgroundColor: '#0b1220', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  fBig: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 2 },
  sym: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  symT: { color: '#fff', fontWeight: '800' },
  obj: { width: '48.5%', backgroundColor: '#0b1220', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1e293b' },
  objN: { position: 'absolute', top: 8, right: 10, color: '#334155', fontWeight: '800', fontSize: 18 },
  objT: { color: '#e2e8f0', fontWeight: '600', fontSize: 13, marginTop: 6 },
  num: { color: T.accent, fontWeight: '800', fontSize: 15, width: 30 },
});
