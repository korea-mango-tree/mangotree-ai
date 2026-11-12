#!/usr/bin/env python3
# font-size·padding·margin의 px 값을 4/8/12/16/24/32/40/48/56/64/72/80 척도로 맞춤
# 사용: python3 tools/snap_spacing.py css assets/x.css ... | python3 tools/snap_spacing.py html page.html ...
import re,sys,collections
SCALE=[4,8,12,16,24,32,40,48,56,64,72,80]
stats=collections.Counter();big=collections.Counter()
def snap(v):
    a=abs(v)
    if a<3: return v            # 0~2px(헤어라인·미세 보정)는 유지
    if a>80: big[a]+=1; return v  # 80px 초과는 척도 밖이라 유지
    best=min(SCALE,key=lambda s:(abs(s-a),-s))  # 같은 거리면 큰 쪽
    return best if v>0 else -best
PROP=r'(?<![\w-])(font-size|padding(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?|margin(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?)\s*:\s*([^;{}"]+)'
NUM=re.compile(r'(-?\d*\.?\d+)px')
def fix_val(prop,val):
    def r(m):
        v=float(m.group(1));n=snap(v)
        if n!=v: stats[prop.split('-')[0]]+=1
        return (str(int(n)) if float(n).is_integer() else m.group(1))+'px'
    return NUM.sub(r,val)
def fix(text):
    return re.sub(PROP,lambda m:m.group(1)+':'+fix_val(m.group(1),m.group(2)) if ':' in m.group(0) else m.group(0),text)
def fix_keep_spacing(text):
    def r(m):
        full=m.group(0);i=full.index(':')
        return full[:i+1]+fix_val(m.group(1),full[i+1:])
    return re.sub(PROP,r,text)
mode=sys.argv[1]
for p in sys.argv[2:]:
    s=open(p,encoding='utf-8').read()
    if mode=='css': t=fix_keep_spacing(s)
    else:  # html: only style="" attributes
        t=re.sub(r'style="([^"]*)"',lambda m:'style="'+fix_keep_spacing(m.group(1))+'"',s)
    if t!=s: open(p,'w',encoding='utf-8').write(t)
print(dict(stats)); print('kept >80px:',dict(big))
