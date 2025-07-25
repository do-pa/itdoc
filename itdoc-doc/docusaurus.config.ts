import { themes as prismThemes } from "prism-react-renderer"
import type { Config } from "@docusaurus/types"
import type * as Preset from "@docusaurus/preset-classic"

const config: Config = {
    title: "itdoc documentation",
    tagline: "Reliable API documentation, automatically generated from your tests",
    favicon: "img/favicon.ico",
    url: "https://itdoc.kr",
    baseUrl: "/",
    organizationName: "do-pa",
    projectName: "itdoc",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    i18n: {
        defaultLocale: "en",
        locales: ["ko", "en"],
        localeConfigs: {
            ko: {
                htmlLang: "ko-KR",
            },
            en: {
                htmlLang: "en-US",
            },
        },
    },
    plugins: [
        [
            "@docusaurus/plugin-google-gtag",
            {
                trackingID: "G-VJW3NW4CYJ",
                anonymizeIP: true,
            },
        ],
    ],
    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    editUrl: "https://github.com/do-pa/itdoc/tree/main/itdoc-doc",
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ["rss", "atom"],
                        xslt: true,
                    },
                    editUrl: "https://github.com/do-pa/itdoc/tree/main/itdoc-doc",
                    onInlineTags: "warn",
                    onInlineAuthors: "warn",
                    onUntruncatedBlogPosts: "warn",
                },
                theme: {
                    customCss: "./src/css/custom.css",
                },
            } satisfies Preset.Options,
        ],
    ],
    themeConfig: {
        image: "img/logo.jpg",
        navbar: {
            title: "itdoc",
            logo: {
                alt: "itdoc Logo",
                src: "img/logo.png",
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "tutorialSidebar",
                    position: "left",
                    label: "Docs",
                },
                { to: "/blog", label: "Blog", position: "left" },
                {
                    href: "https://github.com/do-pa/itdoc",
                    label: "GitHub",
                    position: "right",
                },
                {
                    type: "localeDropdown",
                    position: "right",
                },
            ],
        },
        footer: {
            style: "dark",
            links: [
                {
                    title: "Community",
                    items: [
                        {
                            label: "Discord",
                            href: "https://discord.gg/ZhXk7VSu5Z",
                        },
                        {
                            label: "Blog",
                            to: "/blog",
                        },
                        {
                            label: "GitHub",
                            href: "https://github.com/do-pa/itdoc",
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} itdoc.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
}

export default config
