# MCCIA Certificate Generator

A premium, fully client-side web application to design custom certificate templates, bind data fields, preview recipient lists, and export high-resolution certificates individually or in bulk.

## Features

- **Responsive Visual Design Stage**: Drag and resize text placeholders (`Name`, `Course`, `Date`, etc.) directly on top of your certificate template.
- **Real-Time Style Customization**: Customize fonts, sizes, colors, weight, alignment, and styling settings on the fly.
- **Smart Data Auto-Binding**: Import candidate lists via CSV uploads or manual text entries. Text placeholders automatically bind to matching columns case-insensitively, or you can bind them manually using the dropdown editor.
- **Single-Certificate Exports**: Download the active customized canvas instantly as a high-resolution **PNG** or print-ready **PDF** without needing spreadsheet data.
- **Bulk Certificate Compilation**: Generate and compile hundreds of certificates in one click:
  - **Bulk ZIP**: Packs individual PNG images named after candidates into a single archive.
  - **Bulk PDF Book**: Concatenates all candidate certificates sequentially into a single multi-page landscape PDF.
- **Offline-Safe Built-in Sample**: Get started immediately with our premium built-in cream-beige parchment certificate template.

## Project Structure

```text
certificate-generator/
│
├── index.html        # App layout structure, styling links, and CDN imports
├── style.css         # Gold & navy slate design system, canvas board, and animations
├── samples.js        # Built-in premium certificate template generator
├── app.js            # Core coordinate-calculating state engine and exporters
└── README.md         # Project documentation and start guide
```

## Getting Started

Since the application runs entirely client-side (no Node.js, NPM, or backend required), you only need to serve the directory files using a simple local HTTP server.

1. Open your terminal in the project directory.
2. Launch a Python HTTP server:
   ```bash
   python -m http.server 8080
   ```
3. Open your browser and navigate to:
   **[http://localhost:8080](http://localhost:8080)**

## Quick-Start Workflow

1. **Load Template**: Drag and drop your background image or click **Try Sample Template** to load the default design.
2. **Edit Fields**: Select elements (like `{{Name}}`) to reposition them. Use the bottom panel to adjust sizes, pick elegant serif/script fonts, or input a custom placeholder tag.
3. **Load Recipient Data** (Optional): Click **Enter Data Manually** or drop a CSV file containing headers like `Name`, `Course`, `Date`.
4. **Preview & Exclude**: Switch to **Live Preview** mode to review page pagination. Click the **Trash** icon to delete any candidate certificates you do not wish to compile.
5. **Download**: Click **PNG** or **PDF** under *Download* for the current layout, or click **ZIP** / **PDF Book** under *Bulk* to export all pages.
