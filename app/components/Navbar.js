"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
export default function Navbar(){
 const path=usePathname();const {language,setLanguage}=useLanguage();
 return <header className="nav-shell"><a className="skip-link" href="#main">Skip to content</a><div className="nav-inner">
 <Link className="brand" href="/" aria-label="Vajra home"><span className="brand-mark">v<span>✦</span></span>vajra<span className="brand-dot">.</span></Link>
 <nav aria-label="Main navigation"><Link className={path==='/'?'active':''} href="/">For citizens</Link><Link className={path==='/planner'?'active':''} href="/planner">For planners</Link><Link className={path==='/status'?'active':''} href="/status">Track a report</Link></nav>
 <div className="nav-actions"><select aria-label="Interface language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">EN · English</option><option value="te">తెలుగు</option><option value="hi">हिन्दी</option></select><Link href="/#report-form" className="button small">Speak up <span>↗</span></Link></div>
 </div></header>;
}
