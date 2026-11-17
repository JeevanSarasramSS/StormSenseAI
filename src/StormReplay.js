import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Polyline, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { Card, H, GradientButton, Stat, u, T, tap, useApp } from './ui';
import { SCENARIOS, MITIGATED_COLOR, STORM_PROFILE, volumeM3, fmtInt, r1 } from './model';

// Plays a 3-hour storm (15-minute steps) and draws runoff for each scenario as it happens.
export default function StormReplay({ width }) {
  const { a, state, t } = useApp();
  const [k, setK] = useState(STORM_PROFILE.length - 1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const play = () => {
    clearInterval(timer.current);
    setK(0);
    setPlaying(true);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setK(i);
      if (i % 3 === 0) tap();
      if (i >= STORM_PROFILE.length - 1) { clearInterval(timer.current); setPlaying(false); }
    }, 380);
  };

  const n = STORM_PROFILE.length;
  const pad = { l: 28, r: 10, t: 8, b: 22 };
  const W = width, Hh = 230;
  const w = W - pad.l - pad.r;
  const rainH = 60;
  const plotT = pad.t + rainH + 10;
  const plotH = Hh - plotT - pad.b;
  const maxR = 80;
  const x = (i) => pad.l + (i / (n - 1)) * w;
  const yR = (v) => plotT + plotH - (Math.min(v, maxR) / maxR) * plotH;
  const bw = w / n;

  const series = [
    { key: 'E', c: a.cE, color: SCENARIOS.existing.color, label: t('scen.existing') },
    { key: 'P', c: a.cP, color: SCENARIOS.proposed.color, label: t('scen.proposed') },
    { key: 'M', c: a.cM, color: MITIGATED_COLOR, label: t('scen.mitigated') },
  ];
  const upto = STORM_PROFILE.slice(0, k + 1);
  const peakRain = Math.max(...STORM_PROFILE);
  const vol = (c) => STORM_PROFILE.reduce((tot, I) => tot + volumeM3(c * I, 0.25), 0);
  const cur = STORM_PROFILE[k];

  return (
    <Card>
      <H sub={t('sr.sub')}>{t('sr.h')}</H>
      <Svg width={W} height={Hh}>
        {STORM_PROFILE.map((I, i) => (
          <Rect key={i} x={pad.l + i * bw + bw * 0.15} y={pad.t} width={bw * 0.7} height={(I / peakRain) * rainH}
            rx={3} fill="#60a5fa" opacity={i <= k ? 0.95 : 0.18} />
        ))}
        <SvgText x={pad.l - 4} y={pad.t + 10} fill="#64748b" fontSize="9" textAnchor="end">🌧</SvgText>
        {[0, 20, 40, 60, 80].map((v) => (
          <G key={v}>
            <Line x1={pad.l} x2={pad.l + w} y1={yR(v)} y2={yR(v)} stroke="#1e293b" />
            <SvgText x={pad.l - 4} y={yR(v) + 3} fill="#64748b" fontSize="9" textAnchor="end">{v}</SvgText>
          </G>
        ))}
        {[0, 4, 8, 12].map((i) => (
          <SvgText key={i} x={x(i)} y={Hh - 6} fill="#64748b" fontSize="9" textAnchor="middle">{`${i / 4}h`}</SvgText>
        ))}
        {series.map((sr) => (
          <G key={sr.key}>
            <Polyline points={upto.map((I, i) => `${x(i)},${yR(sr.c * I)}`).join(' ')} fill="none" stroke={sr.color} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
            <Circle cx={x(k)} cy={yR(sr.c * cur)} r={4.5} fill={sr.color} stroke="#0b1220" strokeWidth={2} />
          </G>
        ))}
        <Line x1={x(k)} x2={x(k)} y1={pad.t} y2={plotT + plotH} stroke="#e2e8f0" strokeDasharray="3,4" opacity={0.5} />
      </Svg>

      <View style={[u.rowBetween, { marginTop: 4 }]}>
        {series.map((sr) => (
          <View key={sr.key} style={u.row}><View style={[s.dot, { backgroundColor: sr.color }]} /><Text style={s.leg}>{sr.label}</Text></View>
        ))}
      </View>

      <View style={[u.inset, { marginTop: 10 }]}>
        <View style={u.rowBetween}>
          <Stat k={t('sr.time')} v={`${Math.floor((k * 15) / 60)}h ${String((k * 15) % 60).padStart(2, '0')}m`} />
          <Stat k={t('sr.rainNow')} v={`${cur} mm/h`} color="#93c5fd" />
          <Stat k={t('sr.smart')} v={`${r1(a.cP * cur).toFixed(1)} mm/h`} color={SCENARIOS.proposed.color} />
        </View>
      </View>

      {!playing && k === n - 1 && (
        <View style={[u.inset, { marginTop: 8 }]}>
          <Text style={[u.label, { marginBottom: 6 }]}>{t('sr.total')}</Text>
          {series.map((sr) => (
            <View key={sr.key} style={[u.rowBetween, { marginVertical: 2 }]}>
              <Text style={[u.body, { color: sr.color }]}>{sr.label}</Text>
              <Text style={u.bold}>{fmtInt(vol(sr.c))} m³</Text>
            </View>
          ))}
          <Text style={[u.note, { marginTop: 6 }]}>{t('sr.note', { p: peakRain, m: Math.round(state.moist * 100) })}</Text>
        </View>
      )}

      <GradientButton label={playing ? `⏳  ${t('sr.playing')}` : `▶  ${t('sr.play')}`} onPress={() => !playing && play()} style={{ marginTop: 12 }} />
    </Card>
  );
}

const s = StyleSheet.create({
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  leg: { color: T.sub, fontSize: 12 },
});
