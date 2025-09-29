'use client';

import { Button } from '../shared/Button';
import { CropIcon, RotateCcwIcon } from 'lucide-react';
import { Slot } from '@radix-ui/react-slot';
import {
  type ComponentProps,
  type CSSProperties,
  createContext,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
  type ReactCropProps,
} from 'react-image-crop';
import { cn } from '~/lib/utils';
import 'react-image-crop/dist/ReactCrop.css';

const centerAspectCrop = (
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined
): PercentCrop =>
  centerCrop(
    aspect
      ? makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspect,
          mediaWidth,
          mediaHeight
        )
      : { x: 0, y: 0, width: 90, height: 90, unit: '%' },
    mediaWidth,
    mediaHeight
  );

const getCroppedPngImage = async (
  imageSrc: HTMLImageElement,
  scaleFactor: number,
  pixelCrop: PixelCrop,
  maxImageSize: number
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Context is null, this should never happen.');
  }
  const scaleX = imageSrc.naturalWidth / imageSrc.width;
  const scaleY = imageSrc.naturalHeight / imageSrc.height;
  ctx.imageSmoothingEnabled = false;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    imageSrc,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );
  const croppedImageUrl = canvas.toDataURL('image/png');
  const response = await fetch(croppedImageUrl);
  const blob = await response.blob();
  if (blob.size > maxImageSize) {
    return await getCroppedPngImage(
      imageSrc,
      scaleFactor * 0.9,
      pixelCrop,
      maxImageSize
    );
  }
  return croppedImageUrl;
};

type ImageCropContextType = {
  file: File;
  maxImageSize: number;
  imgSrc: string;
  crop: PercentCrop | undefined;
  completedCrop: PixelCrop | null;
  imgRef: RefObject<HTMLImageElement | null>;
  onCrop?: (croppedImage: string) => void;
  reactCropProps: Omit<ReactCropProps, 'onChange' | 'onComplete' | 'children'>;
  handleChange: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void;
  handleComplete: (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop
  ) => Promise<void>;
  onImageLoad: (e: SyntheticEvent<HTMLImageElement>) => void;
  applyCrop: () => Promise<void>;
  resetCrop: () => void;
};

const ImageCropContext = createContext<ImageCropContextType | null>(null);

const useImageCrop = () => {
  const context = useContext(ImageCropContext);
  if (!context) {
    throw new Error('ImageCrop components must be used within ImageCrop');
  }
  return context;
};

export type ImageCropProps = {
  file: File;
  maxImageSize?: number;
  onCrop?: (croppedImage: string) => void;
  children: ReactNode;
  onChange?: ReactCropProps['onChange'];
  onComplete?: ReactCropProps['onComplete'];
} & Omit<ReactCropProps, 'onChange' | 'onComplete' | 'children'>;

export const ImageCrop = ({
  file,
  maxImageSize = 1024 * 1024 * 5, // 5MB default
  onCrop,
  children,
  onChange,
  onComplete,
  ...reactCropProps
}: ImageCropProps) => {
  // Force 1:1 aspect ratio for profile images
  const cropProps = {
    ...reactCropProps,
    aspect: 1, // Always use 1:1 aspect ratio
    circularCrop: true, // Use circular crop for profile images
  };
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [initialCrop, setInitialCrop] = useState<PercentCrop>();

  useEffect(() => {
    const reader = new FileReader();
    reader.addEventListener('load', () =>
      setImgSrc(reader.result?.toString() || '')
    );
    reader.readAsDataURL(file);
  }, [file]);

  const onImageLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const newCrop = centerAspectCrop(width, height, cropProps.aspect);
      setCrop(newCrop);
      setInitialCrop(newCrop);
    },
    [cropProps.aspect]
  );

  const handleChange = (pixelCrop: PixelCrop, percentCrop: PercentCrop) => {
    setCrop(percentCrop);
    onChange?.(pixelCrop, percentCrop);
  };

  const handleComplete = async (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop
  ) => {
    setCompletedCrop(pixelCrop);
    onComplete?.(pixelCrop, percentCrop);
  };

  const applyCrop = async () => {
    if (!(imgRef.current && completedCrop)) {
      return;
    }
    const croppedImage = await getCroppedPngImage(
      imgRef.current,
      1,
      completedCrop,
      maxImageSize
    );
    onCrop?.(croppedImage);
  };

  const resetCrop = () => {
    if (initialCrop) {
      setCrop(initialCrop);
      setCompletedCrop(null);
    }
  };

  const contextValue: ImageCropContextType = {
    file,
    maxImageSize,
    imgSrc,
    crop,
    completedCrop,
    imgRef,
    onCrop,
    reactCropProps: cropProps,
    handleChange,
    handleComplete,
    onImageLoad,
    applyCrop,
    resetCrop
  }

  return (
    <ImageCropContext.Provider value={contextValue}>
      {children}
    </ImageCropContext.Provider>
  );
};

export type ImageCropContentProps = {
  style?: CSSProperties;
  className?: string;
};

export const ImageCropContent = ({
  style,
  className,
}: ImageCropContentProps) => {
  const {
    imgSrc,
    crop,
    handleChange,
    handleComplete,
    onImageLoad,
    imgRef,
    reactCropProps,
  } = useImageCrop();

  const shadcnStyle = {
    '--rc-border-color': 'var(--border)',
    '--rc-focus-color': 'var(--primary)',
  } as CSSProperties;

  return (
    <ReactCrop
      className={cn('max-h-[277px] max-w-full', className)}
      crop={crop}
      onChange={handleChange}
      onComplete={handleComplete}
      style={{ ...shadcnStyle, ...style }}
      {...reactCropProps}
    >
      {imgSrc && (
        <img
          alt="crop"
          className="size-full"
          onLoad={onImageLoad}
          ref={imgRef}
          src={imgSrc}
        />
      )}
    </ReactCrop>
  );
};

export type ImageCropApplyProps = ComponentProps<'div'> & {
  asChild?: boolean;
};

export const ImageCropApply = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropApplyProps) => {
  const { applyCrop } = useImageCrop();

  const handleClick = async (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    await applyCrop();
    onClick?.(e as any);
  };

  if (asChild) {
    return (
      <Slot onClick={handleClick} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <div 
      onClick={handleClick} 
      className="cursor-pointer"
      {...props}
    >
      {children ?? <Button size="sm" variant="outline"><CropIcon className="size-4" /></Button>}
    </div>
  );
};

export type ImageCropResetProps = ComponentProps<'div'> & {
  asChild?: boolean;
};

export const ImageCropReset = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropResetProps) => {
  const { resetCrop } = useImageCrop();

  const handleClick = (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    resetCrop();
    onClick?.(e as any);
  };

  if (asChild) {
    return (
      <Slot onClick={handleClick} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <div 
      onClick={handleClick} 
      className="cursor-pointer"
      {...props}
    >
      {children ?? <Button size="sm" variant="outline"><RotateCcwIcon className="size-4" /></Button>}
    </div>
  );
};

// Keep the original Cropper component for backward compatibility
export type CropperProps = Omit<ReactCropProps, 'onChange'> & {
  file: File;
  maxImageSize?: number;
  onCrop?: (croppedImage: string) => void;
  onChange?: ReactCropProps['onChange'];
};

export const Cropper = ({
  onChange,
  onComplete,
  onCrop,
  style,
  className,
  file,
  maxImageSize,
  ...props
}: CropperProps) => (
  <ImageCrop
    file={file}
    maxImageSize={maxImageSize}
    onChange={onChange}
    onComplete={onComplete}
    onCrop={onCrop}
    {...props}
  >
    <ImageCropContent className={className} style={style} />
  </ImageCrop>
);
