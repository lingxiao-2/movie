# OFL font subsets from Google Fonts for exactly the characters used (see strings in this file)
import re, urllib.request, urllib.parse, pathlib
here = pathlib.Path(__file__).resolve().parent.parent
LYR = '我们都是渺小真实存在祈愿小世界里不只有挫败直到遇见你我以为就光明起来眼睛里看到的都是广袤无垠的大海有你在的日子不可能被取代在最灰暗的日子你陪着我发呆你让我学会如何拨开阴霾将快乐全都收集将不开心全都淘汰你对我说的情话像转瞬即逝的烟花只停在绽放一刹那我却已无法自拔我们的爱总有时差也为你骗自己放下爱炙热的你，却忘了爱自己把回忆拼好给你'
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
css = ["@font-face{font-family:'HandZh';font-display:block;src:url(fonts/HandZh0.woff2) format('woff2');}"]
for name, fam, w, text in [('Lyric', 'Noto Serif SC', 600, LYR + '，。…'), ('DateF', 'Noto Serif SC', 500, '0123456789.年月日 ')]:
    q = f"https://fonts.googleapis.com/css2?family={urllib.parse.quote(fam)}:wght@{w}&text={urllib.parse.quote(''.join(sorted(set(text))))}"
    c = urllib.request.urlopen(urllib.request.Request(q, headers=UA)).read().decode()
    for i, u in enumerate(re.findall(r'url\((https://[^)]+)\)', c)):
        fn = f'{name}{i}.woff2'; (here / 'fonts' / fn).write_bytes(urllib.request.urlopen(urllib.request.Request(u, headers=UA)).read())
        css.append(f"@font-face{{font-family:'{name}';font-weight:{w};font-display:block;src:url(fonts/{fn}) format('woff2');}}")
(here / 'fonts.css').write_text('\n'.join(css) + '\n'); print('\n'.join(css))
