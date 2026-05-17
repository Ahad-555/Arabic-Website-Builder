import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit, ShieldCheck, LogOut, Users, BookOpen, Award,
  Plus, Trash2, Pencil, ChevronDown, ChevronUp, CheckCircle2, X
} from "lucide-react";

type Tab = "students" | "skills" | "achievements";

const COLLEGES = ["كلية الحاسبات وتقنية المعلومات", "كلية العلوم", "كلية الأعمال", "كلية التربية", "كلية الصحة"];
const SPECIALTIES = ["الذكاء الاصطناعي", "نظم المعلومات الإدارية", "علوم الحاسب", "تقنية المعلومات", "هندسة البرمجيات", "تصميم واجهات المستخدم", "تطوير البرمجيات / نظم المعلومات", "تحليل البيانات"];
const CATEGORIES = ["programming", "design", "data", "management", "communication", "other"];
const CAT_LABELS: Record<string, string> = { programming: "برمجة", design: "تصميم", data: "بيانات", management: "إدارة", communication: "تواصل", other: "أخرى" };

const api = async (path: string, opts?: RequestInit) => {
  const r = await fetch(`/api${path}`, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const AVATAR_COLORS = ["bg-indigo-600", "bg-violet-600", "bg-pink-600", "bg-amber-600", "bg-teal-600", "bg-cyan-600", "bg-rose-600", "bg-orange-600"];

export default function SupervisorApp({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("students");

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="rtl">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button onClick={onLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm">
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-lg font-bold text-gray-900 text-right">لوحة تحكم المشرفة</div>
            <div className="text-xs text-gray-400 text-right">نظام النبض المهني — جامعة الحدود الشمالية</div>
          </div>
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="flex border-b border-gray-200 mb-6">
          {([
            { key: "students", label: "الطالبات", icon: Users },
            { key: "skills", label: "المهارات والأسئلة", icon: BookOpen },
            { key: "achievements", label: "الإنجازات", icon: Award },
          ] as { key: Tab; label: string; icon: any }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t.key ? "border-green-500 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "students" && <StudentsTab />}
        {tab === "skills" && <SkillsTab />}
        {tab === "achievements" && <AchievementsTab />}
      </div>
    </div>
  );
}

function StudentsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", college: COLLEGES[0], specialty: SPECIALTIES[0], customSpecialty: "" });
  const [showCustom, setShowCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", college: "", major: "" });

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => api("/students") });

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const major = showCustom ? form.customSpecialty : form.specialty;
      await api("/students", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, college: form.college, major }),
      });
      qc.invalidateQueries({ queryKey: ["students"] });
      setForm({ name: "", college: COLLEGES[0], specialty: SPECIALTIES[0], customSpecialty: "" });
      setShowCustom(false);
    } finally { setSaving(false); }
  };

  const deleteStudent = async (id: number) => {
    if (!confirm("هل أنتِ متأكدة من حذف هذه الطالبة؟")) return;
    await api(`/students/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["students"] });
  };

  const saveEdit = async (id: number) => {
    await api(`/students/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, college: editForm.college, major: editForm.major }),
    });
    qc.invalidateQueries({ queryKey: ["students"] });
    setEditId(null);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={addStudent} className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4 text-green-600" /> إضافة طالبة جديدة
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">الاسم الكامل</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="مثال: نورة العنزي"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">الكلية</label>
            <input value={form.college} onChange={e => setForm(p => ({ ...p, college: e.target.value }))}
              placeholder="كلية الحاسبات وتقنية المعلومات"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">التخصص</label>
            {showCustom ? (
              <div className="flex gap-1">
                <input value={form.customSpecialty} onChange={e => setForm(p => ({ ...p, customSpecialty: e.target.value }))}
                  placeholder="أدخلي التخصص"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button type="button" onClick={() => setShowCustom(false)} className="text-gray-400 hover:text-gray-600 px-2"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <select value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>
        {!showCustom && (
          <button type="button" onClick={() => setShowCustom(true)} className="text-green-600 text-xs mb-3 hover:underline">إدخال تخصص آخر</button>
        )}
        <button type="submit" disabled={saving}
          className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-bold flex items-center gap-2 disabled:opacity-50">
          <Plus className="w-4 h-4" /> إضافة الطالبة
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-gray-500" /> الطالبات المسجلات
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{(students as any[]).length}</span>
        </h2>
        <div className="space-y-2">
          {(students as any[]).length === 0 && <p className="text-gray-400 text-sm text-center py-6">لا توجد طالبات مسجلات بعد.</p>}
          {(students as any[]).map((s: any, i: number) => (
            <div key={s.id}>
              {editId === s.id ? (
                <div className="border border-green-200 rounded-xl p-3 bg-green-50">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="الاسم" />
                    <input value={editForm.college} onChange={e => setEditForm(p => ({ ...p, college: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="الكلية" />
                    <input value={editForm.major} onChange={e => setEditForm(p => ({ ...p, major: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="التخصص" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(s.id)} className="bg-green-500 text-white text-xs rounded-lg px-3 py-1.5 font-medium">حفظ</button>
                    <button onClick={() => setEditId(null)} className="text-gray-500 text-xs px-3 py-1.5">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                  <div className="flex gap-1.5 mr-auto">
                    <button onClick={() => { setEditId(s.id); setEditForm({ name: s.name, college: s.college || "", major: s.major }); }}
                      className="text-gray-400 hover:text-blue-500 transition-colors p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteStudent(s.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400">{s.college || "كلية الحاسبات"} · {s.major}</div>
                  </div>
                  <div className="font-medium text-gray-900 text-sm">{s.name}</div>
                  <div className={`w-8 h-8 ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0`}>
                    {s.name[0]}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillsTab() {
  const qc = useQueryClient();
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillForm, setSkillForm] = useState({ name: "", nameEn: "", category: "programming", description: "" });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [questionForms, setQuestionForms] = useState<Record<number, { questionText: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; showing: boolean }>>({});

  const { data: skills = [] } = useQuery({ queryKey: ["skills"], queryFn: () => api("/skills") });

  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name || !skillForm.nameEn) return;
    await api("/skills", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(skillForm),
    });
    qc.invalidateQueries({ queryKey: ["skills"] });
    setSkillForm({ name: "", nameEn: "", category: "programming", description: "" });
    setShowSkillForm(false);
  };

  const deleteSkill = async (id: number) => {
    if (!confirm("هل أنتِ متأكدة؟")) return;
    await api(`/skills/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["skills"] });
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-sm">أضيفي مهارات واكتبي أسئلة الاختبار لكل مهارة</p>
      <button onClick={() => setShowSkillForm(v => !v)}
        className="flex items-center gap-2 bg-green-500 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-green-600 transition-colors">
        <Plus className="w-4 h-4" /> إضافة مهارة
      </button>

      {showSkillForm && (
        <form onSubmit={addSkill} className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">اسم المهارة (بالإنجليزية)</label>
              <input value={skillForm.nameEn} onChange={e => setSkillForm(p => ({ ...p, nameEn: e.target.value }))}
                placeholder="مثال: JavaScript"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">اسم المهارة (بالعربية)</label>
              <input value={skillForm.name} onChange={e => setSkillForm(p => ({ ...p, name: e.target.value }))}
                placeholder="مثال: جافاسكريبت"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">الفئة</label>
              <select value={skillForm.category} onChange={e => setSkillForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">وصف مختصر (اختياري)</label>
              <input value={skillForm.description} onChange={e => setSkillForm(p => ({ ...p, description: e.target.value }))}
                placeholder="وصف المهارة"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-green-500 text-white rounded-xl px-5 py-2 text-sm font-bold">إضافة</button>
            <button type="button" onClick={() => setShowSkillForm(false)} className="text-gray-500 text-sm px-4 py-2">إلغاء</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {(skills as any[]).map((skill: any) => (
          <SkillRow key={skill.id} skill={skill} onDelete={deleteSkill}
            expanded={expanded === skill.id} onToggle={() => setExpanded(expanded === skill.id ? null : skill.id)}
            qForm={questionForms[skill.id]} setQForm={(f: any) => setQuestionForms(prev => ({ ...prev, [skill.id]: f }))} />
        ))}
      </div>
    </div>
  );
}

function SkillRow({ skill, onDelete, expanded, onToggle, qForm, setQForm }: any) {
  const qc = useQueryClient();
  const { data: questions = [], refetch } = useQuery({
    queryKey: ["skill-questions", skill.id],
    queryFn: () => api(`/skills/${skill.id}/questions`),
    enabled: expanded,
  });

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await api(`/skills/${skill.id}/questions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(qForm),
    });
    refetch();
    setQForm({ ...qForm, showing: false, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "a" });
  };

  const deleteQuestion = async (qid: number) => {
    await api(`/questions/${qid}`, { method: "DELETE" });
    refetch();
  };

  const initQForm = () => setQForm({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "a", showing: true });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
        <button onClick={e => { e.stopPropagation(); onDelete(skill.id); }} className="text-gray-300 hover:text-red-500 p-1 transition-colors mr-auto">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="text-right flex-1">
          <div className="font-bold text-gray-800 text-sm">{skill.name}{skill.nameEn && ` - ${skill.nameEn}`}</div>
          <div className="text-xs text-gray-400">{skill.nameEn || skill.name} · {CAT_LABELS[skill.category] || skill.category}</div>
        </div>
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-green-600" />
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          {(questions as any[]).length === 0 && !(qForm?.showing) && (
            <p className="text-gray-400 text-xs text-center py-3">لا توجد أسئلة بعد. أضيفي أسئلة أدناه.</p>
          )}
          <div className="space-y-2 mb-3">
            {(questions as any[]).map((q: any, i: number) => (
              <div key={q.id} className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <button onClick={() => deleteQuestion(q.id)} className="text-gray-300 hover:text-red-500 mt-0.5"><Trash2 className="w-3 h-3" /></button>
                <div className="flex-1 text-right">
                  <p className="text-xs font-medium text-gray-700">{i + 1}. {q.questionText}</p>
                  <p className="text-xs text-gray-400 mt-0.5">الإجابة الصحيحة: {q[`option${q.correctOption.toUpperCase()}`]}</p>
                </div>
              </div>
            ))}
          </div>

          {qForm?.showing ? (
            <form onSubmit={addQuestion} className="border border-gray-200 rounded-xl p-4 space-y-2">
              <input value={qForm.questionText} onChange={e => setQForm({ ...qForm, questionText: e.target.value })}
                placeholder="نص السؤال"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
              {["A", "B", "C", "D"].map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <input type="radio" name="correct" value={opt.toLowerCase()}
                    checked={qForm.correctOption === opt.toLowerCase()}
                    onChange={() => setQForm({ ...qForm, correctOption: opt.toLowerCase() })}
                    className="accent-green-600" />
                  <input value={qForm[`option${opt}`]} onChange={e => setQForm({ ...qForm, [`option${opt}`]: e.target.value })}
                    placeholder={`الخيار ${opt}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                </div>
              ))}
              <p className="text-xs text-gray-400">اختاري الخيار الصحيح بالنقر على الدائرة بجانبه</p>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-500 text-white rounded-lg px-4 py-1.5 text-xs font-bold">إضافة</button>
                <button type="button" onClick={() => setQForm({ ...qForm, showing: false })} className="text-gray-500 text-xs px-3 py-1.5">إلغاء</button>
              </div>
            </form>
          ) : (
            <button onClick={initQForm}
              className="w-full border border-dashed border-gray-200 rounded-xl py-2.5 text-xs text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors flex items-center justify-center gap-1">
              <Plus className="w-3.5 h-3.5" /> إضافة سؤال
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AchievementsTab() {
  const qc = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [form, setForm] = useState({ skillId: "", score: "100" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: () => api("/students") });
  const { data: skills = [] } = useQuery({ queryKey: ["skills"], queryFn: () => api("/skills") });
  const { data: studentSkills = [], refetch: refetchSkills } = useQuery({
    queryKey: ["student-skills", selectedStudentId],
    queryFn: () => api(`/students/${selectedStudentId}/skills`),
    enabled: !!selectedStudentId,
  });

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !form.skillId) return;
    setSaving(true);
    setMsg("");
    try {
      await api(`/students/${selectedStudentId}/skills/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: parseInt(form.skillId), score: parseFloat(form.score) }),
      });
      refetchSkills();
      setMsg("تم إثبات الإنجاز بنجاح ✓");
      setForm({ skillId: "", score: "100" });
    } finally { setSaving(false); }
  };

  const removeSkill = async (skillId: number) => {
    if (!selectedStudentId) return;
    await api(`/students/${selectedStudentId}/skills/${skillId}`, { method: "DELETE" });
    refetchSkills();
  };

  const selectedStudent = (students as any[]).find((s: any) => s.id === selectedStudentId);
  const verifiedSkills = (studentSkills as any[]).filter((s: any) => s.verified);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <label className="block font-bold text-gray-800 mb-3 text-sm text-right">اختاري الطالبة</label>
        <select value={selectedStudentId ?? ""} onChange={e => { setSelectedStudentId(Number(e.target.value) || null); setMsg(""); }}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">— اختاري طالبة —</option>
          {(students as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {selectedStudentId && (
        <>
          <form onSubmit={verify} className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-green-600" /> إثبات إنجاز يدوياً
            </h2>
            <p className="text-gray-400 text-xs mb-4">يمكنك إضافة مهارة موثقة مباشرة بدون اختبار</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">المهارة</label>
                <select value={form.skillId} onChange={e => setForm(p => ({ ...p, skillId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">— اختاري —</option>
                  {(skills as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.nameEn ? ` (${s.nameEn})` : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">النتيجة %</label>
                <input type="number" min="0" max="100" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            {msg && <p className="text-green-600 text-xs mb-2">{msg}</p>}
            <button type="submit" disabled={saving || !form.skillId}
              className="bg-green-500 text-white rounded-xl px-5 py-2 text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-green-600 transition-colors">
              <CheckCircle2 className="w-4 h-4" /> إثبات
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              المهارات الموثقة في صك {selectedStudent?.name}
            </h2>
            {verifiedSkills.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-4">لا توجد مهارات موثقة بعد.</p>
            ) : (
              <div className="space-y-2">
                {verifiedSkills.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                    <div className="flex gap-1.5 mr-auto">
                      <button onClick={() => removeSkill(s.skillId)} className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium text-gray-800 text-sm">{s.skillName}{s.skillNameEn ? <span className="text-gray-400 font-normal text-xs"> ({s.skillNameEn})</span> : ""}</div>
                      <div className="text-green-600 text-xs font-medium">النتيجة {Math.round(s.score)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
