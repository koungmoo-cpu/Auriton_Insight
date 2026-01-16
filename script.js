// script.js
console.log("관제 알림: 자바스크립트 엔진 정상 로드 완료");
console.log("관제 알림: 모든 엔진이 정상 로드되었습니다.");

// 천간지지 배열 정의
const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']; // 10천간
const JIJI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']; // 12지지

// 전역 변수: Raw Data와 채팅 기록 저장
window.globalRawData = null;
let chatHistory = [];

// 12시진 시간대 정의 (중간값 HH:MM)
const TIME_RANGES = [
    { label: '시간 모름', value: '' },
    { label: '자시 (00:00~01:29)', value: '00:45' },
    { label: '축시 (01:30~03:29)', value: '02:30' },
    { label: '인시 (03:30~05:29)', value: '04:30' },
    { label: '묘시 (05:30~07:29)', value: '06:30' },
    { label: '진시 (07:30~09:29)', value: '08:30' },
    { label: '사시 (09:30~11:29)', value: '10:30' },
    { label: '오시 (11:30~13:29)', value: '12:30' },
    { label: '미시 (13:30~15:29)', value: '14:30' },
    { label: '신시 (15:30~17:29)', value: '16:30' },
    { label: '유시 (17:30~19:29)', value: '18:30' },
    { label: '술시 (19:30~21:29)', value: '20:30' },
    { label: '해시 (21:30~23:29)', value: '22:30' },
    { label: '야자/夜子 (23:30~23:59)', value: '23:45' }
];

// 성별 선택 토글
function selectGender(value) {
    const genderInput = document.getElementById('gender');
    const buttons = document.querySelectorAll('.gender-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === value);
    });
    if (genderInput) {
        genderInput.value = value;
    }
    clearError('genderError');
    validateForm();
}

// 성별 체크박스(단일 선택) 핸들러
function selectGenderCheckbox(value) {
    const genderInput = document.getElementById('gender');
    const male = document.getElementById('genderMale');
    const female = document.getElementById('genderFemale');
    if (value === 'male') {
        if (male) male.checked = true;
        if (female) female.checked = false;
    } else {
        if (male) male.checked = false;
        if (female) female.checked = true;
    }
    const wrappers = document.querySelectorAll('.gender-check');
    wrappers.forEach(w => w.classList.remove('selected'));
    const target = value === 'male' ? (male ? male.parentElement : null) : (female ? female.parentElement : null);
    if (target) target.classList.add('selected');
    if (genderInput) {
        genderInput.value = value;
    }
    clearError('genderError');
    validateForm();
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM 로드 완료, 초기화 시작");
    initializeTimeSelectors();
    initializeValidation();
    initializeChat();
    attachSubmitHandler();
});

// 생년월일 선택 박스 초기화
function initializeDateSelectors() {
    const birthYear = document.getElementById('birthYear');
    const birthMonth = document.getElementById('birthMonth');
    const birthDay = document.getElementById('birthDay');
    const birthDate = document.getElementById('birthDate');
    
    if (!birthYear || !birthMonth || !birthDay || !birthDate) return;
    
    // 연도 옵션 생성 (1900년 ~ 현재 연도)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '년';
        birthYear.appendChild(option);
    }
    
    // 월 옵션 생성 (1월 ~ 12월)
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month + '월';
        birthMonth.appendChild(option);
    }
    
    // 일 옵션은 월과 연도에 따라 동적으로 업데이트
    function updateDayOptions() {
        const year = parseInt(birthYear.value);
        const month = parseInt(birthMonth.value);
        
        // 기존 일 옵션 제거 (첫 번째 "일" 옵션 제외)
        while (birthDay.options.length > 1) {
            birthDay.remove(1);
        }
        
        if (year && month) {
            // 해당 월의 마지막 날짜 계산
            const lastDay = new Date(year, month, 0).getDate();
            
            // 일 옵션 생성
            for (let day = 1; day <= lastDay; day++) {
                const option = document.createElement('option');
                option.value = day;
                option.textContent = day + '일';
                birthDay.appendChild(option);
            }
        }
        
        // hidden input 업데이트
        updateBirthDate();
    }
    
    // 연도나 월이 변경되면 일 옵션 업데이트
    birthYear.addEventListener('change', function() {
        updateDayOptions();
        validateForm();
    });
    
    birthMonth.addEventListener('change', function() {
        updateDayOptions();
        validateForm();
    });
    
    birthDay.addEventListener('change', function() {
        updateBirthDate();
        validateForm();
    });
    
    // hidden input 업데이트 함수
    function updateBirthDate() {
        const year = birthYear.value;
        const month = birthMonth.value;
        const day = birthDay.value;
        
        if (year && month && day) {
            // YYYY-MM-DD 형식으로 변환
            const formattedMonth = month.padStart(2, '0');
            const formattedDay = day.padStart(2, '0');
            birthDate.value = `${year}-${formattedMonth}-${formattedDay}`;
        } else {
            birthDate.value = '';
        }
    }
}

// 시간 선택 박스 초기화
function initializeTimeSelectors() {
    const birthTimeSelect = document.getElementById('birthTime');
    if (!birthTimeSelect) return;
    birthTimeSelect.addEventListener('change', function() {
        console.log("관제 알림: 선택된 시진 - ", birthTimeSelect.value || '시간 모름');
        validateForm();
    });
}

// 폼 제출 처리
function attachSubmitHandler() {
    const form = document.getElementById('sajuForm');
    if (!form) {
        console.error("폼을 찾을 수 없습니다");
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log("폼 제출 이벤트 발생");
        
        const name = (document.getElementById('userName')?.value || '').trim();
        const locationVal = (document.getElementById('location')?.value || '').trim();
        const genderVal = document.getElementById('gender')?.value || '';
        const birthDateRaw = (document.getElementById('birthDateInput')?.value || '').trim();
        const birthTimeVal = document.getElementById('birthTime')?.value || '';
        const calendarType = document.getElementById('calendarType')?.value || '';

        const payloadPreview = { name, location: locationVal, gender: genderVal, birthDateRaw, birthTime: birthTimeVal, calendarType };
        console.log("폼 제출 시작: ", payloadPreview);

        // 간단 검증
        if (!name || !locationVal || !genderVal || !birthDateRaw || !birthTimeVal || !calendarType) {
            alert('모든 필드를 입력/선택해주세요.');
            return;
        }
        const pattern = /^\d{8}$/;
        if (!pattern.test(birthDateRaw)) {
            alert('생년월일은 8자리로 입력해주세요. 예: 19900101');
            return;
        }
        const formattedDate = `${birthDateRaw.substring(0,4)}-${birthDateRaw.substring(4,6)}-${birthDateRaw.substring(6,8)}`;
        const timeForCalc = (birthTimeVal === 'unknown' || birthTimeVal === '') ? '00:00' : birthTimeVal;

        // 버튼 비활성화 및 로딩 표시
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '분석 중...';
        }

        try {
            const sajuData = calculateSajuPalgja(formattedDate, timeForCalc, calendarType);
            const astrologyData = calculateAstrology(formattedDate, timeForCalc, locationVal);

            const rawData = {
                userInfo: {
                    name,
                    birthDate: formattedDate,
                    birthTime: birthTimeVal === 'unknown' ? '' : birthTimeVal,
                    location: locationVal,
                    calendarType,
                    gender: genderVal
                },
                saju: sajuData,
                astrology: astrologyData
            };

            console.log("API 호출 시작: /api/consultation");
            const res = await fetch('/api/consultation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawData })
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `HTTP ${res.status}`);
            }
            
            // 서버 응답을 JSON으로 변환
            const data = await res.json();
            console.log("API 응답 수신:", data);

            if (data.success) {
                // (1) 결과 영역을 화면에 표시
                const resultArea = document.getElementById('resultArea');
                if (resultArea) {
                    resultArea.style.display = 'block';
                }
                
                // (2) AI의 첫 번째 분석 답변을 타이핑 효과로 출력
                await addAIMessage(data.message || data.consultation || '분석이 완료되었습니다.');

                // (3) 추가 질문을 위해 분석 원본 데이터를 전역에 저장
                window.globalRawData = rawData; 
                console.log("관제 알림: 추가 질문용 데이터 저장 완료", window.globalRawData);

                // (4) 숨겨져 있던 200자 추가 질문 섹션을 화면에 띄움
                if (typeof showAdditionalQuestion === 'function') {
                    showAdditionalQuestion();
                }
            } else {
                alert("분석 실패: " + (data.error || "알 수 없는 에러"));
            }
        } catch (err) {
            console.error("서버 연결 실패:", err);
            alert("서버 연결 실패: " + (err?.message || err));
        } finally {
            // 버튼 복원
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.textContent = '분석 시작';
            }
        }
    });
}

// 채팅 초기화
function initializeChat() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    
    if (chatInput && sendButton) {
        // Enter 키로 전송
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendUserMessage();
            }
        });
        
        // 입력창에 포커스가 있을 때만 전송 버튼 활성화
        chatInput.addEventListener('input', function() {
            sendButton.disabled = !chatInput.value.trim();
        });
    }
}

// 유효성 검사 초기화
function initializeValidation() {
    const userName = document.getElementById('userName');
    const birthDateInput = document.getElementById('birthDateInput');
    const birthTimeSelect = document.getElementById('birthTime');
    const location = document.getElementById('location');
    const calendarType = document.getElementById('calendarType');

    // 성함 입력 검증 (글로벌 유저 고려 - 영문, 한글, 공백만 허용, 특수문자 없이 100자까지)
    let isComposing = false;

    if (userName) {
        userName.addEventListener('compositionstart', () => { isComposing = true; });
        userName.addEventListener('compositionend', (e) => {
            isComposing = false;
            handleNameInput(e);
        });
        userName.addEventListener('input', function(e) {
            if (isComposing) return;
            handleNameInput(e);
        });
    }

    function handleNameInput(e) {
        let value = e.target.value;
        
        // 최대 길이 제한 (100자)
        if (value.length > 100) {
            value = value.substring(0, 100);
            e.target.value = value;
        }
        
        // 영문 대소문자, 한글, 공백만 허용하는 정규식
        const validPattern = /^[a-zA-Z가-힣\s]*$/;
        
        if (value && !validPattern.test(value)) {
            const cleanedValue = value.replace(/[^a-zA-Z가-힣\s]/g, '');
            e.target.value = cleanedValue;
            
            if (value !== cleanedValue) {
                showError('userNameError', '특수문자와 숫자는 입력할 수 없습니다.');
                setTimeout(() => clearError('userNameError'), 3000);
            }
        } else {
            clearError('userNameError');
        }
        
        validateForm();
    }

    // 생년월일 검증
    if (birthDateInput) {
        birthDateInput.addEventListener('input', function(e) {
            // 숫자만 허용
            this.value = this.value.replace(/[^0-9]/g, '');
            validateBirthDate();
            validateForm();
        });
    }
    
    function validateBirthDate() {
        if (!birthDateInput) return false;
        const value = birthDateInput.value.trim();
        const pattern = /^\d{8}$/;
        if (!value) {
            clearError('birthDateError');
            return false;
        }
        if (!pattern.test(value)) {
            showError('birthDateError', '8자리로 입력해주세요. 예: 19900101');
            return false;
        }
        // 유효한 날짜인지 간단 검증
        const y = parseInt(value.substring(0,4),10);
        const m = parseInt(value.substring(4,6),10);
        const d = parseInt(value.substring(6,8),10);
        const dateObj = new Date(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
        if (isNaN(dateObj.getTime()) || dateObj.getFullYear()!==y || (dateObj.getMonth()+1)!==m || dateObj.getDate()!==d) {
            showError('birthDateError', '유효한 날짜를 입력해주세요.');
            return false;
        }
        clearError('birthDateError');
        return true;
    }

    // 태어난 시간 검증
    if (birthTimeSelect) {
        birthTimeSelect.addEventListener('change', function() {
            if (this.value === '') {
                showError('birthTimeError', '태어난 시간을 선택해주세요.');
            } else {
                clearError('birthTimeError');
            }
            validateForm();
        });
    }

    // 태어난 지역 검증
    if (location) {
        location.addEventListener('input', function() {
            validateField('location', 'locationError', this.value.trim(), '태어난 지역을 입력해주세요.');
            validateForm();
        });
    }

    // 달력 선택 검증
    if (calendarType) {
        calendarType.addEventListener('change', function() {
            validateField('calendarType', 'calendarTypeError', this.value, '달력 유형을 선택해주세요.');
            validateForm();
        });
    }

    // 초기 검증 실행
    validateForm();
}

// 필드별 유효성 검사
function validateField(fieldId, errorId, value, errorMessage) {
    if (!value || value.trim() === '') {
        showError(errorId, errorMessage);
        return false;
    } else {
        clearError(errorId);
        return true;
    }
}

// 에러 메시지 표시
function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

// 에러 메시지 제거
function clearError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// 전체 폼 유효성 검사 및 버튼 활성화/비활성화
function validateForm() {
    const userNameEl = document.getElementById('userName');
    const birthDateInputEl = document.getElementById('birthDateInput');
    const birthTimeSelectEl = document.getElementById('birthTime');
    const locationEl = document.getElementById('location');
    const calendarTypeEl = document.getElementById('calendarType');
    const genderEl = document.getElementById('gender');
    const analyzeBtn = document.getElementById('analyzeBtn');

    const userName = userNameEl ? userNameEl.value.trim() : '';
    const birthDateVal = birthDateInputEl ? birthDateInputEl.value.trim() : '';
    const birthTimeVal = birthTimeSelectEl ? birthTimeSelectEl.value : '';
    const locationVal = locationEl ? locationEl.value.trim() : '';
    const calendarTypeVal = calendarTypeEl ? calendarTypeEl.value : '';
    const genderVal = genderEl ? genderEl.value : '';

    // 모든 필드가 입력되었는지 확인
    const isBirthDateValid = birthDateVal && /^\d{8}$/.test(birthDateVal);
    const isBirthTimeValid = birthTimeVal !== '';
    
    const isValid = userName && 
                    isBirthDateValid && 
                    isBirthTimeValid && 
                    locationVal && 
                    calendarTypeVal &&
                    genderVal;

    // 버튼 활성화/비활성화
    if (analyzeBtn) {
        analyzeBtn.disabled = !isValid;
    }
    
    return isValid;
}

// 날짜 유효성 검증 함수
function validateDateTime(dateStr, timeStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return { valid: false, message: '유효하지 않은 날짜입니다' };
        }

        const year = date.getFullYear();
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) {
            return { valid: false, message: '유효하지 않은 날짜입니다 (1900년 ~ 현재)' };
        }

        if (!timeStr) {
            return { valid: true };
        }
        const timeParts = timeStr.split(':');
        if (timeParts.length !== 2) {
            return { valid: false, message: '유효하지 않은 시간입니다' };
        }
        const hour = parseInt(timeParts[0], 10);
        const minute = parseInt(timeParts[1], 10);
        if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            return { valid: false, message: '유효하지 않은 시간입니다' };
        }

        return { valid: true };
    } catch (error) {
        return { valid: false, message: '유효하지 않은 날짜입니다' };
    }
}

// 양력을 음력으로 변환 (lunar-javascript 사용)
function convertToLunar(solarDate) {
    try {
        const date = new Date(solarDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // lunar-javascript가 로드되었는지 확인
        if (typeof Lunar !== 'undefined') {
            let lunar;
            
            // API 방식 1: Solar.fromYmd().getLunar() - 6tail/lunar-javascript 표준 방식
            if (typeof Solar !== 'undefined' && typeof Solar.fromYmd === 'function') {
                try {
                    const solar = Solar.fromYmd(year, month, day);
                    const lunarObj = solar.getLunar();
                    lunar = {
                        lYear: lunarObj.getYear(),
                        lMonth: lunarObj.getMonth(),
                        lDay: lunarObj.getDay(),
                        isLeap: lunarObj.isLeap ? lunarObj.isLeap() : false
                    };
                } catch (e) {
                    console.warn('Solar.fromYmd 방식 실패:', e);
                }
            }
            
            // API 방식 2: Lunar.solar2lunar()
            if (!lunar && typeof Lunar.solar2lunar === 'function') {
                lunar = Lunar.solar2lunar(year, month, day);
            }
            
            // API 방식 3: new Lunar() 생성자
            if (!lunar && typeof Lunar === 'function') {
                try {
                    const lunarObj = new Lunar(year, month, day);
                    if (lunarObj.getLunarYear) {
                        lunar = {
                            lYear: lunarObj.getLunarYear(),
                            lMonth: lunarObj.getLunarMonth(),
                            lDay: lunarObj.getLunarDay(),
                            isLeap: lunarObj.isLeapMonth ? lunarObj.isLeapMonth() : false
                        };
                    }
                } catch (e) {
                    console.warn('new Lunar() 방식 실패:', e);
                }
            }
            
            if (lunar && (lunar.lYear || lunar.year)) {
                return {
                    year: lunar.lYear || lunar.year,
                    month: lunar.lMonth || lunar.month,
                    day: lunar.lDay || lunar.day,
                    isLeapMonth: lunar.isLeap || lunar.isLeapMonth || false
                };
            }
        }
        
        // 라이브러리가 없거나 변환 실패 시 양력 그대로 반환 (fallback)
        console.warn('lunar-javascript를 사용할 수 없어 양력 날짜를 그대로 사용합니다.');
        return {
            year: year,
            month: month,
            day: day,
            isLeapMonth: false
        };
    } catch (error) {
        console.error('음력 변환 오류:', error);
        const date = new Date(solarDate);
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            isLeapMonth: false
        };
    }
}

// 사주 팔자 계산 함수
function calculateSajuPalgja(birthDate, birthTime, calendarType) {
    try {
        let year, month, day;
        const date = new Date(birthDate);
        
        // 달력 유형에 따라 처리
        if (calendarType === 'solar') {
            const lunar = convertToLunar(birthDate);
            year = lunar.year;
            month = lunar.month;
            day = lunar.day;
        } else if (calendarType === 'lunar' || calendarType === 'lunar_leap') {
            year = date.getFullYear();
            month = date.getMonth() + 1;
            day = date.getDate();
        } else {
            year = date.getFullYear();
            month = date.getMonth() + 1;
            day = date.getDate();
        }

        // 시간 파싱
        const timeParts = birthTime.split(':');
        const hour = parseInt(timeParts[0], 10);
        const minute = parseInt(timeParts[1], 10);

        // 연주 계산
        const yearGanIndex = (year - 4) % 10;
        const yearJiIndex = (year - 4) % 12;
        const yearGan = CHEONGAN[yearGanIndex >= 0 ? yearGanIndex : yearGanIndex + 10];
        const yearJi = JIJI[yearJiIndex >= 0 ? yearJiIndex : yearJiIndex + 12];

        // 월주 계산 (입춘 기준 간략화)
        const monthJiIndex = (month + 1) % 12;
        const monthGanBase = (yearGanIndex % 5) * 2;
        const monthGanIndex = (monthGanBase + month - 1) % 10;
        const monthGan = CHEONGAN[monthGanIndex];
        const monthJi = JIJI[monthJiIndex];

        // 일주 계산 (간략 공식)
        const baseDate = new Date(1900, 0, 31);
        const diffDays = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
        const dayGanIndex = diffDays % 10;
        const dayJiIndex = diffDays % 12;
        const dayGan = CHEONGAN[dayGanIndex >= 0 ? dayGanIndex : dayGanIndex + 10];
        const dayJi = JIJI[dayJiIndex >= 0 ? dayJiIndex : dayJiIndex + 12];

        // 시주 계산
        let hourJiIndex;
        if (hour >= 23 || hour < 1) hourJiIndex = 0;
        else hourJiIndex = Math.floor((hour + 1) / 2);
        
        const hourGanBase = (dayGanIndex % 5) * 2;
        const hourGanIndex = (hourGanBase + hourJiIndex) % 10;
        const hourGan = CHEONGAN[hourGanIndex];
        const hourJi = JIJI[hourJiIndex];

        return {
            year: { gan: yearGan, ji: yearJi, full: yearGan + yearJi },
            month: { gan: monthGan, ji: monthJi, full: monthGan + monthJi },
            day: { gan: dayGan, ji: dayJi, full: dayGan + dayJi },
            hour: { gan: hourGan, ji: hourJi, full: hourGan + hourJi },
            fourPillars: `${yearGan}${yearJi} ${monthGan}${monthJi} ${dayGan}${dayJi} ${hourGan}${hourJi}`
        };
    } catch (error) {
        console.error('사주 계산 오류:', error);
        return {
            year: { gan: '갑', ji: '자', full: '갑자' },
            month: { gan: '갑', ji: '자', full: '갑자' },
            day: { gan: '갑', ji: '자', full: '갑자' },
            hour: { gan: '갑', ji: '자', full: '갑자' },
            fourPillars: '갑자 갑자 갑자 갑자'
        };
    }
}

// 서양 점성술 계산 함수
function calculateAstrology(birthDate, birthTime, location) {
    try {
        const date = new Date(birthDate);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // 태양 별자리 계산
        const zodiacSigns = [
            { name: '염소자리', start: [12, 22], end: [1, 19] },
            { name: '물병자리', start: [1, 20], end: [2, 18] },
            { name: '물고기자리', start: [2, 19], end: [3, 20] },
            { name: '양자리', start: [3, 21], end: [4, 19] },
            { name: '황소자리', start: [4, 20], end: [5, 20] },
            { name: '쌍둥이자리', start: [5, 21], end: [6, 21] },
            { name: '게자리', start: [6, 22], end: [7, 22] },
            { name: '사자자리', start: [7, 23], end: [8, 22] },
            { name: '처녀자리', start: [8, 23], end: [9, 22] },
            { name: '천칭자리', start: [9, 23], end: [10, 23] },
            { name: '전갈자리', start: [10, 24], end: [11, 21] },
            { name: '사수자리', start: [11, 22], end: [12, 21] }
        ];

        let sunSign = '양자리';
        for (const sign of zodiacSigns) {
            const [startMonth, startDay] = sign.start;
            const [endMonth, endDay] = sign.end;
            
            if (startMonth === 12 && endMonth === 1) {
                if ((month === 12 && day >= startDay) || (month === 1 && day <= endDay)) {
                    sunSign = sign.name;
                    break;
                }
            } else {
                if ((month === startMonth && day >= startDay) || 
                    (month === endMonth && day <= endDay) ||
                    (month > startMonth && month < endMonth)) {
                    sunSign = sign.name;
                    break;
                }
            }
        }

        // 달 별자리 (간략 계산)
        const moonCycle = (date.getTime() / (1000 * 60 * 60 * 24)) % 29.5;
        const moonSignIndex = Math.floor((moonCycle / 29.5) * 12);
        const moonSigns = ['양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리', 
                          '천칭자리', '전갈자리', '사수자리', '염소자리', '물병자리', '물고기자리'];
        const moonSign = moonSigns[moonSignIndex];

        // 상승궁 (시간 기반 간략 계산)
        const timeParts = birthTime.split(':');
        const hour = parseInt(timeParts[0], 10);
        const ascendantIndex = (Math.floor(hour / 2) + Math.floor((month - 1))) % 12;
        const ascendantSign = moonSigns[ascendantIndex];

        return {
            sun: { sign: sunSign, degree: day },
            moon: { sign: moonSign, degree: Math.floor(moonCycle) },
            ascendant: { sign: ascendantSign, degree: hour * 15 },
            location: location
        };
    } catch (error) {
        console.error('점성술 계산 오류:', error);
        return {
            sun: { sign: '양자리', degree: 0 },
            moon: { sign: '양자리', degree: 0 },
            ascendant: { sign: '양자리', degree: 0 },
            location: location
        };
    }
}

// 채팅 메시지 추가 함수
function addAIMessage(text) {
    return new Promise((resolve) => {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) {
            console.error('chatMessages 요소를 찾을 수 없습니다');
            resolve();
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message';
        messageDiv.style.cssText = 'background: #f0f7ff; padding: 1rem; border-radius: 1rem; margin-bottom: 0.5rem; line-height: 1.7;';
        chatMessages.appendChild(messageDiv);
        
        // 타이핑 효과
        typeText(messageDiv, text).then(resolve);
    });
}

function addUserMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    messageDiv.style.cssText = 'background: #e8f4fd; padding: 1rem; border-radius: 1rem; margin-bottom: 0.5rem; text-align: right;';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// 사용자 메시지 전송 (결과 영역 내 채팅)
async function sendUserMessage() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!chatInput || !chatInput.value.trim()) return;
    
    const userMessage = chatInput.value.trim();
    chatInput.value = '';
    
    // 버튼 비활성화
    if (sendButton) sendButton.disabled = true;
    
    // 사용자 메시지 표시
    addUserMessage(userMessage);
    
    // 로딩 메시지 추가
    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'chatLoading';
    loadingDiv.className = 'ai-message loading';
    loadingDiv.style.cssText = 'background: #f0f7ff; padding: 1rem; border-radius: 1rem; margin-bottom: 0.5rem;';
    loadingDiv.textContent = '답변을 생성하고 있습니다...';
    if (chatMessages) chatMessages.appendChild(loadingDiv);
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userMessage: userMessage,
                rawData: window.globalRawData
            })
        });
        
        const result = await response.json();
        
        // 로딩 제거
        const loading = document.getElementById('chatLoading');
        if (loading) loading.remove();
        
        if (result.success) {
            await addAIMessage(result.answer);
        } else {
            await addAIMessage('죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('채팅 오류:', error);
        const loading = document.getElementById('chatLoading');
        if (loading) loading.remove();
        await addAIMessage('서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
        if (sendButton) sendButton.disabled = false;
    }
}

// 추가 질문 섹션 표시
function showAdditionalQuestion() {
    const section = document.getElementById('additional-question-section');
    if (section) {
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth' });
        console.log("추가 질문창 활성화 완료");
    }
}

// 타이핑 효과 함수
async function typeText(element, text) {
    if (!element) return;
    
    element.textContent = '';
    element.style.whiteSpace = 'pre-wrap';
    element.style.lineHeight = '1.7';
    
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        const delay = text[i] === '\n' ? 100 : (Math.random() * 20 + 20);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (i % 10 === 0) {
            scrollToBottom();
        }
    }
    
    scrollToBottom();
}

// 스크롤 하단으로 이동
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}
