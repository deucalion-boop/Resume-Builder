"use client";
/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image has no HTML alt API */

import { Document, Image, Page, pdf, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ResumeDraft, ResumeSectionKey } from "@/types/resume";

const styles = StyleSheet.create({
  page: { padding: 42, color: "#24222c", fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.5 },
  header: { paddingBottom: 14, borderBottomWidth: 2, marginBottom: 18 },
  identity: { flexDirection: "row", alignItems: "center", gap: 12 },
  photo: { width: 46, height: 46, borderRadius: 23, objectFit: "cover" },
  name: { fontSize: 24, fontWeight: 700 },
  role: { marginTop: 5, fontSize: 9, fontWeight: 700, letterSpacing: 1.2 },
  contact: { marginTop: 7, fontSize: 7, color: "#666" },
  section: { marginBottom: 14 },
  heading: { fontSize: 8, fontWeight: 700, letterSpacing: 1.2, marginBottom: 7 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 9, fontWeight: 700 },
  muted: { color: "#666", fontSize: 8 },
  body: { color: "#4b4b52", marginTop: 4 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  pill: { paddingVertical: 3, paddingHorizontal: 6, backgroundColor: "#f2effc", borderRadius: 3 },
});

function ResumeSectionPdf({ resume, section }: { resume: ResumeDraft; section: ResumeSectionKey }) {
  const heading = (text: string) => <Text style={[styles.heading, { color: resume.accentColor }]}>{text.toUpperCase()}</Text>;
  if (section === "summary" && resume.summary) return <View style={styles.section} wrap={false}>{heading("Profile")}<Text style={styles.body}>{resume.summary}</Text></View>;
  if (section === "experience" && resume.experience.length) return <View style={styles.section}>{heading("Experience")}{resume.experience.map(item => <View key={item.id} style={{ marginBottom: 10 }} wrap={false}><View style={styles.row}><Text style={styles.title}>{item.role}</Text><Text style={styles.muted}>{item.startDate} — {item.endDate}</Text></View><Text style={styles.muted}>{item.company} · {item.location}</Text><Text style={styles.body}>{item.description}</Text></View>)}</View>;
  if (section === "education" && resume.education.length) return <View style={styles.section}>{heading("Education")}{resume.education.map(item => <View key={item.id} style={{ marginBottom: 8 }} wrap={false}><View style={styles.row}><View><Text style={styles.title}>{item.degree}</Text><Text style={styles.muted}>{item.school} · {item.location}</Text></View><Text style={styles.muted}>{item.startDate} — {item.endDate}</Text></View>{item.description && <Text style={styles.body}>{item.description}</Text>}</View>)}</View>;
  if (section === "skills" && resume.skills.length) return <View style={styles.section} wrap={false}>{heading("Skills")}<View style={styles.pillRow}>{resume.skills.map(item => <Text key={item} style={styles.pill}>{item}</Text>)}</View></View>;
  if (section === "projects" && resume.projects.length) return <View style={styles.section}>{heading("Projects")}{resume.projects.map(item => <View key={item.id} style={{ marginBottom: 7 }} wrap={false}><View style={styles.row}><Text style={styles.title}>{item.name}</Text><Text style={[styles.muted, { color: resume.accentColor }]}>{item.url}</Text></View><Text style={styles.body}>{item.description}</Text></View>)}</View>;
  if (section === "certifications" && resume.certifications.length) return <View style={styles.section} wrap={false}>{heading("Certifications")}{resume.certifications.map(item => <View key={item.id} style={styles.row}><Text><Text style={styles.title}>{item.name}</Text> · {item.issuer}</Text><Text style={styles.muted}>{item.date}</Text></View>)}</View>;
  if (section === "languages" && resume.languages.length) return <View style={styles.section} wrap={false}>{heading("Languages")}<View style={styles.pillRow}>{resume.languages.map(item => <Text key={item.id} style={styles.pill}>{item.name} · {item.proficiency}</Text>)}</View></View>;
  if (section === "awards" && resume.awards.length) return <View style={styles.section} wrap={false}>{heading("Awards")}{resume.awards.map(item => <View key={item.id} style={styles.row}><Text><Text style={styles.title}>{item.title}</Text> · {item.issuer}</Text><Text style={styles.muted}>{item.date}</Text></View>)}</View>;
  if (section === "interests" && resume.interests.length) return <View style={styles.section} wrap={false}>{heading("Interests")}<Text style={styles.body}>{resume.interests.join(" · ")}</Text></View>;
  if (section === "references" && resume.references.length) return <View style={styles.section}>{heading("References")}{resume.references.map(item => <View key={item.id} style={{ marginBottom: 5 }} wrap={false}><Text style={styles.title}>{item.name}</Text><Text style={styles.muted}>{item.relationship} · {item.email}</Text></View>)}</View>;
  return null;
}

export function ResumeDocument({ resume }: { resume: ResumeDraft }) {
  const padding = resume.spacing === "compact" ? 34 : resume.spacing === "spacious" ? 50 : 42;
  return <Document title={resume.title} author={`${resume.personal.firstName} ${resume.personal.lastName}`}><Page size={resume.paperSize === "LETTER" ? "LETTER" : "A4"} style={[styles.page, { padding, fontFamily: resume.fontFamily === "Georgia" ? "Times-Roman" : "Helvetica", borderTopWidth: resume.template === "executive" ? 7 : 0, borderTopColor: resume.accentColor }]}>
    <View style={[styles.header, { borderBottomColor: resume.accentColor }]}><View style={styles.identity}>{resume.personal.photoUrl && <Image src={resume.personal.photoUrl} style={styles.photo} />}<View><Text style={styles.name}>{resume.personal.firstName} {resume.personal.lastName}</Text><Text style={[styles.role, { color: resume.accentColor }]}>{resume.personal.jobTitle.toUpperCase()}</Text></View></View><Text style={styles.contact}>{[resume.personal.location, resume.personal.email, resume.personal.phone, resume.personal.website, resume.personal.linkedin].filter(Boolean).join("  ·  ")}</Text></View>
    {resume.sections.filter(section => section.visible && section.id !== "personal").map(section => <ResumeSectionPdf key={section.id} resume={resume} section={section.id} />)}
  </Page></Document>;
}

export function PdfDownload({ resume, onDownload }: { resume: ResumeDraft; onDownload?: () => void }) {
  const [loading, setLoading] = useState(false);
  async function download() {
    setLoading(true);
    try {
      const blob = await pdf(<ResumeDocument resume={resume} />).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${resume.title.toLowerCase().replace(/\s+/g, "-")}.pdf`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (resume.id !== "demo-resume") await fetch(`/api/resumes/${resume.id}/download`, { method: "POST" });
      onDownload?.(); toast.success("PDF downloaded.");
    } catch { toast.error("The PDF could not be generated."); } finally { setLoading(false); }
  }
  return <button type="button" onClick={download} disabled={loading} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-60">{loading ? <><Loader2 className="size-3.5 animate-spin" />Preparing</> : <><Download className="size-3.5" />Download PDF</>}</button>;
}
