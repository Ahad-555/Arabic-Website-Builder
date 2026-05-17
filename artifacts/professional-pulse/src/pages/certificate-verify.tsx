import { useGetCertificateByCode } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, BrainCircuit, CheckCircle2, XCircle, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function CertificateVerify() {
  const { code: routeCode } = useParams();
  const [codeInput, setCodeInput] = useState(routeCode !== "sample" ? routeCode : "");
  const [searchCode, setSearchCode] = useState(routeCode !== "sample" ? routeCode : "");

  // In a real app this would use the code string, our mock API uses ID number
  const certId = parseInt(searchCode || "0");
  
  const { data: cert, isLoading, isError } = useGetCertificateByCode(searchCode || "", {
    query: { enabled: !!searchCode && searchCode !== "sample" }
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput) {
      setSearchCode(codeInput);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto py-12">
      <div className="text-center space-y-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">تحقق من صك الجدارة</h1>
        <p className="text-muted-foreground">نظام التحقق لأصحاب العمل لضمان موثوقية المهارات والمشاريع.</p>
      </div>

      <Card className="border-none shadow-md bg-card">
        <CardContent className="p-6">
          <form onSubmit={handleVerify} className="flex gap-2">
            <Input 
              placeholder="أدخل رمز التحقق (مثال: 123)" 
              value={codeInput || ""}
              onChange={(e) => setCodeInput(e.target.value)}
              className="text-center font-mono text-lg"
              dir="ltr"
            />
            <Button type="submit" className="gap-2">
              <Search className="w-4 h-4" /> تحقق
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchCode && searchCode !== "sample" && (
        <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
          {isLoading ? (
            <Card className="border-none shadow-md bg-card">
              <CardContent className="p-8 space-y-4 text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto" />
                <Skeleton className="h-4 w-1/3 mx-auto" />
              </CardContent>
            </Card>
          ) : isError || !cert ? (
            <Card className="border-destructive/20 bg-destructive/5 shadow-md">
              <CardContent className="p-8 text-center space-y-4">
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
                <h3 className="text-xl font-bold text-destructive">صك غير صالح</h3>
                <p className="text-muted-foreground">لم يتم العثور على صك جدارة بهذا الرمز في سجلات النبض المهني.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900 shadow-md overflow-hidden relative">
              <div className="absolute top-0 right-0 w-full h-2 bg-emerald-500"></div>
              <CardContent className="p-8 space-y-8">
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">صك موثق وصالح</h3>
                  <p className="text-sm text-muted-foreground font-mono" dir="ltr">ID: NBU-{cert.id.toString().padStart(6, '0')}</p>
                </div>

                <div className="bg-background rounded-xl p-6 border border-border shadow-sm">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">اسم الطالبة</p>
                      <p className="font-bold text-lg text-foreground">{cert.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">التخصص</p>
                      <p className="font-bold text-lg text-foreground">{cert.major}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">تاريخ الإصدار</p>
                      <p className="font-medium text-foreground">{new Date(cert.issuedAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">نقاط الجدارة</p>
                      <p className="font-bold text-primary text-xl">{cert.overallScore}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" /> مهارات معتمدة
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {cert.skills.map((s, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1.5 gap-1.5 bg-background border border-border">
                          {s.name}
                          {s.aiVerified && <BrainCircuit className="w-3 h-3 text-secondary" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" /> مشاريع موثقة
                    </h4>
                    <div className="space-y-2">
                      {cert.projects.map((p, i) => (
                        <div key={i} className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                          <span className="font-medium text-sm text-foreground">{p.title}</span>
                          {p.trustStamp && (
                            <Badge variant="outline" className="text-[10px] text-secondary border-secondary/30 bg-secondary/5">مُفحوص AI</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-center pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">تم التحقق بنجاح من قاعدة بيانات جامعة الحدود الشمالية.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}