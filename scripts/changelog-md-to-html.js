import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';
import prettier from 'prettier';

// Define input and output paths for the changelog conversion
const changelogMarkdownPath = 'CHANGELOG.md';
const changelogHtmlPath = 'landing/changelog.html';

// Read the markdown file
const markdown = readFileSync(changelogMarkdownPath, 'utf-8');

// Convert markdown to HTML
const changelogHtml = marked.parse(markdown);

// Basic HTML template
const htmlTemplate = `
<!-- NOTE: This file is auto-generated. Do not edit directly. -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Border Patrol - Changelog</title>
    <link rel="stylesheet" href="assets/css/styles.css" />
    <link rel="icon" type="image/svg+xml" href="assets/img/border-patrol-logo.svg" />
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
    <link rel="canonical" href="https://border-patrol.seasav.ca/changelog.html" />
    <meta
      name="description"
      content="View the changelog for Border Patrol - See what's new, what's changed, and what's been fixed in each version."
    />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Border Patrol" />
    <meta property="og:url" content="https://border-patrol.seasav.ca/changelog.html" />
    <meta property="og:title" content="Border Patrol - Changelog" />
    <meta
      property="og:description"
      content="Stay updated with the latest changes to the Border Patrol Chrome extension. View version history and updates."
    />
    <meta
      property="og:image"
      content="https://border-patrol.seasav.ca/assets/img/border-patrol-og-image.jpg"
    />
    <meta property="og:image:alt" content="Border Patrol CSS debugging extension screenshot" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Border Patrol - Changelog" />
    <meta
      name="twitter:description"
      content="Stay updated with the latest changes to the Border Patrol Chrome extension. View version history and updates."
    />
    <meta
      name="twitter:image"
      content="https://border-patrol.seasav.ca/assets/img/border-patrol-og-image.jpg"
    />
    <meta name="twitter:image:alt" content="Border Patrol CSS debugging extension screenshot" />
  </head>
  <body>
    <nav class="main-nav">
      <div class="nav-container">
        <div class="nav-content">
          <div class="nav-brand">
            <a href="index.html">
              <img
                src="assets/img/border-patrol-logo.svg"
                alt="Border Patrol Logo"
                class="nav-logo"
              />
              <span class="nav-title">Border Patrol</span>
            </a>
          </div>
          <div class="nav-cta">
            <a
              href="https://chromewebstore.google.com/detail/fdkdknepjdabfaihhdljlbbcjiahmkkd?utm_source=item-share-cb"
              class="nav-button button"
              target="_blank"
              rel="noopener noreferrer"
              >Get Border Patrol</a
            >
          </div>
        </div>
      </div>
    </nav>
    <main class="container" style="padding-top: 2rem">
        ${changelogHtml}
    </main>
    <footer>
      <div class="container">
        <p>
          &copy; 2026 Border Patrol. Developed by SeaSav Labs Inc.
          <a href="changelog.html">Changelog</a>
        </p>
      </div>
    </footer>
  </body>
</html>
`;

// Format the HTML
const formattedHtml = await prettier.format(htmlTemplate, { parser: 'html' });

// Write the HTML to a file
writeFileSync(changelogHtmlPath, formattedHtml);

console.log(`Changelog has been converted to ${changelogHtmlPath}`);
