import { describe, it, expect, beforeEach, vi } from 'vitest';
import { _testing } from '@/composables/useWeather';

const { generateWeather, calcSuitabilityScore, pickWeather } = _testing;

describe('useWeather - calcSuitabilityScore', () => {
  it('sunny with moderate temperature gives perfect score', () => {
    const score = calcSuitabilityScore({
      type: 'sunny',
      label: '晴',
      temperature: 26,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(100);
  });

  it('rainy deducts 20 points', () => {
    const score = calcSuitabilityScore({
      type: 'rainy',
      label: '小雨',
      temperature: 22,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(80);
  });

  it('windy deducts 30 points', () => {
    const score = calcSuitabilityScore({
      type: 'windy',
      label: '大风',
      temperature: 20,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(70);
  });

  it('haze deducts 15 points', () => {
    const score = calcSuitabilityScore({
      type: 'haze',
      label: '雾霾',
      temperature: 24,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(85);
  });

  it('high temperature (>35) deducts 15 points', () => {
    const score = calcSuitabilityScore({
      type: 'sunny',
      label: '晴',
      temperature: 37,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(85);
  });

  it('low temperature (<0) deducts 20 points', () => {
    const score = calcSuitabilityScore({
      type: 'sunny',
      label: '晴',
      temperature: -3,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(80);
  });

  it('boundary: exactly 35 degrees does not deduct', () => {
    const score = calcSuitabilityScore({
      type: 'sunny',
      label: '晴',
      temperature: 35,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(100);
  });

  it('boundary: exactly 0 degrees does not deduct', () => {
    const score = calcSuitabilityScore({
      type: 'sunny',
      label: '晴',
      temperature: 0,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(100);
  });

  it('windy + haze = 30 + 15 = 45 points deducted', () => {
    const score = calcSuitabilityScore({
      type: 'windy',
      label: '大风',
      temperature: 25,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    const windyOnly = score;

    const hazeScore = calcSuitabilityScore({
      type: 'haze',
      label: '雾霾',
      temperature: 25,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });

    expect(windyOnly).toBe(70);
    expect(hazeScore).toBe(85);
  });

  it('rainy + high temp + windy would be clamped at 0', () => {
    const score = calcSuitabilityScore({
      type: 'rainy',
      label: '小雨',
      temperature: 38,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(100 - 20 - 15);
  });

  it('score is clamped between 0 and 100', () => {
    const lowScore = calcSuitabilityScore({
      type: 'windy',
      label: '大风',
      temperature: -10,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(lowScore).toBeGreaterThanOrEqual(0);

    const fakeMax = calcSuitabilityScore({
      type: 'sunny',
      label: '晴',
      temperature: 25,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(fakeMax).toBeLessThanOrEqual(100);
  });

  it('rainy + windy + low temp gives score < 60 (not suitable)', () => {
    const score = calcSuitabilityScore({
      type: 'windy',
      label: '大风',
      temperature: -2,
      humidityDelta: 0,
      pm25Delta: 0,
      pm10Delta: 0,
      windSpeedDelta: 0,
    });
    expect(score).toBe(100 - 30 - 20);
    expect(score).toBeLessThan(60);
  });
});

describe('useWeather - generateWeather', () => {
  it('returns valid WeatherInfo object', () => {
    const w = generateWeather();
    expect(['sunny', 'cloudy', 'rainy', 'windy', 'haze']).toContain(w.type);
    expect(typeof w.label).toBe('string');
    expect(typeof w.temperature).toBe('number');
    expect(typeof w.humidityDelta).toBe('number');
    expect(typeof w.pm25Delta).toBe('number');
    expect(typeof w.pm10Delta).toBe('number');
    expect(typeof w.windSpeedDelta).toBe('number');
  });

  it('rainy has positive humidityDelta and negative pm deltas', () => {
    const rainyWeathers = Array.from({ length: 100 }, () => generateWeather())
      .filter(w => w.type === 'rainy');

    if (rainyWeathers.length > 0) {
      rainyWeathers.forEach(w => {
        expect(w.humidityDelta).toBeGreaterThan(0);
        expect(w.pm25Delta).toBeLessThan(0);
        expect(w.pm10Delta).toBeLessThan(0);
      });
    }
  });

  it('windy has positive windSpeedDelta', () => {
    const windyWeathers = Array.from({ length: 100 }, () => generateWeather())
      .filter(w => w.type === 'windy');

    if (windyWeathers.length > 0) {
      windyWeathers.forEach(w => {
        expect(w.windSpeedDelta).toBeGreaterThan(0);
      });
    }
  });

  it('haze has large positive pm deltas', () => {
    const hazeWeathers = Array.from({ length: 100 }, () => generateWeather())
      .filter(w => w.type === 'haze');

    if (hazeWeathers.length > 0) {
      hazeWeathers.forEach(w => {
        expect(w.pm25Delta).toBeGreaterThan(20);
        expect(w.pm10Delta).toBeGreaterThan(30);
      });
    }
  });
});

describe('useWeather - pickWeather weighted random', () => {
  it('returns a valid weather type each time', () => {
    for (let i = 0; i < 100; i++) {
      const type = pickWeather();
      expect(['sunny', 'cloudy', 'rainy', 'windy', 'haze']).toContain(type);
    }
  });

  it('sunny appears most frequently (weight 30)', () => {
    const counts: Record<string, number> = {
      sunny: 0, cloudy: 0, rainy: 0, windy: 0, haze: 0,
    };
    const iterations = 2000;
    for (let i = 0; i < iterations; i++) {
      const type = pickWeather();
      counts[type]++;
    }
    expect(counts.sunny).toBeGreaterThan(counts.rainy);
    expect(counts.sunny).toBeGreaterThan(counts.haze);
  });
});
