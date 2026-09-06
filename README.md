# ReflectAI: Authenticated Gemini Journal & Reflection Platform

ReflectAI is a full-stack, user-authenticated journaling web application powered by the **Gemini 3.6 Flash API** and **Google Cloud Firestore**. It provides private, multi-turn reflective dialogues, structured summaries, and brainstorming assistance, with strict database isolation ensuring users can only read and write their own journal entries.

---

## Threat Summary & Security Architecture

| Threat Zone | Evaluated Risk | Implemented Countermeasure |
| :--- | :--- | :--- |
| **Input Surfaces** | Malicious injection payloads, oversized journal strings | Strict client & server schema validation, input size limits, and defensive payload destructuring. |
| **Planning & Reasoning** | Indirect prompt injection via journal reflections | System instructions treat journal content strictly as narrative data, preventing directive hijacking. |
| **Tool Execution** | Gemini API key exposure or client-side leakage | Server-side proxy (`/api/reflect`, `/api/summarize`) keeping `GEMINI_API_KEY` hidden from the client browser. |
| **Memory & State** | Cross-user data leakage and unauthorized access | Owner-bound Firestore rules restricting all reads/writes to `request.auth.uid == userId` with zero insecure defaults. |
| **Inter-System Communication** | Token theft, insecure authentication | Passwordless Google Sign-In via Firebase Auth; Secret Manager / environment variable isolation for backend credentials. |

---

## Architecture & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Secure Google Sign-In with zero custom password storage. |
| **Database** | Cloud Firestore | Isolated document storage at `/users/{userId}/interactions/{interactionId}`. |
| **AI Engine** | Gemini 3.6 Flash (`@google/genai`) | Server-side reflection, summarization, and multi-turn brainstorming. |
| **Resilient Failover** | Automated Fallback Ladder | Primary `gemini-3.6-flash` with graceful fallback to `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.7-flash`. |
| **Secret Management** | Google Cloud Secret Manager | Dynamic, secure retrieval of `GEMINI_API_KEY` without hardcoding. |
| **Deployment Target** | Google Cloud Run | Containerized, auto-scaling Node.js + Vite production runtime. |

---

## 1. Prerequisites & Environment Setup

Ensure you have the Google Cloud SDK (`gcloud`) and Firebase CLI installed and authenticated:

```bash
# 1. Set your active Google Cloud project ID and compute variables
export PROJECT_ID="YOUR_PROJECT_ID"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
export REGION="us-central1"
export SERVICE_NAME="reflect-ai"

gcloud config set project $PROJECT_ID

# 2. Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

---

## 2. Secret Management Setup (Google Cloud Secret Manager)

Create and populate the `GEMINI_API_KEY` secret, then grant read access to the default Cloud Run runtime service account:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure strict user data isolation and default-deny protection.

### `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default-deny all unmapped paths
    match /{document=**} {
      allow read, write: if false;
    }

    // Strict user data isolation
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Deploy Rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Cloud Run Deployment Flow

Build and deploy the application container to Google Cloud Run with Secret Manager environment injection:

```bash
gcloud run deploy reflect-ai \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port 3000
```

---

## 5. Required Campaign Labeling Verification

Apply the required resource label to register the Cloud Run service for automated challenge verification:

```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 6. Environment Configuration Reference

| Variable | Scope | Source / Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-side only | Google AI Studio or Cloud Secret Manager. Never exposed to browser. |
| `PORT` | Server-side | Defaults to `3000` (required for Cloud Run container ingress). |
| `NODE_ENV` | Build/Runtime | `production` for deployed builds, `development` for local dev. |

---

## 7. Local Development & Verification

```bash
# 1. Install dependencies
npm install

# 2. Start local full-stack server
npm run dev

# 3. Build & verify production bundle
npm run build
```
