import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../db/db';
import { useTaskStore } from '../hooks/useTaskStore';
import { Cloud, CloudOff, Save } from 'lucide-react';

const OfflineTaskApp = () => {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { logs, addLog } = useTaskStore();

  const loadTasks = useCallback(async () => {
    const allTasks = await db.tasks.toArray();
    setTasks(allTasks);
  }, []);

  const syncTasks = useCallback(async () => {
    const pendingTasks = await db.tasks.where('status').equals('pending').toArray();
    if (pendingTasks.length === 0) {
      addLog('No pending tasks to sync.');
      return;
    }

    addLog(`Syncing ${pendingTasks.length} tasks...`);

    for (const t of pendingTasks) {
      await new Promise(res => setTimeout(res, 500));
      await db.tasks.update(t.id, { status: 'synced' });
    }

    addLog('All tasks successfully synced to Cloud! ✅');
    loadTasks();
  }, [addLog, loadTasks]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addLog('Network restored. Starting Sync...');
      syncTasks();
    };
    const handleOffline = () => {
      setIsOnline(false);
      addLog('Network lost. Switching to Offline Mode.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    loadTasks();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addLog, syncTasks, loadTasks]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!task) return;

    const newTask = {
      content: task,
      status: isOnline ? 'synced' : 'pending',
      createdAt: Date.now(),
    };

    await db.tasks.add(newTask);
    addLog(isOnline ? 'Task saved and synced to cloud' : 'Task saved locally (Offline)');
    setTask('');
    loadTasks();
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Cynoia <span className="text-blue-600">Lite</span></h1>
              <p className="text-slate-500">Ultra-low bandwidth optimized workspace</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isOnline ? <Cloud size={16} /> : <CloudOff size={16} />}
              {isOnline ? 'Online' : 'Offline Mode'}
            </div>
          </header>

          <form onSubmit={addTask} className="flex gap-2 mb-10">
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Add a new task or note..."
              className="flex-1 p-4 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button type="submit" className="bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2">
              <Save size={20} /> Save
            </button>
          </form>

          <div className="grid gap-3">
            {tasks.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                <span className="text-slate-700">{t.content}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'synced' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                  {t.status === 'synced' ? 'Synced' : 'Local'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-80 bg-slate-900 text-emerald-400 p-6 font-mono text-xs overflow-y-auto shadow-2xl">
        <h2 className="text-slate-400 uppercase font-bold mb-4 border-b border-slate-700 pb-2">Technical Sync Log</h2>
        <div className="space-y-2">
          {logs.length === 0 && <p className="text-slate-600 italic">Waiting for events...</p>}
          {logs.map((log, i) => (
            <div key={i} className="border-l-2 border-emerald-800 pl-2 py-1 animate-in fade-in">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OfflineTaskApp;
