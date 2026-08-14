# 🏠 OmniSpace — Property Listing & 2D Interior Design Web App

OmniSpace is a full-stack platform combining real estate property listings (residential & commercial) with an interactive **2D Interior Design & Staging Studio**.

---

## 📋 USER ACTION CHECKLIST FOR DEPLOYMENT (100% FREE)

Follow these simple steps to make your application live on the internet:

### STEP 1: Deploy Backend REST API on Render.com (Takes 2 minutes)

1. Open **[dashboard.render.com](https://dashboard.render.com)** and log in with your GitHub account.
2. Click **New +** (top right) → **Web Service**.
3. Select **Build and deploy from a Git repository** → choose repository `kmrabhay07/omnispace-webapp`.
4. Configure these exact settings:
   - **Name**: `omnispace-api`
   - **Root Directory**: `omnispace/backend`
   - **Runtime**: `Docker`
   - **Environment Variables**:
     - Key: `MONGO_DB_URI`
     - Value: `mongodb+srv://freeak:root%401234@cluster0.e5vkr1f.mongodb.net/omnispace?retryWrites=true&w=majority`
5. Click **Create Web Service**.
6. Render will automatically build the container and provide your live API URL (e.g., `https://omnispace-api.onrender.com`).

---

### STEP 2: Deploy Frontend SPA on Vercel (Takes 1 minute)

1. Open **[vercel.com](https://vercel.com)** and log in with your GitHub account.
2. Click **Add New...** → **Project**.
3. Import repository `kmrabhay07/omnispace-webapp`.
4. Configure these exact settings:
   - **Framework Preset**: `Angular`
   - **Root Directory**: `omnispace/frontend`
5. Click **Deploy**.
6. Vercel will build your Angular application and provide your live website link (e.g., `https://omnispace.vercel.app`)!

---

## 🚀 Local Development Setup

### 1. Frontend (Angular 18)
```bash
cd omnispace/frontend
npm install
npx ng serve
```
Access at `http://localhost:4200`

### 2. Backend (Spring Boot 3 + MongoDB)
```bash
cd omnispace/backend
mvn spring-boot:run
```
API runs at `http://localhost:8080/api`
