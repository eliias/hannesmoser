import React, { ReactNode } from "react";

import "../styles/index.css";
import styled from "styled-components";
import { Section } from "../section";

type Props = {
  children: ReactNode;
};

export const Container = styled.main``;

export const Layout = ({ children }: Props) => {
  return (
    <Container>
      {children}
      <Section>
        <footer>Built with ♥️ – Hannes Moser {new Date().getFullYear()}</footer>
      </Section>
    </Container>
  );
};
