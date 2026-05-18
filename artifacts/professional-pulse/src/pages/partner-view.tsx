import { useQuery } from "@tanstack/react-query";
import {
  BrainCircuit, ArrowRight, ShieldCheck, Award, Users,
  TrendingUp, Building2, BarChart3, Star, CheckCircle2
} from "lucide-react";

const api = async (path: string) => {
  const r = await fetch(`/api${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const SECTOR_TAGS: Record<string, { label: string; color: string }> = {
  "الذكاء الاصطناعي": { label: "NEOM / التقنية", color: "bg-violet-100 text-violet-700" },
  "نظم المعلومات الإدارية": { label: "البنوك / المالية", color: "bg-blue-100 text-blue-700" },
  "علوم الحاسب": { label: "الشركات التقنية", color: "bg-green-100 text-green-700" },
  "تقنية المعلومات": { label: "الشركات التقنية", color: "bg-teal-100 text-teal-700" },
  "هندسة البرمجيات": { label: "NEOM / السحابة", color: "bg-indigo-100 text-indigo-700" },
  "تصميم واجهات المستخدم": { label: "التجارة الإلكترونية", color: "bg-pink-100 text-pink-700" },
  "تطوير البرمجيات / نظم المعلومات": { label: "البنوك / التقنية", color: "bg-cyan-100 text-cyan-700" },
  "تحليل البيانات": { label: "مصرف الإنماء", color: "bg-amber-100 text-amber-700" },
};

const AVATAR_COLORS = [
  "bg-indigo-600", "bg-violet-600", "bg-pink-600",
  "bg-amber-600", "bg-teal-600", "bg-cyan-600",
];

interface Props { onBack: () => void; }

export default function PartnerView({ onBack }: Props) {
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["partner-students"],
    queryFn: () => api("/students"),
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["partner-skills"],
    queryFn: () => api("/skills"),
  });

  // Fetch all student skills in parallel
  const studentIds = (students as any[]).map((s: any) => s.id);

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="rtl">
      {/* Top banner */}
      <div className="bg-gradient-to-l from-green-700 via-green-600 to-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <button onClick={onBack}
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
              <ArrowRight className="w-4 h-4" /> العودة
            </button>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-xs text-green-200 text-right">لوحة الاستعراض الرقمي — للجهات الشريكة</div>
                <div className="font-bold text-lg text-right">نظام النبض المهني</div>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vision section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h2 className="font-bold text-gray-800">الرؤية المستقبلية — الشراكات المجتمعية</h2>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">رؤية 2030</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-3xl">
                يتطلع نظام "النبض المهني" في مراحله المتقدمة إلى دعم الشراكات المجتمعية الخاصة بالكلية والجامعة؛
                من خلال إتاحة لوحة استعراض رقمية مخصصة <strong>(للقراءة فقط)</strong> تُمكّن الجهات الخارجية المعتمدة والشريكة
                — مثل <strong>مصرف الإنماء</strong> والشركات التقنية الكبرى — من الاطلاع على مخرجات الطالبات المهارية
                واستقطاب الكفاءات بناءً على الجدارات الموثقة تقنياً بالذكاء الاصطناعي.
              </p>
            </div>
            <div className="hidden md:flex gap-3 shrink-0">
              {["مصرف الإنماء", "NEOM", "الشركات التقنية"].map(p => (
                <div key={p} className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center">
                  <Building2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <div className="text-xs text-green-700 font-medium">{p}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* KPI stats */}
        <KPIStats students={students} skills={skills} />

        {/* Talent pool */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-800">مجموعة الكفاءات المتاحة</h2>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{(students as any[]).length} طالبة</span>
          </div>

          {loadingStudents ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              جاري تحميل بيانات الطالبات...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(students as any[]).map((student: any, i: number) => (
                <StudentCard key={student.id} student={student} colorClass={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
              ))}
            </div>
          )}
        </div>

        {/* Skills demand */}
        <SkillsDemand skills={skills} />

        {/* KPI footer */}
        <div className="bg-gradient-to-l from-green-600 to-emerald-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-bold">مؤشرات الأداء الحيوية (KPIs) — جامعة الحدود الشمالية</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "نسبة توثيق المهارات", value: "100%", sub: "عبر اختبارات موثقة" },
              { label: "مشاريع مفحوصة بالذكاء الاصطناعي", value: "✓", sub: "ختم الموثوقية" },
              { label: "موءمة مع رؤية 2030", value: "✓", sub: "مهارات سوق العمل" },
              { label: "جاهزية للتوظيف", value: "قابلة للقياس", sub: "معدل أداء موثق" },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold mb-1">{kpi.value}</div>
                <div className="text-xs text-green-100 font-medium mb-0.5">{kpi.label}</div>
                <div className="text-xs text-green-200">{kpi.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-green-100 text-xs mt-4 text-center">
            تسعى هذه الرؤية المستقبلية إلى دعم مؤشرات الأداء الحيوية لجامعة الحدود الشمالية لرفع نسب توظيف الخريجين
            ومواءمة مخرجات التعليم العالي مع متطلبات سوق العمل السعودي تماشياً مع مستهدفات رؤية المملكة 2030.
          </p>
        </div>
      </div>
    </div>
  );
}

function KPIStats({ students, skills }: { students: any[]; skills: any[] }) {
  const total = students.length;
  const majorCount = new Set(students.map((s: any) => s.major)).size;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: "إجمالي الطالبات", value: total, icon: Users, color: "bg-green-600 text-white" },
        { label: "التخصصات المتاحة", value: majorCount, icon: Star, color: "bg-white border border-gray-100" },
        { label: "المهارات الموثقة", value: skills.length, icon: Award, color: "bg-white border border-gray-100" },
        { label: "جاهزية للتوظيف", value: `${total > 0 ? 100 : 0}%`, icon: TrendingUp, color: "bg-emerald-50 border border-emerald-100" },
      ].map(stat => (
        <div key={stat.label} className={`${stat.color} rounded-2xl p-5`}>
          <div className="flex items-center gap-2 mb-2 opacity-70 text-xs">
            <stat.icon className="w-4 h-4" />
            {stat.label}
          </div>
          <div className="text-3xl font-bold">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

function StudentCard({ student, colorClass }: { student: any; colorClass: string }) {
  const { data: studentSkills = [] } = useQuery({
    queryKey: ["partner-student-skills", student.id],
    queryFn: () => api(`/students/${student.id}/skills`),
  });

  const { data: studentProjects = [] } = useQuery({
    queryKey: ["partner-student-projects", student.id],
    queryFn: () => api(`/students/${student.id}/projects`),
  });

  const verified = (studentSkills as any[]).filter((s: any) => s.verified);
  const stamped = (studentProjects as any[]).filter((p: any) => p.trustStamp);
  const avgScore = verified.length > 0
    ? Math.round(verified.reduce((acc: number, s: any) => acc + s.score, 0) / verified.length)
    : 0;

  const sectorTag = SECTOR_TAGS[student.major] ?? { label: "تقنية المعلومات", color: "bg-gray-100 text-gray-600" };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-1 min-w-0 text-right">
          <div className="font-bold text-gray-900 text-sm">{student.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">{student.college || "كلية الحاسبات وتقنية المعلومات"}</div>
          <div className="flex items-center gap-1.5 mt-1.5 justify-end">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sectorTag.color}`}>
              {sectorTag.label}
            </span>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{student.major}</span>
          </div>
        </div>
        <div className={`w-10 h-10 ${colorClass} text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0`}>
          {student.name[0]}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-green-50 rounded-xl p-2 text-center">
          <div className="text-lg font-bold text-green-700">{verified.length}</div>
          <div className="text-xs text-gray-500">مهارة موثقة</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <div className="text-lg font-bold text-gray-700">{avgScore > 0 ? `${avgScore}%` : "—"}</div>
          <div className="text-xs text-gray-500">معدل الأداء</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-2 text-center">
          <div className="text-lg font-bold text-gray-700">{stamped.length}</div>
          <div className="text-xs text-gray-500">مشروع موثق</div>
        </div>
      </div>

      {/* Verified skills */}
      {verified.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 justify-end">
          {verified.slice(0, 4).map((s: any) => (
            <span key={s.id} className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" /> {s.skillNameEn || s.skillName}
            </span>
          ))}
          {verified.length > 4 && (
            <span className="text-xs text-gray-400">+{verified.length - 4}</span>
          )}
        </div>
      )}

      {/* Trust stamps */}
      {stamped.length > 0 && (
        <div className="border-t border-gray-50 pt-2 mt-2">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xs text-gray-400">مشاريع موثقة بالذكاء الاصطناعي</span>
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="flex flex-wrap gap-1 mt-1 justify-end">
            {stamped.slice(0, 2).map((p: any) => (
              <span key={p.id} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                {p.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {verified.length === 0 && stamped.length === 0 && (
        <div className="text-center py-2 text-gray-300 text-xs">لا توجد بيانات موثقة بعد</div>
      )}
    </div>
  );
}

function SkillsDemand({ skills }: { skills: any[] }) {
  if ((skills as any[]).length === 0) return null;

  const categories: Record<string, { label: string; items: any[]; demand: string; color: string }> = {
    programming: { label: "البرمجة", items: [], demand: "طلب عالٍ جداً", color: "bg-green-500" },
    design: { label: "التصميم", items: [], demand: "طلب عالٍ", color: "bg-violet-500" },
    data: { label: "البيانات", items: [], demand: "طلب متزايد", color: "bg-blue-500" },
    management: { label: "الإدارة", items: [], demand: "طلب ثابت", color: "bg-amber-500" },
    other: { label: "أخرى", items: [], demand: "طلب متنوع", color: "bg-gray-400" },
  };

  (skills as any[]).forEach((s: any) => {
    const cat = categories[s.category] ?? categories.other;
    if (cat) cat.items.push(s);
  });

  const filled = Object.entries(categories).filter(([, v]) => v.items.length > 0);
  if (filled.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-green-600" />
        <h2 className="font-bold text-gray-800">المهارات المتاحة حسب القطاع</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filled.map(([key, cat]) => (
          <div key={key} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cat.demand}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800 text-sm">{cat.label}</span>
                <div className={`w-3 h-3 rounded-full ${cat.color}`} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {cat.items.map((s: any) => (
                <span key={s.id} className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-100">
                  {s.nameEn || s.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
