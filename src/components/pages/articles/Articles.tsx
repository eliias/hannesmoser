import React from "react";
import { graphql } from "gatsby";
import styled from "styled-components";
import { defineCustomElements as deckDeckGoHighlightElement } from "@deckdeckgo/highlight-code/dist/loader";

import { Byline, Heading, Layout, Section, SEO } from "../..";

// highlight source code
deckDeckGoHighlightElement().catch(e => console.error(e));

const MarkdownText = styled.section`
  p {
    font-family: var(--font-serif);
    margin-bottom: 1.5em;
  }
`;

// @ts-ignore
export function Articles({ data }) {
  const { markdownRemark } = data;
  const { frontmatter, html } = markdownRemark;
  return (
    <Layout>
      <SEO title="Home" />
      <Section>
        <Heading level="h1">
          {frontmatter.title}
          <Byline>{frontmatter.date}</Byline>
        </Heading>
        <MarkdownText dangerouslySetInnerHTML={{ __html: html }} />
      </Section>
    </Layout>
  );
}

const query = graphql`
  query ($id: String!) {
    markdownRemark(id: { eq: $id }) {
      html
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
        slug
        title
      }
    }
  }
`;

export { query };
