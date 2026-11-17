import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import { Card, H, u, tap, useApp } from './ui';
import { SceneArt } from './CityScene';
import { SCENARIOS, r1 } from './model';

// Drag the handle to reveal the site today (left) vs after development (right)
export default function BeforeAfter({ width }) {
  const { a, t } = useApp();
  const SH = 190;
  const x = useRef(new Animated.Value(width / 2)).current;
  const pos = useRef(width / 2);
  const start = useRef(width / 2);

  useEffect(() => {
    const id = x.addListener(({ value }) => { pos.current = value; });
    // gentle hint animation so people know it can be dragged
    Animated.sequence([
      Animated.delay(500),
      Animated.timing(x, { toValue: width * 0.3, duration: 500, useNativeDriver: false }),
      Animated.timing(x, { toValue: width * 0.7, duration: 700, useNativeDriver: false }),
      Animated.timing(x, { toValue: width * 0.5, duration: 500, useNativeDriver: false }),
    ]).start();
    return () => x.removeListener(id);
  }, [width]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => { x.stopAnimation(); start.current = pos.current; tap(); },
      onPanResponderMove: (_, g) => { x.setValue(Math.max(0, Math.min(width, start.current + g.dx))); },
    })
  ).current;

  return (
    <Card>
      <H sub={t('ba.sub')}>{t('ba.h')}</H>
      <View style={{ width, height: SH, borderRadius: 16, overflow: 'hidden' }} {...pan.panHandlers}>
        <SceneArt width={width} H={SH} proposed id="baAfter" />
        <Animated.View style={[StyleSheet.absoluteFill, { width: x, overflow: 'hidden' }]} pointerEvents="none">
          <SceneArt width={width} H={SH} proposed={false} id="baBefore" />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[s.line, { transform: [{ translateX: Animated.subtract(x, 1.5) }] }]} />
        <Animated.View pointerEvents="none" style={[s.knob, { transform: [{ translateX: Animated.subtract(x, 20) }] }]}>
          <Text style={s.knobT}>⇆</Text>
        </Animated.View>
        <View pointerEvents="none" style={[s.tag, { left: 8 }]}>
          <Text style={[s.tagT, { color: SCENARIOS.existing.color }]}>{t('scen.existing')}</Text>
          <Text style={s.tagV}>{r1(a.E).toFixed(1)} mm/h</Text>
        </View>
        <View pointerEvents="none" style={[s.tag, { right: 8, alignItems: 'flex-end' }]}>
          <Text style={[s.tagT, { color: SCENARIOS.proposed.color }]}>{t('scen.proposed')}</Text>
          <Text style={s.tagV}>{r1(a.P).toFixed(1)} mm/h</Text>
        </View>
      </View>
    </Card>
  );
}

const s = StyleSheet.create({
  line: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: '#fff' },
  knob: { position: 'absolute', top: 75, left: 0, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, elevation: 6 },
  knobT: { color: '#0b1220', fontWeight: '900', fontSize: 18 },
  tag: { position: 'absolute', top: 8, backgroundColor: 'rgba(15,23,42,0.8)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tagT: { fontWeight: '800', fontSize: 12 },
  tagV: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
