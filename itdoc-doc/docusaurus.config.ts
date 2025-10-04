import { themes as prismThemes } from "prism-react-renderer"
import type { Config } from "@docusaurus/types"
import type * as Preset from "@docusaurus/preset-classic"
import fs from "fs"
import path from "path"
import os from "os"
import { execFileSync } from "child_process"

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
        function webcontainerAliasPlugin() {
            return {
                name: "webcontainer-alias",
                configureWebpack(_config, isServer) {
                    if (!isServer) {
                        return {}
                    }

                    return {
                        resolve: {
                            alias: {
                                "@webcontainer/api":
                                    "@site/src/components/Playground/webcontainerStub",
                            },
                        },
                    }
                },
            }
        },
        function webcontainerLocalItdocPlugin() {
            return {
                name: "webcontainer-local-itdoc",
                async loadContent() {
                    const repoRoot = path.resolve(__dirname, "..")
                    const staticDir = path.resolve(__dirname, "static", "playground")
                    const targetTarball = path.join(staticDir, "itdoc.tgz")
                    const buildDir = path.join(repoRoot, "build")

                    fs.mkdirSync(staticDir, { recursive: true })

                    const forceRepack = process.env.ITDOC_PLAYGROUND_FORCE_REPACK === "true"
                    const shouldRepack =
                        forceRepack ||
                        !fs.existsSync(targetTarball) ||
                        !fs.existsSync(buildDir) ||
                        fs.statSync(buildDir).mtimeMs > fs.statSync(targetTarball).mtimeMs

                    if (!shouldRepack) {
                        return
                    }

                    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "itdoc-pack-"))
                    try {
                        console.log(
                            "[webcontainer-local-itdoc] Rebuilding itdoc package for playground...",
                        )
                        execFileSync("pnpm", ["run", "build"], {
                            cwd: repoRoot,
                            stdio: "inherit",
                        })
                        const packOutput = execFileSync(
                            "pnpm",
                            ["pack", "--pack-destination", tempDir],
                            {
                                cwd: repoRoot,
                                stdio: "pipe",
                            },
                        )
                        const packResult = packOutput.toString().trim().split("\n")
                        const tarballName = packResult.pop()?.trim()
                        if (!tarballName) {
                            throw new Error(
                                "Unable to determine tarball name from pnpm pack output",
                            )
                        }
                        const tarballPath = path.isAbsolute(tarballName)
                            ? tarballName
                            : path.join(tempDir, tarballName)
                        fs.copyFileSync(tarballPath, targetTarball)
                        console.log(
                            "[webcontainer-local-itdoc] Packaged",
                            tarballName,
                            "→",
                            targetTarball,
                        )
                    } finally {
                        fs.rmSync(tempDir, { recursive: true, force: true })
                    }
                },
            }
        },
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
        image: "img/logo.png",
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
                { to: "/playground", label: "Playground", position: "left" },
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
