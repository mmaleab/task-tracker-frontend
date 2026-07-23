import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState('medium'); // الحالة الافتراضية للأولوية
  const [message, setMessage] = useState('');

  // حالات التعديل (Editing)
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPriority, setEditPriority] = useState('medium');

  // دالة جلب تاريخ اليوم المحلي بصيغة YYYY-MM-DD
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getLocalDateStr();

  // دالة تحويل تاريخ الباك إيند (ISO) إلى تاريخ محلي YYYY-MM-DD بدون تأثر بفارق التوقيت
  const formatLocalDate = (isoDateStr) => {
    if (!isoDateStr) return '';
    const dateObj = new Date(isoDateStr);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // دالة تحويل الوقت إلى AM/PM
  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes.padStart(2, '0')} ${ampm}`;
  };

  // دالة الفحص: هل الوقت/التاريخ الخاص بالمهمة انتهى وفات؟
  const isTaskExpired = (taskDate, taskTime) => {
    if (!taskDate) return false;
    
    const now = new Date();
    const cleanDateStr = formatLocalDate(taskDate);

    const taskDateTimeStr = taskTime 
      ? `${cleanDateStr}T${taskTime}`
      : `${cleanDateStr}T23:59:59`;

    const taskDateTime = new Date(taskDateTimeStr);
    return now >= taskDateTime;
  };

  // دالة مساعدة لترجمة الأولوية وشكلها المرئي
  const getPriorityBadge = (p) => {
    switch (p) {
      case 'high':
        return <span style={{ color: '#d9534f', fontWeight: 'bold', fontSize: '11px' }}>🔥 عالية</span>;
      case 'low':
        return <span style={{ color: '#5cb85c', fontSize: '11px' }}>🟢 منخفضة</span>;
      default:
        return <span style={{ color: '#f0ad4e', fontSize: '11px' }}>🟡 متوسطة</span>;
    }
  };

  // 1. جلب المهام
  const fetchTasks = async () => {
    try {
      const res = await axios.get('https://task-tracker-backend-gfw6.onrender.com/tasks', getAuthHeader());
      setTasks(res.data);
      setMessage('');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setMessage('من فضلك سجل دخول من جديد');
      }
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 2. إضافة مهمة جديدة
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (dueDate && dueTime) {
      const selected = new Date(`${dueDate}T${dueTime}`);
      if (selected < new Date()) {
        setMessage('عذراً، لا يمكنك إضافة مهمة بوقت قديم!');
        return;
      }
    }

    try {
      await axios.post(
        'https://task-tracker-backend-gfw6.onrender.com/tasks',
        { 
          title, 
          due_date: dueDate || null, 
          due_time: dueTime || null,
          priority: priority || 'medium'
        },
        getAuthHeader()
      );
      setTitle('');
      setDueDate('');
      setDueTime('');
      setPriority('medium');
      setMessage('');
      fetchTasks();
    } catch (err) {
      setMessage('فشل إدراج المهمة');
    }
  };

  // 3. تغيير حالة المهمة (مكتملة / غير مكتملة)
  const handleToggleTask = async (task) => {
    try {
      await axios.put(
        `https://task-tracker-backend-gfw6.onrender.com/tasks/${task.id}`,
        { 
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          due_time: task.due_time,
          priority: task.priority,
          is_completed: !task.is_completed 
        },
        getAuthHeader()
      );
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // 4. بدء وضع التعديل
  const startEditing = (task) => {
    if (isTaskExpired(task.due_date, task.due_time)) {
      setMessage('لا يمكنك تعديل هذه المهمة لأن وقتها قد حان بالفعل!');
      return;
    }
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDate(task.due_date ? formatLocalDate(task.due_date) : '');
    setEditTime(task.due_time ? task.due_time.substring(0, 5) : '');
    setEditPriority(task.priority || 'medium');
  };

  // 5. حفظ التعديل
  const handleSaveEdit = async (task) => {
    if (editDate && editTime) {
      const newSelected = new Date(`${editDate}T${editTime}`);
      if (newSelected < new Date()) {
        setMessage('عذراً، الموعد الجديد الذي اخترته في الماضي!');
        return;
      }
    }

    try {
      await axios.put(
        `https://task-tracker-backend-gfw6.onrender.com/tasks/${task.id}`,
        {
          title: editTitle,
          description: task.description,
          due_date: editDate || null,
          due_time: editTime || null,
          priority: editPriority,
          is_completed: task.is_completed
        },
        getAuthHeader()
      );
      setEditingId(null);
      setMessage('');
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  // 6. حذف مهمة
  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`https://task-tracker-backend-gfw6.onrender.com/tasks/${id}`, getAuthHeader());
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // 7. الأرشفة الأسبوعية
  const handleArchive = async () => {
    try {
      const res = await axios.post(
        'https://task-tracker-backend-gfw6.onrender.com/tasks/archive',
        { week_start_date: todayDateStr },
        getAuthHeader()
      );

      setMessage(res.data.message || 'تمت الأرشفة بنجاح!');
      fetchTasks();
    } catch (err) {
      console.error(err);
      setMessage('فشلت عملية الأرشفة');
    }
  };

  return (
    <div>
      <h2 className="page-title">📝 قائمة المهام</h2>
      <p className="page-subtitle">مهام هذا الأسبوع</p>

      {/* نموذج الإضافة */}
      <form onSubmit={handleAddTask} className="task-form" style={{ flexDirection: 'column', gap: '8px' }}>
        <input
          type="text"
          placeholder="أدخل مهمة جديدة..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <input
            type="date"
            min={todayDateStr}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
        </div>

        {/* حقل اختيار الأولوية */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <label style={{ fontSize: '13px', color: '#555' }}>الأولوية:</label>
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="high">🔥 عالية (High)</option>
            <option value="medium">🟡 متوسطة (Medium)</option>
            <option value="low">🟢 منخفضة (Low)</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">
          إضافة
        </button>
      </form>

      {message && (
        <p className={`status-message ${message.includes('بنجاح') ? 'ok' : 'error'}`}>
          {message}
        </p>
      )}

      {tasks.length === 0 ? (
        <p className="empty-note">ما فيه مهام حاليًا، ابدأ بإضافة وحدة 👆</p>
      ) : (
        <ul className="ledger">
          {tasks.map((t) => {
            const expired = isTaskExpired(t.due_date, t.due_time);

            return (
              <li key={t.id} className={`ledger-row ${t.is_completed ? 'done' : ''}`}>
                {/* زر الإكمال Checkmark */}
                {/* زر الإكمال أو علامة الفائتة */}
                
                 <span
                  className="ledger-check"
                  onClick={() => handleToggleTask(t)}
                  style={{ cursor: 'pointer', fontSize: expired && !t.is_completed ? '16px' : 'inherit' }}
                  title={expired && !t.is_completed ? 'انتهى موعد هذه المهمة ولم تنجز' : 'تغيير حالة المهمة'}
                >
                  {t.is_completed ? '✓' : (expired ? '❌' : '⬜')}
                </span>
                {/* محتوى المهمة / وضع التعديل */}
                {editingId === t.id ? (
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 8px' }}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{ padding: '4px' }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="date"
                        min={todayDateStr}
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        style={{ padding: '4px', fontSize: '12px', flex: 1 }}
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        style={{ padding: '4px', fontSize: '12px', flex: 1 }}
                      />
                    </div>
                    {/* تعديل الأولوية */}
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      style={{ padding: '4px', fontSize: '12px' }}
                    >
                      <option value="high">🔥 عالية</option>
                      <option value="medium">🟡 متوسطة</option>
                      <option value="low">🟢 منخفضة</option>
                    </select>
                  </div>
                ) : (
                  <div 
                    className="ledger-title" 
                    onClick={() => handleToggleTask(t)} 
                    style={{ flexGrow: 1, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{t.title}</span>
                      {getPriorityBadge(t.priority)}
                    </div>
                    {(t.due_date || t.due_time) && (
                      <div style={{ fontSize: '11px', color: expired ? '#d9534f' : '#777', marginTop: '2px' }}>
                        {t.due_date && `📅 ${formatLocalDate(t.due_date)} `}
                        {t.due_time && `⏰ ${formatTimeAMPM(t.due_time)}`}
                        {expired && ' ⏳ (انتهى الموعد)'}
                      </div>
                    )}
                  </div>
                )}

                {/* أزرار التحكّم */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {editingId === t.id ? (
                    <>
                      <button 
                        onClick={() => handleSaveEdit(t)} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'green', fontSize: '16px' }}
                      >
                        💾
                      </button>
                      <button 
                        onClick={cancelEditing} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'gray', fontSize: '16px' }}
                      >
                        ✖
                      </button>
                    </>
                  ) : (
                    !expired && (
                      <button 
                        onClick={() => startEditing(t)} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}
                        title="تعديل المهمة"
                      >
                        ✏️
                      </button>
                    )
                  )}

                  <button className="ledger-delete" onClick={() => handleDeleteTask(t.id)}>
                    حذف
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button onClick={handleArchive} className="btn btn-primary archive-btn">
        📦 أرشفة المهام للأسبوع
      </button>
    </div>
  );
}