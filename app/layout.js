import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import Navbar from './components/Navbar';
import Link from 'next/link';
export const metadata={title:'Vajra — Small voices. Stronger places.',description:'Turn local infrastructure reports into corroborated demand and transparent budget scenarios. Built for communities across India.'};
export default function RootLayout({children}){return <html lang="en"><body><LanguageProvider><Navbar/><main id="main">{children}</main><footer className="footer"><div><Link className="brand" href="/">vajra.</Link><p>Better places start with being heard.</p></div><div><Link href="/planner">Explore the planning demo ↗</Link><p>Built with Google Gemini · Code for Communities 2026</p><small>Independent prototype. No government affiliation or live funding commitments.</small></div></footer></LanguageProvider></body></html>;}
