interface JsonLdProps {
  data: Record<string, unknown>;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

export const webApplicationLd = (siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Personal World Map",
  description:
    "Track your travels and plan your next adventures on an interactive world map.",
  url: siteUrl,
  applicationCategory: "TravelApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
});
