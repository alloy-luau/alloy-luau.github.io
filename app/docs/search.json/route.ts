import { searchIndex } from "@/lib/docs";

// The search box's index, written as a file by the export.
export const dynamic = "force-static";

export function GET() {
  return Response.json(searchIndex());
}
