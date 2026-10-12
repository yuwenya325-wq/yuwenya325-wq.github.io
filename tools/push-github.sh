#!/usr/bin/env bash
# 分批推送 TOONHUB 到 GitHub（代理不稳定，92MB 一次性上传必被重置）
# 策略：重建孤儿分支 → 按 ~12MB 切批 → 每批一次 push，失败自动重试
# 注意：批次清单写到 .git/push-batches/（Windows Python 与 Git Bash 都能识别的相对路径）
set -u
cd "C:/Users/PC/Desktop/个人网站" || exit 1
PY="C:/Users/PC/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
DIR=".git/push-batches"

echo "=== 1/3 生成批次清单 ==="
INFO=$("$PY" - <<'PYEOF'
import subprocess, os
os.chdir(r'C:/Users/PC/Desktop/个人网站')
raw = subprocess.run(['git', 'ls-files', '-z'], capture_output=True).stdout.decode('utf-8')
files = [f for f in raw.split('\0') if f]
works = sorted(f for f in files if f.startswith('public/works/'))
other = sorted(f for f in files if not f.startswith('public/works/'))

def size(f):
    return os.path.getsize(f) if os.path.exists(f) else 0

LIMIT = 12 * 1048576
batches = [other]
cur, cursz = [], 0
for f in works:
    s = size(f)
    if cur and cursz + s > LIMIT:
        batches.append(cur)
        cur, cursz = [], 0
    cur.append(f)
    cursz += s
if cur:
    batches.append(cur)

os.makedirs('.git/push-batches', exist_ok=True)
for i, b in enumerate(batches):
    with open('.git/push-batches/batch%d.txt' % i, 'wb') as fh:
        fh.write('\0'.join(b).encode('utf-8'))
    print('  batch%-2d %4d 文件  %6.1f MB' % (i, len(b), sum(size(x) for x in b) / 1048576))
print('COUNT=%d' % len(batches))
PYEOF
)
echo "$INFO" | grep -v '^COUNT='
N=$(echo "$INFO" | grep '^COUNT=' | cut -d= -f2)
echo "共 $N 批"
[ -n "$N" ] || { echo "!! 批次清单生成失败"; exit 1; }

echo "=== 2/3 准备孤儿分支 ==="
if [ "$(git branch --show-current)" != "rebuild" ]; then
  git checkout --orphan rebuild 2>&1 | tail -1
fi
git reset -q
git config http.version HTTP/1.1
git config http.postBuffer 268435456
git config user.name "于文雅"
git config user.email "yuwenya325-wq@users.noreply.github.com"
echo "当前分支=$(git branch --show-current)  http.version=$(git config http.version)"

FAILED=0
for i in $(seq 0 $((N - 1))); do
  echo ""
  echo "=== 批次 $i / $((N - 1)) ==="
  git add --pathspec-from-file="$DIR/batch$i.txt" --pathspec-file-nul
  if ! git diff --cached --quiet; then
    git commit -q -m "TOONHUB 作品集站点资源（第 $((i + 1))/$N 批）"
  fi
  if [ "$i" -eq 0 ]; then
    git branch -M rebuild main
    echo "  分支已命名为 main"
  fi

  PUSHED=0
  for try in 1 2 3 4 5; do
    if git push -u origin main >/tmp/push.log 2>&1; then
      PUSHED=1
      echo "  push 成功（第 $try 次尝试）"
      break
    fi
    echo "  push 第 $try 次失败：$(tail -1 /tmp/push.log)"
    sleep 8
  done
  if [ "$PUSHED" -eq 0 ]; then
    echo "  !! 批次 $i 推送失败，终止"
    FAILED=1
    break
  fi

  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git ls-remote origin refs/heads/main 2>/dev/null | cut -f1)
  echo "  本地 ${LOCAL:0:8}  远端 ${REMOTE:0:8}"
  if [ "$LOCAL" != "$REMOTE" ]; then
    echo "  !! 远端未同步到本批，终止"
    FAILED=1
    break
  fi
done

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "ALL_DONE 全部 $N 批推送成功"
  git ls-remote origin refs/heads/main 2>/dev/null | head -1
  echo "本地提交数：$(git rev-list --count HEAD)"
else
  echo "PARTIAL_FAILED 停在当前批次，可重复运行本脚本续传"
fi
