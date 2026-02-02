"use client";

import { useRef, useState } from "react";
import { CameraIcon, XIcon } from "lucide-react";
import { Input } from "./Input";
import {
	ImageCrop,
	ImageCropContent,
	ImageCropApply,
} from "../client/ImageCrop";

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
					<div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-200 group">
						<img
							src={profileImageUrl}
							alt="Profile preview"
							className="w-full h-full object-cover"
						/>
						{/* Subtle hover overlay to indicate the image can be edited */}
						<div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity"></div>
						{/* Enhanced delete button with better visibility */}
						<button
							type="button"
							onClick={handleRemoveImage}
							aria-label="Remove profile image"
							className="absolute top-1 right-1 bg-white bg-opacity-90 rounded-full p-1.5 shadow-md
                        border border-gray-200 hover:bg-red-50 hover:border-red-300 transition-all
                        transform hover:scale-110 group-hover:opacity-100 opacity-90 z-50"
						>
							<XIcon className="w-5 h-5 text-gray-700 hover:text-red-500" />
						</button>
					</div>
				) : (
					<div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
						<CameraIcon className="w-8 h-8 text-gray-400" />
					</div>
				)}
				<div>
					<div className="relative">
						<Input
							type="file"
							accept="image/png"
							onChange={handleFileChange}
							ref={fileInputRef}
							className="max-w-xs opacity-0 absolute inset-0 cursor-pointer z-10"
						/>
						<button
							type="button"
							className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-2"
							onClick={() => fileInputRef.current?.click()}
						>
							<CameraIcon className="w-4 h-4" />
							Choose Image
						</button>
						<div className="text-xs text-gray-500 mt-1 space-y-1">
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
								<p className="mt-2 text-sm font-medium text-gray-700">
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
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg p-6 max-w-md w-full">
						<h3 className="text-lg font-semibold mb-4">Crop Profile Image</h3>
						<ImageCrop file={selectedFile} onCrop={handleCropComplete}>
							<div className="mb-4">
								<ImageCropContent />
							</div>
							<div className="flex justify-between">
								<button
									type="button"
									onClick={handleCropCancel}
									className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Cancel
								</button>
								<ImageCropApply className="inline-block">
									<div className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors cursor-pointer">
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
