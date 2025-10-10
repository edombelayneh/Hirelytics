
class Applicant():
    def __init__(self, name, email, status):
        self.name = name
        self.email = email
        self.status = status

    def update_status(self, new_status):
        self.status = new_status
        print(f"Applicant {self.name} status updated to {self.status}.")

    def get_status(self):
        return self.status
    def get_email(self):
        return self.email
    def get_name(self):
        return self.name
    def set_email(self, email):
        self.email = email
    def set_name(self, name):
        self.name = name
        
    def __str__(self):
        return f"Applicant(Name: {self.name}, Email: {self.email}, Status: {self.status})"
    def __repr__(self):
        return f"Applicant({self.name}, {self.email}, {self.status})"
    def notify(self, message):
        print(f"Notification to {self.email}: {message}")
    # recruiter_update_status()