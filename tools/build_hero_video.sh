#!/usr/bin/env bash
# 메인 첫 화면 영상 합치기
# 사용법: tools/build_hero_video.sh <원본 폴더> [출력 폴더]
#   원본 폴더에 clips.tsv가 있어야 한다. 탭으로 구분하고, 한 줄에 장면 하나:
#     파일명<TAB>시작초<TAB>길이초
#     예) 01-blog.mp4	3.5	9
#   장면은 적힌 순서대로 붙고, 장면 사이는 0.5초 겹쳐 넘어간다.
# 출력: hero-main-1080.mp4, hero-main-720.mp4, hero-main-720.webm, hero-main-poster.jpg
#   첫 화면 배경용이라 소리는 뺀다(자동재생은 음소거여야 한다).
set -euo pipefail
SRC=${1:?원본 폴더}
OUT=${2:-assets/video}
XF=0.5
mkdir -p "$OUT"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

n=0
durs=()
while IFS=$'\t' read -r f ss len; do
  [[ -z "${f:-}" || "$f" == \#* ]] && continue
  # 1920x1080·30fps로 맞춘다(비율이 다르면 위아래나 양옆에 검은 띠).
  ffmpeg -nostdin -loglevel error -y -ss "$ss" -t "$len" -i "$SRC/$f" -an \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,fps=30,format=yuv420p,setsar=1" \
    -c:v libx264 -preset veryfast -crf 16 "$TMP/c$n.mp4"
  durs+=("$len")
  n=$((n+1))
done < "$SRC/clips.tsv"
(( n > 0 )) || { echo "clips.tsv에 장면이 없습니다" >&2; exit 1; }

# 장면 사이 겹쳐 넘기기(xfade)
inputs=() ; filter="" ; prev="[0:v]" ; off=0
for ((i=0;i<n;i++)); do inputs+=(-i "$TMP/c$i.mp4"); done
for ((i=1;i<n;i++)); do
  off=$(python3 -c "print(round($off+${durs[$((i-1))]}-$XF,3))")
  filter+="${prev}[$i:v]xfade=transition=fade:duration=$XF:offset=$off[v$i];"
  prev="[v$i]"
done
if (( n == 1 )); then cp "$TMP/c0.mp4" "$TMP/all.mp4"; else
  ffmpeg -loglevel error -y "${inputs[@]}" -filter_complex "${filter%;}" -map "$prev" -pix_fmt yuv420p -c:v libx264 -preset veryfast -crf 16 "$TMP/all.mp4"; fi

ffmpeg -loglevel error -y -i "$TMP/all.mp4" -an -pix_fmt yuv420p -c:v libx264 -preset slow -crf 24 -profile:v high -movflags +faststart "$OUT/hero-main-1080.mp4"
ffmpeg -loglevel error -y -i "$TMP/all.mp4" -an -vf scale=1280:720,format=yuv420p -c:v libx264 -preset slow -crf 25 -movflags +faststart "$OUT/hero-main-720.mp4"
ffmpeg -loglevel error -y -i "$TMP/all.mp4" -an -vf scale=1280:720,format=yuv420p -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 "$OUT/hero-main-720.webm"
ffmpeg -loglevel error -y -ss 1 -i "$TMP/all.mp4" -frames:v 1 -vf scale=1280:720 -q:v 3 "$OUT/hero-main-poster.jpg"
ls -la "$OUT"/hero-main-*
