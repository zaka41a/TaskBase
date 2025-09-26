import { useEffect, useState } from 'react';
import { api, setToken, getToken, clearToken } from './api';

export default function App() {
  const [email, setEmail] = useState('demo@taskbase.dev');
  const [password, setPassword] = useState('demo123');
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const loggedIn = !!getToken();

  useEffect(() => {
    if (loggedIn) {
      api.listTodos().then(setTodos).catch(e => setError(e.message));
    }
  }, [loggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { token } = await api.login(email, password);
      setToken(token);
      window.location.reload();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const t = await api.addTodo(title.trim());
    setTodos([t, ...todos]);
    setTitle('');
  };

  const toggleDone = async (t) => {
    const u = await api.updateTodo(t.id, { done: !t.done, title: t.title });
    setTodos(todos.map(x => (x.id === t.id ? u : x)));
  };

  const remove = async (id) => {
    await api.deleteTodo(id);
    setTodos(todos.filter(t => t.id !== id));
  };

  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 360, margin: '40px auto', fontFamily: 'system-ui' }}>
        <h2>TaskBase — Sign in</h2>
        <form onSubmit={handleLogin}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" style={{ width: '100%', padding: 8, margin: '6px 0' }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" style={{ width: '100%', padding: 8, margin: '6px 0' }} />
          <button type="submit" style={{ padding: '8px 12px' }}>Sign in</button>
        </form>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <p style={{ marginTop: 12, fontSize: 14, color: '#555' }}>Demo user is preloaded.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>My tasks</h2>
        <button onClick={() => { clearToken(); window.location.reload(); }} style={{ padding: '6px 10px' }}>Logout</button>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task..." style={{ flex: 1, padding: 8 }} />
        <button type="submit" style={{ padding: '8px 12px' }}>Add</button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map((t) => (
          <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #eee' }}>
            <input type="checkbox" checked={!!t.done} onChange={() => toggleDone(t)} />
            <span style={{ textDecoration: t.done ? 'line-through' : 'none', flex: 1 }}>{t.title}</span>
            <button onClick={() => remove(t.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
