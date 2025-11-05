import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Clock,
  Globe,
  Zap,
  Shield,
  BarChart3,
  Briefcase,
  ClipboardList,
  CheckCircle2,
  LineChart,
  ArrowRight,
  Users
} from "lucide-react";

// Define types for the use cases
interface UseCaseResult {
  image?: string;
  alt?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  points?: string[];
}

interface UseCase {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  results: UseCaseResult;
}

type UseCaseKey = "applicant-dashboard" | "recruiter-console" | "ai-feedback-assistant" | "analytics-insights";

export default function App() {
  const [activeTab, setActiveTab] = useState<UseCaseKey>("applicant-dashboard");

  // CTA handlers - UPDATED TO MATCH page.tsx HASH ROUTING
  const goGetStarted = () => (window.location.hash = "#/jobs");
  const goDashboard = () => (window.location.hash = "#/applications");
  const goJobs = () => (window.location.hash = "#/jobs");
  const goApplications = () => (window.location.hash = "#/applications");

  // Palette helpers
  const accents = {
    teal: "#A9EEF2",
    gold: "#F0D044",
    pink: "#EF56C2",
  };

  // Use Cases with unique content for each (removed mobile and compliance)
  const useCases: Record<UseCaseKey, UseCase> = {
    "applicant-dashboard": {
      icon: <ClipboardList className="h-6 w-6" />,
      title: "Applicant Dashboard",
      description: "Centralized control center for your entire job search. Track every application, monitor status changes in real-time, and never miss an update across all your job applications.",
      benefits: [
        "Unified view of all applications across platforms",
        "Real-time status updates and notifications",
        "Customizable tracking categories and tags",
        "Exportable application history and analytics",
      ],
      results: {
        image: "/Applicantinterface.png",
        alt: "Applicant Dashboard Interface",
        title: "Intuitive Applicant Experience",
        description: "Our clean, user-friendly interface makes job tracking simple and efficient"
      }
    },
    "recruiter-console": {
      icon: <Users className="h-6 w-6" />,
      title: "Recruiter Console",
      description: "Streamlined interface designed for high-volume hiring teams. Process applications faster with batch actions, automated workflows, and intelligent candidate routing.",
      benefits: [
        "One-click bulk status updates",
        "Automated candidate communication templates",
        "Team collaboration and assignment tools",
        "Integration with existing HR systems",
      ],
      results: {
        image: "/Recruiterinterface.png",
        alt: "Applicant Dashboard Interface",
        title: "Improved Hiring Operations",
        description: "Empower recruiters with automation-driven workflows and real-time insights."
      
      }
    },
    "ai-feedback-assistant": {
      icon: <Brain className="h-6 w-6" />,
      title: "AI Feedback Assistant",
      description: "Transform brief recruiter notes into comprehensive, constructive feedback. Our AI analyzes patterns to provide actionable insights that help candidates improve future applications.",
      benefits: [
        "Natural language processing of recruiter comments",
        "Personalized improvement suggestions",
        "Skill gap analysis and learning recommendations",
        "Tone-optimized feedback delivery",
      ],
      results: {
        image: "/Postinterview.png",
        alt: "Applicant Dashboard Interface",
        title: "Insightful Post-Interview Feedback",
        description: "Transform interviews into learning opportunities for improvement and career development."
      
      }
    },
    "analytics-insights": {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics & Insights",
      description: "Comprehensive data visualization and reporting tools that transform hiring metrics into actionable intelligence. Track funnel performance, identify bottlenecks, and optimize your strategy.",
      benefits: [
        "Real-time hiring funnel analytics",
        "Customizable dashboard and reports",
        "Predictive hiring trend analysis",
        "Competitive benchmarking data",
      ],
      results: {
        icon: <LineChart className="h-10 w-10 text-gray-800" />,
        title: "Data-Driven Results",
        description: "Organizations using analytics see:",
        points: [
          "34% reduction in time-to-hire",
          "27% improvement in candidate quality",
          "52% better resource allocation",
          "41% cost savings in hiring process"
        ]
      }
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Hero Section */}
      <header className="relative overflow-hidden px-6 py-20 text-center">
        {/* soft background accents */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute -top-16 -left-16 h-72 w-72 rounded-full blur-3xl"
            style={{ background: `${accents.teal}22` }}
          />
          <div
            className="absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: `${accents.gold}22` }}
          />
          <div
            className="absolute top-10 -right-16 h-72 w-72 rounded-full blur-3xl"
            style={{ background: `${accents.pink}22` }}
          />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 max-w-4xl text-5xl font-bold leading-tight"
        >
          Make Hiring Faster, Fairer, and Clearer
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mx-auto mb-10 max-w-2xl text-lg text-gray-700"
        >
          Hirelytics bridges recruiters and applicants with real-time status
          updates, automated AI feedback, and a shared view of progress—so
          everyone knows what's happening and why.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {/* UPDATED WITH HASH ROUTING */}
          <button
            onClick={goJobs}
            className="group flex items-center gap-3 rounded-lg bg-[#63c1c6ff] px-6 py-3 font-semibold text-white shadow hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <Briefcase className="h-5 w-5" />
            Browse Available Jobs
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>

          {/* UPDATED WITH HASH ROUTING */}
          <button
            onClick={goApplications}
            className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-black hover:bg-gray-50 transition"
          >
            <ClipboardList className="h-5 w-5" />
            View My Applications
          </button>
        </motion.div>
      </header>

      {/* Features Section */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto mb-14 max-w-7xl text-center">
          <h2 className="mb-3 text-4xl font-bold">What Makes Hirelytics Different</h2>
          <p className="mx-auto max-w-2xl text-gray-700">
            Built for both applicants and recruiters—transparent, efficient, and guided by AI.
          </p>
        </div>

        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Brain className="h-6 w-6" />,
              title: "AI Feedback Engine",
              description:
                "Turns recruiter notes into constructive guidance so applicants learn exactly how to improve the next time.",
              color: "teal",
            },
            {
              icon: <Clock className="h-6 w-6" />,
              title: "Real-Time Status Updates",
              description:
                "Applicants see updates the moment actions are taken—no more guessing or inbox refreshing.",
              color: "pink",
            },
            {
              icon: <Globe className="h-6 w-6" />,
              title: "Smart Job Aggregation",
              description:
                "Track roles from multiple platforms in one streamlined view—fewer tabs, more clarity.",
              color: "gold",
            },
            {
              icon: <Zap className="h-6 w-6" />,
              title: "Recruiter Efficiency",
              description:
                "Bulk updates and one-click actions reduce manual work during peak hiring seasons.",
              color: "teal",
            },
            {
              icon: <BarChart3 className="h-6 w-6" />,
              title: "Applicant Insights",
              description:
                "Visual analytics show activity trends, response rates, and progress over time.",
              color: "pink",
            },
            {
              icon: <Shield className="h-6 w-6" />,
              title: "Compliance & Security",
              description:
                "Role-based access, encryption, and audit trails protect users and support privacy needs.",
              color: "gold",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div
                className="mb-4 inline-flex rounded-lg p-3"
                style={{
                  background:
                    f.color === "teal"
                      ? `${accents.teal}33`
                      : f.color === "pink"
                      ? `${accents.pink}33`
                      : `${accents.gold}33`,
                  color:
                    f.color === "teal"
                      ? "#0b6e77"
                      : f.color === "pink"
                      ? "#7a1b57"
                      : "#6f5b00",
                }}
              >
                {f.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-black">{f.title}</h3>
              <p className="text-gray-700">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto mb-14 max-w-7xl text-center">
          <h2 className="mb-3 text-4xl font-bold">How It Works</h2>
          <p className="mx-auto max-w-2xl text-gray-700">
            A shared workflow that respects everyone's time—clear steps, clear outcomes.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Apply & Sync",
              description:
                "Add roles from anywhere. Your dashboard keeps every application organized and up to date.",
              Icon: Briefcase,
              badge: accents.teal,
            },
            {
              step: "02",
              title: "Review & Update",
              description:
                "Recruiters evaluate candidates and update status in one click. Actions reflect instantly.",
              Icon: Users,
              badge: accents.pink,
            },
            {
              step: "03",
              title: "AI Feedback",
              description:
                "Applicants receive structured, constructive feedback generated from recruiter notes.",
              Icon: Brain,
              badge: accents.gold,
            },
          ].map(({ step, title, description, Icon, badge }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <div
                className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full text-white shadow"
                style={{ background: badge }}
              >
                <Icon className="h-8 w-8" />
              </div>
              <div className="pointer-events-none absolute right-6 top-4 text-4xl font-bold text-gray-200">
                {step}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-black">{title}</h3>
              <p className="text-gray-700">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="px-6 py-20">
        <div className="mx-auto mb-10 max-w-7xl text-center">
          <h2 className="mb-3 text-4xl font-bold">Use Cases</h2>
          <p className="mx-auto max-w-2xl text-gray-700">
            Platform modules designed for both sides of the hiring process.
          </p>
        </div>

        {/* Tabs - Only 4 use cases now */}
        <div className="mx-auto mb-10 flex max-w-5xl flex-wrap justify-center gap-3">
          {(Object.entries(useCases) as [UseCaseKey, UseCase][]).map(([key, uc]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition ${
                activeTab === key
                  ? "bg-black text-white shadow"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              <span>{uc.icon}</span>
              <span>{uc.title}</span>
            </button>
          ))}
        </div>

        {/* Active tab panel - UPDATED WITH WHITE BACKGROUND ON RIGHT */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-gray-200 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row">
            <div className="w-full p-8 lg:w-1/2 lg:p-10">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-lg"
                  style={{ background: `${accents.teal}33` }}
                >
                  {useCases[activeTab].icon}
                </div>
                <h3 className="text-2xl font-bold">{useCases[activeTab].title}</h3>
              </div>
              <p className="mb-6 text-lg text-gray-700">
                {useCases[activeTab].description}
              </p>

              <h4 className="mb-3 font-semibold">Key Benefits</h4>
              <ul className="mb-8 space-y-2">
                {useCases[activeTab].benefits.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-5 w-5" style={{ color: accents.teal }} />
                    <span className="text-gray-800">{b}</span>
                  </li>
                ))}
              </ul>

              {/* UPDATED WITH HASH ROUTING */}
              <button
                onClick={goGetStarted}
                className="group flex items-center gap-2 rounded-lg bg-black px-6 py-3 font-semibold text-white hover:opacity-90"
              >
                Learn More
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* UPDATED RIGHT PANEL - WHITE BACKGROUND WITH BLACK TEXT */}
            <div className="w-full bg-white p-8 lg:w-1/2 lg:p-10">
              {useCases[activeTab].results.image ? (
                // Updated image display for applicant-dashboard - now with white background
                <div className="max-w-md mx-auto rounded-2xl bg-white p-8 text-center border border-gray-200">
                  <div className="mb-4 flex justify-center">
                    <img 
                      src={useCases[activeTab].results.image} 
                      alt={useCases[activeTab].results.alt}
                      className="rounded-xl shadow-2xl border-4 border-gray-100 max-w-full h-auto"
                      style={{ maxWidth: '280px' }}
                    />
                  </div>
                  <h4 className="mb-2 text-xl font-bold text-gray-800">{useCases[activeTab].results.title}</h4>
                  <p className="text-gray-700">{useCases[activeTab].results.description}</p>
                </div>
              ) : (
                // Updated results content for other use cases - white background with black text
                <div className="max-w-md mx-auto rounded-2xl bg-white p-8 text-center border border-gray-200">
                  {useCases[activeTab].results.icon}
                  <h4 className="mb-2 text-xl font-bold text-gray-800">{useCases[activeTab].results.title}</h4>
                  <p className="mb-4 text-gray-700">
                    {useCases[activeTab].results.description}
                  </p>
                  <div className="space-y-2 text-gray-800 text-left">
                    {useCases[activeTab].results.points?.map((point: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-gray-600" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h2 className="mb-4 text-4xl font-bold">Start Building a Better Hiring Experience</h2>
          <p className="mx-auto mb-8 max-w-2xl text-gray-700">
            Bring transparency to applicants and efficiency to recruiters—with AI that clarifies each step.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* UPDATED WITH HASH ROUTING */}
            <button
              onClick={goGetStarted}
              className="group flex items-center gap-2 rounded-lg bg-[#63c1c6ff] px-8 py-3 font-semibold text-white shadow hover:-translate-y-0.5 hover:shadow-md transition"
            >
              Get Started Now
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            
            {/* UPDATED WITH HASH ROUTING */}
            <button
              onClick={goDashboard}
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-black hover:bg-gray-50 transition"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Footer - SIMPLIFIED */}
      <footer className="mt-auto border-t border-gray-200 bg-white px-6 py-14">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2">
          {/* Company Information */}
          <div>
            <div className="mb-3 flex items-center gap-3">
              <img 
                src="/Hirelytics_H-Logo.png" 
                alt="Hirelytics logo" 
                className="h-9 w-9"
              />
              <span className="text-lg font-semibold">Hirelytics</span>
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              A shared platform where recruiters save time and applicants stay informed
              through AI-powered tracking, real-time updates, and constructive feedback.
            </p>
          </div>

          {/* Product Links - Simplified */}
          <div>
            <h4 className="mb-3 font-semibold text-black">Product</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a href="#features" className="hover:text-black transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-black transition-colors">
                  Use Cases
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom - Copyright and Legal */}
        <div className="mx-auto mt-10 max-w-7xl border-t border-gray-200 pt-6 text-sm text-gray-600 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>© 2025 Hirelytics. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/terms" className="hover:text-black transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-black transition-colors">Privacy</a>
            <a href="/cookies" className="hover:text-black transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}