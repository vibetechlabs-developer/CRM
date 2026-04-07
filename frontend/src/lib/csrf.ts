import api from "@/lib/api";

let csrfReadyPromise: Promise<void> | null = null;

export const ensureCsrfCookie = async () => {
  if (!csrfReadyPromise) {
    csrfReadyPromise = api
      .get("/api/auth/csrf/")
      .then(() => undefined)
      .catch((err) => {
        csrfReadyPromise = null;
        throw err;
      });
  }
  await csrfReadyPromise;
};
