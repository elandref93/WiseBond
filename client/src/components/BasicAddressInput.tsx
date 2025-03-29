import { Input } from '@/components/ui/input';

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
  placeholder = 'Enter an address',
  className,
}: BasicAddressInputProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}