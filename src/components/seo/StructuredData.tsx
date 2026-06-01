/** Renders JSON-LD script tag(s) for search engines */
export function StructuredData({ data }: { data: object | object[] | null }) {
  if (!data) return null;
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
