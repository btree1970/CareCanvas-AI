'use client';

import React, { useState, useEffect } from 'react';

export interface RefillRecord {
	id: string;
	patientName: string;
	medication: string;
	lastRefill: string;
	nextRefill: string;
	status: 'overdue' | 'ok' | 'due-soon';
}

interface RefillTrackerProps {
	onChange: (data: RefillRecord[]) => void;
	value?: RefillRecord[];
	className?: string;
	readOnly?: boolean;
}

const DEFAULT_REFILL_DATA: RefillRecord[] = [
	{
		id: '1',
		patientName: 'John Smith',
		medication: 'Lisinopril 10mg',
		lastRefill: 'Jun 15',
		nextRefill: 'Jul 15',
		status: 'overdue'
	},
	{
		id: '2',
		patientName: 'Maria Gomez',
		medication: 'Metformin 500mg',
		lastRefill: 'Jul 1',
		nextRefill: 'Aug 1',
		status: 'ok'
	},
	{
		id: '3',
		patientName: 'David Lin',
		medication: 'Atorvastatin 20mg',
		lastRefill: 'Jul 10',
		nextRefill: 'Aug 10',
		status: 'due-soon'
	}
];

export function RefillTracker({
	onChange,
	value = [],
	className = '',
	readOnly = false
}: RefillTrackerProps) {
	const [refillData, setRefillData] = useState<RefillRecord[]>(value.length > 0 ? value : DEFAULT_REFILL_DATA);

	useEffect(() => {
		onChange(refillData);
	}, [refillData, onChange]);

	const getStatusIcon = (status: RefillRecord['status']) => {
		switch (status) {
			case 'overdue':
				return (
					<div className="flex items-center">
						<svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
						</svg>
						<span className="text-red-600 font-medium">Overdue</span>
					</div>
				);
			case 'ok':
				return (
					<div className="flex items-center">
						<div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center mr-2">
							<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
							</svg>
						</div>
						<span className="text-green-600 font-medium">OK</span>
					</div>
				);
			case 'due-soon':
				return (
					<div className="flex items-center">
						<svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
						</svg>
						<span className="text-yellow-600 font-medium">Due Soon</span>
					</div>
				);
		}
	};

	const handleViewAction = (record: RefillRecord) => {
		// Handle view action - could open modal, navigate to detail page, etc.
		console.log('View details for:', record);
	};

	return (
		<div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
			<div className="mb-8">
				<div className="flex items-center mb-3">
					<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
						<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
						</svg>
					</div>
					<h3 className="text-xl font-semibold text-gray-900">
						Practice-wide Refill Tracker
					</h3>
				</div>
				<p className="text-sm text-gray-600 mb-4">
					Monitors active prescriptions and flags those approaching or past their expected refill date.
				</p>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr className="border-b border-gray-200">
							<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Patient</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Medication</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Refill</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Next Refill</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
							<th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{refillData.map((record) => (
							<tr key={record.id} className="hover:bg-gray-50 transition-colors">
								<td className="py-4 px-4">
									<div className="text-sm font-medium text-gray-900">{record.patientName}</div>
								</td>
								<td className="py-4 px-4">
									<div className="text-sm text-gray-700">{record.medication}</div>
								</td>
								<td className="py-4 px-4">
									<div className="text-sm text-gray-700">{record.lastRefill}</div>
								</td>
								<td className="py-4 px-4">
									<div className="text-sm text-gray-700">{record.nextRefill}</div>
								</td>
								<td className="py-4 px-4">
									{getStatusIcon(record.status)}
								</td>
								<td className="py-4 px-4">
									<button
										onClick={() => handleViewAction(record)}
										disabled={readOnly}
										className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
									>
										View
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Summary Stats */}
			<div className="mt-6 pt-6 border-t border-gray-200">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
						<div className="text-2xl font-bold text-red-600">
							{refillData.filter(r => r.status === 'overdue').length}
						</div>
						<div className="text-sm text-red-700">Overdue</div>
					</div>
					<div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
						<div className="text-2xl font-bold text-yellow-600">
							{refillData.filter(r => r.status === 'due-soon').length}
						</div>
						<div className="text-sm text-yellow-700">Due Soon</div>
					</div>
					<div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
						<div className="text-2xl font-bold text-green-600">
							{refillData.filter(r => r.status === 'ok').length}
						</div>
						<div className="text-sm text-green-700">On Track</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default RefillTracker; 