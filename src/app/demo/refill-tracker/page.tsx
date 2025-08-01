'use client';

import { useState } from 'react';
import { RefillTracker, RefillRecord } from '@/components/widgets';

export default function RefillTrackerDemo() {
	const [refillData, setRefillData] = useState<RefillRecord[]>([]);

	const handleRefillDataChange = (data: RefillRecord[]) => {
		setRefillData(data);
		console.log('Refill data updated:', data);
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-6xl mx-auto px-4">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Refill Tracker Demo
					</h1>
					<p className="text-gray-600">
						Practice-wide medication refill tracker that monitors active prescriptions and flags those approaching or past their expected refill date.
					</p>
				</div>

				<div className="space-y-6">
					<RefillTracker
						onChange={handleRefillDataChange}
						value={refillData}
						className="w-full"
					/>
				</div>
			</div>
		</div>
	);
} 