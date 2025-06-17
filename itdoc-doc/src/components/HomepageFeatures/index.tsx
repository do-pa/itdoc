import type { ReactNode } from "react"
import clsx from "clsx"
import Heading from "@theme/Heading" 
import styles from "./styles.module.css"

import Translate, { translate } from "@docusaurus/Translate"
type FeatureItem = {
    title: string
    image: string
    description: ReactNode
}

const FeatureList: FeatureItem[] = [
    {
        title: translate({ id: "homepage.features.easy.title", message: "Problem without itdoc" }),
        image: require("@site/static/img/index1.png").default,
        description: (
            <Translate id="homepage.features.easy.description">
We always make tests and then we make documents again. This process is very cumbersome and causes developers to make mistakes.            </Translate>
        ),
    },
    {
        title: translate({ id: "homepage.features.focus.title", message: "Automate test-based document" }), 
        image: require("@site/static/img/index2.png").default,
        description: (
            <Translate id="homepage.features.focus.description"> 
However, itdoc makes it easy to create a test-based document when you create a test.
            </Translate>
        ),
    },
    {
        title: translate({ id: "homepage.features.jsts.title", message: "For JS and TS" }),  
        image: require("@site/static/img/index3.png").default,
        description: (
            <Translate id="homepage.features.jsts.description">
                Itdoc is a tool for creating tests focused on JavaScript and TypeScript API testing.
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
