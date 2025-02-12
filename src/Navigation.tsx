import React from 'react'
import { Link, NavLink, useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestion, faSurprise, faUser, faUserFriends, faReply } from '@fortawesome/free-solid-svg-icons'

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';

import { useGlobalContext, useGlobalDispatch } from 'global/GlobalProvider'
import { ROLES, GlobalActionTypes } from "global/types";
import { useEffect } from "react";

interface INavigation {
}

export function Navigation(props: INavigation) {

  const { globalState } = useGlobalContext();
  const { authUser, isAuthenticated, isDarkMode, variant, bg } = globalState;
  const { nickName, role } = authUser;

  let enumRole: ROLES = role === 'OWNER'
    ? ROLES.OWNER
    : role === 'ADMIN'
      ? ROLES.ADMIN
      : role === 'EDITOR'
        ? ROLES.EDITOR
        : ROLES.VIEWER

  const dispatch = useGlobalDispatch();

  let navigate = useNavigate();

  const otkaciMe = () => {
    dispatch({ type: GlobalActionTypes.UN_AUTHENTICATE })
    localStorage.removeItem('CATEGORIES_STATE');
    navigate('/support-2025/about');
  }

  useEffect(() => {
    // if (isAuthenticated)
    //   navigate('/categories')
  }, [navigate, isAuthenticated])

  return (
    <Navbar expand={"md"} variant={variant} bg={bg} collapseOnSelect className="sticky-top">
      <Container fluid>
        <Navbar.Brand href="#" className="ps-3"><i>Support Knowledge</i></Navbar.Brand>
        <Navbar.Toggle aria-controls={`offcanvasNavbar-expand`} />
        <Navbar.Offcanvas
          id={`offcanvasNavbar-expand`}
          aria-labelledby={`offcanvasNavbarLabel-expand`}
          placement="end"
          className={`text-bg-${bg}`}
        >
          {isDarkMode ? (
            <Offcanvas.Header closeButton closeVariant="white">
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand`}>Support</Offcanvas.Title>
            </Offcanvas.Header>
          ) : (
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id={`offcanvasNavbarLabel-expand`}>Support</Offcanvas.Title>
            </Offcanvas.Header>
          )}

          <Offcanvas.Body>
            <Nav
              className="justify-content-end flex-grow-1 pe-3 d-flex flex-nowrap"
              onSelect={eventKey => {

                switch (eventKey) {
                  case "LIGHT_MODE":
                  case "DARK_MODE":
                    if (document.body.classList.contains('dark')) {
                      document.body.classList.remove('dark')
                      document.body.classList.add('light')
                    }
                    else {
                      document.body.classList.add('dark')
                    }
                    dispatch({ type: eventKey })
                    break;
                }
              }}
            >
              {isAuthenticated &&
                // <NavLink to={`/supporter/0/${encodeURIComponent('Does Firefox support Manifest 3?')}/xyz`} className="nav-link"
                <NavLink to={`/support-2025/supporter/0/${encodeURIComponent('work bater')}/xyz`} className="nav-link"
                  onClick={() => {
                    //closeQuestionForm();
                  }
                  }>
                  <FontAwesomeIcon icon={faSurprise} color='lightblue' />{' '}Supporter <small>(QA)</small>
                </NavLink>
              }
              {isAuthenticated &&
                <NavLink to="/support-2025/categories" className="nav-link">
                  <FontAwesomeIcon icon={faQuestion} color='lightblue' />{' '}Questions
                </NavLink>
              }
              {isAuthenticated &&
                <NavLink to="/support-2025/answers" className="nav-link">
                  <FontAwesomeIcon icon={faReply} color='lightblue' />{' '}Answers
                </NavLink>
              }

              {isAuthenticated && (ROLES.OWNER === enumRole || ROLES.ADMIN === enumRole) &&
                <NavLink to="/support-2025/users" className="nav-link">
                  <FontAwesomeIcon icon={faUserFriends} color='lightblue' />{' '}Users
                </NavLink>
              }

              {isAuthenticated &&
                // <NavLink to={`/supporter/0/${encodeURIComponent('Does Firefox support Manifest 3?')}/xyz`} className="nav-link"
                <NavLink to={`/support-2025/ChatBotPage/0/${encodeURIComponent('work bater')}/xyz`} className="nav-link"
                  onClick={() => {
                    //closeQuestionForm();
                  }
                  }>
                  <FontAwesomeIcon icon={faSurprise} color='lightblue' />{' '}ChatBot
                </NavLink>
              }


              {!isAuthenticated &&
                <NavLink to="/support-2025/about" className="nav-link">
                  About
                </NavLink>
              }

              {/* <NavDropdown
                title={<><FontAwesomeIcon icon={faCog} color='lightblue' />{' '}Settings</>}
                id={`offcanvasNavbarDropdown-expand`}
                menuVariant={variant}
              >
              </NavDropdown> */}

              {!isAuthenticated &&
                <NavLink to="/support-2025/register/fromNavigation/" className="nav-link">
                  Register
                </NavLink>
              }

              {!isAuthenticated &&
                <NavLink to="/support-2025/sign-in" className="nav-link">
                  Sign In
                </NavLink>
              }

              {isAuthenticated &&
                <NavDropdown
                  title={<><FontAwesomeIcon icon={faUser} />{' '}{nickName}</>}
                  id={`offcanvasNavbarDropdown-expand`}
                  menuVariant={variant}
                  align="end"
                >
                  <NavDropdown.Item eventKey="DARK_MODE">
                    Dark mode
                  </NavDropdown.Item>
                  <NavDropdown.Item eventKey="LIGHT_MODE">
                    Light mode
                  </NavDropdown.Item>
                  {/* <Form className="d-flex">
                  <Form.Control
                    type="search"
                    placeholder="Search"
                    className="me-2"
                    aria-label="Search"
                  />
                  <Button variant="outline-success">Search</Button>
                </Form> */}

                  <NavDropdown.Divider />
                  {/* <NavDropdown
                    title={<span style={{ padding: "0px 5px", fontSize: '0.9rem' }}><FontAwesomeIcon icon={faDatabase} />{' '}Local Storage</span>}
                    id={`offcanvasNavbarDropdown-expand2`}
                    menuVariant={variant}
                    align="end"
                  >
                    <NavDropdown.Item href="#" eventKey="STORAGE_DISPLAY">
                      Display
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="#" eventKey="STORAGE_CLEAR">
                      Clear
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="#" eventKey="STORAGE_EXPORT">
                      Export to zip file
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="#" eventKey="STORAGE_IMPORT">
                      Import from zip file
                    </NavDropdown.Item>
                  </NavDropdown> */}

                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/support-2025/export" >
                    Export Database to JSON
                  </NavDropdown.Item>
                  <NavDropdown.Divider />

                  <NavDropdown.Item as={Link} to="/support-2025/health" >
                    Health
                  </NavDropdown.Item>

                  <NavDropdown.Item as={Link} to="/support-2025/about" >
                    About
                  </NavDropdown.Item>

                  <NavDropdown.Divider />

                  <NavDropdown.Item href="#" onClick={otkaciMe}>
                    Sign out
                  </NavDropdown.Item>
                </NavDropdown>
              }
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
}
