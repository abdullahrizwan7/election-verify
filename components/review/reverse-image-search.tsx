import { ExternalLink, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Automatic reverse image search needs a paid API, so reviewers get one-click
 * links to free search engines instead. This finds older copies of a photo,
 * which is the most common way old pictures are passed off as new.
 */
export function ReverseImageSearch({ imageUrl }: { imageUrl: string }) {
  // Search engines can only open images that have a public https link (Supabase signed links do).
  const isPublicLink = imageUrl.startsWith("https://");
  const encoded = encodeURIComponent(imageUrl);
  const engines = [
    { name: "Google Lens", search: `https://lens.google.com/uploadbyurl?url=${encoded}`, home: "https://lens.google.com" },
    { name: "TinEye", search: `https://tineye.com/search?url=${encoded}`, home: "https://tineye.com" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanSearch className="size-4 text-muted-foreground" aria-hidden /> Find older copies of this image
        </CardTitle>
        <CardDescription>
          {isPublicLink
            ? "Opens the image in a free reverse image search. Look for copies older than the claimed event."
            : "Direct search works once images are stored in Supabase. For now, save the image and upload it on one of these sites."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {engines.map((engine) => (
          <Button key={engine.name} variant="outline" size="sm" asChild>
            <a href={isPublicLink ? engine.search : engine.home} target="_blank" rel="noopener noreferrer">
              {engine.name} <ExternalLink aria-hidden />
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
