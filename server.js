require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ 보안 헤더 설정 ============

// 1. CSP (Content Security Policy) 헤더 추가
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://generativelanguage.googleapis.com"]
        }
    }
}));

// 2. 추가 보안 헤더
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Rate limiting 설정 - IP당 15분간 10회 제한
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 10, // 최대 10회 요청
    message: { 
        success: false, 
        error: '너무 많은 요청을 보냈습니다. 15분 후 다시 시도해주세요.' 
    },
    standardHeaders: true,
    legacyHeaders: false
});

// CORS 설정 - 실제 배포 도메인만 허용
const allowedOrigins = [
    'https://auriton-insight-ai.vercel.app',
    'https://auriton-insight.vercel.app',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// 3. 요청 크기 제한 조정 (보안 강화)
app.use(express.json({ limit: '100kb' }));

// API 엔드포인트에 rate limiting 적용
app.use('/api/', apiLimiter);

// 입력값 필터링 함수
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // 악의적인 스크립트 태그 제거
    let sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
    
    // 프롬프트 인젝션 시도 차단
    const maliciousPatterns = [
        /ignore\s+(?:previous|above|all)\s+(?:instructions?|prompts?|rules?)/gi,
        /forget\s+(?:everything|all|previous)/gi,
        /(?:system|admin)\s*[:=]\s*["']/gi,
        /\[\s*system\s*\]/gi,
        /roleplay\s+as/gi,
        /pretend\s+(?:to\s+be|you\s+are)/gi
    ];
    
    for (const pattern of maliciousPatterns) {
        sanitized = sanitized.replace(pattern, '[차단된 내용]');
    }
    
    // 길이 제한 (최대 1000자)
    if (sanitized.length > 1000) {
        sanitized = sanitized.substring(0, 1000) + '...';
    }
    
    return sanitized;
}

// 에러 핸들러 함수
function handleError(error, res, defaultMessage = '서비스 처리 중 오류가 발생했습니다.') {
    if (process.env.NODE_ENV === 'development') {
        console.error('에러 상세:', error);
    }
    
    // 클라이언트에는 일반적인 메시지만 반환
    return res.status(500).json({ 
        success: false, 
        error: defaultMessage 
    });
}

// 정적 파일 서빙 (현재 디렉토리)
app.use(express.static(path.join(__dirname)));

// Gemini API 호출 함수
async function callGeminiAPI(prompt, apiKey) {
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.');
    }
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: 'v1beta' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('--- Gemini API 에러 ---');
        console.error('에러 메시지:', error.message);
        console.error('에러 상세:', error);
        throw error;
    }
}

// 루트 경로 - index.html 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1️⃣ 최초 운세 분석 API
app.post('/api/consultation', async (req, res) => {
    if (process.env.NODE_ENV === 'development') {
        console.log("=== /api/consultation 요청 수신 ===");
    }
    
    try {
        const { rawData } = req.body;
        
        // rawData 유효성 검사
        if (!rawData) {
            return res.status(400).json({ 
                success: false, 
                error: '분석에 필요한 데이터가 없습니다.' 
            });
        }
        
        if (!rawData.userInfo) {
            return res.status(400).json({ 
                success: false, 
                error: '사용자 정보가 누락되었습니다.' 
            });
        }
        
        // 사용자 입력값 검증 및 정제
        const sanitizedName = sanitizeInput(rawData.userInfo?.name || '');
        const sanitizedLocation = sanitizeInput(rawData.userInfo?.location || '');
        
        if (!sanitizedName.trim() || !sanitizedLocation.trim()) {
            return res.status(400).json({ 
                success: false, 
                error: '필수 정보가 누락되거나 올바르지 않습니다.' 
            });
        }
        
        const userName = sanitizedName || '고객';
        const dayFull = rawData.saju?.day?.full || '정보없음';
        const sunSign = rawData.astrology?.sun?.sign || '정보없음';
        const moonSign = rawData.astrology?.moon?.sign || '정보없음';
        const fourPillars = rawData.saju?.fourPillars || '정보없음';
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`분석 시작: ${userName}님, 일주: ${dayFull}, 별자리: ${sunSign}`);
        }
        
        const systemPrompt = `당신은 20년 경력의 전문 사주 상담사입니다. 

${userName}님의 사주 정보:
- 사주 팔자: ${fourPillars}
- 일주: ${dayFull}
- 태양 별자리: ${sunSign}
- 달 별자리: ${moonSign}
- 성별: ${rawData.userInfo?.gender === 'male' ? '남성' : '여성'}
- 태어난 곳: ${sanitizedLocation}

위 정보를 바탕으로 ${userName}님에게 다정하고 따뜻한 '해요체'로 종합 운세를 분석해 주세요.

총 300자 이내로 답변하세요.
1) [타고난 성향] 200자로 상세히 설명 (성격, 강점, 재물운, 주의점 포함)
2) [오늘의 운세] 100자로 간결하게 안내

반드시 [타고난 성향]과 [오늘의 운세] 제목을 붙여서 구분해주세요.`;

        const text = await callGeminiAPI(systemPrompt, process.env.GEMINI_API_KEY);
        
        if (process.env.NODE_ENV === 'development') {
            console.log("Gemini 응답 성공, 길이:", text.length);
        }
        
        res.json({ 
            success: true, 
            consultation: text,
            message: text, // 호환성을 위해 둘 다 전송
            rawData: rawData 
        });
        
    } catch (error) {
        return handleError(error, res, '운세 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
});

// 2️⃣ 추가 질문 API
app.post('/api/chat', async (req, res) => {
    if (process.env.NODE_ENV === 'development') {
        console.log("=== /api/chat 요청 수신 ===");
    }
    
    try {
        const { userMessage, rawData } = req.body;
        
        // 유효성 검사 및 입력값 정제
        if (!userMessage || !userMessage.trim()) {
            return res.status(400).json({ 
                success: false, 
                error: '질문을 입력해주세요.' 
            });
        }
        
        const sanitizedMessage = sanitizeInput(userMessage.trim());
        
        if (!sanitizedMessage || sanitizedMessage === '[차단된 내용]') {
            return res.status(400).json({ 
                success: false, 
                error: '적절하지 않은 내용이 포함되어 있습니다. 다시 입력해주세요.' 
            });
        }
        
        const userName = sanitizeInput(rawData?.userInfo?.name) || '고객';
        const dayFull = rawData?.saju?.day?.full || '정보없음';
        const fourPillars = rawData?.saju?.fourPillars || '정보없음';
        const sunSign = rawData?.astrology?.sun?.sign || '정보없음';
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`추가 질문: ${userName}님 - "${sanitizedMessage}"`);
        }
        
        const chatPrompt = `당신은 20년 경력의 전문 사주 상담사입니다.

${userName}님의 사주 정보:
- 사주 팔자: ${fourPillars}
- 일주: ${dayFull}
- 태양 별자리: ${sunSign}

${userName}님의 질문: "${sanitizedMessage}"

위 사주 정보를 바탕으로 질문에 대해 다정하고 따뜻한 '해요체'로 답변해주세요.
300자 이내로 답변하세요. 사주를 바탕으로 질문에 친절하고 구체적으로 답변해주세요.`;

        const answer = await callGeminiAPI(chatPrompt, process.env.GEMINI_API_KEY);
        
        if (process.env.NODE_ENV === 'development') {
            console.log("채팅 응답 성공, 길이:", answer.length);
        }
        
        res.json({ 
            success: true, 
            answer: answer 
        });
        
    } catch (error) {
        return handleError(error, res, '답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
});

// 404 핸들러
app.use((req, res) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('404 Not Found:', req.method, req.url);
    }
    res.status(404).json({ error: '요청하신 페이지를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error('서버 에러:', err);
    }
    return handleError(err, res, '서비스에 일시적 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Auriton InsightAI 서버 시작: Port ${PORT}`);
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`📁 정적 파일 경로: ${__dirname}`);
    }
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  경고: GEMINI_API_KEY가 설정되지 않았습니다!');
        console.warn('   .env 파일에 GEMINI_API_KEY=your-api-key 형식으로 추가해주세요.');
    } else {
        console.log('✅ GEMINI_API_KEY 설정 완료');
        console.log('✅ 보안 설정 적용 완료 (Rate Limiting, CORS, Input Sanitization)');
    }
});

// graceful shutdown 처리
process.on('SIGTERM', () => {
    console.log('📺 서버 종료 신호 수신, graceful shutdown...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n📺 Ctrl+C 감지, 서버를 종료합니다.');
    process.exit(0);
});
