"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    const githubPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    if (!githubPattern.test(repoUrl)) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }

    router.push(`/repo?url=${encodeURIComponent(repoUrl)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8">
      <main className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Github className="w-12 h-12 text-blue-500" />
            <h1 className="text-5xl font-bold text-white">Traycer AI</h1>
          </div>
          <p className="text-xl text-zinc-400">Prototype</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Explore GitHub Repository
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="repo-url" className="block text-sm font-medium text-zinc-300 mb-2">
                GitHub Repository URL (Public)
              </label>
              <Input
                id="repo-url"
                type="text"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Explore Repository
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-sm text-zinc-500">
              Enter a public GitHub repository URL to browse its code with a VS Code-like interface. You can also use AI to generate code based on human instructions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
