import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';
import prettier from 'prettier';

// Read the markdown file
const markdown = readFileSync('CHANGELOG.md', 'utf-8');

// Convert markdown to HTML
const changelogHtml = marked.parse(markdown);

// Basic HTML template
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Border Patrol - Changelog</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="icon" type="image/png" href="assets/icons/bp-icon-32.png">
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
      integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
    <meta
      name="description"
      content="View the changelog for Border Patrol - See what's new, what's changed, and what's been fixed in each version."
    />
    <meta property="og:title" content="Border Patrol - Changelog" />
    <meta
      property="og:description"
      content="Stay updated with the latest changes to the Border Patrol Chrome extension. View version history and updates."
    />
  </head>
  <body>
    <main class="container" style="padding-top: 2rem">
        ${changelogHtml}
    </main>
    <footer>
      <div class="container">
        <p>
          &copy; 2025 Border Patrol. Developed by Craig Savage.
          <a href="changelog.html">Changelog</a>
          |
          <a
            href="https://github.com/craigsavage/border-patrol"
            target="_blank"
            rel="noopener noreferrer"
            >
            View on GitHub
            </a>
        </p>
      </div>
    </footer>
  </body>
</html>
`;

// Format the HTML
const formattedHtml = await prettier.format(htmlTemplate, { parser: 'html' });

// Write the HTML to a file
writeFileSync('docs/changelog.html', formattedHtml);

console.log('Changelog has been converted to docs/changelog.html');
