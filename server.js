// server.js
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

// 정적 파일 제공 미들웨어 (404 에러 디버깅을 위한 로깅 추가)
app.use(express.static('.', {
    // 정상적으로 파일을 찾은 경우 로깅
    setHeaders: (res, path, stat) => {
        // 정적 파일 제공 성공 시 로깅 (너무 많은 로그 방지를 위해 선택적)
        // console.log(`✅ 정적 파일 제공: ${path}`);
    }
}));

// Gemini API 키 확인
if (!process.env.GEMINI_API_KEY) {
    console.error('⚠️  경고: GEMINI_API_KEY가 .env 파일에 설정되지 않았습니다.');
    console.error('   .env 파일에 GEMINI_API_KEY=your-actual-api-key 형식으로 입력해주세요.');
}

// 직접 v1beta API 호출 함수 (gemini-pro 사용)
async function callGeminiAPI(prompt, apiKey) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    const response = await fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        await logAvailableModels(apiKey, errorText);
        throw new Error(`Gemini API 오류 (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// v1beta에서 제공하는 모델 목록을 가져와 관제 로그로 전달
async function logAvailableModels(apiKey, trigger) {
    const listUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    try {
        const response = await fetch(`${listUrl}?key=${apiKey}`);
        const payload = {
            location: 'server.js:listModels',
            message: '지원 모델 목록 확인',
            data: {
                triggerError: trigger,
                status: response.status,
                statusText: response.statusText
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run-debug1',
            hypothesisId: 'H_modelList'
        };
        if (response.ok) {
            const data = await response.json();
            payload.data.models = Array.isArray(data.models) ? data.models.map(model => model.name) : [];
            payload.data.count = payload.data.models.length;
        }
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    } catch (error) {
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                location: 'server.js:listModels',
                message: '모델 목록 조회 실패',
                data: { error: error.message, trigger: trigger },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run-debug1',
                hypothesisId: 'H_modelList'
            })
        }).catch(() => {});
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

        // 프론트엔드에서 보낸 요청 데이터 수신 관제
        console.log("=== /api/consultation 엔드포인트 요청 수신 ===");
        console.log("요청 헤더:", JSON.stringify(req.headers, null, 2));
        console.log("요청 본문 전체:", JSON.stringify(req.body, null, 2));
        console.log("요청 타임스탬프:", new Date().toISOString());
        
        const { rawData } = req.body;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:rawDataEntry',message:'rawData 수신 검증',data:{hasRawData:!!rawData,name:rawData?.userInfo?.name,birthDate:rawData?.userInfo?.birthDate,birthTime:rawData?.userInfo?.birthTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run-debug1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:36',message:'요청 데이터 수신',data:{hasRawData:!!rawData,userInfo:rawData?.userInfo?.['birthDate'],birthTime:rawData?.userInfo?.['birthTime']},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        // userName 수신 관제 로그
        const userName = rawData?.userInfo?.name || '';
        console.log("수신된 이름:", userName);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.js:54',message:'수신된 이름 확인',data:{userName,userNameLength:userName.length,hasName:!!userName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        // 시간 값 보정: 없으면 '시간 모름'
        if (!rawData.userInfo.birthTime) {
            rawData.userInfo.birthTime = '시간 모름';
            console.warn('⚠️ birthTime이 없어 시간 모름으로 설정했습니다.');
        }

        if (!rawData) {
            console.error("❌ rawData가 요청에 포함되지 않았습니다.");
            return res.status(400).json({ error: 'rawData가 필요합니다.' });
        }

        // rawData 상세 검증 및 로깅
        console.log("--- rawData 구조 검증 시작 ---");
        console.log("rawData 존재 여부:", !!rawData);
        console.log("rawData.userInfo 존재 여부:", !!rawData.userInfo);
        console.log("rawData.saju 존재 여부:", !!rawData.saju);
        console.log("rawData.astrology 존재 여부:", !!rawData.astrology);
        
        // 24시간제 시간 데이터 검증
        if (rawData.userInfo) {
            console.log("--- 사용자 정보 데이터 검증 ---");
            console.log("생년월일 (birthDate):", rawData.userInfo.birthDate);
            console.log("태어난 시간 (birthTime):", rawData.userInfo.birthTime);
            console.log("태어난 시간 타입:", typeof rawData.userInfo.birthTime);
            console.log("태어난 시간 길이:", rawData.userInfo.birthTime?.length);
            
            // 24시간제 형식 검증 (HH:MM)
            if (rawData.userInfo.birthTime) {
                const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                const isValid24Hour = timePattern.test(rawData.userInfo.birthTime);
                console.log("24시간제 형식 유효성:", isValid24Hour);
                if (!isValid24Hour) {
                    console.warn("⚠️ 경고: birthTime이 올바른 24시간제 형식(HH:MM)이 아닙니다:", rawData.userInfo.birthTime);
                }
            } else {
                console.warn("⚠️ 경고: birthTime이 없습니다.");
            }
            
            // 스크롤 날짜 데이터 검증 (scrollDate가 있는 경우)
            if (rawData.userInfo.scrollDate) {
                console.log("스크롤 날짜 (scrollDate):", rawData.userInfo.scrollDate);
                console.log("스크롤 날짜 타입:", typeof rawData.userInfo.scrollDate);
            } else {
                console.log("스크롤 날짜 (scrollDate): 없음 (선택적 필드)");
            }
            
            console.log("태어난 지역 (location):", rawData.userInfo.location);
            console.log("달력 유형 (calendarType):", rawData.userInfo.calendarType);
        }

        // rawData 유효성 검사
        if (!rawData.userInfo || !rawData.saju || !rawData.astrology) {
            console.error("❌ rawData 형식이 올바르지 않습니다.");
            console.error("누락된 필드:", {
                userInfo: !rawData.userInfo,
                saju: !rawData.saju,
                astrology: !rawData.astrology
            });
            return res.status(400).json({ error: 'rawData 형식이 올바르지 않습니다.' });
        }
        
        console.log("✅ rawData 구조 검증 완료");

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
- 태어난 시간: ${rawData.userInfo.birthTime || '알 수 없음'}
- 태어난 지역: ${rawData.userInfo.location || '알 수 없음'}
- 달력 유형: ${rawData.userInfo.calendarType || '알 수 없음'}

사주 팔자:
- 년주: ${rawData.saju.year?.full || '알 수 없음'} (${rawData.saju.year?.gan || ''}${rawData.saju.year?.ji || ''})
- 월주: ${rawData.saju.month?.full || '알 수 없음'} (${rawData.saju.month?.gan || ''}${rawData.saju.month?.ji || ''})
- 일주: ${rawData.saju.day?.full || '알 수 없음'} (${rawData.saju.day?.gan || ''}${rawData.saju.day?.ji || ''})
- 시주: ${rawData.saju.hour?.full || '알 수 없음'} (${rawData.saju.hour?.gan || ''}${rawData.saju.hour?.ji || ''})

점성학 지표:
- 태양: ${rawData.astrology.sun?.sign || '알 수 없음'} (${rawData.astrology.sun?.degree || 0}도)
- 달: ${rawData.astrology.moon?.sign || '알 수 없음'} (${rawData.astrology.moon?.degree || 0}도)
- 상승궁: ${rawData.astrology.ascendant?.sign || '알 수 없음'} (${rawData.astrology.ascendant?.degree || 0}도)

위 정보를 바탕으로 ${rawData.userInfo.name || '고객'}님에게 초기 상담 내용을 제공해주세요. 
긍정적인 면과 함께 반드시 주의해야 할 점(Shadow side)을 명확히 언급하고, 
대화를 이어갈 수 있도록 따뜻한 질문으로 마무리해주세요.`;

        // API 호출 (직접 v1 호출)
        try {
            console.log("--- Gemini API 호출 시작 (상담) ---");
            console.log("프롬프트 길이:", systemPrompt?.length);
            
            text = await callGeminiAPI(systemPrompt, process.env.GEMINI_API_KEY);
            
            console.log("✅ 텍스트 추출 완료");
            console.log("응답 텍스트 길이:", text?.length);
            console.log("응답 텍스트 미리보기 (처음 200자):", text?.substring(0, 200));
        } catch (apiError) {
            console.error('❌ Gemini API 호출 오류 (상담):', apiError);
            if (apiError.message) {
                console.error('오류 메시지:', apiError.message);
            }
            console.error('오류 발생 시점:', new Date().toISOString());
            return res.status(500).json({ 
                error: 'AI 상담 생성 중 오류가 발생했습니다.',
                details: apiError.message || '알 수 없는 오류가 발생했습니다.'
            });
        }

        if (!text) {
            console.error("❌ AI 응답이 비어있습니다.");
            return res.status(500).json({ 
                error: 'AI 응답이 비어있습니다.',
                details: '다시 시도해주세요.'
            });
        }

        console.log("--- /api/consultation 응답 전송 ---");
        console.log("응답 성공 여부: true");
        console.log("응답 메시지 길이:", text.length);
        res.json({ 
            success: true, 
            message: text 
        });

    } catch (error) {
        console.error('❌ 예상치 못한 오류 (상담):', error);
        console.error('오류 스택:', error.stack);
        console.error('오류 발생 시점:', new Date().toISOString());
        
        // 서버가 죽지 않도록 안전하게 응답
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

        // 프론트엔드에서 보낸 요청 데이터 수신 관제
        console.log("=== /api/chat 엔드포인트 요청 수신 ===");
        console.log("요청 헤더:", JSON.stringify(req.headers, null, 2));
        console.log("요청 본문 전체:", JSON.stringify(req.body, null, 2));
        console.log("요청 타임스탬프:", new Date().toISOString());
        
        const { rawData, chatHistory, userMessage } = req.body;

        if (!rawData || !userMessage) {
            console.error("❌ 필수 데이터 누락:", {
                hasRawData: !!rawData,
                hasUserMessage: !!userMessage
            });
            return res.status(400).json({ error: 'rawData와 userMessage가 필요합니다.' });
        }

        // rawData 상세 검증 및 로깅
        console.log("--- /api/chat rawData 구조 검증 시작 ---");
        console.log("rawData 존재 여부:", !!rawData);
        console.log("rawData.userInfo 존재 여부:", !!rawData.userInfo);
        console.log("rawData.saju 존재 여부:", !!rawData.saju);
        console.log("rawData.astrology 존재 여부:", !!rawData.astrology);
        
        // 24시간제 시간 데이터 검증
        if (rawData.userInfo) {
            console.log("--- 사용자 정보 데이터 검증 (채팅) ---");
            console.log("생년월일 (birthDate):", rawData.userInfo.birthDate);
            console.log("태어난 시간 (birthTime):", rawData.userInfo.birthTime);
            console.log("태어난 시간 타입:", typeof rawData.userInfo.birthTime);
            console.log("태어난 시간 길이:", rawData.userInfo.birthTime?.length);
            
            // 24시간제 형식 검증 (HH:MM)
            if (rawData.userInfo.birthTime) {
                const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                const isValid24Hour = timePattern.test(rawData.userInfo.birthTime);
                console.log("24시간제 형식 유효성:", isValid24Hour);
                if (!isValid24Hour) {
                    console.warn("⚠️ 경고: birthTime이 올바른 24시간제 형식(HH:MM)이 아닙니다:", rawData.userInfo.birthTime);
                }
            } else {
                console.warn("⚠️ 경고: birthTime이 없습니다.");
            }
            
            // 스크롤 날짜 데이터 검증 (scrollDate가 있는 경우)
            if (rawData.userInfo.scrollDate) {
                console.log("스크롤 날짜 (scrollDate):", rawData.userInfo.scrollDate);
                console.log("스크롤 날짜 타입:", typeof rawData.userInfo.scrollDate);
            } else {
                console.log("스크롤 날짜 (scrollDate): 없음 (선택적 필드)");
            }
        }
        
        console.log("사용자 메시지:", userMessage);
        console.log("사용자 메시지 타입:", typeof userMessage);
        console.log("사용자 메시지 길이:", userMessage?.length);
        console.log("채팅 히스토리 길이:", Array.isArray(chatHistory) ? chatHistory.length : "배열이 아님");

        // 입력 데이터 유효성 검사
        if (!rawData.userInfo || !rawData.saju || !rawData.astrology) {
            console.error("❌ rawData 형식이 올바르지 않습니다.");
            console.error("누락된 필드:", {
                userInfo: !rawData.userInfo,
                saju: !rawData.saju,
                astrology: !rawData.astrology
            });
            return res.status(400).json({ error: 'rawData 형식이 올바르지 않습니다.' });
        }

        if (typeof userMessage !== 'string' || userMessage.trim().length === 0) {
            console.error("❌ userMessage가 올바르지 않습니다.");
            return res.status(400).json({ error: 'userMessage가 올바르지 않습니다.' });
        }
        
        console.log("✅ /api/chat rawData 구조 검증 완료");

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

        // API 호출 (직접 v1 호출)
        let text;
        
        try {
            console.log("--- Gemini API 호출 시작 (채팅) ---");
            console.log("프롬프트 길이:", conversationPrompt?.length);
            
            text = await callGeminiAPI(conversationPrompt, process.env.GEMINI_API_KEY);
            
            console.log("✅ 텍스트 추출 완료 (채팅)");
            console.log("응답 텍스트 길이:", text?.length);
            console.log("응답 텍스트 미리보기 (처음 200자):", text?.substring(0, 200));
        } catch (apiError) {
            console.error('❌ Gemini API 호출 오류 (채팅):', apiError);
            if (apiError.message) {
                console.error('오류 메시지:', apiError.message);
            }
            console.error('오류 발생 시점:', new Date().toISOString());
            return res.status(500).json({ 
                error: 'AI 답변 생성 중 오류가 발생했습니다.',
                details: apiError.message || '알 수 없는 오류가 발생했습니다.'
            });
        }

        if (!text) {
            console.error("❌ AI 응답이 비어있습니다. (채팅)");
            return res.status(500).json({ 
                error: 'AI 응답이 비어있습니다.',
                details: '다시 시도해주세요.'
            });
        }

        console.log("--- /api/chat 응답 전송 ---");
        console.log("응답 성공 여부: true");
        console.log("응답 메시지 길이:", text.length);
        res.json({ 
            success: true, 
            message: text 
        });

    } catch (error) {
        console.error('❌ 예상치 못한 오류 (채팅):', error);
        console.error('오류 스택:', error.stack);
        console.error('오류 발생 시점:', new Date().toISOString());
        
        // 서버가 죽지 않도록 안전하게 응답
        res.status(500).json({ 
            error: '서버 오류가 발생했습니다.',
            details: process.env.NODE_ENV === 'development' ? error.message : '서버 관리자에게 문의하세요.'
        });
    }
});

// 404 에러 핸들러 (모든 라우트 이후에 배치)
app.use((req, res, next) => {
    // API 엔드포인트가 아닌 경우에만 404 처리
    if (!req.path.startsWith('/api/')) {
        console.warn(`⚠️ 404 에러: 요청한 파일을 찾을 수 없습니다.`);
        console.warn(`   요청 경로: ${req.path}`);
        console.warn(`   요청 메서드: ${req.method}`);
        console.warn(`   요청 타임스탬프: ${new Date().toISOString()}`);
        console.warn(`   요청 URL: ${req.url}`);
        console.warn(`   요청 쿼리: ${JSON.stringify(req.query)}`);
    }
    // Express 기본 404 처리
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

