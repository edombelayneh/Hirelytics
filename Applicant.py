class Applicant:
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

    def notify(self, message):
        print(f"Notification to {self.email}: {message}")