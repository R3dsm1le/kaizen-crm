import Link from "next/link";
import { Download, Globe, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Download" };
export const revalidate = 300;

const REPO = process.env.KAIZEN_GITHUB_REPO ?? "r3dsm1le/kaizen-crm";
const RELEASE_TAG = "downloads";

type ReleaseAsset = {
  name: string;
  size: number;
  browser_download_url: string;
  updated_at: string;
};

async function getAssets(): Promise<ReleaseAsset[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/tags/${RELEASE_TAG}`,
      { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const release = (await res.json()) as { assets?: ReleaseAsset[] };
    return release.assets ?? [];
  } catch {
    return [];
  }
}

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function AssetRow({ asset }: { asset: ReleaseAsset }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="truncate text-sm">{asset.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(asset.size)} · updated {new Date(asset.updated_at).toLocaleDateString()}
        </p>
      </div>
      <Button asChild variant="brand" size="sm">
        <a href={asset.browser_download_url}>
          <Download /> Download
        </a>
      </Button>
    </div>
  );
}

export default async function DownloadPage() {
  const assets = await getAssets();
  const apks = assets.filter((a) => a.name.endsWith(".apk"));
  const exes = assets.filter((a) => a.name.endsWith(".exe"));

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 p-8">
      <div className="space-y-1">
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-base font-semibold text-brand-foreground">
          改
        </div>
        <h1 className="pt-2 text-lg font-semibold tracking-tight">Get Kaizen CRM</h1>
        <p className="text-sm text-muted-foreground">
          The same workspace on every device. Pick your platform below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="size-4 text-muted-foreground" /> Android
          </CardTitle>
          <CardDescription>
            A native shell that loads this workspace. Allow installs from unknown sources when
            prompted.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {apks.length > 0 ? (
            apks.map((a) => <AssetRow key={a.name} asset={a} />)
          ) : (
            <p className="text-xs text-muted-foreground">
              No APK published yet — run the{" "}
              <a
                href={`https://github.com/${REPO}/actions/workflows/release.yml`}
                className="text-brand hover:underline"
              >
                Release installers
              </a>{" "}
              workflow to build one.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="size-4 text-muted-foreground" /> Windows
          </CardTitle>
          <CardDescription>
            Runs fully offline with its own bundled server — the portable exe needs no install.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {exes.length > 0 ? (
            exes.map((a) => <AssetRow key={a.name} asset={a} />)
          ) : (
            <p className="text-xs text-muted-foreground">
              No EXE published yet — run the{" "}
              <a
                href={`https://github.com/${REPO}/actions/workflows/release.yml`}
                className="text-brand hover:underline"
              >
                Release installers
              </a>{" "}
              workflow to build one.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4 text-muted-foreground" /> Any device (PWA)
          </CardTitle>
          <CardDescription>
            Open this site in your browser and choose &ldquo;Add to Home Screen&rdquo; or
            &ldquo;Install app&rdquo; — no download needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/">Open the app</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
