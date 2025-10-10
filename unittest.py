# test_recruiter_update_status.py

import unittest
from recruiterUpdateStatus import Applicant, Recruiter, RecruiterUpdateStatus

class TestRecruiterUpdateStatus(unittest.TestCase):

    def test_status_transition(self):
        applicant = Applicant("Edom", "edom@example.com")
        recruiter = Recruiter("Jessie", "jessie@hirelytics.com", "Hirelytics")
        updater = RecruiterUpdateStatus(applicant, recruiter)

        result = updater.recruiter_update_status()
        self.assertEqual(result, "In Review")
        self.assertEqual(applicant.get_status(), "In Review")

if __name__ == "__main__":
    unittest.main()
