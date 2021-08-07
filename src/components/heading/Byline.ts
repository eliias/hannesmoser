import styled from "styled-components";

type Props = {
  color?: string;
};

function ensureColor(color: string = "black") {
  return color;
}

export const Byline = styled.span<Props>`
  font-weight: normal;
  display: block;
  color: ${({ color }) => ensureColor(color)};
  clear: both;
`;
