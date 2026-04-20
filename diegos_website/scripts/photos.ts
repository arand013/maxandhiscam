import path from "node:path";
import { MANIFEST, ROOT, runPhotoPipeline } from "@/lib/photo-pipeline";

runPhotoPipeline()
  .then((galleries) => {
    console.log(`\n✓ wrote ${galleries.length} galleries → ${path.relative(ROOT, MANIFEST)}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
