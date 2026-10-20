#!/usr/bin/env bash
# 跑全部测试。
#
# 为什么要有这个脚本，而不是让人手敲 glob：
#   `node _build/edge-*.js` 看起来能跑全部，实际上会**漏掉两个套件** ——
#   `edge3.js` 不匹配 `edge-*`（没有连字符），`test-worker.mjs` 不是 .js。
#   这类「看起来跑全了、其实漏了」的坑，最好的防法是把命令固化下来。
#
# 用法：
#   bash _build/test.sh          # 只跑不需要浏览器的部分（快）
#   bash _build/test.sh --full   # 连浏览器端到端一起跑（会自己起本地服务）

set -u
cd "$(dirname "$0")/.." || exit 1

PY="${PY:-C:/Users/25675/.workbuddy-ai/binaries/python/versions/3.13.12/python.exe}"
ND="${ND:-C:/Users/25675/.workbuddy-ai/binaries/node/versions/22.22.2-6/node.exe}"
export NODE_PATH="C:/Users/25675/.workbuddy-ai/binaries/node/workspace/node_modules"

FULL=0
[ "${1:-}" = "--full" ] && FULL=1

FAIL=0
say() { printf '%s\n' "$*"; }
# 注意别把这个函数叫 head —— 会遮蔽 head 命令，后面 head -10 会变成调函数
section() { printf '\n\033[1m— %s —\033[0m\n' "$*"; }

# ---------- 1. 拼装 + 结构校验 ----------
section "拼装与结构校验"
if $PY _build/assemble.py; then say "  ✓ 拼装完成"; else say "  ✗ 拼装失败"; FAIL=1; fi
OUT=$($PY _build/verify.py 2>&1)
if printf '%s' "$OUT" | grep -q "结构校验通过：0 错误"; then
  say "  ✓ 结构校验通过：0 错误"
else
  say "  ✗ 结构校验有问题"
  printf '%s\n' "$OUT" | grep -E '✗|错误' | head -10
  FAIL=1
fi

# ---------- 2. 冒烟 ----------
section "冒烟"
if $ND _build/smoke.js >/dev/null 2>&1; then say "  ✓ smoke.js"; else say "  ✗ smoke.js"; FAIL=1; fi

# ---------- 3. 断言套件（显式列出，不用 glob）----------
section "断言套件"
SUITES="edge3.js edge-undo.js edge-habit.js edge-train.js
        edge-install.js edge-adapt.js edge-api.js edge-portion.js edge-multi.js test-worker.mjs"
TOTAL=0
for f in $SUITES; do
  OUT=$($ND "_build/$f" 2>&1)
  LINE=$(printf '%s' "$OUT" | grep -oE '通过 [0-9]+ / 失败 [0-9]+' | tail -1)
  if [ -z "$LINE" ]; then say "  ✗ $f（输出无法解析）"; FAIL=1; continue; fi
  N=$(printf '%s' "$LINE" | grep -oE '^通过 [0-9]+' | grep -oE '[0-9]+')
  M=$(printf '%s' "$LINE" | grep -oE '失败 [0-9]+' | grep -oE '[0-9]+')
  TOTAL=$((TOTAL + N))
  if [ "$M" = "0" ]; then say "  ✓ $(printf '%-16s' "$f") $N 条"; else say "  ✗ $(printf '%-16s' "$f") 失败 $M 条"; FAIL=1; fi
done
say "  ── 合计 $TOTAL 条"

# ---------- 4. 元测试：文档数字 vs 实际 ----------
section "元测试（文档一致性）"
if $ND _build/verify-skill.js >/dev/null 2>&1; then
  say "  ✓ verify-skill.js —— 技能文档与实际一致"
else
  say "  ✗ verify-skill.js —— 文档数字和实际对不上"
  $ND _build/verify-skill.js 2>&1 | grep '✗' | head -10
  FAIL=1
fi

# ---------- 5. 浏览器端到端（可选）----------
if [ "$FULL" = "1" ]; then
  section "浏览器端到端"
  $PY -m http.server 8777 --bind 127.0.0.1 --directory . >/dev/null 2>&1 &
  $PY -m http.server 8778 --bind 127.0.0.1 --directory . >/dev/null 2>&1 &
  $PY -m http.server 8780 --bind 127.0.0.1 --directory . >/dev/null 2>&1 &
  SRV=$!
  sleep 2
  for f in render.js render-guide.js render-proxy.js; do
    if $ND "_build/$f" >/dev/null 2>&1; then say "  ✓ $f"; else say "  ✗ $f"; FAIL=1; fi
  done
  kill %1 %2 %3 2>/dev/null
fi

# ---------- 汇总 ----------
printf '\n================ 汇总 ================\n'
if [ "$FAIL" = "0" ]; then
  say "✓ 全部通过"
else
  say "✗ 有失败项，交付前必须修完"
fi
[ "$FULL" = "0" ] && say "（浏览器端到端未跑，加 --full 可跑）"
exit $FAIL
