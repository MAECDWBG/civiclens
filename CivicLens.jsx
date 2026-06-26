import { useState, useEffect, useRef } from "react";
import {
  MapPin, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Users, Award, Camera, Home, BarChart2, Plus, User,
  ThumbsUp, X, FileText, Zap, Droplet, Lightbulb,
  Trash2, Construction, Search, Bell, Send, Shield,
  Activity, Trophy, Star, MessageSquare, ChevronRight,
  RefreshCw
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";

// Design tokens
const P = "#14532d";      // deep civic green (primary)
const P2 = "#16a34a";     // bright green (interactive)
const ACC = "#ea580c";    // civic orange (urgency / CTA)
const BG = "#f0fdf4";     // very light green tint

// Domain config
const CAT = {
  pothole:     { label: "Pothole",      Icon: Construction, color: "#dc2626", bg: "#fef2f2" },
  water:       { label: "Water Leak",   Icon: Droplet,      color: "#2563eb", bg: "#eff6ff" },
  streetlight: { label: "Streetlight",  Icon: Lightbulb,    color: "#d97706", bg: "#fffbeb" },
  waste:       { label: "Waste Dump",   Icon: Trash2,        color: "#16a34a", bg: "#f0fdf4" },
  other:       { label: "Other",        Icon: AlertTriangle, color: "#7c3aed", bg: "#f5f3ff" },
};

const SEV = {
  low:      { label: "Low",      c: "#059669", bg: "#d1fae5" },
  medium:   { label: "Medium",   c: "#d97706", bg: "#fef3c7" },
  high:     { label: "High",     c: "#dc2626", bg: "#fee2e2" },
  critical: { label: "Critical", c: "#7c3aed", bg: "#ede9fe" },
};

const STA = {
  reported:      { label: "Reported",     c: "#6b7280", Icon: Bell },
  verified:      { label: "Verified",     c: "#2563eb", Icon: Shield },
  "in-progress": { label: "In Progress",  c: "#d97706", Icon: Activity },
  resolved:      { label: "Resolved",     c: "#16a34a", Icon: CheckCircle },
};

const STATUS_STEPS = ["reported", "verified", "in-progress", "resolved"];

// Seed data
const SEED = [
  {
    id:"1", title:"Deep Pothole — Main Junction",
    category:"pothole", severity:"high",
    description:"Large dangerous pothole near the main junction has caused vehicle damage and multiple near-accidents. Congestion worsens during peak hours as drivers swerve to avoid it.",
    location:"MG Road, Near City Center Mall",
    status:"in-progress", upvotes:47, reporter:"Rahul S.",
    timestamp: Date.now()-2*864e5,
    department:"Roads & Infrastructure Dept.",
    verified:true, verifications:23, comments:12,
    tags:["road","safety","urgent"],
  },
  {
    id:"2", title:"Three Street Lights Out — Park St",
    category:"streetlight", severity:"medium",
    description:"Consecutive street lights non-functional on Park Street Block 4. Creates dangerous conditions at night for pedestrians and motorists.",
    location:"Park Street, Block 4",
    status:"verified", upvotes:31, reporter:"Priya M.",
    timestamp: Date.now()-864e5,
    department:"City Electricity Board",
    verified:true, verifications:15, comments:8,
    tags:["lighting","safety","night"],
  },
  {
    id:"3", title:"Water Pipeline Burst — Street Flooding",
    category:"water", severity:"critical",
    description:"Major pipeline burst flooding the road. Significant water wastage, road damage, and residents unable to access homes. Requires immediate intervention.",
    location:"Gandhi Nagar, Sector 5",
    status:"reported", upvotes:89, reporter:"Amit K.",
    timestamp: Date.now()-3*36e5,
    department:"Water Supply Board",
    verified:false, verifications:7, comments:24,
    tags:["water","flooding","critical"],
  },
  {
    id:"4", title:"Illegal Garbage Near Children's Park",
    category:"waste", severity:"high",
    description:"Illegal dumping adjacent to the children's playground. Strong odour, health hazard, and children forced away from the park.",
    location:"Nehru Park, West Wing",
    status:"resolved", upvotes:28, reporter:"Sunita R.",
    timestamp: Date.now()-5*864e5,
    department:"Sanitation Department",
    verified:true, verifications:31, comments:6,
    tags:["health","children","cleanliness"],
  },
  {
    id:"5", title:"Broken Footpath Tiles — Bus Stop",
    category:"other", severity:"medium",
    description:"Multiple cracked and missing footpath tiles near Bus Stop 12. Tripping hazard, especially for elderly and differently-abled commuters.",
    location:"Commercial Street, Bus Stop 12",
    status:"reported", upvotes:19, reporter:"Vijay P.",
    timestamp: Date.now()-4*864e5,
    department:"Roads & Infrastructure Dept.",
    verified:false, verifications:4, comments:3,
    tags:["pedestrian","accessibility"],
  },
];

const BOARD = [
  { name:"Rahul S.", pts:1240, issues:28, medal:"🥇" },
  { name:"Priya M.", pts:980,  issues:22, medal:"🥈" },
  { name:"Amit K.",  pts:760,  issues:17, medal:"🥉" },
  { name:"Sunita R.",pts:620,  issues:14, medal:"⭐" },
  { name:"You",      pts:340,  issues:8,  medal:"🌟", me:true },
];

const WEEKLY = [
  {d:"Mon",n:4},{d:"Tue",n:7},{d:"Wed",n:3},
  {d:"Thu",n:9},{d:"Fri",n:6},{d:"Sat",n:11},{d:"Sun",n:5},
];

// Helpers
const ago = ts => {
  const s = (Date.now()-ts)/1000;
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

const callAI = async (prompt) => {
  const API_KEY = "AQ.Ab8RN6If2nqHngw3UFd-8Bk6CHoqoykuWUROFIGStC4jg6xfgw";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
};

// Micro-components
const Pill = ({text, c, bg}) => (
  <span style={{color:c,backgroundColor:bg}}
    className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
    {text}
  </span>
);

const Spinner = ({size=20, color=P2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
  </svg>
);

// Issue Card
const IssueCard = ({issue, onClick, onUpvote}) => {
  const cat = CAT[issue.category]||CAT.other;
  const sev = SEV[issue.severity]||SEV.medium;
  const sta = STA[issue.status]||STA.reported;
  const CatIcon = cat.Icon;
  const StaIcon = sta.Icon;

  return (
    <div
      onClick={()=>onClick(issue)}
      style={{borderLeft:`4px solid ${sev.c}`}}
      className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.99]">

      {/* Top */}
      <div className="flex items-start gap-3">
        <div style={{backgroundColor:cat.bg}}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
          <CatIcon size={17} color={cat.color}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Pill text={cat.label} c={cat.color} bg={cat.bg}/>
            <Pill text={sev.label} c={sev.c} bg={sev.bg}/>
            {issue.verified && <Pill text="✓ Verified" c="#2563eb" bg="#dbeafe"/>}
          </div>
          <h3 className="font-semibold text-gray-900 mt-1 text-sm leading-snug">{issue.title}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="text-gray-400 flex-shrink-0"/>
            <span className="text-xs text-gray-400 truncate">{issue.location}</span>
          </div>
        </div>
      </div>

      {/* Desc */}
      <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{issue.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
        <div className="flex items-center gap-3">
          <button
            onClick={e=>{e.stopPropagation();onUpvote(issue.id);}}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors font-medium">
            <ThumbsUp size={12}/> {issue.upvotes}
          </button>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MessageSquare size={11}/> {issue.comments}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Users size={11}/> {issue.verifications}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <StaIcon size={11} style={{color:sta.c}}/>
          <span className="text-xs font-semibold" style={{color:sta.c}}>{sta.label}</span>
          <span className="text-xs text-gray-300 mx-0.5">·</span>
          <span className="text-xs text-gray-400">{ago(issue.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};

// Main App
export default function CivicLens() {
  const [view, setView]                 = useState("feed");
  const [issues, setIssues]             = useState(SEED);
  const [filter, setFilter]             = useState("all");
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState(null);
  const [step, setStep]                 = useState(1);
  const [form, setForm]                 = useState({description:"",location:""});
  const [analysis, setAnalysis]         = useState(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [complaint, setComplaint]       = useState("");
  const [cLoading, setCLoading]         = useState(false);
  const [showC, setShowC]               = useState(false);
  const [pts, setPts]                   = useState(340);
  const [done, setDone]                 = useState(false);
  const [imgPrev, setImgPrev]           = useState(null);
  const [insightText, setInsightText]   = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const fileRef = useRef(null);

  // Persist user-submitted issues
  useEffect(()=>{
    const saved = localStorage.getItem("cl-issues");
    if(saved) setIssues([...SEED, ...JSON.parse(saved)]);
  },[]);

  const filtered = issues.filter(i=>{
    const fOk = filter==="all"
      || (filter==="active"   && i.status!=="resolved")
      || (filter==="resolved" && i.status==="resolved")
      || (filter==="critical" && ["high","critical"].includes(i.severity));
    const sOk = !search
      || i.title.toLowerCase().includes(search.toLowerCase())
      || i.location.toLowerCase().includes(search.toLowerCase());
    return fOk && sOk;
  });

  const upvote = id => {
    setIssues(p=>p.map(i=>i.id===id?{...i,upvotes:i.upvotes+1}:i));
    setPts(p=>p+5);
  };

  // AI: Analyze issue
  const analyze = async () => {
    setAiLoading(true);
    try {
      const raw = await callAI(
`You are an AI for a civic issue reporting platform. Analyze this community issue.
Issue: "${form.description}"
Location: "${form.location||"not specified"}"

Reply ONLY with valid JSON, no markdown:
{
  "title": "concise title max 8 words",
  "category": "pothole|water|streetlight|waste|other",
  "severity": "low|medium|high|critical",
  "department": "responsible government department name",
  "tags": ["tag1","tag2","tag3"],
  "priority_reason": "one sentence explaining this severity",
  "estimated_days": 7,
  "actions": ["immediate action 1","action 2","action 3"]
}`
      );
      const clean = raw.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setAnalysis(parsed);
    } catch {
      setAnalysis({
        title: form.description.slice(0,55),
        category:"other", severity:"medium",
        department:"Municipal Corporation",
        tags:["infrastructure","community"],
        priority_reason:"Requires prompt municipal attention.",
        estimated_days:7,
        actions:["Document the issue","File formal complaint","Follow up with department"],
      });
    }
    setAiLoading(false);
  };

  // AI: Generate complaint
  const genComplaint = async issue => {
    setShowC(true); setCLoading(true);
    try {
      const letter = await callAI(
`Write a formal official complaint letter from a citizen to "${issue.department}" about:
Title: ${issue.title}
Location: ${issue.location}
Description: ${issue.description}
Severity: ${issue.severity} | Community Upvotes: ${issue.upvotes} citizens affected

Write under 220 words. Include: Date: [DATE], To: The Officer In-Charge, Subject (bold-style), formal greeting, clear problem statement, community impact, firm request for urgent resolution, deadline ask of 7 days, formal closing with [Your Name] and [Contact Number].`
      );
      setComplaint(letter);
    } catch {
      setComplaint("Could not generate letter. Please check connection and retry.");
    }
    setCLoading(false);
  };

  // AI: Dashboard insights
  const loadInsights = async () => {
    setInsightLoading(true);
    const summary = issues.map(i=>`${i.category}(${i.severity}) in ${i.location}`).join("; ");
    try {
      const text = await callAI(
`You are a civic data analyst. Analyze these community-reported issues and generate 4 sharp, specific, actionable insights for the municipal dashboard.
Issues: ${summary}

Return 4 bullet insights (one per line, starting with an emoji). Each must reference specific data, spot a pattern, or make a prediction. Be specific and data-driven, not generic.`
      );
      setInsightText(text);
    } catch {
      setInsightText("• Unable to load AI insights. Check connection.");
    }
    setInsightLoading(false);
  };

  // Submit new issue
  const submit = async () => {
    const ni = {
      id: Date.now().toString(),
      title: analysis?.title || form.description.slice(0,60),
      category: analysis?.category || "other",
      severity: analysis?.severity || "medium",
      description: form.description,
      location: form.location || "Location not provided",
      status: "reported",
      upvotes:1, reporter:"You",
      timestamp: Date.now(),
      department: analysis?.department || "Municipal Corporation",
      verified:false, verifications:1, comments:0,
      tags: analysis?.tags || [],
    };
    const next=[...issues,ni];
    setIssues(next);
    try{
      const mine=next.filter(i=>i.reporter==="You");
      await window.storage.set("cl-issues",JSON.stringify(mine));
    }catch{}
    setPts(p=>p+50);
    setDone(true);
    setTimeout(()=>{
      setDone(false); setView("feed"); setStep(1);
      setForm({description:"",location:""}); setAnalysis(null); setImgPrev(null);
    },2600);
  };

  // Stats
  const resolved = issues.filter(i=>i.status==="resolved").length;
  const active   = issues.filter(i=>i.status!=="resolved").length;
  const catData  = Object.entries(CAT).map(([k,v])=>({
    name:v.label.split(" ")[0], count:issues.filter(i=>i.category===k).length, fill:v.color,
  })).filter(d=>d.count>0);
  const staData  = Object.entries(STA).map(([k,v])=>({
    name:v.label, value:issues.filter(i=>i.status===k).length, fill:v.c,
  }));

  // VIEW: FEED
  const Feed = ()=>(
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          className="w-full bg-white rounded-2xl pl-9 pr-4 py-2.5 text-sm border border-gray-100 focus:outline-none focus:ring-2 focus:ring-green-200 placeholder:text-gray-300"
          placeholder="Search issues, locations…"/>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[["all","All"],["active","Active"],["critical","⚠ Critical"],["resolved","✓ Resolved"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter===k ? "text-white shadow-sm" : "bg-white text-gray-500 border border-gray-100"
            }`} style={filter===k?{backgroundColor:P2}:{}}>
            {l}
          </button>
        ))}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        {[{l:"Total",v:issues.length,c:"text-gray-800"},{l:"Active",v:active,c:"text-orange-600"},{l:"Resolved",v:resolved,c:"text-green-700"}].map(s=>(
          <div key={s.l} className="bg-white rounded-xl py-3 text-center shadow-sm">
            <div className={`text-xl font-black ${s.c}`}>{s.v}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Issues */}
      {filtered.length===0
        ? <div className="text-center py-14 text-gray-300 flex flex-col items-center gap-3">
            <MapPin size={40} strokeWidth={1}/>
            <p className="text-sm">No issues match this filter</p>
          </div>
        : filtered.map(i=>(
            <IssueCard key={i.id} issue={i} onClick={setSelected} onUpvote={upvote}/>
          ))
      }
    </div>
  );

  // VIEW: REPORT
  const Report = ()=>{
    if(done) return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{backgroundColor:"#dcfce7"}}>
          <CheckCircle size={42} color={P2}/>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-gray-900">Issue Reported!</h2>
          <p className="text-gray-400 text-sm mt-1">Your community thanks you.</p>
        </div>
        <div className="px-6 py-2.5 rounded-full text-sm font-bold text-white" style={{backgroundColor:P2}}>
          🌟 +50 pts — Now {pts} total
        </div>
      </div>
    );

    return (
      <div className="flex flex-col gap-5">
        {/* Step indicator */}
        <div>
          <div className="flex items-center gap-2">
            {[1,2,3].map(s=>(
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step>s ? "text-white" : step===s ? "text-white" : "bg-gray-100 text-gray-400"
                }`} style={step>=s?{backgroundColor:P2}:{}}>
                  {step>s?"✓":s}
                </div>
                {s<3 && <div className="flex-1 h-0.5 rounded" style={{backgroundColor:step>s?P2:"#e5e7eb"}}/>}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1.5 px-0.5">
            <span>Describe</span><span>AI Review</span><span>Submit</span>
          </div>
        </div>

        {/* STEP 1 */}
        {step===1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
                What's the issue? *
              </label>
              <textarea rows={4}
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 resize-none placeholder:text-gray-300"
                placeholder="Describe the problem clearly — what you see, where exactly, and how it affects people…"
                value={form.description}
                onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Location *</label>
              <input
                className="w-full border border-gray-200 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 placeholder:text-gray-300"
                placeholder="Street name, landmark, area, sector…"
                value={form.location}
                onChange={e=>setForm(p=>({...p,location:e.target.value}))}/>
            </div>

            {/* Photo upload */}
            <div
              onClick={()=>fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all hover:border-green-300"
              style={{borderColor: imgPrev?"#16a34a":"#e5e7eb"}}>
              {imgPrev ? (
                <div className="relative">
                  <img src={imgPrev} alt="preview" className="w-full h-36 object-cover rounded-lg"/>
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{backgroundColor:P2}}>✓</div>
                </div>
              ):(
                <>
                  <Camera size={28} className="mx-auto text-gray-300 mb-2"/>
                  <p className="text-sm text-gray-400 font-medium">Add Photo</p>
                  <p className="text-xs text-gray-300 mt-0.5">AI will use it to categorize the issue</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e=>{const f=e.target.files[0];if(f)setImgPrev(URL.createObjectURL(f));}}/>
            </div>

            <button
              onClick={()=>{if(form.description){analyze();setStep(2);}}}
              disabled={!form.description}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
              style={{backgroundColor:ACC}}>
              <Zap size={16}/> Analyze with AI →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <div className="flex flex-col gap-4">
            {aiLoading ? (
              <div className="flex flex-col items-center py-16 gap-4">
                <Spinner size={36} color={P2}/>
                <p className="text-sm text-gray-400">AI is classifying your report…</p>
              </div>
            ) : analysis ? (
              <>
                {/* AI result card */}
                <div className="rounded-2xl p-4" style={{backgroundColor:"#f0fdf4",border:"1px solid #bbf7d0"}}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor:P2}}>
                      <Zap size={12} color="white"/>
                    </div>
                    <span className="text-sm font-bold" style={{color:P}}>AI Analysis Complete</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      ["Category",   <span className="font-bold text-gray-900 capitalize">{CAT[analysis.category]?.label||analysis.category}</span>],
                      ["Severity",   <span className="font-bold" style={{color:SEV[analysis.severity]?.c}}>{analysis.severity}</span>],
                      ["Department", <span className="font-bold text-gray-900 text-xs leading-tight">{analysis.department}</span>],
                      ["Est. Fix",   <span className="font-bold text-gray-900">{analysis.estimated_days} days</span>],
                    ].map(([label,val])=>(
                      <div key={label} className="bg-white rounded-lg p-2.5">
                        <div className="text-gray-400 mb-0.5">{label}</div>
                        {val}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3" style={{borderTop:"1px solid #bbf7d0"}}>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Why this severity?</p>
                    <p className="text-xs text-gray-600">{analysis.priority_reason}</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Recommended Actions</p>
                    {analysis.actions.map((a,i)=>(
                      <div key={i} className="flex gap-1.5 mb-1.5">
                        <span className="text-xs mt-0.5" style={{color:P2}}>→</span>
                        <p className="text-xs text-gray-600">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editable title */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Issue Title (editable)</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                    value={analysis.title}
                    onChange={e=>setAnalysis(p=>({...p,title:e.target.value}))}/>
                </div>

                <div className="flex gap-3">
                  <button onClick={()=>setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500">
                    ← Edit
                  </button>
                  <button onClick={()=>setStep(3)} className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                    style={{backgroundColor:P2}}>
                    Confirm →
                  </button>
                </div>
              </>
            ):null}
          </div>
        )}

        {/* STEP 3 */}
        {step===3 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Review Before Submitting</h3>
              {[
                ["Title",       analysis?.title],
                ["Category",    CAT[analysis?.category]?.label],
                ["Severity",    analysis?.severity],
                ["Location",    form.location||"—"],
                ["Department",  analysis?.department],
                ["Est. Resolution", `~${analysis?.estimated_days} days`],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-400 flex-shrink-0 mr-4">{k}</span>
                  <span className="text-xs font-semibold text-gray-800 text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* Tags preview */}
            {analysis?.tags?.length>0 && (
              <div className="flex gap-1.5 flex-wrap">
                {analysis.tags.map(t=>(
                  <span key={t} className="text-xs bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full font-medium">#{t}</span>
                ))}
              </div>
            )}

            <div className="rounded-xl p-3 text-xs text-center font-medium" style={{backgroundColor:"#fef3c7",color:"#92400e"}}>
              🌟 Earn <strong>50 points</strong> for submitting this report
            </div>

            <div className="flex gap-3">
              <button onClick={()=>setStep(2)} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500">← Back</button>
              <button onClick={submit} className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{backgroundColor:P}}>
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // VIEW: DASHBOARD
  const Dashboard = ()=>(
    <div className="flex flex-col gap-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {l:"Total Reports",v:issues.length,  Icon:MapPin,    ic:"text-green-700",  ib:"bg-green-50"},
          {l:"Resolved",     v:resolved,        Icon:CheckCircle,ic:"text-emerald-600",ib:"bg-emerald-50"},
          {l:"Active Issues",v:active,          Icon:Clock,     ic:"text-orange-600", ib:"bg-orange-50"},
          {l:"Reporters",    v:124,             Icon:Users,     ic:"text-blue-600",   ib:"bg-blue-50"},
        ].map(s=>(
          <div key={s.l} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 ${s.ib} rounded-xl flex items-center justify-center mb-2`}>
              <s.Icon size={17} className={s.ic}/>
            </div>
            <div className="text-2xl font-black text-gray-900">{s.v}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Category bar chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-800 text-sm mb-3">Issues by Category</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={catData} barSize={22}>
            <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} width={18}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:10,border:"1px solid #e5e7eb"}}/>
            <Bar dataKey="count" radius={[5,5,0,0]}>
              {catData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly line chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-800 text-sm mb-3">Reports This Week</h3>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={WEEKLY}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
            <XAxis dataKey="d" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} width={18}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:10,border:"1px solid #e5e7eb"}}/>
            <Line type="monotone" dataKey="n" stroke={P2} strokeWidth={2.5}
              dot={{r:3,fill:P2,strokeWidth:0}} activeDot={{r:5}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status pie */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-800 text-sm mb-3">Status Breakdown</h3>
        <div className="flex items-center gap-3">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={staData} cx="50%" cy="50%" innerRadius={33} outerRadius={52} dataKey="value" paddingAngle={3}>
                {staData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1">
            {staData.filter(d=>d.value>0).map(d=>(
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:d.fill}}/>
                  <span className="text-xs text-gray-600">{d.name}</span>
                </div>
                <span className="text-xs font-black text-gray-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-2xl p-4 text-white" style={{background:`linear-gradient(135deg,${P} 0%,#166534 100%)`}}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={15}/>
            <span className="font-bold text-sm">AI Insights</span>
          </div>
          <button onClick={loadInsights}
            className="flex items-center gap-1.5 text-xs bg-white/15 px-2.5 py-1 rounded-full font-medium">
            {insightLoading?<Spinner size={12} color="white"/>:<RefreshCw size={11}/>}
            {insightLoading?"Thinking…":"Generate"}
          </button>
        </div>

        {insightText ? (
          <div className="space-y-1.5">
            {insightText.trim().split("\n").filter(Boolean).map((line,i)=>(
              <p key={i} className="text-xs text-green-100 leading-relaxed">{line}</p>
            ))}
          </div>
        ):(
          <div className="space-y-1.5">
            {[
              `🔴 ${issues.filter(i=>i.category==="pothole").length} pothole reports — possible systemic road decay on MG Road corridor`,
              `📈 Saturday peaks at 11 reports — recommend weekend rapid response team`,
              `✅ ${Math.round((resolved/issues.length)*100)}% resolution rate — above the national civic average of 43%`,
              `💧 Water burst unresolved ${ago(issues.find(i=>i.category==="water")?.timestamp||Date.now())} — escalate to Water Board emergency line`,
            ].map((t,i)=>(
              <p key={i} className="text-xs text-green-100 leading-relaxed">{t}</p>
            ))}
            <p className="text-xs text-green-300 mt-2 italic">↑ Click Generate for live AI analysis of current data</p>
          </div>
        )}
      </div>
    </div>
  );

  // VIEW: PROFILE
  const Profile = ()=>{
    const level = pts<500?"Citizen Hero":pts<1000?"Community Leader":"City Champion";
    const next  = pts<500?500:pts<1000?1000:2000;
    const prog  = Math.min((pts/next)*100,100);
    const myI   = issues.filter(i=>i.reporter==="You");
    const badges=[
      {l:"First Step",  e:"🏁", got:myI.length>=1},
      {l:"5 Reports",   e:"⭐", got:myI.length>=5},
      {l:"Civic Voice", e:"📣", got:pts>=100},
      {l:"Watchdog",    e:"🛡️", got:pts>=200},
      {l:"Community ★", e:"🌟", got:pts>=300},
      {l:"500 Club",    e:"💎", got:pts>=500},
    ];
    return (
      <div className="flex flex-col gap-4">
        {/* Profile hero */}
        <div className="rounded-2xl p-5 text-white" style={{background:`linear-gradient(135deg,${P} 0%,#166534 100%)`}}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">👤</div>
            <div className="flex-1">
              <div className="font-black text-lg">You</div>
              <div className="text-green-200 text-xs">{level}</div>
              <div className="mt-2 bg-white/20 rounded-full h-2 overflow-hidden">
                <div className="bg-white rounded-full h-2 transition-all" style={{width:`${prog}%`}}/>
              </div>
              <div className="text-xs text-green-200 mt-0.5">{next-pts} pts to next level</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[{l:"Reports",v:myI.length},{l:"Points",v:pts},{l:"Rank",v:"#5"}].map(s=>(
              <div key={s.l} className="bg-white/20 rounded-xl p-2.5 text-center">
                <div className="font-black">{s.v}</div>
                <div className="text-xs text-green-200">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm mb-3">Badges</h3>
          <div className="grid grid-cols-3 gap-3">
            {badges.map(b=>(
              <div key={b.l} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all ${
                b.got?"bg-green-50":"bg-gray-50 opacity-40"}`}>
                <span className="text-2xl">{b.e}</span>
                <span className="text-xs font-semibold text-gray-700 leading-tight">{b.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} style={{color:"#d97706"}}/>
            <h3 className="font-bold text-gray-800 text-sm">Community Leaderboard</h3>
          </div>
          <div className="space-y-2">
            {BOARD.map((u,i)=>(
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
                u.me?"border":"bg-gray-50"}`}
                style={u.me?{backgroundColor:"#f0fdf4",borderColor:"#bbf7d0"}:{}}>
                <span className="text-lg w-7 text-center">{u.medal}</span>
                <div className="flex-1">
                  <div className={`text-sm font-bold ${u.me?"text-green-700":"text-gray-800"}`}>
                    {u.name}{u.me&&" (You)"}
                  </div>
                  <div className="text-xs text-gray-400">{u.issues} issues reported</div>
                </div>
                <div className={`text-sm font-black ${u.me?"text-green-600":"text-gray-700"}`}>{u.pts}</div>
              </div>
            ))}
          </div>
        </div>

        {/* My issues */}
        {myI.length>0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-3">My Reports</h3>
            <div className="space-y-2">
              {myI.map(i=>{
                const s=STA[i.status];
                return (
                  <div key={i.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{i.title}</p>
                      <p className="text-xs text-gray-400">{ago(i.timestamp)}</p>
                    </div>
                    <span className="text-xs font-bold ml-2 flex-shrink-0" style={{color:s?.c}}>{s?.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // MODAL: Issue Detail
  const IssueDetail = ()=>{
    if(!selected) return null;
    const i=selected;
    const cat=CAT[i.category]||CAT.other;
    const sev=SEV[i.severity]||SEV.medium;
    const curStep=STATUS_STEPS.indexOf(i.status);

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
        onClick={()=>setSelected(null)}>
        <div className="bg-white w-full max-w-sm rounded-t-3xl max-h-[88vh] overflow-y-auto"
          onClick={e=>e.stopPropagation()}>

          {/* Handle */}
          <div className="pt-3 pb-1 flex justify-center"><div className="w-10 h-1 bg-gray-200 rounded-full"/></div>

          {/* Header */}
          <div className="px-5 pt-2 pb-3 flex items-start gap-3 border-b border-gray-50">
            <div className="flex-1">
              <div className="flex gap-1.5 flex-wrap mb-2">
                <Pill text={cat.label} c={cat.color} bg={cat.bg}/>
                <Pill text={sev.label} c={sev.c} bg={sev.bg}/>
                {i.verified&&<Pill text="✓ Verified" c="#2563eb" bg="#dbeafe"/>}
              </div>
              <h2 className="font-black text-gray-900 text-base leading-snug">{i.title}</h2>
            </div>
            <button onClick={()=>setSelected(null)} className="p-2 rounded-full bg-gray-100 flex-shrink-0">
              <X size={15}/>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{i.description}</p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl text-xs">
              {[
                ["📍 Location",   i.location],
                ["🏛️ Department", i.department],
                ["👤 Reporter",   i.reporter],
                ["🕐 Reported",   ago(i.timestamp)],
              ].map(([k,v])=>(
                <div key={k}>
                  <div className="text-gray-400 mb-0.5">{k}</div>
                  <div className="font-semibold text-gray-800 leading-tight">{v}</div>
                </div>
              ))}
            </div>

            {/* Progress timeline */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Resolution Progress</p>
              <div className="flex items-start">
                {STATUS_STEPS.map((step,idx)=>{
                  const cfg=STA[step];
                  const done=idx<=curStep;
                  const StIcon=cfg.Icon;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center w-full">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done?"":"bg-gray-100"}`}
                          style={done?{backgroundColor:P2}:{}}>
                          <StIcon size={14} color={done?"white":"#9ca3af"}/>
                        </div>
                        <span className={`text-xs mt-1 text-center leading-tight px-0.5 ${done?"font-semibold":"text-gray-300"}`}
                          style={done?{color:P}:{}}>
                          {cfg.label}
                        </span>
                      </div>
                      {idx<3&&<div className="h-0.5 flex-1 -mt-4" style={{backgroundColor:idx<curStep?P2:"#e5e7eb"}}/>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            {i.tags?.length>0 && (
              <div className="flex gap-1.5 flex-wrap">
                {i.tags.map(t=>(
                  <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">#{t}</span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={()=>{upvote(i.id);setSelected(p=>({...p,upvotes:p.upvotes+1}));}}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                style={{backgroundColor:"#f0fdf4",color:P2}}>
                <ThumbsUp size={14}/> Upvote ({i.upvotes})
              </button>
              <button
                onClick={()=>genComplaint(i)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                style={{backgroundColor:"#eff6ff",color:"#2563eb"}}>
                <FileText size={14}/> Complaint
              </button>
            </div>

            {/* Verify */}
            <button
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2"
              style={{borderColor:P2,color:P2}}>
              <Shield size={14}/> Verify this Issue (+10 pts)
            </button>
          </div>
        </div>
      </div>
    );
  };

  // MODAL: Complaint Letter
  const ComplaintModal = ()=>{
    if(!showC) return null;
    return (
      <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center"
        onClick={()=>setShowC(false)}>
        <div className="bg-white w-full max-w-sm rounded-t-3xl max-h-[82vh] overflow-y-auto"
          onClick={e=>e.stopPropagation()}>
          <div className="pt-3 pb-1 flex justify-center"><div className="w-10 h-1 bg-gray-200 rounded-full"/></div>
          <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText size={14} className="text-blue-600"/>
              </div>
              <span className="font-bold text-gray-900 text-sm">Official Complaint Letter</span>
            </div>
            <button onClick={()=>setShowC(false)} className="p-2 rounded-full bg-gray-100"><X size={14}/></button>
          </div>
          <div className="p-5">
            {cLoading ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <Spinner size={32} color="#2563eb"/>
                <p className="text-sm text-gray-400">AI is drafting your complaint…</p>
              </div>
            ):(
              <>
                <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono border border-gray-100">
                  {complaint}
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={()=>navigator.clipboard?.writeText(complaint).catch(()=>{})}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                    style={{backgroundColor:"#2563eb"}}>
                    <Send size={13}/> Copy Letter
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // NAVIGATION
  const TABS = [
    {k:"feed",      l:"Feed",     I:Home},
    {k:"report",    l:"Report",   I:Plus},
    {k:"dashboard", l:"Insights", I:BarChart2},
    {k:"profile",   l:"Profile",  I:User},
  ];

  const TITLES = {
    feed:"CivicLens 🌿", report:"Report Issue", dashboard:"Community Data", profile:"My Profile",
  };

  return (
    <div className="min-h-screen flex flex-col max-w-sm mx-auto relative" style={{backgroundColor:BG}}>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="font-black text-base" style={{color:P}}>{TITLES[view]}</h1>
        <div className="flex items-center gap-2">
          <div className="text-xs font-black px-3 py-1.5 rounded-full text-white" style={{backgroundColor:P2}}>
            🌟 {pts}
          </div>
          <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Bell size={14} className="text-gray-500"/>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
        {view==="feed"      && <Feed/>}
        {view==="report"    && <Report/>}
        {view==="dashboard" && <Dashboard/>}
        {view==="profile"   && <Profile/>}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-100 px-2 pt-2 pb-3 z-40 shadow-lg">
        <div className="flex justify-around items-end">
          {TABS.map(({k,l,I})=>{
            const active=view===k;
            const isReport=k==="report";
            return (
              <button key={k}
                onClick={()=>{setView(k);if(k==="report"){setStep(1);setAnalysis(null);setImgPrev(null);}}}
                className="flex flex-col items-center gap-1 transition-all">
                {isReport ? (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center -mt-6 shadow-xl"
                    style={{backgroundColor:ACC}}>
                    <I size={22} color="white"/>
                  </div>
                ):(
                  <div className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all ${
                    active?"":"bg-transparent"}`}
                    style={active?{backgroundColor:"#dcfce7"}:{}}>
                    <I size={19} style={{color:active?P2:"#9ca3af"}}/>
                  </div>
                )}
                <span className={`text-xs font-semibold ${active&&!isReport?"":"text-gray-400"}`}
                  style={active&&!isReport?{color:P2}:isReport?{color:ACC}:{}}>
                  {l}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <IssueDetail/>
      <ComplaintModal/>
    </div>
  );
}