const { description } = require('../../package');

module.exports = {
  base: '/rolly/',
  title: 'rolly.js',
  description,
  head: [
    // ['link', { rel: 'icon', href: `/logo.png` }],
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    ['meta', { name: 'theme-color', content: '#384cff' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    [
      'meta',
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
    ],
    [
      'link',
      { rel: 'apple-touch-icon', href: `/icons/apple-touch-icon-152x152.png` },
    ],
    [
      'link',
      {
        rel: 'mask-icon',
        href: '/icons/safari-pinned-tab.svg',
        color: '#384cff',
      },
    ],
    [
      'meta',
      {
        name: 'msapplication-TileImage',
        content: '/icons/msapplication-icon-144x144.png',
      },
    ],
    ['meta', { name: 'msapplication-TileColor', content: '#000000' }],
  ],
  serviceWorker: true,
  configureWebpack: {
    resolve: {
      alias: {
        '@demos': '../demos/',
      },
    },
  },
  // theme: 'vue',
  themeConfig: {
    repo: 'mickaelchanrion/rolly',
    editLinks: false,
    docsDir: 'docs',
    // #697 Provided by the official algolia team.
    //   algolia: {
    //     apiKey: '3a539aab83105f01761a137c61004d85',
    //     indexName: 'vuepress'
    //   },
    locales: {
      '/': {
        label: 'English',
        title: 'rolly.js',
        description,
        selectText: 'Languages',
        editLinkText: 'Edit this page on GitHub',
        lastUpdated: 'Last Updated',
        serviceWorker: {
          updatePopup: {
            message: 'New content is available!',
            buttonText: 'Refresh',
          },
        },
        nav: [
          {
            text: 'Guide',
            link: '/guide/',
          },
          {
            text: 'API reference',
            link: '/api/',
          },
          {
            text: 'Demo',
            link: 'https://rolly.maj.digital',
          },
          {
            text: 'Examples',
            link: 'https://codepen.io/collection/AyEJzY/',
          },
          {
            text: 'Changelog',
            link:
              'https://github.com/mickaelchanrion/rolly/releases',
          },
        ],
      },
    },
  },
};
