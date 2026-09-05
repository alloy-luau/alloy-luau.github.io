import puppeteer from "puppeteer-core";
const out = process.argv[2] ?? "shots";
import { mkdirSync } from "node:fs";
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:1750/?review", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 4500));
const shot = async (sel, name, opts = {}) => {
  const el = await page.$(sel);
  if (!el) { console.log("missing", sel); return; }
  await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await new Promise((r) => setTimeout(r, 900));
  if (opts.hover) { await el.hover(); await new Promise((r) => setTimeout(r, 700)); }
  await el.screenshot({ path: `${out}/${name}.png`, captureBeyondViewport: false });
  console.log("shot", name);
};
await shot("header", "el-header");
await shot("header nav a:last-child", "el-nav-hover", { hover: true });
await page.mouse.move(0, 0);
await shot("header", "el-header-after");
await shot(".chip.glass", "el-chip");
await shot(".chip.glass", "el-chip-hover", { hover: true });
await shot("a.glass", "el-install");
await shot("#strict .grid", "el-cards");
await shot("#install > div", "el-install-section");
await shot("#strict .grid > :nth-child(6)", "el-lints-card", { hover: true });
await shot("#chapters .grid > :nth-child(1)", "el-chapter", { hover: true });
await page.goto("http://127.0.0.1:1750/docs/?review", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1500));
await page.click(".search input");
await new Promise((r) => setTimeout(r, 400));
await shot(".search", "el-search");
await browser.close();
