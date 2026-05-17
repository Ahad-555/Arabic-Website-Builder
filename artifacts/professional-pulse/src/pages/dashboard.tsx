import { useGetDashboardStats, useGetTopSkills, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, CheckCircle, TrendingUp, Award, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: topSkills, isLoading: skillsLoading } = useGetTopSkills();
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivity();

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">لوحة القيادة</h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على أداء ومستويات جاهزية الطالبات.</p>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="إجمالي الطالبات" 
            value={stats.totalStudents} 
            icon={Users} 
            trend="+12% هذا الشهر" 
          />
          <StatCard 
            title="متوسط الجاهزية" 
            value={`${stats.averageReadiness}%`} 
            icon={TrendingUp} 
            trend="تحسن بنسبة 5%" 
            highlight
          />
          <StatCard 
            title="مشاريع موثقة" 
            value={stats.verifiedProjects} 
            icon={CheckCircle} 
            trend="تم فحصها بالذكاء الاصطناعي" 
          />
          <StatCard 
            title="صكوك جدارة" 
            value={stats.certificatesIssued} 
            icon={Award} 
            trend="تم إصدارها بنجاح" 
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-md overflow-hidden bg-card relative">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              أحدث النشاطات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentActivity?.length ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent pr-4 border-r border-border">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="relative flex items-center justify-between gap-4 py-2">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary absolute -right-[21px]"></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">بواسطة: {activity.studentName}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {new Date(activity.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">لا يوجد نشاطات حديثة</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              المهارات الأكثر طلباً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skillsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : topSkills?.length ? (
              <div className="space-y-4">
                {topSkills.map((skill, index) => (
                  <div key={skill.name} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">{skill.name}</span>
                      <Badge variant={
                        skill.demandLevel === 'critical' ? 'destructive' : 
                        skill.demandLevel === 'high' ? 'default' : 'secondary'
                      }>
                        {skill.demandLevel === 'critical' ? 'حرج' : 
                         skill.demandLevel === 'high' ? 'عالي' : 
                         skill.demandLevel === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.min(100, skill.marketDemand * 10)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{skill.studentsCount} طالبة</span>
                      <span>طلب السوق</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">لا توجد بيانات للمهارات</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, highlight = false }: any) {
  return (
    <Card className={`border-none shadow-md overflow-hidden relative ${highlight ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
      {highlight && (
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      )}
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className={`text-sm font-medium ${highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${highlight ? 'bg-white/20' : 'bg-primary/10'}`}>
            <Icon className={`w-5 h-5 ${highlight ? 'text-white' : 'text-primary'}`} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-xs font-medium">
            <span className={highlight ? 'text-primary-foreground/90' : 'text-emerald-600'}>
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}