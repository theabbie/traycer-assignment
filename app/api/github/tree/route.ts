import { NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/recaptcha";

// Handles GET requests to fetch the full file tree of a GitHub repository
export async function GET(request: Request) {
  // Extract query parameters from the request URL
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");          // GitHub repo owner
  const repo = searchParams.get("repo");            // Repository name
  const branch = searchParams.get("branch") || "main"; // Branch (default: main)
  const recaptchaToken = searchParams.get("recaptcha"); // reCAPTCHA token

  // Validate required parameters
  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Owner and repo are required" },
      { status: 400 }
    );
  }

  // Verify reCAPTCHA token to prevent automated abuse
  if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
    return NextResponse.json(
      { error: "reCAPTCHA verification failed" },
      { status: 403 }
    );
  }

  try {
    // Prepare GitHub API headers
    const token = process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // If a GitHub token is available, include it for higher rate limits
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Fetch repository metadata (to verify repo existence and get default branch)
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );

    // Handle errors from the repo fetch call
    if (!repoResponse.ok) {
      const error = await repoResponse.json();
      return NextResponse.json(
        { error: error.message || "Failed to fetch repository" },
        { status: repoResponse.status }
      );
    }

    // Parse repository data
    const repoData = await repoResponse.json();

    // Use the default branch from GitHub metadata if "main" was requested
    const defaultBranch = branch === "main" ? repoData.default_branch : branch;

    // Fetch the complete recursive file tree for the selected branch
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );

    // Handle tree fetch errors
    if (!treeResponse.ok) {
      const error = await treeResponse.json();
      return NextResponse.json(
        { error: error.message || "Failed to fetch repository tree" },
        { status: treeResponse.status }
      );
    }

    // Parse tree data (contains files, folders, and SHA info)
    const treeData = await treeResponse.json();

    // Return the final structured response
    return NextResponse.json({
      tree: treeData.tree,         // Full file list with paths and types
      truncated: treeData.truncated, // Indicates if GitHub truncated results
      sha: treeData.sha,           // Commit SHA for the branch
      defaultBranch,               // Confirmed branch name
    });

  } catch (error) {
    // Catch unexpected runtime or network errors
    console.error("Error fetching GitHub tree:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
