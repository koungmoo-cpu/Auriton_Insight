# 천명AI (CheonMyeongAI) 배포 가이드

## 🎯 문제 해결: 500 에러 원인

### 발견된 문제들:
1. **로컬 디버깅 코드**: `fetch('http://127.0.0.1:7242/...')` - 서버에 없는 로컬 엔드포인트 호출
2. **환경변수 파일 이름**: `_env` → `.env`로 변경 필요
3. **에러 처리 부족**: try-catch 블록 개선 필요

## 📋 배포 전 체크리스트

### 1. 파일 교체
```bash
# 기존 server.js를 백업
cp server.js server.js.backup

# 수정된 server.js로 교체
cp server_fixed.js server.js

# 환경변수 파일 이름 변경
mv _env .env
```

### 2. .gitignore 확인
```bash
# .gitignore에 .env가 포함되어 있는지 확인
cat .gitignore | grep ".env"
```

### 3. 로컬 테스트
```bash
# 로컬에서 실행 테스트
npm install
npm start

# 다른 터미널에서 테스트
curl -X POST http://localhost:3000/api/consultation \
  -H "Content-Type: application/json" \
  -d '{"rawData": {"userInfo": {...}, "saju": {...}, "astrology": {...}}}'
```

## 🚀 배포 방법 (플랫폼별)

### A. Vercel 배포

1. **프로젝트 준비**
```bash
# vercel.json 생성
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
EOF
```

2. **배포 실행**
```bash
# Vercel CLI 설치 (처음 한 번만)
npm i -g vercel

# 배포
vercel

# 환경변수 설정 (Vercel 대시보드에서)
# Settings → Environment Variables
# GEMINI_API_KEY = AIzaSyAebzhE4JBnE0SNhCAh5VrKm_1kdn-XoyU
```

### B. Render 배포

1. **Render.com 접속** → New Web Service

2. **설정**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `GEMINI_API_KEY` = `AIzaSyAebzhE4JBnE0SNhCAh5VrKm_1kdn-XoyU`

### C. Railway 배포

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 프로젝트 생성
railway init

# 환경변수 설정
railway variables set GEMINI_API_KEY=AIzaSyAebzhE4JBnE0SNhCAh5VrKm_1kdn-XoyU

# 배포
railway up
```

## 🔐 보안 주의사항

### ⚠️ CRITICAL: API 키 노출 위험!

현재 `.env` 파일에 실제 API 키가 있습니다:
```
GEMINI_API_KEY=AIzaSyAebzhE4JBnE0SNhCAh5VrKm_1kdn-XoyU
```

**해야 할 일:**

1. **GitHub에 푸시하기 전**
```bash
# .gitignore 확인
echo ".env" >> .gitignore

# 이미 커밋된 경우 기록에서 제거
git rm --cached .env
git commit -m "Remove .env from git history"
```

2. **새 API 키 발급 (권장)**
   - Google AI Studio (https://makersuite.google.com/app/apikey)
   - 기존 키 삭제
   - 새 키 발급
   - `.env` 파일 업데이트

3. **.env.example 생성**
```bash
cat > .env.example << 'EOF'
GEMINI_API_KEY=your-gemini-api-key-here
PORT=3000
NODE_ENV=production
EOF
```

## 🎨 서비스 이름 최종 추천

### 1차 추천: **천명AI (CheonMyeongAI)**
- 의미: 하늘이 정한 운명
- 도메인: cheonmyeong.ai, cheonmyeongai.com
- 한영 조합으로 글로벌 대응 가능

### 2차 추천: **운명코드 (DestinyCode)**
- 의미: AI로 해석하는 운명의 코드
- 현대적이고 기술 친화적

### 3차 추천: **사주봇 (SajuBot)**
- 의미: 사주를 분석하는 AI 봇
- 직관적이고 기억하기 쉬움

## 📊 해커톤 제출 준비

### README.md 작성
```markdown
# 천명AI - AI 기반 사주·점성학 운세 상담

## 소개
사주명리학과 서양 점성학을 결합한 AI 상담 서비스

## 기술 스택
- Backend: Node.js, Express
- AI: Google Gemini Pro
- Frontend: Vanilla JavaScript

## 특징
- 사주 팔자와 점성학 통합 분석
- 대화형 AI 상담
- 실시간 채팅 기능

## 설치 및 실행
\`\`\`bash
npm install
npm start
\`\`\`
```

### 데모 영상 준비
1. 정보 입력 화면
2. AI 상담 결과 화면
3. 채팅 기능 시연

## 🐛 문제 발생 시 디버깅

### 서버 로그 확인
```bash
# 로컬
npm start

# Vercel
vercel logs

# Render
# Dashboard → Logs 탭

# Railway
railway logs
```

### 일반적인 에러와 해결법

**1. "GEMINI_API_KEY가 설정되지 않았습니다"**
```bash
# 환경변수가 제대로 설정되었는지 확인
echo $GEMINI_API_KEY

# 플랫폼 대시보드에서 환경변수 재설정
```

**2. "Cannot find module 'express'"**
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

**3. "Port already in use"**
```bash
# 다른 포트 사용
PORT=3001 npm start
```

## 🎯 다음 단계

1. ✅ 500 에러 수정 (완료)
2. 🔄 로컬 테스트
3. 🚀 배포 플랫폼 선택 및 배포
4. 📝 README 작성
5. 🎬 데모 영상 제작
6. 📤 해커톤 제출

## 📞 지원

문제가 계속되면:
1. 서버 로그 전체 복사
2. 에러 메시지 스크린샷
3. 배포 플랫폼 이름

Good luck with the hackathon! 🚀
