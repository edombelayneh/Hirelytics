// app/home/page.tsx
'use client'

import { Button } from '../components/ui/button'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { protectedAction } from '../utils/protectedAction'
import { Card } from '../components/ui/card'
import {
  Briefcase,
  BarChart3,
  Target,
  TrendingUp,
  CheckCircle2,
  Calendar,
  FileText,
  Link as LinkIcon,
  MapPin,
  ArrowRight,
  Sparkles,
  LineChart,
  Bell,
} from 'lucide-react'

function HomePage() {
  const { isSignedIn } = useAuth()

  const goto = (path: '/jobs' | '/applications') =>
    protectedAction({
      isSignedIn,
      onAuthed: () => {
        window.location.hash = path
      },
    })

  const features = [
    {
      icon: Briefcase,
      title: 'Browse Available Jobs',
      description: 'Explore curated job listings from top companies and apply with a single click.',
      color: 'text-blue-500',
    },
    {
      icon: BarChart3,
      title: 'Track Applications',
      description: 'Monitor all your applications in one place with detailed status tracking.',
      color: 'text-purple-500',
    },
    {
      icon: TrendingUp,
      title: 'Visualize Progress',
      description: 'See your job search progress through interactive charts and analytics.',
      color: 'text-green-500',
    },
    {
      icon: Target,
      title: 'Set Goals',
      description: 'Track response rates, interview conversion, and achieve your targets.',
      color: 'text-orange-500',
    },
    {
      icon: FileText,
      title: 'Detailed Notes',
      description: 'Keep track of contacts, interview notes, and important details.',
      color: 'text-pink-500',
    },
    {
      icon: Calendar,
      title: 'Timeline View',
      description: 'Visualize your application journey over time with date tracking.',
      color: 'text-cyan-500',
    },
  ]

  const stats = [
    { value: '10+', label: 'Available Jobs' },
    { value: '100%', label: 'Free Forever' },
    { value: 'Real-time', label: 'Updates' },
    { value: 'All-in-One', label: 'Dashboard' },
  ]

  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='relative overflow-hidden border-b bg-gradient-to-b from-background via-background to-muted/20'>
        <div className='absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.1))]' />
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
              <span className='text-sm'>Your All-in-One Job Search Command Center</span>
            </motion.div>

            <h1 className='mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
              Welcome to{' '}
              <img
                src='../Hirelytics_Logo.png'
                alt='Hirelytics Logo'
                className='h-20 w-auto mx-auto block'
              />
            </h1>

            <p className='mb-10 text-xl text-muted-foreground max-w-2xl mx-auto'>
              Transform your job search with intelligent tracking, powerful analytics, and organized
              application management. Land your dream job faster.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mb-12'>
              <Button
                size='lg'
                className='group gap-2'
                onClick={() => goto('/jobs')}
              >
                <Briefcase className='h-5 w-5' />
                Browse Available Jobs
                <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
              </Button>

              <Button
                size='lg'
                variant='outline'
                className='gap-2'
                onClick={() => goto('/applications')}
              >
                <BarChart3 className='h-5 w-5' />
                View My Applications
              </Button>
            </div>
            {/* Stats */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto'>
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
                  <div className='text-3xl font-bold text-primary mb-1'>{stat.value}</div>
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
          className='text-center mb-16'
        >
          <h2 className='mb-4'>Everything You Need to Succeed</h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Powerful features designed to streamline your job search and maximize your success rate.
          </p>
        </motion.div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16'>
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
                <Card className='p-6 h-full hover:shadow-lg transition-shadow border-2 hover:border-primary/50'>
                  <div className={`inline-flex rounded-lg bg-muted p-3 mb-4 ${feature.color}`}>
                    <Icon className='h-6 w-6' />
                  </div>
                  <h3 className='mb-2'>{feature.title}</h3>
                  <p className='text-muted-foreground'>{feature.description}</p>
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
            className='text-center mb-16'
          >
            <h2 className='mb-4'>How It Works</h2>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              Three simple steps to organize your job search like a pro.
            </p>
          </motion.div>

          <div className='grid md:grid-cols-3 gap-8 max-w-5xl mx-auto'>
            {[
              {
                step: '01',
                title: 'Browse Jobs',
                description:
                  'Explore our curated list of job openings from top companies across various industries.',
                icon: Briefcase,
              },
              {
                step: '02',
                title: 'Apply & Track',
                description:
                  'Apply with one click and automatically add applications to your tracking dashboard.',
                icon: CheckCircle2,
              },
              {
                step: '03',
                title: 'Monitor Progress',
                description:
                  'Track status updates, view analytics, and manage your entire job search journey.',
                icon: LineChart,
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
                  className='relative text-center'
                >
                  <div className='mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                    <Icon className='h-8 w-8' />
                  </div>
                  <div className='absolute -top-4 left-1/2 -translate-x-1/2 text-6xl opacity-10'>
                    {step.step}
                  </div>
                  <h3 className='mb-3'>{step.title}</h3>
                  <p className='text-muted-foreground'>{step.description}</p>
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
              <h2 className='mb-4'>Ready to Transform Your Job Search?</h2>
              <p className='text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
                Join thousands of job seekers who have organized their applications and landed their
                dream jobs with Hirelytics.
              </p>
              <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
                <Button
                  size='lg'
                  className='gap-2'
                  onClick={() => (window.location.hash = '#/jobs')}
                >
                  Get Started Now
                  <ArrowRight className='h-5 w-5' />
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  onClick={() => (window.location.hash = '#/applications')}
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
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            <div>
              <h3 className='mb-2'>Hirelytics</h3>
              <p className='text-sm text-muted-foreground'>
                Your intelligent job application tracker
              </p>
            </div>
            <div className='flex gap-6 text-sm text-muted-foreground'>
              <a
                href='#/jobs'
                className='hover:text-foreground transition-colors'
              >
                Available Jobs
              </a>
              <a
                href='#/applications'
                className='hover:text-foreground transition-colors'
              >
                My Applications
              </a>
            </div>
          </div>
          <div className='mt-8 pt-8 border-t text-center text-sm text-muted-foreground'>
            © {new Date().getFullYear()} Hirelytics. Built with ❤️ for job seekers.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
