import { useState } from 'react';
import axios from 'axios';

function Login({ onLoginSuccess, onGoToVerify }) {
  const [isSignup, setIsSignup] = useState(false); // للتبديل بين تسجيل الدخول وإنشاء حساب
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const endpoint = isSignup 
      ? 'https://task-tracker-backend-gfw6.onrender.com/signup' 
      : 'https://task-tracker-backend-gfw6.onrender.com/login';

    try {
      const response = await axios.post(endpoint, { email, password });

      if (isSignup) {
        // في حالة التسجيل بنجاح، يتم الانتقال لصفحة إدخال رمز التحقق مع تمرير الإيميل
        setMessage('تم إنشاء الحساب بنجاح! جاري تحويلك لصفحة التحقق...');
        setTimeout(() => {
          if (onGoToVerify) onGoToVerify(email);
        }, 1500);
      } else {
        // في حالة تسجيل الدخول بنجاح
        localStorage.setItem('token', response.data.token);
        setMessage('تم تسجيل الدخول بنجاح!');
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'حدث خطأ، تأكد من البيانات أو تفعيل الحساب';
      setMessage(errorMsg);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">{isSignup ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="field">
          <input
            type="email"
            placeholder="الإيميل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary auth-submit">
          {isSignup ? 'تسجيل وسام إرسال رمز التحقق' : 'دخول'}
        </button>
      </form>

      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <button 
          type="button" 
          onClick={() => { setIsSignup(!isSignup); setMessage(''); }}
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isSignup ? 'لديك حساب بالفعل؟ سجل دخولك' : 'لا تمتلك حساباً؟ إنشاء حساب جديد'}
        </button>
      </div>

      {message && (
        <p className={`status-message ${message.includes('بنجاح') || message.includes('جاري') ? 'ok' : 'error'}`} style={{ textAlign: 'center', marginTop: '10px' }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Login;