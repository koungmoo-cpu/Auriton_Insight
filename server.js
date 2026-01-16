require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

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
    console.log("=== /api/consultation 요청 수신 ===");
    console.log("요청 본문:", JSON.stringify(req.body, null, 2));
    
    try {
        const { rawData } = req.body;
        
        // rawData 유효성 검사
        if (!rawData) {
            console.error("rawData가 없습니다");
            return res.status(400).json({ 
                success: false, 
                error: '분석에 필요한 데이터가 없습니다.' 
            });
        }
        
        if (!rawData.userInfo) {
            console.error("userInfo가 없습니다");
            return res.status(400).json({ 
                success: false, 
                error: '사용자 정보가 누락되었습니다.' 
            });
        }
        
        const userName = rawData.userInfo?.name || '고객';
        const dayFull = rawData.saju?.day?.full || '정보없음';
        const sunSign = rawData.astrology?.sun?.sign || '정보없음';
        const moonSign = rawData.astrology?.moon?.sign || '정보없음';
        const fourPillars = rawData.saju?.fourPillars || '정보없음';
        
        console.log(`분석 시작: ${userName}님, 일주: ${dayFull}, 별자리: ${sunSign}`);
        
        const systemPrompt = `당신은 20년 경력의 전문 사주 상담사입니다. 

${userName}님의 사주 정보:
- 사주 팔자: ${fourPillars}
- 일주: ${dayFull}
- 태양 별자리: ${sunSign}
- 달 별자리: ${moonSign}
- 성별: ${rawData.userInfo?.gender === 'male' ? '남성' : '여성'}
- 태어난 곳: ${rawData.userInfo?.location || '미입력'}

위 정보를 바탕으로 ${userName}님에게 다정하고 따뜻한 '해요체'로 종합 운세를 분석해 주세요.
다음 내용을 포함해주세요:
1. 인사와 함께 사주의 전체적인 특징
2. 성격과 장점
3. 주의해야 할 점
4. 올해의 운세 흐름
5. 마무리 인사와 추가 질문 유도

500자 내외로 작성해주세요.`;

        const text = await callGeminiAPI(systemPrompt, process.env.GEMINI_API_KEY);
        
        console.log("Gemini 응답 성공, 길이:", text.length);
        
        res.json({ 
            success: true, 
            consultation: text,
            message: text, // 호환성을 위해 둘 다 전송
            rawData: rawData 
        });
        
    } catch (error) {
        console.error('=== /api/consultation 에러 ===');
        console.error('에러:', error.message);
        
        res.status(500).json({ 
            success: false, 
            error: '분석 중 오류가 발생했습니다: ' + error.message 
        });
    }
});

// 2️⃣ 추가 질문 API
app.post('/api/chat', async (req, res) => {
    console.log("=== /api/chat 요청 수신 ===");
    console.log("요청 본문:", JSON.stringify(req.body, null, 2));
    
    try {
        const { userMessage, rawData } = req.body;
        
        // 유효성 검사
        if (!userMessage || !userMessage.trim()) {
            return res.status(400).json({ 
                success: false, 
                error: '질문을 입력해주세요.' 
            });
        }
        
        const userName = rawData?.userInfo?.name || '고객';
        const dayFull = rawData?.saju?.day?.full || '정보없음';
        const fourPillars = rawData?.saju?.fourPillars || '정보없음';
        const sunSign = rawData?.astrology?.sun?.sign || '정보없음';
        
        console.log(`추가 질문: ${userName}님 - "${userMessage}"`);
        
        const chatPrompt = `당신은 20년 경력의 전문 사주 상담사입니다.

${userName}님의 사주 정보:
- 사주 팔자: ${fourPillars}
- 일주: ${dayFull}
- 태양 별자리: ${sunSign}

${userName}님의 질문: "${userMessage}"

위 사주 정보를 바탕으로 질문에 대해 다정하고 따뜻한 '해요체'로 답변해주세요.
답변은 200자 이내로 간결하게 작성하되, 사주의 특성을 반영하여 맞춤형으로 답변해주세요.`;

        const answer = await callGeminiAPI(chatPrompt, process.env.GEMINI_API_KEY);
        
        console.log("채팅 응답 성공, 길이:", answer.length);
        
        res.json({ 
            success: true, 
            answer: answer 
        });
        
    } catch (error) {
        console.error('=== /api/chat 에러 ===');
        console.error('에러:', error.message);
        
        res.status(500).json({ 
            success: false, 
            error: '답변 생성 중 오류가 발생했습니다: ' + error.message 
        });
    }
});

// 404 핸들러
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({ error: 'Not Found', path: req.url });
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error('서버 에러:', err);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    console.log(`📁 정적 파일 경로: ${__dirname}`);
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  경고: GEMINI_API_KEY가 설정되지 않았습니다!');
        console.warn('   .env 파일에 GEMINI_API_KEY=your-api-key 형식으로 추가해주세요.');
    } else {
        console.log('✅ GEMINI_API_KEY 설정됨');
    }
});
