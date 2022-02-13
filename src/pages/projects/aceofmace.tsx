import React from "react";

import { Box, Columns, Heading, Layout, Section, SEO, Text } from "components";

import videoAceOfMace from "../../videos/aceofmace.mp4";

const AceOfMagePage = () => (
  <Layout>
    <SEO title="Ace of Mace" />
    <Section wide background="#FFD100">
      <Heading level="h1" align="center">
        Ace of Mace
      </Heading>
      <br />
      <Box>
        <video width={"100%"} controls style={{ display: "block" }}>
          <source src={videoAceOfMace} type="video/mp4" />
        </video>
      </Box>
    </Section>
    <Section background="#FFD100">
      <Heading level="h2">Flashbacks</Heading>
      <Text>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged.
      </Text>
      <Text>
        It was popularised in the 1960s with the release of Letraset sheets
        containing Lorem Ipsum passages, and more recently with desktop
        publishing software like Aldus PageMaker including versions of Lorem
        Ipsum.
      </Text>
    </Section>
    <Section wide background="#B60008">
      <Heading color="white" level="h2" align="center">
        Technology
      </Heading>
      <Columns>
        <Text>This aged well.</Text>
        <Text>This aged well.</Text>
        <Text>This aged well.</Text>
      </Columns>
    </Section>
  </Layout>
);

export default AceOfMagePage;
