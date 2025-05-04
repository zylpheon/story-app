function extractPathnameSegments(path) {
  const splitUrl = path.split("/");

  return {
    resource: splitUrl[1] || null,
    id: splitUrl[2] || null,
  };
}

function constructRouteFromSegments(pathSegments) {
  let pathname = "";

  if (pathSegments.resource) {
    pathname = pathname.concat(`/${pathSegments.resource}`);
  }

  if (pathSegments.id) {
    pathname = pathname.concat("/:id");
  }

  return pathname || "/";
}

function getActivePathname() {
  return location.hash.replace("#", "") || "/";
}

function getActiveRouteOld() {
  const pathname = getActivePathname();
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

function parseActivePathname() {
  const pathname = getActivePathname();
  return extractPathnameSegments(pathname);
}

function getRouteOld(pathname) {
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

function parsePathname(pathname) {
  return extractPathnameSegments(pathname);
}

function parseActiveUrlWithParams() {
  const url = getActiveRoute();
  const segments = url.split("/");

  if (segments.length >= 2 && segments[1] === "story" && segments[2]) {
    return {
      route: "/story/:id",
      params: {
        id: segments[2],
      },
    };
  }

  return {
    route: url,
    params: {},
  };
}

function getActiveRoute() {
  const hash = window.location.hash.slice(1);
  return hash ? getRoute(hash) : "/";
}

function getRoute(pathname) {
  return "/" + pathname.split("/").filter(Boolean).join("/");
}

export { getActiveRoute, parseActiveUrlWithParams };
