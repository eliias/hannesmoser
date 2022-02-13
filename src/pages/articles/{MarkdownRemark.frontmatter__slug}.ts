import React from "react";
import { graphql } from "gatsby";
import { defineCustomElements as deckDeckGoHighlightElement } from "@deckdeckgo/highlight-code/dist/loader";
import { Article } from "components/pages";

// highlight source code
deckDeckGoHighlightElement().catch(e => console.error(e));

export default Article;

const pageQuery = graphql`
  query Article($id: String!) {
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

export { pageQuery };
