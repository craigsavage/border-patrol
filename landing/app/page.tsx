import type { Metadata } from 'next';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Border Patrol - Visualize CSS Layouts & Debug with Ease',
  description:
    'Stop CSS debugging frustration! Border Patrol visually outlines elements, margins, and padding in your browser. Free & open-source.',
  alternates: { canonical: 'https://border-patrol.seasav.ca/' },
  openGraph: {
    url: 'https://border-patrol.seasav.ca/',
    title: 'Border Patrol - CSS Outliner & Debugging Tool',
    description:
      'Visually inspect CSS layouts, margins, and padding with the Border Patrol Chrome extension. Boost your debugging efficiency.',
  },
  twitter: {
    title: 'Border Patrol - CSS Outliner & Debugging Tool',
    description:
      'Visually inspect CSS layouts, margins, and padding with the Border Patrol Chrome extension. Boost your debugging efficiency.',
  },
};

export default function HomePage() {
  return (
    <>
      <Nav />

      <header>
        <div className='container'>
          <div className='hero'>
            <div className='hero-text'>
              <h1 className='headline'>
                <span className='hero-line-1'>Stop Guessing!</span>
                <span className='hero-line-2'>
                  <span>Start</span>
                  <span className='hero-highlight'>Seeing</span>
                  <span>Your CSS</span>
                </span>
              </h1>
              <p className='subheadline'>
                Border Patrol is the ultimate visual debugging tool that reveals
                webpage structures and box models instantly. Visualize element
                boundaries, margins, and padding with ease!
              </p>
              <p className='cta-description'>
                Say goodbye to CSS debugging frustration and hello to clear,
                visual understanding. Get the free Chrome extension now!
              </p>

              <div className='cta-buttons'>
                <a
                  href='https://chromewebstore.google.com/detail/fdkdknepjdabfaihhdljlbbcjiahmkkd?utm_source=item-share-cb'
                  className='button primary-button'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <i className='fa-brands fa-chrome'></i> Add to Chrome
                </a>
                <a
                  href='https://github.com/seasav/border-patrol'
                  className='button secondary-button'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <i className='fa-brands fa-github'></i> View on GitHub
                </a>
              </div>
            </div>

            <div className='hero-image'>
              <img
                src='/assets/img/border-patrol-popup-menu.png'
                alt='Border Patrol Menu Screenshot'
                width={568}
                height={1110}
              />
            </div>
          </div>
        </div>
      </header>

      <section id='problem-solution' className='section'>
        <div className='container'>
          <div className='section-header'>
            <span className='section-subtitle'>
              The Developer&apos;s Dilemma
            </span>
            <h2>CSS Debugging Shouldn&apos;t Be a Puzzle</h2>
            <p className='section-intro'>
              Spend less time hunting CSS issues and more time building amazing
              interfaces
            </p>
          </div>

          <div className='problem-solution-grid'>
            <div className='problem-card'>
              <div className='card-header'>
                <i className='fas fa-exclamation-triangle'></i>
                <h3>The Problem</h3>
              </div>
              <ul className='problem-list'>
                <li>
                  <i className='fas fa-align-left icon-list'></i>
                  <span>Complex layouts that never quite align</span>
                </li>
                <li>
                  <i className='fas fa-arrows-alt icon-list'></i>
                  <span>
                    Inconsistent spacing that&apos;s hard to track down
                  </span>
                </li>
                <li>
                  <i className='fas fa-layer-group icon-list'></i>
                  <span>
                    Nested elements making it hard to see the full picture
                  </span>
                </li>
                <li>
                  <i className='far fa-clock icon-list'></i>
                  <span>
                    Time wasted toggling between browser and code editor
                  </span>
                </li>
              </ul>
            </div>
            <div className='solution-card'>
              <div className='card-header'>
                <i className='fas fa-lightbulb'></i>
                <h3>The Solution</h3>
              </div>
              <div className='solution-content'>
                <p className='highlight-text'>
                  Border Patrol gives you instant visual feedback on your
                  page&apos;s structure, making CSS debugging faster and more
                  intuitive.
                </p>
                <ul className='solution-features'>
                  <li>
                    <i className='fas fa-check-circle'></i> See element
                    boundaries at a glance
                  </li>
                  <li>
                    <i className='fas fa-check-circle'></i> Visualize margins
                    and padding instantly
                  </li>
                  <li>
                    <i className='fas fa-check-circle'></i> No more guesswork in
                    your CSS debugging
                  </li>
                  <li>
                    <i className='fas fa-check-circle'></i> Save time with
                    real-time visual feedback
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id='features' className='section bg-light'>
        <div className='container'>
          <div className='section-header'>
            <span className='section-subtitle'>
              Powerful Tools at Your Fingertips
            </span>
            <h2>Key Features to Boost Your Workflow</h2>
            <p className='section-intro'>
              Designed with developers in mind, these features will transform
              how you debug and understand CSS layouts
            </p>
          </div>
          <div className='feature-grid'>
            <div className='card feature-item'>
              <div className='feature-emoji'>🎨</div>
              <h3>Visual Outlining</h3>
              <p>
                See every HTML element with color-coded outlines at the click of
                a button or with a shortcut.
              </p>
            </div>
            <div className='card feature-item'>
              <div className='feature-emoji'>📦</div>
              <h3>Visualize the Box Model</h3>
              <p>
                Clearly understand margin, border, and padding with visual
                representations around each element.
              </p>
            </div>
            <div className='card feature-item'>
              <div className='feature-emoji'>🔍</div>
              <h3>Element Inspector</h3>
              <p>
                Hover to see tag name, dimensions, and computed box model
                properties in a real-time overlay.
              </p>
            </div>
            <div className='card feature-item'>
              <div className='feature-emoji'>🎛️</div>
              <h3>Customize Outlines</h3>
              <p>
                Tailor the outlines to your preference by easily adjusting their
                size and style via the extension&apos;s intuitive popup menu.
              </p>
            </div>
            <div className='card feature-item'>
              <div className='feature-emoji'>⌨️</div>
              <h3>Toggle with Shortcut</h3>
              <p>
                Instantly enable/disable Border Patrol with a customizable
                keyboard shortcut (<code>Alt</code> + <code>Shift</code> +{' '}
                <code>B</code>).
              </p>
            </div>
            <div className='card feature-item'>
              <div className='feature-emoji'>📸</div>
              <h3>Screenshot Capture</h3>
              <p>
                One-click screenshot capture and download. Perfect for layout
                documentation and feedback sharing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id='in-action' className='section'>
        <div className='container'>
          <div className='section-header'>
            <span className='section-subtitle'>See It In Action</span>
            <h2>Visual CSS Debugging at Its Best</h2>
            <p className='section-intro'>
              Border Patrol makes it easy to visualize and debug your layouts
              with just one click
            </p>
          </div>

          <div className='screenshot-container'>
            <img
              src='/assets/img/border-patrol-demo-picture.png'
              alt='Border Patrol Extension in Action'
              className='screenshot'
              loading='lazy'
            />
          </div>

          <div className='screenshot-caption'>
            <p>
              Border Patrol highlights all HTML elements with color-coded
              borders, making it easy to identify spacing and layout issues.
            </p>
          </div>
        </div>
      </section>

      <section id='benefits' className='section'>
        <div className='container'>
          <div className='section-header'>
            <span className='section-subtitle'>
              Why Developers Love Border Patrol
            </span>
            <h2>Supercharge Your CSS Workflow</h2>
            <p className='section-intro'>
              Experience the difference with powerful features designed to make
              CSS debugging a breeze
            </p>
          </div>

          <div className='benefits-grid'>
            <div className='card benefit-card'>
              <div className='benefit-icon'>🚀</div>
              <h3>Lightning-Fast Debugging</h3>
              <p>
                Pinpoint layout issues in seconds with instant visual feedback,
                reducing debugging time by up to 70%.
              </p>
            </div>
            <div className='card benefit-card'>
              <div className='benefit-icon'>🎯</div>
              <h3>Pixel-Perfect Precision</h3>
              <p>
                Visualize margins, padding, and borders with surgical precision
                for pixel-perfect implementations.
              </p>
            </div>
            <div className='card benefit-card'>
              <div className='benefit-icon'>🤝</div>
              <h3>Seamless Collaboration</h3>
              <p>
                Easily communicate issues with team members using visual
                references everyone can understand.
              </p>
            </div>
            <div className='card benefit-card'>
              <div className='benefit-icon'>⚡</div>
              <h3>Zero Performance Impact</h3>
              <p>
                Lightweight implementation that won&apos;t slow down your
                development workflow or browser performance.
              </p>
            </div>
            <div className='card benefit-card'>
              <div className='benefit-icon'>🔍</div>
              <h3>Deep Element Insights</h3>
              <p>
                Quickly identify nested elements and understand complex
                component hierarchies at a glance.
              </p>
            </div>
            <div className='card benefit-card'>
              <div className='benefit-icon'>🎨</div>
              <h3>Customizable Visuals</h3>
              <p>
                Tailor the visualization to match your workflow with
                customizable colors and display options.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id='call-to-action' className='cta-section'>
        <div className='container'>
          <h2>Ready to Experience Effortless CSS Debugging?</h2>
          <p>
            Add Border Patrol to Chrome today and revolutionize the way you work
            with CSS.
          </p>
          <a
            href='https://chromewebstore.google.com/detail/fdkdknepjdabfaihhdljlbbcjiahmkkd?utm_source=item-share-cb'
            className='button primary-button large-button'
            target='_blank'
            rel='noopener noreferrer'
          >
            Get Border Patrol - It&apos;s Free
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
