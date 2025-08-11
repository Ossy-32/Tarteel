import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  collection, addDoc, doc, deleteDoc, getDocs, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  let currentUser = null;
  let recordsCache = [];

  // عناصر DOM
  const userNameEl = document.getElementById('userName');
  const userEmailEl = document.getElementById('userEmail');
  const avatarEl = document.getElementById('avatar');
  const logoutBtn = document.getElementById('logout');

  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');

  const recordForm = document.getElementById('recordForm');
  const recordType = document.getElementById('recordType');
  const recordName = document.getElementById('recordName');
  const recordCount = document.getElementById('recordCount');
  const recordNote = document.getElementById('recordNote');

  const recordsList = document.getElementById('recordsList');
  const totalAyat = document.getElementById('totalAyat');
  const totalSurahs = document.getElementById('totalSurahs');
  const totalJuz = document.getElementById('totalJuz');

  const surahChartEl = document.getElementById('surahChart')?.getContext('2d');
  let surahChart = null;

  // تبديل views
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      views.forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + view).classList.add('active');
    });
  });

  // مصادقة المستخدم
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // سيتم توجيه بواسطة auth.js
      return;
    }
    currentUser = user;
    userNameEl.textContent = user.displayName || 'مستخدم';
    userEmailEl.textContent = user.email || '';
    avatarEl.textContent = (user.displayName ? user.displayName[0] : 'م').toUpperCase();

    await loadRecords();
    renderOverview();
  });

  // خروج
  logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'index.html';
  });

  // حفظ سجل جديد
  recordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = recordType.value;
    const name = recordName.value.trim();
    const count = parseInt(recordCount.value, 10);
    const note = recordNote.value.trim();

    if (!name || count <= 0) {
      alert('ادخل بيانات صحيحة');
      return;
    }

    try {
      const ref = collection(db, 'users', currentUser.uid, 'records');
      await addDoc(ref, { type, name, count, note, createdAt: serverTimestamp() });
      await loadRecords();
      renderOverview();
      recordForm.reset();
      alert('تم الحفظ');
    } catch (err) {
      alert('خطأ: ' + err.message);
    }
  });

  // تحميل السجلات
  async function loadRecords() {
    try {
      const ref = collection(db, 'users', currentUser.uid, 'records');
      const q = query(ref, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      recordsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderRecordsList();
    } catch (err) {
      alert('خطأ في تحميل السجلات: ' + err.message);
    }
  }

  // عرض السجلات
  function renderRecordsList() {
    if (!recordsList) return;
    recordsList.innerHTML = '';
    if (recordsCache.length === 0) {
      recordsList.innerHTML = '<div class="muted">لا توجد سجلات حتى الآن</div>';
      return;
    }
    recordsCache.forEach(r => {
      const div = document.createElement('div');
      div.className = 'record-item';

      const meta = document.createElement('div');
      meta.className = 'record-meta';
      meta.innerHTML = `<strong>${r.name}</strong><span class="muted">${r.type} • ${r.count} آيات</span><small class="muted">${r.note || ''}</small>`;

      const actions = document.createElement('div');
      actions.className = 'record-actions';

      const del = document.createElement('button');
      del.className = 'btn secondary';
      del.textContent = 'حذف';
      del.onclick = async () => {
        if (!confirm('تأكيد حذف السجل؟')) return;
        try {
          await deleteDoc(doc(db, 'users', currentUser.uid, 'records', r.id));
          await loadRecords();
          renderOverview();
        } catch (e) {
          alert('خطأ في الحذف: ' + e.message);
        }
      };

      actions.appendChild(del);
      div.appendChild(meta);
      div.appendChild(actions);
      recordsList.appendChild(div);
    });
  }

  // تجميع إحصائيات
  function aggregateStats() {
    const agg = { totalAyat: 0, surahs: new Map(), juz: new Set() };
    recordsCache.forEach(r => {
      agg.totalAyat += (parseInt(r.count, 10) || 0);
      if (r.type === 'surah') {
        const cur = agg.surahs.get(r.name) || 0;
        agg.surahs.set(r.name, cur + (parseInt(r.count, 10) || 0));
      }
      if (r.type === 'juz') {
        agg.juz.add(r.name);
      }
    });
    return agg;
  }

  // رسم الـ Overview
  function renderOverview() {
    const agg = aggregateStats();
    totalAyat.textContent = agg.totalAyat;
    totalSurahs.textContent = agg.surahs.size;
    totalJuz.textContent = agg.juz.size;

    const labels = Array.from(agg.surahs.keys()).slice(0, 20);
    const data = labels.map(k => agg.surahs.get(k));

    if (surahChart) surahChart.destroy();

    if (!surahChartEl) return;

    surahChart = new Chart(surahChartEl, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'الآيات المحفوظة لكل سورة',
          data,
          backgroundColor: Array(labels.length).fill('rgba(129,199,132,0.8)'),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }

  // تصدير CSV
  document.getElementById('exportCsv')?.addEventListener('click', () => {
    if (!recordsCache.length) {
      alert('لا توجد سجلات للتصدير');
      return;
    }
    const rows = [['type', 'name', 'count', 'note', 'createdAt']];
    recordsCache.forEach(r => {
      const createdAt = r.createdAt && typeof r.createdAt.toDate === 'function' ? r.createdAt.toDate().toISOString() : '';
      rows.push([r.type, r.name, r.count, r.note || '', createdAt]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tarteel_records.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  // استيراد JSON
  document.getElementById('importFile')?.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const txt = await f.text();
    try {
      const data = JSON.parse(txt);
      if (!Array.isArray(data)) throw new Error('الملف غير صالح');
      await Promise.all(data.map(r => addDoc(collection(db, 'users', currentUser.uid, 'records'), { ...r, createdAt: serverTimestamp() })));
      await loadRecords();
      renderOverview();
      alert('تم الاستيراد');
    } catch (err) {
      alert('خطأ بالاستيراد: ' + err.message);
    }
  });
});
