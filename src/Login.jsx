import { useState } from 'react';
import axios from 'axios';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:3000/login', {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      setMessage('تم تسجيل الدخول بنجاح!');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setMessage('فشل تسجيل الدخول، تأكد من البيانات');
    }
  };

  return (
    <div className="auth-card">
      <h2 className="auth-title">تسجيل الدخول</h2>
      <form onSubmit={handleLogin}>
        <div className="field">
          <input
            type="email"
            placeholder="الإيميل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary auth-submit">
          دخول
        </button>
      </form>
      {message && (
        <p className={`status-message ${message.includes('بنجاح') ? 'ok' : 'error'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Login;