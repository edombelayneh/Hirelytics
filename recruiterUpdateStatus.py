from Applicant import Applicant
from Recruiter import Recruiter

class Recruiter_Update_Status:
    def __init__(self, applicant, recruiter):
        self.applicant = applicant
        self.recruiter = recruiter

    def recruiter_update_status(self):
        applicant = self.applicant
        recruiter = self.recruiter
        if applicant.status == 'Applied':
            applicant.status = 'In Review'
            recruiter.notify(applicant, 'Your application is now In Review.')
            print("Applicant status updated to In Review.")
            return True
        elif applicant.status == 'In Review':
            applicant.status = 'Interview Scheduled'
            recruiter.notify(applicant, 'Your interview has been scheduled.')
            print("Applicant status updated to Interview Scheduled.")
            return True
        elif applicant.status == 'Interview Scheduled':
            applicant.status = 'Offer Extended'
            recruiter.notify(applicant, 'An offer has been extended to you.')
            print("Applicant status updated to Offer Extended.")
            return True
        elif applicant.status == 'Offer Extended':
            applicant.status = 'Hired'
            recruiter.notify(applicant, 'Congratulations! You have been hired.')
            print("Applicant status updated to Hired.")
            return True
        else:
            applicant.status = 'Rejected'
            recruiter.notify(applicant, 'We regret to inform you that you have not been selected.')
            print("Applicant status updated to Rejected and Notified.")
        print("Recruiter update status executed.")
        return True

if __name__ == '__main__':
    applicant1 = Applicant("Jane Doe", "jandoe@test.com", "Applied")
    applicant2 = Applicant("Riley Jones", "rileyj@test.com", "In Review")
    applicant3 = Applicant("Charles Simon", "charlessi@test.com", "Hired")
    recruiter = Recruiter("Chloe Anderson", "chloeanderson@hirelytics.com", "Hirelytics")
    recruiter_update_status = Recruiter_Update_Status(applicant1, recruiter)
    recruiter_update_status = Recruiter_Update_Status(applicant2, recruiter)
    recruiter_update_status = Recruiter_Update_Status(applicant3, recruiter)

    recruiter_update_status.recruiter_update_status()
