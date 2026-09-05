/**
 * Business-rule tests for core.js (no browser needed, no dependencies).
 *   node test_core.js
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const C = require('./core.js');

const ADMIN = { role: 'admin' };
const creatorActor = id => ({ role: 'creator', creatorId: id });
const fails = (fn, key) => assert.throws(fn, err => err.message === key, `expected error "${key}"`);

const validOffer = (s, creatorId, missionId, extra = {}) => {
  const q = C.quote(s, creatorId, missionId);
  return C.dispatch(s, 'assignment.offer', { creatorId, missionId, production: q.production, distribution: q.distribution, rights: 0, ...extra }, ADMIN);
};

describe('seed data', () => {
  test('seed is valid and has the documented shape', () => {
    const s = C.createSeed();
    assert.equal(C.validateState(s), true);
    assert.equal(s.version, C.VERSION);
    assert.equal(s.creators.length, 6);
    assert.equal(s.missions.length, 4);
    assert.equal(s.assignments.length, 4);
    assert.ok(s.activity.length >= 1);
  });

  test('seed does not contain real personal data', () => {
    const s = C.createSeed();
    for (const c of s.creators) {
      assert.match(c.name, /Demo/);
      assert.match(c.email, /@example\.test$/);
      assert.match(c.url, /^https:\/\/example\.com\//);
    }
  });

  test('dispatch never mutates the input state', () => {
    const s = C.createSeed();
    const frozen = JSON.stringify(s);
    C.dispatch(s, 'creator.approve', { id: 'c5' }, ADMIN);
    assert.equal(JSON.stringify(s), frozen);
  });
});

describe('quote', () => {
  test('production + tiered distribution, rounded to nearest 5', () => {
    const s = C.createSeed();
    const q = C.quote(s, 'c1', 'm1'); // IL reel, 18,400 followers (tier 1), 4.8% engagement (x1.15), fit 88%
    assert.equal(q.production, 300);
    assert.equal(q.tier, 1);
    assert.equal(q.multiplier, 1.15);
    assert.equal(q.distribution, Math.round(160 * 1.15 * 0.88 / 5) * 5);
    assert.equal(q.total, q.production + q.distribution);
    assert.equal(q.currency, 'ILS');
    assert.equal(q.manual, false);
  });

  test('blog missions and newsletter creators need a manual distribution fee', () => {
    const s = C.createSeed();
    assert.equal(C.quote(s, 'c2', 'm3').manual, true); // blog mission
    assert.equal(C.quote(s, 'c2', 'm3').distribution, 0);
    assert.equal(C.quote(s, 'c6', 'm2').manual, true); // newsletter creator
  });

  test('US market quotes in USD', () => {
    const s = C.createSeed();
    assert.equal(C.quote(s, 'c3', 'm2').currency, 'USD');
  });

  test('unknown creator or mission fails', () => {
    const s = C.createSeed();
    fails(() => C.quote(s, 'nope', 'm1'), 'required');
  });
});

describe('stats', () => {
  test('IL and US budgets are never mixed', () => {
    const s = C.createSeed();
    const il = C.stats(s, 'IL'), us = C.stats(s, 'US');
    assert.equal(il.currency, 'ILS');
    assert.equal(us.currency, 'USD');
    assert.equal(il.budget, 3500 + 2200);
    assert.equal(us.budget, 1500 + 1200);
    assert.equal(il.available, il.budget - il.allocated);
    assert.equal(il.committed, il.allocated - il.recorded);
  });
});

describe('creator lifecycle', () => {
  const application = {
    name: 'Test Creator / Demo', email: 'test@example.test', market: 'IL', platform: 'Instagram',
    audience: 10000, engagement: 4, fit: 80, niche: 'Demo niche', url: 'https://example.com/demo', consent: true
  };

  test('public application is stored as pending and unverified', () => {
    const s = C.dispatch(C.createSeed(), 'creator.apply', application, { role: 'public' });
    const c = s.creators.at(-1);
    assert.equal(c.status, 'pending');
    assert.equal(c.metricsVerified, false);
    assert.equal(s.activity[0].action, 'creator.apply');
  });

  test('application requires consent, valid email and https url', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'creator.apply', { ...application, consent: false }, { role: 'public' }), 'consentRequired');
    fails(() => C.dispatch(s, 'creator.apply', { ...application, email: 'not-an-email' }, { role: 'public' }), 'required');
    fails(() => C.dispatch(s, 'creator.apply', { ...application, url: 'http://example.com' }, { role: 'public' }), 'unsafeUrl');
    fails(() => C.dispatch(s, 'creator.apply', { ...application, url: 'javascript:alert(1)' }, { role: 'public' }), 'unsafeUrl');
    fails(() => C.dispatch(s, 'creator.apply', { ...application, audience: 10.5 }, { role: 'public' }), 'required');
  });

  test('only an admin can approve, and only pending creators', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'creator.approve', { id: 'c5' }, creatorActor('c5')), 'statusInvalid');
    const next = C.dispatch(s, 'creator.approve', { id: 'c5' }, ADMIN);
    assert.equal(next.creators.find(c => c.id === 'c5').status, 'active');
    fails(() => C.dispatch(next, 'creator.approve', { id: 'c5' }, ADMIN), 'statusInvalid');
  });

  test('metrics verification is an explicit manual confirmation', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'creator.verify', { id: 'c5' }, ADMIN), 'consentRequired');
    const next = C.dispatch(s, 'creator.verify', { id: 'c5', confirmed: true }, ADMIN);
    const c = next.creators.find(c => c.id === 'c5');
    assert.equal(c.metricsVerified, true);
    assert.ok(c.metricsCheckedAt);
  });
});

describe('missions', () => {
  const mission = { title: 'New demo mission', market: 'US', type: 'story', objective: 'education', budget: 500, capacity: 3, deadline: C.future(10), brief: 'A brief that is long enough.', cta: 'Do the thing' };

  test('admin can create a mission', () => {
    const s = C.dispatch(C.createSeed(), 'mission.create', mission, ADMIN);
    const m = s.missions.at(-1);
    assert.equal(m.title, mission.title);
    assert.equal(m.budget, 500);
    assert.equal(C.titleText(m, 'he', { he: {}, en: {} }), mission.title);
  });

  test('mission validation', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'mission.create', mission, creatorActor('c3')), 'statusInvalid');
    fails(() => C.dispatch(s, 'mission.create', { ...mission, deadline: '2000-01-01' }, ADMIN), 'dateInvalid');
    fails(() => C.dispatch(s, 'mission.create', { ...mission, budget: 0 }, ADMIN), 'minPrice');
    fails(() => C.dispatch(s, 'mission.create', { ...mission, capacity: 2.5 }, ADMIN), 'budgetPositive');
    fails(() => C.dispatch(s, 'mission.create', { ...mission, market: 'FR' }, ADMIN), 'required');
    fails(() => C.dispatch(s, 'mission.create', { ...mission, brief: 'short' }, ADMIN), 'required');
  });
});

describe('offers and budget guards', () => {
  test('offer reserves budget against the mission', () => {
    const s = C.createSeed();
    const before = C.allocation(s, 'm2');
    const next = validOffer(s, 'c4', 'm2');
    const a = next.assignments.at(-1);
    assert.equal(a.status, 'offered');
    assert.equal(a.fees.currency, 'USD');
    assert.equal(a.rateVersion, s.ratesVersion);
    assert.equal(C.allocation(next, 'm2'), before + a.fees.total);
  });

  test('offer is blocked for unverified, pending, cross-market or duplicate creators', () => {
    const s = C.createSeed();
    fails(() => validOffer(s, 'c5', 'm1'), 'required'); // pending
    const active = C.dispatch(s, 'creator.approve', { id: 'c5' }, ADMIN);
    fails(() => validOffer(active, 'c5', 'm1'), 'unverifiedBlocked');
    fails(() => validOffer(s, 'c1', 'm2'), 'required'); // IL creator on US mission
    fails(() => validOffer(s, 'c1', 'm1'), 'duplicateAssignment'); // already has a1
  });

  test('offer cannot exceed remaining budget or capacity', () => {
    const s = C.createSeed();
    fails(() => validOffer(s, 'c4', 'm2', { production: 999999 }), 'insufficientBudget');
    fails(() => validOffer(s, 'c4', 'm2', { production: 0, distribution: 0 }), 'minPrice');
    const small = { ...s, missions: s.missions.map(m => m.id === 'm2' ? { ...m, capacity: 1 } : m) };
    fails(() => validOffer(small, 'c4', 'm2'), 'noSlots');
  });

  test('offer requires an admin', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'assignment.offer', { creatorId: 'c4', missionId: 'm2', production: 90, distribution: 0, rights: 0 }, creatorActor('c4')), 'statusInvalid');
  });

  test('fees are locked at offer time; later rate changes do not affect them', () => {
    const s = validOffer(C.createSeed(), 'c4', 'm2');
    const a = s.assignments.at(-1);
    const rates = JSON.parse(JSON.stringify(s.rates));
    rates.US.production.reel = 999;
    const next = C.dispatch(s, 'settings.rates', { rates }, ADMIN);
    assert.equal(next.ratesVersion, s.ratesVersion + 1);
    assert.equal(next.assignments.find(x => x.id === a.id).fees.total, a.fees.total);
    assert.equal(C.quote(next, 'c4', 'm4').production, 999);
  });
});

describe('assignment state machine', () => {
  test('full happy path: offered -> paid', () => {
    let s = validOffer(C.createSeed(), 'c4', 'm2');
    const id = s.assignments.at(-1).id;
    const me = creatorActor('c4');
    const get = st => st.assignments.find(a => a.id === id);

    fails(() => C.dispatch(s, 'assignment.accept', { id }, me), 'consentRequired');
    fails(() => C.dispatch(s, 'assignment.accept', { id, confirmed: true }, creatorActor('c3')), 'statusInvalid');
    s = C.dispatch(s, 'assignment.accept', { id, confirmed: true }, me);
    assert.equal(get(s).status, 'accepted');

    fails(() => C.dispatch(s, 'assignment.submit', { id, url: 'http://example.com/x' }, me), 'unsafeUrl');
    s = C.dispatch(s, 'assignment.submit', { id, url: 'https://example.com/draft', notes: 'v1' }, me);
    assert.equal(get(s).status, 'submitted');
    assert.equal(get(s).revision, 1);

    fails(() => C.dispatch(s, 'assignment.review', { id, decision: 'approved', checks: [true, true, false, true] }, ADMIN), 'checksRequired');
    fails(() => C.dispatch(s, 'assignment.review', { id, decision: 'changes', feedback: '' }, ADMIN), 'required');
    s = C.dispatch(s, 'assignment.review', { id, decision: 'changes', feedback: 'Show the product earlier.' }, ADMIN);
    assert.equal(get(s).status, 'changes');
    assert.equal(get(s).history.length, 1);

    s = C.dispatch(s, 'assignment.submit', { id, url: 'https://example.com/draft-2' }, me);
    assert.equal(get(s).revision, 2);
    s = C.dispatch(s, 'assignment.review', { id, decision: 'approved', checks: [true, true, true, true] }, ADMIN);
    assert.equal(get(s).status, 'approved');
    assert.ok(get(s).approvedAt);

    fails(() => C.dispatch(s, 'assignment.verify', { id, confirmed: true }, ADMIN), 'statusInvalid'); // not published yet
    s = C.dispatch(s, 'assignment.publish', { id, url: 'https://example.com/post' }, me);
    assert.equal(get(s).status, 'published');

    fails(() => C.dispatch(s, 'assignment.verify', { id }, ADMIN), 'consentRequired');
    s = C.dispatch(s, 'assignment.verify', { id, confirmed: true }, ADMIN);
    assert.equal(get(s).status, 'payable');
    assert.equal(C.stats(s, 'US').payable, get(s).fees.total + 0);

    fails(() => C.dispatch(s, 'assignment.record', { id, reference: 'DEMO-001' }, ADMIN), 'consentRequired');
    fails(() => C.dispatch(s, 'assignment.record', { id, reference: 'D', confirmed: true }, ADMIN), 'required');
    s = C.dispatch(s, 'assignment.record', { id, reference: 'DEMO-001', confirmed: true }, ADMIN);
    assert.equal(get(s).status, 'paid');
    assert.equal(get(s).payment.mode, 'demo-manual-record');
    assert.equal(C.validateState(s), true);
  });

  test('creator cannot publish before approval and cannot act on someone else\'s work', () => {
    const s = C.createSeed(); // a1 is c1's submitted work
    fails(() => C.dispatch(s, 'assignment.publish', { id: 'a1', url: 'https://example.com/p' }, creatorActor('c1')), 'statusInvalid');
    fails(() => C.dispatch(s, 'assignment.submit', { id: 'a3', url: 'https://example.com/p' }, creatorActor('c1')), 'statusInvalid');
    fails(() => C.dispatch(s, 'assignment.review', { id: 'a1', decision: 'approved', checks: [true, true, true, true] }, creatorActor('c1')), 'statusInvalid');
  });

  test('decline releases the slot and the budget', () => {
    const s = C.createSeed();
    const before = C.allocation(s, 'm2');
    const next = C.dispatch(s, 'assignment.decline', { id: 'a2' }, creatorActor('c3'));
    assert.equal(next.assignments.find(a => a.id === 'a2').status, 'cancelled');
    assert.ok(C.allocation(next, 'm2') < before);
    assert.equal(C.missionCount(next, 'm2'), 0);
    // the creator can be offered the same mission again
    assert.doesNotThrow(() => validOffer(next, 'c3', 'm2'));
  });

  test('admin cancellation needs a reason and is only allowed before publication', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'assignment.cancel', { id: 'a1', reason: '' }, ADMIN), 'required');
    fails(() => C.dispatch(s, 'assignment.cancel', { id: 'a4', reason: 'Too late' }, ADMIN), 'statusInvalid'); // published
    const next = C.dispatch(s, 'assignment.cancel', { id: 'a1', reason: 'Brief changed' }, ADMIN);
    assert.equal(next.assignments.find(a => a.id === 'a1').cancelReason, 'Brief changed');
  });

  test('unknown commands and ids are rejected', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'assignment.explode', { id: 'a1' }, ADMIN), 'statusInvalid');
    fails(() => C.dispatch(s, 'assignment.accept', { id: 'missing', confirmed: true }, creatorActor('c1')), 'statusInvalid');
    fails(() => C.dispatch(s, 'nothing', {}, ADMIN), 'statusInvalid');
  });
});

describe('creator rejection', () => {
  test('admin rejects a pending applicant with a reason', () => {
    const s = C.createSeed();
    const next = C.dispatch(s, 'creator.reject', { id: 'c5', reason: 'Audience outside target markets' }, ADMIN);
    const c = next.creators.find(c => c.id === 'c5');
    assert.equal(c.status, 'rejected');
    assert.equal(c.rejectReason, 'Audience outside target markets');
    assert.ok(c.rejectedAt);
    assert.equal(next.activity[0].action, 'creator.reject');
    assert.equal(C.validateState(next), true);
  });

  test('rejection needs a reason, an admin and a pending creator', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'creator.reject', { id: 'c5', reason: '' }, ADMIN), 'required');
    fails(() => C.dispatch(s, 'creator.reject', { id: 'c5', reason: 'No' }, creatorActor('c1')), 'statusInvalid');
    fails(() => C.dispatch(s, 'creator.reject', { id: 'c1', reason: 'Already active' }, ADMIN), 'statusInvalid');
    const rejected = C.dispatch(s, 'creator.reject', { id: 'c5', reason: 'Off brand' }, ADMIN);
    fails(() => C.dispatch(rejected, 'creator.approve', { id: 'c5' }, ADMIN), 'statusInvalid');
    fails(() => validOffer(rejected, 'c5', 'm1'), 'required');
  });
});

describe('mission editing', () => {
  const edit = (s, id, extra = {}) => {
    const m = s.missions.find(x => x.id === id);
    const p = { id, title: 'Edited title', type: m.type, objective: m.objective, budget: m.budget, capacity: m.capacity, deadline: m.deadline, brief: 'An edited brief that is long enough.', cta: 'Edited CTA', ...extra };
    return C.dispatch(s, 'mission.update', p, ADMIN);
  };

  test('admin edits title, budget, capacity, deadline, brief and CTA', () => {
    const s = C.createSeed();
    const next = edit(s, 'm1', { budget: 5000, capacity: 8, deadline: C.future(60), objective: 'education' });
    const m = next.missions.find(x => x.id === 'm1');
    assert.equal(m.title, 'Edited title');
    assert.equal(m.titleKey, undefined); // seed key replaced by a real title
    assert.equal(m.briefKey, undefined);
    assert.equal(m.budget, 5000);
    assert.equal(m.capacity, 8);
    assert.equal(m.objective, 'education');
    assert.ok(m.updatedAt);
    assert.equal(C.validateState(next), true);
  });

  test('budget and capacity cannot drop below what is already allocated', () => {
    const s = C.createSeed(); // m1 has a1 allocated
    const allocated = C.allocation(s, 'm1');
    assert.ok(allocated > 0);
    fails(() => edit(s, 'm1', { budget: allocated - 1 }), 'budgetBelowAllocated');
    assert.doesNotThrow(() => edit(s, 'm1', { budget: allocated }));
    fails(() => edit(s, 'm1', { capacity: 0 }), 'minPrice');
  });

  test('capacity below current assignments is rejected', () => {
    let s = C.dispatch(C.createSeed(), 'creator.approve', { id: 'c5' }, ADMIN);
    s = C.dispatch(s, 'creator.verify', { id: 'c5', confirmed: true }, ADMIN);
    s = validOffer(s, 'c5', 'm1'); // m1 now has 2 assignments
    fails(() => edit(s, 'm1', { capacity: 1 }), 'capacityBelowAssigned');
    assert.doesNotThrow(() => edit(s, 'm1', { capacity: 2 }));
  });

  test('format is locked once creators are assigned, free otherwise', () => {
    const s = C.createSeed();
    fails(() => edit(s, 'm1', { type: 'story' }), 'typeLocked');
    const freed = C.dispatch(s, 'assignment.decline', { id: 'a2' }, creatorActor('c3')); // m2 now empty
    assert.equal(edit(freed, 'm2', { type: 'story' }).missions.find(x => x.id === 'm2').type, 'story');
  });

  test('deadline may stay as is but a new one cannot be in the past', () => {
    const s = C.createSeed();
    fails(() => edit(s, 'm1', { deadline: '2000-01-01' }), 'dateInvalid');
    fails(() => edit(s, 'm1', { deadline: 'soon' }), 'dateInvalid');
    const past = { ...s, missions: s.missions.map(m => m.id === 'm1' ? { ...m, deadline: '2020-01-01' } : m) };
    assert.doesNotThrow(() => edit(past, 'm1')); // unchanged past deadline is tolerated
  });

  test('only an admin can edit, and the mission must exist', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'mission.update', { id: 'm1' }, creatorActor('c1')), 'statusInvalid');
    fails(() => C.dispatch(s, 'mission.update', { id: 'nope', title: 'x', type: 'reel', objective: 'dtc', budget: 1, capacity: 1, deadline: C.future(1), brief: 'long enough brief', cta: 'go' }, ADMIN), 'required');
  });
});

describe('mission archive / restore', () => {
  test('a mission with open work cannot be archived', () => {
    const s = C.createSeed();
    fails(() => C.dispatch(s, 'mission.archive', { id: 'm1' }, ADMIN), 'missionHasOpenWork'); // a1 submitted
    fails(() => C.dispatch(s, 'mission.archive', { id: 'm4' }, ADMIN), 'missionHasOpenWork'); // a4 published
  });

  test('archive hides the mission from offers; restore reopens it', () => {
    let s = C.dispatch(C.createSeed(), 'assignment.decline', { id: 'a2' }, creatorActor('c3')); // m2 has only a cancelled assignment
    s = C.dispatch(s, 'mission.archive', { id: 'm2' }, ADMIN);
    const m = s.missions.find(x => x.id === 'm2');
    assert.equal(m.archived, true);
    assert.ok(m.archivedAt);
    assert.equal(C.validateState(s), true);
    fails(() => validOffer(s, 'c4', 'm2'), 'missionArchived');
    fails(() => C.dispatch(s, 'mission.update', { id: 'm2', title: 'x', type: 'reel', objective: 'dtc', budget: 1, capacity: 1, deadline: C.future(1), brief: 'long enough brief', cta: 'go' }, ADMIN), 'missionArchived');
    fails(() => C.dispatch(s, 'mission.archive', { id: 'm2' }, ADMIN), 'statusInvalid');
    fails(() => C.dispatch(s, 'mission.restore', { id: 'm1' }, ADMIN), 'statusInvalid');
    s = C.dispatch(s, 'mission.restore', { id: 'm2' }, ADMIN);
    assert.equal(s.missions.find(x => x.id === 'm2').archived, undefined);
    assert.doesNotThrow(() => validOffer(s, 'c4', 'm2'));
  });

  test('archiving keeps financial history intact', () => {
    let s = C.dispatch(C.createSeed(), 'assignment.decline', { id: 'a2' }, creatorActor('c3'));
    const before = C.stats(s, 'US');
    s = C.dispatch(s, 'mission.archive', { id: 'm2' }, ADMIN);
    assert.deepEqual(C.stats(s, 'US'), before);
    assert.equal(s.missions.length, 4);
  });

  test('backup validation rejects an archived mission with open work', () => {
    const s = C.createSeed();
    s.missions[0].archived = true;
    fails(() => C.validateState(s), 'invalidBackup');
    const s2 = C.createSeed();
    s2.missions[0].archived = 'yes';
    fails(() => C.validateState(s2), 'invalidBackup');
  });
});

describe('validateState (backup import)', () => {
  const tampered = (mutate) => {
    const s = C.createSeed();
    mutate(s);
    return s;
  };

  test('rejects wrong versions and structural damage', () => {
    fails(() => C.validateState(null), 'invalidBackup');
    fails(() => C.validateState(tampered(s => { s.version = 99; })), 'invalidBackup');
    fails(() => C.validateState(tampered(s => { s.creators = {}; })), 'invalidBackup');
    fails(() => C.validateState(tampered(s => { s.revision = -1; })), 'invalidBackup');
  });

  test('rejects inconsistent money and status data', () => {
    fails(() => C.validateState(tampered(s => { s.assignments[0].fees.total += 1; })), 'invalidBackup');
    fails(() => C.validateState(tampered(s => { s.assignments[0].status = 'paid'; })), 'invalidBackup');
    fails(() => C.validateState(tampered(s => { s.assignments[0].fees.currency = 'USD'; })), 'invalidBackup');
    fails(() => C.validateState(tampered(s => { s.missions[0].budget = 1; })), 'invalidBackup'); // over-allocated
    assert.throws(() => C.validateState(tampered(s => { s.creators[0].url = 'http://example.com'; }))); // field validators surface their own key
    fails(() => C.validateState(tampered(s => { s.assignments.push({ ...s.assignments[0], id: 'dup' }); })), 'invalidBackup'); // duplicate pair
  });

  test('accepts a state produced by the app itself', () => {
    let s = validOffer(C.createSeed(), 'c4', 'm2');
    s = C.dispatch(s, 'creator.approve', { id: 'c5' }, ADMIN);
    assert.equal(C.validateState(JSON.parse(JSON.stringify(s))), true);
  });
});

describe('helpers', () => {
  test('https() only accepts https URLs without credentials', () => {
    assert.equal(C.https('https://example.com/a?b=1'), 'https://example.com/a?b=1');
    fails(() => C.https('https://user:pw@example.com'), 'unsafeUrl');
    fails(() => C.https('ftp://example.com'), 'unsafeUrl');
    fails(() => C.https('not a url'), 'unsafeUrl');
  });

  test('today() / future() produce ISO dates', () => {
    assert.match(C.today(), /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(C.future(1) > C.today());
  });

  test('currency by market', () => {
    assert.equal(C.currency('IL'), 'ILS');
    assert.equal(C.currency('US'), 'USD');
  });
});
