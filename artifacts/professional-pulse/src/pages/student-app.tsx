import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Home, Compass, ClipboardCheck, History, FolderOpen, FileText,
  LogOut, BrainCircuit, ChevronLeft, ChevronRight, CheckCircle2,
  XCircle, Printer, Plus, Trash2
} from "lucide-react";
import type { StudentSession } from "@/App";

type Page = "home" | "career" | "quiz" | "history" | "projects" | "cv";

interface Props { student: StudentSession; onLogout: () => void; }

const api = async (path: string, opts?: RequestInit) => {
  const r = await fetch(`/api${path}`, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const CAREER_QUESTIONS = [
  {
    q: "عندما تواجه مشكلة تقنية، ما هو الجانب الذي يثير اهتمامك أكثر؟",
    options: [
      { label: "تصميم واجهة المستخدم وتجربة تفاعلية أفضل لحل المشكلة.", value: "design" },
      { label: "كتابة الكود والمنطق البرمجي خلف الكواليس لضمان عمل النظام.", value: "programming" },
      { label: "تخطيط المشروع وتوزيع المهام وإدارة الموارد المتاحة.", value: "management" },
    ],
  },
  {
    q: "عندما تتخيلين نفسك في بيئة عمل مثالية، ماذا تفعلين؟",
    options: [
      { label: "أصمم تجارب رقمية جميلة وأحل مشاكل المستخدمين.", value: "design" },
      { label: "أطور أنظمة وتطبيقات تحل مشاكل حقيقية.", value: "programming" },
      { label: "أحلل البيانات وأستخرج رؤى تساعد في القرارات.", value: "data" },
    ],
  },
  {
    q: "ما هو المشروع الذي تتمنين العمل فيه؟",
    options: [
      { label: "تطبيق جوال أنيق لإدارة المهام.", value: "design" },
      { label: "منصة بيانات لتحليل أنماط المستخدمين.", value: "data" },
      { label: "نظام إدارة مشاريع متكامل.", value: "management" },
    ],
  },
];

const CAREER_MAP: Record<string, string> = {
  design: "تصميم تجربة المستخدم (UX/UI)",
  programming: "تطوير البرمجيات / نظم المعلومات",
  data: "تحليل البيانات والذكاء الاصطناعي",
  management: "إدارة المشاريع التقنية",
};

function toHijri(year: number) { return year - 579; }

function formatHijriDate(dateStr: string) {
  const d = new Date(dateStr);
  const hijriYear = toHijri(d.getFullYear());
  const months = ["محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];
  return `${d.getDate()} ${months[d.getMonth()]} ${hijriYear} هـ`;
}

export default function StudentApp({ student, onLogout }: Props) {
  const [page, setPage] = useState<Page>("home");
  const qc = useQueryClient();

  const navItems = [
    { page: "home" as Page, label: "الرئيسية", icon: Home },
    { page: "career" as Page, label: "اكتشاف المسار", icon: Compass },
    { page: "quiz" as Page, label: "إثبات المهارة", icon: ClipboardCheck },
    { page: "history" as Page, label: "سجل الاختبارات", icon: History },
    { page: "projects" as Page, label: "مشاريع النادي", icon: FolderOpen },
    { page: "cv" as Page, label: "السيرة الذاتية الذكية", icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-[#f5f5f5]" dir="rtl">
      <div className="w-60 bg-white flex flex-col h-full border-l border-gray-100 shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">النبض المهني</div>
              <div className="text-xs text-gray-400">جامعة الحدود الشمالية</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.page} onClick={() => setPage(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-colors ${page === item.page ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {student.name[0]}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{student.name}</div>
              <div className="text-xs text-gray-400 truncate">{student.major}</div>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 text-gray-400 hover:text-red-500 text-xs px-1 py-1 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> تسجيل الخروج
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {page === "home" && <HomePage student={student} setPage={setPage} />}
        {page === "career" && <CareerPage />}
        {page === "quiz" && <QuizPage student={student} />}
        {page === "history" && <HistoryPage student={student} />}
        {page === "projects" && <ProjectsPage student={student} />}
        {page === "cv" && <CVPage student={student} />}
      </div>
    </div>
  );
}

function HomePage({ student, setPage }: { student: StudentSession; setPage: (p: Page) => void }) {
  const { data: skills = [] } = useQuery({ queryKey: ["student-skills", student.id], queryFn: () => api(`/students/${student.id}/skills`) });
  const { data: history = [] } = useQuery({ queryKey: ["quiz-history", student.id], queryFn: () => api(`/students/${student.id}/quiz-history`) });

  const verifiedCount = (skills as any[]).filter((s: any) => s.verified).length;
  const passedCount = (history as any[]).filter((a: any) => a.passed).length;
  const totalCount = (history as any[]).length;

  const services = [
    { label: "تحدي اكتشاف المسار", desc: "ثلاثة أسئلة قصيرة تساعدنا في توجيهك نحو المسار التقني الأنسب لك.", icon: Compass, page: "career" as Page },
    { label: "إثبات المهارة", desc: "اختبر مهاراتك التقنية في اختبارات موثقة واحصل على توثيقها لسيرتك.", icon: ClipboardCheck, page: "quiz" as Page },
    { label: "سجل الاختبارات", desc: "راجعي جميع محاولاتك السابقة في اختبارات إثبات المهارة ونتائجها.", icon: History, page: "history" as Page },
    { label: "السيرة الذاتية الذكية", desc: "شاهدي سيرتك الذاتية المحدثة تلقائياً بمهاراتك الموثقة للمقابلات.", icon: FileText, page: "cv" as Page },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">مرحباً بك، {student.name}</h1>
      <p className="text-gray-500 mb-8 text-sm">منصة النبض المهني ترشدك في مسارك وتوثق مهاراتك التقنية.</p>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-green-600 text-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1 opacity-80 text-xs"><ClipboardCheck className="w-4 h-4" /> المهارات الموثقة</div>
          <div className="text-4xl font-bold">{verifiedCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-1 text-gray-400 text-xs"><History className="w-4 h-4" /> الاختبارات المجتازة</div>
          <div className="text-4xl font-bold text-gray-900">{passedCount} <span className="text-lg text-gray-400 font-normal">من {totalCount}</span></div>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
          <div className="flex items-center gap-2 mb-1 text-green-700 text-xs"><Compass className="w-4 h-4" /> المسار المهني</div>
          <div className="text-sm font-bold text-green-800 leading-tight mt-1">{student.major}</div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-4">الخدمات السريعة</h2>
      <div className="grid grid-cols-2 gap-4">
        {services.map(s => (
          <button key={s.page} onClick={() => setPage(s.page)}
            className="bg-white rounded-2xl p-5 border border-gray-100 text-right hover:border-green-200 hover:shadow-sm transition-all group">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
              <s.icon className="w-5 h-5 text-green-600" />
            </div>
            <div className="font-bold text-gray-800 text-sm mb-1">{s.label}</div>
            <div className="text-gray-400 text-xs leading-relaxed">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CareerPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const next = () => {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    if (step < CAREER_QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setSelected(null);
      setStep(step + 1);
    } else {
      const counts: Record<string, number> = {};
      newAnswers.forEach(a => { counts[a] = (counts[a] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setResult(CAREER_MAP[top] || "تطوير البرمجيات");
    }
  };

  const restart = () => { setStep(0); setAnswers([]); setSelected(null); setResult(null); };

  if (result) return (
    <div className="p-8 max-w-xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">نتيجة تحدي المسار</h2>
        <p className="text-gray-500 text-sm mb-4">بناءً على إجاباتك، المسار الأنسب لك هو:</p>
        <div className="bg-green-50 rounded-xl px-6 py-4 mb-6">
          <p className="text-green-800 font-bold text-lg">{result}</p>
        </div>
        <button onClick={restart} className="text-green-600 text-sm hover:underline">إعادة التحدي</button>
      </div>
    </div>
  );

  const q = CAREER_QUESTIONS[step];
  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-2 mb-2">
        <Compass className="w-5 h-5 text-green-600" />
        <h1 className="text-xl font-bold text-gray-900">تحدي اكتشاف المسار</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">أجيبي على هذه الأسئلة القصيرة لنقترح لك المسار التقني الأنسب لشغفك.</p>

      <div className="flex items-center gap-2 mb-6 flex-row-reverse justify-end">
        {CAREER_QUESTIONS.map((_, i) => (
          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === step ? "bg-green-600 text-white" : i < step ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>{i + 1}</div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="font-bold text-gray-800 mb-5 text-sm">{q.q}</p>
        <div className="space-y-3">
          {q.options.map(opt => (
            <button key={opt.value} onClick={() => setSelected(opt.value)}
              className={`w-full text-right px-4 py-3 rounded-xl border text-sm transition-colors ${selected === opt.value ? "border-green-500 bg-green-50 text-green-800" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={next} disabled={!selected}
          className="mt-5 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl px-6 py-2.5 text-sm font-bold transition-colors flex items-center gap-2">
          السؤال التالي <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function QuizPage({ student }: { student: StudentSession }) {
  const [skillId, setSkillId] = useState<number | null>(null);
  const [quizState, setQuizState] = useState<"select" | "taking" | "result">("select");
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const { data: skills = [] } = useQuery({ queryKey: ["skills"], queryFn: () => api("/skills") });

  const startQuiz = async () => {
    if (!skillId) return;
    setLoadingQuiz(true);
    setErrMsg("");
    try {
      const qs = await api(`/students/${student.id}/quiz/${skillId}`);
      setQuestions(qs);
      setAnswers({});
      setQuizState("taking");
    } catch (e: any) {
      setErrMsg("لا توجد أسئلة لهذه المهارة بعد. تواصلي مع المشرفة.");
    } finally { setLoadingQuiz(false); }
  };

  const submitQuiz = async () => {
    try {
      const res = await api(`/students/${student.id}/quiz/${skillId}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      setResult(res);
      setQuizState("result");
    } catch { setErrMsg("حدث خطأ في إرسال الإجابات."); }
  };

  if (quizState === "result" && result) return (
    <div className="p-8 max-w-lg">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        {result.passed ? <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" /> : <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />}
        <h2 className="text-xl font-bold mb-2">{result.passed ? "أحسنت! اجتزتِ الاختبار" : "لم تجتازي الاختبار"}</h2>
        <p className="text-gray-500 text-sm mb-4">النتيجة: {result.correct} من {result.total} ({result.score}%)</p>
        {result.passed && <div className="bg-green-50 rounded-xl px-4 py-2 mb-4 text-green-700 text-sm font-medium">تم توثيق المهارة في سيرتك الذاتية ✓</div>}
        <button onClick={() => { setQuizState("select"); setResult(null); setSkillId(null); }}
          className="bg-green-500 text-white rounded-xl px-6 py-2.5 text-sm font-bold">اختبار مهارة أخرى</button>
      </div>
    </div>
  );

  if (quizState === "taking") return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <ClipboardCheck className="w-5 h-5 text-green-600" />
        <h1 className="text-xl font-bold text-gray-900">اختبار إثبات المهارة</h1>
      </div>
      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-bold text-gray-800 mb-4 text-sm">{idx + 1}. {q.questionText}</p>
            {["a", "b", "c", "d"].map(opt => (
              <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                className={`w-full text-right px-4 py-2.5 rounded-lg border mb-2 text-sm transition-colors ${answers[q.id] === opt ? "border-green-500 bg-green-50 text-green-800" : "border-gray-100 hover:border-gray-300 text-gray-700"}`}>
                {q[`option${opt.toUpperCase()}`]}
              </button>
            ))}
          </div>
        ))}
      </div>
      {errMsg && <p className="text-red-500 text-sm mt-3">{errMsg}</p>}
      <button onClick={submitQuiz} disabled={Object.keys(answers).length < questions.length}
        className="mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl px-8 py-3 text-sm font-bold">
        تسليم الإجابات
      </button>
    </div>
  );

  return (
    <div className="p-8 max-w-lg">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <ClipboardCheck className="w-7 h-7 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">اختبار إثبات المهارة</h1>
        <p className="text-gray-400 text-sm">اختري المهارة التي تودين توثيقها عبر الاختبار المصغر</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4 text-sm">اختري المهارة</h2>
        <p className="text-gray-400 text-xs mb-4">المهارات المتاحة للاختبار تعتمد على المسارات التقنية المتاحة.</p>
        <label className="block text-sm font-medium text-gray-700 mb-2">المهارة التقنية</label>
        <select value={skillId ?? ""} onChange={e => setSkillId(Number(e.target.value) || null)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4">
          <option value="">— الرجاء الاختيار —</option>
          {(skills as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.nameEn ? ` (${s.nameEn})` : ""}</option>)}
        </select>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4 text-xs text-amber-700 space-y-1">
          <p className="font-bold">تعليمات هامة قبل البدء:</p>
          <p>• يكون الاختبار من 5 أسئلة اختيار من متعدد.</p>
          <p>• يجب الإجابة على جميع الأسئلة قبل انتهاء الوقت المخصص.</p>
          <p>• درجة الاجتياز المطلوبة هي 60% (3 من 5 إجابات صحيحة على الأقل).</p>
          <p>• لا يمكنك إيقاف المؤقت بعد البدء.</p>
        </div>
        {errMsg && <p className="text-red-500 text-xs mb-3">{errMsg}</p>}
        <button onClick={startQuiz} disabled={!skillId || loadingQuiz}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl py-3 font-bold text-sm transition-colors">
          {loadingQuiz ? "جاري التحميل..." : "ابدأ الاختبار الآن"}
        </button>
      </div>
    </div>
  );
}

function HistoryPage({ student }: { student: StudentSession }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["quiz-history", student.id],
    queryFn: () => api(`/students/${student.id}/quiz-history`),
  });

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-5 h-5 text-green-600" />
        <h1 className="text-xl font-bold text-gray-900">سجل الاختبارات</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">جميع محاولاتك السابقة لتوثيق المهارات التقنية</p>
      {isLoading ? <div className="text-center text-gray-400 py-12">جاري التحميل...</div> : (history as any[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <History className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">لم تجتازي أي اختبار بعد.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-right text-gray-500 font-medium">المهارة</th>
                <th className="px-4 py-3 text-center text-gray-500 font-medium">النتيجة</th>
                <th className="px-4 py-3 text-center text-gray-500 font-medium">الحالة</th>
                <th className="px-4 py-3 text-right text-gray-500 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {(history as any[]).map((a: any) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {a.skillName}
                    {a.skillNameEn && <span className="text-gray-400 font-normal"> ({a.skillNameEn})</span>}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{Math.round(a.score)}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${a.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {a.passed ? <><CheckCircle2 className="w-3 h-3" /> اجتاز</> : <><XCircle className="w-3 h-3" /> لم يجتز</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatHijriDate(a.takenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProjectsPage({ student }: { student: StudentSession }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", technologies: "", description: "", date: "" });
  const [saving, setSaving] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["student-projects", student.id],
    queryFn: () => api(`/students/${student.id}/projects`),
  });

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.technologies || !form.description) return;
    setSaving(true);
    try {
      await api("/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, title: form.title, description: form.description, technologies: form.technologies.split(",").map(t => t.trim()) }),
      });
      qc.invalidateQueries({ queryKey: ["student-projects", student.id] });
      setForm({ title: "", technologies: "", description: "", date: "" });
      setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">مشاريع النادي</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 font-medium">
          <Plus className="w-4 h-4" /> مشروع جديد
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">سجلي كل مشروع طلقته في نادي الحاسب</p>

      {showForm && (
        <form onSubmit={addProject} className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 text-sm">إلغاء</button>
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Plus className="w-4 h-4 text-green-600" /> مشروع جديد</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">اسم المشروع *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="مثال: تطبيق إدارة المهام"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">التقنيات المستخدمة *</label>
              <input value={form.technologies} onChange={e => setForm(p => ({ ...p, technologies: e.target.value }))}
                placeholder="مثال: React, Python, SQL"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">وصف المشروع *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="اشرحي ما قمتِ ببنائه وما تعلمته من هذا المشروع..."
              rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 text-sm px-4 py-2">إلغاء</button>
            <button type="submit" disabled={saving} className="bg-green-500 text-white rounded-xl px-5 py-2 text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة
            </button>
          </div>
        </form>
      )}

      {(projects as any[]).length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">لا توجد مشاريع مضافة بعد.</p>
          <p className="text-gray-300 text-xs mt-1">ابدأي بإضافة أول مشروع طلقته في نادي الحاسب</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(projects as any[]).map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="font-bold text-gray-900 mb-1">{p.title}</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(p.technologies || []).map((t: string) => (
                  <span key={t} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
              <p className="text-gray-500 text-sm">{p.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CVPage({ student }: { student: StudentSession }) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: skills = [] } = useQuery({
    queryKey: ["student-skills", student.id],
    queryFn: () => api(`/students/${student.id}/skills`),
  });
  const verifiedSkills = (skills as any[]).filter((s: any) => s.verified);
  const avgScore = verifiedSkills.length > 0 ? Math.round(verifiedSkills.reduce((s: number, k: any) => s + k.score, 0) / verifiedSkills.length) : 0;
  const passedCount = verifiedSkills.length;
  const totalCount = (skills as any[]).length;
  const today = new Date();
  const hijriYear = toHijri(today.getFullYear());
  const hijriMonths = ["محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];

  const handlePrint = () => window.print();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">السيرة الذاتية الذكية</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Printer className="w-4 h-4" /> طباعة
          </button>
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-6 print:hidden">يتم تحديث سيرتك الذاتية تلقائياً عند اجتيازك لاختبارات إثبات المهارة.</p>

      <div ref={printRef} className="bg-white rounded-2xl border border-gray-100 overflow-hidden max-w-2xl">
        <div className="bg-green-600 text-white text-center px-8 py-6">
          <div className="text-sm opacity-80 mb-1">جامعة الحدود الشمالية</div>
          <div className="text-xs opacity-70">{student.college} — نادي الحاسب</div>
          <div className="text-2xl font-bold mt-3">صك الجدارة المهنية</div>
          <div className="text-xs opacity-70 mt-1">نظام النبض المهني لتوثيق المهارات التقنية</div>
        </div>
        <div className="p-6">
          <h2 className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">بيانات الطالبة</h2>
          <table className="w-full text-sm mb-6">
            <tbody>
              <tr className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-500">اسم الطالبة</td>
                <td className="py-2 text-gray-900 font-bold">{student.name}</td>
                <td className="py-2 font-medium text-gray-500">التخصص</td>
                <td className="py-2 text-gray-700">{student.major}</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 font-medium text-gray-500">الجهة</td>
                <td className="py-2 text-gray-700">جامعة الحدود الشمالية</td>
                <td className="py-2 font-medium text-gray-500">المسار المهني</td>
                <td className="py-2 text-gray-700">{student.major}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-gray-500">المهارات المثبتة</td>
                <td className="py-2 text-gray-700">{verifiedSkills.map((s: any) => `${s.skillName}${s.skillNameEn ? ` (${s.skillNameEn})` : ""}`).join(" - ")}</td>
                <td className="py-2 font-medium text-gray-500">معدل الأداء</td>
                <td className="py-2"><span className="text-green-700 font-bold">{avgScore}%</span></td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-gray-500">الاختبارات المجتازة</td>
                <td colSpan={3} className="py-2 text-gray-700">{passedCount}/{totalCount}</td>
              </tr>
            </tbody>
          </table>

          <h2 className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">تفاصيل المهارات الموثقة</h2>
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-right text-gray-500 font-medium">#</th>
                <th className="px-3 py-2 text-right text-gray-500 font-medium">المهارة</th>
                <th className="px-3 py-2 text-center text-gray-500 font-medium">النتيجة</th>
                <th className="px-3 py-2 text-center text-gray-500 font-medium">الحالة</th>
                <th className="px-3 py-2 text-right text-gray-500 font-medium">تاريخ التوثيق</th>
              </tr>
            </thead>
            <tbody>
              {verifiedSkills.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400 text-xs">لا توجد مهارات موثقة بعد</td></tr>
              ) : verifiedSkills.map((s: any, i: number) => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{s.skillName}{s.skillNameEn ? <span className="text-gray-400 font-normal"> ({s.skillNameEn})</span> : ""}</td>
                  <td className="px-3 py-2 text-center font-bold text-gray-700">{Math.round(s.score)}%</td>
                  <td className="px-3 py-2 text-center"><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ موثقة</span></td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{s.verifiedAt ? formatHijriDate(s.verifiedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 leading-relaxed mb-4">
            يشهد نادي الحاسب بجامعة الحدود الشمالية بأن الطالبة <strong>«{student.name}»</strong> المسجلة في تخصص <strong>{student.major}</strong> قد اجتازت الاختبارات الجاهزية المهنية عبر منصة النبض المهني بمعدل أداء <strong>{avgScore}%</strong>، وتم توثيق مهاراتها التقنية إلكترونياً.
            <br /><br />
            المسار التقني المستهدف: <span className="text-green-700 font-bold">{student.major}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
            <span>⊙ وثيقة إلكترونية قابلة للتحقق — نظام النبض المهني</span>
            <span>تاريخ الإصدار: {today.getDate()} {hijriMonths[today.getMonth()]} {hijriYear} هـ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
