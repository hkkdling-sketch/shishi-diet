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
const api=new Function(...Object.keys(win),js+';return {calc,invTotals,dayTotals,doEat,delLog,doRestock,doDelInv,get S(){return S},get FOODS(){return FOODS},get todayStr(){return todayStr}};')(...Object.values(win));
let pass=0,fail=0;function t(n,f){try{const r=f();console.log((r===false?'✗':'✓')+' '+n);r===false?fail++:pass++;}catch(e){console.log('✗ '+n+' → '+e.message);fail++;}}

console.log('=== 库存闭环（修正签名后）===');
t('吃掉 200g 后撤销 → 库存完整回滚到 500g',()=>{
 api.S.inv=[{id:'i1',n:'鸡胸肉',k:165,p:31,f:3.6,c:0,cat:'protein',g:500}];
 api.S.log={};api.S.ex={};$('eatG').value='200';
 api.doEat('i1');
 const after=api.S.inv[0].g;
 api.delLog(0);
 const back=api.S.inv.find(x=>x.id==='i1');
 console.log('   吃后 '+after+'g → 撤销后 '+(back?back.g:'?')+'g');
 return back&&Math.abs(back.g-500)<0.01});
t('吃光后再撤销 → 条目被重建且克重还原',()=>{
 api.S.inv=[{id:'i1',n:'鸡胸肉',k:165,p:31,f:3.6,c:0,cat:'protein',g:300}];
 api.S.log={};$('eatG').value='300';
 api.doEat('i1');
 const gone=api.S.inv.length===0;
 api.delLog(0);
 const back=api.S.inv.find(x=>x.id==='i1');
 console.log('   吃光移除='+gone+' → 撤销后重建 '+(back?back.g+'g '+back.n+' cat='+back.cat:'失败'));
 return gone&&back&&Math.abs(back.g-300)<0.01&&back.cat==='protein'});
t('撤销后今日热量归零',()=>{
 api.S.inv=[{id:'i1',n:'鸡胸肉',k:165,p:31,f:3.6,c:0,cat:'protein',g:500}];
 api.S.log={};$('eatG').value='150';api.doEat('i1');
 const mid=api.dayTotals().k;
 api.delLog(0);
 const end=api.dayTotals().k;
 console.log('   撤销前 '+mid.toFixed(1)+' → 撤销后 '+end.toFixed(1));
 return mid>0&&end===0});
t('补货叠加正确',()=>{
 api.S.inv=[{id:'i1',n:'鸡胸肉',k:165,p:31,f:3.6,c:0,cat:'protein',g:100}];
 $('rsG').value='400';api.doRestock('i1');
 console.log('   100g + 补 400g = '+api.S.inv[0].g+'g');
 return Math.abs(api.S.inv[0].g-500)<0.01});
t('invTotals 按克重折算营养正确',()=>{
 api.S.inv=[{id:'a',n:'A',k:100,p:10,f:1,c:0,cat:'protein',g:200}];
 const v=api.invTotals();
 console.log('   200g×100kcal/100g = '+v.k+' kcal, P'+v.p);
 return Math.abs(v.k-200)<0.01&&Math.abs(v.p-20)<0.01});
t('今日日期键格式 YYYY-MM-DD',()=>{const s=api.todayStr();
 console.log('   '+s);return /^\d{4}-\d{2}-\d{2}$/.test(s)});
console.log('\n通过 '+pass+' / 失败 '+fail);
process.exit(fail?1:0);
