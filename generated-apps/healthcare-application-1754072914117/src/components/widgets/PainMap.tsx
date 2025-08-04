'use client'

import React, { useState, useRef, useCallback } from 'react';

interface PainPoint {
	id: string;
	x: number; // Percentage from left
	y: number; // Percentage from top
	intensity: number; // 1-10 scale
	type: 'sharp' | 'dull' | 'burning' | 'aching' | 'tingling';
	bodyPart: string;
}

interface PainMapProps {
	onChange: (painPoints: PainPoint[]) => void;
	value?: PainPoint[];
	bodyType?: 'adult' | 'child';
	maxPoints?: number;
	className?: string;
}

const PAIN_TYPES = [
	{ value: 'sharp', label: 'Sharp', color: 'bg-red-500', emoji: '⚡' },
	{ value: 'dull', label: 'Dull', color: 'bg-orange-500', emoji: '🟤' },
	{ value: 'burning', label: 'Burning', color: 'bg-red-600', emoji: '🔥' },
	{ value: 'aching', label: 'Aching', color: 'bg-yellow-500', emoji: '💛' },
	{ value: 'tingling', label: 'Tingling', color: 'bg-purple-500', emoji: '✨' },
] as const;

const BODY_REGIONS = {
	head: { name: 'Head', bounds: { x: [40, 60], y: [5, 25] } },
	neck: { name: 'Neck', bounds: { x: [45, 55], y: [25, 35] } },
	chest: { name: 'Chest', bounds: { x: [35, 65], y: [35, 55] } },
	abdomen: { name: 'Abdomen', bounds: { x: [35, 65], y: [55, 75] } },
	back: { name: 'Back', bounds: { x: [35, 65], y: [35, 75] } },
	leftArm: { name: 'Left Arm', bounds: { x: [15, 35], y: [35, 80] } },
	rightArm: { name: 'Right Arm', bounds: { x: [65, 85], y: [35, 80] } },
	leftLeg: { name: 'Left Leg', bounds: { x: [35, 50], y: [75, 100] } },
	rightLeg: { name: 'Right Leg', bounds: { x: [50, 65], y: [75, 100] } },
};

export function PainMap({
	onChange,
	value = [],
	bodyType = 'adult',
	maxPoints = 10,
	className = ''
}: PainMapProps) {
	const [painPoints, setPainPoints] = useState<PainPoint[]>(value);
	const [selectedPainType, setSelectedPainType] = useState<string>('sharp');
	const [selectedIntensity, setSelectedIntensity] = useState<number>(5);
	const [showInstructions, setShowInstructions] = useState(true);
	const bodyMapRef = useRef<HTMLDivElement>(null);

	const getBodyRegion = (x: number, y: number): string => {
		for (const [region, data] of Object.entries(BODY_REGIONS)) {
			const { bounds } = data;
			if (x >= bounds.x[0] && x <= bounds.x[1] && y >= bounds.y[0] && y <= bounds.y[1]) {
				return data.name;
			}
		}
		return 'Body';
	};

	const handleBodyClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
		if (!bodyMapRef.current || painPoints.length >= maxPoints) return;

		const rect = bodyMapRef.current.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 100;
		const y = ((event.clientY - rect.top) / rect.height) * 100;

		const bodyPart = getBodyRegion(x, y);
		const newPainPoint: PainPoint = {
			id: `pain_${Date.now()}`,
			x,
			y,
			intensity: selectedIntensity,
			type: selectedPainType as any,
			bodyPart,
		};

		const updatedPoints = [...painPoints, newPainPoint];
		setPainPoints(updatedPoints);
		onChange(updatedPoints);
		setShowInstructions(false);
	}, [painPoints, selectedIntensity, selectedPainType, maxPoints, onChange]);

	const removePainPoint = (pointId: string) => {
		const updatedPoints = painPoints.filter(point => point.id !== pointId);
		setPainPoints(updatedPoints);
		onChange(updatedPoints);
	};

	const updatePainPoint = (pointId: string, updates: Partial<PainPoint>) => {
		const updatedPoints = painPoints.map(point =>
			point.id === pointId ? { ...point, ...updates } : point
		);
		setPainPoints(updatedPoints);
		onChange(updatedPoints);
	};

	const getPainTypeConfig = (type: string) =>
		PAIN_TYPES.find(t => t.value === type) || PAIN_TYPES[0];

	return (
		<div className={`pain-map ${className}`}>
			<div className="mb-6">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					Pain Location Map
				</h3>
				<p className="text-sm text-gray-600">
					Click on the body diagram to mark where you feel pain. You can add up to {maxPoints} pain points.
				</p>
			</div>

			{/* Instructions */}
			{showInstructions && (
				<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<p className="text-blue-800 text-sm">
						👆 First, select your pain type and intensity below, then click on the body diagram to mark the location.
					</p>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Body Diagram */}
				<div className="body-diagram">
					<div
						ref={bodyMapRef}
						className="relative w-full h-96 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg border border-gray-300 cursor-crosshair overflow-hidden"
						onClick={handleBodyClick}
						role="img"
						aria-label="Human body diagram for pain mapping"
					>
						{/* Simple SVG body outline */}
						<svg
							className="absolute inset-0 w-full h-full pointer-events-none"
							viewBox="0 0 100 100"
							preserveAspectRatio="xMidYMid meet"
						>
							{/* Head */}
							<ellipse cx="50" cy="15" rx="8" ry="10" fill="none" stroke="#374151" strokeWidth="0.5" />
							{/* Torso */}
							<rect x="35" y="25" width="30" height="50" rx="15" fill="none" stroke="#374151" strokeWidth="0.5" />
							{/* Arms */}
							<rect x="20" y="35" width="15" height="35" rx="7" fill="none" stroke="#374151" strokeWidth="0.5" />
							<rect x="65" y="35" width="15" height="35" rx="7" fill="none" stroke="#374151" strokeWidth="0.5" />
							{/* Legs */}
							<rect x="38" y="75" width="10" height="22" rx="5" fill="none" stroke="#374151" strokeWidth="0.5" />
							<rect x="52" y="75" width="10" height="22" rx="5" fill="none" stroke="#374151" strokeWidth="0.5" />
						</svg>

						{/* Pain Points */}
						{painPoints.map((point) => {
							const config = getPainTypeConfig(point.type);
							return (
								<div
									key={point.id}
									className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
									style={{ left: `${point.x}%`, top: `${point.y}%` }}
									onClick={(e) => {
										e.stopPropagation();
										removePainPoint(point.id);
									}}
								>
									<div
										className={`w-6 h-6 ${config.color} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg group-hover:scale-110 transition-transform`}
										title={`${point.bodyPart}: ${config.label} pain, intensity ${point.intensity}/10`}
									>
										{point.intensity}
									</div>

									{/* Tooltip */}
									<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
										<div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
											{point.bodyPart}: {config.label} ({point.intensity}/10)
											<div className="text-xs opacity-75">Click to remove</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					<div className="mt-2 text-xs text-gray-500 text-center">
						{painPoints.length}/{maxPoints} pain points marked
					</div>
				</div>

				{/* Controls */}
				<div className="pain-controls space-y-6">
					{/* Pain Type Selection */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Type of Pain
						</label>
						<div className="grid grid-cols-1 gap-2">
							{PAIN_TYPES.map((type) => (
								<button
									key={type.value}
									type="button"
									onClick={() => setSelectedPainType(type.value)}
									className={`
                    flex items-center p-3 rounded-lg border text-left transition-all
                    ${selectedPainType === type.value
											? 'border-blue-500 bg-blue-50'
											: 'border-gray-300 hover:border-gray-400'
										}
                  `}
								>
									<span className="text-lg mr-3">{type.emoji}</span>
									<span className="font-medium">{type.label}</span>
								</button>
							))}
						</div>
					</div>

					{/* Pain Intensity */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Pain Intensity: {selectedIntensity}/10
						</label>
						<input
							type="range"
							min="1"
							max="10"
							value={selectedIntensity}
							onChange={(e) => setSelectedIntensity(parseInt(e.target.value))}
							className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
						/>
						<div className="flex justify-between text-xs text-gray-500 mt-1">
							<span>Mild (1)</span>
							<span>Severe (10)</span>
						</div>
					</div>

					{/* Pain Point List */}
					{painPoints.length > 0 && (
						<div>
							<h4 className="text-sm font-medium text-gray-700 mb-3">
								Current Pain Points
							</h4>
							<div className="space-y-2 max-h-48 overflow-y-auto">
								{painPoints.map((point) => {
									const config = getPainTypeConfig(point.type);
									return (
										<div
											key={point.id}
											className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
										>
											<div className="flex items-center">
												<div className={`w-4 h-4 ${config.color} rounded-full mr-3`}></div>
												<div>
													<div className="text-sm font-medium">{point.bodyPart}</div>
													<div className="text-xs text-gray-500">
														{config.label} • {point.intensity}/10
													</div>
												</div>
											</div>
											<button
												onClick={() => removePainPoint(point.id)}
												className="text-red-500 hover:text-red-700 text-sm"
											>
												Remove
											</button>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default PainMap;
