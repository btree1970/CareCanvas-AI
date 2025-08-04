'use client'

import React, { useState } from 'react';

interface Avatar {
	id: string;
	name: string;
	imageUrl: string;
	ageGroup: 'infant' | 'child' | 'teen' | 'adult';
	ethnicity: string;
}

interface AvatarPickerProps {
	ageGroup?: 'infant' | 'child' | 'teen' | 'adult';
	onChange: (avatarId: string) => void;
	value?: string;
	className?: string;
}

// Sample avatar data - in production this would come from a comprehensive avatar library
const AVATARS: Avatar[] = [
	{ id: 'child_1', name: 'Alex', imageUrl: '/avatars/child_alex.png', ageGroup: 'child', ethnicity: 'diverse' },
	{ id: 'child_2', name: 'Sam', imageUrl: '/avatars/child_sam.png', ageGroup: 'child', ethnicity: 'diverse' },
	{ id: 'child_3', name: 'Casey', imageUrl: '/avatars/child_casey.png', ageGroup: 'child', ethnicity: 'diverse' },
	{ id: 'child_4', name: 'Jordan', imageUrl: '/avatars/child_jordan.png', ageGroup: 'child', ethnicity: 'diverse' },
	{ id: 'teen_1', name: 'Taylor', imageUrl: '/avatars/teen_taylor.png', ageGroup: 'teen', ethnicity: 'diverse' },
	{ id: 'teen_2', name: 'Morgan', imageUrl: '/avatars/teen_morgan.png', ageGroup: 'teen', ethnicity: 'diverse' },
	{ id: 'adult_1', name: 'Adult 1', imageUrl: '/avatars/adult_1.png', ageGroup: 'adult', ethnicity: 'diverse' },
	{ id: 'adult_2', name: 'Adult 2', imageUrl: '/avatars/adult_2.png', ageGroup: 'adult', ethnicity: 'diverse' },
];

export function AvatarPicker({ ageGroup = 'child', onChange, value, className = '' }: AvatarPickerProps) {
	const [selectedAvatar, setSelectedAvatar] = useState<string>(value || '');

	const filteredAvatars = AVATARS.filter(avatar =>
		ageGroup === 'infant' ? avatar.ageGroup === 'child' : avatar.ageGroup === ageGroup
	);

	const handleAvatarSelect = (avatarId: string) => {
		setSelectedAvatar(avatarId);
		onChange(avatarId);
	};

	return (
		<div className={`avatar-picker ${className}`}>
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					Choose Your Avatar
				</h3>
				<p className="text-sm text-gray-600">
					Select an avatar that represents you best. This helps personalize your healthcare experience.
				</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{filteredAvatars.map((avatar) => (
					<button
						key={avatar.id}
						type="button"
						onClick={() => handleAvatarSelect(avatar.id)}
						className={`
              relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
              ${selectedAvatar === avatar.id
								? 'border-blue-500 bg-blue-50 shadow-md'
								: 'border-gray-200 bg-white hover:border-gray-300'
							}
            `}
						aria-label={`Select ${avatar.name} avatar`}
					>
						{/* Avatar Image Placeholder */}
						<div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
							<span className="text-2xl">👤</span>
						</div>

						<p className="text-sm font-medium text-gray-700">{avatar.name}</p>

						{/* Selection indicator */}
						{selectedAvatar === avatar.id && (
							<div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
								<span className="text-white text-xs">✓</span>
							</div>
						)}
					</button>
				))}
			</div>

			{/* Accessibility and engagement features */}
			<div className="mt-4 text-center">
				<p className="text-xs text-gray-500">
					Your avatar helps us make your experience more personal and engaging
				</p>
			</div>
		</div>
	);
}

export { AvatarPicker };
export default AvatarPicker;