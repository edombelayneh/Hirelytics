'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

export const REJECTION_REASONS = [
  'Insufficient relevant experience',
  'Missing required skills',
  'Overqualified for the role',
  'Salary expectations not aligned',
  'Poorly formatted or unclear resume',
  'Did not meet expectations during interview',
  'Position filled',
  'Other',
] as const

export type RejectionReason = (typeof REJECTION_REASONS)[number]

const REJECTION_EXPLANATION_SUGGESTIONS: Record<RejectionReason, readonly string[]> = {
  'Insufficient relevant experience': [
    'Thank you for your interest in this role. After reviewing your application, we decided to move forward with candidates whose recent experience more closely aligns with the level of hands-on experience needed for this position. We appreciate the time you invested in applying and encourage you to consider future opportunities that may be a stronger match for your background.',
    'We appreciate your application and the experience you bring. For this opening, we are prioritizing applicants whose recent work has more direct overlap with the day-to-day responsibilities of the role. Thank you again for your interest, and we encourage you to apply again when a role more closely fits your experience.',
  ],
  'Missing required skills': [
    'Thank you for applying. We identified several strengths in your background, but we are moving forward with candidates who currently demonstrate more of the core technical and role-specific skills required for this position. We appreciate your interest in our team and encourage you to apply again as you continue building experience in these areas.',
    'We appreciate the time you took to apply for this opportunity. After review, we determined that this role requires a stronger match in several of the required skills listed for the position. Thank you for your interest, and we wish you success as you continue developing your qualifications.',
  ],
  'Overqualified for the role': [
    'Thank you for your application. Your background reflects a level of experience and responsibility beyond what this position is designed to offer, and we are concerned the role may not provide the scope or growth that would be appropriate for you. We appreciate your interest and encourage you to consider future openings that align more closely with your experience level.',
    'We appreciate your interest in joining our team. Based on your background, we believe your experience exceeds the expectations and scope of this position, and we want to be thoughtful about matching candidates with roles that support their long-term goals. Thank you again for applying and for considering this opportunity.',
  ],
  'Salary expectations not aligned': [
    'Thank you for your application and for the time you spent with our team. After review, we determined that the compensation range for this role is not closely aligned with your expectations at this time. We appreciate your interest and hope you will consider future opportunities that may be a better mutual fit.',
    'We appreciate your interest in the position. At this stage, we are moving forward with candidates whose compensation expectations are more closely aligned with the budgeted range for the role. Thank you again for your time and consideration.',
  ],
  'Poorly formatted or unclear resume': [
    'Thank you for applying. We were not able to clearly evaluate your experience from the resume submitted, as some of the information needed to assess fit for the role was difficult to follow or incomplete. We appreciate your interest and encourage you to apply again in the future with an updated resume that more clearly highlights your experience and impact.',
    'We appreciate your application and the effort that went into it. During review, we found that the resume structure made it difficult to fully understand your background and qualifications for this role. Thank you for your interest, and we encourage you to reapply in the future with a revised resume that presents your experience more clearly.',
  ],
  'Did not meet expectations during interview': [
    'Thank you for taking the time to interview with our team. After completing the interview process, we have decided to move forward with candidates whose responses more closely matched the level of depth, clarity, and role alignment we were seeking. We appreciate your time and interest in the opportunity.',
    'We appreciate the time and effort you invested in the interview process. While we value your interest in the role, we are moving forward with other candidates whose interview performance more closely aligned with the requirements and expectations of the position. Thank you again for speaking with our team.',
  ],
  'Position filled': [
    'Thank you for your interest in this role. We have completed the hiring process and the position has now been filled. We appreciate the time you took to apply and encourage you to check back for future opportunities that may match your background and interests.',
    'We appreciate your application and interest in joining our team. At this time, the position has been filled, and we are no longer moving forward with additional candidates for this opening. Thank you again for your consideration, and we hope you will explore future roles with us.',
  ],
  Other: [
    'Thank you for applying and for your interest in this opportunity. After careful consideration, we have decided not to move forward with your application for this role. We appreciate the time and effort you invested and encourage you to apply for future openings that may be a better fit.',
    'We appreciate the time you took to apply and to share your background with us. After review, we have decided to move forward with other candidates for this position. Thank you again for your interest, and we wish you success in your continued search.',
  ],
}

interface RejectionFeedbackModalProps {
  isOpen: boolean
  applicantName: string
  onSubmit: (reason: RejectionReason, explanation: string) => Promise<void>
  onCancel: () => void
}

export function RejectionFeedbackModal({
  isOpen,
  applicantName,
  onSubmit,
  onCancel,
}: RejectionFeedbackModalProps) {
  const [selectedReason, setSelectedReason] = useState<RejectionReason | ''>('')
  const [explanation, setExplanation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)

  const suggestionOptions = selectedReason ? REJECTION_EXPLANATION_SUGGESTIONS[selectedReason] : []
  const currentSuggestion = suggestionOptions.length
    ? suggestionOptions[suggestionIndex % suggestionOptions.length]
    : ''

  const handleSubmit = async () => {
    if (!selectedReason || !explanation.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(selectedReason, explanation)
      setSelectedReason('')
      setExplanation('')
      setSuggestionIndex(0)
      setIsSuggestionOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedReason('')
    setExplanation('')
    setSuggestionIndex(0)
    setIsSuggestionOpen(false)
    onCancel()
  }

  const handleReasonChange = (value: string) => {
    setSelectedReason(value as RejectionReason)
    setSuggestionIndex(0)
    setIsSuggestionOpen(false)
  }

  const handleUseSuggestion = () => {
    if (!currentSuggestion) return

    setExplanation(currentSuggestion)
    setIsSuggestionOpen(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleCancel}
    >
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader className='text-center sm:text-center'>
          <DialogTitle>Rejection Feedback for {applicantName}</DialogTitle>
          <DialogDescription>
            Please provide feedback for {applicantName}. Select a reason for rejection and add an
            explanation.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Rejection Reason Dropdown */}
          <div className='space-y-2'>
            <Label htmlFor='rejection-reason'>Reason for Rejection *</Label>
            <Select
              value={selectedReason}
              onValueChange={handleReasonChange}
            >
              <SelectTrigger id='rejection-reason'>
                <SelectValue placeholder='Select a reason...' />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((reason) => (
                  <SelectItem
                    key={reason}
                    value={reason}
                  >
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Explanation Textbox */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <Label htmlFor='explanation'>Additional Explanation *</Label>
              <Popover
                open={isSuggestionOpen}
                onOpenChange={setIsSuggestionOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={!selectedReason}
                  >
                    Suggested Explanation
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align='end'
                  className='w-96 space-y-3'
                >
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>Suggested explanation</p>
                    <p className='text-xs text-muted-foreground'>
                      Choose a reason first, then insert this suggestion and edit it as needed.
                    </p>
                  </div>

                  <p className='text-sm leading-6 text-muted-foreground whitespace-pre-wrap'>
                    {currentSuggestion}
                  </p>

                  <div className='flex justify-end gap-2'>
                    {suggestionOptions.length > 1 ? (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => setSuggestionIndex((prev) => prev + 1)}
                      >
                        Another Suggestion
                      </Button>
                    ) : null}
                    <Button
                      type='button'
                      size='sm'
                      onClick={handleUseSuggestion}
                    >
                      Use Suggestion
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Textarea
              id='explanation'
              placeholder='Add any additional feedback or explanation for the candidate...'
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className='min-h-[120px]'
            />
          </div>
        </div>

        <DialogFooter className='sm:justify-center gap-2'>
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || !explanation.trim() || isSubmitting}
            className='bg-red-600 hover:bg-red-700'
          >
            {isSubmitting ? 'Submitting...' : 'Reject Applicant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
