import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { Card, H, GradientButton, Footer, u, T, tap, useApp } from '../ui';
import { MEASURES, TEAM, IMPERV_MEAN, levelOf, zoneStats, r1, pct, fmtInt, volumeM3 } from '../model';
import { exportPdf } from '../pdf';

export default function Report() {
  const { state, a, t } = useApp();
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const zs = zoneStats('proposed', state);
  const sel = MEASURES.filter((m) => state.mit[m.key]).map((m) => m.label);
  const dur = state.duration < 1 ? '30 min' : `${state.duration} h`;

  const lines = [
    [t('rep.r1'), a.cE, a.E],
    [t('rep.r2'), a.cP, a.P],
    [t('rep.r3'), a.cM, a.M],
  ];

  const text =
`StormSense AI — Preliminary Stormwater Runoff Assessment
21CEO306T Environment Impact Assessment · Batch 5

Conditions: rainfall I = ${state.rain} mm/h for ${dur}, soil moisture ${Math.round(state.moist * 100)}%
Method: R = C × I (assumed composite coefficients)

• Today: C = ${a.cE.toFixed(2)} → R = ${r1(a.E)} mm/h (${levelOf(a.E).label})
• Smart City: C = ${a.cP.toFixed(2)} → R = ${r1(a.P)} mm/h (${levelOf(a.P).label})
• Smart City + all mitigation: C = ${a.cM.toFixed(2)} → R = ${r1(a.M)} mm/h (${levelOf(a.M).label})

Proposed vs existing: +${pct(a.P, a.E)}%
Mitigation vs proposed: −${Math.round(((a.P - a.M) / a.P) * 100)}%
Mitigated vs existing: +${pct(a.M, a.E)}%

Smart City zones: ${zs.HIGH} High · ${zs.MEDIUM} Medium · ${zs.LOW} Low (relative)
Selected measures: ${sel.length ? sel.join(', ') : 'none'}

All values are assumed and illustrative — not measured data or validated predictions.`;

  const share = async () => { tap(); try { await Share.share({ message: text }); } catch (e) {} };
  const pdf = async () => {
    if (busy) return;
    tap();
    setBusy(true);
    try { await exportPdf(state, a); } catch (e) {} finally { setBusy(false); }
  };

  return (
    <>
      <Card>
        <H sub={t('rep.sub')}>{t('rep.h')}</H>
        <View style={u.inset}>
          <Text style={s.cond}>🌧️ {state.rain} mm/h · ⏱️ {dur} · 💧 {Math.round(state.moist * 100)}%</Text>
          {lines.map(([l, c, r]) => {
            const lv = levelOf(r);
            return (
              <View key={l} style={[u.rowBetween, { marginTop: 8 }]}>
                <Text style={[u.body, { flex: 1, marginRight: 8 }]}>{l}</Text>
                <Text style={s.val}>C {c.toFixed(2)} · <Text style={{ color: lv.color }}>{r1(r).toFixed(1)}</Text></Text>
              </View>
            );
          })}
        </View>
        <View style={[u.row, { marginTop: 12 }]}>
          {[[`+${pct(a.P, a.E)}%`, t('cmp.k1'), '#f87171'], [`−${Math.round(((a.P - a.M) / a.P) * 100)}%`, t('rep.k2'), '#38bdf8'], [`${zs.HIGH}`, t('rep.k3'), '#ef4444']].map(([v, l, c]) => (
            <View key={l} style={s.kpi}><Text style={[s.kpiV, { color: c }]}>{v}</Text><Text style={s.kpiL}>{l}</Text></View>
          ))}
        </View>
        <Text style={[u.body, { marginTop: 12 }]}>
          {t('rep.vol', { p: fmtInt(volumeM3(a.P, state.duration)), e: fmtInt(volumeM3(a.E, state.duration)) })}
        </Text>
        <GradientButton
          label={busy ? t('rep.making') : t('rep.pdf')}
          colors={['#dc2626', '#f97316']}
          onPress={pdf}
          style={{ marginTop: 14 }}
        />
        {busy && <ActivityIndicator color="#f97316" style={{ marginTop: 8 }} />}
        <TouchableOpacity onPress={share} style={s.textBtn}><Text style={s.textBtnT}>{t('rep.share')}</Text></TouchableOpacity>
      </Card>

      <Card>
        <H sub={t('rep.ass.sub')}>{t('rep.ass.h')}</H>
        {t('assumptions').map((x, i) => (
          <Text key={i} style={s.li}>•  {x.replace('{e}', Math.round(IMPERV_MEAN.existing * 100)).replace('{p}', Math.round(IMPERV_MEAN.proposed * 100))}</Text>
        ))}
      </Card>

      <Card>
        <H sub={t('rep.lim.sub')}>{t('rep.lim.h')}</H>
        <Text style={s.sub}>{t('rep.notClaimed')}</Text>
        {t('notClaimed').map((x) => <Text key={x} style={s.li}>✕  {x}</Text>)}
        <Text style={[s.sub, { marginTop: 10 }]}>{t('rep.outScope')}</Text>
        {t('outScope').map((x) => <Text key={x} style={s.li}>○  {x}</Text>)}
        <View style={[u.inset, { marginTop: 10 }]}>
          <Text style={u.body}>{t('rep.need')}</Text>
        </View>
      </Card>

      <Card>
        <H sub={t('rep.gl.sub')}>{t('rep.gl.h')}</H>
        {t('glossary').map(([k, v], i) => (
          <TouchableOpacity key={k} onPress={() => { tap(); setOpen(open === i ? null : i); }} style={s.gl}>
            <View style={u.rowBetween}>
              <Text style={[s.glK, { flex: 1 }]}>{k}</Text>
              <Text style={{ color: T.dim }}>{open === i ? '−' : '+'}</Text>
            </View>
            {open === i && <Text style={s.glV}>{v}</Text>}
          </TouchableOpacity>
        ))}
      </Card>

      <Card>
        <H sub="21CEO306T — Environment Impact Assessment">{t('rep.about.h')}</H>
        <Text style={u.body}>AI-Based Urban Stormwater Runoff Estimator · Batch 5</Text>
        <Text style={[u.note, { marginBottom: 8 }]}>Guide: Dr. Vimalanandan G · Dept. of Computing Technologies, SRM IST</Text>
        <View style={u.wrap}>
          {TEAM.map((n) => <View key={n} style={s.name}><Text style={s.nameT}>{n}</Text></View>)}
        </View>
      </Card>
      <Footer />
    </>
  );
}

const s = StyleSheet.create({
  cond: { color: T.accent, fontWeight: '700', fontSize: 13 },
  val: { color: '#fff', fontWeight: '700', fontSize: 13 },
  kpi: { flex: 1, backgroundColor: '#0b1220', borderRadius: 12, padding: 10, marginHorizontal: 3, alignItems: 'center' },
  kpiV: { fontSize: 22, fontWeight: '800' },
  kpiL: { color: T.sub, fontSize: 10, textAlign: 'center', marginTop: 2 },
  textBtn: { marginTop: 10, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: '#1e293b' },
  textBtnT: { color: '#e2e8f0', fontWeight: '700', fontSize: 14 },
  li: { color: T.body, fontSize: 13, marginVertical: 3, lineHeight: 19 },
  sub: { color: '#fff', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  gl: { backgroundColor: '#0b1220', borderRadius: 12, padding: 12, marginBottom: 6 },
  glK: { color: '#fff', fontWeight: '700', fontSize: 14 },
  glV: { color: T.body, fontSize: 13, marginTop: 6, lineHeight: 18 },
  name: { backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6 },
  nameT: { color: '#e2e8f0', fontSize: 12 },
});
