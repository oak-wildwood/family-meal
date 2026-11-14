import { formatClock, formatMinutes, sourceHost, tagLabel } from './display';

describe('formatMinutes', () => {
  it.each([
    [0, '0 min'],
    [45, '45 min'],
    [60, '1 hr'],
    [90, '1 hr 30 min'],
    [210, '3 hr 30 min'],
  ])('%s → %s', (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });
});

describe('formatClock', () => {
  it.each([
    [25 * 60_000, '25:00'],
    [59_001, '1:00'],
    [500, '0:01'],
    [0, '0:00'],
    [-10, '0:00'],
    [3_725_000, '1:02:05'],
  ])('%s ms → %s', (ms, expected) => {
    expect(formatClock(ms)).toBe(expected);
  });
});

describe('tagLabel', () => {
  it('capitalizes the first letter only', () => {
    expect(tagLabel('make-ahead')).toBe('Make-ahead');
  });
});

describe('sourceHost', () => {
  it('drops the scheme, path and www', () => {
    expect(sourceHost('https://www.example.com/soup?x=1')).toBe('example.com');
  });
});
