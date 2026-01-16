// test-api.js
const apiKey = "AIzaSyDMOmMsyBhdzHRe28j5MJb9IJ79ZY_bwUI";
const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ parts: [{ text: "안녕하세요" }] }]
    })
})
.then(res => res.json())
.then(data => {
    if (data.error) {
        console.log('❌ API 키 오류:', data.error.message);
    } else {
        console.log('✅ API 키 유효!');
        console.log('응답:', data.candidates[0].content.parts[0].text);
    }
})
.catch(err => console.log('❌ 네트워크 오류:', err.message));