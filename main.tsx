import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SoundProvider } from "./contexts/SoundContext";
import "./index.css";

const queryClient = new QueryClient();

// ✅ استخدام requestAnimationFrame لتجنب race conditions
const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // تأخير آمن قبل التنقل
  requestAnimationFrame(() => {
    try {
      window.location.href = getLoginUrl();
    } catch (e) {
      console.error("Navigation error:", e);
    }
  });
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_BASE_URL ?? ""}/api/trpc`,
      transformer: superjson,
      async fetch(input, init) {
        const res = await globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });

        try {
          const cloned = res.clone();
          const text = await cloned.text();
          const contentType = res.headers.get("content-type") ?? "";
          const isJson = contentType.toLowerCase().includes("application/json");

          if (!text.trim() || !isJson) {
            const fallback = {
              error: {
                message: !text.trim()
                  ? "Empty response from API (possible proxy/server issue)"
                  : `Non-JSON response from API (content-type: ${contentType || "unknown"})`,
              },
            };
            return new Response(JSON.stringify(fallback), {
              status: 502,
              headers: {
                "content-type": "application/json",
              },
            });
          }
        } catch {
          // If we cannot read/clone the body, just return the original response.
        }

        return res;
      },
    }),
  ],
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SoundProvider>
          <App />
        </SoundProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
