// 单独放大截图「今日还差」卡片，确认是否真的被底部导航遮挡
const { chromium } = require('playwright');
const path = require('path');
const EXE = 'C:/Users/25675/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = path.join(__dirname, 'shots');
(async () => {
  const b = await chromium.launch({ executablePath: EXE });
  const ctx = await b.newContext({ viewport:{width:390,height:900}, deviceScaleFactor:3, colorScheme:'light', locale:'zh-CN' });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8777/index.html',{waitUntil:'networkidle'});
  await p.evaluate(() => {
    const d=i=>{const t=new Date();t.setDate(t.getDate()-i);
      return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')};
    const inv=[
      {id:'i1',n:'鸡胸肉(生)',k:133,p:19.4,f:5.0,c:2.5,cat:'protein',g:620},
      {id:'i2',n:'鸡蛋(全蛋)',k:144,p:13.3,f:8.8,c:2.8,cat:'protein',g:25},
      {id:'i3',n:'希腊酸奶',k:59,p:10.0,f:0.4,c:3.6,cat:'protein',g:400},
      {id:'i4',n:'糙米饭',k:112,p:2.6,f:0.9,c:23.0,cat:'staple',g:750},
      {id:'i5',n:'燕麦片',k:377,p:15.0,f:6.7,c:61.0,cat:'staple',g:80},
      {id:'i6',n:'西兰花',k:36,p:4.1,f:0.6,c:4.3,cat:'veg',g:300},
      {id:'i7',n:'牛油果',k:171,p:2.0,f:15.3,c:7.4,cat:'fruit',g:180},
      {id:'i8',n:'巴旦木',k:578,p:21.0,f:50.0,c:20.0,cat:'fat',g:60},
    ];
    const log={};
    const plan=[[100,'i1'],[50,'i4'],[150,'i6'],[120,'i1'],[100,'i4'],[200,'i3'],[180,'i1'],[60,'i5'],
                [250,'i6'],[160,'i1'],[100,'i4'],[150,'i3'],[140,'i1'],[100,'i4'],[80,'i7']];
    plan.forEach(([g,iid],k)=>{
      const day=d(Math.floor(k/3)+1); const it=inv.find(v=>v.id===iid); const r=g/100;
      (log[day]=log[day]||[]).push({n:it.n,g,k:it.k*r,p:it.p*r,f:it.f*r,c:it.c*r,iid,
        b:{k:it.k,p:it.p,f:it.f,c:it.c,cat:it.cat}});
    });
    localStorage.setItem('shishi_v2',JSON.stringify({profile:{sex:'m',age:24,h:175,w:70,act:1.55,adj:0,pk:2.0},
      inv,log,ex:{},api:{base:'https://open.bigmodel.cn/api/paas/v4',model:'glm-4v-flash',key:''},theme:''}));
  });
  await p.reload({waitUntil:'networkidle'});
  await p.click('nav button[data-t="tab-stock"]');
  await p.waitForTimeout(700);

  // 找到含「今日还差」的卡片
  const info = await p.evaluate(() => {
    const cards = [...document.querySelectorAll('#stockBox > .card')];
    const g = cards.find(c => c.textContent.includes('今日还差'));
    if (!g) return { found:false, n:cards.length, titles:cards.map(c=>c.textContent.slice(0,14)) };
    const r = g.getBoundingClientRect();
    const nav = document.querySelector('nav').getBoundingClientRect();
    const sugg = g.querySelector('.sugg');
    const sr = sugg ? sugg.getBoundingClientRect() : null;
    const sp = g.querySelector('.sugg span');
    return {
      found:true,
      gapTop:Math.round(r.top), gapBottom:Math.round(r.bottom), gapH:Math.round(r.height),
      navTop:Math.round(nav.top),
      suggRect: sr?{top:Math.round(sr.top),bottom:Math.round(sr.bottom),h:Math.round(sr.height),w:Math.round(sr.width)}:null,
      suggText: sp?sp.textContent:null,
      suggScrollW: sp?sp.scrollWidth:null,
      suggClientW: sp?sp.clientWidth:null,
      cardScrollW:g.scrollWidth, cardClientW:g.clientWidth,
      docScrollW:document.documentElement.scrollWidth, winW:window.innerWidth,
      btnRect: sugg&&sugg.querySelector('.btn-s')?(()=>{const b=sugg.querySelector('.btn-s').getBoundingClientRect();return {left:Math.round(b.left),right:Math.round(b.right)}})():null,
    };
  });
  console.log(JSON.stringify(info,null,2));

  // 截图整页底部区域（含导航栏）看清遮挡关系
  await p.screenshot({ path: path.join(OUT,'gap-viewport.png') });
  await p.evaluate(()=>{ const g=[...document.querySelectorAll('#stockBox > .card')].find(c=>c.textContent.includes('今日还差')); if(g) g.scrollIntoView({block:'center'}); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT,'gap-centered.png') });

  await b.close();
})();
