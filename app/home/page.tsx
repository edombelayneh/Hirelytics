'use client'

import { Button } from '../components/ui/button'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { protectedAction } from '../utils/protectedAction'
import { Card } from '../components/ui/card'
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
  Users,
  Sparkles,
} from 'lucide-react'
// badge/icon styles moved to app/globals.css

function HomePage() {
  const { isSignedIn } = useAuth()

  // Navigates to selected section only if user is signed in.
  // If not signed in, protectedAction will show toast + open Clerk modal.
  const goto = (path: '/jobs' | '/applications') =>
    protectedAction({
      isSignedIn,
      onAuthed: () => {
        window.location.hash = path
      },
    })

  // Marketing + feature list content
  const features = [
    {
      icon: Brain,
      title: 'AI Feedback Engine',
      description:
        'Turns recruiter notes into constructive guidance so applicants learn exactly how to improve the next time.',
      color: 'gold',
    },
    {
      icon: Clock,
      title: 'Real-Time Status Updates',
      description:
        'Applicants see updates the moment actions are taken—no more guessing or inbox refreshing.',
      color: 'teal',
    },
    {
      icon: Globe,
      title: 'Smart Job Aggregation',
      description:
        'Track roles from multiple platforms in one streamlined view—fewer tabs, more clarity.',
      color: 'pink',
    },
    {
      icon: Zap,
      title: 'Recruiter Efficiency',
      description:
        'Bulk updates and one-click actions reduce manual work during peak hiring seasons.',
      color: 'gold',
    },
    {
      icon: BarChart3,
      title: 'Applicant Insights',
      description: 'Visual analytics show activity trends, response rates, and progress over time.',
      color: 'teal',
    },
    {
      icon: Shield,
      title: 'Compliance & Security',
      description:
        'Role-based access, encryption, and audit trails protect users and support privacy needs.',
      color: 'pink',
    },
  ]

  const stats = [
    { value: '10+', label: 'Available Jobs' },
    { value: '100%', label: 'Free Forever' },
    { value: 'Real-time', label: 'Updates' },
    { value: 'All-in-One', label: 'Dashboard' },
  ]

  return (
    <div className='min-h-screen flex flex-col bg-white text-black'>
      {/* Hero Section */}
      <section className='relative overflow-hidden border-b bg-gradient-to-b from-background via-background to-muted/20'>
        {/* soft background accents */}
        <div className='pointer-events-none absolute inset-0 -z-10'>
          <div
            className='absolute -top-16 -left-16 h-72 w-72 rounded-full blur-3xl'
            style={{ background: 'rgba(var(--accent-teal-rgb), 0.133)' }}
          />
          <div
            className='absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl'
            style={{ background: 'rgba(var(--accent-gold-rgb), 0.133)' }}
          />
          <div
            className='absolute top-10 -right-16 h-72 w-72 rounded-full blur-3xl'
            style={{ background: 'rgba(var(--accent-pink-rgb), 0.133)' }}
          />
        </div>
        <div className='absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.1))]' />

        {/* Main headline and call-to-action */}
        <div className='container relative mx-auto px-6 py-24'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='mx-auto max-w-4xl text-center'
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className='mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-2 backdrop-blur'
            >
              <Sparkles className='h-4 w-4 text-yellow-500' />
              <span className='text-sm'>Make Hiring Faster, Fairer, and Clearer</span>
            </motion.div>

            <img
              src='/Hirelytics_Logo.png'
              alt='Hirelytics'
              className='mx-auto mb-6 h-20 w-auto'
            />

            <p className='mx-auto mb-10 max-w-2xl text-xl text-muted-foreground'>
              Hirelytics bridges recruiters and applicants with real-time status updates, automated
              AI feedback, and a shared view of progress—so everyone knows what&apos;s happening and
              why.
            </p>
            <div className='mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Button
                size='lg'
                className='group flex items-center gap-3 rounded-lg px-6 py-3 font-semibold text-black shadow hover:-translate-y-0.5 hover:shadow-md transition'
                style={{ background: 'var(--accent-teal)' }}
                onClick={() => goto('/jobs')}
              >
                <Briefcase className='h-5 w-5' />
                Browse Available Jobs
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
              </Button>

              <Button
                size='lg'
                variant='outline'
                className='flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-black hover:bg-gray-50 transition'
                onClick={() => goto('/applications')}
              >
                <ClipboardList className='h-5 w-5' />
                View My Applications
              </Button>
            </div>
            {/* Stats */}
            <div className='mx-auto grid max-w-3xl gap-6 grid-cols-2 md:grid-cols-4'>
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2 + index * 0.1,
                    duration: 0.5,
                  }}
                  className='text-center'
                >
                  <div className='mb-1 text-3xl font-bold text-primary'>{stat.value}</div>
                  <div className='text-sm text-muted-foreground'>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className='container mx-auto px-6 py-20'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='mb-16 text-center'
        >
          <h2 className='mb-4 text-4xl font-bold'>What Makes Hirelytics Different</h2>
          <p className='mx-auto max-w-2xl text-xl text-muted-foreground'>
            Built for both applicants and recruiters—transparent, efficient, and guided by AI.
          </p>
        </motion.div>

        <div className='mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                }}
              >
                <Card className='h-full rounded-2xl border border-gray-200 bg-white p-8 transition-shadow hover:shadow-md'>
                  <div className='mb-2 flex items-center gap-6'>
                    <div
                      className='flex-shrink-0 badge size-16'
                      style={{
                        background:
                          feature.color === 'teal'
                            ? 'var(--accent-teal)'
                            : feature.color === 'pink'
                              ? 'var(--accent-pink)'
                              : 'var(--accent-gold)',
                      }}
                    >
                      <Icon className='icon size-8' />
                    </div>

                    <div>
                      <h3 className='mb-3 text-xl font-semibold text-black'>{feature.title}</h3>
                      <p className='text-muted-foreground'>{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className='border-y bg-muted/30'>
        <div className='container mx-auto px-6 py-20'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className='mb-16 text-center'
          >
            <h2 className='mb-4 text-4xl font-bold'>How It Works</h2>
            <p className='mx-auto max-w-2xl text-xl text-muted-foreground'>
              A shared workflow that respects everyone&apos;s time—clear steps, clear outcomes.
            </p>
          </motion.div>

          <div className='mx-auto grid max-w-5xl gap-8 md:grid-cols-3'>
            {[
              {
                step: '01',
                title: 'Apply & Sync',
                description:
                  'Add roles from anywhere. Your dashboard keeps every application organized and up to date.',
                icon: Briefcase,
                badge: 'gold',
              },
              {
                step: '02',
                title: 'Review & Update',
                description:
                  'Recruiters evaluate candidates and update status in one click. Actions reflect instantly.',
                icon: Users,
                badge: 'teal',
              },
              {
                step: '03',
                title: 'AI Feedback',
                description:
                  'Applicants receive structured, constructive feedback generated from recruiter notes.',
                icon: Brain,
                badge: 'pink',
              },
            ].map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.2,
                    duration: 0.5,
                  }}
                >
                  <div className='relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md'>
                    <div className='pointer-events-none absolute right-6 top-4 text-4xl font-bold text-gray-200'>
                      {step.step}
                    </div>

                    <div className='mb-6 flex justify-center'>
                      <div
                        className='badge size-16'
                        style={{
                          background:
                            step.badge === 'teal'
                              ? 'var(--accent-teal)'
                              : step.badge === 'pink'
                                ? 'var(--accent-pink)'
                                : 'var(--accent-gold)',
                        }}
                      >
                        <Icon className='icon size-8' />
                      </div>
                    </div>

                    <h3 className='mb-3 text-xl font-semibold text-black'>{step.title}</h3>
                    <p className='text-muted-foreground'>{step.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Platform Modules Section */}
      <section className='container mx-auto px-6 py-20'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className='mb-16 text-center'
        >
          <h2 className='mb-4 text-4xl font-bold'>Platform Modules</h2>
          <p className='mx-auto max-w-2xl text-xl text-muted-foreground'>
            Designed for both sides of the hiring process.
          </p>
        </motion.div>

        <div className='mx-auto max-w-5xl'>
          <div className='space-y-6'>
            {[
              {
                icon: ClipboardList,
                title: 'Applicant Dashboard',
                description:
                  'Centralized control center for your entire job search. Track every application, monitor status changes in real-time, and never miss an update across all your job applications.',
                benefits: [
                  'Unified view of all applications across platforms',
                  'Real-time status updates and notifications',
                  'Customizable tracking categories and tags',
                  'Exportable application history and analytics',
                ],
              },
              {
                icon: Users,
                title: 'Recruiter Console',
                description:
                  'Streamlined interface designed for high-volume hiring teams. Process applications faster with batch actions, automated workflows, and intelligent candidate routing.',
                benefits: [
                  'One-click bulk status updates',
                  'Automated candidate communication templates',
                  'Team collaboration and assignment tools',
                  'Integration with existing HR systems',
                ],
              },
              {
                icon: Brain,
                title: 'AI Feedback Assistant',
                description:
                  'Transform brief recruiter notes into comprehensive, constructive feedback. Our AI analyzes patterns to provide actionable insights that help candidates improve future applications.',
                benefits: [
                  'Natural language processing of recruiter comments',
                  'Personalized improvement suggestions',
                  'Skill gap analysis and learning recommendations',
                  'Tone-optimized feedback delivery',
                ],
              },
              {
                icon: BarChart3,
                title: 'Analytics & Insights',
                description:
                  'Comprehensive data visualization and reporting tools that transform hiring metrics into actionable intelligence. Track funnel performance, identify bottlenecks, and optimize your strategy.',
                benefits: [
                  'Real-time hiring funnel analytics',
                  'Customizable dashboard and reports',
                  'Predictive hiring trend analysis',
                  'Competitive benchmarking data',
                ],
              },
            ].map((module, index) => {
              const Icon = module.icon
              return (
                <motion.div
                  key={module.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.5,
                  }}
                >
                  <Card className='border-2 p-8 hover:shadow-lg transition-shadow'>
                    <div className='mb-4 flex items-center gap-3'>
                      <div className='inline-flex rounded-lg bg-muted p-3'>
                        <Icon className='h-6 w-6' />
                      </div>
                      <h3 className='text-2xl font-bold'>{module.title}</h3>
                    </div>
                    <p className='mb-6 text-lg text-muted-foreground'>{module.description}</p>
                    <h4 className='mb-3 font-semibold'>Key Benefits</h4>
                    <ul className='space-y-2'>
                      {module.benefits.map((benefit, i) => (
                        <li
                          key={i}
                          className='flex items-start gap-2'
                        >
                          <CheckCircle2 className='mt-0.5 h-5 w-5 text-primary flex-shrink-0' />
                          <span className='text-muted-foreground'>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='container mx-auto px-6 py-20'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className='relative overflow-hidden border-2'>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10' />
            <div className='relative p-12 text-center'>
              <h2 className='mb-4 text-4xl font-bold'>Start Building a Better Hiring Experience</h2>
              <p className='mx-auto mb-8 max-w-2xl text-xl text-muted-foreground'>
                Bring transparency to applicants and efficiency to recruiters—with AI that clarifies
                each step.
              </p>
              <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
                <Button
                  size='lg'
                  className='group gap-2 rounded-lg px-8 py-3 font-semibold text-black shadow hover:-translate-y-0.5 hover:shadow-md transition'
                  style={{ background: 'var(--accent-teal)' }}
                  onClick={() => goto('/jobs')}
                >
                  Get Started Now
                  <ArrowRight className='h-5 w-5' />
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='rounded-lg border border-gray-300 bg-white px-8 py-3 font-semibold text-black hover:bg-gray-50 transition'
                  onClick={() => goto('/applications')}
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className='border-t bg-muted/30 py-12'>
        <div className='container mx-auto px-6'>
          <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
            <div>
              <h3 className='mb-2 font-semibold'>Hirelytics</h3>
              <p className='text-sm text-muted-foreground max-w-md'>
                A shared platform where recruiters save time and applicants stay informed through
                AI-powered tracking, real-time updates, and constructive feedback.
              </p>
            </div>
            <div className='flex gap-6 text-sm text-muted-foreground'>
              <a
                href='#features'
                className='transition-colors hover:text-foreground'
              >
                Features
              </a>
              <a
                href='#/jobs'
                className='transition-colors hover:text-foreground'
              >
                Available Jobs
              </a>
              <a
                href='#/applications'
                className='transition-colors hover:text-foreground'
              >
                My Applications
              </a>
            </div>
          </div>
          <div className='mt-8 flex flex-col gap-3 border-t pt-6 text-center text-sm text-muted-foreground md:flex-row md:items-center md:justify-between'>
            <p>© {new Date().getFullYear()} Hirelytics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
