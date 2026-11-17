#!/usr/bin/env node
/**
 * Builds the question bank for The Great Thanksgiving Factoring Feast.
 *
 *   node tools/generate-bank.js
 *
 * - Rewrites the bank inside index.html (between the QUESTION-BANK markers)
 * - Writes question-bank.csv (answer key; opens in Google Sheets / Excel)
 *
 * Every question is built from its complete factorization, so the answer key is exact.
 * The original 12 questions are kept first in each dish's list.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TARGET = 100;

/* ---------- helpers ---------- */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const isSq = n => n > 0 && Number.isInteger(Math.sqrt(n));
const sqrt = n => Math.round(Math.sqrt(n));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function mul(a, b) { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => r[i + j] += x * y)); return r; }
function polyStr(p) {   // p[i] = coefficient of x^i  →  "4x^3 − 12x^2 − x + 3"
  let s = "";
  for (let i = p.length - 1; i >= 0; i--) {
    const c = p[i]; if (!c) continue;
    const a = Math.abs(c), coef = (a === 1 && i > 0) ? "" : String(a);
    const v = i === 0 ? "" : i === 1 ? "x" : "x^" + i;
    s += (s === "" ? (c < 0 ? "−" : "") : (c < 0 ? " − " : " + ")) + coef + v;
  }
  return s || "0";
}
const paren = p => "(" + polyStr(p) + ")";

// Deterministic shuffle so re-running the script gives the same bank
function seeded(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
function sample(list, n, seed) {
  const rnd = seeded(seed), a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

/* ---------- builders ---------- */
// Cubic factored by grouping: (c·x + a)(d·x^2 + e)
function cubic(c, a, d, e) {
  const lin = [a, c], quad = [e, 0, d];
  const poly = mul(lin, quad);                       // [ae, ce, ad, cd]
  const dos = e < 0 && isSq(d) && isSq(-e);
  const finals = [lin].concat(dos ? [[-sqrt(-e), sqrt(d)], [sqrt(-e), sqrt(d)]] : [quad]);
  const g1 = paren([0, 0, poly[2], poly[3]]), g2 = paren([poly[0], poly[1]]);
  const mono = (d === 1 ? "" : d) + "x^2";
  const L = paren(lin), Q = polyStr(quad);
  const hints = [
    `Group ${g1} and ${g2}. ` + (e < 0 ? "Pull a negative GCF out of the second group." : "What is the GCF of each group?"),
    dos ? `${mono}${L} − ${-e}${L} = ${L}(${Q}). Is ${Q} finished cooking? Look for a difference of two squares!`
        : `${mono}${L} ${e < 0 ? "−" : "+"} ${Math.abs(e)}${L} — now factor out the common binomial ${L}.`
  ];
  return entry(poly, finals, hints);
}

// Quartic in quadratic form: (p·x^2 + q)(r·x^2 + s)
function quartic(p, q, r, s) {
  const f1 = [q, 0, p], f2 = [s, 0, r];
  const poly = mul(f1, f2);                           // [qs, 0, ps+qr, 0, pr]
  const A = poly[4], B = poly[2], C = poly[0];
  const split = (k, m) => (m < 0 && isSq(k) && isSq(-m)) ? [[-sqrt(-m), sqrt(k)], [sqrt(-m), sqrt(k)]] : [[m, 0, k]];
  const finals = split(p, q).concat(split(r, s));
  const nDos = (finals.length - 2);
  const F = paren(f1) + paren(f2);
  const again = nDos === 2 ? "Both of these are differences of two squares!"
              : nDos === 1 ? "One of these factors can be factored again — which one?"
              : "Can either factor be factored again? (A sum of squares, or a number that isn't a perfect square, can't be.)";
  let hints;
  if (B === 0) {   // binomial difference of squares, e.g. x^4 − 16
    hints = [`${polyStr(poly)} is a difference of two squares: (${sqrt(A) === 1 ? "" : sqrt(A)}x^2)^2 − ${sqrt(-C)}^2.`, `${F}. ${again}`];
  } else {
    const u = polyStr([C, B, A]).replace(/x\^2/g, "u^2").replace(/x/g, "u");
    hints = [
      `Let u = x^2. Then you are factoring ${u}.` + (A === 1
        ? ` Find two numbers that multiply to ${C} and add to ${B}.`
        : ` Find two numbers that multiply to ${A}·${C} = ${A * C} and add to ${B}.`),
      `${F}. ${again}`
    ];
  }
  return entry(poly, finals, hints);
}

function entry(poly, finals, hints) {
  // sanity check: the final factors multiply back to the polynomial
  const back = finals.reduce((acc, f) => mul(acc, f), [1]);
  if (back.length !== poly.length || back.some((c, i) => c !== poly[i])) throw new Error("bad factorization " + polyStr(poly));
  return { p: poly, f: finals.length, h: hints, a: finals.map(paren).join("") };
}

/* ---------- the 12 dish types ---------- */
const types = {};
const keep = (id, original, all, seed) => {
  const key = e => e.p.join(",");
  const rest = all.filter(e => key(e) !== key(original));
  types[id] = [original].concat(sample(rest, TARGET - 1, seed));
};

// Q1 Dinner Rolls: (x + a)(x^2 + b)
keep("Q1", cubic(1, 5, 1, 2), range(1, 10).flatMap(a => range(1, 10).map(b => cubic(1, a, 1, b))), 1);
// Q2 Cranberry Sauce: (x − a)(x^2 + b)
keep("Q2", cubic(1, -4, 1, 3), range(1, 10).flatMap(a => range(1, 10).map(b => cubic(1, -a, 1, b))), 2);
// Q3 Corn on the Cob: (x^2 + a)(x^2 + b)
keep("Q3", quartic(1, 3, 1, 4), range(1, 15).flatMap(a => range(a + 1, 15).map(b => quartic(1, a, 1, b))), 3);
// Q4 Mashed Potatoes: (x + a)(x^2 − b^2)  → difference of squares
keep("Q4", cubic(1, 3, 1, -4), range(1, 12).flatMap(a => range(1, 9).filter(b => b !== a).map(b => cubic(1, a, 1, -b * b))), 4);
// Q5 Green Bean Casserole: (x − a)(x^2 − b^2)  → difference of squares
keep("Q5", cubic(1, -2, 1, -9), range(1, 12).flatMap(a => range(1, 9).filter(b => b !== a).map(b => cubic(1, -a, 1, -b * b))), 5);
// Q6 Turkey Gravy: p^2x^4 − q^2  → difference of squares (sometimes twice)
keep("Q6", quartic(1, -4, 1, 4), (() => {
  const out = [];
  for (const p of range(1, 6)) for (const q of range(1, p <= 3 ? 20 : 15)) if (gcd(p, q) === 1) out.push(quartic(p, -q, p, q));
  for (const p of [1, 4, 9]) for (const q of [25, 36]) if (gcd(p, q) === 1) out.push(quartic(p, -q, p, q));
  for (const q of [1, 4, 16, 25]) out.push(quartic(9, -q, 9, q));
  return out;
})(), 6);
// Q7 Mac & Cheese: (x^2 + a)(x^2 − b), b not a perfect square → stops at two factors
keep("Q7", quartic(1, 5, 1, -2), range(1, 12).flatMap(a => [2, 3, 5, 6, 7, 8, 10, 11, 12].filter(b => b !== a).map(b => quartic(1, a, 1, -b))), 7);
// Q8 Stuffing: (cx + a)(x^2 − b^2), leading coefficient c > 1
keep("Q8", cubic(2, 3, 1, -4), (() => {
  const out = [];
  for (const c of [2, 3, 4, 5]) for (const a of [...range(-7, -1), ...range(1, 7)]) for (const b of range(1, 6))
    if (gcd(c, a) === 1) out.push(cubic(c, a, 1, -b * b));
  return out;
})(), 8);
// Q9 Sweet Potato Casserole: (x ± a)(c^2x^2 − b^2)
keep("Q9", cubic(1, -3, 4, -1), (() => {
  const out = [];
  for (const c of [2, 3]) for (const a of [...range(-9, -1), ...range(1, 9)]) for (const b of range(1, 7))
    if (gcd(c, b) === 1) out.push(cubic(1, a, c * c, -b * b));
  return out;
})(), 9);
// Q10 Apple Pie: (x^2 − a^2)(x^2 − b^2) → four factors   (a·b ≤ 60 keeps the numbers friendly)
keep("Q10", quartic(1, -1, 1, -4), range(1, 14).flatMap(a => range(a + 1, 14).filter(b => a * b <= 60).map(b => quartic(1, -a * a, 1, -b * b))), 10);
// Q11 Pumpkin Pie: (x^2 + a)(x^2 − b^2) → three factors
keep("Q11", quartic(1, -4, 1, -9), range(1, 12).flatMap(a => range(1, 8).filter(b => b * b !== a).map(b => quartic(1, a, 1, -b * b))), 11);
// Q12 Roast Turkey: (p^2x^2 − q^2)(x^2 − r^2) → four factors
keep("Q12", quartic(4, -1, 1, -9), (() => {
  const out = [];
  const opts = { 2: [range(1, 7), range(1, 6)], 3: [range(1, 7), range(1, 6)], 4: [range(1, 5), range(1, 5)], 5: [range(1, 4), range(1, 4)] };
  for (const p of [2, 3, 4, 5]) for (const q of opts[p][0]) for (const r of opts[p][1])
    if (gcd(p, q) === 1) out.push(quartic(p * p, -q * q, 1, -r * r));
  return out;
})(), 12);

/* ---------- write outputs ---------- */
const DISH = { Q1: "Dinner Rolls", Q2: "Cranberry Sauce", Q3: "Corn on the Cob", Q4: "Mashed Potatoes", Q5: "Green Bean Casserole",
  Q6: "Turkey Gravy", Q7: "Mac & Cheese", Q8: "Stuffing", Q9: "Sweet Potato Casserole", Q10: "Apple Pie", Q11: "Pumpkin Pie", Q12: "Roast Turkey" };

const bankJs = "const BANK = " + JSON.stringify(
  Object.fromEntries(Object.entries(types).map(([id, list]) => [id, list.map(({ p, f, h }) => ({ p, f, h }))]))
).replace(/\],"Q/g, '],\n"Q') + ";";
const htmlPath = path.join(ROOT, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const re = /(\/\* QUESTION-BANK:START[^\n]*\n)[\s\S]*?(\n\/\* QUESTION-BANK:END \*\/)/;
if (!re.test(html)) throw new Error("QUESTION-BANK markers not found in index.html");
fs.writeFileSync(htmlPath, html.replace(re, (_, a, b) => a + bankJs + b));

const csv = [["Dish #", "Dish", "Question #", "Polynomial", "Factored completely", "# of factors"]];
for (const [id, list] of Object.entries(types))
  list.forEach((e, i) => csv.push([id, DISH[id], i + 1, polyStr(e.p), e.a, e.f]));
fs.writeFileSync(path.join(ROOT, "question-bank.csv"),
  "﻿" + csv.map(r => r.map(v => /[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v).join(",")).join("\n") + "\n");

for (const [id, list] of Object.entries(types)) console.log(id.padEnd(4), DISH[id].padEnd(24), list.length, "questions");
