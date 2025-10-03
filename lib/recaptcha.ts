
export async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY not configured");
    return false;
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    
    console.log("reCAPTCHA v2 verification response:", {
      success: data.success,
      hostname: data.hostname,
      challenge_ts: data.challenge_ts,
      errors: data["error-codes"],
    });
    

    if (!data.success) {
      console.error("reCAPTCHA verification failed:", data["error-codes"]);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}
