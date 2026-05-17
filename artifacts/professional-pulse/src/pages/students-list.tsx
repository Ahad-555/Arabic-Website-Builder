import { useListStudents, useCreateStudent, getListStudentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, ChevronLeft, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const readinessLabels: Record<string, string> = {
  beginner: "مبتدئة",
  developing: "في التطور",
  ready: "جاهزة",
  advanced: "متقدمة"
};

const readinessColors: Record<string, string> = {
  beginner: "bg-muted text-muted-foreground",
  developing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ready: "bg-primary/20 text-primary",
  advanced: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
};

export default function StudentsList() {
  const { data: students, isLoading } = useListStudents();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStudent = useCreateStudent({
    mutation: {
      onSuccess: () => {
        toast({ title: "تم الإضافة", description: "تم تسجيل الطالبة بنجاح." });
        queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });
        setIsOpen(false);
      },
      onError: () => {
        toast({ title: "خطأ", description: "فشل في تسجيل الطالبة.", variant: "destructive" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createStudent.mutate({
      data: {
        name: formData.get("name") as string,
        studentId: formData.get("studentId") as string,
        major: formData.get("major") as string,
        year: parseInt(formData.get("year") as string),
        bio: formData.get("bio") as string,
      }
    });
  };

  const filteredStudents = students?.filter(s => 
    s.name.includes(search) || 
    s.studentId.includes(search) || 
    s.major.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">الطالبات</h1>
          <p className="text-muted-foreground mt-1">تصفح ملفات الطالبات ومستويات جاهزيتهن لسوق العمل.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث بالاسم، الرقم الجامعي، التخصص..." 
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" /> طالبة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>تسجيل طالبة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل بيانات الطالبة لإضافتها للنظام.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>الاسم الرباعي</Label>
                  <Input name="name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الرقم الجامعي</Label>
                    <Input name="studentId" required />
                  </div>
                  <div className="space-y-2">
                    <Label>سنة الدراسة</Label>
                    <Input name="year" type="number" min="1" max="5" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>التخصص</Label>
                  <Input name="major" required />
                </div>
                <div className="space-y-2">
                  <Label>نبذة تعريفية</Label>
                  <Textarea name="bio" rows={3} />
                </div>
                <DialogFooter className="pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createStudent.isPending}>
                    {createStudent.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    حفظ
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
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStudents?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`}>
              <Card className="hover-elevate cursor-pointer transition-all duration-300 h-full flex flex-col group border-border hover:border-primary/50">
                <CardHeader className="flex flex-row items-start gap-4 pb-2">
                  <Avatar className="w-14 h-14 border-2 border-primary/10">
                    <AvatarImage src={student.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {student.name}
                    </CardTitle>
                    <CardDescription className="flex flex-col gap-1">
                      <span>{student.studentId}</span>
                      <span className="text-foreground/80">{student.major} • السنة {student.year}</span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {student.bio || "لا توجد نبذة تعريفية."}
                  </p>
                  
                  <div className="space-y-4 mt-auto">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-muted-foreground">نقاط الجدارة</span>
                      <span className="font-bold text-primary">{student.overallScore}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className={readinessColors[student.readinessLevel || 'beginner']}>
                        {readinessLabels[student.readinessLevel || 'beginner']}
                      </Badge>
                      
                      <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                        عرض الملف
                        <ChevronLeft className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">لم يتم العثور على طالبات مطابقة للبحث.</p>
        </div>
      )}
    </div>
  );
}