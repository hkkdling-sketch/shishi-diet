// 删除记录的边界：删中间一条、删最后一条、删别日期的
// 库存已删除（2026-10-20），删除路径只剩「从当天 log 里拿掉一条」。
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
const A=new Function(...Object.keys(win),js+';return {delLog,recentFoods,scale,dayTotals,get S(){return S},get todayStr(){return todayStr}};')(...Object.values(win));
let pass=0,fail=0;
function t(n,f){try{const r=f();console.log((r===false?'✗':'✓')+' '+n);r===false?fail++:pass++;}catch(e){console.log('✗ '+n+' → '+e.message);fail++}}

console.log('=== 删除记录的边界情况 ===');
t('场景A：删中间一条，其余记录和热量不受影响',()=>{
  const d=A.todayStr();
  A.S.log={};
  A.S.log[d]=[
    {n:'米饭(熟)',g:150,k:174,p:3.9,f:0.45,c:38.85,fb:0.45},
    {n:'西兰花',g:120,k:50,p:3.8,f:2.2,c:6.1,fb:3.12},
    {n:'鸡胸肉(生)',g:100,k:133,p:19.4,f:5,c:2.5,fb:0},
  ];
  A.delLog(1);                          // 删西兰花
  const list=A.S.log[d];
  console.log('   剩 '+list.length+' 条 / 总热量 '+Math.round(A.dayTotals().k)+' kcal');
  return list.length===2&&list[0].n==='米饭(熟)'&&list[1].n==='鸡胸肉(生)'&&
         Math.abs(A.dayTotals().k-307)<1;     // 174+133=307
});

t('场景B：删到最后一条变空数组',()=>{
  const d=A.todayStr();
  A.S.log={};A.S.log[d]=[{n:'鸡蛋',g:60,k:86,p:7.6,f:5.5,c:0.6,fb:0}];
  A.delLog(0);
  console.log('   剩 '+A.S.log[d].length+' 条 / 热量 '+A.dayTotals().k);
  return A.S.log[d].length===0&&A.dayTotals().k===0;
});

t('场景C：删别日期的记录，不动今天',()=>{
  const d=A.todayStr();
  A.S.log={};
  A.S.log[d]=[{n:'今天的饭',g:300,k:400}];
  A.S.log['2026-01-01']=[{n:'昨天的饭',g:300,k:400},{n:'多记的',g:100,k:120}];
  A.delLog(1,'2026-01-01');
  console.log('   昨天剩 '+A.S.log['2026-01-01'].length+' 条 / 今天剩 '+A.S.log[d].length+' 条');
  return A.S.log['2026-01-01'].length===1&&A.S.log[d].length===1;
});

t('场景D：删不存在的索引不报错（含别日期）',()=>{
  const d=A.todayStr();
  A.S.log={};A.S.log[d]=[{n:'A',g:100,k:100}];
  A.delLog(99);
  A.delLog(99,'2026-01-01');
  console.log('   剩 '+A.S.log[d].length+' 条');
  return A.S.log[d].length===1;
});

t('场景E：删过的记录不再进「最近常吃」',()=>{
  const d=A.todayStr();
  A.S.log={};
  A.S.log[d]=[{n:'米饭(熟)',g:150},{n:'西兰花',g:120}];
  A.delLog(1);                          // 删掉西兰花
  const r=A.recentFoods(8);
  console.log('   最近常吃: '+r.map(x=>x.n).join(', '));
  return r.length===1&&r[0].n==='米饭(熟)';
});

t('场景F：连删两次不会删到别处去',()=>{
  const d=A.todayStr();
  A.S.log={};
  A.S.log[d]=[{n:'A',g:100,k:100},{n:'B',g:100,k:100},{n:'C',g:100,k:100}];
  A.delLog(1);A.delLog(1);                   // 连续删索引 1
  const left=A.S.log[d].map(x=>x.n).join(',');
  console.log('   剩 '+A.S.log[d].length+' 条: '+left);
  return A.S.log[d].length===1&&A.S.log[d][0].n==='A';   // B、C 都被删掉
})

console.log('\n通过 '+pass+' / 失败 '+fail);
process.exit(fail?1:0);
