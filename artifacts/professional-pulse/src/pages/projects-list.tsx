import { useListProjects, useCreateProject, getListProjectsQueryKey, useListStudents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Code, BrainCircuit, ExternalLink, Filter, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ProjectsList() {
  const { data: projects, isLoading } = useListProjects();
  const { data: students } = useListStudents();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProject = useCreateProject({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم إضافة المشروع", description: "تم رفع المشروع بنجاح وهو الآن بانتظار التحقق." });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setIsOpen(false);
      },
      onError: () => {
        toast({ title: "خطأ", description: "فشل في رفع المشروع.", variant: "destructive" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const techString = formData.get("technologies") as string;
    
    createProject.mutate({
      data: {
        studentId: parseInt(formData.get("studentId") as string),
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        technologies: techString.split(",").map(t => t.trim()).filter(Boolean),
        githubUrl: formData.get("githubUrl") as string || undefined,
        demoUrl: formData.get("demoUrl") as string || undefined,
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">مشاريع النادي</h1>
          <p className="text-muted-foreground mt-1">المشاريع المنجزة من قبل الطالبات والموثقة بواسطة الذكاء الاصطناعي.</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-muted bg-background">
            <Filter className="w-3 h-3 ml-2" />
            تصفية
          </Badge>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" /> إضافة مشروع
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>رفع مشروع جديد</DialogTitle>
                <DialogDescription>
                  أضف تفاصيل المشروع ليتم فحصه وتقييمه.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>الطالبة</Label>
                  <Select name="studentId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطالبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.studentId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>عنوان المشروع</Label>
                  <Input name="title" required />
                </div>
                <div className="space-y-2">
                  <Label>وصف المشروع</Label>
                  <Textarea name="description" rows={3} required />
                </div>
                <div className="space-y-2">
                  <Label>التقنيات المستخدمة (مفصولة بفاصلة)</Label>
                  <Input name="technologies" placeholder="React, Node.js, Python..." required dir="ltr" className="text-right" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رابط المستودع (GitHub)</Label>
                    <Input name="githubUrl" type="url" dir="ltr" className="text-right" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>رابط العرض (Demo)</Label>
                    <Input name="demoUrl" type="url" dir="ltr" className="text-right" placeholder="https://..." />
                  </div>
                </div>
                <DialogFooter className="pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createProject.isPending}>
                    {createProject.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    رفع المشروع
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover-elevate cursor-pointer transition-all duration-300 h-full flex flex-col group border-border hover:border-primary/50 relative overflow-hidden bg-card">
                {project.trustStamp && (
                  <div className="absolute -left-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>
                )}
                
                <CardHeader className="pb-2 relative z-10">
                  <div className="flex justify-between items-start gap-4">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors leading-tight">
                      {project.title}
                    </CardTitle>
                    {project.trustStamp && (
                      <div className="shrink-0 bg-secondary text-secondary-foreground p-1.5 rounded-md flex items-center justify-center shadow-sm" title="مُفحوص بالذكاء الاصطناعي">
                        <BrainCircuit className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-foreground/70 font-medium">
                    بواسطة: {project.studentName}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between pt-4 relative z-10">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                    {project.description}
                  </p>
                  
                  <div className="space-y-4 mt-auto">
                    <div className="flex flex-wrap gap-1.5">
                      {project.technologies.slice(0, 4).map((tech, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-muted rounded-md font-medium text-foreground/80 border border-border">
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 4 && (
                        <span className="text-xs px-2 py-1 bg-muted rounded-md font-medium text-foreground/80 border border-border">
                          +{project.technologies.length - 4}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-border border-dashed">
                      <Badge variant="secondary" className={
                        project.status === 'verified' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        project.status === 'analyzing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        project.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }>
                        {project.status === 'verified' ? 'موثق' :
                         project.status === 'analyzing' ? 'جاري التحليل' :
                         project.status === 'rejected' ? 'مرفوض' : 'قيد الانتظار'}
                      </Badge>
                      
                      <div className="flex items-center text-xs text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                        التفاصيل
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-xl border border-border shadow-sm">
          <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-foreground mb-2">لا توجد مشاريع</h3>
          <p className="text-muted-foreground">لم يتم إضافة أي مشاريع للنادي حتى الآن.</p>
        </div>
      )}
    </div>
  );
}