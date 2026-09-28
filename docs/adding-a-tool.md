# Adding a New Tool to UtilityHub

UtilityHub is designed so that adding a new tool is fully modular and takes only 4 steps:

---

## Step 1: Implement the Engine Logic

If your tool performs non-trivial processing (e.g., cryptographic hashing, image conversion, or text manipulation), place pure business logic functions in the appropriate `src/lib/<domain>/` directory.

Example (`src/lib/developer/hash-utils.ts`):
```ts
export async function generateSha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
```

---

## Step 2: Create the Tool Component

Create your tool's React component inside `src/components/tools/<category>/`.

Example (`src/components/tools/developer/Sha256Tool.tsx`):
```tsx
"use client";

import * as React from "react";
import { Button } from "@/components/common/Button";
import { CopyButton } from "@/components/common/CopyButton";
import { Textarea } from "@/components/common/Input";
import { generateSha256 } from "@/lib/developer/hash-utils";

export function Sha256Tool() {
  const [input, setInput] = React.useState("");
  const [hash, setHash] = React.useState("");

  const handleCompute = async () => {
    const buffer = new TextEncoder().encode(input);
    const result = await generateSha256(buffer);
    setHash(result);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter text to hash..."
      />
      <Button onClick={handleCompute}>Generate SHA-256</Button>
      {hash && (
        <div className="flex items-center space-x-2">
          <input readOnly value={hash} className="w-full font-mono text-xs" />
          <CopyButton text={hash} />
        </div>
      )}
    </div>
  );
}
```

---

## Step 3: Register the Tool in the Registry

Add an entry to `TOOLS` in `src/lib/registry/tools.ts`:

```ts
{
  id: "sha256-generator",
  name: "SHA-256 Hash Generator",
  slug: "sha256-generator",
  category: "developer",
  description: "Compute secure SHA-256 checksums and hashes for text or files locally.",
  keywords: ["hash", "sha256", "crypto", "checksum"],
  icon: "Hash",
  processing: "client",
  status: "active",
}
```

Then register the component in `src/components/tools/ToolDispatcher.tsx`:

```tsx
case "sha256-generator":
  return <Sha256Tool />;
```

---

## Step 4: Add Unit Tests

Add tests for your engine functions in `tests/unit/`:

```ts
import { describe, it, expect } from "vitest";
import { generateSha256 } from "../../src/lib/developer/hash-utils";

describe("generateSha256", () => {
  it("computes known SHA-256 hash", async () => {
    const input = new TextEncoder().encode("hello");
    const hash = await generateSha256(input);
    expect(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });
});
```

---

## Verification

Before opening a pull request, run all checks:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Your new tool is now automatically indexed in:
- The homepage search bar
- The category page
- The dynamic route `/tools/sha256-generator`
- The global Command Palette (`Ctrl/Cmd + K`)
- SEO Open Graph tags
