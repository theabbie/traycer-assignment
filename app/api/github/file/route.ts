import { NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const branch = searchParams.get("branch") || "main";
  const recaptchaToken = searchParams.get("recaptcha");

  if (!owner || !repo || !path) {
    return NextResponse.json(
      { error: "Owner, repo, and path are required" },
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
      Accept: "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "Failed to fetch file" },
        { status: response.status }
      );
    }

    const content = await response.text();

    return NextResponse.json({
      content,
      path,
    });
  } catch (error) {
    console.error("Error fetching GitHub file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
