import { Link } from "gatsby";
import React from "react";
import styled from "styled-components";
import { Heading, Section, Text } from "../../../..";
import { HomeQuery } from "graphql-types";

type Data = HomeQuery["articles"];
type Props = { data: Data };

const Article = styled.article``;

export function Articles({ data }: Props) {
  return (
    <Section wide>
      <Heading level="h2">Articles</Heading>
      {data.nodes.map(node => {
        return (
          <Article key={node.frontmatter?.slug}>
            <Heading level="h5">
              <Link to={`/articles/${node.frontmatter?.slug}`}>
                {node.frontmatter?.title}
              </Link>
            </Heading>
            <Text>{node.excerpt}</Text>
            <Link to={`/articles/${node.frontmatter?.slug}`}>Read more…</Link>
          </Article>
        );
      })}
    </Section>
  );
}
