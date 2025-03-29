import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BasicAddressInputProps {
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
 * A very simple address input that doesn't rely on the Google Places API
 * This serves as a fallback when the Google Places API fails to load
 */
export default function BasicAddressInput({
  value,
  onChange,
  placeholder = 'Enter your address',
  className,
}: BasicAddressInputProps) {
  const [error] = useState<string | null>(null);

  return (
    <div className="w-full">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}