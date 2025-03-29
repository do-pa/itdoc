import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  image: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    image: require('@site/static/img/a.png').default,
    description: <>itdoc은 API 테스트를 매우 쉽게 만들어줍니다.</>,
  },
  {
    title: 'Focus on What Matters',
    image: require('@site/static/img/b.png').default,
    description: (
      <>
        사실 API 테스트란 만들기도 귀찮고 문서화시키기도 어렵죠. 이를 itdoc을 통한다면 테스트를 만들 뿐만 아니라 문서도 쉽게 만들 수 있습니다.
      </>
    ),
  },
  {
    title: 'About JS and TS',
    image: require('@site/static/img/c.png').default,
    description: <>itdoc은 자바스크립트와 타입스크립트 테스트 생태계에 큰 변화를 줄 것입니다.</>,
  },
];

function Feature({ title, image, description }: FeatureItem): JSX.Element {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={image} className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <div>{description}</div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
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
  );
}
