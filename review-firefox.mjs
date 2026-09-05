import puppeteer from "puppeteer-core";
const out = process.argv[2];
const browser = await puppeteer.launch({ browser: "firefox", executablePath: "/usr/bin/firefox", headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("pageerror:", e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warn") console.log("console:", m.type(), m.text().slice(0, 200)); });
await page.setViewport({ width: 1400, height: 900 });
await page.goto("http://127.0.0.1:1750/", { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 4000));
const info = await page.evaluate(() => {
  const pill = document.querySelector(".nav-pill");
  const chip = document.querySelector(".chip.glass");
  return {
    supportsUrl: CSS.supports("backdrop-filter", "url(#x)"),
    pillBackdrop: pill ? getComputedStyle(pill).backdropFilter : "no pill",
    pillInline: pill ? pill.style.backdropFilter : "",
    chipBackdrop: chip ? getComputedStyle(chip).backdropFilter : "no chip",
    h1: document.querySelector("h1")?.textContent?.slice(0, 30),
    lensCount: document.querySelectorAll("filter[id^=lens-]").length,
  };
});
console.log(JSON.stringify(info));
const docs = await page.$("header nav a:last-child");
const b = await docs.boundingBox();
const onTop = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.tagName + "." + String(e.className).slice(0, 50) : "none"; }, [b.x + b.width / 2, b.y + b.height / 2]);
console.log("on top of Docs:", onTop);
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
await new Promise((r) => setTimeout(r, 900));
const pillUnder = await page.evaluate(() => document.querySelector(".nav-pill")?.parentElement?.textContent ?? "no pill");
console.log("pill under after hover:", pillUnder);
const header = await page.$("header");
await header.screenshot({ path: `${out}/ff-header.png` });
await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
await new Promise((r) => setTimeout(r, 2000));
console.log("url after click:", page.url());
await browser.close();
