
# AI Assistant - Document Intelligence & Tool-Calling Platform

An interactive AI Assistant built with React, TypeScript, Vite, and Google Gemini API. This project features full conversational context retention, multi-format document intelligence (PDF, DOCX, TXT), and dynamic tool-calling.

## KEY FEATURES

1. **Advanced Chat & Context Retention**
   - Maintained conversational history across multi-turn interactions.
   - Smooth follow-up resolution for ambiguous coreferences.
   - Native rendering for Markdown and code blocks.

2. **Document Intelligence (RAG)**
   - Supports document uploads in PDF, DOCX, and TXT formats.
   - Client-side document parsing:
     - Custom browser bundling for PDF parsing via `pdfjs-dist`.
     - Native DOCX extraction using `mammoth.js`.
   - Hybrid Answering Strategy: Priorities grounded facts directly from uploaded documents, automatically falling back to general AI knowledge when external details are requested.

3. **Native Function & Tool Calling**
   - Calculator Engine: Parses mathematical expressions and evaluates complex arithmetic operations.

4. **Robust Error Handling & Fallbacks**
   - Automatic model fallback handling for rate limits (429) and high-demand server errors (500/503).
   - User-friendly error notifications and status indicators.

---

## SETUP AND INSTALLATION

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/nabiha24-06/ai-chat-assistant.git
cd ai-chat-assistant
```

### 2. Install Dependencies
Navigate into the project directory and run the following command to download all required packages:
```bash
npm install
```

### 3. Environment Variables
This project requires a Gemini API key to function. 

1. Create a file named `.env` in the root directory of this project.
2. Open the `.env` file and add the following line, replacing the placeholder with your actual API key:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
*Note: If configuring backend or database secrets for edge function deployment, name the secret key `AI_Assistant`.*
### 4. Run the Development Server
Once the server starts, open your browser and navigate to http://localhost:5173 in your browser .
```bash
npm run dev
```
