import React, { PropsWithChildren } from "react";
import styled from "styled-components";

import { theme } from "../theme";

import { Byline } from "./Byline";

type Level = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type Font = "sans-serif" | "serif" | "mono";
type Weight = "light" | "normal" | "bold";

type Props = PropsWithChildren<{
  align?: "left" | "center" | "right";
  color?: string;
  font?: Font;
  weight?: Weight;
  level: Level;
}>;

type InnerProps = Omit<Props, "level">;

const levels: Level[] = ["h1", "h2", "h3", "h4", "h5", "h6"];
const fontVariables = new Map([
  ["sans-serif", "--font-sans-serif"],
  ["serif", "--font-serif"],
  ["mono", "--font-mono"],
]);
const fontWeight = new Map([
  ["light", "--font-weight-light"],
  ["normal", "--font-weight-normal"],
  ["bold", "--font-weight-bold"],
]);

const heading = new Map(
  levels.map((element, index) => {
    const Component = styled(element)<InnerProps>`
      color: ${({ color }) => color};
      font-family: var(
        ${({ font }) => fontVariables.get(font || "sans-serif")}
      );
      font-weight: var(${({ weight }) => fontWeight.get(weight || "bold")});
      font-size: ${theme.sizes[index]}rem;
      letter-spacing: -${index > 3 ? theme.sizes[index] * 0.015 : -0.015}rem;
      line-height: ${theme.sizes[index] * 1.2}rem;
      margin-top: 0;
      margin-bottom: ${2}rem;
      position: relative;
      text-align: ${({ align }) => (align ? align : "left")};

      > ${Byline} {
        font-size: ${theme.sizes[index] / 3}rem;
        line-height: ${theme.sizes[index]}rem;
        margin: -${3.4 - index}rem 0 0 0;
      }
    `;
    return [element, Component];
  }),
);

export function Heading({ level, ...props }: Props) {
  const Component = heading.get(level);
  return Component ? <Component {...props} /> : null;
}
