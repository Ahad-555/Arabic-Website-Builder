import { useGetStudent, useGetInvestmentValue, useGetCareerPaths, useGetStudentProjects } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, TrendingUp, Target, Code, BrainCircuit, ExternalLink, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const readinessLabels: Record<string, string> = {
  beginner: "مبتدئة",
  developing: "في التطور",
  ready: "جاهزة",
  advanced: "متقدمة"
};

export default function StudentProfile() {
  const { id } = useParams();
  const studentId = parseInt(id || "0");

  const { data: student, isLoading: studentLoading } = useGetStudent(studentId, {
    query: { enabled: !!studentId }
  });
  
  const { data: investment, isLoading: investmentLoading } = useGetInvestmentValue(studentId, {
    query: { enabled: !!studentId }
  });

  const { data: paths, isLoading: pathsLoading } = useGetCareerPaths(studentId, {
    query: { enabled: !!studentId }
  });

  const { data: projects, isLoading: projectsLoading } = useGetStudentProjects(studentId, {
    query: { enabled: !!studentId }
  });

  if (studentLoading) {
    return <div className="space-y-6"><Skeleton className="h-[200px] w-full" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!student) {
    return <div>لم يتم العثور على الطالبة.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/students">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            عودة للقائمة
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Header */}
        <Card className="lg:col-span-3 bg-gradient-to-r from-card to-primary/5 border-none shadow-md overflow-hidden relative">
          <div className="absolute left-0 top-0 w-1/3 h-full bg-primary/5 blur-3xl rounded-full pointer-events-none"></div>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
              <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                <AvatarImage src={student.avatarUrl || undefined} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{student.name}</h1>
                    <p className="text-lg text-muted-foreground mt-1">
                      {student.major} • السنة {student.year} • {student.studentId}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/students/${student.id}/skills`}>
                      <Button className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                        <Target className="w-4 h-4" />
                        محاكي المهارات
                      </Button>
                    </Link>
                    <Link href={`/certificate/${student.id}`}>
                      <Button variant="outline" className="gap-2">
                        صك الجدارة
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Badge variant="secondary" className="px-3 py-1 text-sm bg-background/50 backdrop-blur-sm border-primary/20 text-primary">
                    {readinessLabels[student.readinessLevel || 'beginner']}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-sm bg-background/50 backdrop-blur-sm border-border">
                    {student.overallScore} نقطة جدارة
                  </Badge>
                </div>
              </div>
            </div>
            {student.bio && (
              <p className="mt-6 text-foreground/80 max-w-4xl text-lg leading-relaxed relative z-10">
                {student.bio}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Investment Value */}
        <Card className="border-none shadow-md bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              القيمة الاستثمارية
            </CardTitle>
            <CardDescription>تقدير قيمة الطالبة في سوق العمل</CardDescription>
          </CardHeader>
          <CardContent>
            {investmentLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : investment ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-sm font-medium text-muted-foreground mb-2">القيمة التقديرية (ساعة)</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-primary">{investment.hourlyRateEstimate}</span>
                    <span className="text-sm font-bold text-muted-foreground">ريال سعودي</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    نطاق: {investment.hourlyRateMin} - {investment.hourlyRateMax} ريال
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">مؤشر الندرة</span>
                      <span className="text-primary font-bold">{investment.rarityScore}/100</span>
                    </div>
                    <Progress value={investment.rarityScore} className="h-2 bg-muted" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">مؤشر الطلب</span>
                      <span className="text-primary font-bold">{investment.demandScore}/100</span>
                    </div>
                    <Progress value={investment.demandScore} className="h-2 bg-muted" />
                  </div>
                </div>

                {investment.marketInsight && (
                  <div className="bg-muted/50 p-4 rounded-lg text-sm text-foreground/80 leading-relaxed border border-border">
                    {investment.marketInsight}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">البيانات غير متوفرة</p>
            )}
          </CardContent>
        </Card>

        {/* Career Paths */}
        <Card className="lg:col-span-2 border-none shadow-md bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              المسارات المهنية المقترحة
            </CardTitle>
            <CardDescription>مسارات تتطابق مع مهارات الطالبة ومستوى جاهزيتها</CardDescription>
          </CardHeader>
          <CardContent>
            {pathsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : paths?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paths.map((path, index) => (
                  <div key={index} className="p-5 border border-border rounded-xl hover:border-primary/30 transition-colors bg-background/50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{path.sector}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>نسبة التطابق:</span>
                          <span className="font-bold text-primary">{path.matchScore}%</span>
                        </div>
                      </div>
                      <Badge variant={
                        path.demandLevel === 'critical' ? 'destructive' : 
                        path.demandLevel === 'high' ? 'default' : 'secondary'
                      }>
                        {path.demandLevel === 'critical' ? 'طلب حرج' : 
                         path.demandLevel === 'high' ? 'طلب عالي' : 
                         path.demandLevel === 'medium' ? 'طلب متوسط' : 'طلب منخفض'}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {path.roles.map((role, i) => (
                          <Badge key={i} variant="outline" className="bg-muted/30">{role}</Badge>
                        ))}
                      </div>
                      
                      {path.salaryRange && (
                        <p className="text-sm font-medium bg-primary/5 text-primary px-3 py-1.5 rounded-md inline-block">
                          نطاق الراتب: {path.salaryRange}
                        </p>
                      )}
                      
                      {path.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {path.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">لا توجد مسارات مهنية مقترحة بعد.</p>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="lg:col-span-3 border-none shadow-md bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              مشاريع النادي
            </CardTitle>
            <CardDescription>المشاريع المرفوعة والمدققة بالذكاء الاصطناعي</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : projects?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300 h-full flex flex-col bg-background/50 hover-elevate cursor-pointer group relative overflow-hidden">
                      {project.trustStamp && (
                        <div className="absolute -left-6 -top-6 w-24 h-24 bg-secondary/10 rounded-full blur-xl pointer-events-none"></div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{project.title}</h3>
                        {project.trustStamp && (
                          <div className="flex items-center gap-1 bg-secondary/20 text-secondary-foreground px-2 py-1 rounded text-xs font-bold border border-secondary/30">
                            <BrainCircuit className="w-3 h-3" />
                            مُفحوص AI
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 relative z-10">
                        {project.description}
                      </p>
                      
                      <div className="mt-auto space-y-4 relative z-10">
                        <div className="flex flex-wrap gap-1.5">
                          {project.technologies.slice(0, 3).map((tech, i) => (
                            <span key={i} className="text-[10px] px-2 py-1 bg-muted rounded font-medium text-foreground/70">
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 3 && (
                            <span className="text-[10px] px-2 py-1 bg-muted rounded font-medium text-foreground/70">
                              +{project.technologies.length - 3}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className={
                            project.status === 'verified' ? 'text-emerald-600 font-medium' :
                            project.status === 'analyzing' ? 'text-blue-600 font-medium' :
                            project.status === 'rejected' ? 'text-destructive font-medium' :
                            'text-muted-foreground'
                          }>
                            {project.status === 'verified' ? 'موثق' :
                             project.status === 'analyzing' ? 'جاري التحليل' :
                             project.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                          </span>
                          
                          <span className="text-primary font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            التفاصيل <ExternalLink className="w-3 h-3 ml-1" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
                <Code className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">لم يتم رفع أي مشاريع حتى الآن.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}