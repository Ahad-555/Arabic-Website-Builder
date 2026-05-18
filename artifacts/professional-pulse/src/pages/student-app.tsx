import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Home, Compass, ClipboardCheck, History, FolderOpen, FileText,
  LogOut, BrainCircuit, CheckCircle2, XCircle, Printer, Plus,
  Upload, Sparkles, ShieldCheck, AlertCircle, Loader2, ImageIcon
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
      { label: "تصميم واجهة المستخدم وتجربة تفاعلية أفضل.", value: "design" },
      { label: "كتابة الكود والمنطق البرمجي خلف الكواليس.", value: "programming" },
      { label: "تخطيط المشروع وتوزيع المهام وإدارة الموارد.", value: "management" },
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
      setAnswers(newAnswers); setSelected(null); setStep(step + 1);
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
      <p className="text-gray-400 text-sm mb-6">أجيبي على هذه الأسئلة القصيرة لنقترح لك المسار التقني الأنسب.</p>
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
          className="mt-5 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl px-6 py-2.5 text-sm font-bold transition-colors">
          السؤال التالي
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
    setLoadingQuiz(true); setErrMsg("");
    try {
      const qs = await api(`/students/${student.id}/quiz/${skillId}`);
      setQuestions(qs); setAnswers({}); setQuizState("taking");
    } catch { setErrMsg("لا توجد أسئلة لهذه المهارة بعد. تواصلي مع المشرفة."); }
    finally { setLoadingQuiz(false); }
  };

  const submitQuiz = async () => {
    try {
      const res = await api(`/students/${student.id}/quiz/${skillId}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      setResult(res); setQuizState("result");
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
        className="mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl px-8 py-3 text-sm font-bold">تسليم الإجابات</button>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">المهارة التقنية</label>
        <select value={skillId ?? ""} onChange={e => setSkillId(Number(e.target.value) || null)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4">
          <option value="">— الرجاء الاختيار —</option>
          {(skills as any[]).map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.nameEn ? ` (${s.nameEn})` : ""}</option>)}
        </select>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-4 text-xs text-amber-700 space-y-1">
          <p className="font-bold">تعليمات هامة قبل البدء:</p>
          <p>• الاختبار من 5 أسئلة اختيار من متعدد.</p>
          <p>• درجة الاجتياز 60% (3 من 5 على الأقل).</p>
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
      {isLoading ? <div className="text-center text-gray-400 py-12">جاري التحميل...</div>
        : (history as any[]).length === 0 ? (
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
                    <td className="px-4 py-3 font-medium text-gray-900">{a.skillName}{a.skillNameEn && <span className="text-gray-400 font-normal"> ({a.skillNameEn})</span>}</td>
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

// ─── AI Project Quiz Modal ───────────────────────────────────────────────────
interface AIQuestion { id: number; question: string; options: string[]; correctIndex: number; }

function AIQuizModal({ project, onClose, onPassed }: {
  project: any;
  onClose: () => void;
  onPassed: () => void;
}) {
  const [phase, setPhase] = useState<"generating" | "quiz" | "result">("generating");
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ passed: boolean; score: number; feedback: string } | null>(null);
  const [errMsg, setErrMsg] = useState("");

  // Trigger quiz generation on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await api(`/projects/${project.id}/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        setQuestions(data.questions ?? []);
        setPhase("quiz");
      } catch {
        setErrMsg("تعذّر توليد الاختبار. حاولي مرة أخرى.");
        setPhase("quiz");
      }
    })();
  }, [project.id]);

  const submitAnswers = async () => {
    try {
      const answersArr = questions.map(q => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1 }));
      const data = await api(`/projects/${project.id}/quiz/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersArr }),
      });
      setResult({ passed: data.passed, score: data.score, feedback: data.feedback });
      setPhase("result");
      if (data.passed) onPassed();
    } catch { setErrMsg("حدث خطأ في التحقق. حاولي مرة أخرى."); }
  };

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id] !== undefined);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-l from-green-600 to-emerald-700 text-white p-5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold">مدقق النزاهة بالذكاء الاصطناعي</div>
              <div className="text-xs text-green-100 mt-0.5 truncate max-w-xs">{project.title}</div>
            </div>
            <button onClick={onClose} className="mr-auto text-white/70 hover:text-white text-xl leading-none">✕</button>
          </div>
        </div>

        <div className="p-5">
          {/* Generating phase */}
          {phase === "generating" && (
            <div className="text-center py-10">
              <Loader2 className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
              <p className="font-bold text-gray-800 mb-2">الذكاء الاصطناعي يحلل مشروعك...</p>
              <p className="text-gray-400 text-sm">يتم تحليل الصورة والوصف لتوليد أسئلة مخصصة لمشروعك</p>
            </div>
          )}

          {/* Quiz phase */}
          {phase === "quiz" && (
            <>
              {errMsg && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errMsg}
                </div>
              )}
              {questions.length === 0 && !errMsg ? (
                <div className="text-center py-8 text-gray-400">لا توجد أسئلة.</div>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-xs text-amber-700">
                    <p className="font-bold mb-1">تعليمات الاختبار:</p>
                    <p>الذكاء الاصطناعي ولّد هذه الأسئلة بناءً على صورة مشروعك ووصفه. أجيبي بصدق لإثبات ملكيتك الفكرية.</p>
                  </div>
                  <div className="space-y-4 mb-4">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="border border-gray-100 rounded-xl p-4">
                        <p className="font-bold text-gray-800 text-sm mb-3">{idx + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt, oi) => (
                            <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                              className={`w-full text-right px-3 py-2.5 rounded-lg border text-sm transition-colors ${answers[q.id] === oi ? "border-green-500 bg-green-50 text-green-800 font-medium" : "border-gray-100 hover:border-gray-300 text-gray-700"}`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={submitAnswers} disabled={!allAnswered}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl py-3 font-bold text-sm transition-colors">
                    تسليم الإجابات
                  </button>
                </>
              )}
            </>
          )}

          {/* Result phase */}
          {phase === "result" && result && (
            <div className="text-center py-6">
              {result.passed ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">تم منح ختم الموثوقية!</h3>
                  <div className="bg-green-50 rounded-xl px-5 py-3 mb-4 inline-block">
                    <p className="text-green-700 font-bold">النتيجة: {result.score}%</p>
                  </div>
                  <p className="text-gray-500 text-sm mb-5">{result.feedback}</p>
                  <div className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                    <ShieldCheck className="w-5 h-5 inline ml-2 text-green-600" />
                    مشروعك الآن موثق ومفحوص بالذكاء الاصطناعي ويحمل <strong>ختم الموثوقية</strong> في صك جدارتك
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">لم يُمنح الختم بعد</h3>
                  <div className="bg-orange-50 rounded-xl px-5 py-3 mb-4 inline-block">
                    <p className="text-orange-700 font-bold">النتيجة: {result.score}%</p>
                  </div>
                  <p className="text-gray-500 text-sm mb-5">{result.feedback}</p>
                </>
              )}
              <button onClick={onClose} className="text-gray-500 text-sm hover:underline">إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Projects Page ────────────────────────────────────────────────────────────
function ProjectsPage({ student }: { student: StudentSession }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", technologies: "", description: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [quizProject, setQuizProject] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["student-projects", student.id],
    queryFn: () => api(`/students/${student.id}/projects`),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    setSaving(true);
    try {
      let imageData: string | undefined;
      if (imageFile && imagePreview) {
        imageData = imagePreview; // base64 data URL
      }
      await api("/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          title: form.title,
          description: form.description,
          technologies: form.technologies.split(",").map(t => t.trim()).filter(Boolean),
          imageData,
        }),
      });
      qc.invalidateQueries({ queryKey: ["student-projects", student.id] });
      setForm({ title: "", technologies: "", description: "" });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const onQuizPassed = () => {
    qc.invalidateQueries({ queryKey: ["student-projects", student.id] });
  };

  return (
    <div className="p-8 max-w-2xl">
      {quizProject && (
        <AIQuizModal
          project={quizProject}
          onClose={() => setQuizProject(null)}
          onPassed={onQuizPassed}
        />
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">مشاريع النادي</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 font-medium">
          <Plus className="w-4 h-4" /> مشروع جديد
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">سجّلي مشاريعك التقنية واحصلي على ختم الموثوقية من الذكاء الاصطناعي</p>

      {/* AI integrity explainer */}
      <div className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-green-800 text-sm">مدقق النزاهة بالذكاء الاصطناعي</p>
          <p className="text-green-700 text-xs mt-1 leading-relaxed">
            ارفعي صورة مشروعك مع وصفه، سيقوم الذكاء الاصطناعي بتحليل المشروع وتوليد اختبار استجوابي مخصص يثبت ملكيتك الفكرية. اجتيازه يمنح مشروعك <strong>ختم الموثوقية</strong> في صك جدارتك.
          </p>
        </div>
      </div>

      {/* Add project form */}
      {showForm && (
        <form onSubmit={addProject} className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4 text-green-600" /> إضافة مشروع جديد
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">اسم المشروع *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="مثال: تطبيق إدارة المهام"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">التقنيات المستخدمة</label>
              <input value={form.technologies} onChange={e => setForm(p => ({ ...p, technologies: e.target.value }))}
                placeholder="مثال: React, Python, SQL"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">وصف المشروع *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="اشرحي ما قمتِ ببنائه، التحديات التي واجهتِها، والتقنيات التي طبّقتِها..."
              rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          {/* Image upload */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              صورة المشروع <span className="text-green-600 font-medium">(لتفعيل مدقق الذكاء الاصطناعي)</span>
            </label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-green-200">
                <img src={imagePreview} alt="preview" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="bg-white text-red-600 rounded-lg px-3 py-1.5 text-xs font-medium">إزالة الصورة</button>
                </div>
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> جاهزة للتحليل
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-green-400 hover:bg-green-50 transition-colors group">
                <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-green-500 mx-auto mb-2 transition-colors" />
                <p className="text-sm text-gray-500 group-hover:text-green-600">انقري لرفع صورة المشروع</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF — الحد الأقصى 5MB</p>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={() => { setShowForm(false); setImageFile(null); setImagePreview(null); }}
              className="text-gray-500 text-sm px-4 py-2">إلغاء</button>
            <button type="submit" disabled={saving || !form.title || !form.description}
              className="bg-green-500 text-white rounded-xl px-5 py-2 text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-green-600 transition-colors">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</> : <><Plus className="w-4 h-4" /> إضافة المشروع</>}
            </button>
          </div>
        </form>
      )}

      {/* Projects list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : (projects as any[]).length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">لا توجد مشاريع مضافة بعد.</p>
          <p className="text-gray-300 text-xs mt-1">ابدأي بإضافة أول مشروع طلقته في نادي الحاسب</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(projects as any[]).map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.trustStamp && (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> ختم الموثوقية
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "verified" ? "bg-green-50 text-green-600" : p.status === "analyzing" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
                      {p.status === "verified" ? "موثق" : p.status === "analyzing" ? "قيد التحليل" : "قيد المراجعة"}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{p.title}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3 justify-end">
                  {(p.technologies || []).map((t: string) => (
                    <span key={t} className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <p className="text-gray-500 text-sm text-right mb-4">{p.description}</p>

                {!p.trustStamp && (
                  <div className="flex justify-start">
                    <button onClick={() => setQuizProject(p)}
                      className="flex items-center gap-2 bg-gradient-to-l from-green-600 to-emerald-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:opacity-90 transition-opacity shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      فحص المشروع بالذكاء الاصطناعي
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CVPage({ student }: { student: StudentSession }) {
  const { data: skills = [] } = useQuery({
    queryKey: ["student-skills", student.id],
    queryFn: () => api(`/students/${student.id}/skills`),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["student-projects", student.id],
    queryFn: () => api(`/students/${student.id}/projects`),
  });

  const verifiedSkills = (skills as any[]).filter((s: any) => s.verified);
  const trustedProjects = (projects as any[]).filter((p: any) => p.trustStamp);
  const avgScore = verifiedSkills.length > 0
    ? Math.round(verifiedSkills.reduce((s: number, k: any) => s + k.score, 0) / verifiedSkills.length)
    : 0;

  const today = new Date();
  const hijriYear = toHijri(today.getFullYear());
  const hijriMonths = ["محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">السيرة الذاتية الذكية</h1>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          <Printer className="w-4 h-4" /> طباعة
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6 print:hidden">تُحدَّث سيرتك تلقائياً عند اجتياز الاختبارات وختم مشاريعك.</p>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden max-w-2xl">
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
              <tr>
                <td className="py-2 font-medium text-gray-500">معدل الأداء</td>
                <td className="py-2"><span className="text-green-700 font-bold">{avgScore}%</span></td>
                <td className="py-2 font-medium text-gray-500">المشاريع الموثقة</td>
                <td className="py-2 text-gray-700">{trustedProjects.length}</td>
              </tr>
            </tbody>
          </table>

          <h2 className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">المهارات الموثقة</h2>
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-right text-gray-500 font-medium">#</th>
                <th className="px-3 py-2 text-right text-gray-500 font-medium">المهارة</th>
                <th className="px-3 py-2 text-center text-gray-500 font-medium">النتيجة</th>
                <th className="px-3 py-2 text-center text-gray-500 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {verifiedSkills.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">لا توجد مهارات موثقة بعد</td></tr>
              ) : verifiedSkills.map((s: any, i: number) => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{s.skillName}{s.skillNameEn ? <span className="text-gray-400 font-normal text-xs"> ({s.skillNameEn})</span> : ""}</td>
                  <td className="px-3 py-2 text-center font-bold text-gray-700">{Math.round(s.score)}%</td>
                  <td className="px-3 py-2 text-center"><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">✓ موثقة</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          {trustedProjects.length > 0 && (
            <>
              <h2 className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">مشاريع النادي الموثقة بالذكاء الاصطناعي</h2>
              <div className="space-y-2 mb-6">
                {trustedProjects.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-2.5">
                    <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                    <div className="flex-1 text-right">
                      <span className="font-medium text-gray-800 text-sm">{p.title}</span>
                      {p.technologies?.length > 0 && (
                        <span className="text-gray-400 text-xs mr-2">({p.technologies.join(", ")})</span>
                      )}
                    </div>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">مفحوص بالذكاء الاصطناعي</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 leading-relaxed mb-4">
            يشهد نادي الحاسب بجامعة الحدود الشمالية بأن الطالبة <strong>«{student.name}»</strong> قد اجتازت الاختبارات الجاهزية المهنية عبر منصة النبض المهني بمعدل أداء <strong>{avgScore}%</strong>، وتم توثيق مهاراتها التقنية إلكترونياً{trustedProjects.length > 0 ? `، وتحمل ${trustedProjects.length} مشروع موثق بختم الموثوقية من الذكاء الاصطناعي` : ""}.
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
            <span>⊙ وثيقة إلكترونية — نظام النبض المهني</span>
            <span>تاريخ الإصدار: {today.getDate()} {hijriMonths[today.getMonth()]} {hijriYear} هـ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
