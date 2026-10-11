// 专门验证「吃光 → 撤销 → 连自定义提醒线一起还原」
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
const store={};
const els={};
function mkEl(id){const e={id,_html:'',value:'',style:{},dataset:{},_cls:new Set(),
 get innerHTML(){return this._html},set innerHTML(v){this._html=String(v)},
 textContent:'',addEventListener(){},removeEventListener(){},click(){},focus(){},blur(){},select(){},
 dispatchEvent(){return true},appendChild(c){return c},removeChild(){},querySelector(){return null},
 querySelectorAll(){return[]},setAttribute(){},getAttribute(){return null},removeAttribute(){},
 insertAdjacentHTML(){},getBoundingClientRect(){return{width:360,height:200,top:0,left:0}},
 scrollIntoView(){},closest(){return null}};
 e.classList={add:c=>e._cls.add(c),remove:c=>e._cls.delete(c),contains:c=>e._cls.has(c),
 toggle:c=>e._cls.has(c)?e._cls.delete(c):e._cls.add(c)};return e}
const $=id=>els[id]||(els[id]=mkEl(id));
const document={getElementById:$,querySelector:()=>null,querySelectorAll:()=>[],
 createElement:t=>mkEl('_'+t),addEventListener(){},body:mkEl('body'),documentElement:mkEl('html'),
 readyState:'complete',hidden:false};
const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},
 removeItem:k=>{delete store[k]},clear(){}};
const win={document,localStorage,navigator:{onLine:true},location:{origin:'https://e.com',href:'https://e.com/',protocol:'https:',hostname:'e.com'},
 matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},scrollTo(){},
 setTimeout:fn=>{fn();return 0},clearTimeout(){},setInterval:()=>0,clearInterval(){},
 requestAnimationFrame:fn=>{fn(0);return 0},URL,Number,Math,JSON,Date,String,Array,Object,RegExp,
 Promise,Error,isNaN,parseFloat,parseInt,Event:function(t){this.type=t},
 alert:m=>{throw new Error('alert:'+m)},confirm:m=>{throw new Error('confirm:'+m)},prompt:m=>{throw new Error('prompt:'+m)},
 fetch:()=>Promise.reject(new Error('off')),Image:function(){},FileReader:function(){this.readAsDataURL=()=>{}},
 console,CSS:{supports:()=>true},
 caches:{open:()=>Promise.resolve({addAll:()=>Promise.resolve(),put:()=>Promise.resolve(),match:()=>Promise.resolve(null)}),
 keys:()=>Promise.resolve([]),delete:()=>Promise.resolve(true)}};
win.self=win;win.window=win;win.globalThis=win;
const A=new Function(...Object.keys(win),js+';return {doEat,delLog,scale,get S(){return S}};')(...Object.values(win));
let pass=0,fail=0;
function t(n,f){try{const r=f();console.log((r===false?'✗':'✓')+' '+n);r===false?fail++:pass++;}catch(e){console.log('✗ '+n+' → '+e.message);fail++}}

console.log('=== 撤销回滚（同一实例，真实状态）===');
t('场景A：吃 200g（未吃光）→ 撤销 → 克重精确还原',()=>{
  A.S.inv=[{id:'a',n:'鸡胸肉',k:133,p:19.4,f:5,c:2.5,cat:'protein',g:500,low:250}];
  A.S.log={};$('eatG').value='200';A.doEat('a');
  const mid=A.S.inv[0].g;
  A.delLog(0);
  const end=A.S.inv[0].g;
  console.log('   500 → 吃后'+mid+' → 撤销后'+end);
  return Math.abs(mid-300)<0.01&&Math.abs(end-500)<0.01});
t('场景B：吃光（条目被移除）→ 撤销 → 条目重建+克重+分类+提醒线全还原',()=>{
  A.S.inv=[{id:'b',n:'鸡蛋(全蛋)',k:144,p:13.3,f:8.8,c:2.8,cat:'protein',g:300,low:80}];
  A.S.log={};$('eatG').value='300';A.doEat('b');
  const gone=A.S.inv.length===0;
  A.delLog(0);
  const back=A.S.inv.find(x=>x.id==='b');
  console.log('   吃光移除='+gone+' → 重建: '+(back?`${back.g}g / ${back.cat} / low=${back.low}`:'失败'));
  return gone&&back&&Math.abs(back.g-300)<0.01&&back.cat==='protein'&&back.low===80});
t('场景C：多次记录后撤销中间一条，其余不受影响',()=>{
  A.S.inv=[{id:'c',n:'A',k:100,p:10,f:1,c:0,cat:'protein',g:1000,low:100}];
  A.S.log={};
  $('eatG').value='100';A.doEat('c');   // 记录0
  $('eatG').value='200';A.doEat('c');   // 记录1
  const g2=A.S.inv[0].g;
  A.delLog(0);                          // 删第一条(100g)
  const g3=A.S.inv[0].g;
  const n=A.S.log[Object.keys(A.S.log)[0]].length;
  console.log('   1000 -100 -200 = '+g2+' → 撤销第一条(100g) → '+g3+'，剩余记录 '+n+' 条');
  return Math.abs(g2-700)<0.01&&Math.abs(g3-800)<0.01&&n===1});
t('场景D：无库存关联的纯记录，撤销不报错',()=>{
  A.S.log={};
  A.S.log['2026-01-01']=[{n:'外食',g:300,k:600,p:20,f:10,c:80}];
  A.delLog(0,'2026-01-01');
  return A.S.log['2026-01-01'].length===0});
t('场景E：删除不存在的索引安全返回',()=>{
  A.S.log={};A.delLog(99);A.delLog(99,'2026-01-01');
  return true});
t('场景F：指定日期删除会退回对应库存',()=>{
  A.S.inv=[{id:'f',n:'A',k:100,p:10,f:1,c:0,cat:'protein',g:100,low:50}];
  A.S.log={'2026-01-01':[{n:'A',g:40,k:40,p:4,f:0.4,c:0,iid:'f',b:{k:100,p:10,f:1,c:0,cat:'protein',low:50}}]};
  A.delLog(0,'2026-01-01');
  console.log('   跨日期撤销 → 库存 '+A.S.inv[0].g+'g，记录 '+A.S.log['2026-01-01'].length+' 条');
  return Math.abs(A.S.inv[0].g-140)<0.01&&A.S.log['2026-01-01'].length===0});
console.log('\n通过 '+pass+' / 失败 '+fail);
process.exit(fail?1:0);
