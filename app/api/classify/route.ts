import { NextResponse } from "next/server";

export type ClassificationResult = {
  rank: number;
  htsCode: string;
  description: string;
  confidence: number;
  reasoning: string;
  dutyRate: string;
  costEffectivenessNote: string;
};

export type APIResponse = {
  results: ClassificationResult[];
};

const mockResults: ClassificationResult[] = [
  {
    rank: 1,
    htsCode: "8471.30.0100",
    description: "Portable automatic data processing machine, weighing not more than 10 kg",
    confidence: 0.92,
    reasoning:
      "The item appears to be a laptop computer based on its form factor, visible keyboard, and display. This classification carries the lowest duty rate for portable computing devices.",
    dutyRate: "Free",
    costEffectivenessNote:
      "Most cost-effective option. No duty applied under this classification.",
  },
  {
    rank: 2,
    htsCode: "8471.41.0150",
    description:
      "Other automatic data processing machines comprising a CPU and input/output unit",
    confidence: 0.78,
    reasoning:
      "Could be classified as a general-purpose computing unit if portable characteristics are not primary. Slightly higher duty applies compared to the portable classification.",
    dutyRate: "2.5%",
    costEffectivenessNote:
      "Moderate duty rate. Consider if the item does not meet portable weight criteria.",
  },
  {
    rank: 3,
    htsCode: "8528.52.0000",
    description: "Other monitors, capable of directly connecting to a data processing machine",
    confidence: 0.54,
    reasoning:
      "If the device is primarily functioning as a display unit with limited processing, this monitor classification could apply. Duty rate is moderate.",
    dutyRate: "3.9%",
    costEffectivenessNote:
      "Higher duty than rank 1. Only applicable if the device is primarily a display.",
  },
  {
    rank: 4,
    htsCode: "8473.30.5100",
    description: "Parts and accessories of automatic data processing machines",
    confidence: 0.35,
    reasoning:
      "If the item is a component or accessory rather than a complete machine, this broader parts classification may apply. Less favorable duty treatment.",
    dutyRate: "Free",
    costEffectivenessNote:
      "Free duty but narrow applicability. Only valid for parts, not complete units.",
  },
  {
    rank: 5,
    htsCode: "8543.70.9960",
    description: "Other electrical machines and apparatus, not specified elsewhere",
    confidence: 0.18,
    reasoning:
      "Catch-all classification for electronic devices that do not fit neatly into more specific categories. Carries a higher duty rate and should be avoided if a more specific code applies.",
    dutyRate: "4.2%",
    costEffectivenessNote:
      "Least favorable option. Use only if no other specific classification applies.",
  },
];

export async function POST() {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 1800));

  return NextResponse.json<APIResponse>({ results: mockResults });
}
