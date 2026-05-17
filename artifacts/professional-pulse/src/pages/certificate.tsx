import { useGetCertificate } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, BrainCircuit, CheckCircle2, ChevronRight, Download, Share2 } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';

const readinessLabels: Record<string, string> = {
  beginner: "مبتدئة",
  developing: "في التطور",
  ready: "جاهزة",
  advanced: "متقدمة"
};

export default function CertificatePage() {
  const { id } = useParams();
  const studentId = parseInt(id || "0");

  const { data: cert, isLoading } = useGetCertificate(studentId, {
    query: { enabled: !!studentId }
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-[600px] w-full max-w-4xl mx-auto" /></div>;
  }

  if (!cert) {
    return <div>لم يتم العثور على الصك.</div>;
  }

  const verifyUrl = `${window.location.origin}/certificate/verify/${cert.id}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto">
        <Link href={`/students/${studentId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ChevronRight className="w-4 h-4" />
            عودة للملف
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Download className="w-4 h-4" /> طباعة
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            navigator.clipboard.writeText(verifyUrl);
            alert("تم نسخ الرابط");
          }}>
            <Share2 className="w-4 h-4" /> مشاركة
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto" id="certificate-print">
        <Card className="border-4 border-double border-primary/20 bg-card shadow-2xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

          <CardContent className="p-12 relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-12 border-b-2 border-border pb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-4xl shadow-inner">
                  ن
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground">النبض المهني</h2>
                  <p className="text-muted-foreground text-sm">جامعة الحدود الشمالية</p>
                </div>
              </div>
              <div className="text-left" dir="ltr">
                <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Certificate of Competency</p>
                <p className="text-xs text-muted-foreground mt-1">ID: NBU-{cert.id.toString().padStart(6, '0')}</p>
                <p className="text-xs text-muted-foreground">Date: {new Date(cert.issuedAt).toLocaleDateString('en-US')}</p>
              </div>
            </div>

            {/* Title & Name */}
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-5xl font-black text-primary mb-2 tracking-tight">صك الجدارة المهنية</h1>
              <p className="text-xl text-muted-foreground">يشهد نظام النبض المهني بأن الطالبة</p>
              <h2 className="text-4xl font-bold text-foreground py-2 border-y border-border inline-block px-12">{cert.studentName}</h2>
              <p className="text-lg text-muted-foreground">
                تخصص: <span className="font-bold text-foreground">{cert.major}</span>
              </p>
            </div>

            {/* Stats Overview */}
            <div className="flex justify-center gap-12 mb-16">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">مستوى الجاهزية</p>
                <Badge variant="outline" className="text-xl py-1 px-4 border-2 border-primary/20 text-primary bg-primary/5">
                  {readinessLabels[cert.readinessLevel || 'beginner']}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">نقاط الجدارة</p>
                <div className="text-3xl font-black text-foreground">{cert.overallScore}</div>
              </div>
            </div>

            {/* Skills & Projects grid */}
            <div className="grid grid-cols-2 gap-12 mb-16">
              <div>
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border pb-2">
                  <Award className="w-5 h-5" />
                  المهارات المعتمدة
                </h3>
                <div className="space-y-4">
                  {cert.skills.map((skill, i) => (
                    <div key={i} className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-border">
                      <span className="font-bold text-foreground">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">مستوى {skill.level}/5</span>
                        {skill.aiVerified && (
                          <BrainCircuit className="w-4 h-4 text-secondary" title="موثق بالذكاء الاصطناعي" />
                        )}
                      </div>
                    </div>
                  ))}
                  {cert.skills.length === 0 && <p className="text-sm text-muted-foreground">لا توجد مهارات معتمدة بعد.</p>}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2 border-b border-border pb-2">
                  <CheckCircle2 className="w-5 h-5" />
                  المشاريع الموثقة
                </h3>
                <div className="space-y-4">
                  {cert.projects.map((proj, i) => (
                    <div key={i} className="bg-muted/20 p-3 rounded-lg border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-foreground">{proj.title}</span>
                        {proj.trustStamp && (
                          <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground text-[10px]">
                            مُفحوص AI
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{proj.technologies.join(" • ")}</p>
                    </div>
                  ))}
                  {cert.projects.length === 0 && <p className="text-sm text-muted-foreground">لا توجد مشاريع موثقة بعد.</p>}
                </div>
              </div>
            </div>

            {/* Footer / QR Code */}
            <div className="flex justify-between items-end border-t-2 border-border pt-8 mt-12">
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">الختم الرسمي</p>
                <p className="text-xs text-muted-foreground">مُصدر وموثق إلكترونياً من منصة النبض المهني</p>
                <p className="text-[10px] text-muted-foreground mt-2">لا يعتد بهذه الشهادة إلا بعد التحقق منها عبر مسح الرمز.</p>
              </div>
              
              <div className="flex flex-col items-center bg-white p-3 rounded-xl border border-border shadow-sm">
                <QRCodeSVG value={verifyUrl} size={100} level="H" includeMargin={false} />
                <span className="text-[10px] text-muted-foreground mt-2 font-mono">امسح للتحقق</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-print, #certificate-print * { visibility: visible; }
          #certificate-print { position: absolute; left: 0; top: 0; width: 100%; }
          .bg-primary { background-color: hsl(var(--primary)) !important; -webkit-print-color-adjust: exact; }
          .bg-secondary { background-color: hsl(var(--secondary)) !important; -webkit-print-color-adjust: exact; }
          /* other color-adjust rules for printing */
        }
      `}</style>
    </div>
  );
}