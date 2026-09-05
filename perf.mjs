import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome-stable", headless: true, args: ["--no-sandbox", "--hide-scrollbars", "--enable-gpu-rasterization"] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:1750/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 3000));
const fps = async (label) => {
  const n = await page.evaluate(() => new Promise((res) => { let c = 0; const t0 = performance.now(); const tick = () => { c += 1; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(c / 2); }; requestAnimationFrame(tick); }));
  console.log(label, "fps", n.toFixed(1));
};
await fps("hero");
await page.evaluate(() => document.querySelector("#strict").scrollIntoView());
await new Promise((r) => setTimeout(r, 1500));
await fps("strict");
await page.evaluate(() => document.querySelector("#install").scrollIntoView());
await new Promise((r) => setTimeout(r, 1500));
await fps("install");
await browser.close();
