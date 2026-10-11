/* ============================================================
   识食 · 应用逻辑
   架构：单文件 PWA，零依赖，数据存 localStorage
   ============================================================ */

/* ================= 内置数据（中国食物成分表，每100g可食部，约值） ================= */
const FOODS=[
{n:"鸡胸肉(生)",k:133,p:19.4,f:5.0,c:2.5,cat:"protein"},{n:"鸡蛋(全蛋)",k:144,p:13.3,f:8.8,c:2.8,cat:"protein"},
{n:"鸡蛋白",k:60,p:11.6,f:0.1,c:3.1,cat:"protein"},{n:"鸡蛋黄",k:328,p:15.2,f:28.2,c:3.4,cat:"protein"},
{n:"鸡腿肉(生)",k:181,p:16.0,f:13.0,c:0,cat:"protein"},{n:"鸡翅(生)",k:194,p:17.4,f:14.1,c:0,cat:"protein"},
{n:"牛肉(瘦,生)",k:106,p:20.2,f:2.3,c:1.2,cat:"protein"},{n:"牛里脊(生)",k:107,p:22.2,f:0.9,c:2.4,cat:"protein"},
{n:"猪肉(里脊,生)",k:155,p:20.2,f:7.9,c:0.7,cat:"protein"},{n:"猪瘦肉(生)",k:143,p:20.3,f:6.2,c:1.5,cat:"protein"},
{n:"三文鱼(生)",k:139,p:17.2,f:7.8,c:0,cat:"protein"},{n:"鳕鱼(生)",k:88,p:20.4,f:0.5,c:0.5,cat:"protein"},
{n:"基围虾(生)",k:93,p:18.6,f:0.8,c:2.8,cat:"protein"},{n:"金枪鱼(水浸罐头)",k:99,p:23.6,f:0.6,c:0,cat:"protein"},
{n:"猪肝(生)",k:129,p:19.3,f:3.5,c:5.0,cat:"protein"},
{n:"牛奶(全脂)",k:54,p:3.0,f:3.2,c:3.4,cat:"protein"},{n:"酸奶(无糖)",k:70,p:3.5,f:2.5,c:9.0,cat:"protein"},
{n:"豆浆(无糖)",k:31,p:2.9,f:1.6,c:1.1,cat:"protein"},{n:"豆腐(北)",k:98,p:12.2,f:4.8,c:2.0,cat:"protein"},
{n:"豆腐(嫩/南)",k:57,p:6.2,f:2.5,c:2.4,cat:"protein"},{n:"豆腐干",k:140,p:16.2,f:3.6,c:10.7,cat:"protein"},
{n:"千张(百叶)",k:262,p:24.5,f:16.0,c:5.5,cat:"protein"},{n:"内酯豆腐",k:49,p:5.0,f:1.9,c:3.3,cat:"protein"},
{n:"毛豆(鲜)",k:131,p:13.1,f:5.0,c:10.5,cat:"protein"},{n:"黄豆(干)",k:390,p:35.0,f:16.0,c:34.2,cat:"protein"},
{n:"米饭(熟)",k:116,p:2.6,f:0.3,c:25.9,cat:"staple"},{n:"糙米饭(熟)",k:116,p:2.7,f:0.9,c:24.0,cat:"staple"},
{n:"馒头",k:223,p:7.0,f:1.1,c:47.0,cat:"staple"},{n:"面条(熟)",k:110,p:2.7,f:0.2,c:24.3,cat:"staple"},
{n:"荞麦面(干)",k:340,p:12.0,f:1.5,c:68.0,cat:"staple"},{n:"全麦面包",k:246,p:8.5,f:1.0,c:44.4,cat:"staple"},
{n:"白面包/吐司",k:264,p:8.3,f:3.2,c:48.6,cat:"staple"},{n:"燕麦片(干)",k:377,p:12.1,f:6.7,c:61.6,cat:"staple"},
{n:"红薯/紫薯(生)",k:86,p:1.1,f:0.2,c:20.1,cat:"staple"},{n:"玉米(鲜)",k:112,p:4.0,f:1.2,c:22.8,cat:"staple"},
{n:"土豆(生)",k:77,p:2.0,f:0.2,c:17.5,cat:"staple"},{n:"山药(生)",k:57,p:1.9,f:0.2,c:12.4,cat:"staple"},
{n:"藜麦(熟)",k:120,p:4.4,f:1.9,c:21.3,cat:"staple"},{n:"意面(熟)",k:158,p:5.8,f:0.9,c:30.9,cat:"staple"},
{n:"彩椒/甜椒",k:26,p:1.0,f:0.3,c:5.4,cat:"veg"},{n:"西兰花",k:36,p:4.1,f:0.6,c:4.3,cat:"veg"},
{n:"菠菜",k:28,p:2.6,f:0.3,c:4.5,cat:"veg"},{n:"生菜",k:16,p:1.4,f:0.4,c:2.1,cat:"veg"},
{n:"黄瓜",k:16,p:0.8,f:0.2,c:2.9,cat:"veg"},{n:"西红柿",k:20,p:0.9,f:0.2,c:4.0,cat:"veg"},
{n:"胡萝卜",k:39,p:1.0,f:0.2,c:9.0,cat:"veg"},{n:"洋葱",k:40,p:1.1,f:0.2,c:9.0,cat:"veg"},
{n:"大白菜",k:18,p:1.5,f:0.1,c:3.2,cat:"veg"},{n:"冬瓜",k:12,p:0.4,f:0.2,c:2.6,cat:"veg"},
{n:"茄子",k:23,p:1.1,f:0.2,c:5.4,cat:"veg"},{n:"芹菜(茎)",k:17,p:0.8,f:0.1,c:3.9,cat:"veg"},
{n:"芦笋",k:22,p:2.2,f:0.1,c:4.3,cat:"veg"},{n:"秋葵",k:37,p:2.5,f:0.1,c:8.7,cat:"veg"},
{n:"蘑菇(鲜)",k:24,p:2.7,f:0.1,c:4.1,cat:"veg"},{n:"金针菇(鲜)",k:32,p:2.4,f:0.4,c:6.0,cat:"veg"},
{n:"海带(鲜)",k:13,p:1.2,f:0.1,c:2.1,cat:"veg"},{n:"豆芽(绿豆芽)",k:18,p:2.1,f:0.1,c:2.9,cat:"veg"},
{n:"西葫芦",k:19,p:1.2,f:0.2,c:4.2,cat:"veg"},{n:"南瓜",k:23,p:0.7,f:0.1,c:5.3,cat:"veg"},
{n:"韭菜",k:29,p:2.4,f:0.4,c:4.6,cat:"veg"},{n:"青椒(尖椒)",k:27,p:1.4,f:0.3,c:5.8,cat:"veg"},
{n:"苹果",k:53,p:0.2,f:0.2,c:13.7,cat:"fruit"},{n:"香蕉",k:93,p:1.4,f:0.2,c:22.0,cat:"fruit"},
{n:"橙子",k:48,p:0.8,f:0.2,c:11.1,cat:"fruit"},{n:"蓝莓",k:57,p:0.7,f:0.3,c:14.5,cat:"fruit"},
{n:"猕猴桃",k:61,p:0.8,f:0.6,c:14.5,cat:"fruit"},{n:"西瓜",k:31,p:0.5,f:0.2,c:7.5,cat:"fruit"},
{n:"草莓",k:32,p:1.0,f:0.2,c:7.7,cat:"fruit"},{n:"葡萄",k:45,p:0.5,f:0.2,c:10.3,cat:"fruit"},
{n:"火龙果",k:55,p:1.1,f:0.2,c:13.3,cat:"fruit"},{n:"牛油果",k:171,p:2.0,f:15.3,c:8.6,cat:"fruit"},
{n:"柚子",k:42,p:0.8,f:0.2,c:9.5,cat:"fruit"},{n:"桃子",k:48,p:0.9,f:0.1,c:12.2,cat:"fruit"},
{n:"樱桃",k:46,p:1.1,f:0.2,c:10.2,cat:"fruit"},{n:"梨",k:51,p:0.3,f:0.1,c:13.3,cat:"fruit"},
{n:"花生(炒)",k:581,p:24.1,f:50.6,c:21.2,cat:"fat"},{n:"杏仁",k:578,p:22.5,f:45.4,c:21.7,cat:"fat"},
{n:"核桃",k:646,p:14.9,f:58.8,c:19.1,cat:"fat"},{n:"腰果",k:553,p:18.0,f:44.0,c:30.0,cat:"fat"},
{n:"花生酱(无糖)",k:600,p:25.0,f:50.0,c:20.0,cat:"fat"},{n:"橄榄油",k:899,p:0,f:99.9,c:0,cat:"fat"},
{n:"花生油",k:899,p:0,f:99.9,c:0,cat:"fat"},{n:"蜂蜜",k:321,p:0.3,f:1.9,c:82.4,cat:"other"},
{n:"乳清蛋白粉",k:375,p:75.0,f:5.0,c:8.0,cat:"other"},{n:"黑巧克力(70%)",k:550,p:7.0,f:40.0,c:45.0,cat:"other"},
{n:"火腿肠",k:212,p:11.3,f:17.0,c:5.0,cat:"other"},{n:"鸡胸肉肠(低脂)",k:120,p:20.0,f:3.0,c:4.0,cat:"other"}
];
const CAT_LABEL={protein:"蛋白质类",staple:"主食",veg:"蔬菜",fruit:"水果",fat:"油脂坚果",other:"其他"};
const CAT_ORDER=["protein","staple","veg","fruit","fat","other"];

const EXERCISES=[
{n:"慢跑 8km/h",m:8.3},{n:"慢跑 10km/h",m:9.8},{n:"快走 5.5km/h",m:4.3},
{n:"快走 6.5km/h",m:5.4},{n:"游泳(自由泳)",m:8.0},{n:"游泳(蛙泳)",m:6.0},
{n:"骑行(休闲 20km/h)",m:6.8},{n:"骑行(快速 25km/h+)",m:10.0},
{n:"力量训练(中等强度)",m:5.0},{n:"力量训练(高强度)",m:6.5},
{n:"跳绳",m:12.0},{n:"HIIT/波比跳",m:8.0},{n:"篮球",m:6.0},
{n:"足球",m:7.0},{n:"羽毛球",m:5.5},{n:"瑜伽",m:3.0},
{n:"椭圆机",m:5.5},{n:"爬楼梯",m:9.0},{n:"舞蹈",m:4.8},{n:"拳击/搏击",m:7.8}
];

/* ================= 图标系统 ================= */
const ICON_PATHS={
  today:'<path d="M3 20h18"/><rect x="5" y="11" width="3.2" height="7" rx="1"/><rect x="10.4" y="7" width="3.2" height="11" rx="1"/><rect x="15.8" y="13" width="3.2" height="5" rx="1"/>',
  stock:'<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M12 11.5 20 7"/><path d="M12 11.5v8.5"/><path d="M12 11.5 4 7"/>',
  scan:'<path d="M3 8.5V6a2 2 0 0 1 2-2h2.5"/><path d="M16.5 4H19a2 2 0 0 1 2 2v2.5"/><path d="M21 15.5V18a2 2 0 0 1-2 2h-2.5"/><path d="M7.5 20H6a2 2 0 0 1-2-2v-2.5"/><circle cx="12" cy="12" r="3.2"/>',
  me:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/>',
  plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  trash:'<path d="M4 7h16"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  check:'<path d="M4.5 12.5l5 5 10-11"/>',
  bolt:'<path d="M13 3 5 13.5h6L11 21l8-10.5h-6z"/>',
  flame:'<path d="M12 3s5 5 5 9.5a5 5 0 0 1-10 0C7 9 12 3 12 3z"/>',
  alert:'<path d="M12 4 3 19h18z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
  moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  box:'<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M12 11.5 20 7"/><path d="M12 11.5v8.5"/><path d="M12 11.5 4 7"/>',
  refresh:'<path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  scale:'<path d="M12 4v16"/><path d="M6 8h12"/><path d="M6 8 4 14a3 3 0 0 0 4 0z"/><path d="M18 8l-2 6a3 3 0 0 0 4 0z"/>'
};
function ic(name,size=24,extra=''){
  return `<svg class="ic-svg" ${extra} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]||''}</svg>`;
}

/* ================= 状态 ================= */
const KEY="shishi_v2";
let S=load();
function load(){
  // 兼容旧版数据
  try{const old=localStorage.getItem("shishi_v1");
    if(old&&!localStorage.getItem(KEY)){const o=JSON.parse(old);o.api=o.api||{base:"",model:"",key:""};localStorage.setItem(KEY,JSON.stringify(o))}
  }catch(e){}
  try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch(e){}
  return {profile:null,inv:[],log:{},ex:{},api:{base:"https://open.bigmodel.cn/api/paas/v4",model:"glm-4v-flash",key:""},theme:""};
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast("存储空间不足")}}
function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const $=id=>document.getElementById(id);
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),2200)}
function closeSheet(){$("ovl").classList.remove("on")}
function sheet(html){$("sheet").innerHTML=html;$("ovl").classList.add("on")}

/* ================= 主题 ================= */
function applyTheme(){
  const t=S.theme||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
  document.documentElement.style.colorScheme=t;
  const b=$("themeBtn");if(b)b.innerHTML=ic(t==="dark"?"sun":"moon",20);
}
function toggleTheme(){S.theme=(S.theme==="dark"||(!S.theme&&matchMedia("(prefers-color-scheme:dark)").matches))?"light":"dark";save();applyTheme()}

/* ================= 计算（含边界约束） ================= */
function calc(){
  const p=S.profile;if(!p||!p.w||!p.h||!p.age)return null;
  const bmr=10*p.w+6.25*p.h-5*p.age+(p.sex==="m"?5:-161);
  const tdee=bmr*p.act;
  const exK=(S.ex[todayStr()]||[]).reduce((a,e)=>a+e.kcal,0);
  // 目标热量下限保护：不低于 BMR 的 1.1 倍，避免极端节食
  const raw=tdee+exK+Number(p.adj);
  const floor=bmr*1.1;
  const target=Math.round(Math.max(raw,floor));
  const floorApplied=raw<floor;
  // 蛋白质上限：不超过总热量 35%
  let pg=Math.round(p.pk*p.w);
  const pgCap=Math.round(target*0.35/4);
  const pgCapped=pg>pgCap; if(pgCapped)pg=pgCap;
  // 脂肪：25% 热量，但不低于 0.5g/kg 体重（必需脂肪酸）
  const fk=target*0.25;
  let fg=Math.round(fk/9);
  const fgFloor=Math.round(p.w*0.5); if(fg<fgFloor)fg=fgFloor;
  // 碳水：剩余热量，且不低于 0
  const cg=Math.max(0,Math.round((target-pg*4-fg*9)/4));
  return {bmr:Math.round(bmr),tdee:Math.round(tdee),exK:Math.round(exK),target,pg,fg,cg,floorApplied,pgCapped};
}
function dayTotals(){const l=S.log[todayStr()]||[];return l.reduce((a,e)=>{a.k+=e.k;a.p+=e.p;a.f+=e.f;a.c+=e.c;return a},{k:0,p:0,f:0,c:0})}
function scale(o,g){const r=(g||0)/100;return {k:(o.k||0)*r,p:(o.p||0)*r,f:(o.f||0)*r,c:(o.c||0)*r}}

/* ================= 页面切换 ================= */
function go(id){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("on"));
  $(id).classList.add("on");
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===id));
  if(id==="tab-today")renderToday();
  if(id==="tab-stock")renderStock();
  if(id==="tab-me")renderMe();
  window.scrollTo(0,0);
}

/* ================= 今日 ================= */
function renderToday(){
  const c=calc(),t=dayTotals(),d=todayStr();
  let h="";
  if(!S.profile){
    h+=`<div class="card"><div class="empty">${ic("scale",40,'style="color:var(--line-2);margin:0 auto 14px"')}
      <div class="steps">
        <span><b class="stepnum">1</b>去「我的」填身体数据</span>
        <span><b class="stepnum">2</b>去「拍照」或「库存」添加食物</span>
        <span><b class="stepnum">3</b>回来看每天该吃多少、吃了多少</span>
      </div></div></div>`;
    $("todayBox").innerHTML=h;return;
  }
  const pct=c.target?Math.min(100,Math.round(t.k/c.target*100)):0;
  const over=t.k>c.target;
  const bar=(v,tg,col)=>{const p=tg?Math.min(100,Math.round(v/tg*100)):0;return `<div class="bar"><i style="width:${p}%;background:${col}"></i></div>`};
  const mm=(v,tg,col,label)=>{const p=tg?Math.min(100,Math.round(v/tg*100)):0;return `<div class="mac"><span class="lbl"><i class="dot" style="background:${col}"></i>${label}</span><div class="bar"><i style="width:${p}%;background:${col}"></i></div><em>${Math.round(v)} / ${tg} g</em></div>`};

  h+=`<div class="card">
    <div class="ring" style="--p:${pct};--rc:${over?'var(--danger)':'var(--accent)'}"><div><b>${Math.round(t.k)}</b><span>/ ${c.target} kcal · ${pct}%</span></div></div>
    <div class="hint" style="justify-content:center;margin-top:12px"><span>基础代谢 ${c.bmr} ＋ 日常 ${c.tdee-c.bmr} ＋ 训练 ${c.exK}${Number(S.profile.adj)?` ${S.profile.adj>0?"＋":"−"} ${Math.abs(S.profile.adj)} 目标调整`:""}</span></div>
    ${c.floorApplied?`<div class="hint" style="margin-top:8px;color:var(--warn)">${ic("alert",14)}<span>已应用热量下限保护（不低于基础代谢 1.1 倍），避免过度节食</span></div>`:""}
    ${c.pgCapped?`<div class="hint" style="margin-top:8px">${ic("info",14)}<span>蛋白质目标已限制在总热量 35% 以内</span></div>`:""}
    ${mm(t.p,c.pg,"var(--d-protein)","蛋白")}
    ${mm(t.f,c.fg,"var(--d-fat)","脂肪")}
    ${mm(t.c,c.cg,"var(--d-carb)","碳水")}
  </div>`;

  const rm=c.target-t.k;
  h+=`<div class="card remain">
    <div>
      <div class="hint" style="margin:0"><span>${rm>=0?"今天还可以吃":"已超出"}</span></div>
      <div class="rmk" style="color:${rm>=0?"var(--ink)":"var(--danger)"}">${Math.abs(Math.round(rm))}<span class="unit">kcal</span></div>
      <div class="hint" style="margin-top:2px"><span>蛋白质还差 ${Math.max(0,Math.round(c.pg-t.p))} g</span></div>
    </div>
    <button class="btn-g" style="width:auto;padding:13px 20px" onclick="quickSheet()">${ic("bolt",18)}快速记录</button>
  </div>`;

  const l=S.log[d]||[];
  h+=`<div class="card"><h3>${ic("stock",18)}今日饮食<span class="count">${l.length} 笔</span></h3>`;
  if(!l.length)h+=`<div class="empty">${ic("stock",32,'style="color:var(--line-2);margin:0 auto 8px"')}还没记录<br>去「库存」点「吃掉」</div>`;
  h+=l.map((e,i)=>`<div class="item"><div><div class="nm">${esc(e.n)}<span class="g">${e.g}g</span></div>
     <div class="dt">P ${e.p.toFixed(1)} · F ${e.f.toFixed(1)} · C ${e.c.toFixed(1)} g</div></div>
     <div style="display:flex;align-items:center;gap:10px"><span class="tagk">${Math.round(e.k)} kcal</span>
     <button class="btn-r" onclick="delLog(${i})">删</button></div></div>`).join("");
  h+=`</div>`;

  const ex=S.ex[d]||[];
  if(ex.length){
    h+=`<div class="card"><h3>${ic("flame",18)}今日训练<span class="count">${ex.length} 项</span></h3>`
      +ex.map((e,i)=>`<div class="item"><div class="nm">${esc(e.n)}<span class="g">${e.min} 分钟</span></div>
       <div style="display:flex;align-items:center;gap:10px"><span class="tagk" style="color:var(--accent)">−${Math.round(e.kcal)} kcal</span><button class="btn-r" onclick="delEx(${i})">删</button></div></div>`).join("")
      +`</div>`;
  }
  h+=weekChart(c);
  $("todayBox").innerHTML=h;
}
function delLog(i){
  const d=todayStr();const e=S.log[d][i];
  if(e.iid){
    const it=S.inv.find(x=>x.id===e.iid);
    if(it)it.g=Math.round((it.g+e.g)*10)/10;
    else if(e.b)S.inv.push({id:e.iid,n:e.n,g:e.g,k:e.b.k,p:e.b.p,f:e.b.f,c:e.b.c,cat:e.b.cat});
  }
  S.log[d].splice(i,1);save();renderToday();
  toast(e.iid?"已删除，退回库存":"已删除");
}
function dstr(o){const d=new Date();d.setDate(d.getDate()-o);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function weekChart(c){
  const base=c.tdee+Number(S.profile.adj),days=[],td=todayStr();
  for(let i=6;i>=0;i--){const k=dstr(i);days.push({k,v:(S.log[k]||[]).reduce((a,e)=>a+e.k,0)})}
  const mx=Math.max(base,...days.map(x=>x.v))||1;
  const names=["日","一","二","三","四","五","六"];
  return `<div class="card"><h3>${ic("today",18)}近 7 天热量</h3><div class="wk">`
    +days.map(x=>{
      const dt=new Date(x.k+"T00:00:00");
      return `<div class="wc${x.k===td?' today':''}"><span class="v">${x.v?Math.round(x.v):""}</span>
      <i style="height:${Math.round(x.v/mx*80)}px;background:${x.v>base*1.1?'var(--warn)':'var(--accent)'}"></i>
      <span class="d">${names[dt.getDay()]}</span></div>`}).join("")
    +`</div><div class="hint"><span>日常目标（不含训练）≈ ${Math.round(base)} kcal · 琥珀色 = 超标</span></div></div>`;
}
function quickSheet(){
  sheet(`<h3>快速记录</h3><div class="fld"><label>搜索食物（不用先入库存）</label><input id="qq" placeholder="米饭 / 鸡蛋 / 苹果" autocomplete="off"></div><div id="qr"></div><button class="btn-o" onclick="closeSheet()">关闭</button>`);
  $("qq").oninput=function(){
    const v=this.value.trim().toLowerCase();
    $("qr").innerHTML=v?FOODS.map((x,i)=>[x,i]).filter(a=>a[0].n.toLowerCase().includes(v)).slice(0,8)
      .map(a=>`<div class="item" onclick="quickPick(${a[1]})" style="cursor:pointer"><div class="nm">${esc(a[0].n)}</div><span class="tagk" style="color:var(--ink-3)">${a[0].k} kcal/100g</span></div>`).join("")
      :"";
  };
  setTimeout(()=>$("qq").focus(),120);
}
function quickPick(i){
  const x=FOODS[i];
  sheet(`<h3>${esc(x.n)}</h3><div class="fld"><label>吃了多少克</label><input id="qg" type="number" inputmode="decimal" value="100"></div>
    <div class="btnrow"><button class="btn-o" onclick="quickSheet()">返回</button><button class="btn-g" onclick="quickEat(${i})">记录</button></div>`);
  setTimeout(()=>$("qg").select(),120);
}
function quickEat(i){
  const x=FOODS[i],g=parseFloat($("qg").value)||0;
  if(g<=0){toast("克重要大于 0");return}
  const r=scale(x,g),d=todayStr();
  (S.log[d]=S.log[d]||[]).push({n:x.n,g:g,k:r.k,p:r.p,f:r.f,c:r.c});
  save();closeSheet();renderToday();toast("已记录");
}
function delEx(i){const d=todayStr();S.ex[d].splice(i,1);save();renderToday()}

/* ================= 库存 ================= */
function invTotals(){
  let k=0,p=0,f=0,c=0;
  S.inv.forEach(it=>{const r=scale(it,it.g);k+=r.k;p+=r.p;f+=r.f;c+=r.c});
  return {k,p,f,c};
}
function renderStock(){
  // 低量提醒
  const low=S.inv.filter(it=>it.g<=100);
  const al=$("stockAlert");
  if(low.length){
    al.innerHTML=`<div class="card" style="border-color:var(--warn);background:var(--warn-soft)">
      <div style="display:flex;gap:9px;align-items:flex-start;color:var(--warn)">
        ${ic("alert",18,'style="margin-top:1px"')}
        <div style="flex:1">
          <div style="font-size:13.5px;font-weight:600">${low.length} 样快吃完了</div>
          <div style="font-size:12.5px;margin-top:3px;color:var(--ink-2)">${low.slice(0,4).map(x=>esc(x.n)+" "+x.g+"g").join(" · ")}${low.length>4?` 等 ${low.length} 样`:""}</div>
        </div>
      </div></div>`;
  } else al.innerHTML="";

  let h=`<div class="card"><h3>${ic("box",18)}我的库存<span class="count">${S.inv.length} 样</span></h3>`;
  if(!S.inv.length){
    h+=`<div class="empty">${ic("box",32,'style="color:var(--line-2);margin:0 auto 8px"')}库存是空的<br>去超市买完东西，拍照识别后加进来</div>`;
  } else {
    // 按分类分组
    CAT_ORDER.forEach(cat=>{
      const items=S.inv.filter(it=>it.cat===cat);
      if(!items.length)return;
      h+=`<div class="grp-title">${CAT_LABEL[cat]}<span style="color:var(--line-2)">·</span>${items.length}</div>`;
      h+=items.map(it=>{
        const r=scale(it,it.g);
        const lowFlag=it.g<=100;
        return `<div class="item inv"><div>
          <div class="nm">${esc(it.n)}${lowFlag?`<span class="chip warn">快用完</span>`:""}</div>
          <div class="dt">剩余 ${it.g} g ｜ P ${r.p.toFixed(1)} · F ${r.f.toFixed(1)} · C ${r.c.toFixed(1)} g</div>
          <div class="tagk" style="margin-top:3px">${Math.round(r.k)} kcal</div></div>
          <div class="btns">
            <button class="btn-s" style="background:var(--accent-soft);color:var(--accent);border-color:transparent" onclick="eatSheet('${it.id}')">吃掉</button>
            <button class="btn-s" onclick="restockSheet('${it.id}')">补货</button>
            <button class="btn-r" onclick="delInvAsk('${it.id}')">删除</button>
          </div></div>`}).join("");
    });
    const t=invTotals();
    h+=`<div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line-2)">
      <div class="hint" style="margin:0 0 6px"><span>库存剩余营养合计</span></div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:13.5px;font-variant-numeric:tabular-nums">
        <span><b style="color:var(--accent)">${Math.round(t.k)}</b> <span style="color:var(--ink-3)">kcal</span></span>
        <span><b style="color:var(--d-protein)">${t.p.toFixed(1)}</b> <span style="color:var(--ink-3)">蛋白 g</span></span>
        <span><b style="color:var(--d-fat)">${t.f.toFixed(1)}</b> <span style="color:var(--ink-3)">脂肪 g</span></span>
        <span><b style="color:var(--d-carb)">${t.c.toFixed(1)}</b> <span style="color:var(--ink-3)">碳水 g</span></span>
      </div></div>`;
  }
  h+=`</div>`;
  $("stockBox").innerHTML=h;
}
function eatSheet(id){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  const quicks=[it.g*0.25,it.g*0.5,it.g*0.75,it.g].map(g=>Math.round(g)).filter((g,i,a)=>g>0&&a.indexOf(g)===i);
  sheet(`<h3>吃掉<span class="hl">${esc(it.n)}</span></h3>
    <div class="fld"><label>剩余 ${it.g} g，本次吃多少 (g)</label><input id="eatG" type="number" inputmode="decimal" value="${it.g>=100?100:it.g}"></div>
    <div class="btnrow" style="margin-bottom:12px">${quicks.map(g=>`<button class="btn-s" onclick="setEat(${g})">${g}g</button>`).join("")}</div>
    <div class="chip neutral" id="eatPrev" style="margin-bottom:14px"></div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-g" onclick="doEat('${id}')">确认吃掉</button></div>`);
  const upd=()=>{
    const g=parseFloat($("eatG").value)||0,r=scale(it,g);
    $("eatPrev").textContent=`≈ ${Math.round(r.k)} kcal · 蛋白 ${r.p.toFixed(1)} · 脂肪 ${r.f.toFixed(1)} · 碳水 ${r.c.toFixed(1)} g`;
  };
  $("eatG").oninput=upd;upd();
  setTimeout(()=>$("eatG").select(),120);
}
function setEat(g){$("eatG").value=g;$("eatG").dispatchEvent(new Event("input"))}
function doEat(id){
  const it=S.inv.find(x=>x.id===id);const g=parseFloat($("eatG").value)||0;
  if(g<=0){toast("克重要大于 0");return}
  if(g>it.g){toast("吃的比剩的多，请先补货");return}
  const r=scale(it,g),d=todayStr();
  S.log[d]=S.log[d]||[];
  S.log[d].push({n:it.n,g:g,k:r.k,p:r.p,f:r.f,c:r.c,iid:it.id,b:{k:it.k,p:it.p,f:it.f,c:it.c,cat:it.cat}});
  it.g=Math.round((it.g-g)*10)/10;
  if(it.g<=0)S.inv=S.inv.filter(x=>x.id!==id);
  save();closeSheet();renderStock();toast("已记录，库存已扣减");
}
function restockSheet(id){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  const quicks=[100,250,500,1000];
  sheet(`<h3>给<span class="hl">${esc(it.n)}</span>补货</h3>
    <div class="fld"><label>当前剩余 ${it.g} g，补多少 (g)</label><input id="rsG" type="number" inputmode="decimal" value="500"></div>
    <div class="btnrow" style="margin-bottom:14px">${quicks.map(g=>`<button class="btn-s" onclick="$('rsG').value=${g}">${g}g</button>`).join("")}</div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-g" onclick="doRestock('${id}')">确认补货</button></div>`);
  setTimeout(()=>$("rsG").select(),120);
}
function doRestock(id){
  const it=S.inv.find(x=>x.id===id);const g=parseFloat($("rsG").value)||0;
  if(g<=0){toast("克重要大于 0");return}
  it.g=Math.round((it.g+g)*10)/10;save();closeSheet();renderStock();toast("已补货，现有 "+it.g+" g");
}
function delInvAsk(id){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  sheet(`<h3>删除库存？</h3>
    <div class="hint" style="margin-bottom:14px"><span>将从库存移除「${esc(it.n)}」（剩余 ${it.g} g）。已记录的饮食不受影响。</span></div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-r" style="flex:1" onclick="doDelInv('${id}')">确认删除</button></div>`);
}
function doDelInv(id){S.inv=S.inv.filter(x=>x.id!==id);save();closeSheet();renderStock();toast("已删除")}

/* ================= 搜索添加 ================= */
let pickFood=null;
$("q").addEventListener("input",function(){
  const v=this.value.trim().toLowerCase(),box=$("sug");
  if(!v){box.style.display="none";pickFood=null;return}
  const hits=FOODS.filter(x=>x.n.toLowerCase().includes(v)).slice(0,12);
  if(!hits.length){box.innerHTML=`<div style="color:var(--ink-3)"><span class="sn">没找到「${esc(this.value)}」</span><span class="sv">试试别的词</span></div>`;box.style.display="block";return}
  box.innerHTML=hits.map(x=>`<div onclick="pick(${FOODS.indexOf(x)})"><span class="sn">${esc(x.n)}</span><span class="sv">${x.k} kcal · P${x.p}</span></div>`).join("");
  box.style.display="block";
});
function pick(i){pickFood=FOODS[i];$("q").value=pickFood.n;$("sug").style.display="none";$("addG").focus()}
function addFromDb(){
  if(!pickFood){toast("先搜索并点选一个食物");return}
  const g=parseFloat($("addG").value)||0;
  if(g<=0){toast("填总克重");return}
  S.inv.push({id:uid(),n:pickFood.n,g:g,k:pickFood.k,p:pickFood.p,f:pickFood.f,c:pickFood.c,cat:pickFood.cat});
  save();$("q").value="";$("addG").value="";pickFood=null;$("sug").style.display="none";
  renderStock();toast("已加入库存");
}
document.addEventListener("click",e=>{if(!e.target.closest(".searchbox")){const s=$("sug");if(s)s.style.display="none"}});

/* ================= 拍照识别 ================= */
let curImg=null;
$("photo").addEventListener("change",function(){
  const file=this.files[0];if(!file)return;
  const rd=new FileReader();
  rd.onload=e=>{
    curImg=e.target.result;
    $("prevBox").innerHTML=`<img class="prev" src="${curImg}" alt="待识别图片">
      <button class="btn-g" id="doScan" onclick="doScan()">${ic("search",18)}开始识别</button>
      <div class="hint" id="scanMsg" style="margin-top:8px"></div>`;
    $("scanResult").style.display="none";
  };
  rd.readAsDataURL(file);
});
function openManual(){
  $("scanResult").style.display="block";
  $("scanResult").scrollIntoView({behavior:"smooth",block:"center"});
}
function applyPreset(){
  const P={
    zhipu:["https://open.bigmodel.cn/api/paas/v4","glm-4v-flash"],
    qwen:["https://dashscope.aliyuncs.com/compatible-mode/v1","qwen-vl-plus"],
    openai:["https://api.openai.com/v1","gpt-4o-mini"]
  }[$("apiPreset").value];
  if(P){$("apiBase").value=P[0];$("apiModel").value=P[1]}
}
function saveApi(){
  S.api={base:$("apiBase").value.trim(),model:$("apiModel").value.trim(),key:$("apiKey").value.trim()};
  save();toast("设置已保存");
}
async function doScan(){
  if(!S.api.key){toast("先填 API Key");$("apiBox").open=true;$("apiBox").scrollIntoView({behavior:"smooth"});return}
  if(!curImg){toast("先拍照");return}
  const mode=$("scanMode").value;
  const sys=mode==="pack"
    ?`你是中文食品营养成分表识别专家。用户上传包装食品的配料表/营养成分表照片。请以每100g可食部为基准提取：热量(千卡)、蛋白质(g)、脂肪(g)、碳水化合物(g)。若表中标注的是每份含量，请根据每份克重换算为每100g。只返回JSON，格式：{"name":"具体商品名","energy":数值,"protein":数值,"fat":数值,"carbs":数值}`
    :`你是食物营养估算专家。用户上传新鲜食材照片，请识别具体食材（如彩椒、鸡蛋、西兰花），给出可食部每100g的估算值：热量(千卡)、蛋白质(g)、脂肪(g)、碳水化合物(g)。数值参考《中国食物成分表》。只返回JSON，格式：{"name":"食材名","energy":数值,"protein":数值,"fat":数值,"carbs":数值}`;
  const btn=$("doScan");btn.disabled=true;
  $("scanMsg").innerHTML=`<span>识别中，请稍候…</span>`;
  try{
    const res=await fetch(S.api.base.replace(/\/+$/,"")+"/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+S.api.key},
      body:JSON.stringify({model:S.api.model,messages:[
        {role:"system",content:sys},
        {role:"user",content:[{type:"text",text:"请识别这张图"},{type:"image_url",image_url:{url:await shrink(curImg)}}]}]})
    });
    if(!res.ok){const t=await res.text();throw new Error("HTTP "+res.status+"："+t.slice(0,120))}
    const data=await res.json();
    const txt=data.choices[0].message.content;
    const m=txt.match(/\{[\s\S]*\}/);
    if(!m)throw new Error("模型没有返回 JSON："+txt.slice(0,80));
    const j=JSON.parse(m[0]);
    $("rN").value=j.name||"";$("rK").value=j.energy??"";$("rP").value=j.protein??"";
    $("rF").value=j.fat??"";$("rC").value=j.carbs??"";
    $("scanResult").style.display="block";
    $("scanMsg").innerHTML=`<span style="color:var(--accent)">识别成功，请核对数值</span>`;
    $("scanResult").scrollIntoView({behavior:"smooth",block:"center"});
  }catch(err){
    $("scanMsg").innerHTML=`<span style="color:var(--danger)">${esc(err.message)}</span><br><span style="color:var(--ink-3)">若提示跨域/CORS，请换支持浏览器直连的接口</span>`;
  }
  btn.disabled=false;
}
function shrink(src,max=1024){
  return new Promise(ok=>{
    const im=new Image();
    im.onload=()=>{
      const s=Math.min(1,max/Math.max(im.width,im.height));
      const cv=document.createElement("canvas");
      cv.width=im.width*s;cv.height=im.height*s;
      cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);
      ok(cv.toDataURL("image/jpeg",.82));
    };
    im.onerror=()=>ok(src);
    im.src=src;
  });
}
function readR(){
  return {n:$("rN").value.trim(),k:parseFloat($("rK").value)||0,p:parseFloat($("rP").value)||0,
    f:parseFloat($("rF").value)||0,c:parseFloat($("rC").value)||0,g:parseFloat($("rG").value)||0};
}
function aiToStock(){
  const r=readR();if(!r.n||r.g<=0){toast("填名称和克重");return}
  S.inv.push({id:uid(),n:r.n,g:r.g,k:r.k,p:r.p,f:r.f,c:r.c,cat:"other"});
  save();toast("已加入库存");$("scanResult").style.display="none";
}
function aiToLog(){
  const r=readR();if(!r.n||r.g<=0){toast("填名称和克重");return}
  const s={k:r.k,p:r.p,f:r.f,c:r.c},sc=scale(s,r.g),d=todayStr();
  S.log[d]=S.log[d]||[];
  S.log[d].push({n:r.n,g:r.g,k:sc.k,p:sc.p,f:sc.f,c:sc.c});
  save();toast("已记入今日");$("scanResult").style.display="none";go("tab-today");
}

/* ================= 我的 ================= */
function renderMe(){
  const p=S.profile;
  if(p){$("pSex").value=p.sex;$("pAge").value=p.age;$("pH").value=p.h;$("pW").value=p.w;$("pAct").value=p.act;$("pAdj").value=p.adj;$("pPk").value=p.pk}
  $("eN").innerHTML=EXERCISES.map(e=>`<option value="${e.m}">${e.n}（MET ${e.m}）</option>`).join("");
  const c=calc();
  $("pResult").innerHTML=c?`<div style="display:flex;gap:8px;flex-wrap:wrap">
    <span class="pill">基础代谢 <b>${c.bmr}</b> kcal</span>
    <span class="pill">全天消耗 <b>${c.tdee+c.exK}</b> kcal</span>
    <span class="pill" style="background:var(--accent-soft);border-color:transparent;color:var(--accent)">今日目标 <b style="color:var(--accent)">${c.target}</b> kcal</span></div>
    <div class="hint" style="margin-top:10px"><span>蛋白质 ${c.pg} g · 脂肪 ${c.fg} g · 碳水 ${c.cg} g</span></div>`
    :`<div class="hint"><span>填好后自动算出每日热量与三大营养素目标</span></div>`;
  const ex=S.ex[todayStr()]||[];
  $("exList").innerHTML=ex.length
    ?ex.map(e=>`<span class="pill">${esc(e.n)} ${e.min}min <b style="color:var(--accent)">−${Math.round(e.kcal)}kcal</b></span>`).join("")
    :`<div class="hint"><span>今天的训练会加成到每日热量目标上</span></div>`;
  const a=S.api;$("apiBase").value=a.base;$("apiModel").value=a.model;$("apiKey").value=a.key;
}
function saveProfile(){
  const p={sex:$("pSex").value,age:parseFloat($("pAge").value)||0,h:parseFloat($("pH").value)||0,
    w:parseFloat($("pW").value)||0,act:parseFloat($("pAct").value),adj:parseFloat($("pAdj").value),pk:parseFloat($("pPk").value)};
  if(!p.age||!p.h||!p.w){toast("请填完整");return}
  if(p.age<10||p.age>100){toast("年龄请填 10–100");return}
  if(p.h<100||p.h>250){toast("身高请填 100–250 cm");return}
  if(p.w<25||p.w>300){toast("体重请填 25–300 kg");return}
  S.profile=p;save();renderMe();toast("已保存");
}
function addEx(){
  if(!S.profile){toast("先填身体数据");return}
  const min=parseFloat($("eMin").value)||0;
  if(min<=0){toast("填时长");return}
  if(min>600){toast("单次时长请小于 600 分钟");return}
  const met=parseFloat($("eN").value),name=$("eN").selectedOptions[0].textContent.split("（")[0];
  const kcal=met*S.profile.w*(min/60),d=todayStr();
  S.ex[d]=S.ex[d]||[];
  S.ex[d].push({n:name,min:min,kcal:kcal});
  save();$("eMin").value="";renderMe();toast("训练已记录，目标已上调");
}

/* ================= 数据 ================= */
function exportData(){
  const blob=new Blob([JSON.stringify({...S,api:{...S.api,key:""}},null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="shishi-backup-"+todayStr()+".json";
  a.click();
}
function importData(ev){
  const f=ev.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=e=>{
    try{
      const o=JSON.parse(e.target.result);
      o.api=S.api;S=o;save();renderMe();
      toast("导入成功");
    }catch(err){toast("文件格式不对")}
  };
  rd.readAsText(f);
}
function resetAll(){
  sheet(`<h3>清空所有数据？</h3>
    <div class="hint" style="margin-bottom:14px"><span>将删除全部身体数据、库存和饮食记录，<b style="color:var(--danger)">不可恢复</b>。建议先导出备份。</span></div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-r" style="flex:1" onclick="doReset()">确认清空</button></div>`);
}
function doReset(){localStorage.removeItem(KEY);location.reload()}

/* ================= 启动 ================= */
(function boot(){
  const names=["日","一","二","三","四","五","六"];
  const d=new Date();
  $("hdDate").textContent=`${todayStr()} 周${names[d.getDay()]} · 拍照识别 · 库存管理 · 每日热量`;
  // 注入导航图标
  const navIcons={ "tab-today":"today","tab-stock":"stock","tab-scan":"scan","tab-me":"me" };
  document.querySelectorAll("nav button").forEach(b=>{
    const s=b.querySelector(".ic-nav");
    if(s)s.outerHTML=ic(navIcons[b.dataset.t]||"today",22);
  });
  applyTheme();
  go("tab-today");   // 激活默认页（.tab 默认 display:none，必须走 go 才会显示）
  if("serviceWorker" in navigator&&location.protocol.indexOf("http")===0){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
})();
