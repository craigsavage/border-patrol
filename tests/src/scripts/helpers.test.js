import { isRestrictedUrl } from '../../../src/scripts/helpers.js';

describe('isRestrictedUrl', () => {
  it('should return true for restricted URLs', () => {
    const restrictedUrls = [
      'chrome://extensions',
      'chrome-extension://abcdefg',
      'about:blank',
      'edge://settings',
      'edge-extension://abcdefg',
      'moz-extension://abcdefg',
      'https://chrome.google.com/webstore/detail/some-extension-id',
      'https://chromewebstore.google.com/detail/some-extension-id',
      'https://addons.mozilla.org/en-US/firefox/addon/some-extension-id/',
    ];

    restrictedUrls.forEach(url => {
      expect(isRestrictedUrl(url)).toBe(true);
    });
  });
});
