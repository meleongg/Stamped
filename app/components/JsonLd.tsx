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
  name: "Stamped",
  alternateName: "Stamped — Personal World Travel Map",
  description:
    "Mark the countries you've visited, share your map with friends, and compare your travels side-by-side. No login required.",
  url: siteUrl,
  applicationCategory: "TravelApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
});
