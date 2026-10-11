# -*- coding: utf-8 -*-
"""从 _build 分段源文件重新组装 index.html。可重复运行。"""
import io, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
idx = os.path.join(ROOT, 'index.html')

def rd(p):
    return io.open(os.path.join(BASE, p), encoding='utf-8').read()

css  = rd('new.css')
body = rd('new_body.html')
js   = rd('new_app.js')

# 保留 index.html 里 <style> 之前的 <head> 部分（含 meta / title）
cur = io.open(idx, encoding='utf-8').read()
head_end = cur.index('<style>')
head = cur[:head_end]

# body 片段从 <body> 开始
body = body[body.index('<body>'):]

out = (head
       + css.rstrip() + '\n'
       + body.rstrip() + '\n'
       + '<script>\n' + js.rstrip() + '\n</script>\n'
       + '</body>\n</html>\n')

io.open(idx, 'w', encoding='utf-8', newline='\n').write(out)
print('组装完成: %d 字符 / %d 字节' % (len(out), os.path.getsize(idx)))
