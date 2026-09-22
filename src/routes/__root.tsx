import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { useRams } from "@/lib/rams/store";
import "../styles.css";

function HydrateRams() {
  useEffect(() => {
    void useRams.persist.rehydrate();
    useRams.getState().setHydrated(true);
  }, []);
  return null;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RAMS — Road Asset Management System" },
      {
        name: "description",
        content:
          "Inventory, PCI, defects and the maintenance programme for federal A-class and city corridors.",
      },
      { name: "theme-color", content: "#1F5C45" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <HydrateRams />
        <AppShell>{children}</AppShell>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "font-sans",
            style: {
              background: "#fbf8f1",
              color: "#1c1914",
              border: "1px solid #ddd4c4",
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
