/**
 * Renders a JSON-LD structured-data block. Server component — the payload is
 * serialised once on the server and never hydrated on the client.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      // JSON.stringify already escapes quotes; guard the one sequence that can
      // break out of a <script> element.
      dangerouslySetInnerHTML={{ __html: json.replace(/</g, "\\u003c") }}
    />
  );
}
