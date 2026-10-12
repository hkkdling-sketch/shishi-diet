// 精确诊断 #addBox 折叠状态
const { chromium } = require('playwright');
const EXE = 'C:/Users/25675/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const p = await (await b.newContext({ viewport:{width:390,height:900}, locale:'zh-CN' })).newPage();
  await p.goto('http://127.0.0.1:8777/index.html',{waitUntil:'networkidle'});
  await p.click('nav button[data-t="tab-stock"]');
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const d = document.getElementById('addBox');
    const q = document.getElementById('q');
    const gr = d.querySelector('.grid2');
    return {
      tagName: d.tagName,
      hasOpenAttr: d.hasAttribute('open'),
      detailsOpenProp: d.open,
      qOffsetParent: q.offsetParent === null ? 'null(隐藏)' : q.offsetParent.tagName,
      qRect: JSON.stringify(q.getBoundingClientRect()),
      qVisible: q.getBoundingClientRect().height > 0,
      grid2Height: gr ? Math.round(gr.getBoundingClientRect().height) : null,
      addBoxHeight: Math.round(d.getBoundingClientRect().height),
      // 直接算可见性
      clientH: q.clientHeight,
    };
  });
  console.log(JSON.stringify(r, null, 2));
  await b.close();
})();
