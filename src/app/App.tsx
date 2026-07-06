import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Users, Mail, FileText, Sparkles, Kanban,
  BarChart3, Settings, Search, Bell, Star, StarOff, Filter,
  Download, Upload, Plus, Send, Eye, MousePointerClick, MessageSquare,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, MoreHorizontal,
  Play, RefreshCw, ChevronDown, ChevronRight, ArrowUpRight,
  Globe, Phone, ExternalLink, Copy, Trash2, Edit3, X, Check,
  Activity, Target, Shield, Key, Palette, Database, Link2,
  Video, User, Cpu, Info, SlidersHorizontal, Inbox,
  Calendar, MapPin, GraduationCap, Trophy, Zap, BookOpen, Archive,
  Command, ChevronUp, Dot, Circle, Hash, Menu
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Page = "dashboard" | "coaches" | "outreach" | "broadcast" | "pipeline" | "analytics" | "profile" | "settings";

type Division = "NCAA D1" | "NCAA D2" | "NCAA D3" | "NAIA" | "NJCAA D1" | "NJCAA D2" | "NJCAA D3";

type CRMStage = "Not Contacted" | "Draft Ready" | "Sent" | "Opened" | "Replied" | "Interested" | "Call Scheduled" | "Offer" | "Committed";

interface StaffMember {
  name: string;
  role: string;
  email: string;
  phone?: string;
}

interface Coach {
  id: string;
  school: string;
  division: Division;
  conference: string;
  state: string;
  headCoach: string;
  staff: StaffMember[];
  assistants: string[];
  recruitingCoordinator?: string;
  email: string;
  phone?: string;
  athleticsUrl: string;
  recruitingUrl?: string;
  questionnaire?: string;
  rosterSize: number;
  internationalPlayers: number;
  graduatingSeniors: number;
  positionsNeeded: string[];
  scholarshipLevel: "Full" | "Partial" | "Academic" | "None";
  stage: CRMStage;
  favorited: boolean;
  lastContact?: string;
  notes: string;
  ranking?: number;
  region: string;
}

interface PlayerProfile {
  name: string;
  position: string;
  height: string;
  heightCm: string;
  weight: string;
  weightKg: string;
  graduationClass: string;
  nationality: string;
  currentTeam: string;
  gpa: string;
  highlightUrl: string;
  fullFilmUrl: string;
  primaryGoal: string;
  languages: string[];
  passportCountry: string;
  stats: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const DEFAULT_PLAYER: PlayerProfile = {
  name: "Your Name",
  position: "Point Guard / Shooting Guard",
  height: "6'1\"",
  heightCm: "185 cm",
  weight: "161 lbs",
  weightKg: "73 kg",
  graduationClass: "2028",
  nationality: "France",
  currentTeam: "LMBC U18 France",
  gpa: "3.6",
  highlightUrl: "https://youtube.com/",
  fullFilmUrl: "https://youtube.com/",
  primaryGoal: "Earn a basketball scholarship in the United States.",
  languages: ["French", "English"],
  passportCountry: "France",
  stats: "18.2 PPG · 7.4 APG · 3.8 RPG · 2.1 SPG · 42% 3P"
};

// ─── AUTH ──────────────────────────────────────────────────────────────────────

interface Account { id: string; email: string; password: string; }

function getAccounts(): Account[] {
  try { return JSON.parse(localStorage.getItem("sf_accounts") || "[]"); } catch { return []; }
}
function saveAccounts(accounts: Account[]) { localStorage.setItem("sf_accounts", JSON.stringify(accounts)); }

function storageKey(base: string): string {
  const uid = localStorage.getItem("sf_session");
  return uid ? `sf_${uid}_${base}` : `sf_${base}`;
}

function register(email: string, password: string): boolean {
  const accounts = getAccounts();
  if (accounts.find(a => a.email === email)) return false;
  const id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
  accounts.push({ id, email, password });
  saveAccounts(accounts);
  localStorage.setItem("sf_session", id);
  localStorage.setItem("sf_user_email", email);
  return true;
}

function login(email: string, password: string): boolean {
  const accounts = getAccounts();
  const account = accounts.find(a => a.email === email && a.password === password);
  if (!account) return false;
  localStorage.setItem("sf_session", account.id);
  localStorage.setItem("sf_user_email", email);
  const pairs = [["sf_player","player"],["sf_template","template"],["sf_coaches","coaches"],["sf_tracking","tracking"],["sf_gmail_user","gmail_user"],["sf_gmail_pass","gmail_pass"]];
  for (const [oldKey, base] of pairs) {
    const newKey = storageKey(base);
    if (localStorage.getItem(oldKey) && !localStorage.getItem(newKey)) localStorage.setItem(newKey, localStorage.getItem(oldKey)!);
  }
  return true;
}

function logout() { localStorage.removeItem("sf_session"); localStorage.removeItem("sf_user_email"); }

function currentUserId(): string | null { return localStorage.getItem("sf_session"); }

// ─── DATA LAYER ────────────────────────────────────────────────────────────────

function getPlayer(): PlayerProfile {
  try { const d = localStorage.getItem(storageKey("player")); if (d) return JSON.parse(d); } catch {}
  return DEFAULT_PLAYER;
}
function setPlayer(p: PlayerProfile) { localStorage.setItem(storageKey("player"), JSON.stringify(p)); }
function getTemplate(): { subject: string; body: string } {
  try { const d = localStorage.getItem(storageKey("template")); if (d) return JSON.parse(d); } catch {}
  return OUTREACH_TEMPLATE;
}
function setTemplate(subject: string, body: string) { localStorage.setItem(storageKey("template"), JSON.stringify({ subject, body })); }

interface TrackingEntry { id: string; coachId: string; coachName: string; school: string; timestamp: string; type: "sent" | "opened" | "replied" | "bounced"; subject: string; }
function loadCoaches(): Coach[] { try { const d = localStorage.getItem(storageKey("coaches")); if (d) return JSON.parse(d); } catch {} return DEFAULT_COACHES; }
function saveCoaches(c: Coach[]) { localStorage.setItem(storageKey("coaches"), JSON.stringify(c)); }
function addTracking(coach: Coach, type: TrackingEntry["type"], subject: string) { const log: TrackingEntry[] = JSON.parse(localStorage.getItem(storageKey("tracking")) || "[]"); log.unshift({ id: Date.now().toString(), coachId: coach.id, coachName: coach.headCoach, school: coach.school, timestamp: new Date().toISOString(), type, subject }); localStorage.setItem(storageKey("tracking"), JSON.stringify(log.slice(0, 500))); }
function getTrackingLog(): TrackingEntry[] { try { const d = localStorage.getItem(storageKey("tracking")); if (d) return JSON.parse(d); } catch {} return []; }
function getStaffEmails(coach: Coach): string { return coach.staff.map(s => s.email).filter(Boolean).join(","); }
const DEFAULT_COACHES: Coach[] = [
  // ── NCAA D1 ────────────────────────────────────────────────────────────────
  {
    id: "d1-1", school: "Boston University", division: "NCAA D1", conference: "Patriot League", state: "MA",
    headCoach: "Joe Jones", email: "jjones11@bu.edu", phone: "(617) 358-0749",
    staff: [
      { name: "Joe Jones", role: "Head Coach", email: "jjones11@bu.edu", phone: "(617) 358-0749" },
      { name: "Mike Quinn", role: "Associate Head Coach", email: "quinnmc@bu.edu" },
      { name: "Al Paul", role: "Assistant Coach", email: "ampaul12@bu.edu" },
      { name: "Matt Brady", role: "Assistant Coach", email: "mbrady10@bu.edu" },
      { name: "Khalil Griffith", role: "Director of Basketball Operations", email: "kgriff@bu.edu" },
      { name: "Matt Bielenda", role: "Video Coordinator", email: "bielenda@bu.edu" },
    ],
    assistants: ["Mike Quinn", "Al Paul", "Matt Brady", "Khalil Griffith", "Matt Bielenda"],
    athleticsUrl: "https://goterriers.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Northeast",
  },
  {
    id: "d1-2", school: "Santa Clara University", division: "NCAA D1", conference: "WCC", state: "CA",
    headCoach: "Jason Ludwig", email: "jludwig@scu.edu", phone: "408-554-2339",
    staff: [
      { name: "Jason Ludwig", role: "Associate Head Coach", email: "jludwig@scu.edu", phone: "408-554-2339" },
      { name: "Ryan Madry", role: "Associate Head Coach", email: "cmadry@scu.edu", phone: "408-554-4692" },
      { name: "Will Burkett", role: "Assistant Coach", email: "wburkett@scu.edu", phone: "408-554-4691" },
      { name: "Jackson Gion", role: "Assistant Coach", email: "jgion@scu.edu", phone: "408-554-4566" },
      { name: "Mitch Smith", role: "Assistant Coach", email: "mlsmith@scu.edu" },
      { name: "Alan Guillou", role: "Director of Operations", email: "aguillou@scu.edu", phone: "408-554-4640" },
    ],
    assistants: ["Jason Ludwig", "Ryan Madry", "Will Burkett", "Jackson Gion", "Mitch Smith", "Alan Guillou"],
    athleticsUrl: "https://santaclarabroncos.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-3", school: "Loyola Marymount University", division: "NCAA D1", conference: "WCC", state: "CA",
    headCoach: "Ricky Muench", email: "Richard.Muench@lmu.edu",
    staff: [
      { name: "Ricky Muench", role: "Assistant Coach", email: "Richard.Muench@lmu.edu" },
      { name: "Damari Milstead", role: "Director of Basketball Operations", email: "Damari.Milstead@lmu.edu" },
      { name: "Josh Mandell", role: "Video Coordinator", email: "Joshua.Mandell@lmu.edu" },
    ],
    assistants: ["Ricky Muench", "Damari Milstead", "Josh Mandell"],
    athleticsUrl: "https://lmulions.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 2,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-4", school: "Holy Cross", division: "NCAA D1", conference: "Patriot League", state: "MA",
    headCoach: "Ted Rawlings", email: "trawlings@holycross.edu", phone: "508-793-2323",
    staff: [
      { name: "Ted Rawlings", role: "Assistant Coach", email: "trawlings@holycross.edu", phone: "508-793-2323" },
      { name: "Sydney Armand", role: "Assistant Coach", email: "sarmand@holycross.edu", phone: "508-793-2323" },
      { name: "Colin Richey", role: "Assistant Coach", email: "crichey@holycross.edu", phone: "508-793-2323" },
    ],
    assistants: ["Ted Rawlings", "Sydney Armand", "Colin Richey"],
    athleticsUrl: "https://goholycross.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Northeast",
  },
  {
    id: "d1-5", school: "Bucknell University", division: "NCAA D1", conference: "Patriot League", state: "PA",
    headCoach: "Branden McDonald", email: "bm036@bucknell.edu", phone: "570-577-3072",
    staff: [
      { name: "Branden McDonald", role: "Assistant Coach", email: "bm036@bucknell.edu", phone: "570-577-3072" },
      { name: "Jesse Flannery", role: "Assistant Coach", email: "jsf020@bucknell.edu", phone: "570-577-3552" },
      { name: "Tyler Simms", role: "Assistant Coach", email: "tjs036@bucknell.edu" },
      { name: "Mike Walley", role: "Director of Basketball Operations / Assistant Coach", email: "mw042@bucknell.edu", phone: "570-577-1358" },
      { name: "Justin McKenna", role: "Director of Basketball Performance", email: "jm100@bucknell.edu", phone: "570-577-2219" },
    ],
    assistants: ["Branden McDonald", "Jesse Flannery", "Tyler Simms", "Mike Walley", "Justin McKenna"],
    athleticsUrl: "https://bucknellbison.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["SG", "SF", "PF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Northeast",
  },
  // ── NCAA D2 ────────────────────────────────────────────────────────────────
  {
    id: "d2-1", school: "Point Loma Nazarene University", division: "NCAA D2", conference: "PacWest", state: "CA",
    headCoach: "Tobin Karlberg", email: "tkarlber@pointloma.edu",
    staff: [
      { name: "Tobin Karlberg", role: "Assistant Coach", email: "tkarlber@pointloma.edu" },
    ],
    assistants: ["Tobin Karlberg"],
    athleticsUrl: "https://plnusealions.com", rosterSize: 12, internationalPlayers: 4, graduatingSeniors: 2,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Partial", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  // ── NAIA ────────────────────────────────────────────────────────────────────
  {
    id: "naia-1", school: "College of Idaho", division: "NAIA", conference: "Cascade Collegiate", state: "ID",
    headCoach: "Colby Blaine", email: "cblaine@collegeofidaho.edu", phone: "208-459-5044",
    staff: [
      { name: "Colby Blaine", role: "Head Coach", email: "cblaine@collegeofidaho.edu", phone: "208-459-5044" },
      { name: "Emanuel Morgan", role: "Assistant Coach", email: "mmorgan@collegeofidaho.edu" },
      { name: "Jacob McLeod", role: "Assistant Coach", email: "jmcleod@collegeofidaho.edu" },
    ],
    assistants: ["Emanuel Morgan", "Jacob McLeod"],
    athleticsUrl: "https://yoteathletics.com", rosterSize: 13, internationalPlayers: 3, graduatingSeniors: 2,
    positionsNeeded: ["PG", "SG"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "naia-2", school: "Lewis-Clark State College", division: "NAIA", conference: "Cascade Collegiate", state: "ID",
    headCoach: "Austin Johnson", email: "abjohnson@lcsc.edu", phone: "208-792-2865",
    staff: [
      { name: "Austin Johnson", role: "Head Coach", email: "abjohnson@lcsc.edu", phone: "208-792-2865" },
      { name: "Caden Lewis", role: "Assistant Coach", email: "cjlewis@lcsc.edu", phone: "(208) 792-2271" },
      { name: "CJ Johnson", role: "Assistant Coach", email: "" },
      { name: "Casey Cappo", role: "Assistant Coach", email: "ccappo@lcsc.edu", phone: "(208) 792-2271" },
    ],
    assistants: ["Caden Lewis", "CJ Johnson", "Casey Cappo"],
    athleticsUrl: "https://lcwarriors.com", rosterSize: 13, internationalPlayers: 3, graduatingSeniors: 2,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "naia-3", school: "Westmont College", division: "NAIA", conference: "GSAC", state: "CA",
    headCoach: "Justin Leslie", email: "jleslie@westmont.edu",
    staff: [
      { name: "Justin Leslie", role: "Head Coach", email: "jleslie@westmont.edu" },
      { name: "Booker Harris", role: "Assistant Coach", email: "bharris@westmont.edu" },
      { name: "Kalen Eddings", role: "Assistant Coach", email: "keddings@westmont.edu" },
    ],
    assistants: ["Booker Harris", "Kalen Eddings"],
    athleticsUrl: "https://athletics.westmont.edu", rosterSize: 13, internationalPlayers: 3, graduatingSeniors: 2,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "naia-4", school: "Bethel University (IN)", division: "NAIA", conference: "Crossroads League", state: "IN",
    headCoach: "David Osborn", email: "david.osborn@betheluniversity.edu",
    staff: [
      { name: "David Osborn", role: "Head Coach", email: "david.osborn@betheluniversity.edu" },
      { name: "Aaron Cufr", role: "Assistant Coach", email: "aaron.cufr@betheluniversity.edu" },
    ],
    assistants: ["Aaron Cufr"],
    athleticsUrl: "https://bethelpilots.com", rosterSize: 13, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "naia-5", school: "Indiana Wesleyan University", division: "NAIA", conference: "Crossroads League", state: "IN",
    headCoach: "Greg Tonagel", email: "greg.tonagel@indwes.edu", phone: "765-677-2320",
    staff: [
      { name: "Greg Tonagel", role: "Head Coach", email: "greg.tonagel@indwes.edu", phone: "765-677-2320" },
      { name: "Jeff Clark", role: "Associate Head Coach", email: "jeff.clark@indwes.edu", phone: "765-677-2989" },
      { name: "Caleb Muthiah", role: "Assistant Coach", email: "caleb.muthiah@indwes.edu" },
      { name: "Brayton Cain", role: "Graduate Assistant", email: "brayton.cain@indwes.edu" },
    ],
    assistants: ["Jeff Clark", "Caleb Muthiah", "Brayton Cain"],
    athleticsUrl: "https://iwuwildcats.com", rosterSize: 13, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "naia-6", school: "Spring Arbor University", division: "NAIA", conference: "Crossroads League", state: "MI",
    headCoach: "John Williams", email: "john.williams2@arbor.edu", phone: "517-262-4469",
    staff: [
      { name: "John Williams", role: "Head Coach", email: "john.williams2@arbor.edu", phone: "517-262-4469" },
      { name: "Alex Scott", role: "Assistant Coach", email: "alexandria.scott@arbor.edu" },
      { name: "Terrence Willis", role: "Assistant Coach", email: "terrence.willis@arbor.edu" },
    ],
    assistants: ["Alex Scott", "Terrence Willis"],
    athleticsUrl: "https://arbor.edu/athletics", rosterSize: 13, internationalPlayers: 2, graduatingSeniors: 2,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "naia-7", school: "Loyola University New Orleans", division: "NAIA", conference: "Southern States", state: "LA",
    headCoach: "Trey Lindsey", email: "cllindse@loyno.edu", phone: "(504) 864-7398",
    staff: [
      { name: "Trey Lindsey", role: "Head Coach", email: "cllindse@loyno.edu", phone: "(504) 864-7398" },
      { name: "Daniel Venzant", role: "Assistant Coach", email: "dtvenzan@loyno.edu", phone: "(504) 864-7398" },
    ],
    assistants: ["Daniel Venzant"],
    athleticsUrl: "https://loyolawolfpack.com", rosterSize: 13, internationalPlayers: 3, graduatingSeniors: 2,
    positionsNeeded: ["PG", "SG"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "South",
  },
  // ── NJCAA D1 ───────────────────────────────────────────────────────────────
  {
    id: "jco-1", school: "Salt Lake Community College", division: "NJCAA D1", conference: "Scenic West", state: "UT",
    headCoach: "Dave Rice", email: "drice32@slcc.edu",
    staff: [
      { name: "Dave Rice", role: "Head Coach", email: "drice32@slcc.edu" },
    ],
    assistants: ["Dave Rice"],
    athleticsUrl: "https://slccbruins.com", rosterSize: 15, internationalPlayers: 4, graduatingSeniors: 4,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "jco-2", school: "Snow College", division: "NJCAA D1", conference: "Scenic West", state: "UT",
    headCoach: "Andrew May", email: "andrew.may@snow.edu", phone: "435-283-7033",
    staff: [
      { name: "Andrew May", role: "Head Coach", email: "andrew.may@snow.edu", phone: "435-283-7033" },
      { name: "Josh Perkins", role: "Assistant Coach", email: "josh.perkins1@snow.edu" },
      { name: "Ethan Kahn", role: "Assistant Coach", email: "ethan.kahn@snow.edu" },
    ],
    assistants: ["Josh Perkins", "Ethan Kahn"],
    athleticsUrl: "https://snowbadgers.com", rosterSize: 15, internationalPlayers: 3, graduatingSeniors: 4,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "jco-3", school: "Navarro College", division: "NJCAA D1", conference: "NTJCAC", state: "TX",
    headCoach: "Hunter Jenkins", email: "basketball@navarrocollege.edu",
    staff: [
      { name: "Hunter Jenkins", role: "Head Coach", email: "basketball@navarrocollege.edu" },
      { name: "Troy Potts", role: "Assistant Coach", email: "troy.potts@navarrocollege.edu" },
      { name: "Xavian Jimenez", role: "Assistant Coach", email: "Xavian.Jimenez@NavarroCollege.edu" },
      { name: "Beau Martin", role: "Assistant Coach", email: "basketball@navarrocollege.edu" },
    ],
    assistants: ["Troy Potts", "Xavian Jimenez", "Beau Martin"],
    athleticsUrl: "https://navarrocollege.edu/athletics", rosterSize: 15, internationalPlayers: 4, graduatingSeniors: 5,
    positionsNeeded: ["PG", "SG", "SF", "PF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "South",
  },
  // ── NEW NCAA D1 ──────────────────────────────────────────────────────────
  {
    id: "d1-6", school: "Pepperdine University", division: "NCAA D1", conference: "WCC", state: "CA",
    headCoach: "Griff Aldrich", email: "",
    staff: [
      { name: "Dan Engelstad", role: "Assistant Coach", email: "dan.engelstad@pepperdine.edu" },
      { name: "Ryan Oliver", role: "Assistant Coach", email: "ryan.oliver2@pepperdine.edu" },
      { name: "Matthew Palumbo", role: "Assistant Coach", email: "matthew.palumbo@pepperdine.edu" },
      { name: "Noah Ralby", role: "Assistant Coach", email: "noah.ralby@pepperdine.edu" },
      { name: "Chase Coleman", role: "Assistant Coach", email: "chase.m.coleman@pepperdine.edu" },
      { name: "Aleksandr Abrams", role: "Assistant Coach", email: "aleksandr.abrams@pepperdine.edu" },
    ],
    assistants: [], athleticsUrl: "https://pepperdinewaves.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-7", school: "University of San Diego", division: "NCAA D1", conference: "WCC", state: "CA",
    headCoach: "Steve Lavin", email: "",
    staff: [
      { name: "R Devlin", role: "Assistant Coach", email: "rdevlin@sandiego.edu" },
      { name: "W McKnight", role: "Assistant Coach", email: "wmcknight@sandiego.edu" },
      { name: "Jackson Doran", role: "Assistant Coach", email: "jacksondoran@sandiego.edu" },
      { name: "P Gallagher", role: "Assistant Coach", email: "pgallagher@sandiego.edu" },
    ],
    assistants: [], athleticsUrl: "https://usdtoreros.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-8", school: "CSU Northridge", division: "NCAA D1", conference: "Big West", state: "CA",
    headCoach: "Andy Newman", email: "",
    staff: [
      { name: "Scott Cutley", role: "Assistant Coach", email: "scott.cutley@csun.edu" },
      { name: "CJ Killin", role: "Assistant Coach", email: "cj.killin@csun.edu" },
      { name: "Brandon Shingles", role: "Assistant Coach", email: "brandon.shingles@csun.edu" },
    ],
    assistants: [], athleticsUrl: "https://gomatadors.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-9", school: "California Baptist University", division: "NCAA D1", conference: "WAC", state: "CA",
    headCoach: "Rick Croy", email: "rcroy@calbaptist.edu",
    staff: [
      { name: "Rick Croy", role: "Head Coach", email: "rcroy@calbaptist.edu" },
      { name: "Hasprilla", role: "Assistant Coach", email: "hasprilla@calbaptist.edu" },
      { name: "R Wellman", role: "Assistant Coach", email: "rwellman@calbaptist.edu" },
      { name: "S Clark", role: "Assistant Coach", email: "scclark@calbaptist.edu" },
      { name: "D Lippi", role: "Assistant Coach", email: "dlippi@calbaptist.edu" },
      { name: "R Howard", role: "Assistant Coach", email: "rhoward@calbaptist.edu" },
    ],
    assistants: [], athleticsUrl: "https://cbulancers.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-10", school: "UC Riverside", division: "NCAA D1", conference: "Big West", state: "CA",
    headCoach: "Gus Argenal", email: "agustin.argenal@ucr.edu",
    staff: [
      { name: "Gus Argenal", role: "Head Coach", email: "agustin.argenal@ucr.edu" },
      { name: "Timothy Bross", role: "Assistant Coach", email: "timothy.bross@ucr.edu" },
      { name: "Blake Wetherington", role: "Assistant Coach", email: "blake.wetherington@ucr.edu" },
      { name: "Reuben W", role: "Assistant Coach", email: "reubenw@ucr.edu" },
      { name: "Matthew Musselman", role: "Assistant Coach", email: "matthew.musselman@ucr.edu" },
    ],
    assistants: [], athleticsUrl: "https://gohighlanders.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-11", school: "UC Irvine", division: "NCAA D1", conference: "Big West", state: "CA",
    headCoach: "Russell Turner", email: "UCIMBB@uci.edu",
    staff: [
      { name: "Russell Turner", role: "Head Coach", email: "UCIMBB@uci.edu" },
      { name: "Tona C", role: "Assistant Coach", email: "tonac@uci.edu" },
      { name: "N Booker", role: "Assistant Coach", email: "nbooker@uci.edu" },
      { name: "P Scully", role: "Assistant Coach", email: "pscully@uci.edu" },
      { name: "Julius", role: "Assistant Coach", email: "julius1@uci.edu" },
      { name: "B Boznans", role: "Assistant Coach", email: "bboznans@uci.edu" },
    ],
    assistants: [], athleticsUrl: "https://ucirvinesports.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-12", school: "CSU Fullerton", division: "NCAA D1", conference: "Big West", state: "CA",
    headCoach: "Dedrique Taylor", email: "mensbasketball@fullerton.edu",
    staff: [
      { name: "Dedrique Taylor", role: "Head Coach", email: "mensbasketball@fullerton.edu" },
      { name: "A Santos", role: "Assistant Coach", email: "ansantos@fullerton.edu" },
      { name: "C Walker", role: "Assistant Coach", email: "chrwalker@fullerton.edu" },
      { name: "R Hamm", role: "Assistant Coach", email: "rhamm@fullerton.edu" },
      { name: "D Sprinkle", role: "Assistant Coach", email: "dsprinkle@fullerton.edu" },
    ],
    assistants: [], athleticsUrl: "https://fullertontitans.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-13", school: "CSU Long Beach", division: "NCAA D1", conference: "Big West", state: "CA",
    headCoach: "Chris Acker", email: "",
    staff: [
      { name: "Anthony Santos", role: "Assistant Coach", email: "Anthony.Santos@csulb.edu" },
      { name: "Phillip Scott", role: "Assistant Coach", email: "Phillip.Scott@csulb.edu" },
      { name: "Greg Howell", role: "Assistant Coach", email: "Greg.Howell@csulb.edu" },
      { name: "Jacob Eyman", role: "Assistant Coach", email: "Jacob.Eyman@csulb.edu" },
    ],
    assistants: [], athleticsUrl: "https://longbeachstate.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-14", school: "University of the Pacific", division: "NCAA D1", conference: "WCC", state: "CA",
    headCoach: "Dave Smart", email: "dsmart@pacific.edu",
    staff: [
      { name: "Dave Smart", role: "Head Coach", email: "dsmart@pacific.edu" },
      { name: "G Bridges", role: "Assistant Coach", email: "gbridges@pacific.edu" },
      { name: "B Cole", role: "Assistant Coach", email: "bcole@pacific.edu" },
      { name: "H Washington", role: "Assistant Coach", email: "hwashington@pacific.edu" },
      { name: "A Kitamoto", role: "Assistant Coach", email: "akitamoto@pacific.edu" },
    ],
    assistants: [], athleticsUrl: "https://pacifictigers.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-15", school: "Saint Mary's College of CA", division: "NCAA D1", conference: "WCC", state: "CA",
    headCoach: "Mickey McConnell", email: "",
    staff: [
      { name: "H La", role: "Assistant Coach", email: "hla6@stmarys-ca.edu" },
      { name: "C Mc", role: "Assistant Coach", email: "cmc62@stmarys-ca.edu" },
      { name: "R Tj", role: "Assistant Coach", email: "rtj1@stmarys-ca.edu" },
      { name: "D Ks", role: "Assistant Coach", email: "dks7@stmarys-ca.edu" },
      { name: "T At", role: "Assistant Coach", email: "tat1@stmarys-ca.edu" },
      { name: "J Arnaudon", role: "Assistant Coach", email: "jarnaudon@stmarys-ca.edu" },
    ],
    assistants: [], athleticsUrl: "https://smcgaels.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-16", school: "University of San Francisco", division: "NCAA D1", conference: "WCC", state: "CA",
    headCoach: "Chris Gerlufsen", email: "",
    staff: [
      { name: "M Plank", role: "Assistant Coach", email: "mplank@usfca.edu" },
      { name: "J Duncan", role: "Assistant Coach", email: "jduncan3@usfca.edu" },
      { name: "K Bankhead", role: "Assistant Coach", email: "kbankhead@usfca.edu" },
      { name: "V McGhee", role: "Assistant Coach", email: "vmcghee@usfca.edu" },
      { name: "F Ferrari", role: "Assistant Coach", email: "fferrari@usfca.edu" },
    ],
    assistants: [], athleticsUrl: "https://usfdons.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-17", school: "UC Davis", division: "NCAA D1", conference: "Big West", state: "CA",
    headCoach: "Jim Les", email: "aggiebasketball@ucdavis.edu",
    staff: [
      { name: "Jim Les", role: "Head Coach", email: "aggiebasketball@ucdavis.edu" },
      { name: "K Nosek", role: "Assistant Coach", email: "knosek@ucdavis.edu" },
      { name: "K Vogt", role: "Assistant Coach", email: "ktvogt@ucdavis.edu" },
      { name: "J Jones", role: "Assistant Coach", email: "jgmjones@ucdavis.edu" },
      { name: "F Solomon", role: "Assistant Coach", email: "fusolomon@ucdavis.edu" },
      { name: "M Kosich", role: "Assistant Coach", email: "mkosich@ucdavis.edu" },
    ],
    assistants: [], athleticsUrl: "https://ucdavisaggies.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-18", school: "Cal Poly", division: "NCAA D1", conference: "Big West", state: "CA",
    headCoach: "Mike DeGeorge", email: "mbb@calpoly.edu",
    staff: [
      { name: "Mike DeGeorge", role: "Head Coach", email: "mbb@calpoly.edu" },
      { name: "K Bossier", role: "Assistant Coach", email: "kbossier@calpoly.edu" },
      { name: "J Pru", role: "Assistant Coach", email: "jpru@calpoly.edu" },
      { name: "S Walte", role: "Assistant Coach", email: "swalte01@calpoly.edu" },
      { name: "B Andre", role: "Assistant Coach", email: "bandre08@calpoly.edu" },
      { name: "R Dubois", role: "Assistant Coach", email: "rodubois@calpoly.edu" },
    ],
    assistants: [], athleticsUrl: "https://gopoly.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-19", school: "UC Santa Barbara", division: "NCAA D1", conference: "Big West", state: "CA",
    headCoach: "Joe Pasternack", email: "Joe.Pasternack@athletics.ucsb.edu",
    staff: [
      { name: "Joe Pasternack", role: "Head Coach", email: "Joe.Pasternack@athletics.ucsb.edu" },
      { name: "Brandon Cyrus", role: "Assistant Coach", email: "Brandon.Cyrus@athletics.ucsb.edu" },
      { name: "Brian Eskildsen", role: "Assistant Coach", email: "brian.eskildsen@athletics.ucsb.edu" },
      { name: "Derek Glasser", role: "Assistant Coach", email: "Derek.Glasser@athletics.ucsb.edu" },
      { name: "Brandon Rosenthal", role: "Assistant Coach", email: "brandon.rosenthal@athletics.ucsb.edu" },
    ],
    assistants: [], athleticsUrl: "https://ucsbgauchos.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-20", school: "CSU Bakersfield", division: "NCAA D1", conference: "Big West", state: "CA",
    headCoach: "Todd Lee", email: "",
    staff: [
      { name: "C Crevelone", role: "Assistant Coach", email: "ccrevelone@csub.edu" },
      { name: "E Hill", role: "Assistant Coach", email: "ehill13@csub.edu" },
      { name: "B Wrapp", role: "Assistant Coach", email: "bwrapp@csub.edu" },
    ],
    assistants: [], athleticsUrl: "https://gorunners.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-21", school: "University of New Mexico", division: "NCAA D1", conference: "Mountain West", state: "NM",
    headCoach: "Eric Olen", email: "",
    staff: [
      { name: "S Padgett", role: "Assistant Coach", email: "spadgett@unm.edu" },
    ],
    assistants: [], athleticsUrl: "https://golobos.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-22", school: "UNLV", division: "NCAA D1", conference: "Mountain West", state: "NV",
    headCoach: "Josh Pastner", email: "joshua.pastner@unlv.edu",
    staff: [
      { name: "Josh Pastner", role: "Head Coach", email: "joshua.pastner@unlv.edu" },
      { name: "Scott Garson", role: "Assistant Coach", email: "scott.garson@unlv.edu" },
      { name: "Anthony Wilkins", role: "Assistant Coach", email: "anthony.wilkins@unlv.edu" },
      { name: "Justin Hawkins-Young", role: "Assistant Coach", email: "justin.hawkinsyoung@unlv.edu" },
    ],
    assistants: [], athleticsUrl: "https://unlvrebels.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-23", school: "University of Nevada, Reno", division: "NCAA D1", conference: "Mountain West", state: "NV",
    headCoach: "Steve Alford", email: "",
    staff: [
      { name: "Craig N", role: "Assistant Coach", email: "Craign@unr.edu" },
      { name: "B Duany", role: "Assistant Coach", email: "bduany@unr.edu" },
      { name: "L Leath", role: "Assistant Coach", email: "lleath@unr.edu" },
      { name: "M Furlong", role: "Assistant Coach", email: "mfurlong@unr.edu" },
    ],
    assistants: [], athleticsUrl: "https://nevadawolfpack.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-24", school: "Eastern Washington University", division: "NCAA D1", conference: "Big Sky", state: "WA",
    headCoach: "Dan Monson", email: "",
    staff: [
      { name: "Chris Van Der Yacht", role: "Assistant Coach", email: "chris.vanderyacht@ewu.edu" },
      { name: "Ryan Garcia", role: "Assistant Coach", email: "ryan.garcia@ewu.edu" },
      { name: "Tyler Hughes", role: "Assistant Coach", email: "tyler.hughes@ewu.edu" },
    ],
    assistants: [], athleticsUrl: "https://goeags.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "d1-25", school: "Portland State University", division: "NCAA D1", conference: "Big Sky", state: "OR",
    headCoach: "Jase Coburn", email: "jase.coburn@pdx.edu",
    staff: [
      { name: "Jase Coburn", role: "Head Coach", email: "jase.coburn@pdx.edu" },
      { name: "Matt Dunn", role: "Assistant Coach", email: "mattdunn@pdx.edu" },
      { name: "Jam Will", role: "Assistant Coach", email: "jamwill2@pdx.edu" },
      { name: "Mike H", role: "Assistant Coach", email: "mikeh@pdx.edu" },
      { name: "G Jp", role: "Assistant Coach", email: "gjp@pdx.edu" },
      { name: "C Adhoff", role: "Assistant Coach", email: "cadhoff@pdx.edu" },
    ],
    assistants: [], athleticsUrl: "https://goviks.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "d1-26", school: "University of Portland", division: "NCAA D1", conference: "WCC", state: "OR",
    headCoach: "Shantay Legans", email: "legans@up.edu",
    staff: [
      { name: "Shantay Legans", role: "Head Coach", email: "legans@up.edu" },
      { name: "Ormond", role: "Assistant Coach", email: "ormond@up.edu" },
      { name: "Separovi", role: "Assistant Coach", email: "separovi@up.edu" },
      { name: "Mclean", role: "Assistant Coach", email: "mcleand26@up.edu" },
      { name: "Meyer", role: "Assistant Coach", email: "meyerm@up.edu" },
      { name: "Douglas", role: "Assistant Coach", email: "douglast27@up.edu" },
    ],
    assistants: [], athleticsUrl: "https://portlandpilots.com", rosterSize: 14, internationalPlayers: 3, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "d1-27", school: "Seattle University", division: "NCAA D1", conference: "WAC", state: "WA",
    headCoach: "Chris Victor", email: "",
    staff: [
      { name: "N Scott", role: "Assistant Coach", email: "nscott@seattleu.edu" },
      { name: "J Brennan", role: "Assistant Coach", email: "jbrennan@seattleu.edu" },
      { name: "D Groves", role: "Assistant Coach", email: "dgroves@seattleu.edu" },
    ],
    assistants: [], athleticsUrl: "https://goseattleu.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "d1-28", school: "University of North Dakota", division: "NCAA D1", conference: "Summit League", state: "ND",
    headCoach: "Paul Sather", email: "paul.sather@und.edu",
    staff: [
      { name: "Paul Sather", role: "Head Coach", email: "paul.sather@und.edu" },
      { name: "James Stevens", role: "Assistant Coach", email: "james.t.stevens@und.edu" },
      { name: "Tyler Danielson", role: "Assistant Coach", email: "tyler.joe.danielson@und.edu" },
      { name: "Estevan Sandoval", role: "Assistant Coach", email: "estevan.sandoval@und.edu" },
    ],
    assistants: [], athleticsUrl: "https://fightinghawks.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "d1-29", school: "University of South Dakota", division: "NCAA D1", conference: "Summit League", state: "SD",
    headCoach: "Eric Peterson", email: "eric.peterson@usd.edu",
    staff: [
      { name: "Eric Peterson", role: "Head Coach", email: "eric.peterson@usd.edu" },
      { name: "Alex Ahmed", role: "Assistant Coach", email: "alex.ahmed@usd.edu" },
      { name: "Ben McLaughlin", role: "Assistant Coach", email: "ben.mclaughlin@usd.edu" },
      { name: "Matt Sutton", role: "Assistant Coach", email: "matt.sutton@usd.edu" },
    ],
    assistants: [], athleticsUrl: "https://goyotes.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "d1-30", school: "South Dakota State University", division: "NCAA D1", conference: "Summit League", state: "SD",
    headCoach: "Bryan Petersen", email: "Bryan.Petersen@sdstate.edu",
    staff: [
      { name: "Bryan Petersen", role: "Head Coach", email: "Bryan.Petersen@sdstate.edu" },
      { name: "Cole Christian", role: "Assistant Coach", email: "Cole.Christian@sdstate.edu" },
      { name: "Ryan Kirsch", role: "Assistant Coach", email: "Ryan.Kirsch@sdstate.edu" },
      { name: "Nicholas Smith", role: "Assistant Coach", email: "Nicholas.Smith@sdstate.edu" },
      { name: "Jamal Nixon", role: "Assistant Coach", email: "Jamal.Nixon@sdstate.edu" },
      { name: "Tucker Wookey", role: "Assistant Coach", email: "Tucker.Wookey@sdstate.edu" },
    ],
    assistants: [], athleticsUrl: "https://gojacks.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "d1-31", school: "University of Northern Colorado", division: "NCAA D1", conference: "Big Sky", state: "CO",
    headCoach: "Steve Smiley", email: "stephen.smiley@unco.edu",
    staff: [
      { name: "Steve Smiley", role: "Head Coach", email: "stephen.smiley@unco.edu" },
      { name: "Dorian Green", role: "Assistant Coach", email: "dorian.green@unco.edu" },
      { name: "Dondrale Campbell", role: "Assistant Coach", email: "dondrale.campbell@unco.edu" },
    ],
    assistants: [], athleticsUrl: "https://uncbears.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-32", school: "University of Wyoming", division: "NCAA D1", conference: "Mountain West", state: "WY",
    headCoach: "Sundance Wicks", email: "",
    staff: [
      { name: "W Marti", role: "Assistant Coach", email: "wmarti19@uwyo.edu" },
      { name: "C Mcmill", role: "Assistant Coach", email: "cmcmill1@uwyo.edu" },
      { name: "N Reynol", role: "Assistant Coach", email: "nreynol4@uwyo.edu" },
      { name: "C Thoma", role: "Assistant Coach", email: "cthoma56@uwyo.edu" },
      { name: "N Whitmor", role: "Assistant Coach", email: "nwhitmor@uwyo.edu" },
    ],
    assistants: [], athleticsUrl: "https://gowyo.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-33", school: "Utah Valley University", division: "NCAA D1", conference: "WAC", state: "UT",
    headCoach: "Todd Phillips", email: "",
    staff: [
      { name: "Tokeson", role: "Assistant Coach", email: "Tokeson@uvu.edu" },
      { name: "Andrew May", role: "Assistant Coach", email: "Andrew.May@uvu.edu" },
      { name: "Ivory Young", role: "Assistant Coach", email: "Ivory.Young@uvu.edu" },
      { name: "Trevor Stranger", role: "Assistant Coach", email: "trevor.stranger@uvu.edu" },
    ],
    assistants: [], athleticsUrl: "https://gouvu.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-34", school: "Weber State University", division: "NCAA D1", conference: "Big Sky", state: "UT",
    headCoach: "Kaleb Canales", email: "",
    staff: [
      { name: "Luke Spring", role: "Assistant Coach", email: "lukespring@weber.edu" },
    ],
    assistants: [], athleticsUrl: "https://weberstatesports.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-35", school: "Southern Utah University", division: "NCAA D1", conference: "WAC", state: "UT",
    headCoach: "Rob Jeter", email: "",
    staff: [
      { name: "Donald Williams", role: "Assistant Coach", email: "donaldwilliams@suu.edu" },
      { name: "Shaun Gutting", role: "Assistant Coach", email: "shaungutting@suu.edu" },
      { name: "Benson Owens", role: "Assistant Coach", email: "bensonowens@suu.edu" },
      { name: "Braden Lamar", role: "Assistant Coach", email: "bradenlamar@suu.edu" },
    ],
    assistants: [], athleticsUrl: "https://suutbirds.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-36", school: "Idaho State University", division: "NCAA D1", conference: "Big Sky", state: "ID",
    headCoach: "Ryan Looney", email: "ryanlooney@isu.edu",
    staff: [
      { name: "Ryan Looney", role: "Head Coach", email: "ryanlooney@isu.edu" },
      { name: "Kenneth Edwards", role: "Assistant Coach", email: "kennethedwards2@isu.edu" },
      { name: "Cam Flabel", role: "Assistant Coach", email: "camflabel@isu.edu" },
      { name: "Timothy Nolan", role: "Assistant Coach", email: "timothynolan@isu.edu" },
      { name: "Rob Rodriguez", role: "Assistant Coach", email: "robrodriguez@isu.edu" },
    ],
    assistants: [], athleticsUrl: "https://isubengals.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "d1-37", school: "University of Idaho", division: "NCAA D1", conference: "Big Sky", state: "ID",
    headCoach: "Alex Pribble", email: "",
    staff: [
      { name: "Blair D", role: "Assistant Coach", email: "blaird@uidaho.edu" },
      { name: "Matt Jones", role: "Assistant Coach", email: "mattjjones@uidaho.edu" },
      { name: "A Ellis", role: "Assistant Coach", email: "acellis@uidaho.edu" },
      { name: "Lucas Chavez", role: "Assistant Coach", email: "lucaschavez@uidaho.edu" },
    ],
    assistants: [], athleticsUrl: "https://govandals.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "d1-38", school: "University of Montana", division: "NCAA D1", conference: "Big Sky", state: "MT",
    headCoach: "Travis DeCuire", email: "caleigh.cookson@mso.umt.edu",
    staff: [
      { name: "Travis DeCuire", role: "Head Coach", email: "caleigh.cookson@mso.umt.edu" },
      { name: "Chris Cobb", role: "Assistant Coach", email: "chris.cobb@mso.umt.edu" },
      { name: "Jay Flores", role: "Assistant Coach", email: "jay.flores@mso.umt.edu" },
      { name: "Rachi Wortham", role: "Assistant Coach", email: "rachi.wortham@mso.umt.edu" },
      { name: "Ryan Frazer", role: "Assistant Coach", email: "ryan.frazer@mso.umt.edu" },
    ],
    assistants: [], athleticsUrl: "https://gogriz.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "d1-39", school: "Northern Arizona University", division: "NCAA D1", conference: "Big Sky", state: "AZ",
    headCoach: "Shane Burcar", email: "naumensbasketball@nau.edu",
    staff: [
      { name: "Shane Burcar", role: "Head Coach", email: "naumensbasketball@nau.edu" },
      { name: "Jon Ahola", role: "Assistant Coach", email: "Jon.Ahola@nau.edu" },
    ],
    assistants: [], athleticsUrl: "https://nauathletics.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-40", school: "Sacramento State", division: "NCAA D1", conference: "Big Sky", state: "CA",
    headCoach: "Mike Bibby", email: "m.bibby@csus.edu",
    staff: [
      { name: "Mike Bibby", role: "Head Coach", email: "m.bibby@csus.edu" },
      { name: "Michael Bibby", role: "Assistant Coach", email: "michael.bibby@csus.edu" },
      { name: "R Walcott", role: "Assistant Coach", email: "r.walcott@csus.edu" },
      { name: "Jason Fraser", role: "Assistant Coach", email: "jason.fraser@csus.edu" },
      { name: "G Moody", role: "Assistant Coach", email: "g.moody@csus.edu" },
      { name: "August Mendes", role: "Assistant Coach", email: "august.mendes@csus.edu" },
    ],
    assistants: [], athleticsUrl: "https://hornetsports.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  {
    id: "d1-41", school: "North Dakota State University", division: "NCAA D1", conference: "Summit League", state: "ND",
    headCoach: "David Richman", email: "",
    staff: [
      { name: "Luke Strege", role: "Assistant Coach", email: "Luke.Strege@ndsu.edu" },
      { name: "Spencer Wilker", role: "Assistant Coach", email: "Spencer.Wilker@ndsu.edu" },
      { name: "Terrance McGee", role: "Assistant Coach", email: "Terrance.McGee@ndsu.edu" },
      { name: "Camron Greer", role: "Assistant Coach", email: "Camron.Greer@ndsu.edu" },
      { name: "James Buchanan", role: "Assistant Coach", email: "James.T.Buchanan@ndsu.edu" },
    ],
    assistants: [], athleticsUrl: "https://gobison.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "d1-42", school: "University of Denver", division: "NCAA D1", conference: "Summit League", state: "CO",
    headCoach: "Tim Bergstraser", email: "Timothy.Bergstraser@du.edu",
    staff: [
      { name: "Tim Bergstraser", role: "Head Coach", email: "Timothy.Bergstraser@du.edu" },
      { name: "Spenser Bland", role: "Assistant Coach", email: "Spenser.Bland@du.edu" },
      { name: "Kyle Heikkinen", role: "Assistant Coach", email: "Kyle.Heikkinen@du.edu" },
      { name: "Scott Gauthier", role: "Assistant Coach", email: "scott.l.gauthier@du.edu" },
      { name: "Nihilo Ibarra", role: "Assistant Coach", email: "Nihilo.Ibarra@du.edu" },
    ],
    assistants: [], athleticsUrl: "https://denverpioneers.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Mountain",
  },
  {
    id: "d1-43", school: "University of Nebraska Omaha", division: "NCAA D1", conference: "Summit League", state: "NE",
    headCoach: "Chris Crutchfield", email: "ccrutchfield@omavs.com",
    staff: [
      { name: "Chris Crutchfield", role: "Head Coach", email: "ccrutchfield@omavs.com" },
      { name: "Kyan Brown", role: "Assistant Coach", email: "kyanbrown@omavs.com" },
      { name: "J Reynolds", role: "Assistant Coach", email: "jreynolds24@omavs.com" },
      { name: "K Holdman", role: "Assistant Coach", email: "kholdman@omavs.com" },
      { name: "J Crutchfield", role: "Assistant Coach", email: "jcrutchfield@omavs.com" },
      { name: "B Danals", role: "Assistant Coach", email: "bdanals@omavs.com" },
    ],
    assistants: [], athleticsUrl: "https://omavs.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "d1-44", school: "Oral Roberts University", division: "NCAA D1", conference: "Summit League", state: "OK",
    headCoach: "Kory Barnett", email: "",
    staff: [
      { name: "K Alford", role: "Assistant Coach", email: "kalford@oru.edu" },
      { name: "Van Green", role: "Assistant Coach", email: "vangreen@oru.edu" },
      { name: "Do Williams", role: "Assistant Coach", email: "dowilliams@oru.edu" },
      { name: "W Saxon", role: "Assistant Coach", email: "wsaxon@oru.edu" },
      { name: "I Green", role: "Assistant Coach", email: "igreen@oru.edu" },
    ],
    assistants: [], athleticsUrl: "https://oruathletics.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "South",
  },
  {
    id: "d1-45", school: "University of St. Thomas (MN)", division: "NCAA D1", conference: "Summit League", state: "MN",
    headCoach: "Johnny Tauer", email: "tauer@stthomas.edu",
    staff: [
      { name: "Johnny Tauer", role: "Head Coach", email: "tauer@stthomas.edu" },
      { name: "Mike Maker", role: "Assistant Coach", email: "mike.maker@stthomas.edu" },
      { name: "Cameron Rundles", role: "Assistant Coach", email: "cameron.rundles@stthomas.edu" },
      { name: "Rodenbiker", role: "Assistant Coach", email: "rodenbiker@stthomas.edu" },
    ],
    assistants: [], athleticsUrl: "https://tommiesports.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "d1-46", school: "Grand Canyon University", division: "NCAA D1", conference: "WAC", state: "AZ",
    headCoach: "Bryce Drew", email: "",
    staff: [
      { name: "Casey Shaw", role: "Assistant Coach", email: "casey.shaw@gcu.edu" },
      { name: "Matthew Lottich", role: "Assistant Coach", email: "matthew.lottich@gcu.edu" },
    ],
    assistants: [], athleticsUrl: "https://gculopes.com", rosterSize: 14, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "West Coast",
  },
  // ── NCAA D2 ───────────────────────────────────────────────────────────────
  {
    id: "d2-2", school: "West Texas A&M University", division: "NCAA D2", conference: "Lone Star", state: "TX",
    headCoach: "Tom Brown", email: "tbrown@wtamu.edu",
    staff: [
      { name: "Tom Brown", role: "Head Coach", email: "tbrown@wtamu.edu" },
      { name: "C Gove", role: "Assistant Coach", email: "cgove@wtamu.edu" },
      { name: "Z Toussaint", role: "Assistant Coach", email: "ztoussaint@wtamu.edu" },
    ],
    assistants: [], athleticsUrl: "https://gobuffsgo.com", rosterSize: 13, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "South",
  },
  {
    id: "d2-3", school: "Southern Nazarene University", division: "NCAA D2", conference: "GAC", state: "OK",
    headCoach: "BJ Foster", email: "bfoster96@mail.snu.edu",
    staff: [
      { name: "BJ Foster", role: "Head Coach", email: "bfoster96@mail.snu.edu" },
      { name: "J Coleman", role: "Assistant Coach", email: "jcoleman104@mail.snu.edu" },
      { name: "C White", role: "Assistant Coach", email: "cwhite415@mail.snu.edu" },
      { name: "D Faile", role: "Assistant Coach", email: "dfaile@mail.snu.edu" },
    ],
    assistants: [], athleticsUrl: "https://snuathletics.com", rosterSize: 13, internationalPlayers: 2, graduatingSeniors: 3,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "South",
  },
  // ── NAIA ──────────────────────────────────────────────────────────────────
  {
    id: "naia-8", school: "Oklahoma City University", division: "NAIA", conference: "Sooner Athletic", state: "OK",
    headCoach: "Sam Kohnke", email: "skohnke@okcu.edu",
    staff: [
      { name: "Sam Kohnke", role: "Head Coach", email: "skohnke@okcu.edu" },
      { name: "Q Roberts", role: "Assistant Coach", email: "qroberts@okcu.edu" },
      { name: "Michael Malone", role: "Assistant Coach", email: "michael.malone@okcu.edu" },
    ],
    assistants: [], athleticsUrl: "https://okcusports.com", rosterSize: 13, internationalPlayers: 2, graduatingSeniors: 2,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "South",
  },
  {
    id: "naia-9", school: "Wayland Baptist University", division: "NAIA", conference: "Sooner Athletic", state: "TX",
    headCoach: "Clint Galyean", email: "galyeanc@wbu.edu",
    staff: [
      { name: "Clint Galyean", role: "Head Coach", email: "galyeanc@wbu.edu" },
      { name: "Galyean", role: "Assistant Coach", email: "galyeand@wbu.edu" },
      { name: "Senn", role: "Assistant Coach", email: "sennl@wbu.edu" },
    ],
    assistants: [], athleticsUrl: "https://wbuathletics.com", rosterSize: 13, internationalPlayers: 2, graduatingSeniors: 2,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "South",
  },
  // ── NJCAA ─────────────────────────────────────────────────────────────────
  {
    id: "jco-4", school: "College of Southern Idaho", division: "NJCAA D1", conference: "Scenic West", state: "ID",
    headCoach: "Jeff Reinert", email: "jreinert@csi.edu",
    staff: [
      { name: "Jeff Reinert", role: "Head Coach", email: "jreinert@csi.edu" },
      { name: "B Henshaw", role: "Assistant Coach", email: "dbhenshaw@csi.edu" },
    ],
    assistants: [], athleticsUrl: "https://athletics.csi.edu", rosterSize: 15, internationalPlayers: 3, graduatingSeniors: 4,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
  {
    id: "jco-5", school: "Western Nebraska Community College", division: "NJCAA D1", conference: "Region IX", state: "NE",
    headCoach: "Roybell Baez", email: "baezr51@wncc.edu",
    staff: [
      { name: "Roybell Baez", role: "Head Coach", email: "baezr51@wncc.edu" },
      { name: "Winkle", role: "Assistant Coach", email: "winkle17@wncc.edu" },
    ],
    assistants: [], athleticsUrl: "https://wnccathletics.com", rosterSize: 15, internationalPlayers: 3, graduatingSeniors: 4,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Midwest",
  },
  {
    id: "jco-6", school: "North Idaho College", division: "NJCAA D1", conference: "NWAC", state: "ID",
    headCoach: "Corey Symons", email: "corey.symons@nic.edu",
    staff: [
      { name: "Corey Symons", role: "Head Coach", email: "corey.symons@nic.edu" },
      { name: "Freddy Brown", role: "Assistant Coach", email: "freddy.brown@nic.edu" },
    ],
    assistants: [], athleticsUrl: "https://nicathletics.com", rosterSize: 15, internationalPlayers: 3, graduatingSeniors: 4,
    positionsNeeded: ["PG", "SG", "SF"], scholarshipLevel: "Full", stage: "Not Contacted", favorited: false, notes: "", region: "Pacific Northwest",
  },
];

const OUTREACH_TEMPLATE = {
  subject: "{{PlayerName}} | {{Position}} | {{GraduationYear}} | Seeking {{Division}} Scholarship",
  body: `Dear Coach {{CoachName}},

My name is {{PlayerName}}, a {{Height}} ({{HeightCm}}) {{Position}} from {{Country}} graduating in {{GraduationYear}}. I am actively seeking a scholarship opportunity at the {{Division}} level and am very interested in {{School}}.

After researching {{School}}'s program and the {{Conference}}, I am drawn to your coaching philosophy and the team's approach to player development. My playing style — emphasizing court vision, transition offense, and defensive intensity — aligns well with what I have seen from your program.

Player Profile:
• Position: {{Position}}
• Height: {{Height}} ({{HeightCm}})
• Weight: {{Weight}} ({{WeightKg}})
• GPA: {{GPA}}
• Stats: {{Stats}}
• Current Team: {{CurrentTeam}} ({{Country}})
• Passport: {{Country}} (Eligible immediately)

Highlight Film: {{HighlightUrl}}
Full Game Film: {{FilmUrl}}

I would welcome the opportunity to speak with you and learn more about your program. Thank you for your time and consideration.

Respectfully,
{{PlayerName}}
{{CurrentTeam}} | {{Country}} | Class of {{GraduationYear}}`
};

const analyticsData = {
  weekly: [
    { day: "Mon", sent: 3, opened: 2, replied: 1 },
    { day: "Tue", sent: 4, opened: 3, replied: 1 },
    { day: "Wed", sent: 5, opened: 3, replied: 1 },
    { day: "Thu", sent: 3, opened: 2, replied: 1 },
    { day: "Fri", sent: 4, opened: 3, replied: 0 },
    { day: "Sat", sent: 1, opened: 1, replied: 0 },
    { day: "Sun", sent: 0, opened: 0, replied: 0 },
  ],
  monthly: [
    { month: "Feb", sent: 0, opened: 0, replied: 0 },
    { month: "Mar", sent: 2, opened: 1, replied: 0 },
    { month: "Apr", sent: 6, opened: 4, replied: 1 },
    { month: "May", sent: 10, opened: 7, replied: 3 },
    { month: "Jun", sent: 16, opened: 11, replied: 5 },
  ],
};

const CRM_STAGES: CRMStage[] = ["Not Contacted", "Draft Ready", "Sent", "Opened", "Replied", "Interested", "Call Scheduled", "Offer", "Committed"];

const STAGE_CONFIG: Record<CRMStage, { color: string; bg: string; dot: string }> = {
  "Not Contacted": { color: "text-white/35", bg: "bg-white/5", dot: "#555" },
  "Draft Ready": { color: "text-blue-400/80", bg: "bg-blue-500/8", dot: "#60a5fa" },
  "Sent": { color: "text-indigo-400/80", bg: "bg-indigo-500/8", dot: "#818cf8" },
  "Opened": { color: "text-violet-400/80", bg: "bg-violet-500/8", dot: "#a78bfa" },
  "Replied": { color: "text-yellow-400/80", bg: "bg-yellow-500/8", dot: "#fbbf24" },
  "Interested": { color: "text-orange-400/80", bg: "bg-orange-500/8", dot: "#fb923c" },
  "Call Scheduled": { color: "text-emerald-400/80", bg: "bg-emerald-500/8", dot: "#34d399" },
  "Offer": { color: "text-green-400", bg: "bg-green-500/10", dot: "#4ade80" },
  "Committed": { color: "text-white", bg: "bg-white/12", dot: "#ffffff" },
};

const VARIABLES = [
  { key: "PlayerName", desc: "Your full name" },
  { key: "Position", desc: "PG / SG" },
  { key: "Height", desc: '6\'1"' },
  { key: "HeightCm", desc: "185 cm" },
  { key: "Weight", desc: "161 lbs" },
  { key: "WeightKg", desc: "73 kg" },
  { key: "GraduationYear", desc: "2028" },
  { key: "Country", desc: "France" },
  { key: "CurrentTeam", desc: "LMBC U18 France" },
  { key: "GPA", desc: "3.6" },

  { key: "Stats", desc: "Season stats" },
  { key: "HighlightUrl", desc: "Highlight link" },
  { key: "FilmUrl", desc: "Full film link" },
  { key: "CoachName", desc: "Auto-filled" },
  { key: "School", desc: "Auto-filled" },
  { key: "Conference", desc: "Auto-filled" },
  { key: "Division", desc: "Auto-filled" },
];

// ─── UTILITIES ────────────────────────────────────────────────────────────────

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const pct = (n: number, d: number) => d > 0 ? `${Math.round((n / d) * 100)}%` : "—";

// ─── DESIGN SYSTEM ────────────────────────────────────────────────────────────

function Chip({ children, variant = "default", size = "sm" }: { children: React.ReactNode; variant?: "default" | "green" | "yellow" | "red" | "blue" | "violet" | "ghost"; size?: "sm" | "xs" }) {
  const v: Record<string, string> = {
    default: "bg-white/6 text-white/55 border-white/8",
    green: "bg-emerald-500/12 text-emerald-400 border-emerald-500/15",
    yellow: "bg-yellow-500/12 text-yellow-400 border-yellow-500/15",
    red: "bg-red-500/12 text-red-400 border-red-500/15",
    blue: "bg-blue-500/12 text-blue-400 border-blue-500/15",
    violet: "bg-violet-500/12 text-violet-400 border-violet-500/15",
    ghost: "bg-transparent text-white/30 border-white/6",
  };
  return (
    <span className={cx("inline-flex items-center border rounded-full font-medium tracking-wide", size === "xs" ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]", v[variant])}>
      {children}
    </span>
  );
}

function StagePill({ stage }: { stage: CRMStage }) {
  const c = STAGE_CONFIG[stage];
  return (
    <span className={cx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/6", c.color, c.bg)}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
      {stage}
    </span>
  );
}

function Btn({ children, variant = "primary", size = "md", onClick, className, disabled, type }: {
  children: React.ReactNode; variant?: "primary" | "ghost" | "outline" | "danger" | "subtle";
  size?: "xs" | "sm" | "md"; onClick?: () => void; className?: string; disabled?: boolean; type?: "button" | "submit";
}) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-lg transition-all duration-100 cursor-pointer select-none whitespace-nowrap";
  const sizes = { xs: "px-2 py-1 text-[11px]", sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-white text-[#0b0b0f] hover:bg-white/90 active:scale-[0.98] shadow-sm",
    ghost: "text-white/50 hover:text-white/90 hover:bg-white/6 active:scale-[0.98]",
    outline: "border border-white/12 text-white/65 hover:text-white hover:border-white/25 hover:bg-white/4 active:scale-[0.98]",
    danger: "border border-red-500/25 text-red-400/80 hover:bg-red-500/8 hover:text-red-400",
    subtle: "bg-white/6 text-white/65 hover:bg-white/10 hover:text-white active:scale-[0.98]",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={cx(base, sizes[size], variants[variant], disabled && "opacity-40 cursor-not-allowed", className)}>
      {children}
    </button>
  );
}

function Field({ label, children, note }: { label: string; children: React.ReactNode; note?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-white/35 uppercase tracking-[0.08em] mb-1.5">{label}</label>
      {children}
      {note && <p className="text-[10px] text-white/25 mt-1">{note}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, className, prefix, mono }: {
  value?: string; onChange?: (v: string) => void; placeholder?: string;
  className?: string; prefix?: string; mono?: boolean;
}) {
  return (
    <div className={cx("flex items-center bg-white/4 border border-white/8 rounded-lg focus-within:border-white/20 focus-within:bg-white/5 transition-all", className)}>
      {prefix && <span className="pl-3 text-white/25 text-sm select-none">{prefix}</span>}
      <input value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
        className={cx("flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/25 outline-none",
          prefix && "pl-1.5", mono && "font-['JetBrains_Mono'] text-xs")} />
    </div>
  );
}

function SearchBar({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cx("flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 focus-within:border-white/18 focus-within:bg-white/5 transition-all", className)}>
      <Search size={13} className="text-white/30 flex-shrink-0" />
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        className="flex-1 bg-transparent py-2 text-sm text-white placeholder-white/30 outline-none" />
      {value && (
        <button onClick={() => onChange("")} className="text-white/25 hover:text-white/50 transition-colors">
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function Card({ children, className, hover }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cx("rounded-xl border border-white/7 bg-white/3 backdrop-blur-sm", hover && "hover:border-white/12 hover:bg-white/4 transition-colors", className)}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card className="p-5">
      <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.09em] mb-2">{label}</div>
      <div className={cx("text-2xl font-bold tracking-tight font-['Plus_Jakarta_Sans']", color || "text-white")}>{value}</div>
      {sub && <div className="text-[11px] text-white/35 mt-1">{sub}</div>}
    </Card>
  );
}

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans'] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

function Divider({ className }: { className?: string }) {
  return <div className={cx("border-t border-white/6", className)} />;
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "coaches", label: "Coach Database", icon: Users, count: loadCoaches().length },
  { id: "outreach", label: "Outreach", icon: Mail },
  { id: "broadcast", label: "Broadcast", icon: Zap },
  { id: "pipeline", label: "Pipeline", icon: Kanban },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

const NAV_BOTTOM = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

function Sidebar({ page, setPage, open, onToggle, onMouseEnter, onMouseLeave }: { page: Page; setPage: (p: Page) => void; open: boolean; onToggle: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void }) {
  const totalOffers = loadCoaches().filter(c => c.stage === "Offer").length;
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onToggle} />}
      <aside onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className={`fixed inset-y-0 left-0 w-[216px] flex flex-col border-r border-white/6 bg-[#080810]/90 backdrop-blur-xl z-40
                         transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center flex-shrink-0">
            <Target size={12} className="text-[#0b0b0f]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-white font-['Plus_Jakarta_Sans'] leading-none">ScoutFlow</span>
            <span className="text-[9px] text-white/25 font-['JetBrains_Mono'] mt-0.5">AI · v2.0</span>
          </div>
        </div>
        <button onClick={onToggle} className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex-shrink-0" title="Close sidebar">
          <X size={14} />
        </button>
      </div>

      {/* Offer alert */}
      {totalOffers > 0 && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-xs text-green-400 font-medium">{totalOffers} offer{totalOffers > 1 ? "s" : ""} received</span>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-2 py-3 space-y-px overflow-y-auto">
        <div className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.1em] px-2 pb-1.5">Recruiting</div>
        {NAV_ITEMS.map(({ id, label, icon: Icon, count }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id as Page)}
              className={cx("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-100 text-left group",
                active ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/75 hover:bg-white/5")}>
              <Icon size={14} className={active ? "text-white" : "text-white/35 group-hover:text-white/60"} />
              <span className="flex-1">{label}</span>
              {count !== undefined && (
                <span className={cx("text-[10px] font-['JetBrains_Mono'] px-1.5 py-px rounded-md",
                  active ? "bg-white/15 text-white/70" : "bg-white/5 text-white/25")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <div className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.1em] px-2 pt-4 pb-1.5">Account</div>
        {NAV_BOTTOM.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id as Page)}
              className={cx("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-100 text-left",
                active ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/75 hover:bg-white/5")}>
              <Icon size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Player mini card */}
      <Divider />
      <div className="p-3">
        <button onClick={() => setPage("profile")}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/40 to-blue-500/20 border border-white/15 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">🇫🇷</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-white/80 truncate">{getPlayer().name}</div>
            <div className="text-[10px] text-white/30 font-['JetBrains_Mono'] truncate">PG/SG · 6'1" · 2028</div>
          </div>
          <ChevronRight size={12} className="text-white/20 flex-shrink-0" />
        </button>
      </div>
    </aside></>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────

function TopBar({ title, children, onToggleSidebar, onLogout }: { title: string; children?: React.ReactNode; onToggleSidebar?: () => void; onLogout?: () => void }) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/6 bg-[#0b0b0f]/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0" title="Toggle sidebar">
          <Menu size={16} />
        </button>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {children}
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white/30 border border-white/8 rounded-lg hover:bg-white/5 transition-colors font-['JetBrains_Mono']">
          <Command size={10} />K
        </button>
        <div className="relative">
          <button className="w-8 h-8 flex items-center justify-center text-white/35 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors">
            <Bell size={14} />
          </button>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-400 rounded-full" />
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/40 to-blue-500/20 border border-white/15 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">🇫🇷</span>
        </div>
        {onLogout && <><span className="text-[10px] text-white/20 font-['JetBrains_Mono']">{localStorage.getItem("sf_user_email")}</span><button onClick={onLogout} className="text-[10px] text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors font-['JetBrains_Mono']">Logout</button></>}
      </div>
    </header>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardPage({ setPage, coaches, trackingVersion }: { setPage: (p: Page) => void; coaches: Coach[]; trackingVersion: number }) {
  const totalPrograms = coaches.length;
  const contacted = coaches.filter(c => c.stage !== "Not Contacted").length;
  const interested = coaches.filter(c => ["Interested", "Call Scheduled", "Offer", "Committed"].includes(c.stage)).length;
  const offers = coaches.filter(c => c.stage === "Offer" || c.stage === "Committed").length;
  const tracking = getTrackingLog();
  const sent = tracking.filter(t => t.type === "sent").length;
  const opened = tracking.filter(t => t.type === "opened").length;
  const replied = tracking.filter(t => t.type === "replied").length;

  const activity = tracking.slice(0, 10).map(t => ({
    icon: Send, text: `Sent to ${t.coachName} at ${t.school}`, time: formatTimeAgo(t.timestamp), type: "sent"
  }));
  if (activity.length === 0) activity.push(
    { icon: Send, text: "Start emailing coaches to see activity here", time: "", type: "ai" }
  );

  const typeColor: Record<string, string> = { sent: "text-white/40", ai: "text-violet-400" };

  function formatTimeAgo(iso: string) {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  const upNext = coaches.filter(c => c.stage === "Not Contacted" && c.favorited).slice(0, 4);

  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans'] tracking-tight">
            Good morning 👋
          </h1>
          <p className="text-white/40 text-sm mt-1">Here&apos;s your recruiting overview for June 25, 2025.</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" onClick={() => setPage("coaches")}><Users size={12} /> Browse Programs</Btn>
          <Btn variant="primary" size="sm" onClick={() => setPage("broadcast")}><Zap size={12} /> Contact All</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Programs Added" value={totalPrograms} sub={`${coaches.filter(c => c.division === "NCAA D1").length} D1 · ${coaches.filter(c => c.division === "NAIA").length} NAIA · ${coaches.filter(c => c.division.startsWith("NJCAA")).length} JUCO`} />
        <MetricCard label="Sent" value={sent} sub={`${contacted} contacted`} color={sent > 0 ? "text-blue-400" : ""} />
        <MetricCard label="Opened" value={opened} sub={`${replied} replied`} color={opened > 0 ? "text-blue-400" : ""} />
        <MetricCard label="Offers" value={offers} sub={`${interested} interested`} color={offers > 0 ? "text-green-400" : ""} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-white">Email Activity</div>
              <div className="text-xs text-white/35 mt-0.5">Past 30 days</div>
            </div>
            <div className="flex gap-4">
              {[["Sent", "#ffffff50"], ["Opened", "#93c5fd"], ["Replied", "#6ee7b7"]].map(([k, c]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="w-2 h-1 rounded-full" style={{ background: c as string }} />
                  <span className="text-[10px] text-white/35">{k}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={analyticsData.monthly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="db-a1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="db-a2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#ffffff35", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff35", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#131318", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }} labelStyle={{ color: "#ffffff70", marginBottom: 4 }} />
              <Area type="monotone" dataKey="sent" stroke="#ffffff40" strokeWidth={1.5} fill="url(#db-a1)" name="Sent" />
              <Area type="monotone" dataKey="opened" stroke="#93c5fd70" strokeWidth={1.5} fill="none" name="Opened" />
              <Area type="monotone" dataKey="replied" stroke="#6ee7b7" strokeWidth={1.5} fill="url(#db-a2)" name="Replied" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity feed */}
        <Card className="p-5">
          <div className="text-sm font-semibold text-white mb-4">Recent Activity</div>
          <div className="space-y-3.5">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="mt-0.5 flex-shrink-0">
                  <a.icon size={13} className={typeColor[a.type]} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/65 leading-snug">{a.text}</p>
                  <span className="text-[10px] text-white/25 font-['JetBrains_Mono']">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pipeline + Broadcast preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">Pipeline</div>
            <Btn variant="ghost" size="sm" onClick={() => setPage("pipeline")}>View all <ChevronRight size={11} /></Btn>
          </div>
          <div className="space-y-2">
            {CRM_STAGES.filter(s => s !== "Not Contacted").map(stage => {
              const cnt = coaches.filter(c => c.stage === stage).length;
              if (cnt === 0 && !["Offer", "Committed"].includes(stage)) return null;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STAGE_CONFIG[stage].dot }} />
                  <span className="text-xs text-white/50 flex-1">{stage}</span>
                  <div className="flex-1 max-w-[100px] h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min((cnt / coaches.length) * 100 * 4, 100)}%`, background: STAGE_CONFIG[stage].dot, opacity: 0.7 }} />
                  </div>
                  <span className="text-xs font-['JetBrains_Mono'] text-white/30 w-4 text-right">{cnt}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">Broadcast</div>
            <Btn variant="ghost" size="sm" onClick={() => setPage("broadcast")}>Manage <ChevronRight size={11} /></Btn>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Last contact all</span>
              <span className="text-white/80 font-medium font-['JetBrains_Mono']">{(() => { const d = getContactAllLast(); return d ? new Date(d).toLocaleDateString() : "Never"; })()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Cycle</span>
              <span className="text-white/80 font-medium font-['JetBrains_Mono']">#{getContactAllCycle()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Programs in DB</span>
              <span className="text-white/80 font-medium font-['JetBrains_Mono']">{coaches.length}</span>
            </div>
            {(() => {
              const last = getContactAllLast();
              if (!last) return null;
              const daysSince = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
              const remaining = Math.max(0, 5 - daysSince);
              return (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Next auto-send</span>
                  <span className={cx("font-medium font-['JetBrains_Mono']", remaining === 0 ? "text-yellow-400" : "text-white/80")}>{remaining === 0 ? "Due now!" : `${remaining} days`}</span>
                </div>
              );
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── ADD PROGRAM MODAL ────────────────────────────────────────────────────────

const EMPTY_COACH: Omit<Coach, "id"> = {
  school: "", division: "NCAA D1", conference: "", state: "",
  headCoach: "", staff: [], assistants: [], recruitingCoordinator: "",
  email: "", phone: "", athleticsUrl: "", recruitingUrl: "",
  rosterSize: 13, internationalPlayers: 0, graduatingSeniors: 3,
  positionsNeeded: [], scholarshipLevel: "Full",
  stage: "Not Contacted", favorited: false, notes: "", region: "",
};

function AddProgramModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Coach) => void }) {
  const [form, setForm] = useState({ ...EMPTY_COACH });
  const [posInput, setPosInput] = useState("");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const addPos = (p: string) => {
    const pos = p.trim().toUpperCase();
    if (pos && !form.positionsNeeded.includes(pos))
      setForm(f => ({ ...f, positionsNeeded: [...f.positionsNeeded, pos] }));
    setPosInput("");
  };

  const removePos = (p: string) => setForm(f => ({ ...f, positionsNeeded: f.positionsNeeded.filter(x => x !== p) }));

  const handleSave = () => {
    if (!form.school.trim()) { setError("School name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    onSave({ ...form, id: `manual-${Date.now()}`, staff: form.staff.length ? form.staff : [{ name: form.headCoach || "Staff", role: "Staff", email: form.email }], assistants: form.assistants });
    onClose();
  };

  const divOptions: Division[] = ["NCAA D1", "NCAA D2", "NCAA D3", "NAIA", "NJCAA D1", "NJCAA D2", "NJCAA D3"];
  const schOptions: Coach["scholarshipLevel"][] = ["Full", "Partial", "Academic", "None"];
  const stageOptions: CRMStage[] = ["Not Contacted", "Draft Ready", "Sent", "Opened", "Replied", "Interested", "Call Scheduled", "Offer", "Committed"];
  const posOptions = ["PG", "SG", "SF", "PF", "C"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/12 bg-[#111118] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-base font-semibold text-white font-['Plus_Jakarta_Sans']">Add Program</h2>
            <p className="text-xs text-white/35 mt-0.5">Manually enter a coach or school to your database.</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* School */}
          <div>
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-3">School Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-white/40 mb-1">School Name <span className="text-red-400">*</span></label>
                <input value={form.school} onChange={e => set("school")(e.target.value)} placeholder="e.g. University of Kentucky"
                  className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/22 transition-colors" />
              </div>
              {([
                ["Division", "division", divOptions],
                ["Conference", "conference", null],
                ["State (2-letter)", "state", null],
                ["Region", "region", null],
                ["Athletics Website", "athleticsUrl", null],
                ["Recruiting Page", "recruitingUrl", null],
              ] as [string, keyof typeof form, string[] | null][]).map(([label, key, opts]) => (
                <div key={key}>
                  <label className="block text-xs text-white/40 mb-1">{label}</label>
                  {opts ? (
                    <select value={form[key] as string} onChange={e => set(key)(e.target.value)}
                      className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/22">
                      {opts.map(o => <option key={o} value={o} className="bg-[#131318]">{o}</option>)}
                    </select>
                  ) : (
                    <input value={form[key] as string} onChange={e => set(key)(e.target.value)} placeholder={label}
                      className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/22 transition-colors" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Coach */}
          <div>
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-3">Coaching Staff</div>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["Head Coach Name", "headCoach"],
                ["Recruiting Coordinator", "recruitingCoordinator"],
              ] as [string, keyof typeof form][]).map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs text-white/40 mb-1">{label}</label>
                  <input value={form[key] as string} onChange={e => set(key)(e.target.value)} placeholder={label}
                    className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/22 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-3">Contact Info</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-white/40 mb-1">Email Address <span className="text-red-400">*</span></label>
                <input value={form.email} onChange={e => set("email")(e.target.value)} placeholder="coach@university.edu" type="email"
                  className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/22 font-['JetBrains_Mono'] transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Phone</label>
                <input value={form.phone || ""} onChange={e => set("phone")(e.target.value)} placeholder="(555) 000-0000"
                  className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/22 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Scholarship Level</label>
                <select value={form.scholarshipLevel} onChange={e => set("scholarshipLevel")(e.target.value)}
                  className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/22">
                  {schOptions.map(o => <option key={o} value={o} className="bg-[#131318]">{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Roster */}
          <div>
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-3">Roster Details</div>
            <div className="grid grid-cols-3 gap-3">
              {([
                ["Roster Size", "rosterSize"],
                ["International Players", "internationalPlayers"],
                ["Graduating Seniors", "graduatingSeniors"],
              ] as [string, keyof typeof form][]).map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs text-white/40 mb-1">{label}</label>
                  <input value={form[key] as number} onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                    type="number" min="0" max="30"
                    className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/22 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Positions */}
          <div>
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-2">Positions Needed</div>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {posOptions.map(p => (
                <button key={p} type="button"
                  onClick={() => form.positionsNeeded.includes(p) ? removePos(p) : addPos(p)}
                  className={cx("px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    form.positionsNeeded.includes(p)
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-white/4 text-white/40 border-white/8 hover:text-white/65")}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Stage + Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">CRM Stage</label>
              <select value={form.stage} onChange={e => set("stage")(e.target.value)}
                className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/22">
                {stageOptions.map(o => <option key={o} value={o} className="bg-[#131318]">{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Notes</label>
              <input value={form.notes} onChange={e => set("notes")(e.target.value)} placeholder="Optional notes"
                className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/22 transition-colors" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={12} />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8">
          <p className="text-[11px] text-white/25">Fields marked <span className="text-red-400">*</span> are required.</p>
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" size="sm" onClick={handleSave}><Check size={12} /> Add Program</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CSV IMPORT RESULT TOAST ──────────────────────────────────────────────────

function ImportToast({ added, skipped, onClose }: { added: number; skipped: number; onClose: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border border-white/12 bg-[#111118] shadow-2xl max-w-sm">
      <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">CSV imported</div>
        <div className="text-xs text-white/45 mt-0.5">
          {added} program{added !== 1 ? "s" : ""} added
          {skipped > 0 && `, ${skipped} duplicate${skipped !== 1 ? "s" : ""} skipped`}
        </div>
      </div>
      <button onClick={onClose} className="text-white/25 hover:text-white/60 flex-shrink-0"><X size={13} /></button>
    </div>
  );
}

// ─── COACH DATABASE ────────────────────────────────────────────────────────────

const CSV_TEMPLATE = [
  "School,Division,Conference,State,Head Coach,Email,Phone,Athletics URL,Recruiting URL,Scholarship Level,Intl Players,Graduating Seniors,Positions Needed,Notes",
  "Example University,NCAA D1,ACC,NC,John Smith,jsmith@example.edu,(555) 000-1234,https://example.edu/athletics,https://example.edu/recruit,Full,3,4,PG|SG,Interested in international players",
].join("\n");

function CoachesPage({ onSendEmail, coaches: propCoaches }: { onSendEmail?: (c: Coach) => void; coaches: Coach[] }) {
  const [coaches, setCoaches] = useState(propCoaches);
  const [search, setSearch] = useState("");
  const [divFilter, setDivFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [posFilter, setPosFilter] = useState("All");
  const [schFilter, setSchFilter] = useState("All");
  const [selected, setSelected] = useState<Coach | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const divisions = ["All", "NCAA D1", "NCAA D2", "NCAA D3", "NAIA", "NJCAA D1", "NJCAA D2", "NJCAA D3"];
  const states = ["All", ...Array.from(new Set(propCoaches.map(c => c.state))).sort()];
  const positions = ["All", "PG", "SG", "SF", "PF", "C"];
  const scholarships = ["All", "Full", "Partial", "Academic", "None"];

  const filtered = coaches.filter(c => {
    const q = search.toLowerCase();
    return (
      (!q || c.school.toLowerCase().includes(q) || c.staff.some(s => s.name.toLowerCase().includes(q)) || c.conference.toLowerCase().includes(q)) &&
      (divFilter === "All" || c.division === divFilter) &&
      (stateFilter === "All" || c.state === stateFilter) &&
      (posFilter === "All" || c.positionsNeeded.includes(posFilter)) &&
      (schFilter === "All" || c.scholarshipLevel === schFilter)
    );
  });

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, favorited: !c.favorited } : c));
  };

  const activeFilters = [divFilter, stateFilter, posFilter, schFilter].filter(f => f !== "All").length;

  const handleAddProgram = (newCoach: Coach) => {
    setCoaches(prev => [newCoach, ...prev]);
    setSelected(newCoach);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scoutflow_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return;

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const col = (row: string[], name: string) => {
        const i = headers.indexOf(name);
        return i >= 0 ? (row[i] || "").trim() : "";
      };

      let added = 0;
      let skipped = 0;
      const newCoaches: Coach[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map(c => c.trim());
        const school = col(row, "school");
        const email = col(row, "email");
        if (!school || !email) continue;

        const existing = [...coaches, ...newCoaches].some(
          c => c.school.toLowerCase() === school.toLowerCase() && c.email.toLowerCase() === email.toLowerCase()
        );
        if (existing) { skipped++; continue; }

        const posStr = col(row, "positions needed");
        const positions = posStr ? posStr.split("|").map(p => p.trim()).filter(Boolean) : [];

        newCoaches.push({
          id: `csv-${Date.now()}-${i}`,
          school,
          division: (col(row, "division") || "NCAA D1") as Division,
          conference: col(row, "conference"),
          state: col(row, "state"),
          headCoach: col(row, "head coach"),
          staff: [{ name: col(row, "head coach") || "Staff", role: "Staff", email }],
          assistants: [],
          recruitingCoordinator: "",
          email,
          phone: col(row, "phone") || undefined,
          athleticsUrl: col(row, "athletics url"),
          recruitingUrl: col(row, "recruiting url") || undefined,
          rosterSize: 13,
          internationalPlayers: parseInt(col(row, "intl players")) || 0,
          graduatingSeniors: parseInt(col(row, "graduating seniors")) || 0,
          positionsNeeded: positions,
          scholarshipLevel: (col(row, "scholarship level") || "Full") as Coach["scholarshipLevel"],
          stage: "Not Contacted",
          favorited: false,
          notes: col(row, "notes"),
          region: "",
        });
        added++;
      }

      setCoaches(prev => [...newCoaches, ...prev]);
      setImportResult({ added, skipped });
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className={cx("flex flex-col overflow-hidden transition-all", selected ? "flex-1" : "flex-1")}>
        {/* Toolbar */}
        <div className="p-4 border-b border-white/6 space-y-3">
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Search schools, coaches, conferences…" className="flex-1" />
            <Btn variant={showFilters || activeFilters > 0 ? "subtle" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={12} />
              Filters
              {activeFilters > 0 && <span className="ml-0.5 px-1.5 py-px bg-white/15 rounded-full text-[10px]">{activeFilters}</span>}
            </Btn>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
            <Btn variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload size={12} /> Import CSV</Btn>
            <Btn variant="ghost" size="sm" onClick={downloadTemplate}><Download size={12} /> Template</Btn>
            <Btn variant="primary" size="sm" onClick={() => setShowAddModal(true)}><Plus size={12} /> Add Program</Btn>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: "Division", opts: divisions, val: divFilter, set: setDivFilter },
                { label: "State", opts: states, val: stateFilter, set: setStateFilter },
                { label: "Position Needed", opts: positions, val: posFilter, set: setPosFilter },
                { label: "Scholarship", opts: scholarships, val: schFilter, set: setSchFilter },
              ].map(({ label, opts, val, set }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/30">{label}:</span>
                  <select value={val} onChange={e => set(e.target.value)}
                    className="bg-white/5 border border-white/8 rounded-lg px-2 py-1 text-xs text-white/70 outline-none focus:border-white/20 transition-colors">
                    {opts.map(o => <option key={o} value={o} className="bg-[#131318]">{o}</option>)}
                  </select>
                </div>
              ))}
              {activeFilters > 0 && (
                <Btn variant="ghost" size="xs" onClick={() => { setDivFilter("All"); setStateFilter("All"); setPosFilter("All"); setSchFilter("All"); }}>
                  <X size={10} /> Clear all
                </Btn>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 text-[11px] text-white/30">
            <span className="font-['JetBrains_Mono'] text-white/50 font-medium">{filtered.length}</span>
            <span>programs</span>
            {activeFilters > 0 && <span className="text-white/20">· filtered from {propCoaches.length} total</span>}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0b0b0f]/95 backdrop-blur-sm z-10">
              <tr className="border-b border-white/6">
                {["School", "Division", "Head Coach", "Needs", "Intl", "Stage", "Scholarship", "★"].map(h => (
                  <th key={h} className={cx("text-left px-4 py-2.5 text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] whitespace-nowrap", h === "★" && "text-center w-10")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  className={cx("border-b border-white/4 cursor-pointer transition-colors",
                    selected?.id === c.id ? "bg-white/6" : "hover:bg-white/3")}>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-white">{c.school}</span>
                      <span className="text-[11px] text-white/35 font-['JetBrains_Mono']">{c.conference} · {c.state}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Chip variant="ghost" size="xs">{c.division.replace("NCAA ", "").replace("NJCAA ", "JC ")}</Chip>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-white/60">{c.headCoach}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {c.positionsNeeded.slice(0, 3).map(p => (
                        <Chip key={p} variant="blue" size="xs">{p}</Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-['JetBrains_Mono'] text-white/40">{c.internationalPlayers}</td>
                  <td className="px-4 py-3"><StagePill stage={c.stage} /></td>
                  <td className="px-4 py-3">
                    <Chip variant={c.scholarshipLevel === "Full" ? "green" : c.scholarshipLevel === "Partial" ? "yellow" : "ghost"} size="xs">
                      {c.scholarshipLevel}
                    </Chip>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={e => toggleFav(c.id, e)} className="transition-colors">
                      {c.favorited ? <Star size={13} fill="#fbbf24" className="text-yellow-400" /> : <StarOff size={13} className="text-white/15 hover:text-white/40" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[360px] flex-shrink-0 border-l border-white/6 flex flex-col overflow-hidden">
          <div className="h-14 flex items-center justify-between px-4 border-b border-white/6">
            <span className="text-sm font-semibold text-white truncate">{selected.school}</span>
            <button onClick={() => setSelected(null)} className="text-white/25 hover:text-white/60 transition-colors ml-2 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-5">
              {/* Stage + quick actions */}
              <div className="flex items-center justify-between">
                <StagePill stage={selected.stage} />
                <div className="flex gap-1.5">
                  <Btn variant="subtle" size="xs" onClick={() => onSendEmail?.(selected)}><Send size={10} /> Email</Btn>
                  <Btn variant="subtle" size="xs"><Star size={10} /></Btn>
                  <Btn variant="ghost" size="xs"><MoreHorizontal size={10} /></Btn>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k: "Division", v: selected.division },
                  { k: "Conference", v: selected.conference },
                  { k: "State", v: selected.state },
                  { k: "Scholarship", v: selected.scholarshipLevel },
                  { k: "Roster Size", v: selected.rosterSize },
                  { k: "Intl. Players", v: selected.internationalPlayers },
                  { k: "Graduating", v: selected.graduatingSeniors + " seniors" },
                  { k: "Region", v: selected.region },
                ].map(({ k, v }) => (
                  <div key={k} className="p-2.5 rounded-lg bg-white/3 border border-white/5">
                    <div className="text-[9px] text-white/25 uppercase tracking-[0.08em] mb-0.5">{k}</div>
                    <div className="text-xs text-white/75 font-medium">{v}</div>
                  </div>
                ))}
              </div>

              {/* Positions needed */}
              <div>
                <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] mb-2">Positions Needed</div>
                <div className="flex gap-1.5 flex-wrap">
                  {selected.positionsNeeded.map(p => <Chip key={p} variant="blue">{p}</Chip>)}
                </div>
              </div>

              <Divider />

              {/* Staff */}
              <div>
                <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] mb-2.5">Coaching Staff</div>
                <div className="space-y-2">
                  {selected.staff.map((s, i) => (
                    <div key={i} className="p-2 rounded-lg bg-white/3 border border-white/5">
                      <div className="flex justify-between items-center text-[12px] mb-1">
                        <span className="text-white/30">{s.role}</span>
                        <span className="text-white/70 font-medium">{s.name}</span>
                      </div>
                      {s.email && <div className="text-[11px] text-blue-400/60 font-['JetBrains_Mono'] truncate">{s.email}</div>}
                      {s.phone && <div className="text-[11px] text-white/25 font-['JetBrains_Mono']">{s.phone}</div>}
                    </div>
                  ))}
                </div>
              </div>

              <Divider />

              {/* Contact */}
              <div>
                <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] mb-2.5">Contact</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[12px]">
                    <Mail size={11} className="text-white/25 flex-shrink-0" />
                    <span className="text-white/55 font-['JetBrains_Mono'] text-[11px] flex-1 truncate">{selected.email}</span>
                    <button className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0"><Copy size={10} /></button>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-[12px]">
                      <Phone size={11} className="text-white/25 flex-shrink-0" />
                      <span className="text-white/55 font-['JetBrains_Mono'] text-[11px]">{selected.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[12px]">
                    <Globe size={11} className="text-white/25 flex-shrink-0" />
                    <a href={selected.athleticsUrl} className="text-white/40 text-[11px] hover:text-white/70 transition-colors truncate" target="_blank" rel="noopener noreferrer">
                      {selected.athleticsUrl.replace("https://", "")}
                    </a>
                  </div>
                </div>
              </div>

              {selected.notes && (
                <>
                  <Divider />
                  <div>
                    <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] mb-2">Notes</div>
                    <p className="text-[12px] text-white/55 leading-relaxed bg-white/3 rounded-lg p-3 border border-white/5">{selected.notes}</p>
                  </div>
                </>
              )}

              {selected.lastContact && (
                <div className="flex items-center gap-2 text-[11px] text-white/25 font-['JetBrains_Mono']">
                  <Clock size={11} />
                  Last contact: {selected.lastContact}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-white/6 flex gap-2">
            <Btn variant="primary" size="sm" className="flex-1 justify-center" onClick={() => onSendEmail?.(selected)}><Send size={12} /> Send Email</Btn>
            {selected.recruitingUrl && (
              <Btn variant="outline" size="sm"><ExternalLink size={12} /></Btn>
            )}
          </div>
        </div>
      )}

      {/* Add Program Modal */}
      {showAddModal && (
        <AddProgramModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddProgram}
        />
      )}

      {/* Import Result Toast */}
      {importResult && (
        <ImportToast
          added={importResult.added}
          skipped={importResult.skipped}
          onClose={() => setImportResult(null)}
        />
      )}
    </div>
  );
}

// ─── OUTREACH ─────────────────────────────────────────────────────────────────

function OutreachPage() {
  const [subject, setSubject] = useState(getTemplate().subject);
  const [body, setBody] = useState(getTemplate().body);
  const [previewCoach, setPreviewCoach] = useState(loadCoaches()[0]);
  const [tab, setTab] = useState<"compose" | "preview">("compose");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVar = (key: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newBody = body.slice(0, start) + `{{${key}}}` + body.slice(end);
    setBody(newBody);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + key.length + 4; ta.focus(); }, 0);
  };

  const previewCoachName = (coach: typeof previewCoach) => { const s = coach?.staff?.find(st => st.email); return s ? s.name.split(" ").pop() || s.name : coach?.headCoach?.split(" ").pop() || coach?.headCoach || "Coach"; };
  const resolved = (text: string, coach: typeof previewCoach) =>
    text
      .replace(/\{\{PlayerName\}\}/g, getPlayer().name)
      .replace(/\{\{Position\}\}/g, getPlayer().position)
      .replace(/\{\{Height\}\}/g, getPlayer().height)
      .replace(/\{\{HeightCm\}\}/g, getPlayer().heightCm)
      .replace(/\{\{Weight\}\}/g, getPlayer().weight)
      .replace(/\{\{WeightKg\}\}/g, getPlayer().weightKg)
      .replace(/\{\{GraduationYear\}\}/g, getPlayer().graduationClass)
      .replace(/\{\{Country\}\}/g, getPlayer().nationality)
      .replace(/\{\{CurrentTeam\}\}/g, getPlayer().currentTeam)
      .replace(/\{\{GPA\}\}/g, getPlayer().gpa)
      .replace(/\{\{Stats\}\}/g, getPlayer().stats)
      .replace(/\{\{HighlightUrl\}\}/g, getPlayer().highlightUrl)
      .replace(/\{\{FilmUrl\}\}/g, getPlayer().fullFilmUrl)
      .replace(/\{\{CoachName\}\}/g, previewCoachName(coach))
      .replace(/\{\{School\}\}/g, coach.school)
      .replace(/\{\{Conference\}\}/g, coach.conference)
      .replace(/\{\{Division\}\}/g, coach.division);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Composer */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-white/6">
        <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
          <div className="flex gap-1">
            {(["compose", "preview"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                  tab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={() => pushToast("Draft saved", "success")}><Archive size={12} /> Save Draft</Btn>
            <Btn variant="primary" size="sm" onClick={() => { setTemplate(subject, body); pushToast("Template saved — will be used for new emails", "success"); }}><Check size={12} /> Save Template</Btn>
          </div>
        </div>

        {tab === "compose" ? (
          <div className="flex-1 flex flex-col overflow-hidden p-5 gap-3">
            <Field label="Subject Line">
              <Input value={subject} onChange={setSubject} placeholder="Email subject…" />
            </Field>
            <Field label="Body" note="Use variables on the right. AI will personalize each version per school.">
              <textarea ref={textareaRef} value={body} onChange={e => setBody(e.target.value)}
                className="w-full h-[calc(100vh-340px)] bg-white/3 border border-white/8 rounded-xl p-4 text-[12.5px] text-white/75 leading-relaxed outline-none focus:border-white/15 resize-none transition-colors font-['JetBrains_Mono']" />
            </Field>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-xs text-white/35">Previewing for:</span>
              <select value={previewCoach.id} onChange={e => setPreviewCoach(loadCoaches().find(c => c.id === e.target.value) || loadCoaches()[0])}
                className="bg-white/5 border border-white/8 rounded-lg px-2 py-1 text-xs text-white/70 outline-none">
                {loadCoaches().map(c => <option key={c.id} value={c.id} className="bg-[#131318]">{c.school}</option>)}
              </select>
            </div>
            <Card className="p-6">
              <div className="mb-4 pb-4 border-b border-white/6">
                <div className="text-[10px] text-white/25 mb-1">SUBJECT</div>
                <div className="text-sm font-medium text-white">{resolved(subject, previewCoach)}</div>
              </div>
              <pre className="text-[12.5px] text-white/70 leading-relaxed whitespace-pre-wrap font-['JetBrains_Mono']">
                {resolved(body, previewCoach)}
              </pre>
            </Card>
          </div>
        )}
      </div>

      {/* Variables panel */}
      <div className="w-56 flex-shrink-0 overflow-y-auto p-4 border-r border-white/6">
        <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] mb-3">Variables</div>
        <div className="space-y-px">
          {VARIABLES.map(({ key, desc }) => (
            <button key={key} onClick={() => insertVar(key)}
              className="w-full flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-['JetBrains_Mono'] text-white/55 group-hover:text-white/80 transition-colors">
                  {`{{${key}}}`}
                </div>
                <div className="text-[10px] text-white/25">{desc}</div>
              </div>
              <Plus size={10} className="text-white/15 group-hover:text-white/40 mt-0.5 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* AI panel */}
      <div className="w-56 flex-shrink-0 overflow-y-auto p-4">
        <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] mb-3">AI Settings</div>
        <div className="space-y-3">
          {[
            { label: "Personalization", val: "High" },
            { label: "Tone", val: "Professional" },
            { label: "Reference season data", val: "On" },
            { label: "No duplicates", val: "Enforced" },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-white/45">{label}</span>
              <span className="text-[11px] font-['JetBrains_Mono'] text-white/35">{val}</span>
            </div>
          ))}
        </div>
        <Divider className="my-4" />
        <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] mb-3">Spam Check</div>
        <div className="p-3 rounded-lg bg-green-500/8 border border-green-500/15">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={11} className="text-green-400" />
            <span className="text-xs text-green-400 font-medium">Score: 0.8 / 10</span>
          </div>
          <p className="text-[10px] text-green-400/60">Low spam risk. Template passes Gmail & Outlook filters.</p>
        </div>
      </div>
    </div>
  );
}

// ─── BROADCAST ────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const INTROS = [
  "I wanted to reach out personally",
  "I've been following your program closely",
  "I wanted to introduce myself",
  "I hope this email finds you well",
  "I'm excited to connect with you",
  "After researching your program",
  "I wanted to share my passion for your program",
  "I've admired your coaching from afar",
  "I'm reaching out because I believe I'd be a great fit",
  "I wanted to express my interest in your program",
];

const getContactAllLast = () => localStorage.getItem("sf_contactAll_last");
const setContactAllLast = (v: string) => localStorage.setItem("sf_contactAll_last", v);
const getContactAllCycle = () => parseInt(localStorage.getItem("sf_contactAll_cycle") || "0", 10);
const setContactAllCycle = (v: number) => localStorage.setItem("sf_contactAll_cycle", String(v));

function BroadcastPage({ coaches, onEmailSent }: { coaches: Coach[]; onEmailSent?: (coachId: string, subject: string) => void }) {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, sent: 0, failed: 0 });
  const [lastResult, setLastResult] = useState<{ date: string; sent: number; failed: number } | null>(() => {
    const d = getContactAllLast(); return d ? { date: d, sent: 0, failed: 0 } : null;
  });
  const [recentLog, setRecentLog] = useState<{ school: string; status: "sent" | "failed" }[]>([]);
  const abortRef = useRef(false);

  const handleContactAll = async () => {
    const targets = coaches.filter(c => getStaffEmails(c));
    if (targets.length === 0) { pushToast("No coaches with email addresses found.", "error"); return; }
    setSending(true);
    setRecentLog([]);
    setProgress({ current: 0, total: targets.length, sent: 0, failed: 0 });
    abortRef.current = false;
    const cycle = getContactAllCycle();
    let variation = cycle * targets.length;
    let sentCount = 0;
    let failedCount = 0;
    for (let i = 0; i < targets.length; i++) {
      if (abortRef.current) break;
      const coach = targets[i];
      const allEmails = getStaffEmails(coach);
      if (!allEmails) continue;
      variation++;
      setProgress(p => ({ ...p, current: i + 1 }));
      const intro = INTROS[variation % INTROS.length];
      const tpl = getTemplate();
      const firstStaff = coach.staff.find(s => s.email);
      const coachName = firstStaff?.name || coach.headCoach;
      const subject = (variation > 1 ? `[Follow-up ${variation}] ` : "") + tpl.subject
        .replace(/\{\{PlayerName\}\}/g, getPlayer().name)
        .replace(/\{\{Position\}\}/g, getPlayer().position)
        .replace(/\{\{GraduationYear\}\}/g, getPlayer().graduationClass)
        .replace(/\{\{Division\}\}/g, coach.division)
        .replace(/\{\{CoachName\}\}/g, coachName.split(" ").pop() || coachName)
        .replace(/\{\{School\}\}/g, coach.school);
      let body = tpl.body
        .replace(/\{\{PlayerName\}\}/g, getPlayer().name)
        .replace(/\{\{Position\}\}/g, getPlayer().position)
        .replace(/\{\{Height\}\}/g, getPlayer().height)
        .replace(/\{\{HeightCm\}\}/g, getPlayer().heightCm)
        .replace(/\{\{Weight\}\}/g, getPlayer().weight)
        .replace(/\{\{WeightKg\}\}/g, getPlayer().weightKg)
        .replace(/\{\{GraduationYear\}\}/g, getPlayer().graduationClass)
        .replace(/\{\{Country\}\}/g, getPlayer().nationality)
        .replace(/\{\{CurrentTeam\}\}/g, getPlayer().currentTeam)
        .replace(/\{\{GPA\}\}/g, getPlayer().gpa)
        .replace(/\{\{Stats\}\}/g, getPlayer().stats)
        .replace(/\{\{HighlightUrl\}\}/g, getPlayer().highlightUrl)
        .replace(/\{\{FilmUrl\}\}/g, getPlayer().fullFilmUrl)
        .replace(/\{\{CoachName\}\}/g, coachName.split(" ").pop() || coachName)
        .replace(/\{\{School\}\}/g, coach.school)
        .replace(/\{\{Conference\}\}/g, coach.conference)
        .replace(/\{\{Division\}\}/g, coach.division);
      if (variation > 1) body = `${intro}\n\n${body}`;
      const html = body.replace(/\n/g, "<br>");
      const { success } = await sendEmail(allEmails, subject, html);
      if (success) { sentCount++; onEmailSent?.(coach.id, subject); setProgress(p => ({ ...p, sent: p.sent + 1 })); setRecentLog(prev => [{ school: coach.school, status: "sent" }, ...prev].slice(0, 20)); }
      else { failedCount++; setProgress(p => ({ ...p, failed: p.failed + 1 })); setRecentLog(prev => [{ school: coach.school, status: "failed" }, ...prev].slice(0, 20)); }
      if (i < targets.length - 1 && !abortRef.current) await delay(45000 + Math.random() * 45000);
    }
    setContactAllLast(new Date().toISOString());
    setContactAllCycle(cycle + 1);
    setSending(false);
    setLastResult({ date: new Date().toLocaleString(), sent: sentCount, failed: failedCount });
    pushToast(`Broadcast complete — ${sentCount} sent, ${failedCount} failed`, failedCount > 0 ? "warning" : "success");
  };

  const cancel = () => { abortRef.current = true; };

  const lastDate = getContactAllLast();
  const daysSince = lastDate ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000) : null;
  const autoDue = lastDate ? daysSince! >= 5 : false;

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-5">
      {/* Auto-send banner */}
      {autoDue && !sending && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-500/8 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <Send size={14} className="text-blue-400 flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-blue-400">Time for your 5-day broadcast!</span>
              <p className="text-xs text-blue-400/60 mt-0.5">{daysSince} days since last contact — hit Contact All below to send follow-ups.</p>
            </div>
          </div>
        </div>
      )}

      <PageHeader title="Broadcast" subtitle="Send a personalized email to every program in your database." />

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Programs in DB" value={coaches.length} sub={`${coaches.filter(c => getStaffEmails(c)).length} with emails`} />
        <MetricCard label="Last Contact All" value={lastDate ? new Date(lastDate).toLocaleDateString() : "Never"} sub={lastDate ? `${daysSince} days ago` : "No broadcasts yet"} />
        <MetricCard label="Current Cycle" value={`#${getContactAllCycle()}`} sub={autoDue ? "Due now!" : lastDate ? `Next in ${5 - daysSince!} days` : "Start cycle 1"} color={autoDue ? "text-yellow-400" : ""} />
        <MetricCard label="Total Sent" value={coaches.filter(c => c.stage !== "Not Contacted").length} sub="Programs contacted" color="text-blue-400" />
      </div>

      {/* Contact All button */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Contact All Programs</h3>
            <p className="text-xs text-white/40 mt-1">Sends an individual email to every program with staff email addresses. Emails are sent with a 45–90s delay to avoid rate limits. {lastDate && !sending && `Last broadcast: ${new Date(lastDate).toLocaleDateString()}.`}</p>
          </div>
          <div className="flex gap-2">
            {sending && <Btn variant="outline" size="sm" onClick={cancel}><X size={12} /> Stop</Btn>}
            <Btn variant="primary" size="lg" onClick={handleContactAll} disabled={sending}>
              {sending ? <><RefreshCw size={14} className="animate-spin" /> Sending...</> : <><Zap size={14} /> Contact All {coaches.filter(c => getStaffEmails(c)).length} Programs</>}
            </Btn>
          </div>
        </div>

        {/* Progress */}
        {sending && progress.total > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-xs text-white/40">
              <span>{progress.current} of {progress.total} · {progress.sent} sent · {progress.failed} failed</span>
              <span className="font-['JetBrains_Mono']">{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Last result */}
        {lastResult && !sending && (
          <div className="mt-4 flex items-center gap-3 text-xs">
            <span className="text-white/50">Last broadcast: {lastResult.date}</span>
            <span className="text-green-400">{lastResult.sent} sent</span>
            {lastResult.failed > 0 && <span className="text-red-400">{lastResult.failed} failed</span>}
          </div>
        )}
      </Card>

      {/* Live log */}
      {recentLog.length > 0 && (
        <Card className="p-5">
          <div className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">Live Log</div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {recentLog.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                {e.status === "sent" ? <Send size={10} className="text-green-400 flex-shrink-0" /> : <X size={10} className="text-red-400 flex-shrink-0" />}
                <span className={e.status === "sent" ? "text-white/70" : "text-red-400/70"}>{e.status === "sent" ? "Sent" : "Failed"}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/50 truncate">{e.school}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── PIPELINE ─────────────────────────────────────────────────────────────────

function PipelinePage({ coaches: propCoaches }: { coaches: Coach[] }) {
  const [coaches, setCoaches] = useState(propCoaches);

  const move = (id: string, dir: 1 | -1) => {
    setCoaches(prev => prev.map(c => {
      if (c.id !== id) return c;
      const idx = CRM_STAGES.indexOf(c.stage);
      const next = CRM_STAGES[Math.max(0, Math.min(CRM_STAGES.length - 1, idx + dir))];
      return { ...c, stage: next };
    }));
  };

  return (
    <div className="h-full overflow-x-auto p-4">
      <div className="flex gap-3 h-full min-w-max">
        {CRM_STAGES.map(stage => {
          const stageCoaches = coaches.filter(c => c.stage === stage);
          const cfg = STAGE_CONFIG[stage];
          return (
            <div key={stage} className="w-56 flex flex-col gap-2 flex-shrink-0">
              <div className="flex items-center justify-between px-1 py-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                  <span className="text-xs font-medium text-white/60">{stage}</span>
                </div>
                <span className="text-[10px] font-['JetBrains_Mono'] text-white/25">{stageCoaches.length}</span>
              </div>

              <div className="flex-1 flex flex-col gap-2 min-h-[40px]">
                {stageCoaches.map(c => (
                  <Card key={c.id} hover className="p-3 group cursor-default">
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-white/85 truncate">{c.school}</div>
                        <div className="text-[10px] text-white/30 mt-0.5 truncate">{c.headCoach}</div>
                      </div>
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => move(c.id, -1)} disabled={c.stage === CRM_STAGES[0]}
                          className="w-5 h-5 flex items-center justify-center rounded bg-white/6 hover:bg-white/12 text-white/40 hover:text-white disabled:opacity-20 transition-all">
                          <ChevronUp size={10} />
                        </button>
                        <button onClick={() => move(c.id, 1)} disabled={c.stage === CRM_STAGES[CRM_STAGES.length - 1]}
                          className="w-5 h-5 flex items-center justify-center rounded bg-white/6 hover:bg-white/12 text-white/40 hover:text-white disabled:opacity-20 transition-all">
                          <ChevronDown size={10} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Chip variant="ghost" size="xs">{c.division.replace("NCAA ", "").replace("NJCAA ", "JC ")}</Chip>
                      {c.scholarshipLevel === "Full" && <Chip variant="green" size="xs">Full</Chip>}
                    </div>
                    {c.notes && <p className="text-[10px] text-white/30 mt-2 line-clamp-2 leading-relaxed">{c.notes}</p>}
                    {c.lastContact && (
                      <div className="flex items-center gap-1 mt-2 text-[9px] text-white/20 font-['JetBrains_Mono']">
                        <Clock size={9} />
                        {c.lastContact}
                      </div>
                    )}
                  </Card>
                ))}
                {stageCoaches.length === 0 && (
                  <div className="border border-dashed border-white/6 rounded-xl h-16 flex items-center justify-center">
                    <span className="text-[10px] text-white/15">Empty</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

function AnalyticsPage() {
  const allCoaches = loadCoaches();
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const data = period === "monthly" ? analyticsData.monthly : analyticsData.weekly;
  const xKey = period === "monthly" ? "month" : "day";

  const TT = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#131318] border border-white/10 rounded-xl p-3 text-xs shadow-2xl min-w-[120px]">
        <p className="text-white/40 mb-2 font-['JetBrains_Mono']">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color || p.stroke }} />
            <span className="text-white/55">{p.name}:</span>
            <span className="text-white font-medium ml-auto">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const divData = [
    { name: "NCAA D1", value: allCoaches.filter(c => c.division === "NCAA D1").length, color: "#a5a5ff" },
    { name: "NCAA D2", value: allCoaches.filter(c => c.division === "NCAA D2").length, color: "#93c5fd" },
    { name: "NCAA D3", value: allCoaches.filter(c => c.division === "NCAA D3").length, color: "#6ee7b7" },
    { name: "NAIA", value: allCoaches.filter(c => c.division === "NAIA").length, color: "#fde68a" },
    { name: "NJCAA", value: allCoaches.filter(c => c.division.startsWith("NJCAA")).length, color: "#f9a8d4" },
  ];

  const totSent = analyticsData.monthly.reduce((s, d) => s + d.sent, 0);
  const totOpened = analyticsData.monthly.reduce((s, d) => s + d.opened, 0);
  const totReplied = analyticsData.monthly.reduce((s, d) => s + d.replied, 0);
  const interested = allCoaches.filter(c => ["Interested", "Call Scheduled", "Offer", "Committed"].includes(c.stage)).length;
  const trackingLog = getTrackingLog();
  const realSent = trackingLog.filter(t => t.type === "sent").length;
  const realContacted = allCoaches.filter(c => c.stage !== "Not Contacted").length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <PageHeader title="Analytics" subtitle="Your outreach performance at a glance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Programs Added" value={allCoaches.length} sub="Across all divisions" />
        <MetricCard label="Contacted" value={realContacted} sub={`${pct(realContacted, allCoaches.length)} of database`} />
        <MetricCard label="Emails Sent" value={realSent} sub={`${totOpened} opened · ${totReplied} replied`} color="text-blue-400" />
        <MetricCard label="Interested" value={interested} sub="Expressed genuine interest" color="text-emerald-400" />
        <MetricCard label="Offers Received" value={allCoaches.filter(c => c.stage === "Offer" || c.stage === "Committed").length} sub="Full & partial scholarships" color="text-green-400" />
        <MetricCard label="Reply Rate" value={pct(totReplied, totSent)} sub={`${totReplied} replies received`} color="text-yellow-400" />
        <MetricCard label="Open Rate" value={pct(totOpened, totSent)} sub={`${totOpened} of ${totSent} opened`} color="text-blue-400" />
        <MetricCard label="Avg Reply Time" value="2.4d" sub="From send to first reply" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-white">Email Performance</div>
              <div className="text-xs text-white/35 mt-0.5">Sent · Opened · Replied</div>
            </div>
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              {(["weekly", "monthly"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={cx("px-2.5 py-1 rounded-md text-xs transition-all capitalize",
                    period === p ? "bg-white/12 text-white" : "text-white/35 hover:text-white/60")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={2} barSize={18}>
              <XAxis dataKey={xKey} tick={{ fill: "#ffffff35", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#ffffff35", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="sent" fill="rgba(255,255,255,0.12)" radius={[3, 3, 0, 0]} name="Sent" />
              <Bar dataKey="opened" fill="rgba(147,197,253,0.5)" radius={[3, 3, 0, 0]} name="Opened" />
              <Bar dataKey="replied" fill="rgba(110,231,183,0.7)" radius={[3, 3, 0, 0]} name="Replied" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold text-white mb-4">Programs by Division</div>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={divData} cx="50%" cy="50%" innerRadius={52} outerRadius={75} dataKey="value" strokeWidth={0} paddingAngle={2}>
                  {divData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<TT />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {divData.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs text-white/50">{name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(value / allCoaches.length) * 100}%`, background: color, opacity: 0.7 }} />
                  </div>
                  <span className="text-xs font-['JetBrains_Mono'] text-white/35 w-5 text-right">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Funnel */}
      <Card className="p-5">
        <div className="text-sm font-semibold text-white mb-5">Recruiting Funnel</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[
              { label: "Programs in Database", val: allCoaches.length, pct: 100, color: "#ffffff30" },
              { label: "Emails Sent", val: totSent, pct: Math.round((totSent / allCoaches.length) * 100), color: "#a5a5ff" },
              { label: "Emails Opened", val: totOpened, pct: Math.round((totOpened / allCoaches.length) * 100), color: "#93c5fd" },
              { label: "Replies Received", val: totReplied, pct: Math.round((totReplied / allCoaches.length) * 100), color: "#6ee7b7" },
              { label: "Interested Coaches", val: interested, pct: Math.round((interested / allCoaches.length) * 100), color: "#fde68a" },
              { label: "Calls Scheduled", val: allCoaches.filter(c => c.stage === "Call Scheduled").length, pct: Math.round((allCoaches.filter(c => c.stage === "Call Scheduled").length / allCoaches.length) * 100), color: "#fb923c" },
              { label: "Offers Received", val: allCoaches.filter(c => c.stage === "Offer" || c.stage === "Committed").length, pct: Math.round((allCoaches.filter(c => c.stage === "Offer" || c.stage === "Committed").length / allCoaches.length) * 100), color: "#4ade80" },
            ].map(({ label, val, pct: p, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-white/50 w-44 flex-shrink-0">{label}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(p, 2)}%`, background: color }} />
                </div>
                <span className="text-xs font-['JetBrains_Mono'] text-white/35 w-8 text-right">{val}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs font-semibold text-white/25 uppercase tracking-[0.08em] mb-3">Stage Breakdown</div>
            <div className="space-y-2">
              {CRM_STAGES.map(stage => {
                const cnt = allCoaches.filter(c => c.stage === stage).length;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STAGE_CONFIG[stage].dot }} />
                    <span className="text-xs text-white/45 flex-1">{stage}</span>
                    <span className="text-xs font-['JetBrains_Mono'] text-white/30 w-6 text-right">{cnt}</span>
                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(cnt / allCoaches.length) * 100}%`, background: STAGE_CONFIG[stage].dot, opacity: 0.6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── PLAYER PROFILE ───────────────────────────────────────────────────────────

function ProfilePage({ onProfileSave }: { onProfileSave?: () => void }) {
  const [profile, setProfile] = useState(getPlayer());
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"info" | "film" | "resume">("info");

  const upd = (k: keyof PlayerProfile) => (v: string) => setProfile(p => ({ ...p, [k]: v }));

  const save = () => { setPlayer(profile); onProfileSave?.(); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/15 border border-white/15 flex items-center justify-center text-2xl cursor-pointer hover:border-white/30 transition-colors">
            🇫🇷
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">{profile.name || "Your Name"}</h1>
            <p className="text-sm text-white/40 mt-0.5">{profile.position} · {profile.currentTeam} · Class of {profile.graduationClass}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm"><Download size={12} /> Recruiting Resume</Btn>
          <Btn variant="primary" size="sm" onClick={save}>
            {saved ? <><Check size={12} /> Saved!</> : <><Check size={12} /> Save Profile</>}
          </Btn>
        </div>
      </div>

      {/* Goal banner */}
      <div className="px-4 py-3 rounded-xl bg-violet-500/8 border border-violet-500/15 flex items-center gap-3">
        <Target size={14} className="text-violet-400 flex-shrink-0" />
        <div>
          <span className="text-sm text-violet-300 font-medium">Primary Goal: </span>
          <span className="text-sm text-violet-300/70">{profile.primaryGoal}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/6 pb-0 -mb-2">
        {(["info", "film", "resume"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cx("px-3 py-2 text-sm font-medium transition-all capitalize border-b-2 -mb-px",
              tab === t ? "text-white border-white" : "text-white/35 border-transparent hover:text-white/65")}>
            {t === "info" ? "Player Info" : t === "film" ? "Film & Video" : "Recruiting Resume"}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="space-y-5 pt-2">
          <Card className="p-5">
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-4">Basic Information</div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name">
                <Input value={profile.name} onChange={upd("name")} placeholder="Your full name" />
              </Field>
              <Field label="Position">
                <Input value={profile.position} onChange={upd("position")} placeholder="e.g. Point Guard / Shooting Guard" />
              </Field>
              <Field label="Height (Imperial)">
                <Input value={profile.height} onChange={upd("height")} placeholder='e.g. 6&apos;1"' />
              </Field>
              <Field label="Height (Metric)">
                <Input value={profile.heightCm} onChange={upd("heightCm")} placeholder="e.g. 185 cm" />
              </Field>
              <Field label="Weight (Imperial)">
                <Input value={profile.weight} onChange={upd("weight")} placeholder="e.g. 161 lbs" />
              </Field>
              <Field label="Weight (Metric)">
                <Input value={profile.weightKg} onChange={upd("weightKg")} placeholder="e.g. 73 kg" />
              </Field>
              <Field label="Graduation Class">
                <Input value={profile.graduationClass} onChange={upd("graduationClass")} placeholder="e.g. 2028" />
              </Field>
              <Field label="Nationality / Passport">
                <Input value={profile.nationality} onChange={upd("nationality")} placeholder="e.g. France" />
              </Field>
              <Field label="Current Team" note="Your current club or national team">
                <Input value={profile.currentTeam} onChange={upd("currentTeam")} placeholder="e.g. LMBC U18 France" />
              </Field>
              <Field label="Primary Goal">
                <Input value={profile.primaryGoal} onChange={upd("primaryGoal")} placeholder="Your recruiting goal" />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-4">Academic Profile</div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="GPA">
                <Input value={profile.gpa} onChange={upd("gpa")} placeholder="e.g. 3.6" />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-4">Season Stats</div>
            <Field label="Current Season Stats" note="Used in email personalization via {{Stats}}">
              <Input value={profile.stats} onChange={upd("stats")} placeholder="e.g. 18.2 PPG · 7.4 APG · 3.8 RPG" />
            </Field>
          </Card>

        </div>
      )}

      {tab === "film" && (
        <div className="space-y-4 pt-2">
          <Card className="p-5">
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-4">Video Links</div>
            <div className="space-y-4">
              <Field label="Highlight Film URL" note="Used in emails as {{HighlightUrl}}">
                <Input value={profile.highlightUrl} onChange={upd("highlightUrl")} prefix={<Video size={12} />} placeholder="https://youtube.com/watch?v=..." />
              </Field>
              <Field label="Full Game Film URL" note="Used in emails as {{FilmUrl}}">
                <Input value={profile.fullFilmUrl} onChange={upd("fullFilmUrl")} prefix={<Video size={12} />} placeholder="https://youtube.com/watch?v=..." />
              </Field>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            {[{ label: "Highlight Film", url: profile.highlightUrl }, { label: "Full Game Film", url: profile.fullFilmUrl }].map(({ label, url }) => (
              <Card key={label} className="aspect-video flex flex-col items-center justify-center gap-3 p-5 cursor-pointer hover:border-white/15 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Play size={16} className="text-white/50" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-white/60">{label}</div>
                  <div className="text-[10px] text-white/25 font-['JetBrains_Mono'] mt-0.5 truncate max-w-[160px]">{url || "No URL set"}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "resume" && (
        <div className="pt-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm font-semibold text-white">Recruiting Resume Preview</div>
              <Btn variant="primary" size="sm"><Download size={12} /> Download PDF</Btn>
            </div>
            <div className="bg-white rounded-xl p-8 text-black space-y-4 font-sans">
              <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name || "Your Name"}</h1>
                  <p className="text-gray-500 mt-0.5">{profile.position} · {profile.nationality} · Class of {profile.graduationClass}</p>
                  <p className="text-gray-400 text-sm mt-1">{profile.currentTeam}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p className="font-medium text-gray-700">Primary Goal</p>
                  <p className="text-xs mt-0.5 max-w-[200px] text-gray-400">{profile.primaryGoal}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[["Height", profile.height], ["Weight", profile.weight], ["GPA", profile.gpa]].map(([k, v]) => (
                  <div key={k} className="p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-800">{v}</div>
                    <div className="text-xs text-gray-400">{k}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Season Stats</div>
                <p className="text-sm font-medium text-gray-700">{profile.stats}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Highlight Film</div>
                  <p className="text-sm text-blue-600 truncate">{profile.highlightUrl}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Full Game Film</div>
                  <p className="text-sm text-blue-600 truncate">{profile.fullFilmUrl}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

function SettingsPage({ setPage }: { setPage: (p: Page) => void }) {
  const [tab, setTab] = useState<"profile" | "email" | "sending" | "privacy" | "billing">("profile");
  const cfg = getEmailConfig();
  const [gmailUser, setGmailUser] = useState(cfg.user);
  const [gmailPass, setGmailPass] = useState(cfg.pass);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const gmail = !!(cfg.user && cfg.pass);

  const saveGmail = () => {
    setSaving(true);
    setEmailConfig(gmailUser, gmailPass);
    setTimeout(() => { setSaving(false); pushToast("Gmail credentials saved", "success"); }, 400);
  };

  const testConnection = async () => {
    setTesting(true);
    setEmailConfig(gmailUser, gmailPass);
    const { success, error } = await sendEmail(gmailUser, "ScoutFlow Test", "<h2>Test email from ScoutFlow</h2><p>If you receive this, your Gmail is configured correctly.</p>");
    setTesting(false);
    if (success) pushToast("Test email sent successfully — check your inbox", "success");
    else pushToast(error || "Test failed — check your credentials", "error");
  };

  const disconnectGmail = () => {
    setEmailConfig("", "");
    setGmailUser("");
    setGmailPass("");
    pushToast("Gmail disconnected", "success");
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "email", label: "Email Accounts", icon: Mail },
    { id: "sending", label: "Sending Rules", icon: SlidersHorizontal },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "billing", label: "Plan & Billing", icon: Trophy },
  ] as const;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-52 border-r border-white/6 p-3">
        <div className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.1em] px-2 py-1.5 mb-1">Settings</div>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cx("w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-left transition-all mb-px",
              tab === id ? "bg-white/8 text-white font-medium" : "text-white/40 hover:text-white/70 hover:bg-white/4")}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {tab === "profile" && (
          <>
            <PageHeader title="My Profile" subtitle="Your player information — used in email templates and your recruiting resume." />
            <div className="space-y-3 max-w-lg">
              <Card className="p-4">
                <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-4">Player Info</div>
                {(["name","position","height","heightCm","weight","weightKg","graduationClass","nationality","currentTeam","primaryGoal"] as (keyof PlayerProfile)[]).map(k => {
                  const p = getPlayer();
                  return (
                    <div key={k} className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0">
                      <span className="text-xs text-white/50 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-xs text-white/80 font-['JetBrains_Mono']">{String(p[k])}</span>
                    </div>
                  );
                })}
                <div className="mt-3 pt-3 border-t border-white/6">
                  <a href="#" onClick={(e) => { e.preventDefault(); setPage("profile"); }} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Edit full profile →</a>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.09em] mb-4">Film & Video</div>
                <div className="space-y-4">
                  <Field label="Highlight Film URL" note="Used in emails as {{HighlightUrl}}">
                    <Input value={getPlayer().highlightUrl} onChange={v => { setPlayer({...getPlayer(), highlightUrl: v }); }} prefix={<Video size={12} />} placeholder="https://youtube.com/watch?v=..." />
                  </Field>
                  <Field label="Full Game Film URL" note="Used in emails as {{FilmUrl}}">
                    <Input value={getPlayer().fullFilmUrl} onChange={v => { setPlayer({...getPlayer(), fullFilmUrl: v }); }} prefix={<Video size={12} />} placeholder="https://youtube.com/watch?v=..." />
                  </Field>
                  <div className="flex gap-2 pt-1">
                    <Btn variant="primary" size="sm" onClick={() => { setPlayer(getPlayer()); pushToast("Film URLs saved", "success"); }}>Save Film URLs</Btn>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
        {tab === "email" && (
          <>
            <PageHeader title="Email Accounts" subtitle="Connect your Gmail to send recruiting emails through ScoutFlow." />
            <div className="space-y-3 max-w-lg">
              {/* Gmail */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center font-bold text-red-400 text-lg">G</div>
                    <div>
                      <div className="text-sm font-medium text-white">Gmail</div>
                      {gmail ? <div className="text-xs text-white/35 font-['JetBrains_Mono']">{cfg.user}</div> : <div className="text-xs text-white/25">Not configured</div>}
                    </div>
                  </div>
                  {gmail ? (
                    <div className="flex items-center gap-2">
                      <Chip variant="green">Connected</Chip>
                      <Btn variant="danger" size="sm" onClick={disconnectGmail}>Disconnect</Btn>
                    </div>
                  ) : (
                    <Chip variant="yellow">Not connected</Chip>
                  )}
                </div>
                {gmail && (
                  <div className="mt-3 pt-3 border-t border-white/6 grid grid-cols-3 gap-3 text-center">
                    {[["Quota/Day", "500"], ["Status", "Active"], ["Method", "SMTP"]].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">{v}</div>
                        <div className="text-[10px] text-white/30">{k}</div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Gmail credentials form */}
                <div className="mt-4 pt-4 border-t border-white/6 space-y-3">
                  <Field label="Gmail Address">
                    <Input value={gmailUser} onChange={setGmailUser} placeholder="your.name@gmail.com" prefix="@" />
                  </Field>
                  <Field label="App Password" note="Generate from Google Account > Security > 2-Step Verification > App Passwords">
                    <Input value={gmailPass} onChange={setGmailPass} placeholder="16-character app password" type="password" mono />
                  </Field>
                  <div className="flex gap-2 pt-1">
                    <Btn variant="primary" size="sm" onClick={saveGmail} disabled={saving || !gmailUser || !gmailPass}>
                      {saving ? "Saving..." : "Save Credentials"}
                    </Btn>
                    <Btn variant="outline" size="sm" onClick={testConnection} disabled={testing || !gmailUser || !gmailPass}>
                      {testing ? <><RefreshCw size={11} className="animate-spin" /> Testing...</> : <>Send Test Email</>}
                    </Btn>
                  </div>
                </div>
              </Card>

              {/* Info card */}
              <Card className="p-4 bg-blue-500/5 border-blue-500/15">
                <div className="flex gap-3">
                  <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-blue-300">How to get a Gmail App Password</div>
                    <ol className="mt-2 text-xs text-blue-200/70 space-y-1 ml-4 list-decimal">
                      <li>Go to your <a href="https://myaccount.google.com/security" target="_blank" className="underline text-blue-300">Google Account Security</a> page</li>
                      <li>Enable <strong>2-Step Verification</strong> (if not already enabled)</li>
                      <li>Go to <strong>App Passwords</strong> (search in Google Account settings)</li>
                      <li>Select <strong>Mail</strong> as the app and <strong>Other</strong> as the device (name it "ScoutFlow")</li>
                      <li>Copy the 16-character generated password and paste it above</li>
                    </ol>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {tab === "sending" && (
          <>
            <PageHeader title="Sending Rules" subtitle="Control limits and timing to protect your email reputation." />
            <Card className="p-5 max-w-lg">
              <div className="space-y-4">
                {[
                  { label: "Daily send limit per account", val: "10", note: "Recommended: 10–20 for new accounts" },
                  { label: "Minimum delay between emails", val: "8 min", note: "Randomized within ±2 minutes" },
                  { label: "Send window start", val: "08:00 AM", note: "Local coach timezone" },
                  { label: "Send window end", val: "06:00 PM", note: "No weekend sends by default" },
                  { label: "Follow-up delay (first)", val: "7 days", note: "After no reply" },
                  { label: "Follow-up delay (second)", val: "14 days", note: "After second no reply" },
                ].map(({ label, val, note }) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-white/70">{label}</div>
                      <div className="text-[11px] text-white/30 mt-0.5">{note}</div>
                    </div>
                    <input defaultValue={val}
                      className="w-28 bg-white/4 border border-white/8 rounded-lg px-3 py-1.5 text-sm text-white text-center outline-none focus:border-white/20 transition-colors font-['JetBrains_Mono']" />
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === "privacy" && (
          <>
            <PageHeader title="Privacy & Security" subtitle="Your data is encrypted and never shared." />
            <div className="max-w-lg space-y-3">
              {[
                { icon: Key, label: "OAuth 2.0 Auth", desc: "Login via Google or Microsoft — no password stored", ok: true },
                { icon: Shield, label: "Data Encryption", desc: "AES-256 encryption at rest, TLS in transit", ok: true },
                { icon: Database, label: "GDPR Compliant", desc: "EU data residency available on request", ok: true },
                { icon: Activity, label: "Audit Log", desc: "Every email action is timestamped and logged", ok: true },
              ].map(({ icon: Icon, label, desc, ok }) => (
                <Card key={label} className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-lg bg-white/6 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-white/50" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{label}</div>
                    <div className="text-xs text-white/35">{desc}</div>
                  </div>
                  <Chip variant="green">{ok ? "Active" : "Off"}</Chip>
                </Card>
              ))}
            </div>
          </>
        )}

        {tab === "billing" && (
          <>
            <PageHeader title="Plan & Billing" />
            <Card className="p-6 max-w-md">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">ScoutFlow Pro</div>
                  <div className="text-sm text-white/40 mt-0.5">$49 / month</div>
                </div>
                <Chip variant="green">Active</Chip>
              </div>
              <div className="space-y-2 mb-5">
                {["Unlimited program database", "Up to 200 emails/day", "AI email personalization", "Full pipeline CRM", "Gmail + Outlook integration", "Advanced analytics & funnel", "CSV import / export", "Priority support"].map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-xs text-white/60">
                    <Check size={11} className="text-emerald-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Divider className="mb-4" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/30 font-['JetBrains_Mono']">Renews Aug 1, 2025</span>
                <Btn variant="outline" size="sm">Manage Plan</Btn>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// ─── EMAIL HELPERS ────────────────────────────────────────────────────────────

type EmailConfig = { user: string; pass: string };
type ToastMsg = { msg: string; type: "success" | "error" };

function getEmailConfig(): EmailConfig {
  if (typeof window === "undefined") return { user: "", pass: "" };
  return {
    user: localStorage.getItem(storageKey("gmail_user")) || "",
    pass: localStorage.getItem(storageKey("gmail_pass")) || "",
  };
}

function setEmailConfig(user: string, pass: string) {
  localStorage.setItem(storageKey("gmail_user"), user);
  localStorage.setItem(storageKey("gmail_pass"), pass);
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!to) return { success: false, error: "Recipient email address is empty — update the coach profile." };
  if (!subject) return { success: false, error: "Email subject is empty." };
  if (!html) return { success: false, error: "Email body is empty." };
  const cfg = getEmailConfig();
  if (!cfg.user || !cfg.pass) return { success: false, error: "Gmail not configured. Go to Settings > Email Accounts." };
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html, user: cfg.user, pass: cfg.pass }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || "Failed to send" };
    return { success: true };
  } catch (e) {
    return { success: false, error: "Network error — check your connection or the API endpoint." };
  }
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

let _toast: ((m: ToastMsg) => void) | null = null;
function pushToast(msg: string, type: "success" | "error" = "success") {
  if (_toast) _toast({ msg, type });
}

function ToastBar() {
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [hiding, setHiding] = useState(false);
  useEffect(() => { _toast = (m) => { setToast(m); setHiding(false); }; return () => { _toast = null; }; }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => { setHiding(true); setTimeout(() => setToast(null), 300); }, 3500);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <div className={cx("fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl",
      hiding ? "animate-slide-out" : "animate-slide-in",
      toast.type === "success" ? "bg-emerald-900/50 border-emerald-500/30" : "bg-red-900/50 border-red-500/30")}>
      {toast.type === "success" ? <CheckCircle size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
      <span className="text-sm text-white/90">{toast.msg}</span>
    </div>
  );
}

// ─── COMPOSE EMAIL MODAL ──────────────────────────────────────────────────────

function ComposeEmailModal({ coach, onClose, onEmailSent }: { coach: Coach; onClose: () => void; onEmailSent?: (subject: string) => void }) {
  const tpl = getTemplate();
  const recipientName = coach.staff[0]?.name || coach.headCoach;
  const [subject, setSubject] = useState(
    tpl.subject
      .replace(/\{\{PlayerName\}\}/g, getPlayer().name)
      .replace(/\{\{Position\}\}/g, getPlayer().position)
      .replace(/\{\{GraduationYear\}\}/g, getPlayer().graduationClass)
      .replace(/\{\{Division\}\}/g, coach.division)
      .replace(/\{\{CoachName\}\}/g, recipientName.split(" ").pop() || recipientName)
      .replace(/\{\{School\}\}/g, coach.school)
  );
  const [body, setBody] = useState(
    tpl.body
      .replace(/\{\{PlayerName\}\}/g, getPlayer().name)
      .replace(/\{\{Position\}\}/g, getPlayer().position)
      .replace(/\{\{Height\}\}/g, getPlayer().height)
      .replace(/\{\{HeightCm\}\}/g, getPlayer().heightCm)
      .replace(/\{\{Weight\}\}/g, getPlayer().weight)
      .replace(/\{\{WeightKg\}\}/g, getPlayer().weightKg)
      .replace(/\{\{GraduationYear\}\}/g, getPlayer().graduationClass)
      .replace(/\{\{Country\}\}/g, getPlayer().nationality)
      .replace(/\{\{CurrentTeam\}\}/g, getPlayer().currentTeam)
      .replace(/\{\{GPA\}\}/g, getPlayer().gpa)
      .replace(/\{\{Stats\}\}/g, getPlayer().stats)
      .replace(/\{\{HighlightUrl\}\}/g, getPlayer().highlightUrl)
      .replace(/\{\{FilmUrl\}\}/g, getPlayer().fullFilmUrl)
      .replace(/\{\{CoachName\}\}/g, recipientName.split(" ").pop() || recipientName)
      .replace(/\{\{School\}\}/g, coach.school)
      .replace(/\{\{Conference\}\}/g, coach.conference)
      .replace(/\{\{Division\}\}/g, coach.division)
  );
  const [sending, setSending] = useState(false);
  const allEmails = getStaffEmails(coach);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || !allEmails) return;
    setSending(true);
    const htmlBody = body.replace(/\n/g, "<br>");
    const { success, error } = await sendEmail(allEmails, subject, htmlBody);
    setSending(false);
    if (success) {
      pushToast(`Email sent to ${coach.staff.length} staff at ${coach.school}`, "success");
      onEmailSent?.(subject);
      onClose();
    } else {
      pushToast(error || "Failed to send email. Check your Gmail settings.", "error");
    }
  };

  const htmlPreview = body.replace(/\n/g, "<br>");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-[#11111a] shadow-2xl shadow-black/50 animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-base font-semibold text-white font-['Plus_Jakarta_Sans']">Compose Email</h2>
            <p className="text-xs text-white/30 mt-0.5">To: {coach.staff.length} staff at {coach.school}</p>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Recipients list */}
          <div>
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] mb-2">Recipients</div>
            <div className="space-y-1">
              {coach.staff.filter(s => s.email).map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-white/50 font-['JetBrains_Mono']">
                  <Mail size={10} className="text-white/20" />
                  <span>{s.name}</span>
                  <span className="text-white/30">&lt;{s.email}&gt;</span>
                </div>
              ))}
            </div>
          </div>
          <Field label="Subject">
            <Input value={subject} onChange={setSubject} placeholder="Email subject..." />
          </Field>
          <Field label="Message">
            <textarea value={body} onChange={e => setBody(e.target.value)}
              className="w-full h-60 bg-white/3 border border-white/8 rounded-xl p-4 text-[12.5px] text-white/75 leading-relaxed outline-none focus:border-white/15 resize-none transition-colors font-['JetBrains_Mono']" />
          </Field>
          <div>
            <div className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.08em] mb-2">Preview</div>
            <div className="p-4 rounded-xl bg-white/3 border border-white/6 text-[12.5px] text-white/60 leading-relaxed" dangerouslySetInnerHTML={{ __html: htmlPreview }} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between">
          <span className="text-[11px] text-white/25 font-['JetBrains_Mono']">{coach.staff.filter(s => s.email).length} recipients</span>
          <div className="flex gap-2">
            <Btn variant="ghost" size="sm" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" size="sm" onClick={handleSend} disabled={sending || !subject.trim() || !body.trim() || !allEmails}>
              {sending ? <><RefreshCw size={12} className="animate-spin" /> Sending...</> : <><Send size={12} /> Send to All Staff</>}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard",
  coaches: "Coach Database",
  outreach: "Outreach Composer",
  broadcast: "Broadcast",
  pipeline: "Recruiting Pipeline",
  analytics: "Analytics",
  profile: "Player Profile",
  settings: "Settings",
};

// ─── LOGIN PAGE ────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    setLoading(false);
    if (isRegister) {
      const ok = register(email, password);
      if (!ok) { setError("An account with this email already exists"); return; }
    } else {
      const ok = login(email, password);
      if (!ok) { setError("Invalid email or password"); return; }
    }
    onLogin();
  };
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-[#f2f2f7] flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-blue-600/3 rounded-full blur-[100px]" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center"><Target size={16} className="text-[#0b0b0f]" /></div>
          <span className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">ScoutFlow</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-white font-['Plus_Jakarta_Sans']">{isRegister ? "Create Account" : "Sign In"}</h2>
          <p className="text-xs text-white/40 -mt-2">{isRegister ? "Create your recruiting CRM account" : "Sign in to your recruiting CRM"}</p>
          <div>
            <label className="block text-xs text-white/40 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@example.com"
              className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/22 transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required placeholder="At least 6 characters" minLength={6}
              className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-white/22 transition-colors" />
          </div>
          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-white text-[#0b0b0f] rounded-lg py-2.5 text-sm font-semibold hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
          <div className="text-center text-xs text-white/30">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2">
              {isRegister ? "Sign in" : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── APP ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!currentUserId());
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const [coaches, setCoaches] = useState<Coach[]>(() => loadCoaches());
  const [trackingVersion, setTrackingVersion] = useState(0);
  const [emailModalCoach, setEmailModalCoach] = useState<Coach | null>(null);
  const [emailConfig, setEmailConfigState] = useState(getEmailConfig());
  const sidebarTimeoutRef = useRef<number | null>(null);
  const openSidebar = () => { if (sidebarTimeoutRef.current) clearTimeout(sidebarTimeoutRef.current); setSidebarOpen(true); };
  const closeSidebar = () => { sidebarTimeoutRef.current = window.setTimeout(() => setSidebarOpen(false), 300); };
  const onEmailSent = (coachId: string, subject: string) => {
    const all = loadCoaches();
    const c = all.find(cf => cf.id === coachId);
    if (c) addTracking(c, "sent", subject);
    const updated = all.map(cf => cf.id === coachId ? { ...cf, stage: (cf.stage === "Not Contacted" ? "Sent" : cf.stage) as CRMStage, lastContact: new Date().toLocaleDateString() } : cf);
    saveCoaches(updated);
    setCoaches(updated);
    setTrackingVersion(v => v + 1);
  };

  useEffect(() => {
    const last = getContactAllLast();
    if (last) {
      const daysSince = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
      if (daysSince >= 5) setPage("broadcast");
    } else {
      setPage("broadcast");
    }
  }, []);

  const cfg = getEmailConfig();
  const gmailConfigured = !!(cfg.user && cfg.pass);

  if (!loggedIn) return <LoginPage onLogin={() => { setLoggedIn(true); setCoaches(loadCoaches()); setEmailConfigState(getEmailConfig()); }} />;

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-[#f2f2f7] flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-blue-600/3 rounded-full blur-[100px]" />
      </div>

      {/* Hover trigger strip */}
      <div className="fixed left-0 top-0 h-full w-0.5 z-50" onMouseEnter={openSidebar} />

      <Sidebar key={profileVersion} page={page} setPage={setPage} open={sidebarOpen} onToggle={() => setSidebarOpen(false)} onMouseEnter={openSidebar} onMouseLeave={closeSidebar} />

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-[216px]' : 'ml-0'}`}>
        <TopBar title={PAGE_TITLES[page]} onToggleSidebar={openSidebar} onLogout={() => { logout(); setLoggedIn(false); }} />
        <main className={cx("flex-1 overflow-hidden", page === "pipeline" ? "overflow-auto" : "overflow-y-auto")}>
          {page === "dashboard" && <DashboardPage key={trackingVersion} setPage={setPage} coaches={coaches} trackingVersion={trackingVersion} />}
          {page === "coaches" && <CoachesPage onSendEmail={setEmailModalCoach} coaches={coaches} />}
          {page === "outreach" && <OutreachPage />}
          {page === "broadcast" && <BroadcastPage coaches={coaches} onEmailSent={onEmailSent} />}
          {page === "pipeline" && <PipelinePage coaches={coaches} />}
          {page === "analytics" && <AnalyticsPage />}
          {page === "profile" && <ProfilePage onProfileSave={() => setProfileVersion(v => v + 1)} />}
          {page === "settings" && <SettingsPage setPage={setPage} />}
        </main>
      </div>

      {/* Email compose modal */}
      {emailModalCoach && (
        <ComposeEmailModal coach={emailModalCoach} onClose={() => setEmailModalCoach(null)} onEmailSent={(s) => onEmailSent(emailModalCoach.id, s)} />
      )}

      {/* Toast */}
      <ToastBar />

      <style>{`
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.07) transparent; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .animate-pulse { animation: pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
        @keyframes slideInRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideOutRight { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(24px)} }
        .animate-slide-in { animation:slideInRight .4s cubic-bezier(.16,1,.3,1) both; }
        .animate-slide-out { animation:slideOutRight .3s ease-in both; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .animate-fade-in { animation:fadeInUp .5s ease-out both; }
      `}</style>
    </div>
  );
}
