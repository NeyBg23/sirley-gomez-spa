import assert from "node:assert/strict";
import { DEFAULT_CONTENT, contentSchema, localDate, minutes, clock } from "../lib/content.ts";

const c=contentSchema.parse(DEFAULT_CONTENT);
for(const s of c.services.filter(s=>s.category==="men")) assert.equal(s.price/s.sessions,100,`${s.id}: each session must cost US$100`);
assert.deepEqual(c.gifts.filter(g=>g.occasion==="birthday").map(g=>g.price),[95,130,160]);
assert.deepEqual(c.gifts.filter(g=>g.occasion==="christmas").map(g=>g.price),[95,130,160]);
assert.deepEqual(c.settings.days,[1,2,3,4,5,6]);
assert.equal(c.settings.open,"16:30");assert.equal(c.settings.close,"19:00");
assert.equal(localDate(new Date("2026-10-25T02:00:00Z")),"2026-10-24","calendar must use Sterling local date");
assert.equal(localDate(new Date("2026-12-25T04:30:00Z")),"2026-12-24","winter calendar must account for standard time");
assert.equal(clock(minutes("16:30")),"16:30");
assert.equal(contentSchema.safeParse({...c,settings:{...c.settings,open:"20:00",close:"19:00"}}).success,false);
assert.equal(contentSchema.safeParse({...c,services:[...c.services,c.services[0]]}).success,false);
assert.equal(contentSchema.safeParse({...c,settings:{...c.settings,instagram:"https://example.com/"}}).success,false);
console.log("PASS: male prices, gift tiers, bilingual schema, business hours, DST, invalid schedules and duplicate identifiers");
