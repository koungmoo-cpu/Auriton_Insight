// 1. 환경 변수 로드 (가장 첫 줄에 단 한 번만!)
require('dotenv').config(); 

// 통신 안정화를 위한 추가 설정
const https = require('https');
const agent = new https.Agent({ keepAlive: true });
// (이후 genAI 호출 시 내부적으로 이 설정을 사용하도록 시도합니다.)

const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 및 정적 파일 설정
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 🔍 [진단 로그] 서버 켤 때 키가 제대로 들어왔는지 확인합니다.
console.log("=== 서버 기동 로그 ===");
if (!process.env.GEMINI_API_KEY) {
    console.error('⚠️  경고: .env 파일에서 GEMINI_API_KEY를 읽지 못했습니다!');
} else {
    console.log("✅ API 키 로드 성공 (앞 4자리):", process.env.GEMINI_API_KEY.substring(0, 4));
}

// Gemini API 호출 함수
async function callGeminiAPI(prompt, apiKey) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel(
            { model: "gemini-2.0-flash" }, // Simon님의 메뉴판에 있던 이름입니다.
            { apiVersion: 'v1beta' }
        );

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('--- Gemini 상세 에러 ---');
        console.error('메시지:', error.message);
        if (error.status) console.error('상태 코드:', error.status);
        throw error;
    }
}

// ✅ 49번 줄부터 시작하는 app.post 부분을 이 코드로 교체하세요.
app.post('/api/consultation', async (req, res) => {
    try {
        console.log("=== /api/consultation 요청 수신 ===");
        const { rawData } = req.body;
        
        if (!rawData) return res.status(400).json({ error: '데이터가 없습니다.' });

        // 1. 사주와 점성학을 결합한 부드러운 말투의 프롬프트 구성
        const systemPrompt = `당신은 따뜻하고 지혜로운 전문 사주명리학자이자 점성가입니다. 
        다음 정보를 바탕으로 오늘의 운세를 분석해 주세요. 말투는 매우 다정하고 부드러운 '해요체'를 사용하세요.

        [사용자 정보]
        이름: ${rawData.userInfo?.name}
        사주 일주: ${rawData.saju?.day?.full}
        점성학 별자리: ${rawData.astrology?.sun?.sign}

        [답변 가이드라인]
        1. 사주명리학적 관점에서 본 기운 (일주 중심)
        2. 점성학적 별자리 기운
        3. 오늘을 위한 따뜻한 조언 한마디
        각 섹션을 나누어 친절하게 설명해 주세요.`;

        console.log("🚀 AI 상담 생성 시작...");
        const text = await callGeminiAPI(systemPrompt, process.env.GEMINI_API_KEY);
        
        console.log("✅ AI 상담 생성 완료");
        res.json({ success: true, consultation: text });

    } catch (error) {
        console.error('❌ API 호출 오류:', error.message);
        res.status(500).json({ error: '상담 생성 중 오류가 발생했습니다.' });
    }
});

// ✅ 추가 질문 답변용 엔드포인트 (100자 이내 제한 적용)
app.post('/api/chat', async (req, res) => {
    try {
        const { question, history } = req.body;
        
        if (question.length > 100) {
            return res.status(400).json({ error: '질문은 100자 이내로 입력해 주세요.' });
        }

        const chatPrompt = `이전 상담 내용: ${history}\n\n사용자의 추가 질문: ${question}\n\n이 질문에 대해 사주와 점성학적 관점에서 100자 이내로 아주 짧고 다정하게 답변해 주세요.`;
        
        const answer = await callGeminiAPI(chatPrompt, process.env.GEMINI_API_KEY);
        res.json({ success: true, answer: answer });
    } catch (error) {
        res.status(500).json({ error: '답변 생성 중 오류가 발생했습니다.' });
    }
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).send('404 - 파일을 찾을 수 없습니다.');
});

app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

// server.js 하단에 잠시 추가
async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // v1beta 버전으로 모델 목록을 요청합니다.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("=== 사용 가능한 모델 목록 ===");
        if (data.models) {
            data.models.forEach(m => console.log("- " + m.name));
        } else {
            console.log("모델을 하나도 찾지 못했습니다. 키 설정을 확인하세요.");
            console.log("응답 내용:", JSON.stringify(data));
        }
        console.log("============================");
    } catch (err) {
        console.error("목록 불러오기 실패:", err.message);
    }
}
listModels();