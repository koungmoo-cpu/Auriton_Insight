require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 🔍 API 키 확인
if (!process.env.GEMINI_API_KEY) {
    console.error('⚠️ GEMINI_API_KEY가 설정되지 않았습니다.');
}

// ✅ 모델 설정 (Simon님의 목록에서 확인된 최신 모델 사용)
async function callGeminiAPI(prompt, apiKey) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel(
            { model: "gemini-2.0-flash" }, 
            { apiVersion: 'v1beta' }
        );
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('--- Gemini 에러 ---', error.message);
        throw error;
    }
}

// 1️⃣ [메인 상담] 오늘의 운세 (사주+점성학, 부드러운 말투)
app.post('/api/consultation', async (req, res) => {
    try {
        console.log("=== /api/consultation 요청 수신 ===");
        const { rawData } = req.body;
        if (!rawData) return res.status(400).json({ error: '데이터가 없습니다.' });

        const systemPrompt = `당신은 지혜롭고 다정한 전문 사주명리학자이자 점성가입니다.
        이름: ${rawData.userInfo?.name}, 일주: ${rawData.saju?.day?.full}, 별자리: ${rawData.astrology?.sun?.sign} 정보를 바탕으로 오늘의 운세를 분석하세요.
        
        [지침]
        1. 반드시 부드럽고 따뜻한 '해요체' 말투를 사용하세요.
        2. 사주명리학과 점성학의 관점을 조화롭게 섞어 설명하세요.
        3. 3-4개 섹션으로 나누어 가독성 좋게 작성하세요.`;

        const text = await callGeminiAPI(systemPrompt, process.env.GEMINI_API_KEY);
        
        console.log("✅ AI 상담 생성 완료");
        // 💡 화면에서 어떤 이름을 기다릴지 몰라 두 가지 이름을 모두 보냅니다.
        res.json({ success: true, consultation: text, message: text });

    } catch (error) {
        res.status(500).json({ error: '상담 생성 중 오류가 발생했습니다.' });
    }
});

// 2️⃣ [추가 질문] 200자 이내 답변 (뤼튼과 차별화된 개인화 서비스)
app.post('/api/chat', async (req, res) => {
    try {
        console.log("=== /api/chat 추가 질문 수신 ===");
        const { userMessage, rawData } = req.body;
        
        // 🛡️ 200자 제한 로직 (프론트엔드와 일치시킴)
        if (!userMessage || userMessage.length > 200) {
            return res.status(400).json({ error: '질문은 200자 이내로 입력해 주세요.' });
        }

        // 🧠 사주 맥락을 포함한 정밀 프롬프트 (해요체 유지)
        const chatPrompt = `
        사용자 정보: 이름 ${rawData?.userInfo?.name}, 일주 ${rawData?.saju?.day?.full}, 별자리 ${rawData?.astrology?.sun?.sign}
        
        [사용자의 추가 질문]
        "${userMessage}"
        
        [지침]
        1. 위 사용자의 사주와 점성학적 기운을 바탕으로 질문에 답하세요.
        2. 말투는 매우 다정하고 부드러운 '해요체'를 사용하세요.
        3. 답변은 200자 내외로 핵심을 짚어 따뜻하게 전달하세요.
        4. 전문적인 상담사로서 Simon님의 앞날을 응원하는 마음을 담으세요.`;

        console.log("🚀 Gemini API에 질문 전달 중...");
        const answer = await callGeminiAPI(chatPrompt, process.env.GEMINI_API_KEY);
        
        console.log("✅ 추가 답변 생성 완료");
        
        // 💡 프론트엔드 fetch 함수에서 result.answer를 기다리므로 구조를 맞춥니다.
        res.json({ 
            success: true, 
            answer: answer, 
            message: answer 
        });

    } catch (error) {
        console.error('❌ 추가 질문 오류:', error.message);
        res.status(500).json({ error: '상담사와 연결이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.' });
    }
});

app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT} 실행 중`));