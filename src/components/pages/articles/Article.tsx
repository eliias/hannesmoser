import React from "react";
import styled from "styled-components";
import { defineCustomElements as deckDeckGoHighlightElement } from "@deckdeckgo/highlight-code/dist/loader";
import { ArticleQuery } from "graphql-types";
import { PageProps } from "gatsby";
import { Byline, Heading, Layout, Section, SEO } from "components";

// highlight source code
deckDeckGoHighlightElement().catch(e => console.error(e));

const MarkdownText = styled.section`
  p {
    font-family: var(--font-serif);
    margin-bottom: 1.5em;
  }
`;

export function Article({ data }: PageProps<ArticleQuery>) {
  return (
    <Layout>
      <SEO title="Home" />
      <Section>
        <Heading level="h1">
          {data.markdownRemark?.frontmatter?.title ?? "Missing Title"}
          <Byline>{data.markdownRemark?.frontmatter?.date ?? ""}</Byline>
        </Heading>
        <MarkdownText
          dangerouslySetInnerHTML={{ __html: data.markdownRemark?.html ?? "" }}
        />
      </Section>
    </Layout>
  );
}
