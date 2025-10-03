import { NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch") || "main";
  const recaptchaToken = searchParams.get("recaptcha");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Owner and repo are required" },
      { status: 400 }
    );
  }

  if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
    return NextResponse.json(
      { error: "reCAPTCHA verification failed" },
      { status: 403 }
    );
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );

    if (!repoResponse.ok) {
      const error = await repoResponse.json();
      return NextResponse.json(
        { error: error.message || "Failed to fetch repository" },
        { status: repoResponse.status }
      );
    }

    const repoData = await repoResponse.json();
    const defaultBranch = branch === "main" ? repoData.default_branch : branch;

    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );

    if (!treeResponse.ok) {
      const error = await treeResponse.json();
      return NextResponse.json(
        { error: error.message || "Failed to fetch repository tree" },
        { status: treeResponse.status }
      );
    }

    const treeData = await treeResponse.json();

    return NextResponse.json({
      tree: treeData.tree,
      truncated: treeData.truncated,
      sha: treeData.sha,
      defaultBranch,
    });
  } catch (error) {
    console.error("Error fetching GitHub tree:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
