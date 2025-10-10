import unittest
from recruiterUpdateStatus import Applicant, Recruiter, RecruiterUpdateStatus

class TestRecruiterUpdateStatus(unittest.TestCase):

    def test_status_applied(self):
        applicant = Applicant("Jane Doe", "jandoe@test.com", "Applied")
        recruiter = Recruiter("Chloe Anderson", "chloeanderson@hirelytics.com", "Hirelytics")
        updater = RecruiterUpdateStatus(applicant, recruiter)


        result = updater.recruiter_update_status()
        self.assertEqual(result, "In Review")
        self.assertEqual(applicant.get_status(), "In Review")

    def test_status_in_review(self):
        applicant = Applicant("Riley Jones", "rileyj@test.com", "In Review")
        recruiter = Recruiter("Chloe Anderson", "chloeanderson@hirelytics.com", "Hirelytics")
        updater = RecruiterUpdateStatus(applicant, recruiter)

        result = updater.recruiter_update_status()
        self.assertEqual(result, "Interview Scheduled")
        self.assertEqual(applicant.get_status(), "Interview Scheduled")
    
    def test_status_interview(self):
        applicant = Applicant("Charles Simon", "charlessi@test.com", "Interview Scheduled")
        recruiter = Recruiter("Chloe Anderson", "chloeanderson@hirelytics.com", "Hirelytics")
        updater = RecruiterUpdateStatus(applicant, recruiter)

        result = updater.recruiter_update_status()
        self.assertEqual(result, "Offer Extended")
        self.assertEqual(applicant.get_status(), "Offer Extended")
        

    def test_status_offer(self):
        applicant = Applicant("Amanda May", "charlessi@test.com", "Offer Extended")
        recruiter = Recruiter("Chloe Anderson", "chloeanderson@hirelytics.com", "Hirelytics")
        updater = RecruiterUpdateStatus(applicant, recruiter)
        
        result = updater.recruiter_update_status()
        self.assertEqual(result, "Hired")
        self.assertEqual(applicant.get_status(), "Hired")


if __name__ == "__main__":
    unittest.main()
