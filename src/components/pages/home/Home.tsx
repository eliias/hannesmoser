import React from "react";
import { Link, PageProps } from "gatsby";
import { HomeLatestArticlesQuery } from "graphql-types";

import {
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

import { Articles, BooksAndPapers } from "./components";

import logoShopify from "../../../images/logos/shopify.svg";

type Props = PageProps<HomeLatestArticlesQuery>;

export function Home({ data }: Props) {
  return (
    <Layout>
      <SEO title="Home" />
      <Section>
        <Heading level="h1">Hi, I am Hannes!</Heading>
        <Heading
          level="h5"
          font="serif"
          weight="light"
          color={theme.colors.muted}
        >
          I am a technical lead, <Mark>software engineer,</Mark> computer
          science and data enthusiast, teacher and constant learner.
        </Heading>
        <Text>
          I have recently worked on the next generation of information retrieval
          systems at <a href="https://shopify.com">Shopify</a>. The team that I
          led created a scalable discovery platform, used by relevance
          engineers, data scientists and data engineers.
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
          The last 20+ years I have built games, platforms, services and teams
          for a multitude of companies such as{" "}
          <a href="https://shopify.com">Shopify</a>,{" "}
          <a href="https://s3.medel.com/pdf/US/Continents-and-Oceans.pdf">
            MED-EL
          </a>
          , <a href="https://www.redbullcontentpool.com/">Red Bull</a> and{" "}
          <a href="https://www.redbullcontentpool.com/">Wiberg</a>. My
          contributions include, but are not limited to, technical decision
          making, applied R&D, mentoring and leading teams.
        </Text>
        <Text>
          I am an adjunct lecturer, teaching undergrad and grad students at the{" "}
          <a href="https://www.fh-salzburg.ac.at/en/">
            University of Applied Sciences Salzburg
          </a>{" "}
          MultiMediaTechnology department. Occasionally you can listen to me,
          when I am <Link to="/talks">speaking</Link> about web development and
          academia at conferences and when I participate in community events
          such as <a href="https://www.game-jam.at/">Hackathons</a>,{" "}
          <a href="https://barcamp-sbg.at/">Barcamps</a> &{" "}
          <a href="https://www.meetup.com/en-AU/salzburgwebdev/">Meetups</a>.
        </Text>
      </Section>
      <Articles data={data.latestArticles} />
      <BooksAndPapers />
      <Section wide>
        <Heading level="h2" align="center">
          Projects
        </Heading>
        <Text color="var(--color-text-muted)" align="center">
          Enjoyable side-hustles and hobby projects.
        </Text>
        <Columns>
          <ul>
            <li>
              <a href="https://spurt.li">Spurt.li</a>
            </li>
            <li>
              <a href="https://dumpsterchef.org">Dumpsterchef</a>
            </li>
            <li>
              <a href="https://neele.cooks">neele.cooks</a>
            </li>
            <li>
              <a href="https://spurt.li">Ace of Mace</a>
            </li>
          </ul>
          <ul>
            <li>
              <a href="https://github.com/eliias/peterpawner">
                peterpawner – A raw chess engine written in Go
              </a>
            </li>
            <li>
              <a href="https://github.com/eliias/rusty">
                rusty – A raw chess engine written in Rust
              </a>
            </li>
            <li>
              <a href="https://chess.conc.at">
                chess – An online real-time chess game
              </a>
            </li>
            <li>
              <a href="https://chess.conc.at">Accessibility Study</a>
            </li>
          </ul>
          <ul>
            <li>
              <a href="https://chess.conc.at">
                Explorations of interesting data-structures and algorithms
              </a>
            </li>
            <li>
              <a href="https://chess.conc.at">Useful SQL snippets</a>
            </li>
            <li>
              <a href="https://chess.conc.at">A small online game</a>
            </li>
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
        Lectures
        <ul>
          <li>Client-side web engineering</li>
        </ul>
      </Section>
      <Section invert>
        <Heading level="h3">Timeline</Heading>
        <section>
          <Text>
            If you care about these things, here you can find my professional
            vitae:
          </Text>
          <Timeline>
            <TimelineItem>
              <ol>
                <li style={{ marginBottom: "5rem" }}>
                  <Heading level="h6">
                    <Logo src={logoShopify} />
                    Senior Production Engineer
                  </Heading>
                  <Text style={{ fontSize: "18px", lineHeight: "26px" }}>
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
                  <Heading level="h6">Senior Developer</Heading>
                  <Text>Shopify identity service.</Text>
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
