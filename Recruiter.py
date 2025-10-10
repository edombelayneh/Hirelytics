
class Recruiter():
    def __init__(self, name, email, organization):
        self.name = name
        self.email = email
        self.organization = organization
        self.applicants = []

    def add_applicant(self, applicant):
        self.applicants.append(applicant)

    def remove_applicant(self, applicant):
        self.applicants.remove(applicant)

    def notify(self, applicant, message):
        print(f"Notification from {applicant.get_email()}: {message}")

    def get_applicants(self):
        return self.applicants
    def get_name(self):
        return self.name
    def get_email(self):
        return self.email
    def get_organization(self):
        return self.organization
    def set_name(self, name):
        self.name = name
    def set_email(self, email):
        self.email = email
    def set_organization(self, organization):
        self.organization = organization
        
    def __str__(self):
        return f"Recruiter(Name: {self.name}, Email: {self.email}, Organization: {self.organization})"
    def __repr__(self):
        return f"Recruiter({self.name}, {self.email}, {self.organization})"
    # recruiter_update_status()