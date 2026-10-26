export function showServerError(err, setError) {
  const error = err.response?.data?.error;
  let matched = false;

  if (error?.details && typeof error.details === "object") {
    for (const [key, value] of Object.entries(error.details)) {
      if (!key.startsWith("body.")) continue;
      const message = Array.isArray(value) ? value[0] : String(value);
      setError(key.replace("body.", ""), { message });
      matched = true;
    }
  }
  if (!matched)
    setError("root", { message: error?.message ?? "Something went wrong" });
}
