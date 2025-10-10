class Recruiter:
    def __init__(self, name, email, organization):
        self.name = name
        self.email = email
        self.organization = organization
        self.applicants = []

    def add_applicant(self, applicant):
        self.applicants.append(applicant)

    def notify(self, applicant, message):
        print(f"Notification to {applicant.get_email()}: {message}")