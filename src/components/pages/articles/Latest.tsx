import { LatestArticlesQuery } from "graphql-types";
import React from "react";
import { graphql, Link, useStaticQuery } from "gatsby";
import styled from "styled-components";

import { Byline, Heading, Layout, Section, SEO } from "../..";

const query = graphql`
  query LatestArticles {
    latestArticles: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      limit: 10
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

const Article = styled.article``;

// @ts-ignore
export function Latest() {
  const data = useStaticQuery<LatestArticlesQuery>(query);

  return (
    <Layout>
      <SEO title="Home" />
      <Section>
        <Heading level="h1">Articles</Heading>
        {data.latestArticles.nodes.map(article => (
          <article>
            <Heading level="h2">{article.frontmatter?.title}</Heading>
            <p>{article.excerpt}</p>
            <Link to={article.frontmatter?.slug!}>Read more…</Link>
          </article>
        ))}
      </Section>
    </Layout>
  );
}
