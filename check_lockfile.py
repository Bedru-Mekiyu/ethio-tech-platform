import json
with open('package-lock.json') as f:
    data = json.load(f)
has_linux = 'node_modules/@rollup/rollup-linux-x64-gnu' in data.get('packages', {})
print('Rollup linux-x64-gnu in lockfile:', has_linux)
for k in data.get('packages', {}):
    if 'linux-x64' in k:
        print('  %s' % k)
win = [k for k in data.get('packages', {}) if 'rollup-win32' in k.lower()]
print('Windows packages in lockfile:', len(win))
