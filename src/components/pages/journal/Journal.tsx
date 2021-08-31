import React from "react";

import { Byline, Heading, Layout, Section, SEO } from "../..";

// @ts-ignore
export function Journal() {
  return (
    <Layout>
      <SEO title="Journal" />
      <Section>
        <Heading level="h1">
           Journal
          <Byline>Every day good.</Byline>
        </Heading>
      </Section>
    </Layout>
  );
}
