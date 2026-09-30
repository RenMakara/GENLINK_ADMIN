"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Displays recovery codes once and requires acknowledgement before continuing. */
export function RecoveryCodes({ codes, onAcknowledged }: { codes: string[]; onAcknowledged: () => void }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copy() {
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused outright — an insecure origin, or a hardened
      // enterprise profile. Say so, because the alternative is an admin who believes they
      // copied their only way back in.
      setCopyFailed(true);
    }
  }

  function download() {
    const content = [
      "GenLink KH — admin recovery codes",
      "",
      "Each code works once. Keep them somewhere you can reach without your phone.",
      "They cannot be shown again.",
      "",
      ...codes,
      "",
    ].join("\n");

    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "genlink-admin-recovery-codes.txt";
    link.click();
    // Released immediately: the blob is held in memory until revoked, and this one contains
    // credentials.
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle>Save these now — they are shown once</AlertTitle>
        <AlertDescription>
          Each code works a single time. Use one to sign in if you lose your phone.
        </AlertDescription>
      </Alert>

      {/* A list lets screen readers announce and read each code separately. */}
      <ul
        aria-label="Your ten recovery codes"
        className="bg-muted grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg p-4 font-mono text-sm"
      >
        {codes.map((code) => (
          <li key={code} className="tabular-nums">
            {code}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={copy} className="flex-1 gap-2">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button type="button" variant="outline" onClick={download} className="flex-1 gap-2">
          <Download className="size-4" aria-hidden />
          Download
        </Button>
      </div>

      {copyFailed ? (
        <p role="alert" className="text-destructive text-sm">
          Your browser refused clipboard access. Use Download, or select the codes and copy them
          by hand.
        </p>
      ) : null}

      <div className="flex items-start gap-3 rounded-lg border p-3">
        <Checkbox
          id="ack"
          checked={acknowledged}
          onCheckedChange={(value) => setAcknowledged(value === true)}
          className="mt-0.5"
        />
        <Label htmlFor="ack" className="text-sm leading-snug font-normal">
          I have saved these codes somewhere I can reach without my phone.
        </Label>
      </div>

      <Button type="button" disabled={!acknowledged} onClick={onAcknowledged}>
        Continue
      </Button>
    </div>
  );
}
