import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { makeT } from './i18n';

const tEn = makeT('en');
import {
  SCENARIOS, MEASURES, TEAM, IMPERV_MEAN, levelOf, zoneStats, insights, zoneLabel, volumeM3, fmtInt, r1, pct,
} from './model';

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function buildReportHtml(state, a) {
  const t = tEn;
  const zs = zoneStats('proposed', state);
  const top = insights('proposed', state);
  const dur = state.duration < 1 ? '30 min' : `${state.duration} h`;
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const sel = MEASURES.filter((m) => state.mit[m.key]).map((m) => m.label);
  const rows = [
    ['Today (existing land cover)', a.cE, a.E, SCENARIOS.existing.color],
    ['Smart City (proposed)', a.cP, a.P, SCENARIOS.proposed.color],
    ['Smart City + all mitigation', a.cM, a.M, '#38bdf8'],
  ];
  const max = Math.max(a.P, 1);
  const lv = (r) => { const l = levelOf(r); return `<span class="pill" style="background:${l.color}">${l.label}</span>`; };

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  @page { margin: 28px; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #0f172a; font-size: 12px; margin: 0; }
  .head { background: linear-gradient(135deg,#312e81,#0e7490); color: #fff; padding: 22px 24px; border-radius: 14px; }
  .head h1 { margin: 0; font-size: 26px; } .head p { margin: 4px 0 0; opacity: .9; }
  .kick { font-size: 10px; letter-spacing: 2px; font-weight: 700; color: #7dd3fc; }
  h2 { font-size: 15px; margin: 22px 0 8px; color: #312e81; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
  .grid { display: flex; gap: 10px; } .kpi { flex: 1; background: #f1f5f9; border-radius: 10px; padding: 12px; text-align: center; }
  .kpi b { display: block; font-size: 22px; } .kpi span { color: #64748b; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
  th { color: #64748b; font-size: 10px; text-transform: uppercase; }
  .bar { height: 10px; border-radius: 5px; } .track { background: #e2e8f0; border-radius: 5px; width: 160px; }
  .pill { color: #0b1220; font-weight: 700; font-size: 10px; padding: 2px 8px; border-radius: 10px; }
  .formula { font-size: 20px; font-weight: 800; text-align: center; background: #f1f5f9; padding: 10px; border-radius: 10px; letter-spacing: 2px; }
  ul { margin: 4px 0; padding-left: 18px; } li { margin: 3px 0; }
  .zone { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; margin-bottom: 6px; }
  .muted { color: #64748b; font-size: 10px; }
  .foot { margin-top: 24px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
</style></head><body>
<div class="head">
  <div class="kick">21CEO306T · ENVIRONMENT IMPACT ASSESSMENT · BATCH 5</div>
  <h1>StormSense AI — Runoff Assessment</h1>
  <p>AI-Based Urban Stormwater Runoff Estimator · Generated ${esc(date)}</p>
</div>

<h2>Assessment conditions</h2>
<p>Rainfall intensity <b>I = ${state.rain} mm/h</b> for <b>${dur}</b> · soil moisture <b>${Math.round(state.moist * 100)}%</b> · study area 250 ha (36 zones) · concrete cover ${Math.round(IMPERV_MEAN.existing * 100)}% today → ${Math.round(IMPERV_MEAN.proposed * 100)}% proposed.</p>
<div class="formula">R = C × I</div>

<h2>Scenario results</h2>
<table>
  <tr><th>Scenario</th><th>C</th><th>Runoff (mm/h)</th><th></th><th>Level</th><th>Volume (m³)</th></tr>
  ${rows.map(([l, c, r, col]) => `<tr><td>${l}</td><td>${c.toFixed(2)}</td><td><b>${r1(r).toFixed(1)}</b></td>
    <td><div class="track"><div class="bar" style="width:${Math.round((r / max) * 100)}%;background:${col}"></div></div></td>
    <td>${lv(r)}</td><td>${fmtInt(volumeM3(r, state.duration))}</td></tr>`).join('')}
</table>

<h2>Key findings</h2>
<div class="grid">
  <div class="kpi"><b style="color:#ef4444">+${pct(a.P, a.E)}%</b><span>Proposed vs existing</span></div>
  <div class="kpi"><b style="color:#0284c7">−${Math.round(((a.P - a.M) / a.P) * 100)}%</b><span>Mitigation vs proposed</span></div>
  <div class="kpi"><b style="color:#d97706">+${pct(a.M, a.E)}%</b><span>Mitigated vs existing</span></div>
  <div class="kpi"><b>${zs.HIGH} / ${zs.MEDIUM} / ${zs.LOW}</b><span>High / Medium / Low zones (Smart City)</span></div>
</div>
<p>More concrete raises runoff. Mitigation reduces the increase but does not remove it. Selected measures in the app: <b>${sel.length ? esc(sel.join(', ')) : 'none'}</b>.</p>

<h2>Most vulnerable zones & recommendations</h2>
${top.map(({ z, r, tips }, i) => `<div class="zone"><b>#${i + 1} · Zone ${zoneLabel(z)} · ${esc(z.name)}</b> — ${r1(r.depth).toFixed(1)} mm/h ${lv(r.score)}
  <ul>${tips.map((tp) => `<li>${esc(t(tp.k, { p: tp.p }))}</li>`).join('')}</ul></div>`).join('')}

<h2>Assumptions</h2>
<ul>
  <li>Composite C = 0.35 existing, 0.75 proposed, 0.55 with all mitigation (at 40% soil moisture); wetter soil raises C slightly.</li>
  <li>Mitigation effects: permeable pavements −0.08, rain gardens −0.05, additional green spaces −0.07 on C.</li>
  <li>Rainfall records and zone layouts are simulated for illustration; live weather (optional) from Open-Meteo.</li>
  <li>Estimated values are kept separate from measured observations.</li>
</ul>

<h2>Scope limitations</h2>
<p>Not claimed: guaranteed flash-flood prediction, verified flood probabilities or depths, implemented or validated models, actual measured results.
Outside core scope: detailed hydraulic simulation, calibrated flood-depth prediction, drainage-network design, regulatory certification.
Actual flood prediction needs reliable local data, calibration and independent validation.</p>

<div class="foot">Team (Batch 5): ${esc(TEAM.join(', '))} · Guide: Dr. Vimalanandan G · Dept. of Computing Technologies, SRM IST<br/>
Simulated model for preliminary EIA — all values are assumed and illustrative, not measured or validated predictions.</div>
</body></html>`;
}

export async function exportPdf(state, a) {
  const html = buildReportHtml(state, a);
  if (Platform.OS === 'web') {
    // browsers: open the formatted report in a new tab and show the print / Save-as-PDF dialog
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch (e) {} }, 500);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'StormSense AI report' });
  } else {
    await Print.printAsync({ uri });
  }
}
