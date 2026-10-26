import { useState } from "react";
import { Link } from "react-router";
import { api } from "../../api/client.js";
import Button from "../../components/Button.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();
  const [result, setResult] = useState("");

  async function testApi() {
    try {
      const res = await api.get("/products", { params: { limit: 1 } });
      const data = res.data.data;
      setResult(
        `OK. Keys: ${Object.keys(data).join(", ")} | total: ${data.pagination?.total}`,
      );
    } catch (err) {
      setResult(`Failed: ${err.message}`);
    }
  }

  async function fireThree() {
    try {
      await Promise.all([
        api.get("/auth/me"),
        api.get("/auth/me"),
        api.get("/auth/me"),
      ]);
      setResult("3 requests OK");
    } catch (err) {
      setResult(`Failed: ${err.message}`);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-16">
      <h1 className="text-5xl font-bold">
        Industrial supply, straight from the factory.
      </h1>

      <div className="mt-8 flex gap-4">
        <Button as={Link} to="/products">
          Browse products
        </Button>
        {!user && (
          <Button as={Link} to="/register" variant="ghost">
            Create a business account
          </Button>
        )}
      </div>

      {/* Temporary test buttons, removed at the end of F2 */}
      <div className="mt-12 flex items-center gap-4">
        <Button variant="ghost" onClick={testApi}>
          Test the API
        </Button>
        <Button variant="ghost" onClick={fireThree}>
          Fire 3 requests
        </Button>
        <span className="text-muted">{result}</span>
      </div>
    </div>
  );
}
