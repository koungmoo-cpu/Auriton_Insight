// server.js - 배포용 수정 버전
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static('.'));

// Gemini API 키 확인
if (!process.env.GEMINI_API_KEY) {
    console.error('⚠️  경고: GEMINI_API_KEY가 .env 파일에 설정되지 않았습니다.');
    console.error('   .env 파일에 GEMINI_API_KEY=your-actual-api-key 형식으로 입력해주세요.');
}

// 직접 v1beta API 호출 함수 (gemini-pro 사용)
async function callGeminiAPI(prompt, apiKey) {
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent';
    
    try {
        const response = await fetch(`${url}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API 오류:', errorText);
            throw new Error(`Gemini API 오류 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini API 호출 실패:', error);
        throw error;
    }
}

// AI 상담 엔드포인트 (초기 상담)
app.post('/api/consultation', async (req, res) => {
    try {
        // API 키 확인
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
            return res.status(500).json({ 
                error: 'Gemini API 키가 설정되지 않았습니다.',
                details: '서버 관리자에게 문의하세요.'
            });
        }

        console.log("=== /api/consultation 요청 수신 ===");
        
        const { rawData } = req.body;

        // 시간 값 보정: 없으면 '시간 모름'
        if (rawData?.userInfo && !rawData.userInfo.birthTime) {
            rawData.userInfo.birthTime = '시간 모름';
        }

        if (!rawData) {
            return res.status(400).json({ error: 'rawData가 필요합니다.' });
        }

        // rawData 유효성 검사
        if (!rawData.userInfo || !rawData.saju || !rawData.astrology) {
            return res.status(400).json({ error: 'rawData 형식이 올바르지 않습니다.' });
        }

        // 시스템 프롬프트 (AI 상담사 페르소나)
        const systemPrompt = `당신은 20년간 사주 상담을 해온 전문 상담사입니다. 
사용자의 사주 팔자와 점성학 지표를 바탕으로 깊이 있는 상담을 제공합니다.

다음 원칙을 따라주세요:
1. 긍정적인 면과 함께 주의해야 할 점(Shadow side)을 명확히 언급합니다.
2. 따뜻하고 공감적인 톤으로 대화합니다.
3. 구체적이고 실용적인 조언을 제공합니다.
4. 사용자의 질문에 직접적으로 답변합니다.

사용자 정보:
- 이름: ${rawData.userInfo.name || '알 수 없음'}
- 생년월일: ${rawData.userInfo.birthDate || '알 수 없음'}
- 태어난 시간: ${rawData.userInfo.birthTime || '시간 모름'}
- 지역: ${rawData.userInfo.location || '알 수 없음'}
- 달력: ${rawData.userInfo.calendarType === 'solar' ? '양력' : '음력'}

사주 팔자:
- 년주: ${rawData.saju.year?.full || '알 수 없음'}
- 월주: ${rawData.saju.month?.full || '알 수 없음'}
- 일주: ${rawData.saju.day?.full || '알 수 없음'}
- 시주: ${rawData.saju.hour?.full || '시간 모름'}

점성학 정보:
- 태양: ${rawData.astrology.sun?.sign || '알 수 없음'}
- 달: ${rawData.astrology.moon?.sign || '알 수 없음'}
- 상승: ${rawData.astrology.ascendant?.sign || '알 수 없음'}

위 정보를 바탕으로 사용자의 종합 운세를 분석하고, 구체적인 조언을 제공해주세요.
답변은 한국어로 작성하며, 3-4개의 섹션으로 나누어 설명해주세요.`;

        // API 호출
        console.log("Gemini API 호출 시작...");
        const text = await callGeminiAPI(systemPrompt, process.env.GEMINI_API_KEY);
        
        console.log("✅ AI 상담 생성 완료");
        res.json({ 
            success: true, 
            consultation: text 
        });

    } catch (error) {
        console.error('❌ /api/consultation 오류:', error);
        res.status(500).json({ 
            error: '서버 오류가 발생했습니다.',
            details: process.env.NODE_ENV === 'development' ? error.message : '서버 관리자에게 문의하세요.'
        });
    }
});

// AI 채팅 엔드포인트 (사용자 질문에 대한 답변)
app.post('/api/chat', async (req, res) => {
    try {
        // API 키 확인
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                error: 'Gemini API 키가 설정되지 않았습니다.',
                details: '서버 관리자에게 문의하세요.'
            });
        }

        console.log("=== /api/chat 요청 수신 ===");
        
        const { rawData, chatHistory, userMessage } = req.body;

        if (!rawData || !userMessage) {
            return res.status(400).json({ error: 'rawData와 userMessage가 필요합니다.' });
        }

        // 입력 데이터 유효성 검사
        if (!rawData.userInfo || !rawData.saju || !rawData.astrology) {
            return res.status(400).json({ error: 'rawData 형식이 올바르지 않습니다.' });
        }

        if (typeof userMessage !== 'string' || userMessage.trim().length === 0) {
            return res.status(400).json({ error: 'userMessage가 올바르지 않습니다.' });
        }

        // 채팅 히스토리 구성
        const history = Array.isArray(chatHistory) ? chatHistory : [];
        
        // 시스템 프롬프트
        const systemContext = `당신은 20년간 사주 상담을 해온 전문 상담사입니다.

사용자 정보:
- 이름: ${rawData.userInfo.name || '알 수 없음'}
- 사주: ${rawData.saju.day?.full || '알 수 없음'} 일주, ${rawData.saju.year?.full || '알 수 없음'}년생
- 점성학: 태양 ${rawData.astrology.sun?.sign || '알 수 없음'}, 달 ${rawData.astrology.moon?.sign || '알 수 없음'}

이전 대화 맥락을 유지하면서 사용자의 질문에 답변해주세요.`;

        // 대화 히스토리를 프롬프트에 포함
        let conversationPrompt = systemContext + '\n\n';
        
        if (history.length > 0) {
            conversationPrompt += '이전 대화:\n';
            history.forEach(msg => {
                if (msg && msg.role && msg.content) {
                    conversationPrompt += `${msg.role === 'user' ? '사용자' : '상담사'}: ${msg.content}\n`;
                }
            });
            conversationPrompt += '\n';
        }

        conversationPrompt += `사용자 질문: ${userMessage.trim()}\n\n위 질문에 대해 사주와 점성학 지표를 바탕으로 답변해주세요.`;

        // API 호출
        console.log("Gemini API 호출 시작 (채팅)...");
        const text = await callGeminiAPI(conversationPrompt, process.env.GEMINI_API_KEY);
        
        if (!text) {
            return res.status(500).json({ 
                error: 'AI 응답이 비어있습니다.',
                details: '다시 시도해주세요.'
            });
        }

        console.log("✅ AI 답변 생성 완료");
        res.json({ 
            success: true, 
            message: text 
        });

    } catch (error) {
        console.error('❌ /api/chat 오류:', error);
        res.status(500).json({ 
            error: '서버 오류가 발생했습니다.',
            details: process.env.NODE_ENV === 'development' ? error.message : '서버 관리자에게 문의하세요.'
        });
    }
});

// 404 에러 핸들러
app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) {
        console.warn(`⚠️ 404: ${req.path}`);
    }
    res.status(404).send('404 - 파일을 찾을 수 없습니다.');
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        console.log('⚠️  GEMINI_API_KEY를 .env 파일에 설정해주세요.');
    } else {
        console.log('✅ Gemini API 키가 설정되었습니다.');
    }
});
