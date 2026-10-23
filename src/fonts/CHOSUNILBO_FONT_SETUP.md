# 조선일보 서체 추가 안내

조선일보 서체 파일을 이 폴더에 추가하면 앱 전체에 적용됩니다.

권장 파일명은 아래와 같습니다.

- `Chosunilbo-Regular.woff2` — 본문용 (400)
- `Chosunilbo-Medium.woff2` — 강조용 (500)
- `Chosunilbo-Bold.woff2` — 제목용 (700)
- `Chosunilbo-ExtraBold.woff2` — 큰 제목용 (800)

각 파일이 준비되면 `src/vibe-design/overrides.css`의 `@font-face` 예시 주석을 해제해 사용합니다. 파일명과 굵기가 다를 경우에는 해당 이름과 굵기에 맞추어 `src` 및 `font-weight`만 수정하면 됩니다.

서체 라이선스와 사용 범위는 제공처의 안내를 확인해 주세요.
