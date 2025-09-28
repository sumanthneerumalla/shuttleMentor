'use client';

import { useRef, useState } from 'react';
import { CameraIcon, XIcon } from 'lucide-react';
import { Input } from './Input';
import { ImageCrop, ImageCropContent, ImageCropApply } from '../client/ImageCrop';

interface ProfileImageUploaderProps {
  initialImageUrl?: string | null;
  onChange: (imageData: string | null) => void; // Simplified API with a single callback
}

export function ProfileImageUploader({
  initialImageUrl,
  onChange,
}: ProfileImageUploaderProps) {
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(initialImageUrl || null);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {profileImageUrl ? (
          <div className="relative w-24 h-24 rounded-full overflow-hidden border border-gray-200">
            <img 
              src={profileImageUrl} 
              alt="Profile preview" 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-sm"
            >
              <XIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <CameraIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            id="profile-image-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {profileImageUrl ? "Change Image" : "Upload Image"}
          </button>
          <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
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
                  <div
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors cursor-pointer"
                  >
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
