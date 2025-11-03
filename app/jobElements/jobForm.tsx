"use client";

import { useState } from "react";

type JobFormState = {
  jobName: string;
  description: string;
  qualifications: string;
  niceToHave: string;
  country: string;
  state: string;
  city: string;
  visaRequirements: string;
  generalDescription: string;
};

export default function JobForm() {
  const [form, setForm] = useState<JobFormState>({
    jobName: "",
    description: "",
    qualifications: "",
    niceToHave: "",
    country: "",
    state: "",
    city: "",
    visaRequirements: "",
    generalDescription: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.jobName || !form.description || !form.country) {
      setMessage("Please fill in Job Name, Description, and Country.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save job.");

      setMessage("Job added successfully!");
      setForm({
        jobName: "",
        description: "",
        qualifications: "",
        niceToHave: "",
        country: "",
        state: "",
        city: "",
        visaRequirements: "",
        generalDescription: "",
      });
    } catch (err: any) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full border rounded p-2" />
  );

  const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className="w-full border rounded p-2" />
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-sm mb-1">{children}</label>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {message && <div className="rounded border p-3 text-sm">{message}</div>}

      <div>
        <Label>Job Name *</Label>
        <Input
          name="jobName"
          value={form.jobName}
          onChange={onChange}
          placeholder="Software Engineer"
        />
      </div>

      <div>
        <Label>Description *</Label>
        <Textarea
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Main role summary and responsibilities"
          rows={4}
        />
      </div>

      <div>
        <Label>Qualifications (Must-Have)</Label>
        <Textarea
          name="qualifications"
          value={form.qualifications}
          onChange={onChange}
          placeholder="Required skills, experience, or education"
          rows={3}
        />
      </div>

      <div>
        <Label>Nice to Have</Label>
        <Textarea
          name="niceToHave"
          value={form.niceToHave}
          onChange={onChange}
          placeholder="Preferred but not required skills"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Country *</Label>
          <Input
            name="country"
            value={form.country}
            onChange={onChange}
            placeholder="United States"
          />
        </div>
        <div>
          <Label>State</Label>
          <Input
            name="state"
            value={form.state}
            onChange={onChange}
            placeholder="Michigan"
          />
        </div>
        <div>
          <Label>City</Label>
          <Input
            name="city"
            value={form.city}
            onChange={onChange}
            placeholder="Mount Pleasant"
          />
        </div>
      </div>

      <div>
        <Label>Visa Requirements</Label>
        <Textarea
          name="visaRequirements"
          value={form.visaRequirements}
          onChange={onChange}
          placeholder="Sponsorship info, work authorization details"
          rows={3}
        />
      </div>

      <div>
        <Label>General Description</Label>
        <Textarea
          name="generalDescription"
          value={form.generalDescription}
          onChange={onChange}
          placeholder="Any additional notes or context"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-600 text-white px-4 py-2"
      >
        {loading ? "Saving..." : "Add Job"}
      </button>
    </form>
  );
}
