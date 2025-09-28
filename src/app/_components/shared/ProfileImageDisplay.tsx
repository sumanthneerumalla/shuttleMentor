'use client';

interface ProfileImageDisplayProps {
  imageUrl: string | null;
  alt?: string;
}

export function ProfileImageDisplay({ imageUrl, alt = "Profile" }: ProfileImageDisplayProps) {
  if (!imageUrl) return null;
  
  return (
    <div>
      <label className="text-sm text-gray-500">Profile Image</label>
      <div className="mt-2">
        <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200">
          <img 
            src={imageUrl} 
            alt={alt} 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
