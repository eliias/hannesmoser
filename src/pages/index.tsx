import { Home } from "components/pages";
import { graphql } from "gatsby";

export default Home;

export const pageQuery = graphql`
  query HomeLatestArticles {
    latestArticles: allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { fileAbsolutePath: { regex: "/(articles)/" } }
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
