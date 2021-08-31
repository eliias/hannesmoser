import styled from "styled-components";

export const Mark = styled.mark`
  background-color: var(--color-highlight);
  background-image: linear-gradient(45deg, var(--color-highlight), var(--color-highlight-detail));
  box-shadow: -0.15em 0 0 var(--color-highlight), 0.15em 0 0 var(--color-highlight-detail);
  color: white;
`;
