import React, { PropsWithChildren } from "react";
import styled from "styled-components";

type Props = PropsWithChildren<{
  background?: string;
  wide?: boolean;
}>;

type InnerProps = PropsWithChildren<Omit<Props, "invert">>;

const Content = styled.section<InnerProps>`
  margin: 0 auto;
  max-width: ${({ wide }) => (wide ? 960 : 680)}px;
  padding: 10rem 0;
`;

const Wrapper = styled.div<Props>`
  background: ${({ background }) => background};
`;

export function Section({ children, background, ...props }: Props) {
  return (
    <Wrapper background={background}>
      <Content {...props}>{children}</Content>
    </Wrapper>
  );
}
