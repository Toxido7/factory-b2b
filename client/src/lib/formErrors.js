import i18n from "../i18n/index.js";
import serverMessages from "../i18n/serverMessages.js";

export function translateServerMessage(message) {
  return serverMessages[message] ?? message;
}

export function showServerError(err, setError) {
  const error = err.response?.data?.error;
  let matched = false;

  if (error?.details && typeof error.details === "object") {
    for (const [key, value] of Object.entries(error.details)) {
      if (!key.startsWith("body.")) continue;
      const message = translateServerMessage(Array.isArray(value) ? value[0] : String(value));
      setError(key.replace("body.", ""), { message });
      matched = true;
    }
  }
  if (!matched)
    setError("root", {
      message: translateServerMessage(
        error?.message ?? i18n.t("common.genericError"),
      ),
    });
}
