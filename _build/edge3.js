// 核心边界：缺口反推 / 食物推荐 / 最近常吃
// 期望值全部手算，不抄源码公式。
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
const made={},store={};
function mkEl(id){const el={id,_html:'',_text:'',value:'',style:{},dataset:{},_cls:new Set(),children:[],
 get innerHTML(){return this._html},set innerHTML(v){this._html=String(v)},
 get textContent(){return this._text},set textContent(v){this._text=String(v)},
 addEventListener(){},removeEventListener(){},click(){},focus(){},blur(){},select(){},dispatchEvent(){return true},
 appendChild(c){this.children.push(c);return c},removeChild(){},querySelector(){return null},querySelectorAll(){return[]},
 setAttribute(){},getAttribute(){return null},removeAttribute(){},insertAdjacentHTML(){},
 getBoundingClientRect(){return{width:360,height:200,top:0,left:0}},scrollIntoView(){},closest(){return null}};
 el.classList={add:c=>el._cls.add(c),remove:c=>el._cls.delete(c),contains:c=>el._cls.has(c),toggle:c=>el._cls.has(c)?el._cls.delete(c):el._cls.add(c)};return el}
const $=id=>(made[id]||(made[id]=mkEl(id)));
const document={getElementById:$,querySelector:()=>null,querySelectorAll:()=>[],createElement:t=>mkEl('_'+t),
 addEventListener(){},body:mkEl('body'),documentElement:mkEl('html'),readyState:'complete',hidden:false};
const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},clear(){}};
const win={document,localStorage,navigator:{onLine:true},location:{origin:'https://e.com',href:'https://e.com/',protocol:'https:',hostname:'e.com'},
 matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},scrollTo(){},setTimeout:fn=>{fn();return 0},clearTimeout(){},
 setInterval:()=>0,clearInterval(){},requestAnimationFrame:fn=>{fn(0);return 0},
 URL,Number,Math,JSON,Date,String,Array,Object,RegExp,Promise,Error,isNaN,parseFloat,parseInt,Event:function(t){this.type=t},
 alert:m=>{throw new Error('alert:'+m)},confirm:m=>{throw new Error('confirm:'+m)},prompt:m=>{throw new Error('prompt:'+m)},
 fetch:()=>Promise.reject(new Error('off')),Image:function(){},FileReader:function(){this.readAsDataURL=()=>{}},
 console,CSS:{supports:()=>true},caches:{open:()=>Promise.resolve({addAll:()=>Promise.resolve(),put:()=>Promise.resolve(),match:()=>Promise.resolve(null)}),keys:()=>Promise.resolve([]),delete:()=>Promise.resolve(true)}};
win.self=win;win.window=win;win.globalThis=win;
const api=new Function(...Object.keys(win),js+
 ';return {calc,dayTotals,gapToday,dbSuggest,recentFoods,delLog,' +
 'get S(){return S},get FOODS(){return FOODS},get todayStr(){return todayStr}};')(...Object.values(win));
let pass=0,fail=0;
function t(n,f){try{const r=f();console.log((r===false?'✗':'✓')+' '+n);r===false?fail++:pass++;}catch(e){console.log('✗ '+n+' → '+e.message);fail++;}}

/* 档案：70kg / 175cm / 24 岁 / 男 / 活动 1.55
   BMR = 10×70 + 6.25×175 − 5×24 + 5 = 700 + 1093.75 − 120 + 5 = 1678.75 → 1679
   TDEE = 1679 × 1.55 = 2602.45 */
const PROFILE={sex:'m',age:24,w:70,h:175,act:1.55,adj:-500,pk:2};
t('档案算出的每日目标（手算对账）',()=>{
  api.S.profile=PROFILE;api.S.ex={};api.S.log={};
  const c=api.calc();
  console.log('   BMR '+c.bmr+' → TDEE '+c.tdee);
  return c.bmr===1679&&Math.abs(c.tdee-2602)<2;
});

t('gapToday 反推缺口（目标 − 已吃）',()=>{
  api.S.profile=PROFILE;api.S.ex={};api.S.log={};
  // 先记一笔 300 kcal 鸡胸感的食物：蛋白 30g
  const d=api.todayStr();
  api.S.log[d]=[{n:'鸡胸肉',g:150,k:225,p:30,f:7.5,c:0,fb:0}];
  const g=api.gapToday();
  const kcalExp=api.calc().target-225;
  const pExp=api.calc().pg-30;
  console.log('   热量缺口 '+Math.round(g.kcal)+'（期望 '+Math.round(kcalExp)+'）/ 蛋白缺口 '+g.p.toFixed(1)+'（期望 '+pExp.toFixed(1)+'）');
  return Math.abs(g.kcal-kcalExp)<1&&Math.abs(g.p-pExp)<0.5;
});

t('缺蛋白时 dbSuggest 推荐蛋白质类食材',()=>{
  api.S.profile=PROFILE;api.S.log={};api.S.ex={};
  const g=api.gapToday();
  const s=api.dbSuggest(g);
  console.log('   推荐 '+s.food.n+'（'+s.dim+'，约 '+s.need+' g）');
  return s&&s.dim==='p'&&s.food.cat==='protein'&&s.need>0;
});

t('营养都吃够了 → dbSuggest 返回 null（不硬推）',()=>{
  api.S.profile=PROFILE;api.S.ex={};api.S.log={};
  const d=api.todayStr();
  // 吃满：蛋白/纤维/碳水都超过目标
  const c=api.calc();
  api.S.log[d]=[{n:'满汉全席',g:9000,k:c.target+c.pg*4,f:200,c:c.cg+100,fb:c.fb+50,p:c.pg+10}];
  const s=api.dbSuggest(api.gapToday());
  console.log('   结果: '+s);
  return s===null;
});

t('recentFoods 取最近一次的克重',()=>{
  api.S.log={};
  api.S.log['2026-10-18']=[{n:'米饭(熟)',g:150,k:174}];
  api.S.log['2026-10-20']=[{n:'米饭(熟)',g:220,k:255},{n:'西兰花',g:120,k:50}];
  const r=api.recentFoods(8);
  console.log('   顺序: '+r.map(x=>x.n+'@'+x.g).join(', '));
  return r.length===2&&r[0].last==='2026-10-20'&&
         r.find(x=>x.n==='米饭(熟)').g===220&&
         r.find(x=>x.n==='西兰花').g===120;
});

t('recentFoods 空日记 / 空名字不炸',()=>{
  api.S.log={};
  const a=api.recentFoods(8);
  api.S.log={'2026-10-20':[{n:'',g:100},{n:null,g:100},{g:50}]};
  const b=api.recentFoods(8);
  console.log('   空→'+a.length+' 项 / 全空名→'+b.length+' 项');
  return Array.isArray(a)&&a.length===0&&b.length===0;
});

console.log('\n通过 '+pass+' / 失败 '+fail);
process.exit(fail?1:0);
