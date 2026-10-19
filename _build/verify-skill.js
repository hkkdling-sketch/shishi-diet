// 校验「技能文档里写的数字」和「测试套件里真实的断言数」一致。
//
// 为什么需要这个：技能是给 AI 读的「项目现状」。数字一旦过期，
// 读到它的人会基于错误信息做判断 —— 文档漂移不会报错，但会一直误导。
// （真实案例：加了 1 条断言后忘了改技能，技能里写着 359、实际 360。）
//
// 做法：不 spawn 子进程（沙箱里 execFileSync 会 EBUSY），
// 改为静态统计每个套件里断言函数的调用点数量 —— 已验证与运行时数量逐条相等。
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..');
const SKILL_DIRS = [
  path.join(REPO, '.workbuddy-ai', 'skills', 'shishi-diet'),
  path.join(process.env.USERPROFILE || process.env.HOME || '', '.workbuddy-ai', 'skills', 'shishi-diet'),
];

// 套件 -> [断言函数名, testing.md 表格里的键]
const SUITES = {
  'edge3.js': 't',
  'edge-inv.js': 't',
  'edge-undo.js': 't',
  'edge-habit.js': 't',
  'edge-train.js': 't',
  'edge-install.js': 'ok',
  'edge-adapt.js': 'ok',
  'edge-api.js': 'ok',
  'edge-portion.js': 'ok',
  'edge-multi.js': 'ok',
  'test-worker.mjs': 'ok',
};

let fail = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };

/** 静态统计断言调用点：行首（可缩进）的 `fn(` —— 定义行形如 `const ok = (`，不会命中 */
function countAssertions(file, fn) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return null;
  const src = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  const re = new RegExp('^\\s*' + fn + '\\(', 'gm');
  return (src.match(re) || []).length;
}

console.log('— 静态统计各套件断言数 —');
const actual = {};
let total = 0;
for (const [file, fn] of Object.entries(SUITES)) {
  const n = countAssertions(file, fn);
  if (n == null) { console.log(`  ! ${file} 不存在`); fail++; continue; }
  actual[file] = n;
  total += n;
  console.log(`  · ${file.padEnd(16)} ${String(n).padStart(4)} 条`);
}
console.log(`  ── 合计 ${total} 条\n`);

// ---- 对账 ----
for (const dir of SKILL_DIRS) {
  if (!dir || !fs.existsSync(dir)) continue;
  console.log(`— 对账 ${dir.replace(REPO, '<仓库>')} —`);
  const testingPath = path.join(dir, 'references', 'testing.md');
  const skillPath = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(testingPath) || !fs.existsSync(skillPath)) {
    console.log('  ✗ 缺少 SKILL.md 或 references/testing.md');
    fail++;
    continue;
  }
  const tTxt = fs.readFileSync(testingPath, 'utf8');
  const sTxt = fs.readFileSync(skillPath, 'utf8');

  // 1) testing.md 表格里每个套件的条数
  for (const [file, real] of Object.entries(actual)) {
    const base = file.replace(/\.m?js$/, '');
    const m = tTxt.match(new RegExp('\\|\\s*`' + base + '\\.(?:js|mjs)`\\s*\\|\\s*(\\d+)\\s*\\|'));
    if (!m) { console.log(`  ✗ testing.md 表格缺少 ${file}`); fail++; continue; }
    ok(+m[1] === real, `${base}: 表格 ${m[1]} / 实际 ${real}`);
  }

  // 2) 两份文档里所有「N 条断言」都要等于合计
  for (const [name, txt] of [['SKILL.md', sTxt], ['testing.md', tTxt]]) {
    const hits = [...txt.matchAll(/(\d+)\s*条断言/g)].map(x => +x[1]);
    if (!hits.length) { console.log(`  ✗ ${name} 没写「N 条断言」`); fail++; continue; }
    hits.forEach((h, i) => ok(h === total, `${name}[${i + 1}]: 写 ${h} / 实际 ${total}`));
  }
  console.log('');
}

// ---- README 里的数字也要对账 ----
// README 是给用户看的门面，数字错了同样是误导。
// （真实事故：图标数写「约 60 个」实际 43；edge-adapt 断言数停在 63 实际 64。）
{
  const readmePath = path.join(REPO, 'README.md');
  if (fs.existsSync(readmePath)) {
    console.log('— 对账 README.md —');
    const rTxt = fs.readFileSync(readmePath, 'utf8');

    // 1) README 里每个套件命令**上一行注释**里的「（N 条断言）」
    //    注意顺序：README 是先写注释再写命令，所以数字在命令的前一行
    for (const [file, real] of Object.entries(actual)) {
      const esc = file.replace('.', '\\.');
      const m = rTxt.match(new RegExp('（(\\d+) 条断言）[^\\n]*\\n\\s*node _build/' + esc));
      if (!m) continue; // README 里没写这条就跳过（edge3 / edge-undo 用的是「N 场景」）
      ok(+m[1] === real, `README: ${file} 写 ${m[1]} 条 / 实际 ${real}`);
    }

    // 2) 合计
    const tot = rTxt.match(/\*\*(\d+) 条断言 \+ 浏览器端到端/);
    ok(!!tot, 'README 写了「N 条断言 + 浏览器端到端」');
    if (tot) ok(+tot[1] === total, `README 合计写 ${tot[1]} / 实际 ${total}`);

    // 3) 食物条数
    const foodsReal = (fs.readFileSync(path.join(__dirname, 'new_app.js'), 'utf8')
      .match(/const FOODS=\[(.*?)\n\];/s) || [, ''])[1];
    const foodCount = (foodsReal.match(/\{n:"[^"]+",k:/g) || []).length;
    const fClaims = [...rTxt.matchAll(/(\d+)\s*条食物/g)].map(x => +x[1]);
    fClaims.forEach((c, i) => ok(c === foodCount, `README 食物数[${i + 1}]: 写 ${c} / 实际 ${foodCount}`));

    // 4) 图标数（README 若写「N 个内联 SVG 图标」）
    const iconsBlock = (fs.readFileSync(path.join(__dirname, 'new_app.js'), 'utf8')
      .match(/const ICON_PATHS=\{(.*?)\n\};/s) || [, ''])[1];
    const iconCount = (iconsBlock.match(/^\s*[a-zA-Z][a-zA-Z0-9]*:\s*['`]/gm) || []).length;
    const iClaim = rTxt.match(/(\d+)\s*个内联 SVG 图标/);
    if (iClaim) ok(+iClaim[1] === iconCount, `README 图标数: 写 ${iClaim[1]} / 实际 ${iconCount}`);

    // 5) 体积（README 若写「N KB」）
    const kbClaim = rTxt.match(/\| 体积 \| (\d+) KB/);
    const bytes = fs.statSync(path.join(REPO, 'index.html')).size;
    const kbReal = Math.round(bytes / 1024);
    if (kbClaim) ok(Math.abs(+kbClaim[1] - kbReal) <= 1, `README 体积: 写 ${kbClaim[1]} KB / 实际 ${kbReal} KB`);
    console.log('');
  }
}

// ---- 两份技能必须逐字一致 ----
if (SKILL_DIRS.length === 2 && fs.existsSync(SKILL_DIRS[0]) && fs.existsSync(SKILL_DIRS[1])) {
  console.log('— 两份技能一致性 —');
  for (const rel of ['SKILL.md', 'references/architecture.md', 'references/testing.md']) {
    const a = path.join(SKILL_DIRS[0], rel), b = path.join(SKILL_DIRS[1], rel);
    if (!fs.existsSync(a) || !fs.existsSync(b)) { console.log(`  ✗ ${rel} 缺一份`); fail++; continue; }
    const norm = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').trim();
    ok(norm(a) === norm(b), `${rel} 两份逐字一致`);
  }
  console.log('');
}

console.log('================ 汇总 ================');
console.log(fail ? `✗ ${fail} 项不一致` : '✓ 技能文档与实际一致');
process.exit(fail ? 1 : 0);
