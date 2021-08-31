import React from "react";

import { Byline, Heading, Layout, Section, SEO } from "../..";

// @ts-ignore
export function Lectures() {
  return (
    <Layout>
      <SEO title="Lectures" />
      <Section>
        <Heading level="h1">
          Lectures
          <Byline>Under-grad and grad students.</Byline>
        </Heading>
      </Section>
    </Layout>
  );
}
