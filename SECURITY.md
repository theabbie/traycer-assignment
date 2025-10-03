# Security Implementation

## reCAPTCHA v2 Invisible Protection

All API endpoints in this application are protected with Google reCAPTCHA v2 Invisible verification.

### Protected Endpoints

1. **GET `/api/github/tree`** - Repository file tree fetching
2. **GET `/api/github/file`** - Individual file content fetching
3. **POST `/api/ai/checklist`** - AI task checklist generation
4. **POST `/api/ai/modify`** - AI code modification generation

### How It Works

**Client-Side:**
- reCAPTCHA v2 Invisible script loads automatically when the repo viewer page mounts
- Before each API call, a token is generated using `executeRecaptcha()`
- Token is sent with the request (query param for GET, body for POST)
- Invisible to legitimate users - no checkbox or challenge

**Server-Side:**
- Each API route extracts the reCAPTCHA token from the request
- Token is verified with Google's siteverify API
- Verification checks:
  - Token is valid
  - Challenge was completed successfully
- Request is rejected with 403 if verification fails

### Configuration

Required environment variables:
- `RECAPTCHA_SITE_KEY` - Public key for client-side
- `RECAPTCHA_SECRET_KEY` - Private key for server-side verification

### reCAPTCHA v2 Invisible

Unlike v3 which uses scores, v2 Invisible:
- Uses challenge-based verification
- Invisible for legitimate users
- May show a challenge for suspicious behavior
- No score - just success/fail

### Actions Tracked

Different actions are used for analytics in reCAPTCHA console:
- `fetch_repo_tree` - Loading repository structure
- `fetch_file` - Opening individual files
- `fetch_files` - Bulk file fetching for AI
- `generate_checklist` - AI plan generation
- `execute_changes` - AI code modification

### Benefits

- **Zero friction** - No CAPTCHAs for users to solve
- **Bot protection** - Automated abuse prevention
- **Analytics** - Track bot activity patterns
- **Adaptive** - Google's ML improves over time
- **Production ready** - Works with Vercel deployment
