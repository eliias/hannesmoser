import React from "react";

import { Byline, Heading, Layout, Section, SEO } from "../..";

// @ts-ignore
export function Experiments() {
  return (
    <Layout>
      <SEO title="Experiments" />
      <Section>
        <Heading level="h1">
          Experiments
          <Byline>Learn & Play.</Byline>
        </Heading>
      </Section>
    </Layout>
  );
}
