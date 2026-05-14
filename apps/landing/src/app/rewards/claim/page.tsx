"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Gift, Lock } from "lucide-react";

export default function RewardClaimPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [tier, setTier] = useState<number | null>(null);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setTier(data.tier);
        setMessage("Reward claimed successfully!");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to claim reward");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen px-6 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Gift className="mx-auto h-16 w-16 text-blue-600" />
          <h1 className="mt-6 text-4xl font-bold">Claim Your Reward</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Enter your reward token to unlock premium features
          </p>
        </div>

        <div className="mt-12">
          {status === "idle" && (
            <form onSubmit={handleClaim} className="space-y-6">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reward Token
                </label>
                <input
                  type="text"
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your 64-character reward token"
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  required
                  pattern="[a-f0-9]{64}"
                  title="Enter a valid 64-character hexadecimal token"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Your reward token was sent to you after sponsoring on GitHub Sponsors
                </p>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Claim Reward
              </button>
            </form>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying token...</p>
            </div>
          )}

          {status === "success" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-8 dark:border-green-900 dark:bg-green-950">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <h2 className="text-xl font-bold text-green-900 dark:text-green-100">
                    Reward Claimed Successfully!
                  </h2>
                  <p className="mt-1 text-green-700 dark:text-green-300">{message}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Your Premium Features:
                </h3>
                <ul className="space-y-2 text-green-800 dark:text-green-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Priority email support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Advanced analytics dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Custom integrations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Early access to new features
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    GitHub Sponsors badge
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Vote on feature roadmap
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <a
                  href="https://github.com/khuepm/lumibase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-500"
                >
                  Go to GitHub Repository
                </a>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <h2 className="text-xl font-bold text-red-900 dark:text-red-100">
                    Unable to Claim Reward
                  </h2>
                  <p className="mt-1 text-red-700 dark:text-red-300">{message}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setStatus("idle");
                    setMessage("");
                    setToken("");
                  }}
                  className="rounded-lg border border-red-300 px-6 py-3 font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start gap-4">
            <Lock className="h-6 w-6 flex-shrink-0 text-blue-600" />
            <div>
              <h3 className="font-semibold">Need help?</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                If you haven't received your reward token, please:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Check your GitHub notifications</li>
                <li>• Ensure your sponsorship is active</li>
                <li>• Contact us through the GitHub repository</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
