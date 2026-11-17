import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Card, H, Chip, Bar, Footer, u, T, useApp } from '../ui';
import { RunoffChart } from '../charts';
import BeforeAfter from '../BeforeAfter';
import { SCENARIOS, MITIGATED_COLOR, PPT_DEFAULTS, levelOf, r1, pct } from '../model';

export default function Compare() {
  const { state, set, a, t } = useApp();
  const { width } = useWindowDimensions();
  const isStd = state.rain === PPT_DEFAULTS.rain && Math.abs(state.moist - PPT_DEFAULTS.moist) < 0.001;
  const max = Math.max(a.P, 1);
  const rows = [
    { l: t('cmp.existing'), c: a.cE, r: a.E, color: SCENARIOS.existing.color },
    { l: t('cmp.proposed'), c: a.cP, r: a.P, color: SCENARIOS.proposed.color },
    { l: t('cmp.row3'), c: a.cM, r: a.M, color: MITIGATED_COLOR },
  ];
  const kpis = [
    [`+${pct(a.P, a.E)}%`, t('cmp.k1'), `${r1(a.P)} vs ${r1(a.E)} mm/h`, '#f87171'],
    [`−${Math.round(((a.P - a.M) / a.P) * 100)}%`, t('cmp.k2'), `${r1(a.M)} vs ${r1(a.P)} mm/h`, '#38bdf8'],
    [`+${pct(a.M, a.E)}%`, t('cmp.k3'), `${r1(a.M)} vs ${r1(a.E)} mm/h`, '#fbbf24'],
  ];

  return (
    <>
      <BeforeAfter width={width - 66} />

      <Card>
        <H
          sub={t('cmp.sub', { r: state.rain, m: Math.round(state.moist * 100) })}
          right={isStd ? <View style={s.badge}><Text style={s.badgeT}>{t('cmp.std')}</Text></View> : null}
        >
          {t('cmp.h')}
        </H>
        {!isStd && <Chip small label={t('cmp.reset')} onPress={() => set({ ...PPT_DEFAULTS })} />}
        <View style={[u.row, { height: 230, alignItems: 'flex-end', marginTop: 6 }]}>
          <Bar label={t('cmp.existing')} sub={`C = ${a.cE.toFixed(2)}`} val={a.E} max={max} color={SCENARIOS.existing.color} height={160} />
          <Bar label={t('cmp.proposed')} sub={`C = ${a.cP.toFixed(2)}`} val={a.P} max={max} color={SCENARIOS.proposed.color} height={160} />
          <Bar label={t('cmp.mitigated')} sub={`C = ${a.cM.toFixed(2)}`} val={a.M} max={max} color={MITIGATED_COLOR} height={160} />
        </View>
        <Text style={[u.note, { textAlign: 'center', marginTop: 6 }]}>{t('cmp.unit')}</Text>
      </Card>

      <Card>
        <H sub={t('cmp.what.sub')}>{t('cmp.what.h')}</H>
        {kpis.map(([v, l, d, c]) => (
          <View key={l} style={s.kpi}>
            <Text style={[s.kpiV, { color: c }]}>{v}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.kpiL}>{l}</Text>
              <Text style={u.note}>{d}</Text>
            </View>
          </View>
        ))}
        <View style={[u.inset, { marginTop: 6 }]}>
          <Text style={u.body}>{t('cmp.msg')}</Text>
        </View>
      </Card>

      <Card>
        <H sub={t('cmp.table.sub')}>{t('cmp.table.h')}</H>
        <View style={[s.tr, s.th]}>
          <Text style={[s.td, { flex: 1.6 }, s.thT]}>{t('cmp.col.s')}</Text>
          <Text style={[s.td, s.thT]}>C</Text>
          <Text style={[s.td, { flex: 1.4 }, s.thT]}>C × I</Text>
          <Text style={[s.td, s.thT]}>{t('cmp.col.level')}</Text>
        </View>
        {rows.map((r) => {
          const lv = levelOf(r.r);
          return (
            <View key={r.l} style={s.tr}>
              <View style={[u.row, { flex: 1.6 }]}><View style={[s.dot, { backgroundColor: r.color }]} /><Text style={[s.tdT, { flex: 1 }]}>{r.l}</Text></View>
              <Text style={[s.td, s.tdT]}>{r.c.toFixed(2)}</Text>
              <Text style={[s.td, s.tdT, { flex: 1.4 }]}>{r.c.toFixed(2)}×{state.rain} = <Text style={u.bold}>{r1(r.r)}</Text></Text>
              <Text style={[s.td, { color: lv.color, fontWeight: '800', fontSize: 12 }]}>{t(`lvl.${lv.key}`)}</Text>
            </View>
          );
        })}
        <Text style={[u.note, { marginTop: 8 }]}>{t('cmp.tableNote')}</Text>
      </Card>

      <Card>
        <H sub={t('cmp.harder.sub')}>{t('cmp.harder.h')}</H>
        <RunoffChart
          width={width - 66}
          rain={state.rain}
          lines={[
            { label: 'E', c: a.cE, color: SCENARIOS.existing.color },
            { label: 'P', c: a.cP, color: SCENARIOS.proposed.color },
            { label: 'M', c: a.cM, color: MITIGATED_COLOR },
          ]}
        />
        <View style={[u.rowBetween, { marginTop: 6 }]}>
          {[['cmp.existing', SCENARIOS.existing.color], ['cmp.proposed', SCENARIOS.proposed.color], ['cmp.mitigated', MITIGATED_COLOR]].map(([k, c]) => (
            <View key={k} style={u.row}><View style={[s.dot, { backgroundColor: c }]} /><Text style={s.leg}>{t(k)}</Text></View>
          ))}
        </View>
        <Text style={[u.note, { marginTop: 6 }]}>{t('cmp.axis')}</Text>
        <View style={[u.wrap, { marginTop: 10 }]}>
          {[10, 25, 50, 90].map((v) => <Chip key={v} small label={`${v} mm/h`} active={state.rain === v} onPress={() => set({ rain: v })} />)}
        </View>
      </Card>
      <Footer />
    </>
  );
}

const s = StyleSheet.create({
  badge: { backgroundColor: '#14532d', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeT: { color: '#86efac', fontWeight: '800', fontSize: 11 },
  kpi: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0b1220', borderRadius: 14, padding: 12, marginBottom: 8 },
  kpiV: { fontSize: 26, fontWeight: '800', width: 92 },
  kpiL: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  th: { paddingVertical: 6 },
  thT: { color: T.dim, fontSize: 11, fontWeight: '700' },
  td: { flex: 1 },
  tdT: { color: T.body, fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  leg: { color: T.sub, fontSize: 12 },
});
