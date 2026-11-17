import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Ellipse, Path, Line, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useApp } from './ui';

function Drop({ x, delay, dur, h }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: x, top: 0, width: 2, height: 12, borderRadius: 1, backgroundColor: '#93c5fd',
        opacity: a.interpolate({ inputRange: [0, 0.85, 1], outputRange: [0.9, 0.9, 0] }),
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-14, h] }) }],
      }}
    />
  );
}

const Tree = ({ x, g, s = 1 }) => (
  <>
    <Rect x={x - 2 * s} y={g - 14 * s} width={4 * s} height={14 * s} fill="#78350f" />
    <Circle cx={x} cy={g - 20 * s} r={11 * s} fill="#16a34a" />
    <Circle cx={x - 6 * s} cy={g - 15 * s} r={7 * s} fill="#22c55e" />
  </>
);

const BUILDINGS = [
  { x: 0.04, w: 0.11, h: 95 }, { x: 0.17, w: 0.09, h: 125 }, { x: 0.28, w: 0.13, h: 80 },
  { x: 0.47, w: 0.1, h: 140 }, { x: 0.6, w: 0.12, h: 100 }, { x: 0.75, w: 0.09, h: 120 }, { x: 0.86, w: 0.11, h: 85 },
];

// Static drawing of the site — used by the simulator and the before/after slider
export function SceneArt({ width, H = 200, proposed, mit = {}, id = 'sky' }) {
  const g = H - 34;
  return (
    <Svg width={width} height={H}>
      <Defs>
        <SvgGrad id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0f172a" />
          <Stop offset="1" stopColor={proposed ? '#334155' : '#1e3a5f'} />
        </SvgGrad>
      </Defs>
      <Rect x={0} y={0} width={width} height={H} fill={`url(#${id})`} />
      <Ellipse cx={width * 0.2} cy={18} rx={60} ry={18} fill="#475569" opacity={0.8} />
      <Ellipse cx={width * 0.55} cy={10} rx={80} ry={20} fill="#334155" opacity={0.9} />
      <Ellipse cx={width * 0.88} cy={20} rx={55} ry={16} fill="#475569" opacity={0.8} />

      {!proposed && (
        <>
          {[0.07, 0.16, 0.42, 0.52, 0.7, 0.82, 0.94].map((p, i) => <Tree key={i} x={width * p} g={g} s={i % 2 ? 1.2 : 1} />)}
          <Rect x={width * 0.24} y={g - 26} width={34} height={26} fill="#e5e7eb" />
          <Path d={`M${width * 0.24 - 4} ${g - 26} L${width * 0.24 + 17} ${g - 42} L${width * 0.24 + 38} ${g - 26} Z`} fill="#b91c1c" />
          <Rect x={width * 0.6} y={g - 22} width={28} height={22} fill="#e5e7eb" />
          <Path d={`M${width * 0.6 - 4} ${g - 22} L${width * 0.6 + 14} ${g - 36} L${width * 0.6 + 32} ${g - 22} Z`} fill="#b91c1c" />
          <Rect x={0} y={g} width={width} height={H - g} fill="#166534" />
          <Rect x={0} y={g + 14} width={width} height={6} fill="#a16207" opacity={0.6} />
        </>
      )}

      {proposed && (
        <>
          {BUILDINGS.map((b, i) => (
            <React.Fragment key={i}>
              <Rect x={width * b.x} y={g - b.h} width={width * b.w} height={b.h} fill={i % 2 ? '#64748b' : '#475569'} />
              {Array.from({ length: Math.floor(b.h / 16) }).map((_, r) =>
                [0.22, 0.6].map((c, k) => (
                  <Rect key={`${r}-${k}`} x={width * b.x + width * b.w * c} y={g - b.h + 8 + r * 16} width={width * b.w * 0.2} height={7} fill="#fde68a" opacity={(r + k + i) % 3 ? 0.65 : 0.15} />
                ))
              )}
            </React.Fragment>
          ))}
          {mit.green && [0.155, 0.43, 0.735].map((p, i) => <Tree key={i} x={width * p} g={g} s={0.8} />)}
          <Rect x={0} y={g} width={width} height={H - g} fill={mit.pave ? '#57534e' : '#1f2937'} />
          {mit.pave
            ? Array.from({ length: Math.floor(width / 10) }).map((_, i) => <Circle key={i} cx={i * 10 + 5} cy={g + 17} r={1.6} fill="#a8a29e" />)
            : <Line x1={0} x2={width} y1={g + 17} y2={g + 17} stroke="#fbbf24" strokeWidth={2} strokeDasharray="14,10" />}
          {mit.garden && [0.12, 0.38, 0.64, 0.9].map((p, i) => <Ellipse key={i} cx={width * p} cy={g + 2} rx={18} ry={5} fill="#22c55e" />)}
        </>
      )}
    </Svg>
  );
}

export default function CityScene({ width, scen, rain, depth, runPct, mit }) {
  const { t } = useApp();
  const H = 200;
  const g = H - 34;
  const water = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(water, { toValue: Math.min(1, depth / 100), duration: 700, useNativeDriver: false }).start();
  }, [depth]);

  const n = Math.max(4, Math.min(40, Math.round(rain / 2.5)));
  const drops = useMemo(
    () => Array.from({ length: n }, (_, i) => ({ x: ((i * 97) % 100) / 100 * (width - 6) + 3, delay: (i * 137) % 900, dur: 650 + ((i * 53) % 350) })),
    [n, width]
  );

  return (
    <View style={{ width, height: H, borderRadius: 18, overflow: 'hidden', marginBottom: 14 }}>
      <SceneArt width={width} H={H} proposed={scen === 'proposed'} mit={mit} id="simsky" />
      {drops.map((d, i) => <Drop key={`${n}-${i}`} x={d.x} delay={d.delay} dur={d.dur} h={g} />)}
      <Animated.View pointerEvents="none" style={[s.water, { height: water.interpolate({ inputRange: [0, 1], outputRange: [3, 40] }) }]} />
      <View style={s.tagL}><Text style={s.tagT}>🌧️ {rain} mm/h</Text></View>
      <View style={s.tagR}><Text style={s.tagT}>{t('city.split', { a: runPct, b: 100 - runPct })}</Text></View>
    </View>
  );
}

const s = StyleSheet.create({
  water: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(56,189,248,0.45)', borderTopWidth: 2, borderTopColor: 'rgba(186,230,253,0.8)' },
  tagL: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(15,23,42,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  tagR: { position: 'absolute', top: 42, left: 10, backgroundColor: 'rgba(15,23,42,0.75)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  tagT: { color: '#e2e8f0', fontSize: 11, fontWeight: '700' },
});
