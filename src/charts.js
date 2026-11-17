import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { MONTHS, MONTHLY_RAIN, HEAVY_DAYS, LEVELS } from './model';

// Monthly rainfall records (illustrative)
export function RainfallChart({ width, height = 170, selected, onSelect }) {
  const pad = { l: 8, r: 8, t: 18, b: 22 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const max = Math.max(...MONTHLY_RAIN);
  const bw = w / 12;
  return (
    <Svg width={width} height={height}>
      {MONTHLY_RAIN.map((v, i) => {
        const bh = (v / max) * h;
        const x = pad.l + i * bw + bw * 0.15;
        const heavy = HEAVY_DAYS[i] >= 2;
        const sel = selected === i;
        return (
          <G key={i} onPress={() => onSelect && onSelect(i)}>
            <Rect x={pad.l + i * bw} y={pad.t} width={bw} height={h + pad.b} fill="transparent" />
            <Rect x={x} y={pad.t + h - bh} width={bw * 0.7} height={bh} rx={4}
              fill={heavy ? '#6366f1' : '#38bdf8'} opacity={selected == null || sel ? 1 : 0.45} />
            {(heavy || sel) && (
              <SvgText x={x + bw * 0.35} y={pad.t + h - bh - 5} fill="#e2e8f0" fontSize="9" fontWeight="bold" textAnchor="middle">{v}</SvgText>
            )}
            <SvgText x={x + bw * 0.35} y={height - 6} fill={sel ? '#fff' : '#94a3b8'} fontSize="9" textAnchor="middle">{MONTHS[i][0]}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// Runoff vs rainfall intensity (R = C x I) for each scenario
export function RunoffChart({ width, height = 220, lines, rain }) {
  const pad = { l: 30, r: 12, t: 10, b: 24 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const maxX = 120, maxY = 100;
  const x = (v) => pad.l + (v / maxX) * w;
  const y = (v) => pad.t + h - (Math.min(v, maxY) / maxY) * h;
  const bands = [[0, 15, LEVELS.LOW.color], [15, 30, LEVELS.MEDIUM.color], [30, maxY, LEVELS.HIGH.color]];
  return (
    <Svg width={width} height={height}>
      {bands.map(([a, b, c], i) => (
        <Rect key={i} x={pad.l} y={y(b)} width={w} height={y(a) - y(b)} fill={c} opacity={0.08} />
      ))}
      {[0, 25, 50, 75, 100].map((v) => (
        <G key={v}>
          <Line x1={pad.l} x2={pad.l + w} y1={y(v)} y2={y(v)} stroke="#1e293b" strokeWidth={1} />
          <SvgText x={pad.l - 5} y={y(v) + 3} fill="#64748b" fontSize="9" textAnchor="end">{v}</SvgText>
        </G>
      ))}
      {[0, 30, 60, 90, 120].map((v) => (
        <SvgText key={v} x={x(v)} y={height - 6} fill="#64748b" fontSize="9" textAnchor="middle">{v}</SvgText>
      ))}
      <Line x1={x(rain)} x2={x(rain)} y1={pad.t} y2={pad.t + h} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4,4" />
      {lines.map((l) => {
        const xEnd = Math.min(maxX, maxY / l.c);
        return (
          <G key={l.label}>
            <Line x1={x(0)} y1={y(0)} x2={x(xEnd)} y2={y(l.c * xEnd)} stroke={l.color} strokeWidth={3} strokeLinecap="round" />
            <Circle cx={x(rain)} cy={y(l.c * rain)} r={5} fill={l.color} stroke="#0b1220" strokeWidth={2} />
          </G>
        );
      })}
    </Svg>
  );
}

// stacked land-cover bar for a zone
export function MixBar({ mix, surf, height = 14 }) {
  return (
    <View style={{ flexDirection: 'row', height, borderRadius: 7, overflow: 'hidden' }}>
      {Object.keys(surf).map((k) => (mix[k] > 0.005 ? <View key={k} style={{ flex: mix[k], backgroundColor: surf[k].color }} /> : null))}
    </View>
  );
}
