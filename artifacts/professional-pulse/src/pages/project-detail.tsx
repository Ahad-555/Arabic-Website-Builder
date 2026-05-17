import { useState } from "react";
import { useGetProject, useVerifyProject, useGenerateProjectQuiz, useSubmitProjectQuiz, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BrainCircuit, ExternalLink, Code2, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'details' | 'verify' | 'quiz'>('details');
  const [codeSnippet, setCodeSnippet] = useState('');
  
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId }
  });

  const verifyProject = useVerifyProject({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم بدء التحليل", description: "جاري تحليل الكود والمشروع بواسطة الذكاء الاصطناعي." });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        setActiveTab('details');
      },
      onError: () => {
        toast({ title: "حدث خطأ", description: "فشل في إرسال طلب التحليل.", variant: "destructive" });
      }
    }
  });

  const generateQuiz = useGenerateProjectQuiz({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم إنشاء الاختبار", description: "تم إنشاء أسئلة مخصصة لمشروعك." });
      },
      onError: () => {
        toast({ title: "حدث خطأ", description: "فشل في إنشاء الاختبار.", variant: "destructive" });
      }
    }
  });

  const submitQuiz = useSubmitProjectQuiz({
    mutation: {
      onSuccess: (res) => {
        setQuizResult(res);
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        if (res.passed) {
          toast({ title: "نجاح!", description: "اجتزت الاختبار وحصلت على ختم التوثيق." });
        } else {
          toast({ title: "حاول مرة أخرى", description: "لم تجتز الاختبار، راجع إجاباتك.", variant: "destructive" });
        }
      }
    }
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-[200px] w-full" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!project) {
    return <div>لم يتم العثور على المشروع.</div>;
  }

  const handleVerify = () => {
    if (!codeSnippet) {
      toast({ title: "حقل مطلوب", description: "يرجى إدخال عينة من الكود للتحليل.", variant: "destructive" });
      return;
    }
    verifyProject.mutate({ 
      id: projectId, 
      data: { codeSnippet, projectDescription: project.description } 
    });
  };

  const handleStartQuiz = () => {
    generateQuiz.mutate({ id: projectId });
    setActiveTab('quiz');
  };

  const handleSubmitQuiz = () => {
    if (!generateQuiz.data) return;
    
    const answers = Object.entries(quizAnswers).map(([questionId, answer]) => ({
      questionId: parseInt(questionId),
      answer
    }));

    if (answers.length < generateQuiz.data.questions.length) {
      toast({ title: "إجابات غير مكتملة", description: "يرجى الإجابة على جميع الأسئلة.", variant: "destructive" });
      return;
    }

    submitQuiz.mutate({ id: projectId, data: { answers } });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">تفاصيل المشروع</h1>
            <p className="text-muted-foreground text-sm">مراجعة والتحقق من المشروع</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md bg-card relative overflow-hidden">
            {project.trustStamp && (
              <div className="absolute left-0 top-0 w-1/2 h-full bg-secondary/10 blur-3xl pointer-events-none"></div>
            )}
            <CardHeader className="pb-4 border-b border-border">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <CardDescription className="text-base text-foreground/70">
                    بواسطة: <Link href={`/students/${project.studentId}`} className="text-primary hover:underline">{project.studentName}</Link>
                  </CardDescription>
                </div>
                {project.trustStamp && (
                  <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg flex flex-col items-center justify-center shadow-sm border border-secondary/20 rotate-3">
                    <BrainCircuit className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold whitespace-nowrap">مُفحوص AI</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="font-bold text-sm text-foreground mb-2">وصف المشروع</h3>
                <p className="text-muted-foreground leading-relaxed">{project.description}</p>
              </div>

              <div>
                <h3 className="font-bold text-sm text-foreground mb-2">التقنيات المستخدمة</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, i) => (
                    <Badge key={i} variant="outline" className="bg-muted/50">{tech}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Code2 className="w-4 h-4" /> مستودع الكود
                    </Button>
                  </a>
                )}
                {project.demoUrl && (
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" /> عرض حي
                    </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Tabs Content */}
          {activeTab === 'details' && (
            <Card className="border-none shadow-md bg-card">
              <CardHeader>
                <CardTitle className="text-lg">حالة التحقق بالذكاء الاصطناعي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    {project.status === 'verified' ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                     project.status === 'rejected' ? <XCircle className="w-6 h-6 text-destructive" /> :
                     project.status === 'analyzing' ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> :
                     <AlertCircle className="w-6 h-6 text-muted-foreground" />}
                    <div>
                      <p className="font-medium text-foreground">
                        {project.status === 'verified' ? 'تم التوثيق بنجاح' :
                         project.status === 'analyzing' ? 'جاري تحليل المشروع' :
                         project.status === 'rejected' ? 'فشل التوثيق' : 'بانتظار التحقق'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project.status === 'verified' ? 'المشروع أصلي ومطابق للمهارات' :
                         project.status === 'analyzing' ? 'نظام الذكاء الاصطناعي يراجع الكود والوصف' :
                         project.status === 'rejected' ? 'تم اكتشاف مشاكل في الأصالة أو الكود' : 'ابدأ عملية التحقق لتوثيق المشروع'}
                      </p>
                    </div>
                  </div>
                  
                  {project.status === 'pending' && (
                    <Button onClick={() => setActiveTab('verify')}>بدء التحقق</Button>
                  )}
                  {project.status === 'verified' && !project.trustStamp && (
                    <Button onClick={handleStartQuiz} variant="secondary">اختبار الموثوقية</Button>
                  )}
                </div>

                {project.integrityNotes && (
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-2">
                    <h4 className="font-medium text-sm">ملاحظات النظام:</h4>
                    <p className="text-sm text-muted-foreground">{project.integrityNotes}</p>
                  </div>
                )}
                
                {project.aiScore !== undefined && project.aiScore !== null && (
                  <div className="space-y-2 p-4 rounded-xl border border-border bg-muted/10">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">درجة الأصالة (AI)</span>
                      <span className="font-bold text-primary">{project.aiScore}%</span>
                    </div>
                    <Progress value={project.aiScore} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'verify' && (
            <Card className="border-primary/20 shadow-md bg-card border-2">
              <CardHeader>
                <CardTitle className="text-lg">فحص سلامة المشروع (AI)</CardTitle>
                <CardDescription>قم بإدخال عينة من الكود الأساسي للمشروع ليقوم النظام بتحليله ومقارنته.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>عينة من الكود (Code Snippet)</Label>
                  <Textarea 
                    placeholder="انسخ والصق جزءاً معقداً من الكود هنا (مثال: منطق قواعد البيانات، خوارزميات...)"
                    className="min-h-[200px] font-mono text-left"
                    dir="ltr"
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border pt-4">
                <Button variant="ghost" onClick={() => setActiveTab('details')}>إلغاء</Button>
                <Button 
                  onClick={handleVerify} 
                  disabled={verifyProject.isPending || !codeSnippet}
                  className="gap-2"
                >
                  {verifyProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                  تحليل الكود
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'quiz' && (
            <Card className="border-secondary/30 shadow-md bg-card border-2">
              <CardHeader>
                <CardTitle className="text-lg">اختبار موثوقية المشروع</CardTitle>
                <CardDescription>
                  أسئلة تم توليدها بالذكاء الاصطناعي بناءً على كود ووصف مشروعك. أجب لإثبات فهمك للمشروع والحصول على الختم.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-4">
                {generateQuiz.isPending ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-muted-foreground">جاري توليد الأسئلة المخصصة لمشروعك...</p>
                  </div>
                ) : quizResult ? (
                  <div className={`p-6 rounded-xl border ${quizResult.passed ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-destructive/10 border-destructive/20'} text-center space-y-4`}>
                    {quizResult.passed ? (
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-12 h-12 text-destructive mx-auto" />
                    )}
                    <h3 className="font-bold text-xl">{quizResult.passed ? 'مبروك! اجتزت الاختبار' : 'لم تجتز الاختبار'}</h3>
                    <p className="text-muted-foreground">{quizResult.feedback}</p>
                    <div className="text-lg font-bold">النتيجة: {quizResult.score}%</div>
                    {quizResult.passed && quizResult.trustStampGranted && (
                      <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-bold mt-4 shadow-md">
                        <BrainCircuit className="w-5 h-5" />
                        تم منح ختم التوثيق
                      </div>
                    )}
                    <div className="pt-4">
                      <Button onClick={() => setActiveTab('details')}>عودة للتفاصيل</Button>
                    </div>
                  </div>
                ) : generateQuiz.data ? (
                  <div className="space-y-8">
                    {generateQuiz.data.questions.map((q, index) => (
                      <div key={q.id} className="space-y-4 bg-muted/20 p-5 rounded-xl border border-border">
                        <h4 className="font-medium text-foreground">
                          <span className="text-primary mr-2">{index + 1}.</span>
                          {q.question}
                        </h4>
                        <RadioGroup 
                          value={quizAnswers[q.id] || ""} 
                          onValueChange={(val) => setQuizAnswers(prev => ({ ...prev, [q.id]: val }))}
                        >
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex items-center space-x-2 space-x-reverse mb-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                              <RadioGroupItem value={opt} id={`q${q.id}-opt${i}`} />
                              <Label htmlFor={`q${q.id}-opt${i}`} className="cursor-pointer flex-1 leading-relaxed text-sm">{opt}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">اضغط لتوليد الاختبار بناءً على كود مشروعك.</p>
                    <Button onClick={handleStartQuiz} disabled={generateQuiz.isPending}>توليد الأسئلة</Button>
                  </div>
                )}
              </CardContent>
              {!quizResult && generateQuiz.data && (
                <CardFooter className="flex justify-between border-t border-border pt-4">
                  <Button variant="ghost" onClick={() => setActiveTab('details')}>إلغاء</Button>
                  <Button onClick={handleSubmitQuiz} disabled={submitQuiz.isPending} className="px-8">
                    {submitQuiz.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    تسليم الإجابات
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-card">
            <CardHeader>
              <CardTitle className="text-lg">معلومات الإضافة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">تاريخ الرفع</span>
                <span className="font-medium text-foreground">
                  {new Date(project.createdAt).toLocaleDateString('ar-SA')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">حالة الفحص</span>
                <span className="font-medium text-foreground">
                  {project.status === 'verified' ? 'مكتمل' : 'قيد الانتظار'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الختم الرقمي</span>
                <span className="font-medium text-foreground">
                  {project.trustStamp ? 'ممنوح' : 'غير متوفر'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}