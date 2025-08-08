# 성인인증 시스템 (Adult Verification System)

PortOne을 활용한 Node.js 기반 성인인증 시스템입니다.

## 📋 주요 기능

- 🔐 PortOne 본인인증을 통한 성인(만 19세 이상) 확인
- 🎯 세션 기반 인증 상태 관리
- 🧪 테스트 모드 지원 (CPID 발급 전 개발용)
- 🐛 디버그 모드로 상세한 로깅
- 📱 반응형 웹 디자인 (PC/모바일 지원)

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 설정
`.env.sample`을 참고하여 `.env` 파일을 설정하세요:

```bash
# PortOne 설정 (실제 값으로 변경 필요)
PORTONE_IMP_KEY=imp12345678
PORTONE_API_KEY=your-portone-api-key
PORTONE_API_SECRET=your-portone-api-secret

# 디버그 모드
DEBUG_MODE=true

# 테스트 모드 (CPID 발급 전까지)
TEST_MODE=true
```

### 3. 서버 실행
```bash
# 프로덕션 모드
npm start

# 개발 모드 (자동 재시작)
npm run dev
```

### 4. 접속
브라우저에서 `http://localhost:3000`으로 접속

## 🏗️ 프로젝트 구조

```
adultVerify/
├── server.js              # 메인 서버 파일
├── package.json           # 패키지 정보
├── .env                   # 환경변수 (실제 값)
├── .env.sample           # 환경변수 템플릿
├── .gitignore            # Git 제외 파일 목록
├── CLAUDE.md             # 기술 설계 문서
├── README.md             # 이 파일
├── views/                # EJS 템플릿
│   ├── auth.ejs         # 성인인증 페이지
│   └── main.ejs         # 인증 완료 후 메인 페이지
└── public/              # 정적 파일 폴더 (CSS, JS, 이미지 등)
```

## 🔧 설정 방법

### PortOne 설정
1. [PortOne 관리자 콘솔](https://admin.portone.io) 접속
2. 가맹점 등록 및 CPID 발급
3. API Key 및 Secret 발급
4. `.env` 파일에 실제 값 입력

### 테스트 모드
CPID 발급 전 개발 및 테스트를 위해 `TEST_MODE=true` 설정:
- 실제 PortOne API 호출 없이 성인인증 우회
- "테스트 모드로 진입" 버튼으로 간편 테스트

### 디버그 모드
개발 중 상세한 로깅을 위해 `DEBUG_MODE=true` 설정:
- 세션 상태, API 호출, 인증 과정 등 상세 로그 출력
- 콘솔에서 실시간 동작 상태 확인 가능

## 🌐 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | 루트 (인증 상태에 따른 자동 리다이렉트) |
| GET | `/auth` | 성인인증 페이지 |
| POST | `/auth/verify` | 인증 결과 검증 |
| GET | `/main` | 메인 페이지 (인증 필요) |
| GET | `/logout` | 로그아웃 |

## 🔒 보안 기능

- **세션 보안**: HttpOnly 쿠키, 24시간 만료
- **개인정보 보호**: 최소한의 정보만 수집 (이름, 인증시간)
- **서버 검증**: 클라이언트가 아닌 서버에서 PortOne API 호출
- **나이 검증**: 생년월일 기반 정확한 만 19세 이상 확인

## 🛠️ 커스터마이징

### 메인 페이지 수정
`views/main.ejs` 파일의 "데모 콘텐츠" 부분을 실제 서비스에 맞게 수정:

```html
<!-- 실제 서비스 콘텐츠로 교체 -->
<div class="demo-content">
  <h2 class="demo-title">실제 서비스 제목</h2>
  <p class="demo-text">서비스 설명...</p>
  <!-- 실제 기능 버튼들 -->
</div>
```

### 스타일 수정
각 EJS 파일의 `<style>` 태그 내용을 수정하거나, `public/` 폴더에 별도 CSS 파일 생성

### 인증 조건 변경
나이 제한을 변경하려면 `server.js`의 `calculateAge` 함수 호출 부분 수정:

```javascript
if (age >= 19) { // 다른 연령으로 변경
```

## 🚨 주의사항

1. **환경변수**: `.env` 파일은 절대 Git에 커밋하지 마세요
2. **HTTPS**: 프로덕션 환경에서는 HTTPS 필수
3. **세션 시크릿**: 운영 환경에서는 안전한 랜덤 문자열 사용
4. **PortOne 비용**: 본인인증 성공 시 건당 비용 발생

## 📞 지원

기술적 문제나 질문이 있으시면 프로젝트 담당자에게 문의하세요.

---

**Made with ❤️ for Adult Verification System**