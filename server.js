const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();

// 디버그 로그 함수
const debugLog = (message, data = null) => {
  if (process.env.DEBUG_MODE === 'true') {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    if (data) {
      console.log('[DEBUG] Data:', JSON.stringify(data, null, 2));
    }
  }
};

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // HTTPS 사용시 true로 변경
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24시간
  }
}));

debugLog('서버 초기화 완료');

// 성인인증 체크 미들웨어
const checkAdultAuth = (req, res, next) => {
  debugLog('성인인증 체크', { 
    sessionId: req.sessionID, 
    isAdult: req.session.isAdult,
    url: req.url 
  });
  
  if (req.session.isAdult) {
    return next();
  }
  res.redirect('/auth');
};

// 라우트 정의

// 1. 루트 경로
app.get('/', (req, res) => {
  debugLog('루트 접속', { isAdult: req.session.isAdult });
  
  if (req.session.isAdult) {
    res.redirect('/index.html');
  } else {
    res.redirect('/auth');
  }
});

// 2. 성인인증 페이지
app.get('/auth', (req, res) => {
  debugLog('인증 페이지 접속');
  
  res.render('auth', {
    impKey: process.env.PORTONE_IMP_KEY,
    testMode: process.env.TEST_MODE === 'true'
  });
});

// 3. 인증 상태 확인 API (index.html에서 호출)
app.get('/api/check-auth', (req, res) => {
  debugLog('인증 상태 확인 API 호출', { 
    sessionId: req.sessionID, 
    isAdult: req.session.isAdult 
  });
  
  if (req.session.isAdult) {
    res.json({
      isAuthenticated: true,
      userInfo: req.session.certInfo || { name: '사용자' }
    });
  } else {
    res.json({
      isAuthenticated: false
    });
  }
});

// 4. 본인인증 완료 콜백 처리
app.post('/auth/verify', async (req, res) => {
  const { imp_uid, success } = req.body;
  
  debugLog('인증 검증 요청', { imp_uid, success });

  if (!success) {
    return res.json({
      success: false,
      message: '본인인증에 실패했습니다.'
    });
  }

  // 테스트 모드일 때 우회 처리
  if (process.env.TEST_MODE === 'true') {
    debugLog('테스트 모드: 성인인증 우회');
    
    req.session.isAdult = true;
    req.session.certInfo = {
      name: '테스트사용자',
      phone: '010-0000-0000',
      certifiedAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      message: '테스트 모드: 성인인증이 완료되었습니다.',
      redirect: '/index.html'
    });
  }

  try {
    // 포트원 API를 통해 인증 정보 조회
    const certData = await getCertification(imp_uid);
    
    if (!certData) {
      debugLog('인증 정보 조회 실패');
      return res.json({
        success: false,
        message: '인증 정보를 가져올 수 없습니다.'
      });
    }

    debugLog('인증 정보 조회 성공', { 
      name: certData.name,
      birthday: certData.birthday 
    });

    // 생년월일로 나이 계산
    const birthDate = certData.birthday; // YYYY-MM-DD 형식
    const age = calculateAge(birthDate);

    debugLog('나이 계산 결과', { birthDate, age });

    if (age >= 19) {
      // 성인인증 성공 - 세션에 저장
      req.session.isAdult = true;
      req.session.certInfo = {
        name: certData.name,
        phone: certData.phone,
        certifiedAt: certData.certified_at
      };

      debugLog('성인인증 성공', { name: certData.name, age });

      return res.json({
        success: true,
        message: '성인인증이 완료되었습니다.',
        redirect: '/index.html'
      });
    } else {
      debugLog('미성년자 접근 시도', { age });
      
      return res.json({
        success: false,
        message: '만 19세 이상만 이용 가능합니다.'
      });
    }
  } catch (error) {
    debugLog('인증 처리 중 오류', { error: error.message });
    
    return res.json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.'
    });
  }
});

// 4. /main 접속 시 index.html로 리다이렉트 (하위 호환성)
app.get('/main', checkAdultAuth, (req, res) => {
  debugLog('메인 페이지 접속 - index.html로 리다이렉트');
  res.redirect('/index.html');
});

// 5. 로그아웃
app.get('/logout', (req, res) => {
  debugLog('로그아웃 요청');
  
  req.session.destroy((err) => {
    if (err) {
      debugLog('세션 삭제 오류', { error: err.message });
    }
    res.redirect('/auth');
  });
});

// 헬퍼 함수들

// 포트원 액세스 토큰 발급
async function getAccessToken() {
  try {
    debugLog('액세스 토큰 발급 요청');
    
    const response = await axios.post('https://api.iamport.kr/users/getToken', {
      imp_key: process.env.PORTONE_API_KEY,
      imp_secret: process.env.PORTONE_API_SECRET
    });
    
    debugLog('액세스 토큰 발급 성공');
    return response.data.response.access_token;
  } catch (error) {
    debugLog('액세스 토큰 발급 실패', { error: error.message });
    return null;
  }
}

// 본인인증 정보 조회
async function getCertification(imp_uid) {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    debugLog('인증 정보 조회 시작', { imp_uid });

    const response = await axios.get(
      `https://api.iamport.kr/certifications/${imp_uid}`,
      {
        headers: {
          'Authorization': token
        }
      }
    );

    debugLog('인증 정보 조회 완료');
    return response.data.response;
  } catch (error) {
    debugLog('인증 정보 조회 실패', { error: error.message });
    return null;
  }
}

// 나이 계산 함수
function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 성인인증 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📱 접속 URL: http://localhost:${PORT}`);
  
  if (process.env.DEBUG_MODE === 'true') {
    console.log('🐛 DEBUG 모드가 활성화되었습니다.');
  }
  
  if (process.env.TEST_MODE === 'true') {
    console.log('🧪 TEST 모드가 활성화되었습니다. (실제 인증 우회)');
  }
});