import React from "react";
import { graphql, Link, useStaticQuery } from "gatsby";
import { HomeQuery } from "graphql-types";

import {
  Byline,
  Columns,
  Heading,
  Layout,
  Logo,
  Mark,
  Section,
  SEO,
  Text,
  Timeline,
  TimelineItem,
  theme,
} from "../..";

// @ts-ignore
import logoShopify from "../../../images/logos/shopify.svg";

import { Articles } from "./components";

const query = graphql`
  query Home {
    articles: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      limit: 1
    ) {
      nodes {
        frontmatter {
          title
          slug
        }
        excerpt(format: PLAIN)
      }
    }
  }
`;

export function Home() {
  const data = useStaticQuery<HomeQuery>(query);

  return (
    <Layout>
      <SEO title="Home" />
      <Section>
        <Heading level="h1">
          Hello there,
          <Byline>my name is Hannes.</Byline>
        </Heading>
        <Heading
          level="h5"
          font="serif"
          weight="light"
          color={theme.colors.muted}
        >
          I am an engineering manager, <Mark>software engineer,</Mark> computer
          science and data enthusiast, speaker, teacher and constant learner.
        </Heading>
        <Text>
          Currently I am working on the next generation of information retrieval
          systems and discovery experiences at{" "}
          <a href="https://shopify.com">Shopify</a>. Me and my team are building
          a scalable stateful streaming system used for relevance engineering
          and embarrassingly parallel data processing.
        </Text>
        <Text>
          My <a href="https://neele.codes">partner</a> and I, spend our free
          time <a href="https://www.strava.com/athletes/20638565">running</a>,{" "}
          <a href="https://github.com/spurtli/foodies">cooking</a>, learning new
          things like{" "}
          <a href="https://www.datacamp.com/">
            data science & machine learning
          </a>{" "}
          and{" "}
          <a href="https://github.com/spurtli/mech">
            building mechanical keyboards
          </a>
          . Together, we have built <a href="https://spurtli.com">Spurtli</a>, a
          social hub for athletes, and organized the UX and web development
          conference <a href="https://conc.at">.concat()</a>.
        </Text>
        <Text>
          For the last 20+ years I have built products and teams for a multitude
          of companies such as{" "}
          <a href="https://s3.medel.com/pdf/US/Continents-and-Oceans.pdf">
            MED-EL
          </a>
          , <a href="https://www.redbullcontentpool.com/">Red Bull</a> and{" "}
          <a href="https://www.redbullcontentpool.com/">Wiberg</a>. My
          contributions include, but are not limited to, technical decision
          making, R&D, mentoring and leading teams.
        </Text>
        <Text>
          I am an adjunct lecturer, teaching undergrad and grad students at the{" "}
          <a href="https://www.fh-salzburg.ac.at/en/">
            University of Applied Sciences Salzburg
          </a>{" "}
          computer science department. Occasionally you can listen to me, when{" "}
          <Link to="/talks">speaking</Link> about web development and academia
          at conferences and when I participate in community events such as
          Hackathons, Barcamps & Meetups.
        </Text>
      </Section>
      <Articles data={data.articles} />
      <Section wide>
        <Heading level="h2" align="center">
          Books & Papers
        </Heading>
        <Text color="var(--color-text-muted)" align="center">
          A personal selection of recently read books and scientific papers.
        </Text>
        <Columns>
          <ul>
            <li>The Imposter Handbook</li>
            <li>Book B</li>
          </ul>
          <ul>
            <li>Book A</li>
            <li>Book B</li>
          </ul>
          <ul>
            <li>Book A</li>
            <li>Book B</li>
          </ul>
        </Columns>
        <Section>
          <Text>
            You might ask yourself, is Hannes one of the superficial hipsters
            that tries to impress with how well read he is?{" "}
            <b>Fair question!</b>
          </Text>
          <Text>
            My answer would be that I maintain this list strictly to keep myself
            accountable to not buy even more books but stay focused on the
            topics I have planned to dive into. Over the years, I have also
            figured out that I learn in a very visual way. Even if you consider
            a book not as the classical visual medium, I often tend to recall
            and connect information based on the layout of text, code snippets
            and illustrations. That said, I probably should also add a category
            of very helpful Youtube videos I have watched over time.
          </Text>
          <Text>
            My role model is{" "}
            <a href="https://blog.acolyer.org/about/">Adrian Colyer</a> and the
            mailing list he operates:{" "}
            <a href="https://blog.acolyer.org/">The Morning Paper</a>. If you
            haven't heard about him and the mailing list, you should definitely
            subscribe and give it a try.
          </Text>
        </Section>
      </Section>
      <Section wide>
        <Heading level="h2" align="center">
          Projects
        </Heading>
        <Text color="var(--color-text-muted)" align="center">
          A personal selection of recently read books and scientific papers.
        </Text>
        <Columns>
          <ul>
            <li>Book A</li>
            <li>Book B</li>
          </ul>
          <ul>
            <li>Book A</li>
            <li>Book B</li>
          </ul>
          <ul>
            <li>Book A</li>
            <li>Book B</li>
          </ul>
        </Columns>
      </Section>
      <Section>
        Recent professional work:
        <ul>
          <li>Go and concurrent programing</li>
          <li>Kotlin and the JVM ecosystem</li>
          <li>Ruby & Rails</li>
          <li>JavaScript Ecosystem: React, TypeScript, Webpack & friends</li>
          <li>Kubernetes & Docker</li>
          <li>Observability</li>
          <li>Apache Beam & Google Dataflow</li>
          <li>Streaming systems</li>
          <li>Implementation of relational database systems</li>
          <li>Realtime analytics</li>
          <li>Search relevance</li>
        </ul>
        Interests:
        <ul>
          <li>Word (vector) embeddings</li>
          <li>Transformer models</li>
          <li>Named-entity recognition</li>
          <li>Natural language processing</li>
          <li>Compiler construction & language design</li>
          <li>Learn and apply machine learning methods to a real problem</li>
          <li>Advanced algorithms & datastructures</li>
          <li>Design & architecture of applications</li>
          <li>Kubernetes & Docker</li>
          <li>Crafting</li>
          <li>Chess computer</li>
          <li>Test-driven development</li>
          <li>Functional programing</li>
        </ul>
        Things I wanna learn:
        <ul>
          <li>Learn C++</li>
          <li>Rust</li>
          <li>Lisp/Haskell/Erlang,Elixir/Elm</li>
        </ul>
      </Section>
      <Section>
        Recent books:
        <ul>
          <li>Go compiler</li>
          <li>Relevant search</li>
          <li>Imposter handbook</li>
        </ul>
        All time favorite books:
        <ul>
          <li>Dragon book</li>
        </ul>
      </Section>
      <Section>
        Side hustle and projects
        <ul>
          <li>Spurtli App</li>
          <li>LASER keyboard</li>
        </ul>
        Hall of fame
        <ul>
          <li>Spurtli</li>
          <li>Ace of Mace</li>
          <li>Dumpsterchef</li>
          <li>cnuddl</li>
          <li>dovigo</li>
        </ul>
      </Section>
      <Section>
        Recent lectures
        <ul>
          <li>Client-side web engineering</li>
        </ul>
        Previous lectures
        <ul>
          <li>…</li>
        </ul>
      </Section>
      <Section>
        Talks & slides
        <ul>
          <li>…</li>
        </ul>
      </Section>
      <Section invert>
        <Heading level="h3" color="white">
          Timeline
        </Heading>
        <section>
          <Text color="white">
            If you care about these things, here you can find my professional
            vitae:
          </Text>
          <Timeline>
            <TimelineItem>
              <ol>
                <li style={{ marginBottom: "5rem" }}>
                  <Heading level="h6" color="white">
                    <Logo src={logoShopify} />
                    Senior Production Engineer
                  </Heading>
                  <Text
                    color="white"
                    style={{ fontSize: "18px", lineHeight: "26px" }}
                  >
                    Spearheaded Shopify’s efforts in the field of Search
                    Relevance across multiple applications (Storefront,
                    Back-office). Help building the next generation of scalable
                    and world-class solutions for Wayfinding with a great team
                    of software and relevance engineers, data scientists, UX
                    specialists and production engineers.
                  </Text>
                  <footer>
                    <a href="#">Signal modeling</a>, <a href="#">Taxonomies</a>,{" "}
                    <a href="#">Reinforcement learning</a>,{" "}
                    <a href="#">Knowledge graphs</a>
                  </footer>
                </li>
                <li>
                  <Heading level="h6" color="white">
                    Senior Developer
                  </Heading>
                  <Text color="white">Shopify identity service.</Text>
                  <footer>
                    <a href="#">Authentication</a>
                  </footer>
                </li>
              </ol>
            </TimelineItem>
            <TimelineItem>
              <Logo src={logoShopify} />
              <ol>
                <li>
                  <h3>Senior Lecturer</h3>
                  <Text>
                    I teach undergraduate and graduate courses at the department
                    of web development & engineering at University of Applied
                    Sciences Salzburg. Additionally to teaching, I helped
                    develop the latest curriculum (MSc) and also organize events
                    and meetups for students and the local dev community.
                  </Text>
                  <footer>
                    <a href="#">Academia</a>
                  </footer>
                </li>
              </ol>
            </TimelineItem>
            <TimelineItem>
              <Logo src={logoShopify} />
              <ol>
                <li>
                  <h3>Founder, Software Engineer</h3>
                  <Text>
                    I teach undergraduate and graduate courses at the department
                    of web development & engineering at University of Applied
                    Sciences Salzburg. Additionally to teaching, I helped
                    develop the latest curriculum (MSc) and also organize events
                    and meetups for students and the local dev community.
                  </Text>
                  <footer>
                    <a href="#">Business</a>
                  </footer>
                </li>
              </ol>
            </TimelineItem>
          </Timeline>
        </section>
      </Section>
    </Layout>
  );
}
