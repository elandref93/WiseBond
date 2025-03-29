import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: {
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A simple address input component that doesn't use Google Places API
 */
export default function AddressInput({
  value,
  onChange,
  placeholder = 'Enter an address',
  className,
}: AddressInputProps) {
  return (
    <div className="w-full">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}