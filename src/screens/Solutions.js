import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, H, Toggle, Stat, HBar, GradientButton, Footer, u, T, tap, useApp } from '../ui';
import { MEASURES, SCENARIOS, MITIGATED_COLOR, levelOf, r1, pct } from '../model';

export default function Solutions() {
  const { state, set, a, t } = useApp();
  const allOn = MEASURES.every((m) => state.mit[m.key]);
  const toggle = (k) => { tap(); set({ scen: 'proposed', mit: { ...state.mit, [k]: !state.mit[k] } }); };
  const setAll = (on) => set({ scen: 'proposed', mit: Object.fromEntries(MEASURES.map((m) => [m.key, on])) });
  const lvS = levelOf(a.S);
  const gauge = (c) => `${Math.min(100, c * 100)}%`;

  return (
    <>
      <Card>
        <H sub={t('sol.sub')}>{t('sol.h')}</H>
        {MEASURES.map((m) => {
          const on = state.mit[m.key];
          return (
            <TouchableOpacity key={m.key} activeOpacity={0.85} onPress={() => toggle(m.key)} style={[s.mit, on && s.mitOn]}>
              <Text style={{ fontSize: 30 }}>{m.icon}</Text>
              <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                <Text style={s.mT}>{t(`m.${m.key}`)}</Text>
                <Text style={s.mD}>{t(`m.${m.key}.d`)}</Text>
                <Text style={s.mW}>📍 {t(`m.${m.key}.w`)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Toggle on={on} />
                <Text style={[s.cut, on && { color: '#86efac' }]}>C −{m.cut.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <GradientButton
          label={allOn ? t('sol.removeAll') : t('sol.applyAll')}
          colors={allOn ? ['#334155', '#475569'] : ['#16a34a', '#0ea5e9']}
          onPress={() => setAll(!allOn)}
          style={{ marginTop: 6 }}
        />
      </Card>

      <Card>
        <H sub={t('sol.effect.sub')}>{t('sol.effect.h')}</H>
        <View style={s.gauge}>
          <View style={[s.gFill, { width: gauge(a.cS) }]} />
          <View style={[s.mark, { left: gauge(a.cE) }]}><Text style={[s.markT, { color: SCENARIOS.existing.color }]}>{t('scen.existing')} {a.cE.toFixed(2)}</Text></View>
          <View style={[s.mark, { left: gauge(a.cP) }]}><Text style={[s.markT, { color: SCENARIOS.proposed.color }]}>{a.cP.toFixed(2)}</Text></View>
        </View>
        <Text style={[u.note, { marginTop: 22 }]}>{t('sol.blue', { c: a.cS.toFixed(2) })}</Text>

        <View style={[u.inset, { marginTop: 12 }]}>
          <View style={u.rowBetween}>
            <Stat k={t('sol.without')} v={`${r1(a.P).toFixed(1)} mm/h`} color={SCENARIOS.proposed.color} />
            <Text style={{ color: T.dim, fontSize: 20 }}>→</Text>
            <Stat k={t('sol.with')} v={`${r1(a.S).toFixed(1)} mm/h`} color={MITIGATED_COLOR} />
          </View>
          <View style={[u.rowBetween, { marginTop: 12 }]}>
            <Stat k={t('sol.reduction')} v={`−${Math.round(((a.P - a.S) / a.P) * 100)}%`} color="#86efac" />
            <Stat k={t('sol.above')} v={`+${pct(a.S, a.E)}%`} color="#fbbf24" />
            <Stat k={t('sol.level')} v={t(`lvl.${lvS.key}`)} color={lvS.color} />
          </View>
        </View>
      </Card>

      <Card>
        <H sub={t('sol.contrib.sub')}>{t('sol.contrib.h')}</H>
        {MEASURES.map((m) => (
          <View key={m.key} style={[u.row, { marginBottom: 10 }]}>
            <Text style={{ width: 28, fontSize: 18 }}>{m.icon}</Text>
            <Text style={[u.label, { width: 112, fontSize: 12 }]} numberOfLines={1}>{t(`m.${m.key}`)}</Text>
            <HBar frac={m.cut / 0.1} color={state.mit[m.key] ? '#22c55e' : '#334155'} height={12} />
            <Text style={s.cutV}>−{m.cut.toFixed(2)}</Text>
          </View>
        ))}
        <View style={[u.inset, { marginTop: 4 }]}>
          <Text style={u.body}>{t('sol.all')}</Text>
          <Text style={[u.note, { marginTop: 6 }]}>{t('sol.realnote')}</Text>
        </View>
      </Card>
      <Footer />
    </>
  );
}

const s = StyleSheet.create({
  mit: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: '#0b1220', marginBottom: 10, borderWidth: 1.5, borderColor: '#1e293b' },
  mitOn: { borderColor: '#22c55e', backgroundColor: '#052e1a' },
  mT: { color: '#fff', fontWeight: '800', fontSize: 15 },
  mD: { color: T.sub, fontSize: 12, marginTop: 2 },
  mW: { color: T.dim, fontSize: 11, marginTop: 3 },
  cut: { color: T.dim, fontSize: 11, fontWeight: '700', marginTop: 6 },
  cutV: { color: '#fff', fontWeight: '800', width: 48, textAlign: 'right', fontSize: 13 },
  gauge: { height: 16, backgroundColor: '#1e293b', borderRadius: 8, marginTop: 4 },
  gFill: { height: '100%', backgroundColor: MITIGATED_COLOR, borderRadius: 8 },
  mark: { position: 'absolute', top: -4, width: 2, height: 24, backgroundColor: '#fff' },
  markT: { position: 'absolute', top: 24, left: -24, width: 90, fontSize: 10, fontWeight: '800' },
});
