import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, H, Chip, Pill, Stat, Footer, u, T, tap, useApp } from '../ui';
import { MixBar } from '../charts';
import { SCENARIOS, ZONES, SURF, LEVELS, IMPERV_MEAN, zoneResult, zoneStats, heatColor, insights, zoneLabel, r1 } from '../model';

export default function MapScreen() {
  const { state, set, t } = useApp();
  const [view, setView] = useState('risk');
  const [sel, setSel] = useState(14);
  const scen = state.scen;
  const zones = ZONES[scen];
  const stats = zoneStats(scen, state);
  const z = zones[sel];
  const zr = zoneResult(z, scen, state);

  return (
    <>
      <Card>
        <H sub={t('map.sub')}>{t('map.h')}</H>
        <View style={u.wrap}>
          {Object.values(SCENARIOS).map((v) => (
            <Chip key={v.key} label={`${v.icon} ${t(`scen.${v.key}`)}`} active={scen === v.key} color={v.color} onPress={() => set({ scen: v.key })} />
          ))}
        </View>
        <View style={u.wrap}>
          <Chip label={t('map.risk')} active={view === 'risk'} onPress={() => setView('risk')} small />
          <Chip label={t('map.land')} active={view === 'land'} onPress={() => setView('land')} small />
        </View>

        <View style={s.grid}>
          {zones.map((zn) => {
            const r = zoneResult(zn, scen, state);
            const isSel = zn.id === sel;
            const bg = view === 'risk' ? heatColor(r.score) : zn.imperv > 0.6 ? '#475569' : zn.imperv > 0.3 ? '#a16207' : '#15803d';
            return (
              <TouchableOpacity key={zn.id} activeOpacity={0.8} onPress={() => { tap(); setSel(zn.id); }}
                style={[s.cell, { backgroundColor: bg }, isSel && s.cellSel]}>
                {view === 'risk'
                  ? <Text style={[s.cellT, r.score > 42 && { color: '#fff' }]}>{Math.round(r.depth)}</Text>
                  : <Text style={{ fontSize: 16 }}>{zn.icon}</Text>}
                {zn.low && <Text style={s.lowMark}>⬇</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {view === 'risk' ? (
          <>
            <LinearGradient colors={[heatColor(0), heatColor(15), heatColor(30), heatColor(45), heatColor(60)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.heat} />
            <View style={u.rowBetween}><Text style={s.leg}>0</Text><Text style={s.leg}>15</Text><Text style={s.leg}>30</Text><Text style={s.leg}>45</Text><Text style={s.leg}>60+ mm/h</Text></View>
            <View style={[u.rowBetween, { marginTop: 10 }]}>
              {Object.values(LEVELS).map((l) => (
                <View key={l.key} style={u.row}>
                  <View style={[s.dot, { backgroundColor: l.color }]} />
                  <Text style={s.leg}>{t(`lvl.${l.key}`)} · {t('map.zones', { n: stats[l.key] })}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={[u.rowBetween, { marginTop: 10 }]}>
            {[['#15803d', 'map.mostlyGreen'], ['#a16207', 'map.mixed'], ['#475569', 'map.mostlyConcrete']].map(([c, k]) => (
              <View key={k} style={u.row}><View style={[s.dot, { backgroundColor: c }]} /><Text style={s.leg}>{t(k)}</Text></View>
            ))}
          </View>
        )}
        <Text style={[u.note, { marginTop: 8 }]}>{t('map.note', { r: state.rain })}</Text>
      </Card>

      <Card>
        <View style={u.rowBetween}>
          <View style={[u.row, { flex: 1 }]}>
            <Text style={{ fontSize: 30, marginRight: 10 }}>{z.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={u.h}>{t('map.zone')} {zoneLabel(z)} · {t(`zt.${z.name}`)}</Text>
              <Text style={u.note}>{z.low ? `⬇ ${t('map.low')}` : t('map.normal')}</Text>
            </View>
          </View>
          <Pill level={zr.level} />
        </View>

        <Text style={[u.label, { marginTop: 14, marginBottom: 6 }]}>{t('map.cover')}</Text>
        <MixBar mix={z.mix} surf={SURF} />
        <View style={[u.wrap, { marginTop: 8 }]}>
          {Object.keys(SURF).map((k) => (z.mix[k] > 0.005 ? (
            <View key={k} style={[u.row, { marginRight: 12, marginBottom: 4 }]}>
              <View style={[s.dot, { backgroundColor: SURF[k].color }]} />
              <Text style={s.leg}>{t(`surf.${k}`)} {Math.round(z.mix[k] * 100)}%</Text>
            </View>
          ) : null))}
        </View>

        <View style={[u.inset, u.rowBetween, { marginTop: 10 }]}>
          <Stat k={t('map.imperv')} v={`${Math.round(z.imperv * 100)}%`} />
          <Stat k={t('map.coeff')} v={zr.c.toFixed(2)} />
          <Stat k={t('map.runoff')} v={`${r1(zr.depth).toFixed(1)} mm/h`} color={zr.level.color} />
        </View>
        <Text style={[u.note, { marginTop: 8 }]}>{t('map.impNote')}</Text>
      </Card>

      <Card style={{ borderColor: '#4338ca' }}>
        <H sub={t('map.ins.sub', { s: t(`scen.${scen}`) })}>🤖 {t('map.ins.h')}</H>
        {insights(scen, state).map(({ z: iz, r: ir, tips }, i) => (
          <TouchableOpacity key={iz.id} activeOpacity={0.85} onPress={() => { tap(); setSel(iz.id); }} style={s.ins}>
            <View style={u.rowBetween}>
              <Text style={s.insT}>#{i + 1} · {t('map.zone')} {zoneLabel(iz)} · {iz.icon} {t(`zt.${iz.name}`)}</Text>
              <Text style={[s.insV, { color: ir.level.color }]}>{Math.round(ir.depth)} mm/h</Text>
            </View>
            {tips.map((tp) => (
              <Text key={tp.k} style={s.tip}>{tp.icon}  {t(tp.k, { p: tp.p })}</Text>
            ))}
          </TouchableOpacity>
        ))}
        <Text style={u.note}>{t('map.ins.note')}</Text>
      </Card>

      <Card>
        <H sub={t('map.impSub')}>{t('map.impH')}</H>
        {Object.values(SCENARIOS).map((v) => (
          <View key={v.key} style={{ marginBottom: 10 }}>
            <View style={u.rowBetween}>
              <Text style={u.label}>{v.icon} {t(`scen.${v.key}`)}</Text>
              <Text style={[u.bold, { color: v.color }]}>{Math.round(IMPERV_MEAN[v.key] * 100)}%</Text>
            </View>
            <View style={s.impTrack}>
              <View style={{ width: `${IMPERV_MEAN[v.key] * 100}%`, height: '100%', backgroundColor: v.color, borderRadius: 6 }} />
            </View>
          </View>
        ))}
        <Text style={u.note}>{t('map.impMult', { n: Math.round(IMPERV_MEAN.proposed / IMPERV_MEAN.existing) })}</Text>
      </Card>
      <Footer />
    </>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 },
  cell: { width: '15.6%', aspectRatio: 1, borderRadius: 9, marginBottom: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  cellSel: { borderColor: '#fff', transform: [{ scale: 1.06 }] },
  cellT: { color: '#0b1220', fontWeight: '800', fontSize: 13 },
  lowMark: { position: 'absolute', bottom: 1, right: 3, fontSize: 9, color: '#0b1220', fontWeight: '800' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  leg: { color: T.sub, fontSize: 11 },
  impTrack: { height: 12, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden', marginTop: 6 },
  ins: { backgroundColor: '#0b1220', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1e293b' },
  insT: { color: '#fff', fontWeight: '700', fontSize: 13, flex: 1, marginRight: 6 },
  insV: { fontWeight: '800', fontSize: 13 },
  tip: { color: T.body, fontSize: 12, marginTop: 5, lineHeight: 17 },
  heat: { height: 10, borderRadius: 5, marginTop: 12, marginBottom: 4 },
});
