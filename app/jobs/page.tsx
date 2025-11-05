import { HeroPanel } from '../components/HeroPanel';
import { SummaryCards } from '../components/SummaryCards';
import { AvailableJobsList } from '../components/AvailableJobsList';
import { Button } from '../components/ui/button';
import { Plus, Download, Settings } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { AvailableJob } from '../data/availableJobs';
import { JobApplication } from '../data/mockData';
import { parseLocation } from '../utils/locationParser';
import { getCurrentDateString } from '../utils/dateFormatter';

function Jobs({ onAddApplication }: { onAddApplication?: (app: JobApplication) => void }) {
	const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
	const [modalOpen, setModalOpen] = useState(false);
	const [form, setForm] = useState({ company: '', position: '' });

	const handleApply = (job: AvailableJob) => {
		const { city, country } = parseLocation(job.location);
		const newApplication: JobApplication = {
			id: `app-${Date.now()}`,
			company: job.company,
			country,
			city,
			jobLink: job.applyLink,
			position: job.title,
			applicationDate: getCurrentDateString(),
			status: 'Applied',
			contactPerson: '',
			notes: `Applied via job board. ${job.type} position.`,
			jobSource: 'Other',
			outcome: 'Pending',
		};
		if (onAddApplication) onAddApplication(newApplication);
		setAppliedJobIds(prev => new Set(prev).add(job.id));
	};
	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.company || !form.position) return;
		const newApp: JobApplication = {
			id: `manual-${Date.now()}`,
			company: form.company,
			position: form.position,
			country: '',
			city: '',
			jobLink: '',
			applicationDate: getCurrentDateString(),
			status: 'Applied',
			contactPerson: '',
			notes: '',
			jobSource: 'Other',
			outcome: 'Pending',
		};
		if (onAddApplication) onAddApplication(newApp);
		setModalOpen(false);
		setForm({ company: '', position: '' });
	};
	return (
		<div className='min-h-screen bg-background'>
			<header className='border-b'>
				<div className='container mx-auto px-6 py-4'>
					<div className='flex justify-end'>
						<Dialog open={modalOpen} onOpenChange={setModalOpen}>
							<DialogTrigger asChild>
								<Button size='sm' onClick={() => setModalOpen(true)}>
									<Plus className='h-4 w-4 mr-2' />
									Add Application
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add Application</DialogTitle>
								</DialogHeader>
								<form className='space-y-3' onSubmit={handleFormSubmit}>
									<Input name='company' value={form.company} onChange={handleFormChange} placeholder='Company' required />
									<Input name='position' value={form.position} onChange={handleFormChange} placeholder='Position' required />
									<Button type='submit' variant='default'>Save</Button>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</header>
			<main className='container mx-auto px-6 py-8 space-y-8'>
				<section>
					<AvailableJobsList onApply={handleApply} appliedJobIds={appliedJobIds} />
				</section>
			</main>
		</div>
	);
}
export default Jobs;
