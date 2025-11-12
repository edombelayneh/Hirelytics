export interface UserProfile {
  // Basic Information
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string

  // Professional Links
  linkedinUrl: string
  portfolioUrl: string
  githubUrl: string

  // Profile Media
  profilePicture: string | null
  resumeFile: string | null
  resumeFileName: string | null

  // Bio
  bio: string

  // Professional Info
  currentTitle: string
  yearsOfExperience: string
  availability: string
}

export const defaultProfile: UserProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  linkedinUrl: '',
  portfolioUrl: '',
  githubUrl: '',
  profilePicture: null,
  resumeFile: null,
  resumeFileName: null,
  bio: '',
  currentTitle: '',
  yearsOfExperience: '',
  availability: 'Immediately',
}
