import styled from "styled-components";
import { theme } from "../theme";

type Props = {
  align?: "left" | "center" | "right";
  color?: string;
};

export const Text = styled.p<Props>`
  color: ${({ color }) => color};
  font-size: ${theme.baseSize}rem;
  font-family: var(--font-serif);
  line-height: ${theme.baseSize * 1.4}rem;
  margin-bottom: 2rem;
  text-align: ${({ align }) => (align ? align : "left")};
`;
