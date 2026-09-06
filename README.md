# ReflectAI: Authenticated Gemini Journal & Reflection Platform

ReflectAI is a full-stack, user-authenticated journaling web application powered by the **Gemini 3.6 Flash API** and **Google Cloud Firestore**. It provides private, multi-turn reflective dialogues, structured summaries, and brainstorming assistance, with strict database isolation ensuring users can only read and write their own journal entries.

---

## Architecture & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **User Identity** | Firebase Authentication | Secure Google Sign-In with zero password storage. |
| **Database** | Cloud Firestore | Isolated document storage at `/users/{userId}/interactions/{interactionId}`. |
| **AI Engine** | Gemini 3.6 Flash (@google/genai) | Server-side reflection, summarization, and multi-turn brainstorming. |
| **Resilient Failover** | Automated Fallback Ladder | Primary `gemini-3.6-flash` with graceful fallback to `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.7-flash`. |
| **Secret Management** | Secret Manager / Env Vars | Securely isolates `GEMINI_API_KEY` on the server. |
| **Deployment Target** | Google Cloud Run | Containerized, scalable Node.js + Vite production runtime. |

---

## 1. Prerequisites & Environment Setup

Ensure you have the Google Cloud SDK (`gcloud`) installed and authenticated:

```bash
# Set your active Google Cloud project ID
export PROJECT_ID="YOUR_PROJECT_ID"
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
export REGION="us-central1"
gcloud config set project $PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

---

## 2. Secret Manager Configuration

Store your Gemini API key in Google Cloud Secret Manager and grant access to the Cloud Run compute service account:

```bash
# 1. Create and populate the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure user data isolation:

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

Deploy the rules via the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Cloud Run Deployment Flow

Build and deploy the application container to Cloud Run:

```bash
# Build and deploy from source
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

Apply the required resource label to register the service for the automated challenge verification:

```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

---

## 6. Local Development & Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   Ensure `GEMINI_API_KEY` is present in your local `.env` or injected by AI Studio.

3. Start unified full-stack development server:
   ```bash
   npm run dev
   ```

4. Build and verify production bundle:
   ```bash
   npm run build
   ```
