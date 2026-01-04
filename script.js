// script.js
console.log("관제 알림: 자바스크립트 엔진 정상 로드 완료");
console.log("관제 알림: 모든 엔진이 정상 로드되었습니다.");

// 천간지지 배열 정의
const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']; // 10천간
const JIJI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']; // 12지지

// 전역 변수: Raw Data와 채팅 기록 저장
let globalRawData = null;
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
        male.checked = true;
        female.checked = false;
    } else {
        male.checked = false;
        female.checked = true;
    }
    const wrappers = document.querySelectorAll('.gender-check');
    wrappers.forEach(w => w.classList.remove('selected'));
    const target = value === 'male' ? male.parentElement : female.parentElement;
    if (target) target.classList.add('selected');
    if (genderInput) {
        genderInput.value = value;
    }
    clearError('genderError');
    validateForm();
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:initializeDateSelectors',message:'연도 옵션 생성 완료',data:{yearCount:birthYear.options.length-1},timestamp:Date.now(),sessionId:'debug-session',runId:'run-debug3',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    
    // 월 옵션 생성 (1월 ~ 12월)
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month + '월';
        birthMonth.appendChild(option);
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:initializeDateSelectors',message:'월 옵션 생성 완료',data:{monthCount:birthMonth.options.length-1},timestamp:Date.now(),sessionId:'debug-session',runId:'run-debug3',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    
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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:updateDayOptions',message:'일 옵션 생성 완료',data:{lastDay,lastDayCount:lastDay,year,month},timestamp:Date.now(),sessionId:'debug-session',runId:'run-debug3',hypothesisId:'H5'})}).catch(()=>{});
            // #endregion
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
    if (!form) return;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
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

            const res = await fetch('http://localhost:3000/api/consultation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawData })
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `HTTP ${res.status}`);
            }
            const data = await res.json();
            document.getElementById('resultArea').style.display = 'block';
            await addAIMessage(data.message || '분석이 완료되었습니다.');
        } catch (err) {
            alert("서버 연결 실패: " + (err?.message || err));
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
    const birthTime = document.getElementById('birthTime');
    const location = document.getElementById('location');
    const calendarType = document.getElementById('calendarType');
    const gender = document.getElementById('gender');
    const analyzeBtn = document.getElementById('analyzeBtn');

    // 성함 입력 검증 (글로벌 유저 고려 - 영문, 한글, 공백만 허용, 특수문자 없이 100자까지)
    let isComposing = false;

    if (userName) {
        userName.addEventListener('compositionstart', () => { isComposing = true; });
        userName.addEventListener('compositionend', (e) => {
            isComposing = false;
            // 조합 종료 후 최종 값으로 한 번만 정리
            handleNameInput(e);
        });
        userName.addEventListener('input', function(e) {
            if (isComposing) return; // IME 조합 중에는 건드리지 않음
            handleNameInput(e);
        });
    }

    function handleNameInput(e) {
        let value = e.target.value;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:userNameInput',message:'이름 입력 변경',data:{raw:value,length:value?.length,isComposing},timestamp:Date.now(),sessionId:'debug-session',runId:'run-debug2',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        
        // 최대 길이 제한 (100자)
        if (value.length > 100) {
            value = value.substring(0, 100);
            e.target.value = value;
        }
        
        // 영문 대소문자, 한글, 공백만 허용하는 정규식 (특수문자 제거)
        // 한글: 가-힣 (완성형 한글), 영문: a-zA-Z, 공백: \s
        const validPattern = /^[a-zA-Z가-힣\s]*$/;
        
        if (value && !validPattern.test(value)) {
            // 허용되지 않는 문자(특수문자, 숫자 등) 제거
            const cleanedValue = value.replace(/[^a-zA-Z가-힣\s]/g, '');
            e.target.value = cleanedValue;
            
            // 에러 메시지 표시 (한 번만)
            if (value !== cleanedValue) {
                showError('userNameError', '특수문자와 숫자는 입력할 수 없습니다. 영문, 한글, 공백만 입력 가능합니다.');
                // 3초 후 에러 메시지 자동 제거
                setTimeout(() => clearError('userNameError'), 3000);
            }
        } else {
            clearError('userNameError');
        }
        
        validateForm();
    }

    // 생년월일 검증 (직접 입력 YYYY-MM-DD)
    function validateBirthDate() {
        if (!birthDateInput) return false;
        const value = birthDateInput.value.trim();
        const pattern = /^\d{8}$/;
        if (!value || !pattern.test(value)) {
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
    
    if (birthDateInput) birthDateInput.addEventListener('input', validateBirthDate);

    // 태어난 시간 검증
    function validateBirthTime() {
        if (birthTimeSelect) {
            const val = birthTimeSelect.value;
            if (val === '') {
                showError('birthTimeError', '태어난 시간을 선택해주세요.');
                return false;
            }
            clearError('birthTimeError');
            return true;
        }
        return false;
    }
    
    if (birthTimeSelect) birthTimeSelect.addEventListener('change', validateBirthTime);

    // 태어난 지역 검증
    location.addEventListener('input', function() {
        validateField('location', 'locationError', location.value.trim(), '태어난 지역을 입력해주세요.');
        validateForm();
    });

    // 성별 검증
    function validateGender() {
        if (!gender || !gender.value) {
            showError('genderError', '성별을 선택해주세요.');
            return false;
        }
        clearError('genderError');
        return true;
    }

    // 달력 선택 검증
    calendarType.addEventListener('change', function() {
        validateField('calendarType', 'calendarTypeError', calendarType.value, '달력 유형을 선택해주세요.');
        validateForm();
    });

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
    const userName = document.getElementById('userName').value.trim();
    const birthDateVal = birthDateInput ? birthDateInput.value.trim() : '';
    const birthTimeSelect = document.getElementById('birthTime');
    const location = document.getElementById('location').value.trim();
    const calendarType = document.getElementById('calendarType').value;
    const genderVal = gender ? gender.value : '';
    const analyzeBtn = document.getElementById('analyzeBtn');

    // 모든 필드가 입력되었는지 확인
    const isBirthDateValid = birthDateVal && /^\d{8}$/.test(birthDateVal);
    const isBirthTimeValid = birthTimeSelect && birthTimeSelect.value !== '';
    
    const isValid = userName && 
                    isBirthDateValid && 
                    isBirthTimeValid && 
                    location && 
                    calendarType &&
                    genderVal;

    // 버튼 활성화/비활성화
    if (analyzeBtn) {
        analyzeBtn.disabled = !isValid;
    }
}

// 날짜 유효성 검증 함수
function validateDateTime(dateStr, timeStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return { valid: false, message: '유효하지 않은 날짜입니다' };
        }

        // 날짜 범위 검증 (1900년 ~ 현재)
        const year = date.getFullYear();
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) {
            return { valid: false, message: '유효하지 않은 날짜입니다 (1900년 ~ 현재)' };
        }

        // 시간 검증
        if (!timeStr) {
            return { valid: true }; // 시간 모름 허용
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
        
        // lunar-javascript가 로드되었는지 확인하고 다양한 API 시도
        if (typeof Lunar !== 'undefined') {
            let lunar;
            
            // API 방식 1: Lunar.solar2lunar()
            if (typeof Lunar.solar2lunar === 'function') {
                lunar = Lunar.solar2lunar(year, month, day);
            }
            // API 방식 2: new Lunar() 생성자
            else if (typeof Lunar === 'function') {
                const lunarObj = new Lunar(year, month, day);
                if (lunarObj.getLunarYear) {
                    lunar = {
                        lYear: lunarObj.getLunarYear(),
                        lMonth: lunarObj.getLunarMonth(),
                        lDay: lunarObj.getLunarDay(),
                        isLeap: lunarObj.isLeapMonth ? lunarObj.isLeapMonth() : false
                    };
                }
            }
            // API 방식 3: Lunar.fromYmd()
            else if (typeof Lunar.fromYmd === 'function') {
                const lunarObj = Lunar.fromYmd(year, month, day);
                if (lunarObj) {
                    lunar = {
                        lYear: lunarObj.getLunarYear ? lunarObj.getLunarYear() : year,
                        lMonth: lunarObj.getLunarMonth ? lunarObj.getLunarMonth() : month,
                        lDay: lunarObj.getLunarDay ? lunarObj.getLunarDay() : day,
                        isLeap: lunarObj.isLeapMonth ? lunarObj.isLeapMonth() : false
                    };
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
            // 양력인 경우 음력으로 변환
            const lunar = convertToLunar(birthDate);
            year = lunar.year;
            month = lunar.month;
            day = lunar.day;
        } else if (calendarType === 'lunar' || calendarType === 'lunar_leap') {
            // 음력인 경우 직접 사용
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

        // 년주 계산 (입춘 기준)
        const newYearDate = new Date(year, 0, 1); // 1월 1일
        const springStart = new Date(year, 1, 4); // 입춘 대략 2월 4일경
        const isBeforeSpring = date < springStart && date.getMonth() < 1;
        const sajuYear = isBeforeSpring ? year - 1 : year;
        
        // 간단한 사주 계산 (실제로는 더 복잡한 알고리즘 필요)
        const yearGan = CHEONGAN[(sajuYear - 4) % 10];
        const yearJi = JIJI[(sajuYear - 4) % 12];
        
        const monthGan = CHEONGAN[((sajuYear - 4) % 10 * 2 + month) % 10];
        const monthJi = JIJI[(month + 1) % 12];
        
        // 일주 계산 (간단한 알고리즘)
        const baseDate = new Date(1900, 0, 1);
        const daysDiff = Math.floor((date - baseDate) / (1000 * 60 * 60 * 24));
        const dayGan = CHEONGAN[daysDiff % 10];
        const dayJi = JIJI[daysDiff % 12];
        
        // 시주 계산
        const timeIndex = Math.floor((hour + 1) / 2) % 12; // 자시(23-1)부터 시작
        const hourGan = CHEONGAN[((daysDiff % 10) * 2 + timeIndex) % 10];
        const hourJi = JIJI[timeIndex];

        return {
            year: {
                gan: yearGan,
                ji: yearJi,
                full: `${yearGan}${yearJi}`
            },
            month: {
                gan: monthGan,
                ji: monthJi,
                full: `${monthGan}${monthJi}`
            },
            day: {
                gan: dayGan,
                ji: dayJi,
                full: `${dayGan}${dayJi}`
            },
            hour: {
                gan: hourGan,
                ji: hourJi,
                full: `${hourGan}${hourJi}`
            }
        };
    } catch (error) {
        console.error('사주 계산 오류:', error);
        throw new Error('사주 계산 중 오류가 발생했습니다.');
    }
}

// 점성학 지표 계산 함수 (기본 계산)
function calculateAstrology(birthDate, birthTime, location) {
    try {
        const date = new Date(birthDate);
        const timeParts = birthTime.split(':');
        const hour = parseInt(timeParts[0], 10);
        const minute = parseInt(timeParts[1], 10);
        
        // 태양 위치 계산 (간단한 계산)
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const sunPosition = (dayOfYear / 365) * 360; // 0-360도
        
        // 달 위치 계산 (간단한 계산 - 실제로는 더 복잡)
        const moonCycle = 29.5; // 달의 주기
        const moonPosition = ((dayOfYear % moonCycle) / moonCycle) * 360;
        
        // 상승궁 계산 (간단한 계산 - 실제로는 시간과 위치 기반)
        const ascendantPosition = (hour * 15 + (minute / 60) * 15) % 360; // 시간 기반 간단 계산
        
        // 별자리 매핑
        const zodiacSigns = ['양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리',
                            '천칭자리', '전갈자리', '사수자리', '염소자리', '물병자리', '물고기자리'];
        
        const getZodiacSign = (position) => {
            const index = Math.floor(position / 30);
            return zodiacSigns[index % 12];
        };

        return {
            sun: {
                position: Math.round(sunPosition),
                sign: getZodiacSign(sunPosition),
                degree: Math.round((sunPosition % 30) * 10) / 10
            },
            moon: {
                position: Math.round(moonPosition),
                sign: getZodiacSign(moonPosition),
                degree: Math.round((moonPosition % 30) * 10) / 10
            },
            ascendant: {
                position: Math.round(ascendantPosition),
                sign: getZodiacSign(ascendantPosition),
                degree: Math.round((ascendantPosition % 30) * 10) / 10
            }
        };
    } catch (error) {
        console.error('점성학 계산 오류:', error);
        throw new Error('점성학 계산 중 오류가 발생했습니다.');
    }
}

// 분석 시작 함수
async function processAnalysis() {
    const birthDateRaw = document.getElementById('birthDateInput').value.trim();
    const birthTimeSelect = document.getElementById('birthTime');
    const birthTimeVal = birthTimeSelect ? birthTimeSelect.value : '';
    const gender = document.getElementById('gender').value;
    
    // 날짜 형식: 8자리 -> YYYY-MM-DD로 변환
    const formattedDate = `${birthDateRaw.substring(0,4)}-${birthDateRaw.substring(4,6)}-${birthDateRaw.substring(6,8)}`;
    // 시간: 선택값 그대로 사용(unknown이면 빈 값 처리)
    const formattedTime = birthTimeVal === 'unknown' ? '' : birthTimeVal;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:581',message:'날짜/시간 포맷팅 완료',data:{formattedDate,formattedTime,birthDateRaw,birthTimeVal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // userName 변수 수집 및 로깅
    const userNameInput = document.getElementById('userName');
    const userName = userNameInput ? userNameInput.value.trim() : '';
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:586',message:'userName 변수 수집',data:{userName,userNameLength:userName.length,hasInput:!!userNameInput},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const formData = {
        name: userName,
        date: formattedDate,
        time: formattedTime,
        location: document.getElementById('location').value.trim(),
        type: document.getElementById('calendarType').value,
        gender: gender
    };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:593',message:'formData 생성 완료',data:{name:formData.name,nameLength:formData.name.length,hasDate:!!formData.date,hasTime:!!formData.time},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // 최종 유효성 검사
    if (!formData.name || !formData.date || !formData.time || !formData.location || !formData.type) {
        alert('모든 항목을 입력해주세요.');
        return;
    }

    // 날짜/시간 유효성 검증
    const dateValidation = validateDateTime(formData.date, formData.time);
    if (!dateValidation.valid) {
        alert(dateValidation.message);
        return;
    }

    try {
        // 1단계: 계산 엔진 가동 - 사주 팔자 계산
        const sajuData = calculateSajuPalgja(formData.date, formData.time, formData.type);
        
        // 2단계: 점성학 지표 계산
        const astrologyData = calculateAstrology(formData.date, formData.time, formData.location);
        
        // 3단계: Raw Data 객체 생성
        const rawData = {
            userInfo: {
                name: formData.name,
                birthDate: formData.date,
                birthTime: formData.time,
                location: formData.location,
                calendarType: formData.type,
                gender: formData.gender
            },
            saju: sajuData,
            astrology: astrologyData
        };
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:rawDataCheck',message:'rawData 필드 검증',data:{name:rawData?.userInfo?.name,birthDate:rawData?.userInfo?.birthDate,birthTime:rawData?.userInfo?.birthTime,calendarType:rawData?.userInfo?.calendarType,location:rawData?.userInfo?.location},timestamp:Date.now(),sessionId:'debug-session',runId:'run-debug1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:622',message:'Raw Data 생성 완료',data:{birthDate:rawData.userInfo.birthDate,birthTime:rawData.userInfo.birthTime,calendarType:rawData.userInfo.calendarType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        // 4단계: 결과 화면에 출력
        document.getElementById('resultArea').style.display = 'block';
        
        // Raw Data를 텍스트로 포맷팅
        const rawDataText = JSON.stringify(rawData, null, 2);
        document.getElementById('sajuData').innerHTML = `
            <strong>사주 팔자:</strong><br>
            년주: ${sajuData.year.full} (${sajuData.year.gan}${sajuData.year.ji})<br>
            월주: ${sajuData.month.full} (${sajuData.month.gan}${sajuData.month.ji})<br>
            일주: ${sajuData.day.full} (${sajuData.day.gan}${sajuData.day.ji})<br>
            시주: ${sajuData.hour.full} (${sajuData.hour.gan}${sajuData.hour.ji})
        `;
        
        document.getElementById('astrologyData').innerHTML = `
            <strong>점성학 지표:</strong><br>
            태양: ${astrologyData.sun.sign} (${astrologyData.sun.degree}도)<br>
            달: ${astrologyData.moon.sign} (${astrologyData.moon.degree}도)<br>
            상승궁: ${astrologyData.ascendant.sign} (${astrologyData.ascendant.degree}도)
        `;

        // Raw Data 전체를 콘솔에도 출력 (디버깅용)
        console.log('Raw Data:', rawData);

        // Raw Data를 전역 변수에 저장 (대화 맥락 유지용)
        globalRawData = rawData;
        chatHistory = []; // 새로운 분석 시작 시 채팅 기록 초기화
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:globalRawDataSet',message:'globalRawData 저장',data:{hasRawData:!!globalRawData,name:globalRawData?.userInfo?.name,birthTime:globalRawData?.userInfo?.birthTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run-debug1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion

        // 5단계: AI 연동 (핵심)
        await getAIInterpretation(sajuData, astrologyData, rawData);
    } catch (error) {
        alert('계산 중 오류가 발생했습니다: ' + error.message);
        console.error('분석 오류:', error);
    }
}

// AI 상담 함수 - 서버를 통해 Gemini API 호출
async function getAIInterpretation(saju, astrology, rawData) {
    const chatMessages = document.getElementById('chatMessages');
    
    // 채팅 메시지 영역 초기화
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // 로딩 메시지 추가
    addLoadingMessage();
    
    try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:673',message:'서버 API 호출 시작',data:{birthDate:rawData?.userInfo?.birthDate,birthTime:rawData?.userInfo?.birthTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        // 서버 API 호출
        const response = await fetch('http://localhost:3000/api/consultation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rawData })
        });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3c84f3af-0d8e-47a2-aa1b-e521e7c0cdc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:682',message:'서버 응답 수신',data:{status:response?.status,ok:response?.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'AI 상담 생성에 실패했습니다.');
        }

        // 로딩 메시지 제거 후 AI 답변 추가
        removeLoadingMessage();
        await addAIMessage(data.message);
        
        // 채팅 기록에 추가
        chatHistory.push({ role: 'assistant', content: data.message });
        
    } catch (error) {
        console.error('AI 상담 오류:', error);
        removeLoadingMessage();
        
        // 에러 메시지 표시
        const errorMessage = `죄송합니다. AI 상담 생성 중 오류가 발생했습니다.\n\n${error.message}\n\n서버가 실행 중인지 확인해주세요.`;
        await addAIMessage(errorMessage);
    }
}

// 로딩 메시지 추가
function addLoadingMessage() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingMessage';
    loadingDiv.className = 'chat-message message-ai';
    loadingDiv.innerHTML = `
        <div class="message-header">AI 상담사</div>
        <div class="message-content">
            <div class="loading-container" style="padding: 20px; text-align: center;">
                <div class="loading-spinner" style="width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #ffffff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
                <p style="color: #ffffff; font-size: 14px; margin: 0;">운명을 읽어오는 중입니다...</p>
            </div>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    scrollToBottom();
}

// 로딩 메시지 제거
function removeLoadingMessage() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// 사용자 메시지 전송 함수
async function sendUserMessage() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!chatInput || !chatInput.value.trim() || !globalRawData) {
        return;
    }
    
    const userMessage = chatInput.value.trim();
    
    // 사용자 메시지 추가
    addUserMessage(userMessage);
    
    // 입력창 초기화 및 버튼 비활성화
    chatInput.value = '';
    if (sendButton) {
        sendButton.disabled = true;
    }
    
    // 채팅 기록에 추가
    chatHistory.push({ role: 'user', content: userMessage });
    
    // 로딩 메시지 표시
    addLoadingMessage();
    
    try {
        // 서버 API 호출
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                rawData: globalRawData,
                chatHistory: chatHistory.slice(0, -1), // 현재 사용자 메시지 제외
                userMessage: userMessage
            })
        });

        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'AI 답변 생성에 실패했습니다.');
        }

        // 로딩 메시지 제거 후 AI 답변 추가
        removeLoadingMessage();
        await addAIMessage(data.message);
        
        // 채팅 기록에 추가
        chatHistory.push({ role: 'assistant', content: data.message });
        
    } catch (error) {
        console.error('AI 채팅 오류:', error);
        removeLoadingMessage();
        
        // 에러 메시지 표시
        const errorMessage = `죄송합니다. AI 답변 생성 중 오류가 발생했습니다.\n\n${error.message}\n\n서버가 실행 중인지 확인해주세요.`;
        await addAIMessage(errorMessage);
    } finally {
        // 입력창 다시 활성화
        if (sendButton) {
            sendButton.disabled = false;
        }
    }
}

// 사용자 메시지 추가
function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message message-user';
    messageDiv.innerHTML = `
        <div class="message-header">${globalRawData.userInfo.name}</div>
        <div class="message-content">${escapeHtml(message)}</div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// AI 메시지 추가 (타이핑 효과 포함)
async function addAIMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message message-ai';
    messageDiv.innerHTML = `
        <div class="message-header">AI 상담사</div>
        <div class="message-content" id="typingMessage"></div>
    `;
    chatMessages.appendChild(messageDiv);
    
    const contentDiv = messageDiv.querySelector('#typingMessage');
    await typeText(contentDiv, message);
    scrollToBottom();
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 스크롤을 맨 아래로
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Mock AI 상담 내용 생성 함수 (사용자 질문에 대한 답변 포함)
function generateMockConsultation(rawData, userQuestion) {
    const { userInfo, saju, astrology } = rawData;
    const name = userInfo.name;
    
    // 사주 해석 기반 상담 내용 생성
    const yearGan = saju.year.gan;
    const dayGan = saju.day.gan;
    const sunSign = astrology.sun.sign;
    const moonSign = astrology.moon.sign;
    
    // 천간별 특성 (Shadow side 포함)
    const ganCharacteristics = {
        '갑': { 
            positive: '리더십과 추진력이 뛰어나시네요', 
            negative: '때로는 성급한 판단을 조심하셔야 합니다',
            shadow: '독단적이고 경솔한 결정으로 인해 실패할 위험이 있습니다. 충분한 검토와 타인의 의견을 경청하는 것이 중요합니다.'
        },
        '을': { 
            positive: '부드럽고 협조적인 성품을 지니셨습니다', 
            negative: '결단력이 부족할 수 있으니 주의하세요',
            shadow: '과도한 타협과 소극적인 태도로 인해 자신의 의견을 제대로 표현하지 못할 수 있습니다. 때로는 확고한 입장을 취하는 용기가 필요합니다.'
        },
        '병': { 
            positive: '밝고 활발한 에너지가 넘치시네요', 
            negative: '감정 기복이 클 수 있으니 조절이 필요합니다',
            shadow: '감정의 기복이 심하면 인간관계에서 불안정함을 보일 수 있고, 충동적인 행동으로 후회할 일이 생길 수 있습니다. 감정 관리가 매우 중요합니다.'
        },
        '정': { 
            positive: '예술적 감각과 섬세함이 뛰어나십니다', 
            negative: '완벽주의 경향이 스트레스를 줄 수 있습니다',
            shadow: '과도한 완벽주의로 인해 스스로를 괴롭히거나 주변 사람들에게도 부담을 줄 수 있습니다. 때로는 80%의 완성도로도 충분하다는 것을 받아들이는 것이 필요합니다.'
        },
        '무': { 
            positive: '안정적이고 신중한 성격이 강점입니다', 
            negative: '너무 보수적이면 기회를 놓칠 수 있습니다',
            shadow: '지나치게 보수적이고 변화를 두려워하는 성향으로 인해 새로운 기회를 놓치거나 발전의 기회를 잃을 수 있습니다. 적절한 모험 정신이 필요합니다.'
        },
        '기': { 
            positive: '사교적이고 친화력이 뛰어나시네요', 
            negative: '의존성이 강해질 수 있으니 주의하세요',
            shadow: '타인에 대한 과도한 의존으로 인해 자립심이 약해지고, 관계에서 불균형이 생길 수 있습니다. 스스로의 판단과 결정 능력을 키우는 것이 중요합니다.'
        },
        '경': { 
            positive: '강인한 의지와 추진력을 갖추셨습니다', 
            negative: '고집이 세면 갈등이 생길 수 있습니다',
            shadow: '고집이 지나치면 타인과의 갈등이 심해지고, 협력 관계에서 문제가 생길 수 있습니다. 유연한 사고와 타협의 자세가 필요합니다.'
        },
        '신': { 
            positive: '예리한 판단력과 분석 능력이 뛰어납니다', 
            negative: '과도한 비판은 관계를 해칠 수 있습니다',
            shadow: '비판적이고 냉정한 태도로 인해 감정적 교감이 부족해지고, 인간관계에서 거리감이 생길 수 있습니다. 따뜻한 마음과 공감 능력을 기르는 것이 중요합니다.'
        },
        '임': { 
            positive: '유연하고 적응력이 뛰어나십니다', 
            negative: '원칙이 없으면 방향을 잃을 수 있습니다',
            shadow: '너무 유연하고 원칙이 없으면 자신의 정체성을 잃고, 타인에게 이용당하거나 방향을 잃을 수 있습니다. 핵심 가치와 원칙을 확립하는 것이 필요합니다.'
        },
        '계': { 
            positive: '차분하고 깊이 있는 사고를 하십니다', 
            negative: '소극적이면 기회를 놓칠 수 있습니다',
            shadow: '과도하게 소극적이고 수동적인 태도로 인해 기회를 놓치고, 자신의 능력을 발휘하지 못할 수 있습니다. 적극적인 행동과 표현이 필요합니다.'
        }
    };
    
    const dayChar = ganCharacteristics[dayGan] || ganCharacteristics['갑'];
    
    // 사용자 질문이 있는 경우 질문에 맞춰 답변 생성
    if (userQuestion) {
        return generateResponseToQuestion(rawData, userQuestion, dayChar);
    }
    
    // 초기 상담 내용 (첫 답변)
    let consultation = `${name}님, 안녕하세요. 20년간 사주 상담을 해온 저는 ${name}님의 사주를 살펴보니 흥미로운 점들이 보이네요.\n\n`;
    
    consultation += `먼저 좋은 소식부터 말씀드리자면, ${name}님의 일간인 ${dayGan}의 기운을 보면 ${dayChar.positive}. `;
    consultation += `특히 ${saju.year.full}년에 태어나신 ${name}님은 ${saju.month.full}월의 기운과 어우러져 `;
    consultation += `특별한 에너지를 가지고 계십니다.\n\n`;
    
    // Shadow side 명확히 언급
    consultation += `하지만 반드시 주의하셔야 할 점이 있습니다. ${name}님의 사주를 보면 ${dayChar.shadow} `;
    consultation += `이러한 특성은 ${name}님의 성장을 방해할 수 있으니, 항상 염두에 두시고 `;
    consultation += `의식적으로 균형을 맞추시려는 노력이 필요합니다.\n\n`;
    
    consultation += `또한 ${saju.hour.full}시에 태어나신 ${name}님은 `;
    consultation += `${moonSign}의 영향을 받아 감정의 기복이 있을 수 있으니, `;
    consultation += `중요한 결정을 내릴 때는 충분히 신중하게 생각해보시기 바랍니다.\n\n`;
    
    consultation += `올해는 특히 ${astrology.ascendant.sign}의 상승궁 영향으로 `;
    consultation += `새로운 변화의 기운이 감돌고 있습니다. 긍정적인 변화를 만들기 위해서는 `;
    consultation += `현재 가지고 계신 강점을 잘 활용하시되, 앞서 말씀드린 주의점들을 `;
    consultation += `명확히 인식하고 극복하시려는 의지가 필요합니다.\n\n`;
    
    // 따뜻한 질문으로 대화 유도
    const questions = [
        `혹시 최근에 ${name}님께서 고민하고 계신 일이 있으신가요?`,
        `${name}님의 사주를 보면 인간관계에서 중요한 전환점이 올 수 있는데, 최근 관계에서 변화가 있으셨나요?`,
        `직업이나 진로에 대한 고민이 있으시다면, ${name}님의 사주에 맞는 방향을 함께 찾아볼 수 있습니다.`,
        `건강이나 가족 관계에서 특별히 관심 있으신 부분이 있으신가요?`
    ];
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    consultation += `${randomQuestion} 더 자세히 알고 싶으신 부분이 있으시면 언제든 말씀해주세요.`;
    
    return consultation;
}

// 사용자 질문에 대한 답변 생성 함수
function generateResponseToQuestion(rawData, userQuestion, dayChar) {
    const { userInfo, saju, astrology } = rawData;
    const name = userInfo.name;
    
    let response = '';
    
    // 질문 내용에 따라 답변 생성
    const questionLower = userQuestion.toLowerCase();
    
    if (questionLower.includes('직업') || questionLower.includes('진로') || questionLower.includes('일') || questionLower.includes('커리어')) {
        response = `${name}님의 직업과 진로에 대해 물어보셨네요. ${name}님의 사주를 보면, `;
        response += `${dayChar.positive} 이러한 특성을 살릴 수 있는 분야가 적합합니다.\n\n`;
        response += `하지만 주의하셔야 할 점은, ${dayChar.shadow} `;
        response += `직장에서 이러한 특성이 드러나면 승진이나 인정을 받기 어려울 수 있습니다.\n\n`;
        response += `추천드리는 분야는 ${name}님의 ${saju.day.gan} 일간 특성을 살릴 수 있는 `;
        response += `리더십이 필요한 분야나 창의적인 분야입니다. 하지만 ${dayChar.negative} `;
        response += `이 점을 항상 염두에 두시고, 팀워크와 협력을 중시하는 환경을 선택하시는 것이 좋겠습니다.\n\n`;
    } else if (questionLower.includes('관계') || questionLower.includes('사람') || questionLower.includes('인간관계') || questionLower.includes('연인')) {
        response = `${name}님의 인간관계에 대해 궁금해하시는군요. ${name}님의 사주를 보면, `;
        response += `${astrology.moon.sign}의 영향으로 감정이 풍부하시고, ${dayChar.positive} `;
        response += `이러한 특성으로 인해 주변 사람들과 좋은 관계를 유지하실 수 있습니다.\n\n`;
        response += `하지만 반드시 주의하셔야 할 점이 있습니다. ${dayChar.shadow} `;
        response += `특히 ${astrology.moon.sign}의 영향으로 감정 기복이 있을 수 있어, `;
        response += `중요한 관계에서 오해나 갈등이 생길 수 있습니다. 감정을 솔직하게 표현하되, `;
        response += `상대방의 입장도 이해하려는 노력이 필요합니다.\n\n`;
        response += `${saju.hour.full}시에 태어나신 ${name}님은 `;
        response += `인간관계에서 때로는 과도한 기대를 하거나 의존하는 경향이 있을 수 있으니, `;
        response += `균형 잡힌 관계를 유지하시는 것이 중요합니다.\n\n`;
    } else if (questionLower.includes('건강') || questionLower.includes('몸') || questionLower.includes('질병')) {
        response = `${name}님의 건강에 대해 관심을 가지시는군요. ${name}님의 사주를 보면, `;
        response += `${saju.day.gan} 일간의 기운으로 인해 전반적으로 건강하실 수 있지만, `;
        response += `주의하셔야 할 부분이 있습니다.\n\n`;
        response += `${dayChar.shadow} 이러한 특성으로 인해 스트레스가 쌓이면 `;
        response += `건강에 영향을 줄 수 있습니다. 특히 ${astrology.moon.sign}의 영향으로 `;
        response += `감정적 스트레스가 신체 건강에 영향을 줄 수 있으니, `;
        response += `규칙적인 운동과 충분한 휴식, 그리고 감정 관리가 매우 중요합니다.\n\n`;
        response += `추천드리는 것은 ${name}님의 ${saju.month.full}월 기운에 맞는 `;
        response += `활동적인 운동이나 명상, 요가 등으로 스트레스를 해소하시는 것입니다.\n\n`;
    } else if (questionLower.includes('돈') || questionLower.includes('재물') || questionLower.includes('재정') || questionLower.includes('경제')) {
        response = `${name}님의 재정 상황에 대해 궁금해하시는군요. ${name}님의 사주를 보면, `;
        response += `${saju.year.full}년과 ${saju.month.full}월의 조합으로 인해 `;
        response += `재물운이 있으실 수 있습니다. 하지만 ${dayChar.positive} `;
        response += `이러한 특성을 잘 활용하시면 더욱 좋은 결과를 얻으실 수 있습니다.\n\n`;
        response += `하지만 반드시 주의하셔야 할 점이 있습니다. ${dayChar.shadow} `;
        response += `특히 재정 관리에서 이러한 특성이 드러나면 큰 손실을 볼 수 있습니다. `;
        response += `신중한 투자와 계획적인 재정 관리가 필수적입니다.\n\n`;
        response += `${astrology.ascendant.sign}의 상승궁 영향으로 `;
        response += `새로운 수입원이 생길 수 있지만, ${dayChar.negative} `;
        response += `이 점을 항상 염두에 두시고, 전문가의 조언을 구하시는 것이 좋겠습니다.\n\n`;
    } else {
        // 일반적인 질문에 대한 답변
        response = `${name}님의 질문에 대해 답변드리겠습니다. ${name}님의 사주를 보면, `;
        response += `${dayChar.positive} 이러한 특성을 가지고 계시지만, `;
        response += `동시에 ${dayChar.shadow} `;
        response += `이러한 부분도 명확히 인식하셔야 합니다.\n\n`;
        response += `${name}님의 질문과 관련하여, ${saju.day.full} 일주의 기운과 `;
        response += `${astrology.sun.sign}의 태양 위치를 고려하면, `;
        response += `긍정적인 방향으로 나아가실 수 있습니다. 하지만 ${dayChar.negative} `;
        response += `이 점을 항상 주의하시면서 진행하시는 것이 중요합니다.\n\n`;
    }
    
    // 따뜻한 질문으로 대화 유도
    const followUpQuestions = [
        `혹시 이 답변과 관련해서 더 궁금하신 점이 있으신가요?`,
        `${name}님의 사주를 더 깊이 분석해보고 싶으신 부분이 있으신가요?`,
        `다른 고민이나 질문이 있으시다면 언제든 말씀해주세요.`,
        `${name}님의 앞날에 대해 더 자세히 알고 싶으시다면, 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.`
    ];
    
    const randomQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];
    response += `${randomQuestion}`;
    
    return response;
}

// 타이핑 효과 함수
async function typeText(element, text) {
    if (!element) return;
    
    element.textContent = '';
    element.style.whiteSpace = 'pre-wrap';
    element.style.lineHeight = '1.7';
    
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        // 타이핑 속도 조절 (빠르게는 20ms, 느리게는 40ms)
        const delay = text[i] === '\n' ? 100 : (Math.random() * 20 + 20);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // 타이핑 중에도 스크롤 유지
        if (i % 10 === 0) {
            scrollToBottom();
        }
    }
    
    scrollToBottom();
}
