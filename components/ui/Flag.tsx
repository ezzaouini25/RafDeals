import { DynamicFlag } from '@sankyu/react-circle-flags';

interface FlagProps {
  code?: string | null;
  country?: string | null; // Compatible with existing card component calls
  width?: number;
}

export default function Flag({ code, country, width = 16 }: FlagProps) {
  // Read code first; if empty, fall back to country (compatible with old code)
  const finalCode = code || country;

  // If no valid country code is provided, render nothing (you can also add a placeholder icon here)
  if (!finalCode || typeof finalCode !== 'string') {
    return null;
  }

  // DynamicFlag automatically recognizes ISO codes (us, ca, gb...)
  // and renders the corresponding country's circular SVG flag
  return <DynamicFlag code={finalCode} width={width} height={width} />;
}