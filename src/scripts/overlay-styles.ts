const OVERLAY_STYLES = `
  :host {
    all: initial;
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none !important;
    z-index: 1000000 !important;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  #bp-margin-box,
  #bp-border-box,
  #bp-padding-box,
  #bp-content-box {
    position: absolute !important;
    pointer-events: none !important;
    display: none;
    z-index: 1000001 !important;
  }

  #bp-inspector-overlay {
    position: absolute !important;
    display: block !important;
    min-width: 220px;
    max-width: 320px;
    padding: 12px;
    border: 1px solid rgba(146, 199, 231, 0.35);
    border-radius: 12px;
    background:
      radial-gradient(circle at top right, rgba(87, 169, 217, 0.18), transparent 34%),
      linear-gradient(180deg, rgba(12, 20, 31, 0.98), rgba(18, 33, 49, 0.96));
    box-shadow:
      0 14px 32px rgba(0, 0, 0, 0.34),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    color: #f2f8fd;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 1.45;
    letter-spacing: normal;
    text-transform: none;
    text-decoration: none;
    text-align: left;
    text-shadow: none;
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
    pointer-events: none !important;
    z-index: 1000002 !important;
    backdrop-filter: blur(6px);
  }

  #bp-inspector-overlay section,
  #bp-inspector-overlay div,
  #bp-inspector-overlay h4,
  #bp-inspector-overlay ul,
  #bp-inspector-overlay li,
  #bp-inspector-overlay footer,
  #bp-inspector-overlay strong,
  #bp-inspector-overlay span {
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    box-shadow: none;
    color: inherit;
    font: inherit;
    letter-spacing: normal;
    text-decoration: none;
    text-transform: none;
  }

  #bp-inspector-overlay section,
  .bp-overlay-header,
  .bp-overlay-meta,
  .bp-overlay-footer {
    display: block;
  }

  .bp-overlay-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  .bp-tag-chip {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 4px 10px;
    border: 1px solid rgba(146, 199, 231, 0.25);
    border-radius: 999px;
    background: rgba(87, 169, 217, 0.12);
    color: #f2f8fd;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .bp-id-value {
    display: inline-flex;
    flex-shrink: 0;
    max-width: 45%;
    color: #92c7e7;
    font-size: 11px;
    font-weight: 600;
  }

  .bp-overlay-meta {
    margin-bottom: 10px;
    padding: 8px 10px;
    border: 1px solid rgba(146, 199, 231, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
  }

  .bp-overlay-meta-line {
    color: #d9eaf7;
  }

  .bp-overlay-meta-line + .bp-overlay-meta-line {
    margin-top: 4px;
  }

  .bp-class-value {
    color: #c5e0f2;
  }

  .bp-element-group {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(242, 248, 253, 0.08);
  }

  .bp-element-group-title {
    margin-bottom: 6px;
    color: #c5e0f2;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .bp-element-group ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .bp-element-group li {
    display: grid;
    grid-template-columns: minmax(72px, auto) 1fr;
    gap: 8px;
    align-items: start;
  }

  .bp-element-group li + li {
    margin-top: 4px;
  }

  .bp-element-label {
    color: #86a7bc;
    font-size: 11px;
  }

  .bp-color-value {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #f2f8fd;
  }

  .bp-color-element-box {
    display: inline-block;
    width: 12px;
    height: 12px;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.28);
    border-radius: 3px;
    vertical-align: middle;
  }

  .bp-overlay-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px dashed rgba(242, 248, 253, 0.2);
    color: #57a9d9;
    font-size: 10px;
  }

  .bp-branding {
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .bp-footer-note {
    color: #86a7bc;
  }
`;

export default OVERLAY_STYLES;
