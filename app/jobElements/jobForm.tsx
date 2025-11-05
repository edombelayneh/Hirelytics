"use client";

import { useState } from "react";

export default function JobForm() {
  const [jobName, setJobName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [description, setDescription] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [niceToHave, setNiceToHave] = useState("");
  const [country, setCountry] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [city, setCity] = useState("");
  const [visaRequirements, setVisaRequirements] = useState("");
  const [generalDescription, setGeneralDescription] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // simple required fields
    if (!jobName || !companyName || !description || !recruiterEmail) {
  setMessage("Please fill in Job Name, Company Name, Description, and Recruiter Email.");
  return;
}

    const jobData = {
      jobName,
      companyName,
      description,
      qualifications,
      niceToHave,
      country,
      state: stateValue,
      city,
      visaRequirements,
      generalDescription,
      recruiterEmail,  
    };

    try {
      setSubmitting(true);

      // for now just log it so you can see it in the console
      console.log("New job:", jobData);

      // later you can post to an API:
      // await fetch("/api/jobs", { method: "POST", body: JSON.stringify(jobData) });

      setMessage("Job saved (check console for data).");

      // reset form
      setJobName("");
      setCompanyName("");
      setDescription("");
      setQualifications("");
      setNiceToHave("");
      setCountry("");
      setStateValue("");
      setCity("");
      setVisaRequirements("");
      setGeneralDescription("");
      setRecruiterEmail(""); 
    } catch (err: any) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      {message && (
        <div className="rounded border p-3 text-sm">
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm mb-1">Job Name *</label>
        <input
          type="text"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          placeholder="Software Engineer"
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Company Name *</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company Name"
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Recruiter Email *</label>
        <input
          type="email"
          value={recruiterEmail}
          onChange={(e) => setRecruiterEmail(e.target.value)}
          placeholder="recruiter@company.com"
          className="w-full border rounded p-2"
        />
    </div>

      <div>
        <label className="block text-sm mb-1">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Main role summary and responsibilities"
          rows={4}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Qualifications (Must-Have)</label>
        <textarea
          value={qualifications}
          onChange={(e) => setQualifications(e.target.value)}
          placeholder="Required skills, experience, or education"
          rows={3}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Nice to Have</label>
        <textarea
          value={niceToHave}
          onChange={(e) => setNiceToHave(e.target.value)}
          placeholder="Preferred but not required skills"
          rows={3}
          className="w-full border rounded p-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="United States"
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">State</label>
          <input
            type="text"
            value={stateValue}
            onChange={(e) => setStateValue(e.target.value)}
            placeholder="Michigan"
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Mount Pleasant"
            className="w-full border rounded p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Visa Requirements</label>
        <textarea
          value={visaRequirements}
          onChange={(e) => setVisaRequirements(e.target.value)}
          placeholder="Sponsorship info, work authorization details"
          rows={3}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">General Description</label>
        <textarea
          value={generalDescription}
          onChange={(e) => setGeneralDescription(e.target.value)}
          placeholder="Any additional notes or context"
          rows={3}
          className="w-full border rounded p-2"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-blue-600 text-white px-4 py-2"
      >
        {submitting ? "Saving..." : "Add Job"}
      </button>
    </form>
  );
}
