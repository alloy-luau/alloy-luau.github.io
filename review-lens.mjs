import puppeteer from "puppeteer-core";
const out = process.argv[2];
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:1750/?review", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 4500));
// A striped backdrop behind the hero, to see the lens work.
await page.evaluate(() => {
  const c = document.querySelector("canvas"); if (c) c.style.display = "none";
  const hero = document.querySelector(".hero-ground");
  hero.style.background = "repeating-linear-gradient(90deg,#f7d774 0 18px,#2b2148 18px 36px)";
  const el = document.querySelector("header nav a:last-child"); el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 1200));
const shot = async (sel, name, hover) => {
  const el = await page.$(sel); if (!el) { console.log("missing", sel); return; }
  await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await new Promise((r) => setTimeout(r, 600));
  if (hover) { await el.hover(); await new Promise((r) => setTimeout(r, 700)); }
  await el.screenshot({ path: `${out}/${name}.png` });
  console.log("shot", name);
};
await shot("section .mb-7.flex", "s-chips");
await shot("section .mb-7.flex .chip:nth-child(2)", "s-chip-hover", true);
await shot("section .flex.flex-wrap.gap-3", "s-buttons", true);
await shot("header nav", "s-nav", true);
await shot("#strict .grid > :nth-child(6)", "s-lints");
await shot("#strict .icon-seat", "s-seat");
await browser.close();
