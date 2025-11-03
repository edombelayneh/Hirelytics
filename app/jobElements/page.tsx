import JobForm from "./jobForm";

export default function JobElementPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Add Job</h1>
      <p className="text-sm text-gray-600 mb-6">
        Fill in the job details below.
      </p>
      <JobForm />
    </main>
  );
}