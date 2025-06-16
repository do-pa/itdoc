import type { ReactNode } from "react"
import clsx from "clsx"
import Heading from "@theme/Heading"
import Translate from "@docusaurus/Translate"
import styles from "./styles.module.css"

type FeatureItem = {
    title: string
    image: string
    description: ReactNode
}

const FeatureList: FeatureItem[] = [
    {
        title: "Problem without itdoc",
        image: require("@site/static/img/index1.png").default,
        description: (
            <Translate id="homepage.features.easy.description">
We always make tests and then we make documents again. This process is very cumbersome and causes developers to make mistakes.            </Translate>
        ),
    },
    {
        title: "Automate test-based document",
        image: require("@site/static/img/index2.png").default,
        description: (
            <Translate id="homepage.features.focus.description"> 
However, itdoc makes it easy to create a test-based document when you create a test.
            </Translate>
        ),
    },
    {
        title: "For JS and TS",
        image: require("@site/static/img/index3.png").default,
        description: (
            <Translate id="homepage.features.jsts.description">
                itdoc is a tool for creating tests focused on JavaScript and TypeScript API testing.
            </Translate>
        ),
    },
]

function Feature({ title, image, description }: FeatureItem): React.ReactElement {
    return (
        <div className={clsx("col col--4")}>
            <div className="text--center">
                <img src={image} className={styles.featureSvg} alt={title} />
            </div>
            <div className="text--center padding-horiz--md">
                <Heading as="h3">{title}</Heading>
                <div>{description}</div>
            </div>
        </div>
    )
}

export default function HomepageFeatures(): React.ReactElement {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    )
}
