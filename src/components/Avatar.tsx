import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  src: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-[52px] h-[52px] text-base',
  lg: 'w-[76px] h-[76px] text-xl',
  xl: 'w-[100px] h-[100px] text-2xl',
};

export default function Avatar({ src, name, size = 'md', className }: Props) {
  const [error, setError] = useState(false);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!src || error) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-display font-bold text-white flex-shrink-0',
          sizes[size],
          className
        )}
        style={{ background: 'var(--gradient-brand)' }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className={cn('avatar', `avatar-${size}`, className)}
    />
  );
}
