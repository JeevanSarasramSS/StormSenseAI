import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Card, Chip, Stat, GradientButton, Pill, u, T, tap, useApp } from './ui';
import { SCENARIOS, coeff, levelOf, clamp, r1 } from './model';

// Live data: Open-Meteo (free, no API key) — https://open-meteo.com
export const CITIES = [
  { name: 'Chennai', lat: 13.08, lon: 80.27 },
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'Bengaluru', lat: 12.97, lon: 77.59 },
  { name: 'Kolkata', lat: 22.57, lon: 88.36 },
  { name: 'Delhi', lat: 28.61, lon: 77.21 },
];

const wmoKey = (c) => {
  if (c == null) return [null, '🌡️'];
  if (c === 0) return ['wmo.clear', '☀️'];
  if (c <= 2) return ['wmo.partly', '⛅'];
  if (c === 3) return ['wmo.overcast', '☁️'];
  if (c <= 48) return ['wmo.fog', '🌫️'];
  if (c <= 57) return ['wmo.drizzle', '🌦️'];
  if (c <= 67) return ['wmo.rain', '🌧️'];
  if (c <= 77) return ['wmo.snow', '🌨️'];
  if (c <= 82) return ['wmo.showers', '🌧️'];
  return ['wmo.storm', '⛈️'];
};

// in-memory cache so switching tabs is instant (10 min)
const CACHE = new Map();
const TTL = 10 * 60 * 1000;

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

async function fetchWeather(city) {
  const key = `${city.lat.toFixed(2)},${city.lon.toFixed(2)}`;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.d;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
    '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code' +
    '&hourly=precipitation,precipitation_probability,soil_moisture_0_to_1cm' +
    '&forecast_days=2&timezone=auto';
  const res = await withTimeout(fetch(url), 9000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  const h = j.hourly || {};
  const times = h.time || [];
  const nowIso = (j.current && j.current.time) || '';
  let start = times.findIndex((x) => x >= nowIso.slice(0, 13));
  if (start < 0) start = 0;
  const next = (arr) => (arr || []).slice(start, start + 24);
  const rain24 = next(h.precipitation).map((v) => v || 0);
  const prob24 = next(h.precipitation_probability).map((v) => v || 0);
  const soil24 = next(h.soil_moisture_0_to_1cm).filter((v) => v != null);
  const peak = rain24.length ? Math.max(...rain24) : 0;
  const peakIdx = rain24.indexOf(peak);
  const d = {
    temp: j.current ? j.current.temperature_2m : null,
    hum: j.current ? j.current.relative_humidity_2m : null,
    rainNow: j.current ? j.current.precipitation || 0 : 0,
    code: j.current ? j.current.weather_code : null,
    rain24,
    prob: prob24.length ? Math.max(...prob24) : 0,
    peak,
    peakTime: times[start + peakIdx] ? times[start + peakIdx].slice(11, 16) : '',
    total24: rain24.reduce((x, y) => x + y, 0),
    // volumetric soil moisture (m³/m³) → approx. saturation (≈0.45 = saturated)
    soil: soil24.length ? clamp(soil24[0] / 0.45, 0, 1) : null,
    updated: nowIso.slice(11, 16),
  };
  CACHE.set(key, { t: Date.now(), d });
  return d;
}

async function locateMe() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('denied');
  let pos = null;
  try {
    pos = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 10000);
  } catch (e) {
    pos = await Location.getLastKnownPositionAsync();
  }
  if (!pos) throw new Error('no position');
  const { latitude: lat, longitude: lon } = pos.coords;
  let name = null;
  try {
    const g = await withTimeout(Location.reverseGeocodeAsync({ latitude: lat, longitude: lon }), 5000);
    if (g && g[0]) name = g[0].city || g[0].subregion || g[0].district || g[0].region;
  } catch (e) {}
  return { name, lat, lon, mine: true };
}

function LiveDot({ label }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={s.live}>
      <Animated.View style={[s.liveDot, { opacity: a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.25] }) }]} />
      <Text style={s.liveT}>{label}</Text>
    </View>
  );
}

export default function LiveWeather() {
  const { set, state, t, liveCity, setLiveCity } = useApp();
  const city = liveCity || CITIES[0];
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [applied, setApplied] = useState(false);
  const [locMsg, setLocMsg] = useState(null);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; }, []);

  const load = async (c) => {
    setStatus('loading');
    setApplied(false);
    try {
      const d = await fetchWeather(c);
      if (!alive.current) return;
      setData(d);
      setStatus('ok');
    } catch (e) {
      if (alive.current) setStatus('error');
    }
  };

  useEffect(() => { load(city); }, [city.lat, city.lon]);

  const pickMine = async () => {
    tap();
    setLocMsg(t('lw.locating'));
    try {
      const me = await locateMe();
      if (!alive.current) return;
      setLocMsg(null);
      setLiveCity({ ...me, name: me.name || t('lw.myloc') });
    } catch (e) {
      if (alive.current) setLocMsg(t('lw.locErr', { c: city.name }));
    }
  };

  const designRain = data ? clamp(Math.round(Math.max(data.peak, data.rainNow)), 0, 120) : 0;
  const useLive = () => {
    if (!data) return;
    tap();
    const patch = { rain: Math.max(5, designRain) };
    if (data.soil != null) patch.moist = Math.round(data.soil * 20) / 20;
    set(patch);
    setApplied(true);
  };

  const [descKey, icon] = wmoKey(data && data.code);
  const moist = data && data.soil != null ? data.soil : state.moist;
  const peakSmart = data ? coeff(SCENARIOS.proposed.base, moist) * data.peak : 0;
  const peakToday = data ? coeff(SCENARIOS.existing.base, moist) * data.peak : 0;
  const maxBar = data ? Math.max(2, ...data.rain24) : 1;

  return (
    <Card style={{ borderColor: '#0e7490' }}>
      <View style={u.rowBetween}>
        <Text style={u.h}>{t('lw.h')}</Text>
        <LiveDot label={t('lw.live')} />
      </View>
      <Text style={u.note}>{t('lw.sub')}</Text>

      <View style={[u.wrap, { marginTop: 10 }]}>
        <Chip small label={`📍 ${city.mine ? city.name : t('lw.myloc')}`} active={!!city.mine} color="#7c3aed" onPress={pickMine} />
        {CITIES.map((c) => (
          <Chip key={c.name} small label={c.name} active={!city.mine && city.name === c.name} color="#0e7490" onPress={() => { setLocMsg(null); setLiveCity(c); }} />
        ))}
      </View>
      {locMsg && <Text style={[u.note, { color: '#c4b5fd' }]}>{locMsg}</Text>}

      {status === 'loading' && (
        <View style={s.center}><ActivityIndicator color="#38bdf8" /><Text style={[u.note, { marginTop: 8 }]}>{t('lw.loading', { c: city.name })}</Text></View>
      )}

      {status === 'error' && (
        <View style={s.center}>
          <Text style={{ fontSize: 28 }}>📡</Text>
          <Text style={[u.body, { textAlign: 'center', marginTop: 6 }]}>{t('lw.err')}</Text>
          <TouchableOpacity onPress={() => { tap(); load(city); }} style={s.retry}><Text style={s.retryT}>↻ {t('lw.retry')}</Text></TouchableOpacity>
        </View>
      )}

      {status === 'ok' && data && (
        <>
          <LinearGradient colors={['#0e7490', '#1e3a8a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.now}>
            <Text style={{ fontSize: 40 }}>{icon}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.city}>{city.name} · {t('lw.now')}</Text>
              <Text style={s.temp}>{data.temp != null ? `${Math.round(data.temp)}°C` : '—'}  <Text style={s.desc}>{descKey ? t(descKey) : ''}</Text></Text>
              <Text style={s.small}>{t('lw.hum', { h: data.hum != null ? data.hum : '—', t: data.updated })}</Text>
            </View>
          </LinearGradient>

          <View style={[u.inset, u.rowBetween, { marginTop: 10 }]}>
            <Stat k={t('lw.rainNow')} v={`${r1(data.rainNow)} mm`} color="#93c5fd" />
            <Stat k={t('lw.next')} v={`${r1(data.total24)} mm`} color="#93c5fd" />
            <Stat k={t('lw.chance')} v={`${data.prob}%`} />
            <Stat k={t('lw.soil')} v={data.soil != null ? `${Math.round(data.soil * 100)}%` : '—'} color="#a5b4fc" />
          </View>

          <Text style={[u.label, { marginTop: 12, marginBottom: 6, fontSize: 12 }]}>{t('lw.hourly')}</Text>
          <View style={s.bars}>
            {data.rain24.map((v, i) => (
              <View key={i} style={s.barCol}>
                <View style={[s.bar, { height: Math.max(2, (v / maxBar) * 46), backgroundColor: v === data.peak && v > 0 ? '#6366f1' : '#38bdf8', opacity: v > 0 ? 1 : 0.25 }]} />
              </View>
            ))}
          </View>
          <View style={u.rowBetween}><Text style={s.axis}>{t('lw.now')}</Text><Text style={s.axis}>{t('lw.h12')}</Text><Text style={s.axis}>{t('lw.h24')}</Text></View>

          <View style={[u.inset, { marginTop: 12 }]}>
            {data.peak > 0 ? (
              <>
                <Text style={u.body}>{t('lw.peak', { p: r1(data.peak) })}{data.peakTime ? t('lw.around', { t: data.peakTime }) : ''}</Text>
                <Text style={[u.body, { marginTop: 4 }]}>
                  {t('lw.ifhit')} {t('scen.existing')} <Text style={{ color: SCENARIOS.existing.color, fontWeight: '800' }}>{r1(peakToday)} mm/h</Text> → {t('scen.proposed')} <Text style={{ color: SCENARIOS.proposed.color, fontWeight: '800' }}>{r1(peakSmart)} mm/h</Text> {t('lw.ofRunoff')}
                </Text>
                <View style={[u.row, { marginTop: 6 }]}><Text style={[u.note, { marginTop: 0, marginRight: 6 }]}>{t('lw.level')}</Text><Pill level={levelOf(peakSmart)} /></View>
              </>
            ) : (
              <Text style={u.body}>{t('lw.norain', { c: city.name })}</Text>
            )}
          </View>

          <GradientButton
            label={applied ? `✓ ${t('lw.applied')}` : `⚡ ${t('lw.use')}`}
            colors={applied ? ['#15803d', '#16a34a'] : ['#0e7490', '#6366f1']}
            onPress={useLive}
            style={{ marginTop: 12 }}
          />
          <Text style={[u.note, { marginTop: 6, textAlign: 'center' }]}>{t('lw.note')}</Text>
        </>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  live: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#450a0a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 5 },
  liveT: { color: '#fca5a5', fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  center: { alignItems: 'center', paddingVertical: 20 },
  retry: { marginTop: 10, backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  retryT: { color: '#fff', fontWeight: '700' },
  now: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginTop: 8 },
  city: { color: '#bae6fd', fontSize: 12, fontWeight: '700' },
  temp: { color: '#fff', fontSize: 26, fontWeight: '800' },
  desc: { color: '#e0f2fe', fontSize: 14, fontWeight: '600' },
  small: { color: '#bae6fd', fontSize: 11, marginTop: 2 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 50 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '70%', borderRadius: 2 },
  axis: { color: T.dim, fontSize: 10, marginTop: 3 },
});
