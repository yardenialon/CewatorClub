/**
 * Unit tests for format.js (pure helpers, no browser needed).
 *   node test_format.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const F = require('./format.js');

describe('escapeHtml', () => {
  test('escapes the five HTML-significant characters', () => {
    assert.equal(F.escapeHtml('<a href="x">Tom & \'Jerry\'</a>'), '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;');
  });
  test('handles null, undefined and numbers', () => {
    assert.equal(F.escapeHtml(null), '');
    assert.equal(F.escapeHtml(undefined), '');
    assert.equal(F.escapeHtml(42), '42');
  });
  test('neutralises a script injection attempt', () => {
    assert.doesNotMatch(F.escapeHtml('<script>alert(1)</script>'), /<script/);
  });
});

describe('initials', () => {
  test('takes the first letter of the first two words', () => {
    assert.equal(F.initials('Maya Moves / Demo'), 'MM');
    assert.equal(F.initials('Noa'), 'N');
    assert.equal(F.initials('נועה גרין'), 'נג');
  });
  test('ignores separators and empty input', () => {
    assert.equal(F.initials('  /  Sam   Blends'), 'SB');
    assert.equal(F.initials(''), '');
    assert.equal(F.initials(undefined), '');
  });
});

describe('money', () => {
  test('formats ILS and USD per locale without trailing zeros', () => {
    assert.match(F.money(1500, 'ILS', 'he'), /1,500/);
    assert.match(F.money(1500, 'ILS', 'he'), /₪/);
    assert.equal(F.money(190, 'USD', 'en'), '$190');
    assert.equal(F.money(12.5, 'USD', 'en'), '$12.5');
  });
  test('never rounds away cents', () => {
    assert.equal(F.money(0.01, 'USD', 'en'), '$0.01');
  });
});

describe('number', () => {
  test('groups thousands', () => {
    assert.equal(F.number(32600, 'en'), '32,600');
    assert.match(F.number(32600, 'he'), /32,600|32.600/);
  });
});

describe('date', () => {
  test('formats an ISO date without timezone drift', () => {
    assert.equal(F.date('2026-10-03', 'en'), 'Oct 3');
    assert.match(F.date('2026-10-03', 'he'), /3/);
  });
  test('formats a timestamp', () => {
    assert.equal(F.date('2026-01-15T12:00:00.000Z', 'en').replace(/\s/g, ' '), 'Jan 15');
  });
  test('falls back to the raw value on garbage', () => {
    assert.equal(F.date('not-a-date', 'en').length > 0, true);
    assert.equal(F.date(undefined, 'en'), 'undefined');
  });
});

describe('csv', () => {
  test('quotes cells and doubles inner quotes', () => {
    assert.equal(F.csvCell('plain'), '"plain"');
    assert.equal(F.csvCell('say "hi"'), '"say ""hi"""');
    assert.equal(F.csvCell(null), '""');
    assert.equal(F.csvCell(12.5), '"12.5"');
  });
  test('neutralises spreadsheet formula injection', () => {
    for (const bad of ['=1+1', '+1', '-1', '@SUM', '\tx', '\rx']) assert.ok(F.csvCell(bad).startsWith('"\''), bad);
  });
  test('toCsv joins rows with CRLF and a BOM', () => {
    const csv = F.toCsv([['a', 'b'], ['c', 'd,e']]);
    assert.equal(csv.charCodeAt(0), 0xfeff);
    assert.equal(csv.slice(1), '"a","b"\r\n"c","d,e"');
  });
});

describe('locale', () => {
  test('maps app languages to BCP 47 tags', () => {
    assert.equal(F.locale('he'), 'he-IL');
    assert.equal(F.locale('en'), 'en-US');
    assert.equal(F.locale('xx'), 'en-US');
  });
});
