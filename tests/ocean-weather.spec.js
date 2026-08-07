// tests/ocean-weather.spec.js
//
// v1.1.2317: Knotentest für oceanWeather.js — die EINZIGE Ozean-Datei ohne
// Browser-Abhängigkeit und die mit der meisten Fallunterscheidung (Muster wie
// die „pur"-Tests in island.spec.js: Import über die Vite-URL, Rechnung im
// Seitenkontext, Asserts in Node). Ausdrücklich beauftragt im
// Integrations-Prompt — die Testfälle darin sind die Prüfliste.

import { test, expect } from '@playwright/test';
import { mountCard } from './harness/card.js';

// Ein Import für alle Tests der Datei; jede Prüfung holt sich das Modul
// selbst, weil page.evaluate keinen Zustand zwischen Aufrufen teilt.
const MODUL = '/src/components/bento/widgets/ocean/oceanWeather.js';

test.describe('oceanWeather — reine Zuordnung hass → Szene', () => {
  test('toKmh und toKm normieren alle Einheiten, Unsinn wird null', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async (pfad) => {
      const m = await import(pfad);
      return {
        ms: m.toKmh(10, 'm/s'),
        mph: m.toKmh(10, 'mph'),
        kn: m.toKmh(10, 'kn'),
        fts: m.toKmh(10, 'ft/s'),
        kmh: m.toKmh(10, 'km/h'),
        ohneEinheit: m.toKmh(10, undefined),
        unsinnText: m.toKmh('schnell', 'm/s'),
        unsinnNaN: m.toKmh(NaN, 'm/s'),
        unsinnNull: m.toKmh(null, 'm/s'),
        m: m.toKm(1500, 'm'),
        mi: m.toKm(10, 'mi'),
        ft: m.toKm(1000, 'ft'),
        km: m.toKm(10, 'km'),
        kmUnsinn: m.toKm(undefined, 'km'),
      };
    }, MODUL);
    expect(r.ms).toBeCloseTo(36, 5);
    expect(r.mph).toBeCloseTo(16.09344, 5);
    expect(r.kn).toBeCloseTo(18.52, 5);
    expect(r.fts).toBeCloseTo(10.9728, 4);
    expect(r.kmh).toBe(10);
    expect(r.ohneEinheit).toBe(10);       // Vorgabe: km/h
    expect(r.unsinnText).toBeNull();
    expect(r.unsinnNaN).toBeNull();
    expect(r.unsinnNull).toBeNull();
    expect(r.m).toBeCloseTo(1.5, 5);
    expect(r.mi).toBeCloseTo(16.09344, 5);
    expect(r.ft).toBeCloseTo(0.3048, 5);
    expect(r.km).toBe(10);
    expect(r.kmUnsinn).toBeNull();
  });

  test('paletteT ist stetig über den Nulldurchgang und unterscheidet auf/ab', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async (pfad) => {
      const m = await import(pfad);
      return {
        // Nulldurchgang: knapp über und knapp unter dem Horizont, absteigend.
        kurzUeber: m.paletteT(0.001, false),
        amHorizont: m.paletteT(0, false),
        kurzUnter: m.paletteT(-0.001, false),
        // Gleiche Höhe, andere Richtung → andere Farbe (Morgen ≠ Abend).
        morgen20: m.paletteT(20, true),
        abend20: m.paletteT(20, false),
        // Enden der Skala.
        mittag: m.paletteT(60, true),
        tiefeNacht: m.paletteT(-20, false),
        fehlend: m.paletteT(null, true),
      };
    }, MODUL);
    // Stetigkeit am Übergang Tag → Dämmerung (absteigender Ast endet bei
    // 0.58, der Nacht-Ast beginnt bei 0.62 — der Sprung ist die bewusste
    // Dämmerungs-Kante, aber beidseits des Horizonts bleibt es nah dran).
    expect(Math.abs(r.kurzUeber - 0.58)).toBeLessThan(0.001);
    expect(Math.abs(r.amHorizont - 0.58)).toBeLessThan(0.001);
    expect(Math.abs(r.kurzUnter - 0.62)).toBeLessThan(0.001);
    expect(r.morgen20).not.toBeCloseTo(r.abend20, 3);
    expect(r.morgen20).toBeLessThan(r.abend20);   // Morgen liegt am hellen Ende
    expect(r.mittag).toBeCloseTo(0.30, 5);        // beide Äste treffen sich mittags
    expect(r.tiefeNacht).toBeCloseTo(1.0, 5);
    expect(r.fehlend).toBeCloseTo(0.30, 5);       // Vorgabe: Tagmitte
  });

  test('nightFactor: 0 bei +5°, 1 bei −10°', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async (pfad) => {
      const m = await import(pfad);
      return {
        tag: m.nightFactor(5),
        horizont: m.nightFactor(0),
        daemmerung: m.nightFactor(-6),
        nacht: m.nightFactor(-10),
        tiefer: m.nightFactor(-30),
        fehlend: m.nightFactor(undefined),
      };
    }, MODUL);
    expect(r.tag).toBe(0);
    expect(r.horizont).toBe(0);                   // Nacht beginnt erst unter −2°
    expect(r.daemmerung).toBeGreaterThan(0);
    expect(r.daemmerung).toBeLessThan(1);
    expect(r.nacht).toBe(1);
    expect(r.tiefer).toBe(1);
    expect(r.fehlend).toBe(0);
  });

  test('readMoonPhase: Text, 0..1-Zahl, Mondalter in Tagen, fehlend → 0,5', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async (pfad) => {
      const m = await import(pfad);
      return {
        vollText: m.readMoonPhase({ state: 'full_moon' }),
        neuText: m.readMoonPhase({ state: 'new_moon' }),
        zunehmend: m.readMoonPhase({ state: 'waxing_crescent' }),
        direkt: m.readMoonPhase({ state: '0.25' }),
        alterTage: m.readMoonPhase({ state: '14.765' }),   // halber Zyklus
        alterVoll: m.readMoonPhase({ state: '29.53' }),    // Zyklusende → ~0
        unsinn: m.readMoonPhase({ state: 'blau' }),
        fehlt: m.readMoonPhase(null),
      };
    }, MODUL);
    expect(r.vollText).toBe(0.5);
    expect(r.neuText).toBe(0);
    expect(r.zunehmend).toBe(0.125);
    expect(r.direkt).toBe(0.25);
    expect(r.alterTage).toBeCloseTo(0.5, 2);
    expect(r.alterVoll).toBeCloseTo(0, 1);
    expect(r.unsinn).toBe(0.5);
    expect(r.fehlt).toBe(0.5);
  });

  test('readWeather: numerische Attribute schlagen die Zustandszuordnung, windy hat einen Windboden', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async (pfad) => {
      const m = await import(pfad);
      return {
        // cloud_coverage 10 % schlägt cloudy (0.85) — Numerik gewinnt.
        numerikCov: m.readWeather({ state: 'cloudy', attributes: { cloud_coverage: 10 } }).cov,
        mapCov: m.readWeather({ state: 'cloudy', attributes: {} }).cov,
        // visibility 2 km → dichter Dunst schlägt sunny-fog (0).
        numerikFog: m.readWeather({ state: 'sunny', attributes: { visibility: 2, visibility_unit: 'km' } }).fog,
        mapFog: m.readWeather({ state: 'sunny', attributes: {} }).fog,
        // windy: gemessene 5 km/h ≈ 0.11 — der Boden 0.70 gewinnt.
        windyBoden: m.readWeather({ state: 'windy', attributes: { wind_speed: 5, wind_speed_unit: 'km/h' } }).wind,
        // Ohne windy zählt die Messung.
        normalWind: m.readWeather({ state: 'sunny', attributes: { wind_speed: 45, wind_speed_unit: 'km/h' } }).wind,
        // Regen kommt weiterhin aus der Karte (kein numerisches Attribut).
        regen: m.readWeather({ state: 'pouring', attributes: {} }).rain,
        fehlt: m.readWeather(null),
      };
    }, MODUL);
    expect(r.numerikCov).toBeCloseTo(0.10, 5);
    expect(r.mapCov).toBeCloseTo(0.85, 5);
    expect(r.numerikFog).toBeCloseTo(0.8, 5);
    expect(r.mapFog).toBe(0);
    expect(r.windyBoden).toBeCloseTo(0.70, 5);
    expect(r.normalWind).toBeCloseTo(1.0, 5);
    expect(r.regen).toBeCloseTo(0.90, 5);
    expect(r.fehlt.cov).toBeCloseTo(0.20, 5);     // DEFAULT_WEATHER
    expect(r.fehlt.wind).toBeCloseTo(0.25, 5);
  });

  test('sceneFromHass: Azimut-Deckelung folgt dem Seitenverhältnis, fehlende Entities → Vorgaben', async ({ page }) => {
    await mountCard(page);
    const r = await page.evaluate(async (pfad) => {
      const m = await import(pfad);
      const sonne = (az) => ({ attributes: { elevation: 20, azimuth: az, rising: true } });
      const breit = { viewBearing: 180, aspect: 2.2 };
      const schmal = { viewBearing: 180, aspect: 0.8 };
      return {
        // 90° seitlich: im breiten Bild weiter außen als im schmalen.
        breitAz: m.sceneFromHass({ sun: sonne(270) }, breit).sunAz,
        schmalAz: m.sceneFromHass({ sun: sonne(270) }, schmal).sunAz,
        // Mitte bleibt Mitte.
        mitte: m.sceneFromHass({ sun: sonne(180) }, breit).sunAz,
        // Fehlende Entities → komplette Vorgabewerte, keine NaNs.
        leer: m.sceneFromHass({}, {}),
      };
    }, MODUL);
    expect(Math.abs(r.breitAz)).toBeGreaterThan(Math.abs(r.schmalAz));
    expect(r.mitte).toBeCloseTo(0, 5);
    expect(r.leer.dayT).toBeGreaterThan(0);
    expect(Number.isFinite(r.leer.sunEl)).toBe(true);
    expect(Number.isFinite(r.leer.sunAz)).toBe(true);
    expect(r.leer.moonPhase).toBe(0.5);
    expect(r.leer.wind).toBeCloseTo(0.25, 5);
    expect(r.leer.night).toBe(0);
    // Und: jede Zahl im Ergebnis ist endlich (die Uniform-Schnittstelle).
    for (const [k, v] of Object.entries(r.leer)) {
      expect(Number.isFinite(v), `${k} ist endlich`).toBe(true);
    }
  });
});
