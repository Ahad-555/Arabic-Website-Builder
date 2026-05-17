import { useGetStudent, useGetSkillGap } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip as RechartsTooltip } from "recharts";

export default function StudentSkills() {
  const { id } = useParams();
  const studentId = parseInt(id || "0");

  const { data: student, isLoading: studentLoading } = useGetStudent(studentId, {
    query: { enabled: !!studentId }
  });

  const { data: gapAnalysis, isLoading: gapLoading } = useGetSkillGap(studentId, {
    query: { enabled: !!studentId }
  });

  if (studentLoading || gapLoading) {
    return <div className="space-y-6"><Skeleton className="h-[200px] w-full" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!student || !gapAnalysis) {
    return <div>البيانات غير متوفرة.</div>;
  }

  // Prepare data for radar chart
  const radarData = gapAnalysis.gaps.map(gap => ({
    subject: gap.skillName,
    A: gap.currentLevel * 20, // Scale 1-5 to 20-100
    B: gap.requiredLevel * 20,
    fullMark: 100,
  }));

  const criticalGaps = gapAnalysis.gaps.filter(g => g.priority === 'critical' || g.priority === 'high');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/students/${student.id}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">محاكي المهارات والفجوات</h1>
            <p className="text-muted-foreground text-sm">تحليل الفجوة المهارية للطالبة: {student.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Card */}
        <Card className="lg:col-span-1 border-none shadow-md bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              نظرة عامة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 bg-muted/50 rounded-xl border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">مستوى الجاهزية العام</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-5xl font-black text-primary">{gapAnalysis.overallReadiness}</span>
                <span className="text-xl font-bold text-muted-foreground">%</span>
              </div>
              <Progress value={gapAnalysis.overallReadiness} className="h-2 mt-4" />
            </div>

            {gapAnalysis.strengths.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  نقاط القوة
                </h3>
                <div className="flex flex-wrap gap-2">
                  {gapAnalysis.strengths.map((strength, i) => (
                    <Badge key={i} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {criticalGaps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  فجوات حرجة
                </h3>
                <div className="space-y-2">
                  {criticalGaps.map((gap, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-destructive/5 rounded-md border border-destructive/10">
                      <span className="font-medium">{gap.skillName}</span>
                      <span className="text-destructive font-bold">الفجوة: {gap.gap} مستويات</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="lg:col-span-2 border-none shadow-md bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              مقارنة المهارات (الحالي مقابل المطلوب)
            </CardTitle>
            <CardDescription>تحليل بصري لمستوى المهارات الحالي مقارنة بمتطلبات سوق العمل</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <div className="h-[400px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} 
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="المستوى الحالي"
                      dataKey="A"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="المستوى المطلوب"
                      dataKey="B"
                      stroke="hsl(var(--secondary))"
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                    <Legend wrapperStyle={{ fontFamily: 'Tajawal' }} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        fontFamily: 'Tajawal',
                        direction: 'rtl'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">لا توجد مهارات كافية لرسم المخطط.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Gaps List */}
        <Card className="lg:col-span-3 border-none shadow-md bg-card">
          <CardHeader>
            <CardTitle>التوصيات التطويرية</CardTitle>
            <CardDescription>قائمة تفصيلية بالمهارات التي تحتاج إلى تطوير مع خطة مقترحة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gapAnalysis.gaps.sort((a, b) => b.gap - a.gap).map((gap, i) => (
                <div key={i} className="p-4 border border-border rounded-xl bg-background flex flex-col md:flex-row gap-6 hover:border-primary/30 transition-colors">
                  <div className="md:w-1/3 space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-foreground">{gap.skillName}</h3>
                      <Badge variant={
                        gap.priority === 'critical' ? 'destructive' : 
                        gap.priority === 'high' ? 'default' : 'secondary'
                      }>
                        {gap.priority === 'critical' ? 'أولوية قصوى' : 
                         gap.priority === 'high' ? 'أولوية عالية' : 
                         gap.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>المستوى الحالي ({gap.currentLevel}/5)</span>
                        <span>المطلوب ({gap.requiredLevel}/5)</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex relative">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(gap.currentLevel / 5) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-secondary opacity-50 border-r-2 border-background" 
                          style={{ width: `${((gap.requiredLevel - gap.currentLevel) / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-2/3 flex items-center bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-sm text-foreground/80">
                      <span className="font-bold text-primary ml-2">التوصية:</span>
                      {gap.recommendation || "الاستمرار في التدريب العملي والمشاركة في مشاريع تطبيقية."}
                    </p>
                  </div>
                </div>
              ))}
              
              {gapAnalysis.gaps.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">لم يتم العثور على فجوات مهارية. الطالبة مستعدة تماماً!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}