import { Check, X } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  unavailableFeatures?: string[];
  popular?: boolean;
  ctaText: string;
  ctaLink: string;
}

export default function PricingCard({
  name,
  price,
  period,
  description,
  features,
  unavailableFeatures = [],
  popular = false,
  ctaText,
  ctaLink,
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        popular
          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/50"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-black"
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
            Most Popular
          </span>
        </div>
      )}

      <h3 className="text-2xl font-bold">{name}</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-400">{description}</p>

      <div className="mt-6">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-gray-600 dark:text-gray-400">/{period}</span>
      </div>

      <ul className="mt-8 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
        {unavailableFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <X className="h-5 w-5 flex-shrink-0 text-gray-400" />
            <span className="text-gray-400 line-through">{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href={ctaLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-8 block w-full rounded-lg px-6 py-3 text-center font-semibold transition-colors ${
          popular
            ? "bg-blue-600 text-white hover:bg-blue-500"
            : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        {ctaText}
      </a>
    </div>
  );
}
