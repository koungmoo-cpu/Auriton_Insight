require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

async function callGeminiAPI(prompt, apiKey) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: 'v1beta' });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('--- Gemini 에러 ---', error.message);
        throw error;
    }
}

// 1️⃣ 최초 운세 분석: 결과는 'consultation' 키에 담아 보냅니다.
app.post('/api/consultation', async (req, res) => {
    try {
        const { rawData } = req.body;
        console.log("=== /api/consultation 분석 시작 ===");
        const systemPrompt = `${rawData.userInfo?.name}님의 일주(${rawData.saju?.day?.full})와 별자리(${rawData.astrology?.sun?.sign})를 바탕으로 다정하게 '해요체'로 오늘의 운세를 분석해 주세요.`;
        const text = await callGeminiAPI(systemPrompt, process.env.GEMINI_API_KEY);
        res.json({ success: true, consultation: text, rawData: rawData });
    } catch (error) {
        res.status(500).json({ success: false, error: '분석 중 오류 발생' });
    }
});

// 2️⃣ 추가 질문: 결과는 'answer' 키에 담아 보냅니다.
app.post('/api/chat', async (req, res) => {
    try {
        const { userMessage, rawData } = req.body;
        console.log("=== /api/chat 추가 질문 수신 ===");
        const chatPrompt = `사용자 사주: ${rawData?.saju?.day?.full}. 질문: ${userMessage}. 200자 이내로 매우 다정하게 답변하세요.`;
        const answer = await callGeminiAPI(chatPrompt, process.env.GEMINI_API_KEY);
        res.json({ success: true, answer: answer });
    } catch (error) {
        res.status(500).json({ success: false, error: '답변 중 오류 발생' });
    }
});

app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT} 실행 중`));