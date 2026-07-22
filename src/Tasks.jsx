import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [message, setMessage] = useState('');

  // حالات التعديل (Editing)
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // دالة جلب تاريخ اليوم المحلي بصيغة YYYY-MM-DD
  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getLocalDateStr();

  // دالة تحويل تاريخ الباك إيند (ISO) إلى تاريخ محلي YYYY-MM-DD بدون تأثر بفارق التوقيت (Timezone Shift)
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
    // استخدام التاريخ المحلي المنسق بدلاً من split المباشر لتفادي الـ UTC Bug
    const cleanDateStr = formatLocalDate(taskDate);

    const taskDateTimeStr = taskTime 
      ? `${cleanDateStr}T${taskTime}`
      : `${cleanDateStr}T23:59:59`;

    const taskDateTime = new Date(taskDateTimeStr);
    return now >= taskDateTime;
  };

  // 1. جلب المهام
  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:3000/tasks', getAuthHeader());
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

    // فحص لو المستخدم حاول يدخل وقت قديم اليوم
    if (dueDate && dueTime) {
      const selected = new Date(`${dueDate}T${dueTime}`);
      if (selected < new Date()) {
        setMessage('عذراً، لا يمكنك إضافة مهمة بوقت قديم!');
        return;
      }
    }

    try {
      await axios.post(
        'http://localhost:3000/tasks',
        { 
          title, 
          due_date: dueDate || null, 
          due_time: dueTime || null 
        },
        getAuthHeader()
      );
      setTitle('');
      setDueDate('');
      setDueTime('');
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
        `http://localhost:3000/tasks/${task.id}`,
        { 
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          due_time: task.due_time,
          is_completed: !task.is_completed 
        },
        getAuthHeader()
      );
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // 4. بدء وضع التعديل (فقط للمهام التي لم ينته وقتها بعد)
  const startEditing = (task) => {
    if (isTaskExpired(task.due_date, task.due_time)) {
      setMessage('لا يمكنك تعديل هذه المهمة لأن وقتها قد حان بالفعل!');
      return;
    }
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDate(task.due_date ? formatLocalDate(task.due_date) : '');
    setEditTime(task.due_time ? task.due_time.substring(0, 5) : '');
  };

  // 5. حفظ التعديل
  const handleSaveEdit = async (task) => {
    // تحقق أن التعديل الجديد ليس في الماضي
    if (editDate && editTime) {
      const newSelected = new Date(`${editDate}T${editTime}`);
      if (newSelected < new Date()) {
        setMessage('عذراً، الموعد الجديد الذي اخترته في الماضي!');
        return;
      }
    }

    try {
      await axios.put(
        `http://localhost:3000/tasks/${task.id}`,
        {
          title: editTitle,
          description: task.description,
          due_date: editDate || null,
          due_time: editTime || null,
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
      await axios.delete(`http://localhost:3000/tasks/${id}`, getAuthHeader());
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // 7. الأرشفة الأسبوعية
  const handleArchive = async () => {
    try {
      const res = await axios.post(
        'http://localhost:3000/tasks/archive',
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
                <span
                  className="ledger-check"
                  onClick={() => handleToggleTask(t)}
                  style={{ cursor: 'pointer' }}
                >
                  {t.is_completed ? '✓' : '⬜'}
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
                        style={{ padding: '4px', fontSize: '12px' }}
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        style={{ padding: '4px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    className="ledger-title" 
                    onClick={() => handleToggleTask(t)} 
                    style={{ flexGrow: 1, cursor: 'pointer' }}
                  >
                    <div>{t.title}</div>
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