from Applicant import Applicant
from Recruiter import Recruiter

class RecruiterUpdateStatus:
    def __init__(self, applicant, recruiter):
        self.applicant = applicant
        self.recruiter = recruiter

    def recruiter_update_status(self):
        transitions = {
            'Applied': 'In Review',
            'In Review': 'Interview Scheduled',
            'Interview Scheduled': 'Offer Extended',
            'Offer Extended': 'Hired'
        }
        current = self.applicant.status
        if current == 'Applied':
            next_status = 'In Review'
        elif current == 'In Review':
            next_status = 'Interview Scheduled'
        elif current == 'Interview Scheduled':
            next_status = 'Offer Extended'
        elif current == 'Offer Extended':
            next_status = 'Hired'
        else:
            next_status = 'Rejected'
        # new_status = transitions.get(current, 'Rejected')
        self.applicant.update_status(next_status)
        self.recruiter.notify(self.applicant, f"Your application status is now {next_status}.")
        return next_status


if __name__ == '__main__':
    applicant1 = Applicant("Jane Doe", "jandoe@test.com", "Applied")
    applicant2 = Applicant("Riley Jones", "rileyj@test.com", "In Review")
    applicant3 = Applicant("Charles Simon", "charlessi@test.com", "Interview Scheduled")
    applicant4 = Applicant("Amanda May", "charlessi@test.com", "Offer Extended")

    recruiter = Recruiter("Chloe Anderson", "chloeanderson@hirelytics.com", "Hirelytics")
    recruiter_update_status = RecruiterUpdateStatus(applicant1, recruiter)
    recruiter_update_status = RecruiterUpdateStatus(applicant2, recruiter)
    recruiter_update_status = RecruiterUpdateStatus(applicant3, recruiter)
    recruiter_update_status = RecruiterUpdateStatus(applicant4, recruiter)


    recruiter_update_status.recruiter_update_status()
