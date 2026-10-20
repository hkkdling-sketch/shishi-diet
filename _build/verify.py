# -*- coding: utf-8 -*-
"""结构校验：确认组装后的 index.html 结构完整、无多余片段、无 emoji 残留。"""
import io, re, sys

p = 'index.html'
s = io.open(p, encoding='utf-8').read()

errs, warns = [], []

# 1) 只有一个 <style> / </style> / <script> / </script>
for tag, exp in [('<style>', 1), ('</style>', 1), ('<script>', 1), ('</script>', 1),
                 ('<body>', 1), ('</body>', 1), ('<html', 1), ('</html>', 1)]:
    n = s.count(tag)
    if n != exp:
        errs.append(f'{tag} 出现 {n} 次，期望 {exp}')

# 2) 关键 DOM 节点必须存在
need_ids = ['themeBtn','stockAlert','app','nav','page-home','page-stock','page-scan',
            'page-me','page-set','eatSheet','restockSheet','delSheet','manualSheet',
            'modalBack']
for i in need_ids:
    if f'id="{i}"' not in s:
        # 容忍部分节点可能用其它命名
        warns.append(f'未找到 id="{i}"')

# 3) 关键函数定义存在
need_fn = ['function calc','function load','function save','function applyTheme',
           'function toggleTheme','function gapToday','function dbSuggest',
           'function recentFoods','function relSheet','function doRel','function saveProfile',
           'function exBurn','function exSheet','function doAddEx','function isTrainDay',
           'function planSheet','function savePlan','function renderTrain',
           'function renderToday','function outEatSheet','function aiToLog',
           'function fiberTarget','function renderInstall','function doInstall',
           'function isStandalone','function ic(','function boot']
for f in need_fn:
    if f not in s:
        errs.append(f'缺少函数: {f}')

# 3b) PWA 安装能力必须接上（否则「怎么装到手机」这条路又断了）
for k in ['beforeinstallprompt','appinstalled','instBox','instBoxMe']:
    if k not in s:
        errs.append(f'缺少安装入口标记: {k}')

# 3c) 选图入口必须两条：capture 属性会让手机直接开相机、不给相册选项，
#     所以「从相册选」必须单独用一个不带 capture 的 input。
if 'id="photoCam"' not in s:
    errs.append('缺少拍照入口 id="photoCam"')
if 'id="photoLib"' not in s:
    errs.append('缺少相册入口 id="photoLib"（用户无法使用已拍好的照片）')
m_lib = re.search(r'<input[^>]*id="photoLib"[^>]*>', s)
if m_lib and 'capture' in m_lib.group(0):
    errs.append('photoLib 不应带 capture 属性（会导致只能拍照、无法从相册选）')
if m_lib and 'multiple' not in m_lib.group(0):
    errs.append('photoLib 缺少 multiple（无法一次选多张：配料表 + 营养成分表）')
m_cam = re.search(r'<input[^>]*id="photoCam"[^>]*>', s)
if m_cam and 'capture' not in m_cam.group(0):
    warns.append('photoCam 未带 capture（拍照按钮可能不再直接开相机）')
# 多图相关函数
for f in ['function renderPrev','function rmPhoto','function bindPhotoInput','MAX_PHOTOS']:
    if f not in s:
        errs.append(f'缺少多图支持: {f}')

# 4) emoji 残留检测（界面文案里不应再有 emoji 图标）
EMOJI = re.compile('[\U0001F300-\U0001FAFF\u2600-\u27BF\uFE0F\u2B00-\u2BFF]')
hits = []
for m in EMOJI.finditer(s):
    a = max(0, m.start()-40); b = min(len(s), m.end()+40)
    hits.append(s[a:b].replace('\n',' '))
if hits:
    warns.append(f'发现 {len(hits)} 处疑似 emoji（可能是注释/数据，需人工确认）')
    for h in hits[:12]:
        warns.append('   … ' + h)

# 5) 括号/大括号平衡（粗检）
for name, o, c in [('大括号', '{', '}'), ('小括号', '(', ')'), ('方括号', '[', ']')]:
    no, nc = s.count(o), s.count(c)
    if no != nc:
        # 字符串里可能有，所以只 warn
        warns.append(f'{name} 不配平: {o}={no} {c}={nc}')

# 6) calc 边界保护必须存在
for k in ['bmr*1.1','0.35/4','pgCap','floorApplied','pgCapped']:
    if k not in s:
        errs.append(f'缺少边界保护标记: {k}')

# 7) v1->v2 迁移
if 'shishi_v2' not in s:
    errs.append('缺少 shishi_v2 键')
if 'shishi_v1' not in s:
    warns.append('未发现 v1 迁移读取（若确实删了旧键可忽略）')

print('文件大小:', len(s), '字符')
print()
if errs:
    print('=== 错误 ===')
    for e in errs: print(' ✗', e)
else:
    print('=== 结构校验通过：0 错误 ===')
if warns:
    print()
    print('=== 提示 ===')
    for w in warns: print(' !', w)
sys.exit(1 if errs else 0)
