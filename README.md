# Glass 개발 프로젝트

2026년 9월 30일 기준 대화 인계 기록입니다. 이 디렉토리는 기존 2D 프로젝트와 분리한 글래스 앱 개발 공간입니다.

## 현재 목표

글래스 기기 없이 시뮬레이터 또는 브라우저 미리보기를 사용해 앱 개발을 시작합니다. 사용자는 아직 Ray-Ban Meta 및 관련 하드웨어를 보유하지 않았습니다. 앱 아이디어는 확정하지 않았습니다.

## 논의한 개발 경로

- 화면 앱: Meta Ray-Ban Display용 웹앱. 공식 웹앱 저장소와 UI Toolkit을 검토하고 브라우저에서 화면과 키보드 조작을 시험합니다.
- 모바일 연동 앱: iOS 또는 Android DAT SDK와 Mock Device Kit를 검토합니다. Display 웹앱 시뮬레이션과 구분합니다.
- 카메라 기반 AI 기능은 샘플 이미지나 웹캠으로 별도 검증할 수 있으나 실제 기기 연동 검증을 대체하지 않습니다.

공식 FAQ는 브라우저 시뮬레이터와 Mock Device Kit를 안내합니다. 연결된 상세 문서는 로그인 요구로 내용을 확인하지 못했습니다. 실제 제공 범위와 계정 접근 가능 여부는 개발 시작 시 다시 확인해야 합니다.

## 아이디어 후보

작업 순서 안내, 사진과 음성 작업일지, 외국어 학습 등을 논의했습니다. 작업 순서 도우미는 제안일 뿐 사용자가 선택한 사양이 아닙니다.

## 다음 작업

1. 공식 샘플과 라이선스 및 실행 요구사항 확인.
2. 이 폴더 안에 최소 개발 환경 구성.
3. 브라우저에서 실행하고 방향키 이동과 선택 동작 검증.
4. 앱 주제를 정하고 핵심 기능 하나 구현.

현재 생성한 것은 이 인계 문서뿐입니다. SDK 설치, 앱 구현, 개발 서버 실행은 아직 하지 않았습니다. 기존 2D 제품 코드를 변경하지 않았습니다.

## 참고 자료

- [공식 웹앱 저장소](https://github.com/facebook/meta-wearables-webapp)
- [공식 개발자 FAQ](https://developers.meta.com/wearables/faq/)
- [Display 시뮬레이션 안내](https://wearables.developer.meta.com/docs/develop/dat/display-simulation)
- [Mock Device Kit 안내](https://wearables.developer.meta.com/docs/develop/dat/mock-device-kit/)

판매량, SDK 버전, 배포 정책 등 이전 대화의 시점 의존 정보는 확정 사양으로 사용하지 않고 필요할 때 공식 자료로 재검증합니다.

## 실행 가능한 테스트 앱 (2026-09-30)

`counter/`에 React + TypeScript + Vite와 공식 `@wearables-ui-toolkit/mrbd`를 사용한 **글래스 카운터**를 추가했습니다.

```sh
cd counter
npm ci
npm run build
npm run preview -- --port 4173
```

- 접속: http://127.0.0.1:4173/
- 웨일에 설치된 **Meta Ray-Ban Display Simulator** 확장앱을 클릭하면 공식 시뮬레이터가 표시됩니다.
- 방향키로 버튼 이동, Enter로 실행합니다. `+1 더하기`, `−1 빼기`, `초기화`를 제공합니다.
- 숫자는 0~999 범위이며 새로고침하면 0으로 돌아갑니다.
- 개발 중에는 `npm run dev`를 사용합니다. 미리보기 서버는 종료할 때까지 실행됩니다.
- TypeScript 검사와 프로덕션 빌드 통과, 공식 시뮬레이터 내 앱 화면 표시 확인. 실기기 테스트는 수행하지 않았습니다.
- 공식 참고 저장소는 `vendor/meta-wearables-webapp/`에 내려받았습니다(BSD 라이선스). 앱은 이 저장소에 의존하지 않으며 npm 패키지와 잠금 파일로 설치합니다. UI Toolkit 라이선스는 Apache-2.0입니다.

공식 시뮬레이터: https://chromewebstore.google.com/detail/jpjlmmodokemlepklkdbimceggpbjcll

## 앱 기획

- [비밀동네 기획서 v0.2](docs/secret-neighborhood-plan.md): 지도 기반 탐정 놀이, 동네 탐험·수집, 친구의 장소 편지를 결합한 게임. 첫 사건 콘셉트, MVP 범위, 기술 검증 과제와 사용자 검증 계획을 정리했습니다.

## 비밀동네 플레이 프로토타입

`prototype/`에 스마트폰용 첫 사건을 구현했습니다. [실행 및 기능 안내](prototype/README.md)

```sh
cd prototype
npm ci
npm run build
npm run preview -- --strictPort
```

같은 Wi-Fi의 휴대폰 Chrome에서 서버가 출력하는 Network 주소(이번 실행: http://192.168.1.117:4180/)를 엽니다. **지금 여기서 체험하기**로 세 단서, 사건 해결, 우표와 편지를 체험할 수 있습니다. 현재 지도는 가상 도식이며 실제 길찾기는 없습니다. Wi-Fi HTTP 접속에서는 GPS 대신 수동 도착 확인을 사용합니다. GPS 사용에는 HTTPS가 필요합니다.

AR 콘셉트 추가: [1인칭 가상 동네 체험](http://192.168.1.117:4180/ar.html). 가상 공간에 고정된 봉투 단서와 바닥 경로를 따라 사건을 진행합니다. 실제 공간 추적이나 Meta 기기의 공간 앵커를 재현한 것은 아닙니다.
