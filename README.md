# AI Newsletter Generator

## 1. Overview

This is a Next.js application designed to streamline the creation of a weekly HTML and plaintext newsletter. It features an intelligent, user-friendly interface that allows users to input various types of content, leverage the Gemini 2.5 Pro LLM for content refinement and generation, and produce polished, ready-to-use newsletter files.

## 2. Core Features

- **Intuitive UI**: A two-column layout with a comprehensive input form on the left and a live preview of the generated newsletter on the right.
- **Smart Content Processing**:
    - **Article Summarization**: Provide URLs, and the application will use its browsing capabilities to fetch the article's title, a compelling one-sentence excerpt, and a relevant image.
    - **Text Enhancement**: Automatically rewrites and reformats unstructured text (like GitHub commit comments) into clean, user-friendly lists, and enhances the writing style of tips to be more engaging.
- **Live Preview**: Instantly see how your newsletter will look as you generate it.
- **Generation History**: Every generated newsletter's input data is saved. A "History" button allows you to view past versions and roll back the form to any previous state for modification.
- **Dual File Download**: A "Download Files" button allows you to save both the final `newsletter.html` and a clean `newsletter.txt` file to your local machine.
- **Real-time Progress**: The UI provides interactive feedback during the generation process, so you know exactly what's happening at each step.

## 3. Getting Started

### 3.1. Prerequisites

This project uses Google's Vertex AI for its LLM capabilities. You must first authenticate your local environment with the Google Cloud CLI.

1.  Open a terminal and run the following command:
    ```bash
    gcloud auth application-default login
    ```
2.  Follow the instructions in your browser to complete the authentication process.

### 3.2. Installation & Setup

1.  Clone the repository to your local machine.
2.  Install the required dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 4. How to Use

1.  **Fill in the Form**: Enter the required information in the input fields on the left-hand side of the screen. For sections like "Latest Insights" and "Industry Buzz," simply provide the URLs.
2.  **Generate Email**: Click the "Generate Email" button. The application will save the current inputs to the history and begin the generation process.
3.  **Monitor Progress**: Observe the real-time feedback messages that appear below the "Generate Email" button.
4.  **Preview**: Once complete, the final HTML will be rendered in the live preview pane on the right.
5.  **Download**: Click the "Download Files" button to save both the `newsletter.html` and `newsletter.txt` files.
6.  **Use History**: Click the "History" button to view a list of past generations. You can click the "Load" button on any entry to repopulate the form with that data, which you can then modify and re-generate.

## 5. Technical Architecture

- **Frontend**: Next.js, React, Shadcn, Tailwind CSS
- **Backend**: Next.js API Routes
- **LLM**: Google Gemini 2.5 Pro via Vertex AI
- **History**: A local `history.json` file is used to store the state of past generations.

### API Endpoints

-   `/api/generate`: Handles the core logic for content processing and newsletter generation. It receives the form data and returns a stream of events for progress and the final HTML/plaintext content.
-   `/api/history`: Provides `GET` and `post` methods to read from and write to the `history.json` file.