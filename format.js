/* Pure, DOM-free formatting helpers shared by the UI. Testable in Node (test_format.js). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ClubFormat = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const locale = lang => (lang === 'he' ? 'he-IL' : 'en-US');

  /** Escape a value for safe insertion into HTML text or attributes. */
  function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g, ch => ESCAPES[ch]); }

  /** Up to two initials from a display name such as "Maya Moves / Demo" -> "MM". */
  function initials(name) { return String(name ?? '').split(/[\s/]+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase(); }

  /** Currency amount in the viewer's locale, no trailing zeros for whole numbers. */
  function money(v, currency, lang) {
    return new Intl.NumberFormat(locale(lang), { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);
  }

  /** Plain number with locale grouping. */
  function number(v, lang) { return new Intl.NumberFormat(locale(lang)).format(v); }

  /** Short day + month for an ISO date (YYYY-MM-DD) or timestamp. Falls back to the raw value. */
  function date(v, lang) {
    try {
      const s = String(v);
      return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short' }).format(new Date(s.includes('T') ? s : s + 'T12:00:00'));
    } catch (_) { return String(v); }
  }

  /** One CSV cell, quoted, with spreadsheet formula injection neutralised. */
  function csvCell(v) {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }

  /** Rows -> CSV text with a UTF-8 BOM so Excel opens Hebrew correctly. */
  function toCsv(rows) { return '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n'); }

  return { escapeHtml, initials, money, number, date, csvCell, toCsv, locale };
});
