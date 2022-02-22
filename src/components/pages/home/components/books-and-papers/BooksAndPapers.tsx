import { Byline, Columns, Heading, Section, Text } from "components";
import React from "react";
import styled from "styled-components";

const List = styled.ul`
  li {
    list-style-type: none;

    a {
      color: var(--color-light);
    }
  }
`;

export function BooksAndPapers() {
  return (
    <Section
      wide
      background="linear-gradient(0deg, var(--color-highlight), var(--color-highlight-detail));"
    >
      <Heading level="h2" color="white">
        Books & Papers
        <Byline color="var(--color-light)">
          A personal selection of recently read books and scientific papers.
        </Byline>
      </Heading>
      <Columns>
        <List>
          <li>
            <a href="https://bigmachine.io/products/the-imposters-handbook/">
              The Imposter Handbook
            </a>
          </li>
          <li>
            <a href="https://www.oreilly.com/library/view/streaming-systems/9781491983867/">
              Streaming Systems
            </a>
          </li>
          <li>
            <a href="https://nostarch.com/rust-rustaceans">
              Rust for Rustaceans
            </a>
          </li>
        </List>
        <List>
          <li>
            <a href="https://www.amazon.com/Philosophy-Software-Design-2nd/dp/173210221X/">
              A Philosohpy of Software Design
            </a>
          </li>
          <li>
            <a href="https://www.amazon.com/Whos-1-Science-Rating-Ranking/dp/069116231X">
              Who's #`1 – The Science of Rating and Ranking
            </a>
          </li>
          <li>
            <a href="https://www.amazon.com/Programmers-Introduction-Mathematics-Second/dp/B088N68LTJ/ref=sr_1_1?keywords=a+programmer%27s+introduction+to+mathematics&qid=1645448826&s=books&sprefix=a+programm%2Cstripbooks-intl-ship%2C140&sr=1-1">
              A Programmer's Introduction to Mathematics
            </a>
          </li>
        </List>
        <List>
          <li>
            <a href="https://www.amazon.com/Think-Bayes-Bayesian-Statistics-Python/dp/149208946X/ref=sr_1_1?crid=3Q4EG9ZLYPMB4&keywords=Think+Bayes&qid=1645448858&s=books&sprefix=think+bayes%2Cstripbooks-intl-ship%2C139&sr=1-1">
              Think Bayes
            </a>
          </li>
          <li>
            <a href="https://www.amazon.com/Code-Creative-Medium-Handbook-Computational/dp/0262542048/ref=sr_1_1?crid=1KKARRHQVFSBD&keywords=Code+as+Creative+Medium&qid=1645448885&s=books&sprefix=code+as+creative+medium%2Cstripbooks-intl-ship%2C129&sr=1-1">
              Code as Creative Medium
            </a>
          </li>
          <li>
            <a href="https://www.amazon.com/Engineering-Compiler-Keith-Cooper/dp/012088478X/ref=sr_1_1?keywords=engineering+a+compiler&qid=1645448927&s=books&sprefix=Engineering+a+com%2Cstripbooks-intl-ship%2C143&sr=1-1">
              Engineering a Compiler
            </a>
          </li>
        </List>
      </Columns>
      <Section>
        <Text color="white">
          You might ask yourself, is Hannes one of the superficial hipsters that
          tries to impress with how well read he is? <b>Fair question!</b>
        </Text>
        <Text color="white">
          My answer would be that I maintain this list strictly to keep myself
          accountable to not buy even more books but stay focused on the topics
          I have planned to dive into. Over the years, I have also figured out
          that I learn in a very visual way. Even if you consider a book not as
          the classical visual medium, I often tend to recall and connect
          information based on the layout of text, code snippets and
          illustrations. That said, I probably should also add a category of
          very helpful Youtube videos I have watched over time.
        </Text>
        <Text color="white">
          I got the inspiration for this list from
          <a href="https://blog.acolyer.org/about/">Adrian Colyer</a> and his
          mailing list:{" "}
          <a href="https://blog.acolyer.org/">The Morning Paper</a>.
        </Text>
      </Section>
    </Section>
  );
}
