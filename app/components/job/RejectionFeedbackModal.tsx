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

  const handleSubmit = async () => {
    if (!selectedReason) return

    setIsSubmitting(true)
    try {
      await onSubmit(selectedReason, explanation)
      setSelectedReason('')
      setExplanation('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedReason('')
    setExplanation('')
    onCancel()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleCancel}
    >
      <DialogContent className='sm:max-w-[500px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
        <DialogHeader className='text-center sm:text-center'>
          <DialogTitle>Rejection Feedback</DialogTitle>
          <DialogDescription>
            Please provide feedback for {applicantName}. Select a reason for rejection and
            optionally add an explanation.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Rejection Reason Dropdown */}
          <div className='space-y-2'>
            <Label htmlFor='rejection-reason'>Reason for Rejection *</Label>
            <Select
              value={selectedReason}
              onValueChange={(value) => setSelectedReason(value as RejectionReason)}
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
            <Label htmlFor='explanation'>Additional Explanation (Optional)</Label>
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
            disabled={!selectedReason || isSubmitting}
            className='bg-red-600 hover:bg-red-700'
          >
            {isSubmitting ? 'Submitting...' : 'Reject Applicant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
