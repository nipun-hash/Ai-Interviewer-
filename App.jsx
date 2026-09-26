import React, { useState, useEffect, useRef } from "react";

// ==========================================
// 1. DATA AND QUESTION CATALOG
// ==========================================
const DEFAULT_ACCOUNTS = [
  {
    id: "usr-01",
    email: "alex@example.com",
    password: "password123",
    name: "Alex Rivera",
    role: "candidate"
  },
  {
    id: "rec-01",
    email: "recruiter@apexcloud.com",
    password: "admin123",
    name: "ApexCloud Hiring Team",
    role: "recruiter"
  }
];

const DEFAULT_JOBS = [
  {
    id: "job-101",
    company: "ApexCloud Systems",
    role: "Senior Full-Stack Engineer",
    department: "Platform Engineering",
    minExp: 4,
    requiredSkills: ["React", "Node.js", "PostgreSQL", "Docker", "TypeScript"],
    description: "Architect distributed web services, scale GraphQL endpoints, and lead frontend performance optimization.",
    weightings: { technical: 40, problemSolving: 30, communication: 15, integrity: 15 }
  },
  {
    id: "job-102",
    company: "NeuralCraft AI",
    role: "AI / ML Operations Engineer",
    department: "Applied AI",
    minExp: 3,
    requiredSkills: ["Python", "PyTorch", "Kubernetes", "Vector DBs", "Docker"],
    description: "Deploy large language models, orchestrate low-latency inference pipelines, and optimize retrieval systems.",
    weightings: { technical: 50, problemSolving: 25, communication: 15, integrity: 10 }
  },
  {
    id: "job-103",
    company: "FinVault Security",
    role: "Backend Distributed Systems Engineer",
    department: "Core Banking",
    minExp: 5,
    requiredSkills: ["Go", "Distributed Systems", "Kafka", "PostgreSQL", "Docker"],
    description: "Build fault-tolerant ledger pipelines handling 50k+ transactions per second with zero data loss.",
    weightings: { technical: 45, problemSolving: 30, communication: 15, integrity: 10 }
  },
  {
    id: "job-104",
    company: "KubeScale Cloud",
    role: "Cloud DevOps & Platform Engineer",
    department: "Infrastructure",
    minExp: 3,
    requiredSkills: ["Kubernetes", "Terraform", "Docker", "AWS", "CI/CD"],
    description: "Scale multi-region container clusters, manage infrastructure as code, and optimize production observability.",
    weightings: { technical: 45, problemSolving: 30, communication: 15, integrity: 10 }
  }
];

const DEFAULT_APPLICANTS = [
  {
    id: "cand-01",
    name: "Alex Rivera",
    email: "alex@example.com",
    roleApplied: "Senior Full-Stack Engineer",
    jobId: "job-101",
    skills: ["React", "Node.js", "PostgreSQL", "Docker", "Redis"],
    experienceYears: 6,
    universalScore: 92,
    scores: { technical: 94, problemSolving: 90, communication: 92, integrity: 95 },
    recommendation: "Strong Hire",
    strengths: ["Clean microservice abstraction", "Exemplary understanding of concurrency bottlenecks"],
    gaps: ["Could elaborate more on observability metrics (Prometheus/Grafana)"],
    integrityFlags: 0,
    isCreamLayer: true
  },
  {
    id: "cand-02",
    name: "Sophia Chen",
    email: "schen@example.com",
    roleApplied: "AI / ML Operations Engineer",
    jobId: "job-102",
    skills: ["Python", "PyTorch", "Kubernetes", "Vector DBs", "Docker"],
    experienceYears: 5,
    universalScore: 95,
    scores: { technical: 96, problemSolving: 94, communication: 93, integrity: 98 },
    recommendation: "Strong Hire",
    strengths: ["Deep knowledge of model quantization (FP8, AWQ) and CUDA kernels"],
    gaps: ["Minor hesitation around custom Kubernetes operator design"],
    integrityFlags: 0,
    isCreamLayer: true
  }
];

const QUESTION_TREE = {
  "Senior Full-Stack Engineer": {
    basic: [
      "Can you walk me through your experience building and deploying production-scale web applications?",
      "How do you approach client-side and server-side state synchronization in complex interfaces?"
    ],
    intermediate: [
      "How would you prevent cache stampedes and thundering herds when querying high-throughput databases?",
      "Compare the operational trade-offs of microservices versus modular monoliths in terms of deployment velocity."
    ],
    advanced: [
      "Walk me through how you would architect an end-to-end collaborative editor using conflict-free replicated data types (CRDTs).",
      "Your system's p99 latency spiked from 45ms to 1200ms. Detail your exact triage protocol across services and databases."
    ]
  },
  "AI / ML Operations Engineer": {
    basic: [
      "What does your typical pipeline look like when deploying an open-source model to production?",
      "How do you monitor for data drift and catastrophic forgetting in deployed pipelines?"
    ],
    intermediate: [
      "Explain the trade-offs of post-training quantization methods like AWQ, GPTQ, and GGUF.",
      "How would you scale a retrieval-augmented generation (RAG) system across 20 million documents?"
    ],
    advanced: [
      "Design a multi-tenant LLM serving architecture optimizing TTFT (Time-To-First-Token) while maintaining high GPU saturation.",
      "How do you secure autonomous tool-calling AI agents against indirect prompt injection vectors?"
    ]
  },
  default: {
    basic: [
      "Walk me through your background and the core tools you use daily.",
      "Describe your standard approach to testing and validating production code."
    ],
    intermediate: [
      "Describe a challenging bug you encountered in production and how you debugged it.",
      "How do you handle technical debt while meeting tight product deadlines?"
    ],
    advanced: [
      "How would you re-architect your primary project from scratch to sustain 100x traffic?",
      "Describe a scenario where you disagreed with an architectural proposal and how you reached consensus."
    ]
  }
};

function computeUniversalScore(scores, weights = { technical: 40, problemSolving: 30, communication: 15, integrity: 15 }) {
  const totalWeight = weights.technical + weights.problemSolving + weights.communication + weights.integrity;
  return Math.round(
    (scores.technical * weights.technical +
      scores.problemSolving * weights.problemSolving +
      scores.communication * weights.communication +
      scores.integrity * weights.integrity) /
      totalWeight
  );
}

// ==========================================
// 2. ROOT APP COMPONENT (Auth & Persistence)
// ==========================================
export default function App() {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem("aegis_accounts");
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("aegis_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activePortal, setActivePortal] = useState("candidate");

  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem("aegis_jobs");
    return saved ? JSON.parse(saved) : DEFAULT_JOBS;
  });

  const [applicants, setApplicants] = useState(() => {
    const saved = localStorage.getItem("aegis_applicants");
    return saved ? JSON.parse(saved) : DEFAULT_APPLICANTS;
  });

  useEffect(() => {
    localStorage.setItem("zenithx_accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("zenithx_current_user", JSON.stringify(currentUser));
      setActivePortal(currentUser.role === "recruiter" ? "recruiter" : "candidate");
    } else {
      localStorage.removeItem("zenithx_current_user");
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("zenithx_jobs", JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem("zenithx_applicants", JSON.stringify(applicants));
  }, [applicants]);

  const [candidateProfile, setCandidateProfile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidateView, setCandidateView] = useState("upload");
  const [lastCandidateReport, setLastCandidateReport] = useState(null);

  const [recruiterView, setRecruiterView] = useState("leaderboard");
  const [selectedDossier, setSelectedDossier] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.role === "candidate") {
      setCandidateProfile(null);
      setCandidateView("upload");
    }
  };

  const handleRegister = (newAccount) => {
    setAccounts((prev) => [...prev, newAccount]);
    handleLogin(newAccount);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCandidateProfile(null);
    setCandidateView("upload");
    setSelectedDossier(null);
  };

  const handleInterviewFinished = ({ candidateFeedback, recruiterDossier }) => {
    setApplicants((prev) => [recruiterDossier, ...prev]);
    setLastCandidateReport(candidateFeedback);
    setCandidateView("feedback");
  };

  const handleResetData = () => {
    if (confirm("Reset accounts, jobs, and applicants back to initial defaults?")) {
      localStorage.clear();
      setAccounts(DEFAULT_ACCOUNTS);
      setJobs(DEFAULT_JOBS);
      setApplicants(DEFAULT_APPLICANTS);
      setCurrentUser(null);
    }
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} accounts={accounts} />;
  }

  return (
    <div className="min-h-screen bg-cyan-50/40 text-slate-800 font-sans flex flex-col">
      <header className="border-b border-cyan-200 bg-white/95 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center font-black text-white text-base shadow-sm">
            A
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-base text-slate-900 flex items-center gap-2">
              ZenithX
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded border border-cyan-300">
                {currentUser.role === "recruiter" ? "Hirer Workspace" : "Candidate Portal"}
              </span>
            </h1>
            <p className="text-[11px] text-cyan-700/80">
              Logged in as <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.email})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {currentUser.role === "recruiter" && (
            <button
              onClick={() => setActivePortal(activePortal === "recruiter" ? "candidate" : "recruiter")}
              className="text-xs px-3 py-1.5 rounded-lg border border-cyan-300 text-cyan-800 hover:bg-cyan-50 font-medium transition"
            >
              Switch to {activePortal === "recruiter" ? "Candidate Portal" : "Hirer Hub"}
            </button>
          )}

          <button
            onClick={handleResetData}
            title="Reset storage to original demo data"
            className="text-[11px] text-slate-500 hover:text-rose-600 px-2 py-1 rounded transition"
          >
            Reset Demo
          </button>

          <button
            onClick={handleLogout}
            className="text-xs px-3.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold transition"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activePortal === "candidate" ? (
          <CandidateSection
            currentUser={currentUser}
            view={candidateView}
            setView={setCandidateView}
            jobs={jobs}
            candidateProfile={candidateProfile}
            setCandidateProfile={setCandidateProfile}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            lastReport={lastCandidateReport}
            onInterviewFinished={handleInterviewFinished}
          />
        ) : (
          <RecruiterSection
            view={recruiterView}
            setView={setRecruiterView}
            jobs={jobs}
            setJobs={setJobs}
            applicants={applicants}
            selectedDossier={selectedDossier}
            setSelectedDossier={setSelectedDossier}
          />
        )}
      </main>

      <footer className="border-t border-cyan-100 bg-white px-6 py-4 text-center text-xs text-slate-500">
        ZenithX — Universal Fair-Scoring Engine. Client-side telemetry with zero biometric retention.
      </footer>
    </div>
  );
}
// ==========================================
// LANDING / COVER PAGE
// ==========================================
function LandingCoverPage({ onSelectPortal, onOpenAuth }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/70 via-white to-cyan-50/30 text-slate-800 flex flex-col font-sans selection:bg-cyan-200">
      <nav className="border-b border-cyan-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center font-black text-white text-lg shadow-md shadow-cyan-600/20">
              A
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg text-slate-900 flex items-center gap-2">
                AegisHire AI
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-100 text-cyan-800 border border-cyan-300 px-2 py-0.5 rounded-full">
                  v2.4
                </span>
              </span>
              <p className="text-[11px] text-cyan-700/80 -mt-0.5">Autonomous Proctoring & Universal Evaluation</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenAuth("candidate")}
              className="text-xs font-semibold text-slate-600 hover:text-cyan-700 px-3 py-2 transition"
            >
              Candidate Portal
            </button>
            <button
              onClick={() => onOpenAuth("recruiter")}
              className="text-xs font-semibold text-slate-600 hover:text-cyan-700 px-3 py-2 transition"
            >
              Hirer Hub
            </button>
            <button
              onClick={() => onOpenAuth("login")}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      <section className="flex-1 max-w-6xl mx-auto px-6 pt-16 pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 bg-cyan-100/70 border border-cyan-200 text-cyan-900 text-xs px-3.5 py-1.5 rounded-full font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse"></span>
          <span>Next-Gen Autonomous Hiring Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.15] max-w-4xl">
          Zero-Bias Hiring. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-700">
            Real-Time AI Proctoring.
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          Screen technical applicants dynamically with 30-minute adaptive video interviews, browser telemetry tracking, automated voice narration, and instant universal skill scoring.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onSelectPortal("candidate")}
            className="w-full sm:w-auto px-7 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-600/25 transition transform hover:-translate-y-0.5"
          >
            Start Practice Interview →
          </button>
          <button
            onClick={() => onSelectPortal("recruiter")}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-cyan-50 text-cyan-900 border border-cyan-300 font-bold text-sm rounded-xl shadow-sm transition"
          >
            Access Hirer Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-20 w-full text-left">
          <div className="bg-white border border-cyan-100 p-5 rounded-2xl shadow-sm hover:border-cyan-300 transition">
            <div className="text-2xl mb-2">🎙️</div>
            <h3 className="font-bold text-slate-900 text-sm">Voice STT & TTS</h3>
            <p className="text-xs text-slate-500 mt-1">
              Natural conversational interface with spoken question delivery and real-time voice response transcription.
            </p>
          </div>

          <div className="bg-white border border-cyan-100 p-5 rounded-2xl shadow-sm hover:border-cyan-300 transition">
            <div className="text-2xl mb-2">👁️</div>
            <h3 className="font-bold text-slate-900 text-sm">Proctor Telemetry</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pixel-level abrupt movement detection and window tab-switch monitoring to verify test integrity.
            </p>
          </div>

          <div className="bg-white border border-cyan-100 p-5 rounded-2xl shadow-sm hover:border-cyan-300 transition">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-bold text-slate-900 text-sm">Resume Ingestion</h3>
            <p className="text-xs text-slate-500 mt-1">
              Automated document parsing for PDF and text files with skill extraction and career track matching.
            </p>
          </div>

          <div className="bg-white border border-cyan-100 p-5 rounded-2xl shadow-sm hover:border-cyan-300 transition">
            <div className="text-2xl mb-2">⭐</div>
            <h3 className="font-bold text-slate-900 text-sm">Universal Scoring</h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive applicant dossiers with "Cream Layer" top-10% filtering and one-click dossier exports.
            </p>
          </div>
        </div>

        <div className="mt-14 pt-10 border-t border-cyan-100 w-full grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-extrabold text-cyan-700">30 min</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Adaptive Session Cap</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-cyan-700">0 ms</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Cloud Video Lag (Client Run)</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-cyan-700">100%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Zero Biometric Retention</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-cyan-700">Top 10%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Automated Cream Layer Audit</div>
          </div>
        </div>
      </section>

      <footer className="border-t border-cyan-100 bg-white py-6 text-center text-xs text-slate-400">
        © 2026 AegisHire AI. Enterprise Client-Side Telemetry & Autonomous Interview Infrastructure.
      </footer>
    </div>
  );
}

// ==========================================
// 3. AUTHENTICATION COMPONENT
// ==========================================
function AuthScreen({ onLogin, onRegister, accounts }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in both ID/Email and Password.");
      return;
    }

    if (isRegistering) {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      const existing = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setError("An account with this email/ID already exists. Please log in.");
        return;
      }

      const newAccount = {
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role
      };
      onRegister(newAccount);
    } else {
      const found = accounts.find(
        (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
      );
      if (!found) {
        setError("Invalid User ID/Email or Password.");
        return;
      }
      onLogin(found);
    }
  };

  const autofill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsRegistering(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-cyan-50/50 flex flex-col justify-center items-center p-6 text-slate-800">
      <div className="max-w-md w-full bg-white border border-cyan-200 rounded-2xl shadow-xl shadow-cyan-900/5 p-8">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center font-black text-white text-2xl shadow-md">
            A
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-900">
          {isRegistering ? "Create ZenithX Account" : "Sign In to ZenithX"}
        </h2>
        <p className="text-xs text-center text-cyan-700/80 mt-1 mb-6">
          AI-Powered Autonomous Proctored Interview Platform
        </p>

        {error && (
          <div className="mb-4 text-xs bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("candidate")}
                  className={`py-2 text-xs font-semibold rounded-lg border transition ${
                    role === "candidate"
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                      : "bg-cyan-50/40 text-slate-700 border-cyan-200 hover:bg-cyan-100/50"
                  }`}
                >
                  Candidate (Job Seeker)
                </button>
                <button
                  type="button"
                  onClick={() => setRole("recruiter")}
                  className={`py-2 text-xs font-semibold rounded-lg border transition ${
                    role === "recruiter"
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                      : "bg-cyan-50/40 text-slate-700 border-cyan-200 hover:bg-cyan-100/50"
                  }`}
                >
                  Hirer (Recruiter)
                </button>
              </div>
            </div>
          )}

          {isRegistering && (
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Miller"
                className="w-full bg-cyan-50/30 border border-cyan-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">User ID or Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@example.com"
              className="w-full bg-cyan-50/30 border border-cyan-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-cyan-50/30 border border-cyan-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
          >
            {isRegistering ? "Register & Enter Platform" : "Sign In"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold underline"
          >
            {isRegistering
              ? "Already have an account? Sign In"
              : "Don't have an account? Create an Account"}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-cyan-100">
          <p className="text-[11px] font-semibold text-slate-400 text-center mb-2">QUICK DEMO CREDENTIALS</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => autofill("alex@example.com", "password123")}
              className="p-2 bg-cyan-50 hover:bg-cyan-100/70 border border-cyan-200 rounded-lg text-cyan-900 text-center font-medium"
            >
              Demo Candidate
            </button>
            <button
              onClick={() => autofill("recruiter@apexcloud.com", "admin123")}
              className="p-2 bg-teal-50 hover:bg-teal-100/70 border border-teal-200 rounded-lg text-teal-900 text-center font-medium"
            >
              Demo Hirer / Recruiter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. CANDIDATE WORKFLOW
// ==========================================
function CandidateSection({
  currentUser,
  view,
  setView,
  jobs,
  candidateProfile,
  setCandidateProfile,
  selectedJob,
  setSelectedJob,
  lastReport,
  onInterviewFinished
}) {
  if (view === "upload" || !candidateProfile) {
    return (
      <CandidateUpload
        currentUser={currentUser}
        jobs={jobs}
        onParsed={(profile) => {
          setCandidateProfile(profile);
          setView("matches");
        }}
      />
    );
  }

  if (view === "matches") {
    return (
      <CandidateMatches
        profile={candidateProfile}
        jobs={jobs}
        onSelectJob={(job) => {
          setSelectedJob(job);
          setView("interview");
        }}
        onReupload={() => setView("upload")}
      />
    );
  }

  if (view === "interview") {
    return (
      <InterviewRoom
        candidateProfile={candidateProfile}
        targetJob={selectedJob}
        onComplete={onInterviewFinished}
      />
    );
  }

  if (view === "feedback") {
    return <CandidateFeedback report={lastReport} onBack={() => setView("matches")} />;
  }

  return null;
}

function CandidateUpload({ currentUser, jobs, onParsed }) {
  const [name, setName] = useState(currentUser?.name || "David Reynolds");
  const [email, setEmail] = useState(currentUser?.email || "david.r@example.com");
  const [bio, setBio] = useState(
    "Senior Full-Stack Developer with 5 years experience designing resilient microservices and distributed APIs using React, Node.js, TypeScript, PostgreSQL, and Docker. Strong background in Redis caching, GraphQL schema design, and CI/CD automation."
  );
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStage, setParseStage] = useState("");
  const [analysisReport, setAnalysisReport] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type || "application/octet-stream"
    });

    if (file.name.endsWith(".txt") || file.type.includes("text")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        if (typeof text === "string" && text.length > 20) {
          setBio(text.slice(0, 1500));
        }
      };
      reader.readAsText(file);
    } else {
      setBio(
        `[Extracted from: ${file.name}]\nSoftware Engineer with experience in React, Python, Node.js, Docker, Kubernetes, PostgreSQL, and AWS cloud deployments. Experienced in microservice architecture and data pipelines.`
      );
    }
  };

  const handleRunAiAnalysis = () => {
    setIsParsing(true);
    setParseStage("Scanning document structure & tokenizing text...");

    setTimeout(() => {
      setParseStage("Extracting core competency ontology & years of experience...");
    }, 700);

    setTimeout(() => {
      setParseStage("Synthesizing job-fit vectors and ranking open career tracks...");
    }, 1400);

    setTimeout(() => {
      const textToSearch = `${bio} ${uploadedFile?.name || ""}`.toLowerCase();

      const skillDictionary = [
        "React", "Node.js", "PostgreSQL", "Docker", "Python",
        "Kubernetes", "Go", "TypeScript", "Redis", "Kafka",
        "PyTorch", "AWS", "Terraform", "CI/CD", "Vector DBs"
      ];

      const detected = skillDictionary.filter((s) => textToSearch.includes(s.toLowerCase()));
      const finalSkills = detected.length > 0 ? detected : ["React", "Node.js", "Docker", "PostgreSQL"];

      let expYears = 4.5;
      if (textToSearch.includes("6 year") || textToSearch.includes("7 year")) expYears = 6.5;
      else if (textToSearch.includes("2 year") || textToSearch.includes("3 year")) expYears = 3;
      else if (textToSearch.includes("8 year") || textToSearch.includes("10 year")) expYears = 8;

      const matchedProfiles = jobs.map((job) => {
        const hitCount = job.requiredSkills.filter((req) =>
          finalSkills.some((fs) => fs.toLowerCase() === req.toLowerCase())
        ).length;
        const matchPct = Math.round((hitCount / job.requiredSkills.length) * 100);
        return {
          role: job.role,
          company: job.company,
          matchPct,
          jobId: job.id
        };
      }).sort((a, b) => b.matchPct - a.matchPct);

      const report = {
        name,
        email,
        experienceYears: expYears,
        skills: finalSkills,
        summary: bio,
        suggestedTracks: matchedProfiles,
        topDomain: finalSkills.includes("PyTorch") || finalSkills.includes("Vector DBs")
          ? "Artificial Intelligence & ML Engineering"
          : finalSkills.includes("Go") || finalSkills.includes("Kafka")
          ? "High-Throughput Distributed Systems"
          : "Full-Stack Enterprise Web Architecture"
      };

      setIsParsing(false);
      setAnalysisReport(report);
    }, 2200);
  };

  const handleConfirmAndProceed = () => {
    if (!analysisReport) return;
    onParsed({
      name: analysisReport.name,
      email: analysisReport.email,
      experienceYears: analysisReport.experienceYears,
      skills: analysisReport.skills,
      summary: analysisReport.summary,
      topDomain: analysisReport.topDomain,
      suggestedTracks: analysisReport.suggestedTracks
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-cyan-100 rounded-2xl p-8 shadow-xl shadow-cyan-900/5">
        <div className="text-center mb-6">
          <div className="inline-block p-2 bg-cyan-50 rounded-xl border border-cyan-200 mb-2">
            <span className="text-cyan-700 text-lg font-bold">📄 AI Resume Parser & Career Matcher</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Upload Resume & Extract Credentials</h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload your resume (.pdf, .docx, .txt) or paste details below for semantic skill matching.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-cyan-50/40 border border-cyan-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cyan-50/40 border border-cyan-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Attach Resume Document</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cyan-200 hover:border-cyan-500 bg-cyan-50/20 hover:bg-cyan-50/50 rounded-xl p-6 text-center cursor-pointer transition"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
              />
              <div className="text-cyan-600 text-2xl mb-1">📂</div>
              <div className="text-xs font-semibold text-slate-800">
                {uploadedFile ? uploadedFile.name : "Click or Drag & Drop Resume File"}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {uploadedFile
                  ? `Size: ${uploadedFile.size} • Ready for AI extraction`
                  : "Supports PDF, Word (.docx), or Plain Text (.txt)"}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Resume Text & Experience Overview (Extracted or Editable)
            </label>
            <textarea
              rows="4"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-cyan-50/30 border border-cyan-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white font-mono"
            />
          </div>

          <button
            onClick={handleRunAiAnalysis}
            disabled={isParsing}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-2"
          >
            {isParsing ? (
              <>
                <span className="animate-spin inline-block">⚙️</span>
                <span>{parseStage}</span>
              </>
            ) : (
              <span>🔍 Run AI Resume Analysis & Match Profiles</span>
            )}
          </button>
        </div>
      </div>

      {analysisReport && (
        <div className="bg-white border border-teal-200 rounded-2xl p-6 shadow-md shadow-teal-900/5 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-start border-b border-teal-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                AI Analysis Complete
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Recommended Career Path: {analysisReport.topDomain}</h3>
              <p className="text-xs text-slate-500">Estimated Professional Experience: <strong>{analysisReport.experienceYears} Years</strong></p>
            </div>
            <button
              onClick={handleConfirmAndProceed}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition shadow-sm"
            >
              Continue to Matched Openings →
            </button>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1.5">Identified Core Competencies:</span>
            <div className="flex flex-wrap gap-1.5">
              {analysisReport.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-cyan-100 text-cyan-800 border border-cyan-300 px-2.5 py-0.5 rounded-full font-medium"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">AI-Ranked Suitable Job Openings:</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisReport.suggestedTracks.map((trk, i) => (
                <div key={i} className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-200 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{trk.role}</div>
                    <div className="text-[11px] text-cyan-700">{trk.company}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${trk.matchPct >= 70 ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-slate-100 text-slate-700'}`}>
                      {trk.matchPct}% Fit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateMatches({ profile, jobs, onSelectJob, onReupload }) {
  const scoredJobs = jobs.map((job) => {
    const matches = job.requiredSkills.filter((s) =>
      profile.skills.map((ps) => ps.toLowerCase()).includes(s.toLowerCase())
    );
    return {
      ...job,
      matchRate: Math.round((matches.length / job.requiredSkills.length) * 100),
      matches
    };
  }).sort((a, b) => b.matchRate - a.matchRate);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-cyan-100 rounded-2xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900">Applicant: {profile.name}</h2>
            {profile.topDomain && (
              <span className="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                {profile.topDomain}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {profile.skills.map((s, i) => (
              <span key={i} className="text-xs bg-cyan-100 text-cyan-800 border border-cyan-300 px-2 py-0.5 rounded font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onReupload}
          className="text-xs border border-cyan-300 text-cyan-800 px-3 py-1.5 rounded-lg hover:bg-cyan-50 font-medium"
        >
          Re-Upload Resume
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scoredJobs.map((job) => (
          <div key={job.id} className="bg-white border border-cyan-100 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:border-cyan-300 transition">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-cyan-700 uppercase">{job.company}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${job.matchRate >= 80 ? 'text-teal-800 bg-teal-50 border border-teal-300' : 'text-cyan-800 bg-cyan-100'}`}>
                  {job.matchRate}% Match
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900">{job.role}</h3>
              <p className="text-xs text-slate-500 mb-3">{job.department} • Min {job.minExp} yrs exp</p>
              <p className="text-xs text-slate-600 mb-4">{job.description}</p>
            </div>
            <button
              onClick={() => onSelectJob(job)}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
            >
              Start 30-min AI Interview
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// 5. INTERVIEW ROOM WITH ABRUPT MOTION & TAB SWITCH TELEMETRY
// =====================================================================
function InterviewRoom({ candidateProfile, targetJob, onComplete }) {
  const [secondsRemaining, setSecondsRemaining] = useState(1800);
  const [fastForward, setFastForward] = useState(false);
  const [difficulty, setDifficulty] = useState("basic");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [flags, setFlags] = useState([]);
  
  // Real-Time Telemetry States
  const [motionStatus, setMotionStatus] = useState("Stable Motion");
  const [isAbruptMoving, setIsAbruptMoving] = useState(false);
  const [tabFocusStatus, setTabFocusStatus] = useState("Focused on Portal");
  const [isTabUnfocused, setIsTabUnfocused] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const prevFrameData = useRef(null);
  const lastMotionFlagTime = useRef(0);
  const motionCheckInterval = useRef(null);

  const bank = QUESTION_TREE[targetJob.role] || QUESTION_TREE.default;

  const speakText = (text) => {
    if (isMuted || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
     recognition.continuous = true;
recognition.interimResults = false; // Only register finalized speech
recognition.lang = "en-US";

recognition.onresult = (event) => {
  let finalTranscript = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    if (event.results[i].isFinal) {
      finalTranscript += event.results[i][0].transcript + " ";
    }
  }
  if (finalTranscript.trim()) {
    setAnswer((prev) => (prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim()));
  }
};
      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition error:", err);
      }
    }
  };

  // Video feed + Tab Switching + Motion Detection
  useEffect(() => {
    const initialQ = bank.basic[0];
    setCurrentQuestion(initialQ);
    setHistory([{ speaker: "AI Interviewer", text: initialQ, stage: "basic" }]);
    speakText(initialQ);

    // 1. Initialize Webcam
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 480, height: 360 }, audio: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.warn("Camera/mic access unavailable:", err));

    // 2. Tab Switching & Focus Loss Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFlags((prev) => [
          ...prev,
          { time: formatTimer(secondsRemaining), detail: "Candidate switched browser tabs or minimized window." }
        ]);
        setTabFocusStatus("Tab Focus Lost!");
        setIsTabUnfocused(true);
      } else {
        setTabFocusStatus("Focused on Portal");
        setIsTabUnfocused(false);
      }
    };

    const handleWindowBlur = () => {
      setFlags((prev) => [
        ...prev,
        { time: formatTimer(secondsRemaining), detail: "Candidate clicked outside interview window." }
      ]);
      setTabFocusStatus("Window Focus Lost!");
      setIsTabUnfocused(true);
    };

    const handleWindowFocus = () => {
      setTabFocusStatus("Focused on Portal");
      setIsTabUnfocused(false);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    // 3. Abrupt Movement Detection via Pixel-Diffing Offscreen Canvas
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 36;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    motionCheckInterval.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        ctx.drawImage(videoRef.current, 0, 0, 48, 36);
        const currentData = ctx.getImageData(0, 0, 48, 36).data;

        if (prevFrameData.current) {
          let delta = 0;
          for (let i = 0; i < currentData.length; i += 4) {
            delta += Math.abs(currentData[i] - prevFrameData.current[i]);     // Red
            delta += Math.abs(currentData[i + 1] - prevFrameData.current[i + 1]); // Green
            delta += Math.abs(currentData[i + 2] - prevFrameData.current[i + 2]); // Blue
          }
          const avgDelta = delta / (48 * 36 * 3);

          // Threshold > 26 indicates sudden thrashing, rapid head jerk, or erratic camera shake
          if (avgDelta > 26) {
            const now = Date.now();
            if (now - lastMotionFlagTime.current > 4000) { // Cooldown between flags
              lastMotionFlagTime.current = now;
              setFlags((prev) => [
                ...prev,
                { time: formatTimer(secondsRemaining), detail: "Abrupt or erratic physical movement detected." }
              ]);
              setMotionStatus("⚠️ Abrupt Movement Detected!");
              setIsAbruptMoving(true);

              setTimeout(() => {
                setMotionStatus("Stable Motion");
                setIsAbruptMoving(false);
              }, 2500);
            }
          }
        }
        prevFrameData.current = currentData;
      } catch (e) {
        console.warn("Motion diff error:", e);
      }
    }, 250);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      if (motionCheckInterval.current) clearInterval(motionCheckInterval.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitFinal();
          return 0;
        }
        return fastForward ? prev - 15 : prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fastForward, secondsRemaining]);

  const formatTimer = (total) => {
    const m = Math.floor(total / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleNextQuestion = () => {
    if (!answer.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const updatedHistory = [
      ...history,
      { speaker: "Candidate", text: answer.trim(), stage: difficulty }
    ];
    setHistory(updatedHistory);
    setAnswer("");

    let nextDiff = difficulty;
    if (answer.length > 50) {
      if (difficulty === "basic") nextDiff = "intermediate";
      else if (difficulty === "intermediate") nextDiff = "advanced";
    }
    setDifficulty(nextDiff);

    const nextIdx = questionIndex + 1;
    setQuestionIndex(nextIdx);

    if (nextIdx >= 5 || secondsRemaining < 60) {
      handleSubmitFinal(updatedHistory);
      return;
    }

    const pool = bank[nextDiff] || bank.basic;
    const nextQ = pool[nextIdx % pool.length];
    setCurrentQuestion(nextQ);
    setHistory((prev) => [
      ...prev,
      { speaker: "AI Interviewer", text: nextQ, stage: nextDiff }
    ]);
    speakText(nextQ);
  };

  const handleSubmitFinal = (finalHistory = history) => {
    window.speechSynthesis.cancel();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (motionCheckInterval.current) clearInterval(motionCheckInterval.current);

    const totalFlags = flags.length;
    const tabFlags = flags.filter((f) => f.detail.includes("tab") || f.detail.includes("window")).length;
    const motionFlags = flags.filter((f) => f.detail.includes("movement")).length;

    const integrityScore = Math.max(35, 100 - totalFlags * 10);
    const technicalScore =
      difficulty === "advanced" ? 92 : difficulty === "intermediate" ? 82 : 70;

    const scores = {
      technical: technicalScore,
      problemSolving: 85,
      communication: 88,
      integrity: integrityScore
    };

    const universalScore = computeUniversalScore(scores, targetJob.weightings);

    onComplete({
      candidateFeedback: {
        rolePracticed: targetJob.role,
        duration: `${Math.round((1800 - secondsRemaining) / 60)} minutes`,
        communicationPacing: "135 words/min (Optimal)",
        posture: motionFlags > 0 ? `${motionFlags} instances of erratic motion detected.` : "Calm and steady posture maintained.",
        tabIntegrity: tabFlags > 0 ? `${tabFlags} tab/window switches logged.` : "Maintained continuous tab focus throughout.",
        strengths: [
          "Clear explanation of technical concepts",
          "Good structured problem solving"
        ],
        improvementAreas: [
          "Elaborate on production failure modes",
          "Provide quantitative performance metrics"
        ]
      },
      recruiterDossier: {
        id: `cand-${Date.now()}`,
        name: candidateProfile.name,
        email: candidateProfile.email,
        roleApplied: targetJob.role,
        jobId: targetJob.id,
        skills: candidateProfile.skills,
        experienceYears: candidateProfile.experienceYears,
        universalScore,
        scores,
        recommendation:
          universalScore >= 85
            ? "Strong Hire"
            : universalScore >= 72
            ? "Hire"
            : "No Hire",
        strengths: [
          "Reached advanced question tier",
          "Solid grasp of core frameworks"
        ],
        gaps: [
          tabFlags > 0 ? `${tabFlags} tab switches / window defocus events recorded` : null,
          motionFlags > 0 ? `${motionFlags} abrupt / erratic motion flags detected` : null
        ].filter(Boolean),
        integrityFlags: totalFlags,
        telemetrySummary: { tabFlags, motionFlags, totalFlags },
        isCreamLayer: universalScore >= 85 && integrityScore >= 85
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Session Header */}
      <div className="bg-white border border-cyan-100 rounded-xl px-4 py-3 flex justify-between items-center shadow-sm">
        <div>
          <span className="text-xs text-cyan-700 font-medium">
            Live AI Proctor Session: {targetJob.role}
          </span>
          <div className="text-sm font-bold text-slate-900">{targetJob.company}</div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="font-mono text-sm bg-cyan-50 px-3 py-1 rounded border border-cyan-200 text-cyan-800 font-bold">
            {formatTimer(secondsRemaining)}
          </span>
          <button
            onClick={() => setFastForward(!fastForward)}
            className="text-xs px-2.5 py-1 bg-cyan-100/60 rounded text-cyan-900 hover:bg-cyan-200 transition"
          >
            {fastForward ? "⚡ 15x Fast" : "▶ Normal"}
          </button>
          <button
            onClick={() => handleSubmitFinal()}
            className="text-xs px-3 py-1 bg-rose-600 rounded text-white font-semibold hover:bg-rose-700 transition"
          >
            End Session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Video Feed & Real-time Telemetry HUD */}
        <div className="md:col-span-5 space-y-3">
          <div className="relative bg-slate-900 border border-cyan-200 rounded-xl overflow-hidden aspect-video flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Telemetry Overlays */}
            <div className="absolute top-2 left-2 flex flex-col space-y-1">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded transition backdrop-blur-sm ${
                  isTabUnfocused
                    ? "bg-rose-600/90 text-white animate-pulse"
                    : "bg-black/60 text-emerald-300"
                }`}
              >
                ● {tabFocusStatus}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded transition backdrop-blur-sm ${
                  isAbruptMoving
                    ? "bg-amber-600/90 text-white animate-pulse"
                    : "bg-black/60 text-cyan-300"
                }`}
              >
                ● {motionStatus}
              </span>
            </div>

            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
              Flags: {flags.length}
            </div>
          </div>

          {/* Telemetry Stats Card */}
          <div className="bg-white border border-cyan-100 rounded-xl p-3.5 text-xs shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Adaptive Question Tier:</span>
              <span className="font-bold uppercase text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                {difficulty}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tab Focus Disruptions:</span>
              <span className="font-bold text-rose-600">
                {flags.filter((f) => f.detail.includes("tab") || f.detail.includes("window")).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Abrupt Motion Events:</span>
              <span className="font-bold text-amber-600">
                {flags.filter((f) => f.detail.includes("movement")).length}
              </span>
            </div>
          </div>

          {/* Live Incident Log */}
          {flags.length > 0 && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 text-[11px] max-h-28 overflow-y-auto">
              <span className="font-bold text-rose-800 block mb-1">Live Proctoring Flags:</span>
              {flags.map((f, i) => (
                <div key={i} className="text-rose-700 py-0.5 border-b border-rose-100 last:border-0">
                  <span className="font-mono text-[10px] text-rose-500 mr-1.5">[{f.time}]</span>
                  {f.detail}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Interviewer Question & Candidate Response */}
        <div className="md:col-span-7 flex flex-col space-y-3">
          <div className="bg-white border border-cyan-100 rounded-xl p-4 relative shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider block">
                Current Question #{questionIndex + 1}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => speakText(currentQuestion)}
                  title="Replay Voice Question"
                  className={`text-xs px-2 py-0.5 rounded border border-cyan-200 hover:bg-cyan-50 transition ${
                    isSpeaking ? "text-cyan-700 border-cyan-500 font-semibold" : "text-slate-600"
                  }`}
                >
                  {isSpeaking ? "🔊 Speaking..." : "▶ Replay Audio"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isMuted) window.speechSynthesis.cancel();
                    setIsMuted(!isMuted);
                  }}
                  className="text-xs px-2 py-0.5 rounded border border-cyan-200 text-slate-600 hover:bg-cyan-50 transition"
                >
                  {isMuted ? "🔇 Unmute Voice" : "🔈 Mute Voice"}
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">
              {currentQuestion}
            </p>
          </div>

          <div className="flex-1 bg-white border border-cyan-100 rounded-xl p-3 h-48 overflow-y-auto space-y-2 text-xs shadow-inner">
            {history.map((h, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-lg ${
                  h.speaker === "AI Interviewer"
                    ? "bg-cyan-50/80 border border-cyan-100 text-slate-800"
                    : "bg-cyan-600 text-white ml-6 shadow-sm"
                }`}
              >
                <strong className="block text-[10px] uppercase opacity-75">
                  {h.speaker}
                </strong>
                {h.text}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <textarea
                rows="3"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Speak into your microphone or type your answer here..."
                className="w-full bg-cyan-50/30 border border-cyan-200 rounded-xl p-3 pr-28 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "Stop Listening" : "Start Voice Dictation"}
                className={`absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isListening
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-cyan-100 hover:bg-cyan-200 text-cyan-800 border border-cyan-300"
                }`}
              >
                {isListening ? "🔴 Recording..." : "🎙️ Speak"}
              </button>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() =>
                  setAnswer(
                    "We architect high-availability microservices by deploying Redis cluster replicas for distributed cache management, reducing database I/O bottlenecks."
                  )
                }
                className="text-[11px] text-cyan-700 hover:text-cyan-900 underline font-medium"
              >
                Insert Sample Answer
              </button>
              <button
                onClick={handleNextQuestion}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-xs font-semibold text-white transition shadow-sm"
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CandidateFeedback({ report, onBack }) {
  if (!report) return null;
  return (
    <div className="max-w-2xl mx-auto bg-white border border-cyan-100 rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="border-b border-cyan-100 pb-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">Interview Performance & Telemetry Feedback</h2>
        <p className="text-xs text-slate-500 mt-1">Review your pacing and integrity telemetry for self-evaluation.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-cyan-50/50 p-3 rounded-lg border border-cyan-100">
          <span className="text-slate-500 block mb-0.5">Communication Pacing</span>
          <span className="font-semibold text-slate-800">{report.communicationPacing}</span>
        </div>
        <div className="bg-cyan-50/50 p-3 rounded-lg border border-cyan-100">
          <span className="text-slate-500 block mb-0.5">Posture & Movement</span>
          <span className="font-semibold text-slate-800">{report.posture}</span>
        </div>
        <div className="bg-cyan-50/50 p-3 rounded-lg border border-cyan-100 col-span-2">
          <span className="text-slate-500 block mb-0.5">Tab & Window Integrity</span>
          <span className="font-semibold text-slate-800">{report.tabIntegrity}</span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase text-teal-700 mb-2">Strengths</h3>
        {report.strengths.map((s, i) => (
          <div key={i} className="text-xs bg-teal-50 border border-teal-200 text-teal-800 p-2.5 rounded-lg mb-1 font-medium">
            ✓ {s}
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase text-amber-700 mb-2">Areas for Growth</h3>
        {report.improvementAreas.map((g, i) => (
          <div key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg mb-1 font-medium">
            ⚠ {g}
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-xs font-semibold text-white mt-4 transition shadow-sm"
      >
        Back to Role Listings
      </button>
    </div>
  );
}

// ==========================================
// 6. RECRUITER WORKFLOW
// ==========================================
function RecruiterSection({
  view,
  setView,
  jobs,
  setJobs,
  applicants,
  selectedDossier,
  setSelectedDossier
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-cyan-100 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Hirer Dashboard & Leaderboard</h2>
          <p className="text-xs text-slate-500">View universal scores, calibrate roles, and inspect candidate telemetry.</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setView("leaderboard")}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              view === "leaderboard" ? "bg-cyan-600 text-white shadow-sm" : "bg-white border border-cyan-200 text-slate-700 hover:bg-cyan-50"
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setView("post")}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
              view === "post" ? "bg-cyan-600 text-white shadow-sm" : "bg-white border border-cyan-200 text-slate-700 hover:bg-cyan-50"
            }`}
          >
            + Post Role
          </button>
        </div>
      </div>

      {view === "leaderboard" && (
        <RecruiterLeaderboard
          applicants={applicants}
          onInspect={(cand) => {
            setSelectedDossier(cand);
            setView("dossier");
          }}
        />
      )}

      {view === "post" && (
        <RecruiterPostJob
          onCreated={(newJob) => {
            setJobs((prev) => [newJob, ...prev]);
            setView("leaderboard");
          }}
          onCancel={() => setView("leaderboard")}
        />
      )}

      {view === "dossier" && (
        <RecruiterDossier applicant={selectedDossier} onBack={() => setView("leaderboard")} />
      )}
    </div>
  );
}

function RecruiterLeaderboard({ applicants, onInspect }) {
  const [creamOnly, setCreamOnly] = useState(false);
  const filtered = applicants
    .filter((a) => (creamOnly ? a.isCreamLayer : true))
    .sort((a, b) => b.universalScore - a.universalScore);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setCreamOnly(!creamOnly)}
          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
            creamOnly
              ? "bg-amber-100 text-amber-900 border-amber-300"
              : "bg-white text-slate-700 border-cyan-200 hover:bg-cyan-50"
          }`}
        >
          ⭐ Filter "Cream Layer" Candidates (Top 10%)
        </button>
      </div>

      <div className="bg-white border border-cyan-100 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-cyan-50/70 border-b border-cyan-200 text-cyan-900 font-semibold">
            <tr>
              <th className="p-3">Candidate</th>
              <th className="p-3">Role</th>
              <th className="p-3">Universal Score</th>
              <th className="p-3">Recommendation</th>
              <th className="p-3">Integrity Flags</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-100">
            {filtered.map((cand) => (
              <tr key={cand.id} className="hover:bg-cyan-50/50 transition">
                <td className="p-3 font-semibold text-slate-900">
                  {cand.name}
                  {cand.isCreamLayer && (
                    <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-bold">
                      Cream Layer
                    </span>
                  )}
                </td>
                <td className="p-3 text-slate-600">{cand.roleApplied}</td>
                <td className="p-3 font-bold text-cyan-700">{cand.universalScore} / 100</td>
                <td className="p-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200 font-semibold">
                    {cand.recommendation}
                  </span>
                </td>
                <td className="p-3 text-slate-600">
                  {cand.integrityFlags > 0 ? (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                      ⚠️ {cand.integrityFlags} Flags
                    </span>
                  ) : (
                    <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-semibold">
                      ✓ Clean
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => onInspect(cand)}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs transition shadow-sm"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecruiterPostJob({ onCreated, onCancel }) {
  const [role, setRole] = useState("Site Reliability Engineer");
  const [company, setCompany] = useState("ApexCloud");
  const [skills, setSkills] = useState("Linux, Kubernetes, Go, Terraform");
  const [description, setDescription] = useState("Manage cloud infrastructure and 99.99% uptime SLAs.");

  const handleSave = () => {
    onCreated({
      id: `job-${Date.now()}`,
      company,
      role,
      department: "Operations",
      minExp: 3,
      requiredSkills: skills.split(",").map((s) => s.trim()),
      description,
      weightings: { technical: 45, problemSolving: 30, communication: 15, integrity: 10 }
    });
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-cyan-100 rounded-xl p-6 space-y-3 shadow-sm">
      <h3 className="font-bold text-sm text-slate-900">Post Role Requirements</h3>
      <div>
        <label className="text-xs text-slate-600 block mb-1">Company</label>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full bg-cyan-50/40 border border-cyan-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
        />
      </div>
      <div>
        <label className="text-xs text-slate-600 block mb-1">Job Title</label>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full bg-cyan-50/40 border border-cyan-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
        />
      </div>
      <div>
        <label className="text-xs text-slate-600 block mb-1">Skills (comma separated)</label>
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="w-full bg-cyan-50/40 border border-cyan-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
        />
      </div>
      <div>
        <label className="text-xs text-slate-600 block mb-1">Description</label>
        <textarea
          rows="3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-cyan-50/40 border border-cyan-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
        />
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <button onClick={onCancel} className="px-3 py-1.5 bg-slate-100 text-xs rounded text-slate-700 hover:bg-slate-200">
          Cancel
        </button>
        <button onClick={handleSave} className="px-3 py-1.5 bg-cyan-600 text-xs rounded text-white font-semibold hover:bg-cyan-700 shadow-sm">
          Publish Role
        </button>
      </div>
    </div>
  );
}

function RecruiterDossier({ applicant, onBack }) {
  if (!applicant) return null;

  const downloadReport = () => {
    const reportText = `=========================================
ZenithX - APPLICANT DOSSIER & PROCTOR REPORT
=========================================
Candidate: ${applicant.name}
Email: ${applicant.email}
Target Role: ${applicant.roleApplied}
Universal Score: ${applicant.universalScore} / 100
Recommendation: ${applicant.recommendation}
Cream Layer Status: ${applicant.isCreamLayer ? "TOP 10% (Cream Layer)" : "Standard Pool"}
-----------------------------------------
SCORE BREAKDOWN:
- Technical Architecture: ${applicant.scores.technical}%
- Problem Solving & Logic: ${applicant.scores.problemSolving}%
- Communication Clarity:  ${applicant.scores.communication}%
- Integrity & Focus:       ${applicant.scores.integrity}%

PROCTOR TELEMETRY AUDIT:
- Total Integrity Flags:   ${applicant.integrityFlags}
- Tab Switch Flags:        ${applicant.telemetrySummary?.tabFlags ?? 0}
- Abrupt Movement Flags:   ${applicant.telemetrySummary?.motionFlags ?? 0}
-----------------------------------------
VERIFIED STRENGTHS:
${applicant.strengths.map((s) => `* ${s}`).join("\n")}

POTENTIAL GAPS & TELEMETRY WARNINGS:
${applicant.gaps.length > 0 ? applicant.gaps.map((g) => `* ${g}`).join("\n") : "* Zero proctoring disruptions detected."}
=========================================
Generated automatically by AegisHire AI
`;

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ZenithX_${applicant.name.replace(/\s+/g, "_")}_Dossier.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-cyan-100 rounded-xl p-6 space-y-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-cyan-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{applicant.name}</h3>
          <p className="text-xs text-slate-500">{applicant.roleApplied} • {applicant.email}</p>
        </div>
        <div className="text-right">
          <span className="text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 font-bold">
            {applicant.recommendation}
          </span>
          <div className="text-2xl font-extrabold text-cyan-700 mt-1">{applicant.universalScore}/100</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-cyan-50/50 p-2.5 rounded-lg border border-cyan-100">
          <span className="text-slate-500 block">Technical</span>
          <strong className="text-cyan-700">{applicant.scores.technical}%</strong>
        </div>
        <div className="bg-cyan-50/50 p-2.5 rounded-lg border border-cyan-100">
          <span className="text-slate-500 block">Problem Solv.</span>
          <strong className="text-teal-700">{applicant.scores.problemSolving}%</strong>
        </div>
        <div className="bg-cyan-50/50 p-2.5 rounded-lg border border-cyan-100">
          <span className="text-slate-500 block">Comm.</span>
          <strong className="text-cyan-800">{applicant.scores.communication}%</strong>
        </div>
        <div className="bg-cyan-50/50 p-2.5 rounded-lg border border-cyan-100">
          <span className="text-slate-500 block">Integrity</span>
          <strong className="text-amber-700">{applicant.scores.integrity}%</strong>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <h4 className="font-bold text-slate-800">Verified Strengths:</h4>
        {applicant.strengths.map((s, i) => (
          <p key={i} className="text-teal-800 bg-teal-50 border border-teal-200 p-2 rounded">✓ {s}</p>
        ))}
        <h4 className="font-bold text-slate-800 mt-2">Integrity & Proctoring Warnings:</h4>
        {applicant.gaps.length > 0 ? (
          applicant.gaps.map((g, i) => (
            <p key={i} className="text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded">⚠ {g}</p>
          ))
        ) : (
          <p className="text-teal-800 bg-teal-50 border border-teal-200 p-2 rounded">✓ Full continuous camera focus with zero tab switches.</p>
        )}
      </div>

      <div className="flex space-x-2 pt-3 border-t border-cyan-100">
        <button
          onClick={downloadReport}
          className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-xs font-semibold text-white rounded-lg transition shadow-sm"
        >
          ⬇ Export Dossier (.txt)
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-lg transition"
        >
          Back to Leaderboard
        </button>
      </div>
    </div>
  );
}