import { useState } from "react";
import { BrainCircuit, ShieldCheck, ArrowLeft, Eye, Building2 } from "lucide-react";
import type { Session } from "@/App";

interface Props { onLogin: (s: Session) => void; }

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<"student" | "supervisor">("student");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("أدخلي اسمك الكامل"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/students/by-name?name=${encodeURIComponent(name.trim())}`);
      if (!res.ok) { setError("الاسم غير مسجل في المنصة. تواصلي مع المشرفة."); return; }
      const student = await res.json();
      onLogin({ type: "student", id: student.id, name: student.name, major: student.major, college: student.college || "كلية الحاسبات وتقنية المعلومات" });
    } catch { setError("حدث خطأ في الاتصال. حاولي مرة أخرى."); }
    finally { setLoading(false); }
  };

  const handleSupervisorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "ahd2026") {
      onLogin({ type: "supervisor" });
    } else {
      setError("كلمة السر غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <BrainCircuit className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">النبض المهني</h1>
        <p className="text-gray-500 mt-1 text-sm">منصة جامعة الحدود الشمالية لتوثيق المهارات</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm mb-4">
        {mode === "student" ? (
          <form onSubmit={handleStudentLogin}>
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-right">تسجيل الدخول</h2>
            <p className="text-gray-400 text-sm mb-6 text-right">أدخلي اسمك الكامل كما هو مسجل في المنصة</p>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">الاسم الكامل</label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              placeholder="مثال: عهد الشمري"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4 text-sm"
            />
            {error && <p className="text-red-500 text-xs mb-3 text-right">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
            >
              {loading ? "جاري البحث..." : <>دخول <ArrowLeft className="w-4 h-4" /></>}
            </button>
            <button type="button" onClick={() => { setMode("supervisor"); setError(""); }}
              className="w-full text-gray-400 text-sm hover:text-gray-600 transition-colors">
              دخول المشرفة
            </button>
          </form>
        ) : (
          <form onSubmit={handleSupervisorLogin}>
            <div className="flex items-center justify-between mb-1">
              <ShieldCheck className="text-green-600 w-5 h-5" />
              <h2 className="text-xl font-bold text-gray-900">لوحة تحكم المشرفة</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6 text-right">أدخلي كلمة سر المشرفة للوصول</p>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">كلمة السر</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4 text-sm"
            />
            {error && <p className="text-red-500 text-xs mb-3 text-right">{error}</p>}
            <button type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-bold text-sm transition-colors flex items-center justify-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4" /> دخول المشرفة
            </button>
            <button type="button" onClick={() => { setMode("student"); setError(""); }}
              className="w-full text-gray-400 text-sm hover:text-gray-600 transition-colors">
              رجوع لتسجيل دخول الطالبة
            </button>
          </form>
        )}
      </div>

      {/* Future Vision / Partner button */}
      <button
        onClick={() => onLogin({ type: "partner" })}
        className="flex items-center gap-2.5 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-2xl px-5 py-3 text-sm transition-all group shadow-sm w-full max-w-sm"
      >
        <div className="flex-1 text-right">
          <div className="font-bold text-gray-700 group-hover:text-green-700 transition-colors text-xs mb-0.5">
            الرؤية المستقبلية — الشراكات المجتمعية
          </div>
          <div className="text-gray-400 text-xs">لوحة استعراض الكفاءات للجهات الشريكة (للقراءة فقط)</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Building2 className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
          <Eye className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
        </div>
      </button>
    </div>
  );
}
