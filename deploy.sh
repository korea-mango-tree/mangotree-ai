#!/bin/bash
# ============================================
# mangotree-ai 배포 (정적 사이트 — 빌드·도커 없음)
#
# 서버의 clone 폴더 안에서 돌린다. GitHub 의 지정 브랜치 최신 커밋으로 맞춘다.
# Apache 가 이 폴더를 그대로 서빙하므로(deploy/apache-mangotree-ai.conf) reload 는 필요 없다.
#
# 처음 한 번 (mangotreeai 사용자로):
#   git clone https://github.com/korea-mango-tree/mangotree-ai.git ~/mangotree-ai
#   chmod 711 ~            # Apache 가 홈 폴더를 지나갈 수 있게 (목록 보기는 막힘)
#   ※ 사용자 생성 때 문서 폴더(예: ~/public_html)가 자동으로 잡히는 환경이면 그 폴더에 clone 한다
#     (clone 은 빈 폴더에만 되므로 기본 index 파일 등이 있으면 먼저 비운다):
#     git clone https://github.com/korea-mango-tree/mangotree-ai.git ~/public_html
#
# 사용법:
#   ./deploy.sh              # main 최신으로
#   ./deploy.sh <브랜치>     # 다른 브랜치로 (예: 미리보기 확인용)
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="${1:-main}"
cd "$SCRIPT_DIR"

# 서버에서 파일을 직접 고쳐 두었으면 덮어쓰지 않고 멈춘다
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "ERROR: 서버 폴더에 커밋 안 된 수정이 있습니다. 확인 후 다시 실행하세요."
    git status --short --untracked-files=no
    exit 1
fi

BEFORE="$(git rev-parse --short HEAD)"
echo "[mangotree-ai] $BRANCH 가져오는 중"
git fetch --prune origin "$BRANCH"
git checkout -q "$BRANCH" 2> /dev/null || git checkout -q -b "$BRANCH" "origin/$BRANCH"
git merge --ff-only "origin/$BRANCH"
AFTER="$(git rev-parse --short HEAD)"

# Apache 가 읽을 수 있게 (파일 644, 폴더 755)
find . -path ./.git -prune -o -type d ! -perm -755 -exec chmod 755 {} +
find . -path ./.git -prune -o -type f ! -perm -644 -exec chmod 644 {} +
chmod 755 deploy.sh

if [ "$BEFORE" = "$AFTER" ]; then
    echo "[mangotree-ai] 변경 없음 ($AFTER)"
else
    echo "[mangotree-ai] $BEFORE → $AFTER"
    git log --oneline "$BEFORE..$AFTER" | head -20
fi
