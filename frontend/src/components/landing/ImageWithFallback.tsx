import { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
}

export function ImageWithFallback({ src, alt, className, priority, sizes }: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={800}
      height={600}
      priority={priority}
      sizes={sizes}
      className={`object-cover transition-opacity duration-300 ${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      onLoad={() => setIsLoading(false)}
      onError={() => {
        setImgSrc('/landing-card.png');
        setIsLoading(false);
      }}
    />
  );
}
