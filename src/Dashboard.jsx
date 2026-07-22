import { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/dashboard/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(response.data.summary);
      } catch (err) {
        setError('فشل تحميل بيانات الداشبورد');
      }
    };

    fetchSummary();
  }, []);

  const getProgressColor = (rate) => {
    const numericRate = parseFloat(rate);
    if (numericRate >= 80) return '#4CAF50';
    if (numericRate >= 50) return '#2196F3';
    if (numericRate > 0) return '#FF9800';
    return '#E0E0E0';
  };

  const getPerformanceBadge = (rate) => {
    const numericRate = parseFloat(rate);
    if (numericRate >= 80) return { text: '🌟 أداء ممتاز', color: '#4CAF50' };
    if (numericRate >= 50) return { text: '📈 تقدم جيد', color: '#2196F3' };
    if (numericRate > 0) return { text: '⚠️ يحتاج تحسين', color: '#FF9800' };
    return { text: '💤 لم يبدأ بعد', color: '#9E9E9E' };
  };

  const totalTasksAllWeeks = summary.reduce((acc, curr) => acc + parseInt(curr.total_tasks || 0), 0);
  const totalCompletedAllWeeks = summary.reduce((acc, curr) => acc + parseInt(curr.completed_tasks || 0), 0);
  const avgCompletionRate = summary.length > 0 
    ? (summary.reduce((acc, curr) => acc + parseFloat(curr.completion_rate || 0), 0) / summary.length).toFixed(1)
    : 0;

  return (
    <div>
      <h2 className="page-title">📊 لوحة الإحصائيات</h2>
      <p className="page-subtitle">أداءك الأسبوعي بالأرقام</p>

      {error && <p className="status-message error">{error}</p>}

      {!error && summary.length === 0 && (
        <p className="empty-note">ما فيه بيانات أرشيف بعد، أرشف أسبوعك الأول من صفحة المهام</p>
      )}

      {/* كارت الملخص العام التراكمي */}
      {summary.length > 0 && (
        <div className="week-card" style={{ backgroundColor: '#fdfbf7', border: '1px solid #e2d9cc', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#4a3b32', textAlign: 'center' }}>
            🏆 الإنجاز التراكمي العام
          </h3>
          <div className="week-stats">
            <div>
              <strong>{totalTasksAllWeeks}</strong>
              إجمالي المهام
            </div>
            <div>
              <strong>{totalCompletedAllWeeks}</strong>
              المنجزة كلياً
            </div>
            <div>
              <strong>{avgCompletionRate}%</strong>
              متوسط الإنجاز
            </div>
          </div>
        </div>
      )}

      {/* كروت الأسابيع المؤرشفة */}
      {summary.map((week) => {
        const badge = getPerformanceBadge(week.completion_rate);
        const progressColor = getProgressColor(week.completion_rate);

        return (
          <div key={week.week_start_date} className="week-card">
            {/* الهيدر العلوي للكارت يحتوي على التاريخ والشارة بدون تداخل */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p className="week-date" style={{ margin: 0 }}>
                أسبوع {week.week_start_date.split('T')[0]}
              </p>
              
              <span
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: badge.color + '22',
                  color: badge.color,
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}
              >
                {badge.text}
              </span>
            </div>

            <div className="week-stats">
              <div>
                <strong>{week.total_tasks}</strong>
                إجمالي
              </div>
              <div>
                <strong>{week.completed_tasks}</strong>
                مكتملة
              </div>
              <div>
                <strong>{week.pending_tasks}</strong>
                معلّقة
              </div>
              <div>
                <strong>{parseFloat(week.completion_rate).toFixed(1)}%</strong>
                الإنجاز
              </div>
            </div>

            {/* شريط التقدم الملون */}
            <div className="progress-track" style={{ backgroundColor: '#eee', height: '10px', borderRadius: '5px', overflow: 'hidden', marginTop: '10px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${week.completion_rate}%`,
                  backgroundColor: progressColor,
                  height: '100%',
                  transition: 'width 0.4s ease-in-out'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Dashboard;