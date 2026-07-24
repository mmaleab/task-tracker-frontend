import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Verify() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  // التقاط الإيميل المرسل من صفحة التسجيل إن وجد، أو جعله قابلاً للكتابة
  const email = location.state?.email || '';
  const [inputEmail, setInputEmail] = useState(email);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:3000/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail, code })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'تم تفعيل الحساب بنجاح!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'حدث خطأ أثناء التفعيل');
      }
    } catch (err) {
      setError('تعذر الاتصال بالخادم');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f4f9' }}>
      <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#333' }}>تفعيل البريد الإلكتروني</h2>
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>البريد الإلكتروني:</label>
            <input 
              type="email" 
              value={inputEmail} 
              onChange={(e) => setInputEmail(e.target.value)} 
              required 
              placeholder="أدخل إيميلك المسجل"
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555' }}>رمز التحقق (6 أرقام):</label>
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              maxLength="6" 
              required 
              placeholder="123456"
              style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>
            تفعيل الحساب
          </button>
        </form>
        {message && <p style={{ color: 'green', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>{message}</p>}
        {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>{error}</p>}
      </div>
    </div>
  );
}