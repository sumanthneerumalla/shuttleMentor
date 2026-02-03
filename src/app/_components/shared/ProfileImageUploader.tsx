"use client";

import { CameraIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
	ImageCrop,
	ImageCropApply,
	ImageCropContent,
} from "../client/ImageCrop";
import { Input } from "./Input";

interface ProfileImageUploaderProps {
	initialImageUrl?: string | null;
	onChange: (imageData: string | null) => void; // Simplified API with a single callback
}

export function ProfileImageUploader({
	initialImageUrl,
	onChange,
}: ProfileImageUploaderProps) {
	const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
		initialImageUrl || null,
	);
	const [showImageCrop, setShowImageCrop] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [filename, setFilename] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Internal handlers for image changes
	const handleImageChange = (imageData: string | null) => {
		setProfileImageUrl(imageData);
		onChange(imageData);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			// Check file size (5MB limit)
			if (file.size > 5 * 1024 * 1024) {
				alert("Image must be 5MB or less");
				return;
			}
			setSelectedFile(file);
			setFilename(file.name);
			setShowImageCrop(true);
		}
	};

	const handleCropComplete = (croppedImageData: string) => {
		handleImageChange(croppedImageData);
		setShowImageCrop(false);
	};

	const handleCropCancel = () => {
		setShowImageCrop(false);
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleRemoveImage = () => {
		handleImageChange(null); // Pass null to indicate image removal
		setFilename(""); // Clear the filename
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<>
			<div className="flex items-center gap-4">
				{profileImageUrl ? (
					<div className="group relative h-24 w-24 overflow-hidden rounded-full border border-gray-200">
						<img
							src={profileImageUrl}
							alt="Profile preview"
							className="h-full w-full object-cover"
						/>
						{/* Subtle hover overlay to indicate the image can be edited */}
						<div className="absolute inset-0 bg-black opacity-0 transition-opacity group-hover:opacity-20"></div>
						{/* Enhanced delete button with better visibility */}
						<button
							type="button"
							onClick={handleRemoveImage}
							aria-label="Remove profile image"
							className="absolute top-1 right-1 z-50 transform rounded-full border border-gray-200 bg-white bg-opacity-90 p-1.5 opacity-90 shadow-md transition-all hover:scale-110 hover:border-red-300 hover:bg-red-50 group-hover:opacity-100"
						>
							<XIcon className="h-5 w-5 text-gray-700 hover:text-red-500" />
						</button>
					</div>
				) : (
					<div className="flex h-24 w-24 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
						<CameraIcon className="h-8 w-8 text-gray-400" />
					</div>
				)}
				<div>
					<div className="relative">
						<Input
							type="file"
							accept="image/png"
							onChange={handleFileChange}
							ref={fileInputRef}
							className="absolute inset-0 z-10 max-w-xs cursor-pointer opacity-0"
						/>
						<button
							type="button"
							className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary-dark)]"
							onClick={() => fileInputRef.current?.click()}
						>
							<CameraIcon className="h-4 w-4" />
							Choose Image
						</button>
						<div className="mt-1 space-y-1 text-gray-500 text-xs">
							<p>Max size: 5MB, PNG format only</p>
							<p>
								Need to convert your image?{" "}
								<a
									href="https://cloudconvert.com/png-converter"
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 hover:underline"
								>
									Use this converter
								</a>
							</p>
							{filename && (
								<p className="mt-2 font-medium text-gray-700 text-sm">
									Selected file:{" "}
									<span className="text-[var(--primary)]">{filename}</span>
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Image Cropping Modal */}
			{showImageCrop && selectedFile && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
					<div className="w-full max-w-md rounded-lg bg-white p-6">
						<h3 className="mb-4 font-semibold text-lg">Crop Profile Image</h3>
						<ImageCrop file={selectedFile} onCrop={handleCropComplete}>
							<div className="mb-4">
								<ImageCropContent />
							</div>
							<div className="flex justify-between">
								<button
									type="button"
									onClick={handleCropCancel}
									className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
								>
									Cancel
								</button>
								<ImageCropApply className="inline-block">
									<div className="cursor-pointer rounded-lg bg-[var(--primary)] px-4 py-2 text-white transition-colors hover:bg-[var(--primary-dark)]">
										Apply Crop
									</div>
								</ImageCropApply>
							</div>
						</ImageCrop>
					</div>
				</div>
			)}
		</>
	);
}
