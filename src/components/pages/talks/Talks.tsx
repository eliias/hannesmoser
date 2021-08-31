import React from "react";

import { Byline, Heading, Layout, Section, SEO } from "../..";

// @ts-ignore
export function Talks() {
  return (
    <Layout>
      <SEO title="Talks" />
      <Section>
        <Heading level="h1">
          Talks
          <Byline>One thing, two things.</Byline>
        </Heading>
      </Section>
    </Layout>
  );
}
