export interface AvailableJob {
  id: number
  title: string
  company: string
  location: string
  type: string
  postedDate: string
  salary: string
  description: string
  requirements: string[]
  status: string
  applyLink: string
}

export const availableJobs: AvailableJob[] = [
  {
    id: 1,
    title: 'Software Engineer',
    company: 'TechCorp Inc.',
    location: 'New York, NY',
    type: 'Full-time',
    postedDate: '2025-10-20',
    salary: '$95,000 - $120,000',
    description: 'Develop and maintain web applications, collaborate with cross-functional teams, and ensure code quality.',
    requirements: ['Bachelor\'s in Computer Science', '2+ years experience in software development', 'Proficiency in JavaScript and Python'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 2,
    title: 'UX/UI Designer',
    company: 'CreativeSolutions',
    location: 'Remote',
    type: 'Contract',
    postedDate: '2025-10-22',
    salary: '$45/hr',
    description: 'Design user-friendly interfaces and experiences for web and mobile platforms.',
    requirements: ['Portfolio showcasing UI/UX projects', 'Figma or Sketch proficiency', 'Strong communication skills'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 3,
    title: 'Data Analyst',
    company: 'FinAnalytics',
    location: 'Chicago, IL',
    type: 'Full-time',
    postedDate: '2025-10-18',
    salary: '$70,000 - $85,000',
    description: 'Analyze large datasets to provide actionable insights for financial decision-making.',
    requirements: ['Bachelor\'s in Statistics or related field', 'Experience with SQL and Excel', 'Knowledge of data visualization tools'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 4,
    title: 'Marketing Coordinator',
    company: 'BrandBoost',
    location: 'Los Angeles, CA',
    type: 'Full-time',
    postedDate: '2025-10-19',
    salary: '$55,000 - $65,000',
    description: 'Assist in executing marketing campaigns and coordinate with creative teams.',
    requirements: ['Bachelor\'s in Marketing or related field', 'Strong organizational skills', 'Experience with social media marketing'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 5,
    title: 'Frontend Developer',
    company: 'Webify Labs',
    location: 'Austin, TX',
    type: 'Part-time',
    postedDate: '2025-10-21',
    salary: '$60/hr',
    description: 'Build and maintain responsive user interfaces using React and modern web technologies.',
    requirements: ['Proficiency in React and JavaScript', 'Experience with CSS and HTML', 'Attention to detail'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 6,
    title: 'Backend Developer',
    company: 'CloudNet Solutions',
    location: 'Seattle, WA',
    type: 'Full-time',
    postedDate: '2025-10-23',
    salary: '$100,000 - $130,000',
    description: 'Develop scalable backend systems and APIs for cloud-based applications.',
    requirements: ['Experience with Node.js or Python', 'Knowledge of RESTful APIs', 'Database management experience'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 7,
    title: 'Project Manager',
    company: 'Innovatech',
    location: 'Boston, MA',
    type: 'Full-time',
    postedDate: '2025-10-21',
    salary: '$80,000 - $95,000',
    description: 'Lead cross-functional teams and ensure project deadlines are met efficiently.',
    requirements: ['PMP certification', 'Strong leadership and communication skills', '3+ years project management experience'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 8,
    title: 'Mobile App Developer',
    company: 'Appify Studio',
    location: 'Remote',
    type: 'Contract',
    postedDate: '2025-10-20',
    salary: '$50/hr',
    description: 'Build and maintain mobile applications for iOS and Android platforms.',
    requirements: ['Proficiency in Swift and Kotlin', 'Experience with React Native or Flutter', 'Portfolio of mobile apps'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 9,
    title: 'QA Engineer',
    company: 'NextGen Software',
    location: 'Denver, CO',
    type: 'Full-time',
    postedDate: '2025-10-19',
    salary: '$70,000 - $85,000',
    description: 'Design and execute test plans to ensure software quality.',
    requirements: ['Experience with automated testing tools', 'Attention to detail', 'Knowledge of CI/CD pipelines'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 10,
    title: 'DevOps Engineer',
    company: 'InfraTech',
    location: 'San Francisco, CA',
    type: 'Full-time',
    postedDate: '2025-10-18',
    salary: '$110,000 - $140,000',
    description: 'Manage cloud infrastructure and automate deployment pipelines.',
    requirements: ['Experience with AWS or Azure', 'Knowledge of CI/CD and containerization', 'Scripting skills (Python, Bash)'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 11,
    title: 'Content Writer',
    company: 'WriteWorks',
    location: 'Remote',
    type: 'Part-time',
    postedDate: '2025-10-22',
    salary: '$30/hr',
    description: 'Create engaging and SEO-friendly content for blogs, websites, and social media.',
    requirements: ['Excellent writing and editing skills', 'Experience with content management systems', 'Knowledge of SEO best practices'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 12,
    title: 'Cybersecurity Analyst',
    company: 'SecureTech',
    location: 'Washington, D.C.',
    type: 'Full-time',
    postedDate: '2025-10-20',
    salary: '$95,000 - $120,000',
    description: 'Monitor and protect networks and systems from cyber threats.',
    requirements: ['Knowledge of security protocols', 'Experience with firewalls and intrusion detection systems', 'Certifications like CISSP or CEH preferred'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 13,
    title: 'Graphic Designer',
    company: 'PixelWorks',
    location: 'Chicago, IL',
    type: 'Contract',
    postedDate: '2025-10-21',
    salary: '$40/hr',
    description: 'Design visual content for web, print, and social media campaigns.',
    requirements: ['Proficiency in Adobe Creative Suite', 'Portfolio of design projects', 'Strong creative skills'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 14,
    title: 'HR Specialist',
    company: 'PeopleFirst',
    location: 'Atlanta, GA',
    type: 'Full-time',
    postedDate: '2025-10-19',
    salary: '$60,000 - $75,000',
    description: 'Manage recruitment, employee relations, and HR compliance.',
    requirements: ['Bachelor\'s in Human Resources', 'Experience with HRIS systems', 'Excellent interpersonal skills'],
    status: 'Open',
    applyLink: '#'
  },
  {
    id: 15,
    title: 'AI/ML Engineer',
    company: 'DeepLearn Labs',
    location: 'Palo Alto, CA',
    type: 'Full-time',
    postedDate: '2025-10-18',
    salary: '$120,000 - $150,000',
    description: 'Develop and deploy machine learning models for real-world applications.',
    requirements: ['Experience with Python and TensorFlow or PyTorch', 'Strong knowledge of ML algorithms', 'Data preprocessing and model evaluation skills'],
    status: 'Open',
    applyLink: '#'
  }
];
