# Download OFL Chinese/Latin font subsets from Google Fonts (only the glyphs this film uses) into ../fonts/
import json, re, urllib.request, urllib.parse, pathlib, sys
here = pathlib.Path(__file__).resolve().parent.parent
S = json.load(open(here / 'strings.json', encoding='utf-8'))
lyr = ''.join(S['lyrics']) + S['extra'] + '，。…！'
jobs = [('LyricZh', 'ZCOOL KuaiLe', 400, lyr), ('HandZh', 'Ma Shan Zheng', 400, S['hand'] + '，……'),
        ('Digits', 'Fredoka', 600, '0123456789.NOVMBERYSLTUAFIWDHC ')]
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
css = []
for name, fam, w, text in jobs:
    text = ''.join(sorted(set(text)))
    q = f"https://fonts.googleapis.com/css2?family={urllib.parse.quote(fam)}:wght@{w}&text={urllib.parse.quote(text)}"
    c = urllib.request.urlopen(urllib.request.Request(q, headers=UA)).read().decode()
    urls = re.findall(r'url\((https://[^)]+)\)', c)
    for i, u in enumerate(urls):
        fn = f'{name}{i}.woff2'
        (here / 'fonts' / fn).write_bytes(urllib.request.urlopen(urllib.request.Request(u, headers=UA)).read())
        css.append(f"@font-face{{font-family:'{name}';font-weight:{w};font-display:block;src:url(fonts/{fn}) format('woff2');}}")
    print(name, fam, len(urls), 'file(s)')
(here / 'fonts.css').write_text('\n'.join(css) + '\n')
