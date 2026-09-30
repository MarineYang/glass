# 한걸음 — 친구가 남긴 길을 걷다

장소 세 곳과 이야기를 엮어 친구에게 링크로 보내는 소셜 여행 앱의 첫 테스트 버전입니다.

**서비스:** https://marineyang.github.io/glass/

## 지금 되는 것

- 지도에서 장소 3곳 선택 → 이야기 작성 → 코스 완성 → 링크 공유
- 받은 링크만으로 코스 열기, 저장, 나만의 버전 만들기
- 현재 위치와 다음 장소까지 직선거리 표시, 외부 지도 길찾기 연결
- GPS 근처 도착 확인 또는 직접 방문 기록, 완주 메모
- 휴대폰에 코스·초안·방문 기록 저장

계정·공개 피드·댓글·기기 간 동기화는 아직 없습니다. 공유 링크 자체에 코스가 담깁니다. 방문 기록과 완주 메모는 공유되지 않으며, 저장한 링크의 수정·회수는 지원하지 않습니다. 지도 점선은 방문 순서이고 보행 경로가 아닙니다. 홈의 두 코스는 현장 답사한 추천 경로가 아닌 기능 체험 예시입니다.

## 개발

Node.js 22.18+ 권장.

```sh
cd travel
npm ci
npm test
npm run build
npm run dev
```

개발 주소: http://localhost:4181/ . 안드로이드에서는 위 서비스 HTTPS 주소를 사용하면 같은 Wi-Fi 없이 접속하고 위치 권한을 요청할 수 있습니다. 모바일 HTTP LAN 접속에서는 GPS가 제한됩니다.

배포: `travel/dist/`를 GitHub Pages `gh-pages` 브랜치 루트에 게시합니다. 소스는 `main`에 유지합니다. 재배포 절차는 [MVP 문서](docs/social-travel-mvp.md)에 있습니다.

## 기획과 보관 자료

- [소셜 여행 MVP 기획·테스트 가이드](docs/social-travel-mvp.md)
- [후속 게임 기획: 비밀동네](docs/secret-neighborhood-plan.md)
- [기존 글래스 개발 기록](docs/archive/glass-development-history.md)
- `counter/`: Meta Display UI Toolkit 카운터
- `prototype/`: 기존 탐정 게임과 가상 AR 마을 테스트. 실제 XR 공간 앵커 구현은 아님

지도: Leaflet + OpenStreetMap. 첫 버전은 정적 웹앱이며 별도 앱 서버나 유료 API 키를 사용하지 않습니다.
