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
        title: "Easy to Use",
        image: require("@site/static/img/a.png").default,
        description: (
            <Translate id="homepage.features.easy.description">
                itdoc makes API testing very easy. The interface itself is really simple!
            </Translate>
        ),
    },
    {
        title: "Focus on What Matters",
        image: require("@site/static/img/b.png").default,
        description: (
            <Translate id="homepage.features.focus.description">
                API testing is often tedious to create and difficult to document. With itdoc, you
                can not only create tests but also easily create documentation.
            </Translate>
        ),
    },
    {
        title: "For JS and TS",
        image: require("@site/static/img/c.png").default,
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
