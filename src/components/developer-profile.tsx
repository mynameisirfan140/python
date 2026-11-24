import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { appPath } from "@/lib/app-path";
import { Instagram, Youtube, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const expertise = ["AI & Machine Learning", "AI Chatbot and Agent Development", "Website & Web Application Development", "Mobile App Development", "Game Development", "Software Engineering", "Digital Marketing, SEO & GEO", "Technology Consulting and Business Strategy"];
const achievements = ["Trained 10,000+ students online and offline", "Developed 500+ AI chatbots", "Google Certified", "World Record Holder", "OpenAI X Academy member", "NVIDIA Developer Program member", "Google Developers Program member"];

export function DeveloperProfile({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="developer-dialog">
      <div className="developer-top">
        <img src={appPath("images/irfan-founder.png")} alt="Irfan N, Founder & CEO of Tekzbyte" className="developer-portrait" />
        <div><span className="eyebrow">THE PERSON BEHIND THE PLAYGROUND</span><DialogTitle className="developer-name">Irfan N<span className="text-primary">.</span></DialogTitle><DialogDescription>Founder & CEO · Tekzbyte</DialogDescription><p className="developer-meta">Developer : Irfan N</p><p className="developer-meta">Technology used : React, TypeScript, CodeMirror, Pyodide (WebAssembly), Tailwind CSS & browser storage.</p></div>
      </div>
      <div className="developer-socials">
        <Button variant="outline" asChild><a href="https://www.instagram.com/mynameisirfan93/" target="_blank" rel="noopener noreferrer"><Instagram /><span>Instagram <small>@mynameisirfan93</small></span><ArrowUpRight /></a></Button>
        <Button variant="outline" asChild><a href="https://www.youtube.com/@mynameisirfan93" target="_blank" rel="noopener noreferrer"><Youtube /><span>YouTube <small>@mynameisirfan93</small></span><ArrowUpRight /></a></Button>
      </div>
      <article className="developer-bio">
        <h2>About Me – Irfan N</h2>
        <p>I'm Irfan N, an entrepreneur, software engineer, AI innovator, educator, and the Founder & CEO of Tekzbyte.</p>
        <p>I'm passionate about technology, innovation, programming, and building solutions that create real-world impact. My journey in programming education and freelancing started in 2020, and since then, I've explored and worked across multiple domains of technology.</p>
        <p>My areas of expertise include:</p><ul>{expertise.map((item) => <li key={item}>{item}</li>)}</ul>
        <p>Through Tekzbyte, I'm working towards building a technology ecosystem that brings multiple digital solutions together under one vision. My goal is not just to develop software, but to understand business challenges, identify opportunities, and build intelligent, scalable solutions.</p>
        <h2>My Achievements & Affiliations</h2><ul>{achievements.map((item) => <li key={item}>{item}</li>)}</ul>
        <p>Beyond software and AI, I'm also interested in mentalism, hypnosis, teaching, and exploring the possibilities of human learning and technology.</p>
        <h2>My Vision</h2><p>I believe technology should create possibilities, solve meaningful problems, and make businesses smarter. My long-term vision is to build innovative products, empower people through education, and grow Tekzbyte into a complete technology ecosystem.</p>
        <p className="vision-signoff">One vision. Many possibilities. One ecosystem.</p>
      </article>
    </DialogContent>
  </Dialog>;
}