import { Link } from "gatsby";
import React from "react";
import styled from "styled-components";

import logo from "../../images/logos/logo.svg";

const StyledNav = styled.nav`
  align-items: stretch;
  background-color: white;
  box-shadow: rgba(1, 1, 1, 0.1) 0 0 30px 0;
  border-top: 4px solid var(--color-highlight-detail);
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  position: fixed;
  width: 100vw;
  z-index: 10000;

  section {
    display: flex;

    :first-child {
      img {
        height: 1em;
      }
    }

    a {
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      border-bottom: 2px solid white;
      color: var(--color-primary);
      display: flex;
      background-color: white;
      flex-grow: 1;
      padding: 0.7em 2em;
      text-decoration: none;
      font-size: 0.8em;

      transition: border-bottom-color 0.25s ease-out;

      &:hover {
        border-bottom-color: var(--color-highlight);
      }

      &.active {
        border-bottom-color: var(--color-highlight);
        border-bottom-width: 1px;
        color: var(--color-highlight-detail);
      }
    }
  }
`;

export function Quicknav() {
  return (
    <StyledNav>
      <section>
        <Link to="/">
          <img src={logo} alt="Hannes Moser" />
        </Link>
        <Link activeClassName="active" to="/articles">
          Articles
        </Link>
        <Link activeClassName="active" to="/experiments">
          Experiments
        </Link>
        <Link activeClassName="active" to="/journal">
          Journal
        </Link>
        <Link activeClassName="active" to="/lectures">
          Lectures
        </Link>
        <Link activeClassName="active" to="/projects">
          Projects
        </Link>
        <Link activeClassName="active" to="/talks">
          Talks
        </Link>
      </section>
    </StyledNav>
  );
}
