import unittest
from recruiterUpdateStatus import Applicant, Recruiter, RecruiterUpdateStatus

class TestRecruiterUpdateStatus(unittest.TestCase):

    def test_status_transition(self):
        applicant = Applicant("Jane Doe", "jandoe@test.com", "Applied")
        # applicant = Applicant("Riley Jones", "rileyj@test.com", "In Review")
        # applicant = Applicant("Charles Simon", "charlessi@test.com", "Interview Scheduled")
        # applicant = Applicant("Amanda May", "charlessi@test.com", "Offer Extended")
        recruiter = Recruiter("Chloe Anderson", "chloeanderson@hirelytics.com", "Hirelytics")
        # updater = RecruiterUpdateStatus(applicant1, recruiter)
        # updater = RecruiterUpdateStatus(applicant2, recruiter)
        # updater = RecruiterUpdateStatus(applicant3, recruiter)
        updater = RecruiterUpdateStatus(applicant, recruiter)


        result = updater.recruiter_update_status()
        self.assertEqual(result, "In Review")
        self.assertEqual(applicant.get_status(), "In Review")
        # self.assertEqual(applicant2.get_status(), "Interview Scheduled")
        # self.assertEqual(applicant3.get_status(), "Offer Extended")
        # self.assertEqual(applicant4.get_status(), "Hired")


if __name__ == "__main__":
    unittest.main()
