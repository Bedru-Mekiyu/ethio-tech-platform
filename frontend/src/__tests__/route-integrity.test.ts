import { test, expect } from "vitest";
import fs from "fs";
import path from "path";
import ts from "typescript";

function getSourceFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== "node_modules" && file !== "dist" && file !== "__tests__") {
        getSourceFiles(filePath, fileList);
      }
    } else if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test("All internal links must point to valid routes", () => {
  const appTsxPath = path.join(process.cwd(), "src", "App.tsx");
  const appTsxContent = fs.readFileSync(appTsxPath, "utf-8");
  const sourceFile = ts.createSourceFile("App.tsx", appTsxContent, ts.ScriptTarget.Latest, true);

  const routes: string[] = [];

  function visitRoute(node: ts.Node, basePath: string) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = ts.isJsxElement(node)
        ? node.openingElement.tagName.getText(sourceFile)
        : node.tagName.getText(sourceFile);

      if (tagName === "Route") {
        const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;

        let pathAttr = "";
        let isIndex = false;

        for (const attr of attributes.properties) {
          if (ts.isJsxAttribute(attr)) {
            const name = attr.name.getText(sourceFile);
            if (name === "path" && attr.initializer) {
              if (ts.isStringLiteral(attr.initializer)) {
                pathAttr = attr.initializer.text;
              }
            }
            if (name === "index") {
              isIndex = true;
            }
          }
        }

        let fullPath = basePath;
        if (pathAttr) {
          if (pathAttr.startsWith("/")) {
            fullPath = pathAttr;
          } else {
            fullPath = basePath.endsWith("/") ? basePath + pathAttr : basePath + "/" + pathAttr;
          }
        } else if (isIndex) {
          fullPath = basePath;
        }

        if (pathAttr !== "*" && fullPath !== "") {
          routes.push(fullPath.replace(/\/+/g, "/"));
        }

        if (ts.isJsxElement(node)) {
          node.children.forEach((child) => visitRoute(child, fullPath));
        }
        return;
      }
    }
    ts.forEachChild(node, (child) => visitRoute(child, basePath));
  }

  visitRoute(sourceFile, "/");

  // Deduplicate routes
  const validRoutes = Array.from(new Set(routes));
  console.log("Valid routes parsed:", validRoutes);

  // Now scan all files for Links
  const allFiles = getSourceFiles(path.join(process.cwd(), "src"));
  const brokenLinks: { file: string; link: string }[] = [];

  // Very simple matcher for dynamic routes, e.g. /app/tracks/:trackId matches /app/tracks/123
  function matchesRoute(link: string, route: string) {
    const linkParts = link.split("?")[0].split("#")[0].split("/").filter(Boolean);
    const routeParts = route.split("/").filter(Boolean);

    if (linkParts.length !== routeParts.length) return false;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        continue;
      }
      if (routeParts[i] !== linkParts[i]) {
        return false;
      }
    }
    return true;
  }

  // Links that we manually ignore or validate
  const ignoredPrefixes = ["http://", "https://", "mailto:", "tel:", "#"];

  const usedRoutes = new Set<string>();

  for (const file of allFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const linkRegex = /(?:<Link[^>]+to=|navigate\(\s*|href=|to:\s*)(?:\{?["'`])(.*?)(?:["'`]\}?)[)>}\s,]/g;

    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      let link = match[1].replace(/["']/g, "");

      if (link.includes("${")) {
        link = link.replace(/\$\{[^}]+\}/g, "test-id-123");
      }

      if (ignoredPrefixes.some((p) => link.startsWith(p))) continue;
      if (!link.startsWith("/") && link !== "") continue;
      if (link === "/") {
        usedRoutes.add("/");
        continue;
      }

      const matchedRoute = validRoutes.find((r) => matchesRoute(link, r) || r === link);
      if (!matchedRoute) {
        brokenLinks.push({ file: path.relative(process.cwd(), file), link });
      } else {
        usedRoutes.add(matchedRoute);
      }
    }
  }

  console.log("Broken links found:", brokenLinks);

  const orphanedRoutes = validRoutes.filter(
    (r) => !usedRoutes.has(r) && r !== "/" && r !== "/app" && r !== "/parent" && r !== "/mentor" && r !== "/admin",
  );
  console.log("Orphaned/Unlinked routes found (informational):", orphanedRoutes);

  expect(brokenLinks.length).toBe(0);
});
